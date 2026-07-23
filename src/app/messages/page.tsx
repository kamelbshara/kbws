import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { ComposeMessageForm } from "@/components/messages/ComposeMessageForm";
import { MessageList } from "@/components/messages/MessageList";
import { AppShell } from "@/components/layout/AppShell";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("messages");
  const { view } = await searchParams;
  const showSent = view === "sent";

  const isManagement = (await getRoleGroup("MANAGEMENT_ROLES")).includes(user.role);
  const schoolId = await getActiveSchoolId(session!);
  if (!schoolId) {
    redirect("/");
  }

  const [recipients, messages] = await Promise.all([
    prisma.user.findMany({
      where: { schoolId, id: { not: user.id }, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.message.findMany({
      where: showSent ? { senderId: user.id } : { recipientId: user.id },
      include: { sender: true, recipient: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
      <AppShell userName={user.name} role={user.role} isManagement={isManagement}>
      <main className="mx-auto grid max-w-4xl grid-cols-1 gap-6 p-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">{t("title")}</h1>
            <div className="flex gap-2 text-sm">
              <a href="/messages" className={!showSent ? "font-medium text-slate-900" : "text-slate-500"}>
                {t("inbox")}
              </a>
              <a href="/messages?view=sent" className={showSent ? "font-medium text-slate-900" : "text-slate-500"}>
                {t("sent")}
              </a>
            </div>
          </div>

          <MessageList
            currentUserId={user.id}
            showSent={showSent}
            messages={messages.map((m) => ({
              id: m.id,
              subject: m.subject,
              body: m.body,
              read: m.read,
              createdAt: m.createdAt.toISOString().slice(0, 16).replace("T", " "),
              counterpartName: showSent ? m.recipient.name : m.sender.name,
            }))}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("composeTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ComposeMessageForm recipients={recipients.map((r) => ({ id: r.id, name: r.name }))} />
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
