import { BattingScorebookTable } from "@/components/batting-scorebook-table";
import { getInningScores } from "@/lib/domain/stats";
import type { AppGame } from "@/lib/app-state/types";

export function PrintableScorebook({ game }: { game: AppGame }) {
  const scores = getInningScores(game.timeline, game.config.regulationInnings);

  return (
    <section
      className="print-scorebook hidden bg-white text-black print:block"
      aria-label="印刷用スコアブック"
    >
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          .print-scorebook { font-size: 8pt; }
          .print-scorebook .sticky { position: static !important; }
          .print-scorebook table { width: 100%; table-layout: fixed; }
          .print-scorebook th, .print-scorebook td {
            min-width: 0 !important;
            padding: 2px !important;
            color: #000 !important;
            border-color: #666 !important;
          }
          .print-scorebook-team {
            break-inside: avoid;
            margin-top: 6mm;
          }
        }
      `}</style>
      <header className="border-b-2 border-black pb-2">
        <h1 className="text-xl font-bold">野球スコアブック</h1>
        <div className="mt-1 flex items-end justify-between gap-4">
          <p>{game.date.slice(0, 10)}</p>
          <p className="text-lg font-bold">
            {game.config.teams.away.name} {scores.awayTotal} -{" "}
            {scores.homeTotal} {game.config.teams.home.name}
          </p>
        </div>
      </header>
      {(["away", "home"] as const).map((teamSide) => (
        <section key={teamSide} className="print-scorebook-team">
          <h2 className="mb-1 text-sm font-bold">
            {game.config.teams[teamSide].name}
          </h2>
          <BattingScorebookTable game={game} teamSide={teamSide} printMode />
        </section>
      ))}
    </section>
  );
}
