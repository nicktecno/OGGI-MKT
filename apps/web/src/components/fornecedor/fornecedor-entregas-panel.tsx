import type { SupplierFulfillmentLineDto } from "@/lib/platform-account-server";

type Props = {
  lines: SupplierFulfillmentLineDto[];
  demoMode: boolean;
};

function kindLabel(k: string) {
  return k === "PECA" ? "peça(s)" : "metro(s)";
}

export function FornecedorEntregasPanel({ lines, demoMode }: Props) {
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
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Envie os materiais para o endereço da costureira. O frete costuma ser cotado pelo{" "}
        <strong>Melhor Envio</strong> após a atribuição; quando integrado, o link da etiqueta aparece na última
        coluna.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-medium">Insumo</th>
              <th className="px-3 py-3 font-medium">Peça (produto)</th>
              <th className="px-3 py-3 font-medium">Qtd / peça acabada</th>
              <th className="px-3 py-3 font-medium">Destino (executor)</th>
              <th className="px-3 py-3 font-medium">Etiqueta ME</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lines.map((row) => (
              <tr key={row.id} className="bg-card hover:bg-muted/20">
                <td className="px-3 py-3">
                  <div className="font-medium text-foreground">{row.insumo.nome}</div>
                  <div className="font-mono text-xs text-muted-foreground">{row.insumo.sku_interno}</div>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{row.product_nome}</td>
                <td className="px-3 py-3 tabular-nums">
                  {row.quantidade_por_peca} {kindLabel(row.insumo.quantidade_kind)}
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  <div className="text-foreground">{row.executor_nome}</div>
                  <div className="text-xs">
                    {row.executor_endereco}, {row.executor_cidade} — CEP {row.executor_cep}
                  </div>
                </td>
                <td className="px-3 py-3">
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
}
