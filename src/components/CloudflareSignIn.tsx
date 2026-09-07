// "Sign in with Cloudflare" for the header and the cloud page: PocketBase's OAuth2 popup flow against the site's
// backend (`cloudflare` provider). Signed in, it becomes the link to the visitor's instances.
import { useEffect, useState } from "react";
import { Link, useRouter } from "@void/react";
import CloudflareMark from "@/components/CloudflareMark";
import { errorMessage, vb } from "@/lib/vb";

export interface CloudflareSignInProps {
  /** "btn" (default), "btn btn-lg", "dropdown-item" */
  className?: string;
  logo?: boolean;
  label?: string;
}

export default function CloudflareSignIn({ className = "btn", logo = true, label = "Sign in with Cloudflare" }: CloudflareSignInProps) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const pb = vb();
    const sync = () => {
      setSignedIn(pb.authStore.isValid);
      const user = (pb.authStore.record ?? pb.authStore.model) as { email?: string; name?: string } | null;
      setEmail(user?.email || user?.name || "");
    };
    sync();
    return pb.authStore.onChange(sync);
  }, []);

  async function signIn() {
    setError("");
    setBusy(true);
    try {
      await vb().collection("users").authWithOAuth2({ provider: "cloudflare" });
      await router.visit("/cloud");
    } catch (err) {
      setError(errorMessage(err));
      console.error("Sign in with Cloudflare failed:", err);
    } finally {
      setBusy(false);
    }
  }

  if (signedIn) {
    return (
      <Link href="/cloud" className={`${className} cf-signin`} title={email ? `Signed in as ${email}` : "Signed in"}>
        {logo && <CloudflareMark />}
        <span className="txt">Your instances</span>
      </Link>
    );
  }

  return (
    <button type="button" className={`${className} cf-signin`} onClick={signIn} disabled={busy} title={error || "Sign in with your Cloudflare account"}>
      {logo && <CloudflareMark />}
      <span className="txt">{busy ? "Waiting for Cloudflare…" : error ? "Sign-in failed, try again" : label}</span>
    </button>
  );
}
