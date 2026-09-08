// The "Updating" section, shared by every page that tells you how to get voidbase in the first place.
//
// Each of those pages installs voidbase differently, so the command has a different effect on each of them and the
// prose is the page's own. What must not differ is the part underneath: what --check means, that a pipeline reads
// its exit code, and that a new release announces itself. Those are one component so that six pages cannot drift.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import type { Block } from "@/lib/hl";

export interface UpdatingProps {
  /** the command as this page's reader would type it */
  command: Block;
  /** what running it does here, as a sentence continuing "voidbase update ..." */
  children: React.ReactNode;
  /** what has to happen before the update reaches the people using the instance, where that is not the same thing */
  live?: React.ReactNode;
  /** the heading, for a page where "Updating" would be ambiguous */
  title?: string;
}

export default function Updating({ command, children, live, title = "Updating" }: UpdatingProps) {
  return (
    <section className="updating">
      <h2>{title}</h2>
      <CodeBlock {...command} />
      {children}
      {live && <div className="alert alert-warning"><div className="content"><p className="m-0">{live}</p></div></div>}
      <p>
        <code>voidbase update --check</code> changes nothing. It prints the version you are on and the newest one, and
        exits <code>1</code> when you are behind and <code>2</code> when it could not find out, which is what a{" "}
        <Link href="/docs/deploy/pipeline">pipeline</Link> reads. <code>--to 0.9.0</code> goes to a particular
        version rather than the newest, and <code>--dry-run</code> prints the command it would run without running
        it.
      </p>
      <p className="updating-notice">
        You do not have to remember to check. Any voidbase command mentions a new release once a day, from an answer
        cached under <code>~/.voidbase</code>. It never speaks in CI or when the output is not a terminal, and{" "}
        <code>VOIDBASE_NO_UPDATE_CHECK=1</code> silences it everywhere. Every release is written up in the{" "}
        <a href="https://github.com/voidbase-cloud/voidbase/releases" target="_blank" rel="noreferrer noopener">
          release notes
        </a>
        .
      </p>
    </section>
  );
}
