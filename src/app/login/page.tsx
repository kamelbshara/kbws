import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default async function LoginPage() {
  const t = await getTranslations("login");

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-brand-navy">
      <div className="absolute inset-0">
        <Image
          src="/cover.png"
          alt=""
          fill
          priority
          className="pointer-events-none object-cover"
        />
        <div className="absolute inset-0 bg-brand-navy/85 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-dark/70 via-transparent to-brand-navy-dark/60" />
      </div>
      <div className="relative z-10 flex flex-1 items-center justify-center p-4 md:justify-start md:ps-16 lg:ps-28">
        <div className="flex flex-col items-center gap-6">
          <Image
            src="/logo.png"
            alt=""
            width={120}
            height={120}
            priority
            className="h-[120px] w-[120px] drop-shadow-md"
          />
          <Card className="w-full max-w-sm border-brand-gold/40 bg-white/95 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-brand-navy">{t("title")}</CardTitle>
                <LocaleSwitcher />
              </div>
              <CardDescription>{t("subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="relative z-10">
        <PublicFooter />
      </div>
    </div>
  );
}
