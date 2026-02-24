import { Link } from "react-router-dom";
import { getSprite, formatName } from "../services/pokeapi";
import TypeBadge from "./TypeBadge";

interface PokemonCardProps {
  id: number;
  name: string;
  types?: string[];
}

export default function PokemonCard({ id, name, types }: PokemonCardProps) {
  return (
    <Link
      to={`/pokedex/${id}`}
      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100"
    >
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-2 flex items-center justify-center h-32">
        <span className="absolute top-2 left-2 text-xs font-bold text-gray-400 font-retro">
          #{String(id).padStart(3, "0")}
        </span>
        <img
          src={getSprite(id)}
          alt={name}
          className="w-20 h-20 object-contain group-hover:scale-125 transition-transform duration-300 image-rendering-pixelated"
          loading="lazy"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      <div className="p-3 text-center">
        <h3 className="text-sm font-bold text-gray-800 mb-1.5 truncate">
          {formatName(name)}
        </h3>
        {types && (
          <div className="flex gap-1 justify-center flex-wrap">
            {types.map(t => (
              <TypeBadge key={t} type={t} size="sm" />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
