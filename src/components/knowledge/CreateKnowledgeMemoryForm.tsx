"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createKnowledgeMemoryItemAction, type ActionState } from "@/actions/knowledgeMemory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KnowledgeModule } from "@/lib/knowledgeMemory";

export function CreateKnowledgeMemoryForm({
  modules,
  subjects,
  grades,
}: {
  modules: readonly KnowledgeModule[];
  subjects: { id: string; name: string }[];
  grades: { id: string; name: string }[];
}) {
  const t = useTranslations("knowledgeMemory");
  const [state, action, pending] = useActionState<ActionState, FormData>(createKnowledgeMemoryItemAction, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("addNoteTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="module">{t("moduleLabel")}</Label>
            <Select name="module" defaultValue={modules[0]}>
              <SelectTrigger id="module">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modules.map((m) => (
                  <SelectItem key={m} value={m}>
                    {t(`modules.${m}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="subjectId">{t("subjectOptional")}</Label>
              <Select name="subjectId" defaultValue="ANY">
                <SelectTrigger id="subjectId">
                  <SelectValue placeholder={t("anySubject")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANY">{t("anySubject")}</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="gradeId">{t("gradeOptional")}</Label>
              <Select name="gradeId" defaultValue="ANY">
                <SelectTrigger id="gradeId">
                  <SelectValue placeholder={t("anyGrade")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANY">{t("anyGrade")}</SelectItem>
                  {grades.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">{t("noteTitleLabel")}</Label>
            <Input id="title" name="title" required placeholder={t("noteTitlePlaceholder")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="content">{t("noteContentLabel")}</Label>
            <Textarea id="content" name="content" rows={4} required placeholder={t("noteContentPlaceholder")} />
          </div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state?.success && <p className="text-sm text-green-700">{t("noteAdded")}</p>}
          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? t("adding") : t("addNote")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
