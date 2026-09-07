// The comparison table every "compared to" page uses, so the same questions get asked of each product and a reader
// can hold two pages side by side without re-reading the headers.
import type { ReactNode } from "react";

export interface VersusRow {
  question: string;
  voidbase: ReactNode;
  other: ReactNode;
}

export default function Versus({ other, rows }: { other: string; rows: VersusRow[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th />
          <th>voidbase</th>
          <th>{other}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.question}>
            <td>{r.question}</td>
            <td>{r.voidbase}</td>
            <td>{r.other}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
