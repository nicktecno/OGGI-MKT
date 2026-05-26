import type { AccountStatus } from "@/lib/auth-token";
import { roleDisplayHint, roleDisplayLabel, type Role } from "@/lib/auth-types";
import { cn } from "@/lib/utils";

type Props = {
  email: string;
  name?: string;
  role: Role;
  accountStatus?: AccountStatus;
};

export function PainelSessionBadge({ email, name, role, accountStatus }: Props) {
  const pending = accountStatus === "PENDING_ADMIN_REVIEW";
  const rejected = accountStatus === "REJECTED";

  return (
    <div
      className="mt-5 rounded-lg border border-border/70 bg-background/80 px-3 py-3 shadow-sm ring-1 ring-foreground/[0.04]"
      aria-label={`Sessão: ${roleDisplayLabel(role)}`}
    >
      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Conectado como
      </p>
      <p className="mt-1.5 truncate text-sm font-medium text-foreground">{name?.trim() || email}</p>
      {name?.trim() ? (
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      ) : null}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
            role === "ADMIN" && "border-primary/35 bg-primary/10 text-primary",
            role === "SUPPLIER" && "border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
            role === "EXECUTOR" && "border-violet-500/35 bg-violet-500/10 text-violet-900 dark:text-violet-100",
            role === "CUSTOMER" && "border-border bg-muted/50 text-foreground",
          )}
        >
          {roleDisplayLabel(role)}
        </span>
        {pending ? (
          <span className="text-[0.65rem] font-medium text-amber-700 dark:text-amber-200">
            Em análise
          </span>
        ) : null}
        {rejected ? (
          <span className="text-[0.65rem] font-medium text-destructive">Recusado</span>
        ) : null}
      </div>
      <p className="mt-2 text-[0.7rem] leading-snug text-muted-foreground">{roleDisplayHint(role)}</p>
    </div>
  );
}
