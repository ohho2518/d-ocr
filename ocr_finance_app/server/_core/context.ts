import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createClient } from "@supabase/supabase-js";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

const supabaseAdmin = createClient(ENV.supabaseUrl, ENV.supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const authHeader = opts.req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: { user: sbUser }, error } = await supabaseAdmin.auth.getUser(token);

      if (!error && sbUser) {
        try {
          await db.upsertUser({
            openId: sbUser.id,
            email: sbUser.email ?? null,
            name: (sbUser.user_metadata?.full_name as string | undefined)
              ?? sbUser.email?.split("@")[0]
              ?? null,
            loginMethod: "email",
            lastSignedIn: new Date(),
          });
          user = (await db.getUserByOpenId(sbUser.id)) ?? null;
        } catch (dbErr) {
          console.error("[Auth] DB error resolving user — is DATABASE_URL set correctly?", dbErr);
          user = null;
        }
      }
    }
  } catch {
    user = null;
  }

  return { req: opts.req, res: opts.res, user };
}
