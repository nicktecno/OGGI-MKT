"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/** Exibe feedback pós-cadastro / senha na rota /entrar e limpa os query params da URL. */
export function LoginPageToasts() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;

    const cadastro = searchParams.get("cadastro");
    const email = searchParams.get("email");
    const senha = searchParams.get("senha");
    if (!cadastro && !email && !senha) return;

    shown.current = true;

    if (cadastro === "cliente") {
      toast.success("Conta de cliente criada", {
        description:
          "Entre com o e-mail e a senha que você escolheu para pedir seu Los Los Fest.",
      });
    } else if (cadastro === "pendente") {
      toast.success("Cadastro recebido", {
        description:
          "Use o e-mail e a senha que você criou para entrar. O painel completo libera após aprovação do admin.",
      });
    }

    if (email === "confirmado") {
      toast.message("E-mail de confirmação enviado", {
        description:
          "Confira sua caixa de entrada e, se não achar, a pasta de spam.",
      });
    } else if (email === "pendente_envio") {
      toast.warning("E-mail de confirmação não enviado", {
        description:
          "Sua conta foi criada e você já pode entrar com o e-mail e a senha escolhidos.",
      });
    }

    if (senha === "redefinida") {
      toast.success("Senha atualizada", {
        description: "Entre com o e-mail e a nova senha.",
      });
    }

    const next = searchParams.get("next");
    const q = next ? `?next=${encodeURIComponent(next)}` : "";
    router.replace(`/entrar${q}`, { scroll: false });
  }, [searchParams, router]);

  return null;
}
