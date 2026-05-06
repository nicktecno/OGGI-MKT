import { redirect } from "next/navigation";

/** Rota antiga “Itens”; o cadastro de montagem mudou para /cadastro-peca. */
export default function AdminInsumosRedirectPage() {
  redirect("/painel/admin/cadastro-peca");
}
