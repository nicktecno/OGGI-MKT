/** UI e auth mock só fora de deploy público de produção. */
export function hideDemoCredentialsUi(): boolean {
  if (process.env.VERCEL_ENV === "production") return true;
  if (process.env.NODE_ENV === "production") return true;
  return false;
}
