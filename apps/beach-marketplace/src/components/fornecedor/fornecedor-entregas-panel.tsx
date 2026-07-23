"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { retryMelhorEnvioEtiquetaForAssignmentAction } from "@/app/(painel)/painel/fornecedor/fornecedor-actions";
import type { SupplierFulfillmentLineDto } from "@/lib/platform-account-server";
import { formatBrl } from "@/lib/utils";

type Props = {
  lines: SupplierFulfillmentLineDto[];
  demoMode: boolean;
  apiMode: boolean;
};

function kindLabel(k: string) {
  return k === "PECA" ? "peça(s)" : "metro(s)";
}

export function FornecedorEntregasPanel({ lines, demoMode, apiMode }: Props) {
  const router = useRouter();
  const [pendingAssignment, setPendingAssignment] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const groups = useMemo(() => {
    const m = new Map<string, SupplierFulfillmentLineDto[]>();
    for (const line of lines) {
      const k = line.production_assignment_id;
      const arr = m.get(k) ?? [];
      arr.push(line);
      m.set(k, arr);
    }
    return [...m.entries()];
  }, [lines]);

  if (demoMode) {
    return (
      <p className="text-sm text-muted-foreground">
        Com a API e o login pela base ativos, esta aba lista para onde enviar cada insumo quando uma peça for
        atribuída a uma costureira. Com o Melhor Envio configurado na API, surge o link da etiqueta (gerada na
        atribuição ou pelo botão <strong>Gerar etiqueta</strong> nesta aba).
      </p>
    );
  }

  if (lines.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma entrega pendente. Quando o admin montar um produto com os seus insumos e atribuir a uma
        costureira, as linhas de envio (destino, quantidades por peça acabada e etiqueta) surgem aqui.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Quando o mesmo pedido inclui <strong>vários insumos seus</strong>, o sistema usa o pacote de{" "}
        <strong>maior volume</strong> (e o maior peso entre eles) para cotar um único envio à costureira. O frete
        B2B é definido na <strong>atribuição</strong> e entra no preço final da peça; não pode ser alterado por
        aqui. A <strong>etiqueta Melhor Envio</strong> é criada na atribuição (se a API estiver pronta) ou ao
        clicar em <strong>Gerar etiqueta (Melhor Envio)</strong> no bloco do envio.
      </p>

      <div className="space-y-8">
        {groups.map(([assignmentId, groupLines]) => {
          const head = groupLines[0];
          const volNote =
            groupLines.length > 1
              ? `${groupLines.length} insumos neste envio — dimensões compartilhadas.`
              : null;
          return (
            <div key={assignmentId} className="rounded-xl border border-border bg-card/40">
              <div className="border-b border-border bg-muted/25 px-4 py-3 sm:px-5">
                <p className="font-medium text-foreground">{head.product_nome}</p>
                <p className="text-sm text-muted-foreground">
                  Destino: {head.executor_nome} — {head.executor_endereco}, {head.executor_cidade} — CEP{" "}
                  {head.executor_cep}
                </p>
                {volNote ? <p className="mt-1 text-xs text-muted-foreground">{volNote}</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    Pacote do envio:{" "}
                    <span className="tabular-nums text-foreground">
                      {head.envio_pacote_altura_cm ?? "—"} × {head.envio_pacote_largura_cm ?? "—"} ×{" "}
                      {head.envio_pacote_comprimento_cm ?? "—"} cm ·{" "}
                      {head.envio_pacote_peso_kg ?? "—"} kg
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Frete à costureira:{" "}
                    <span className="font-medium text-foreground">
                      {head.frete_cotado_reais != null ? formatBrl(head.frete_cotado_reais) : "—"}
                    </span>
                    <span className="ml-1 block text-xs font-normal normal-case text-muted-foreground sm:inline sm:ml-1">
                      · Melhor Envio quando a API tem token; senão, estimativa local
                    </span>
                  </span>
                  {apiMode && !head.melhor_envio_etiqueta_url ? (
                    <button
                      type="button"
                      disabled={isPending && pendingAssignment === assignmentId}
                      className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15 disabled:opacity-60"
                      onClick={() => {
                        setPendingAssignment(assignmentId);
                        startTransition(async () => {
                          try {
                            const result = await retryMelhorEnvioEtiquetaForAssignmentAction(assignmentId);
                            if (!result.ok) {
                              toast.error(result.message);
                              return;
                            }
                            toast.success("Etiqueta gerada. O link aparece na coluna ao lado.");
                            router.refresh();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Não foi possível gerar a etiqueta.");
                          } finally {
                            setPendingAssignment(null);
                          }
                        });
                      }}
                    >
                      {isPending && pendingAssignment === assignmentId
                        ? "A gerar…"
                        : "Gerar etiqueta (Melhor Envio)"}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Insumo</th>
                      <th className="px-4 py-2 font-medium">Qtd / peça acabada</th>
                      <th className="px-4 py-2 font-medium">Pacote cadastro (cm / kg)</th>
                      <th className="px-4 py-2 font-medium">Etiqueta ME</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {groupLines.map((row) => (
                      <tr key={row.id} className="bg-card/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{row.insumo.nome}</div>
                          <div className="font-mono text-xs text-muted-foreground">{row.insumo.sku_interno}</div>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {row.quantidade_por_peca} {kindLabel(row.insumo.quantidade_kind)}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                          {row.insumo.pacote_altura_cm ?? "—"} × {row.insumo.pacote_largura_cm ?? "—"} ×{" "}
                          {row.insumo.pacote_comprimento_cm ?? "—"} · {row.insumo.pacote_peso_kg ?? "—"} kg
                        </td>
                        <td className="px-4 py-3">
                          {row.melhor_envio_etiqueta_url ? (
                            <a
                              href={row.melhor_envio_etiqueta_url}
                              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Abrir etiqueta
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {apiMode
                                ? 'Sem etiqueta — use "Gerar etiqueta" acima se a API ME já estiver configurada.'
                                : "Pendente (integração ME)"}
                            </span>
                          )}
                          {row.melhor_envio_pedido_id ? (
                            <div className="mt-1 font-mono text-[0.65rem] text-muted-foreground">
                              ID {row.melhor_envio_pedido_id}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
