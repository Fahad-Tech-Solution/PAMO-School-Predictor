/**
 * Canonical site origin for auth email redirects (magic link / password reset).
 * Requires NEXT_PUBLIC_APP_URL — never derived from Host / X-Forwarded-* headers
 * (those are attacker-controllable and can steal reset tokens).
 */
export async function getAppOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");

  if (!configured) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is required for auth redirects. Set it in .env.local (e.g. http://localhost:3000).",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL must be a valid absolute URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL must use http or https.");
  }

  return parsed.origin;
}
