import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

/** Card de formulário com faixa rosa Oggi (login, recuperação de senha, etc.). */
export function AuthFormShell({ title, description, children, className }: Props) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border-2 border-primary/20 bg-white shadow-lg ring-1 ring-primary/5",
        className,
      )}
    >
      <div className="border-b-2 border-primary/10 bg-primary px-6 py-5 text-primary-foreground">
        <h1 className="font-heading text-xl font-extrabold uppercase tracking-wide">{title}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-primary-foreground/90">{description}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
