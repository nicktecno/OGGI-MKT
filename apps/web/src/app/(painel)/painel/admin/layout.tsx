import type { Metadata } from "next";
import { commerceUsesDatabase } from "@/lib/demo-runtime";

export const metadata: Metadata = {
  title: "Administração",
};

export default function AdminPainelLayout({ children }: { children: React.ReactNode }) {
  const persistenceCopy = commerceUsesDatabase()
    ? "As alterações são guardadas no banco de dados pela API do servidor — o mesmo fluxo de produção."
    : "No modo demonstração sem API, as alterações ficam só neste navegador até você limpar os dados do site. Com a API e o banco ligados no deploy, tudo passa a ser persistido no servidor.";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Área da administração</h1>
        <p className="mt-2 max-w-2xl text-pretty text-base text-muted-foreground leading-relaxed">
          Pelo menu à esquerda você altera peças e preços, responde pedidos das costureiras e vê quem
          está fazendo cada modelo. {persistenceCopy}
        </p>
      </div>
      {children}
    </div>
  );
}
