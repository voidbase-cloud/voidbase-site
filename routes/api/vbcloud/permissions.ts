import { defineHandler } from "void";
import { cfg } from "@/shared";

// What signing in lets the site do in a Cloudflare account, for someone who has not signed in yet: the scopes the
// OAuth client asks for (CF_OAUTH_SCOPES, or the defaults in src/shared/config.ts), each with what it is used for.
// Cloudflare's consent screen names them too; this is the same list, said before anyone is sent there.
const DOES: Record<string, string> = {
  "offline_access": "stay connected, so you are not asked again on every visit",
  "user-details.read": "read your name and email address, which is how the site knows who you are",
  "account-settings.read": "list the accounts you grant it, so you can pick where an instance goes",
  "workers-scripts.write": "create, update and delete Workers: your instances",
  "d1.write": "create and delete the D1 database each instance keeps its records in",
  "workers-r2.write": "create and delete the R2 bucket each instance keeps its files in",
  "workers-r2-bucket-item.read": "read the files in those buckets",
  "workers-r2-bucket-item.write": "write files to those buckets",
  "queues.write": "create and delete the queue each instance sends mail and backups through",
};

export const GET = defineHandler(async () => ({ scopes: cfg().scopes.map((id) => ({ id, does: DOES[id] ?? id })) }));
