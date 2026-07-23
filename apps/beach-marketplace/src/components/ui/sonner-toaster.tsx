"use client";

import { Toaster } from "sonner";

export function SonnerToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{ classNames: { title: "font-medium", description: "text-sm opacity-90" } }}
    />
  );
}
