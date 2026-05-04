import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExecutorLiberarVitrine } from "@/components/executor/executor-liberar-vitrine";
import { executorAssignmentStatusLabel } from "@/lib/executor-assignment-labels";
import { ExecutorProfileForm } from "@/components/executor/executor-profile-form";
import { ExecutorSolicitarProducao } from "@/components/executor/executor-solicitar-producao";
import { StripeConnectButton } from "@/components/platform/stripe-connect-button";
import { getCompositeProductById } from "@/lib/demo-seed";
import { commerceUsesDatabase } from "@/lib/commerce-backend";
import { getDemoCommerceState } from "@/lib/demo-runtime";
import { fetchPlatformMe } from "@/lib/platform-account-server";
import { getSession } from "@/lib/session";
import { formatBrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Executor",
};

export default async function ExecutorPainelPage() {
  const session = await getSession();
  const email = session?.email ?? "";
  const commerce = await getDemoCommerceState();
  const apiOn = commerceUsesDatabase();
  const me = apiOn ? await fetchPlatformMe() : null;

  const minhasAtribuicoes = commerce.productionAssignments.filter(
    (a) => a.executorEmail.toLowerCase() === email.toLowerCase() && a.status !== "ARCHIVED",
  );

  const em = email.toLowerCase();
  const pecasParaPedido = commerce.products.filter((p) => {
    const temAtribuicao = commerce.productionAssignments.some(
      (a) =>
        a.compositeProductId === p.id &&
        a.executorEmail.toLowerCase() === em &&
        a.status !== "ARCHIVED",
    );
    if (temAtribuicao) return false;
    const temPedidoPendente = commerce.executionRequests.some(
      (r) =>
        r.compositeProductId === p.id &&
        r.executorEmail.toLowerCase() === em &&
        r.status === "PENDING",
    );
    return !temPedidoPendente;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Executor</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Atribuições de produção e seu cadastro para a loja. Conecte o Stripe para receber após
          vendas, quando a API estiver configurada.
        </p>
      </div>

      {me?.executorProfile ? (
        <Card className="max-w-4xl border-border">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Cadastro e pagamentos</CardTitle>
            <CardDescription>Nome público, endereço de envio e conta Stripe Connect.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ExecutorProfileForm initial={me.executorProfile} />
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-sm font-medium text-foreground">Stripe Connect</p>
              <StripeConnectButton
                onboardingComplete={me.stripeOnboardingComplete}
                hasStripeAccount={me.hasStripeAccount}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="max-w-4xl border-border">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Pedir para executar uma peça</CardTitle>
          <CardDescription>
            Envia um pedido ao administrador. Com a API e o envio de e-mail configurados no servidor,
            os admins são notificados automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExecutorSolicitarProducao
            options={pecasParaPedido.map((p) => ({ id: p.id, nome: p.nome }))}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {minhasAtribuicoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma atribuição ativa para {email}. Solicite execução ao admin ou aguarde atribuição
            direta.
          </p>
        ) : (
          minhasAtribuicoes.map((assignment) => {
            const product = getCompositeProductById(assignment.compositeProductId, commerce.products);
            return (
              <Card key={assignment.id} className="border-border">
                <CardHeader>
                  <CardTitle className="font-serif text-xl">
                    {product?.nome ?? "Produto"}
                  </CardTitle>
                  <CardDescription>
                    {executorAssignmentStatusLabel(assignment.status)}
                    {" · "}
                    <span className="text-muted-foreground">
                      {assignment.assignment_source === "ADMIN_DIRECT"
                        ? "Atribuição direta do admin"
                        : "Pedido seu aprovado"}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-border pb-3">
                    <span className="text-muted-foreground">Preço público</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {product ? formatBrl(product.preco_venda_publico) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-border pb-3">
                    <span className="text-muted-foreground">Estoque liberado</span>
                    <span className="font-mono tabular-nums text-foreground">
                      {assignment.available_quantity} un.
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-border pb-3">
                    <span className="text-muted-foreground">Unidades produzidas</span>
                    <span className="font-mono tabular-nums text-foreground">
                      {assignment.units_produced}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Origem de envio
                    </p>
                    <p className="mt-1 text-foreground">
                      {assignment.cidade_origem}
                      <br />
                      <span className="text-muted-foreground">CEP {assignment.cep_origem}</span>
                    </p>
                  </div>
                  <ExecutorLiberarVitrine
                    assignmentId={assignment.id}
                    status={assignment.status}
                    initialUnitsProduced={assignment.units_produced}
                  />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
