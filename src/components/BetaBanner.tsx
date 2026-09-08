// The one line on every page that says what state the project is in.
//
// It renders from the version, so it is not a flag anyone has to remember to turn off: a release with no prerelease
// part ("1.0.0" rather than "0.9.0-beta") has no channel, and this returns nothing.
import { Link } from "@void/react";
import { RELEASE } from "@/lib/env";

export default function BetaBanner() {
  if (!RELEASE.channel) return null;
  return (
    <div className="beta-banner">
      <div className="wrapper wrapper-lg">
        <span className="beta-banner-mark">{RELEASE.channel}</span>
        <span className="beta-banner-txt">
          voidbase is in public {RELEASE.channel}. It runs, the API is PocketBase's and is not moving, and the
          version is still 0.x for everything around that.
        </span>
        <Link href="/docs/contribute" className="beta-banner-link">
          Help us get it to 1.0
        </Link>
      </div>
    </div>
  );
}
