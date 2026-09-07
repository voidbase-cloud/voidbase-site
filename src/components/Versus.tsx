// The comparison table every "compared to" page uses.
//
// Two jobs. The same questions get asked of every product, so a reader can hold two pages side by side without
// re-reading the headers. And every answer carries a verdict, so the shape of the trade is visible before any of it
// is read: a column of green is a product that wins on these questions, and a mixed column is an honest table.
//
// A table where one side is all green is a table nobody believes, so the questions are chosen to include the ones
// voidbase loses. If a page has no red in the voidbase column, the questions are wrong.
import type { ReactNode } from "react";
import { Link } from "@void/react";

/**
 * What an answer means for the reader.
 *
 *   yes       in your favour
 *   no        against you, and staying that way
 *   planned   against you today, and on the roadmap with a design behind it (docs/why/roadmap)
 *   depends   genuinely depends on what you are building
 *
 * `planned` is not a softer `no`. It is only for the rows where the roadmap page names the work and says how it
 * would be done. Marking a gap as planned without that is how a comparison page turns into an advertisement.
 */
export type Verdict = "yes" | "no" | "planned" | "depends";
export type Cell = [Verdict, ReactNode];
export interface VersusRow {
  q: string;
  vb: Cell;
  them: Cell;
}

const MARK: Record<Verdict, { icon: string; label: string }> = {
  yes: { icon: "ri-check-line", label: "in your favour" },
  no: { icon: "ri-close-line", label: "against you" },
  planned: { icon: "ri-alert-line", label: "against you today, and on the roadmap" },
  depends: { icon: "ri-subtract-line", label: "depends what you are building" },
};

function Answer({ cell }: { cell: Cell }) {
  const [verdict, text] = cell;
  const mark = MARK[verdict];
  return (
    <div className="why-answer">
      <i className={`why-verdict why-${verdict} ${mark.icon}`} role="img" aria-label={mark.label} />
      <span>{text}</span>
    </div>
  );
}

export default function Versus({ other, logo, rows }: { other: string; logo?: ReactNode; rows: VersusRow[] }) {
  return (
    <div className="why-table-wrap">
      <table className="why-table">
        <thead>
          <tr>
            <th />
            <th>voidbase</th>
            <th>
              <span className="why-th">{logo}{other}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.q}>
              <th scope="row">{r.q}</th>
              <td><Answer cell={r.vb} /></td>
              <td><Answer cell={r.them} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="why-legend">
        <span><i className="ri-check-line why-yes" /> in your favour</span>
        <span><i className="ri-alert-line why-planned" /> not yet, and <Link href="/docs/why/roadmap">on the roadmap</Link></span>
        <span><i className="ri-close-line why-no" /> against you</span>
        <span><i className="ri-subtract-line why-depends" /> depends what you are building</span>
      </p>
    </div>
  );
}
