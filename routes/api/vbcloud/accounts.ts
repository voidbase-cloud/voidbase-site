import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { listAccounts } from "@voidbase-cloud/voidbase/cloud";
import { connectionFor, requireAuth, userId } from "@/shared";

// the Cloudflare accounts the visitor granted, re-read from Cloudflare and cached back on the connection
export const GET = defineHandler(requireAuth("users"), async (c) => {
  const { conn, cf } = await connectionFor(userId(c));
  const accounts = await listAccounts(cf); conn.set("accounts", accounts); await pb.$app.save(conn);
  return { accounts };
});
