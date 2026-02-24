import { TYPE_COLORS, type PokemonType } from "../data/typeChart";

interface TypeBadgeProps {
  type: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  selected?: boolean;
}

export default function TypeBadge({ type, size = "md", onClick, selected }: TypeBadgeProps) {
  const color = TYPE_COLORS[type as PokemonType] ?? "#999";
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-block rounded-full font-semibold text-white uppercase tracking-wide cursor-default select-none transition-all duration-200 ${sizeClasses[size]} ${onClick ? "cursor-pointer hover:scale-110" : ""} ${selected ? "ring-2 ring-white ring-offset-2 ring-offset-gray-800 scale-110" : ""}`}
      style={{ backgroundColor: color }}
      onClick={onClick}
    >
      {type}
    </span>
  );
}
