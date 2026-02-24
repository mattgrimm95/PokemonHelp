const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  "special-attack": "SP.ATK",
  "special-defense": "SP.DEF",
  speed: "SPD",
};

const STAT_COLORS: Record<string, string> = {
  hp: "#FF5252",
  attack: "#FF8A65",
  defense: "#FFD54F",
  "special-attack": "#64B5F6",
  "special-defense": "#81C784",
  speed: "#F48FB1",
};

interface StatBarProps {
  statName: string;
  value: number;
  max?: number;
}

export default function StatBar({ statName, value, max = 255 }: StatBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const label = STAT_LABELS[statName] ?? statName.toUpperCase();
  const color = STAT_COLORS[statName] ?? "#90A4AE";

  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-right text-xs font-semibold text-gray-600 shrink-0">
        {label}
      </span>
      <span className="w-8 text-right text-sm font-bold tabular-nums">{value}</span>
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
