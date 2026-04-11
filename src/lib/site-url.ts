export function getSiteUrl(): string {
  return (process.env.NEXTAUTH_URL || "https://prokatik.by").replace(
    /\/+$/,
    "",
  );
}
