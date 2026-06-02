import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { LoginForm } from "@/components/auth/login-form";
import { LoginPageToasts } from "@/components/auth/login-page-toasts";
import { MOCK_ADMIN_EMAIL, MOCK_ADMIN_PASSWORD } from "@/lib/mock-users";
import { safeInternalPath } from "@/lib/safe-redirect";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Entrar",
  description: `Entre na sua conta ${SITE_NAME} para acompanhar pedidos e reservas do carrinho de sorvete.`,
};

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function EntrarPage({ searchParams }: PageProps) {
  const { next } = await searchParams;
  const redirectTo = safeInternalPath(next, "/");

  return (
    <AuthPageLayout>
      <Suspense fallback={null}>
        <LoginPageToasts />
      </Suspense>
      {redirectTo !== "/" ? (
        <p
          className={cn(
            "mb-4 rounded-xl border-2 border-primary/15 bg-white px-3 py-2.5 text-center text-sm text-muted-foreground",
          )}
        >
          Após entrar você será redirecionado para{" "}
          <span className="font-semibold text-primary">{redirectTo}</span>
        </p>
      ) : null}
      <LoginForm
        redirectTo={redirectTo !== "/" ? redirectTo : undefined}
        initialEmail={MOCK_ADMIN_EMAIL}
        initialPassword={MOCK_ADMIN_PASSWORD}
      />
    </AuthPageLayout>
  );
}
