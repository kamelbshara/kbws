import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { MainNav } from "@/components/layout/MainNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationalPlanEditor } from "@/components/team/OperationalPlanEditor";
import { CreateMeetingForm } from "@/components/team/CreateMeetingForm";
import { MeetingMinutes } from "@/components/team/MeetingMinutes";
import { AddActionItemForm } from "@/components/team/AddActionItemForm";
import { ActionItemRow } from "@/components/team/ActionItemRow";
import { AddMemberForm } from "@/components/team/AddMemberForm";
import { getRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { TEAM_TYPE_LABELS } from "@/lib/teamLabels";
import type { OperationalPlanGeneration } from "@/lib/ai/operationalPlanSchema";

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session!.user;
  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      leader: true,
      members: { include: { user: true } },
      meetings: {
        include: { actionItems: { include: { owner: true } } },
        orderBy: { date: "desc" },
      },
      operationalPlan: { include: { items: { orderBy: { orderIndex: "asc" } } } },
    },
  });

  const isManagement = (await getRoleGroup("MANAGEMENT_ROLES")).includes(user.role);
  const schoolId = await getActiveSchoolId(session!);
  const isManagementForThisSchool = isManagement && team?.schoolId === schoolId;
  const isMember = team?.members.some((m) => m.userId === user.id);
  if (!team || (!isMember && !isManagementForThisSchool)) {
    notFound();
  }

  const isLeader = team.leaderId === user.id;

  const allUsers = await prisma.user.findMany({ where: { schoolId: team.schoolId }, orderBy: { name: "asc" } });
  const memberIds = new Set(team.members.map((m) => m.userId));
  const candidates = allUsers.filter((u) => !memberIds.has(u.id));

  const planContent: OperationalPlanGeneration | null =
    team.operationalPlan && team.operationalPlan.items.length > 0
      ? {
          items: team.operationalPlan.items.map((i) => ({
            domain: i.domain,
            objective: i.objective,
            actions: i.actions,
            responsible: i.responsible ?? "",
            timeline: i.timeline ?? "",
            indicator: i.indicator ?? "",
            risk: i.risk ?? "",
          })),
        }
      : null;

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <MainNav role={user.role} />
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-xl font-semibold">{team.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {TEAM_TYPE_LABELS[team.type]} · Led by {team.leader.name}
        </p>
        {team.goal && <p className="mt-2 text-sm text-slate-700">{team.goal}</p>}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Meetings</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {isLeader && <CreateMeetingForm teamId={team.id} />}
                <div className="flex flex-col gap-4">
                  {team.meetings.map((meeting) => (
                    <div key={meeting.id} className="rounded-md border border-slate-200 p-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{meeting.title}</h3>
                        <span className="text-xs text-slate-400" dir="ltr">
                          {meeting.date.toISOString().slice(0, 10)}
                        </span>
                      </div>
                      {meeting.agenda && <p className="mt-1 text-sm text-slate-600">{meeting.agenda}</p>}
                      <div className="mt-2">
                        {isLeader ? (
                          <MeetingMinutes meetingId={meeting.id} initialMinutes={meeting.minutes ?? ""} />
                        ) : (
                          meeting.minutes && <p className="text-sm text-slate-600">{meeting.minutes}</p>
                        )}
                      </div>
                      <div className="mt-3 flex flex-col gap-2">
                        {meeting.actionItems.map((ai) => (
                          <ActionItemRow
                            key={ai.id}
                            actionItemId={ai.id}
                            task={ai.task}
                            ownerName={ai.owner.name}
                            dueDate={ai.dueDate ? ai.dueDate.toISOString().slice(0, 10) : null}
                            status={ai.status}
                          />
                        ))}
                      </div>
                      {isLeader && (
                        <div className="mt-2">
                          <AddActionItemForm
                            meetingId={meeting.id}
                            members={team.members.map((m) => ({ id: m.user.id, name: m.user.name }))}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  {team.meetings.length === 0 && <p className="text-sm text-slate-400">No meetings yet.</p>}
                </div>
              </CardContent>
            </Card>

            {team.operationalPlan && (
              <Card>
                <CardHeader>
                  <CardTitle>Team Operational Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <OperationalPlanEditor planId={team.operationalPlan.id} initialContent={planContent} />
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Members ({team.members.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ul className="flex flex-col gap-1 text-sm">
                {team.members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between">
                    <span>{m.user.name}</span>
                    {m.userId === team.leaderId && <span className="text-xs text-slate-400">Leader</span>}
                  </li>
                ))}
              </ul>
              {isLeader && <AddMemberForm teamId={team.id} candidates={candidates} />}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
