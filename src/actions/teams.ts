"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRoleGroup, getRoleGroup, ForbiddenError } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { createNotification, createNotifications } from "@/lib/notifications";
import { OperationalPlanSaveSchema } from "@/lib/ai/operationalPlanSchema";
import type { TeamType, ActionItemStatus } from "@/generated/prisma/enums";

export type ActionState = { error?: string } | undefined;

const createTeamSchema = z.object({
  name: z.string().min(3),
  type: z.enum(["ACADEMIC", "QUALITY", "INITIATIVE", "ADMINISTRATIVE", "SUPPORT"]),
  goal: z.string().optional(),
});

export async function createTeamAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  await requireRoleGroup(session, "TEAM_CREATOR_ROLES");
  const leaderId = session!.user.id;

  const parsed = createTeamSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    goal: formData.get("goal") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const schoolId = await getActiveSchoolId(session!);
  if (!schoolId) {
    return { error: "No school is associated with this account." };
  }

  const team = await prisma.team.create({
    data: {
      schoolId,
      name: parsed.data.name,
      type: parsed.data.type as TeamType,
      goal: parsed.data.goal,
      leaderId,
      members: { create: { userId: leaderId } },
      operationalPlan: {
        create: {
          level: "TEAM",
          title: `${parsed.data.name} Operational Plan`,
          initialIdea: parsed.data.goal || parsed.data.name,
        },
      },
    },
  });

  await logAudit({
    userId: leaderId,
    action: "CREATE",
    module: "Teams",
    entityId: team.id,
    after: { name: team.name, type: team.type },
  });

  redirect(`/teams/${team.id}`);
}

async function requireTeamLeader(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.leaderId !== userId) {
    throw new ForbiddenError("You are not the leader of this team.");
  }
  return team;
}

const addMemberSchema = z.object({
  teamId: z.string().min(1),
  userId: z.string().min(1),
});

export async function addTeamMemberAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  await requireRoleGroup(session, "TEAM_CREATOR_ROLES");

  const parsed = addMemberSchema.safeParse({
    teamId: formData.get("teamId"),
    userId: formData.get("userId"),
  });
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const team = await requireTeamLeader(parsed.data.teamId, session!.user.id);
  const candidate = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!candidate || candidate.schoolId !== team.schoolId) {
    return { error: "This user does not belong to your school." };
  }

  try {
    await prisma.teamMember.create({ data: { teamId: parsed.data.teamId, userId: parsed.data.userId } });
  } catch {
    return { error: "This user is already a member of the team." };
  }

  await logAudit({
    userId: session!.user.id,
    action: "CREATE",
    module: "TeamMembers",
    entityId: parsed.data.teamId,
    after: { addedUserId: parsed.data.userId },
  });

  if (parsed.data.userId !== session!.user.id) {
    await createNotification({
      userId: parsed.data.userId,
      type: "TEAM_ASSIGNMENT",
      title: `You were added to the team "${team.name}"`,
      link: `/teams/${team.id}`,
    });
  }

  revalidatePath(`/teams/${parsed.data.teamId}`);
  return { error: undefined };
}

const createMeetingSchema = z.object({
  teamId: z.string().min(1),
  title: z.string().min(3),
  date: z.string().min(1),
  agenda: z.string().optional(),
});

export async function createMeetingAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  await requireRoleGroup(session, "TEAM_CREATOR_ROLES");

  const parsed = createMeetingSchema.safeParse({
    teamId: formData.get("teamId"),
    title: formData.get("title"),
    date: formData.get("date"),
    agenda: formData.get("agenda") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await requireTeamLeader(parsed.data.teamId, session!.user.id);

  const meeting = await prisma.meeting.create({
    data: {
      teamId: parsed.data.teamId,
      title: parsed.data.title,
      date: new Date(parsed.data.date),
      agenda: parsed.data.agenda,
      createdById: session!.user.id,
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "CREATE",
    module: "Meetings",
    entityId: meeting.id,
    after: { teamId: parsed.data.teamId, title: parsed.data.title },
  });

  const members = await prisma.teamMember.findMany({ where: { teamId: parsed.data.teamId } });
  const dateLabel = meeting.date.toISOString().slice(0, 10);
  await createNotifications(
    members.map((m) => m.userId).filter((userId) => userId !== session!.user.id),
    {
      type: "MEETING_SCHEDULED",
      title: `Meeting scheduled: "${parsed.data.title}"`,
      body: `${dateLabel}${parsed.data.agenda ? ` — ${parsed.data.agenda}` : ""}`,
      link: `/teams/${parsed.data.teamId}`,
    },
  );

  revalidatePath(`/teams/${parsed.data.teamId}`);
  return { error: undefined };
}

export async function saveMeetingMinutesAction(meetingId: string, minutes: string) {
  const session = await auth();
  await requireRoleGroup(session, "TEAM_CREATOR_ROLES");

  const meeting = await prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
  await requireTeamLeader(meeting.teamId, session!.user.id);

  await prisma.meeting.update({ where: { id: meetingId }, data: { minutes } });

  await logAudit({
    userId: session!.user.id,
    action: "UPDATE",
    module: "Meetings",
    entityId: meetingId,
    before: { minutes: meeting.minutes },
    after: { minutes },
  });

  revalidatePath(`/teams/${meeting.teamId}`);
}

const addActionItemSchema = z.object({
  meetingId: z.string().min(1),
  task: z.string().min(3),
  ownerId: z.string().min(1),
  dueDate: z.string().optional(),
});

export async function addActionItemAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  await requireRoleGroup(session, "TEAM_CREATOR_ROLES");

  const parsed = addActionItemSchema.safeParse({
    meetingId: formData.get("meetingId"),
    task: formData.get("task"),
    ownerId: formData.get("ownerId"),
    dueDate: formData.get("dueDate") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const meeting = await prisma.meeting.findUniqueOrThrow({ where: { id: parsed.data.meetingId } });
  await requireTeamLeader(meeting.teamId, session!.user.id);

  const actionItem = await prisma.actionItem.create({
    data: {
      meetingId: parsed.data.meetingId,
      task: parsed.data.task,
      ownerId: parsed.data.ownerId,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "CREATE",
    module: "ActionItems",
    entityId: actionItem.id,
    after: { meetingId: parsed.data.meetingId, task: parsed.data.task },
  });

  if (parsed.data.ownerId !== session!.user.id) {
    await createNotification({
      userId: parsed.data.ownerId,
      type: "ACTION_ITEM_ASSIGNMENT",
      title: `New task assigned: "${parsed.data.task}"`,
      link: `/teams/${meeting.teamId}`,
    });
  }

  revalidatePath(`/teams/${meeting.teamId}`);
  return { error: undefined };
}

export async function updateActionItemStatusAction(actionItemId: string, status: ActionItemStatus) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const actionItem = await prisma.actionItem.findUniqueOrThrow({
    where: { id: actionItemId },
    include: { meeting: { include: { team: true } } },
  });

  const isOwner = actionItem.ownerId === session.user.id;
  const isTeamLeader = actionItem.meeting.team.leaderId === session.user.id;
  if (!isOwner && !isTeamLeader) {
    throw new ForbiddenError("Only the task owner or team leader can update this.");
  }

  const before = actionItem.status;
  await prisma.actionItem.update({ where: { id: actionItemId }, data: { status } });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    module: "ActionItems",
    entityId: actionItemId,
    before: { status: before },
    after: { status },
  });

  revalidatePath(`/teams/${actionItem.meeting.teamId}`);
}

async function requireOperationalPlanAccess(planId: string, session: Session) {
  const plan = await prisma.operationalPlan.findUnique({ where: { id: planId }, include: { team: true } });
  if (!plan) throw new ForbiddenError("Plan not found.");

  const activeSchoolId = await getActiveSchoolId(session);
  const authorized =
    plan.level === "SCHOOL"
      ? plan.schoolId === activeSchoolId && (await getRoleGroup("MANAGEMENT_ROLES")).includes(session.user.role)
      : plan.team?.leaderId === session.user.id;

  if (!authorized) throw new ForbiddenError("You do not have access to this operational plan.");
  return plan;
}

export async function saveOperationalPlanAction(planId: string, content: unknown): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const plan = await requireOperationalPlanAccess(planId, session);

  const result = OperationalPlanSaveSchema.safeParse(content);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid plan data." };
  }
  const parsed = result.data;

  await prisma.$transaction([
    prisma.operationalPlanItem.deleteMany({ where: { operationalPlanId: planId } }),
    prisma.operationalPlanItem.createMany({
      data: parsed.items.map((item, index) => ({
        operationalPlanId: planId,
        orderIndex: index,
        domain: item.domain,
        objective: item.objective,
        actions: item.actions,
        responsible: item.responsible,
        timeline: item.timeline,
        indicator: item.indicator,
        risk: item.risk,
      })),
    }),
  ]);

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    module: "OperationalPlans",
    entityId: planId,
    after: { itemCount: parsed.items.length },
  });

  revalidatePath(plan.level === "SCHOOL" ? "/operational-plan" : `/teams/${plan.teamId}`);
  return {};
}
