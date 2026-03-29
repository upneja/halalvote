export function VoteResults({
  halalCount,
  haramCount,
  userVote,
}: {
  halalCount: number;
  haramCount: number;
  userVote?: "halal" | "haram";
}) {
  const total = halalCount + haramCount;
  const halalPercent = total > 0 ? Math.round((halalCount / total) * 100) : 50;
  const haramPercent = 100 - halalPercent;

  // conic-gradient: halal (emerald) fills halalPercent of the arc, haram (red) fills remainder
  const donutGradient = `conic-gradient(
    #059669 0deg ${halalPercent * 3.6}deg,
    #991b1b ${halalPercent * 3.6}deg 360deg
  )`;

  // Leading percentage and label
  const leading = halalPercent >= haramPercent ? "halal" : "haram";
  const leadingPercent = leading === "halal" ? halalPercent : haramPercent;

  return (
    <div className="flex items-center gap-5 sm:gap-6">
      {/* Donut chart */}
      <div className="relative flex-shrink-0" style={{ width: 96, height: 96 }}>
        {/* Outer ring */}
        <div
          className="w-full h-full rounded-full"
          style={{ background: donutGradient }}
        />
        {/* Inner cutout */}
        <div
          className="absolute rounded-full flex flex-col items-center justify-center"
          style={{
            inset: "16px",
            background: "#0a0a0a",
          }}
        >
          <span
            className="text-sm font-bold leading-none"
            style={{ color: leading === "halal" ? "#34d399" : "#f87171" }}
          >
            {leadingPercent}%
          </span>
          <span className="text-neutral-500 text-[9px] leading-tight mt-0.5 font-medium uppercase tracking-wide">
            {leading}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 space-y-3">
        {/* Halal row */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
              Halal
            </span>
            <span className="text-xs font-bold text-emerald-300">
              {halalPercent}% &middot; {halalCount}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${halalPercent}%`,
                background: "linear-gradient(90deg, #059669, #34d399)",
              }}
            />
          </div>
        </div>

        {/* Haram row */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">
              Haram
            </span>
            <span className="text-xs font-bold text-red-300">
              {haramPercent}% &middot; {haramCount}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${haramPercent}%`,
                background: "linear-gradient(90deg, #991b1b, #f87171)",
              }}
            />
          </div>
        </div>

        {/* Vote count + user vote */}
        <p className="text-xs text-neutral-500">
          {total} {total === 1 ? "vote" : "votes"}
          {userVote && (
            <span
              className="ml-2 font-semibold"
              style={{ color: userVote === "halal" ? "#34d399" : "#f87171" }}
            >
              &middot; You voted {userVote === "halal" ? "Halal" : "Haram"}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
