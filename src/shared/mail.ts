// The site's own mail. The site runs on voidbase, so it sends the way any voidbase app sends: through
// `$app.newMailClient()`, which hands the message to whoever carries mail on this instance -- the shipped `mail`
// plugin (Cloudflare Email Service, when the deploy named VOIDBASE_MAIL_DOMAIN and the settings' sender is on that
// domain), else an HTTP mail API (VOIDBASE_MAIL_HTTP_URL), else the SMTP settings when they are enabled.
//
// With none of those the core writes a log line and answers as if it had sent, which is no answer at all for an
// invitation: the invited person would never hear about it and the inviter would never know. So `mailRoute` asks
// the same question the core asks, before the message is built, and the caller is told plainly what happened --
// POST /api/vbcloud/instances/:id/members hands the invitation link back when nothing can carry it.
//
// To turn it on, either: deploy with a sending domain (`VOIDBASE_MAIL_DOMAIN=voidbase.cloud`, which gives the
// Worker its SEND_EMAIL binding) and set the sender address in the admin panel's settings to an address on that
// domain; or set VOIDBASE_MAIL_HTTP_URL (and VOIDBASE_MAIL_HTTP_KEY) to a Resend-shaped API; or enable SMTP in the
// settings. Nothing else in this app sends mail, so nothing else is affected either way.
import type { Context } from "hono";
import { env, pb } from "./pb";

/** where a message would leave this site, or `none` with the reason nothing can carry it */
export interface MailRoute { via: "plugin" | "http" | "smtp" | "none"; detail: string; sender: string; senderName: string }

const bindings = (c: Context) => (c.env ?? {}) as Record<string, unknown>;

/** what the settings say this site sends as */
function sender(): { address: string; name: string } {
  try { const s = pb.$app.settings(); return { address: String(s.meta.senderAddress ?? "").trim(), name: String(s.meta.senderName ?? "").trim() }; }
  catch { return { address: "", name: "" }; }
}

/** the same walk the core does (src/server/mail/index.ts routeMail), asked before a message is built */
export function mailRoute(c: Context): MailRoute {
  const from = sender();
  const base = { sender: from.address, senderName: from.name };
  const domain = env("VOIDBASE_MAIL_DOMAIN").trim().toLowerCase();
  const onDomain = !!domain && from.address.toLowerCase().split("@")[1] === domain;
  if (bindings(c).SEND_EMAIL && onDomain) return { via: "plugin", detail: `Cloudflare Email Service, from ${domain}`, ...base };
  const http = env("VOIDBASE_MAIL_HTTP_URL").trim();
  if (http) { let host = http; try { host = new URL(http).host; } catch { /* as given */ } return { via: "http", detail: host, ...base }; }
  let smtp = { enabled: false, host: "" };
  try { const s = pb.$app.settings(); smtp = { enabled: !!s.smtp.enabled, host: String(s.smtp.host ?? "") }; } catch { /* no settings here */ }
  if (smtp.enabled) return { via: "smtp", detail: smtp.host, ...base };
  const why = !from.address
    ? "this site's settings name no sender address"
    : domain && !onDomain
      ? `the sender ${from.address} is not on VOIDBASE_MAIL_DOMAIN (${domain})`
      : "no sending domain (VOIDBASE_MAIL_DOMAIN), no mail API (VOIDBASE_MAIL_HTTP_URL) and no SMTP in the settings";
  return { via: "none", detail: why, ...base };
}

/**
 * One message, when something can carry it. `sent: false` is not an error: the caller says so and carries on, which
 * is what an invitation does. A transport that accepts the message and then fails is the transport's error, and it
 * comes back as `error` rather than as a thrown one, because the row is already written by then.
 */
export async function send(c: Context, m: { to: string; subject: string; html: string; text: string }): Promise<{ sent: boolean; via: MailRoute["via"]; detail: string; error?: string }> {
  const route = mailRoute(c);
  if (route.via === "none") return { sent: false, via: "none", detail: route.detail };
  try {
    await pb.$app.newMailClient().send({
      from: { address: route.sender, name: route.senderName }, to: [{ address: m.to }], cc: [], bcc: [],
      subject: m.subject, html: m.html, text: m.text, headers: {},
    });
    return { sent: true, via: route.via, detail: route.detail };
  } catch (err) {
    return { sent: false, via: route.via, detail: route.detail, error: err instanceof Error ? err.message : String(err) };
  }
}

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** the invitation itself: who asked, which instance, which role, and the one link that accepts it */
export function invitation(o: { instance: string; role: string; link: string; by: string; reach: string }) {
  const by = o.by ? `${o.by} ` : "";
  const subject = `${by ? `${o.by} added you` : "You were added"} to ${o.instance} on voidbase.cloud`;
  const text = [
    `${by}added you to the voidbase instance ${o.instance} as ${o.role}.`,
    "",
    `As ${o.role}: ${o.reach}`,
    "",
    "Open this link, signed in with this address, to accept:",
    o.link,
    "",
    "If you were not expecting this, ignore it: nothing happens until the link is opened.",
  ].join("\n");
  const html = [
    `<p>${escape(by ? `${o.by} added you` : "You were added")} to the voidbase instance <strong>${escape(o.instance)}</strong> as <strong>${escape(o.role)}</strong>.</p>`,
    `<p>As ${escape(o.role)}: ${escape(o.reach)}</p>`,
    `<p>Open this link, signed in with this address, to accept:<br><a href="${escape(o.link)}">${escape(o.link)}</a></p>`,
    `<p>If you were not expecting this, ignore it: nothing happens until the link is opened.</p>`,
  ].join("\n");
  return { subject, text, html };
}
