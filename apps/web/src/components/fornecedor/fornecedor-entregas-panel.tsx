"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recalculateFulfillmentFreteAction } from "@/app/(painel)/painel/fornecedor/fornecedor-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplierFulfillmentLineDto } from "@/lib/platform-account-server";
import { formatBrl } from "@/lib/utils";

type Props = {
  lines: SupplierFulfillmentLineDto[];
  demoMode: boolean;
};

function kindLabel(k: string) {
  return k === "PECA" ? "peça(s)" : "metro(s)";
}

function parseDim(s: string): number {
  return Number(s.replace(",", "."));
}

export function FornecedorEntregasPanel({ lines, demoMode }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(null);
  const [adjAlt, setAdjAlt] = useState("");
  const [adjLar, setAdjLar] = useState("");
  const [adjComp, setAdjComp] = useState("");
  const [adjPeso, setAdjPeso] = useState("");

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

  function openAdjust(assignmentId: string, sample: SupplierFulfillmentLineDto) {
    setError(null);
    setOpenAssignmentId(assignmentId);
    setAdjAlt(String(sample.envio_pacote_altura_cm ?? sample.insumo.pacote_altura_cm ?? 14));
    setAdjLar(String(sample.envio_pacote_largura_cm ?? sample.insumo.pacote_largura_cm ?? 12));
    setAdjComp(String(sample.envio_pacote_comprimento_cm ?? sample.insumo.pacote_comprimento_cm ?? 5));
    setAdjPeso(String(sample.envio_pacote_peso_kg ?? sample.insumo.pacote_peso_kg ?? 0.4));
  }

  if (demoMode) {
    return (
      <p className="text-sm text-muted-foreground">
        Com a API e o login pela base ativos, esta aba lista para onde enviar cada insumo quando uma peça for
        atribuída a uma costureira. A etiqueta do <strong>Melhor Envio</strong> aparecerá aqui após a
        integração de envio estar ligada.
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
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Quando o mesmo pedido inclui <strong>vários insumos seus</strong>, o sistema usa o pacote de{" "}
        <strong>maior volume</strong> (e o maior peso entre eles) para cotar um único envio ao executor. Depois
        que a atribuição existir, você pode <strong>ajustar o pacote</strong> e recalcular o frete (hoje uma
        estimativa local; troca pela cotação Melhor Envio quando integrada).
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
                    Frete estimado:{" "}
                    <span className="font-medium text-foreground">
                      {head.frete_cotado_reais != null ? formatBrl(head.frete_cotado_reais) : "—"}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => openAdjust(assignmentId, head)}
                  >
                    Ajustar pacote e recalcular frete
                  </Button>
                </div>

                {openAssignmentId === assignmentId ? (
                  <form
                    className="mt-4 grid gap-3 rounded-lg border border-dashed border-border bg-background/80 p-4 sm:grid-cols-2 lg:grid-cols-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const alturaCm = parseDim(adjAlt);
                      const larguraCm = parseDim(adjLar);
                      const comprimentoCm = parseDim(adjComp);
                      const pesoKg = parseDim(adjPeso);
                      if (
                        !Number.isFinite(alturaCm) ||
                        !Number.isFinite(larguraCm) ||
                        !Number.isFinite(comprimentoCm) ||
                        !Number.isFinite(pesoKg) ||
                        alturaCm < 0.1 ||
                        larguraCm < 0.1 ||
                        comprimentoCm < 0.1 ||
                        pesoKg < 0.01
                      ) {
                        setError("Use dimensões ≥ 0,1 cm e peso ≥ 0,01 kg.");
                        return;
                      }
                      setError(null);
                      startTransition(() => {
                        void (async () => {
                          try {
                            await recalculateFulfillmentFreteAction({
                              productionAssignmentId: assignmentId,
                              alturaCm,
                              larguraCm,
                              comprimentoCm,
                              pesoKg,
                            });
                            setOpenAssignmentId(null);
                            router.refresh();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Erro ao recalcular");
                          }
                        })();
                      });
                    }}
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor={`adj-a-${assignmentId}`}>Altura (cm)</Label>
                      <Input
                        id={`adj-a-${assignmentId}`}
                        value={adjAlt}
                        onChange={(e) => setAdjAlt(e.target.value)}
                        disabled={pending}
                        inputMode="decimal"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`adj-l-${assignmentId}`}>Largura (cm)</Label>
                      <Input
                        id={`adj-l-${assignmentId}`}
                        value={adjLar}
                        onChange={(e) => setAdjLar(e.target.value)}
                        disabled={pending}
                        inputMode="decimal"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`adj-c-${assignmentId}`}>Comprimento (cm)</Label>
                      <Input
                        id={`adj-c-${assignmentId}`}
                        value={adjComp}
                        onChange={(e) => setAdjComp(e.target.value)}
                        disabled={pending}
                        inputMode="decimal"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`adj-p-${assignmentId}`}>Peso (kg)</Label>
                      <Input
                        id={`adj-p-${assignmentId}`}
                        value={adjPeso}
                        onChange={(e) => setAdjPeso(e.target.value)}
                        disabled={pending}
                        inputMode="decimal"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
                      <Button type="submit" size="sm" disabled={pending}>
                        {pending ? "Recalculando…" : "Aplicar e recalcular"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => setOpenAssignmentId(null)}
                      >
                        Fechar
                      </Button>
                    </div>
                  </form>
                ) : null}
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
                            <span className="text-xs text-muted-foreground">Pendente (integração ME)</span>
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
