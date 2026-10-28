import { NextResponse } from "next/server";
import { connection } from "next/server";

import { checkDatabaseConnection } from "@/db/check-connection";
import { getCurrentUser } from "@/lib/auth/session";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function authorizeHealthRequest(request: Request): Promise<boolean> {
  const secret = process.env.HEALTH_CHECK_SECRET?.trim();
  if (secret) {
    const headerSecret =
      request.headers.get("x-health-secret")?.trim() ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

    if (headerSecret && timingSafeEqual(headerSecret, secret)) {
      return true;
    }
  }

  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

export async function GET(request: Request) {
  // Opt into dynamic rendering under Next.js cacheComponents.
  await connection();

  if (!(await authorizeHealthRequest(request))) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const result = await checkDatabaseConnection({ includeErrorDetails: false });

  return NextResponse.json(
    {
      ok: result.ok,
      message: result.ok ? "ok" : "Database connection failed.",
    },
    {
      status: result.ok ? 200 : 503,
    },
  );
}
