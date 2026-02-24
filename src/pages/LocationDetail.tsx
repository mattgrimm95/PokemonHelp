import { useParams, Link } from "react-router-dom";
import { useLocation as useLocationApi } from "../hooks/usePokeApi";
import { useQuery } from "@tanstack/react-query";
import { api, formatName, extractIdFromUrl, getSprite } from "../services/pokeapi";
import { FRLG_LOCATIONS } from "../data/frlg-locations";
import type { LocationAreaData } from "../services/pokeapi";

export default function LocationDetail() {
  const { id } = useParams<{ id: string }>();
  const numId = Number(id);
  const staticLoc = FRLG_LOCATIONS.find(l => l.id === numId);

  const { data: location, isLoading } = useLocationApi(numId);

  const { data: areas } = useQuery<LocationAreaData[]>({
    queryKey: ["location-areas", numId],
    queryFn: async () => {
      if (!location?.areas) return [];
      return Promise.all(
        location.areas.map(a => {
          const areaId = extractIdFromUrl(a.url);
          return api.getLocationArea(areaId);
        })
      );
    },
    enabled: !!location?.areas?.length,
    staleTime: 24 * 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-fire-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = staticLoc?.displayName ?? (location ? formatName(location.name) : "Unknown");

  const frlgPokemonMap = new Map<string, { methods: string[]; levels: string; pokemonId: number }>();
  areas?.forEach(area => {
    area.pokemon_encounters.forEach(enc => {
      const frlgVersions = enc.version_details.filter(
        v => v.version.name === "firered" || v.version.name === "leafgreen"
      );
      if (frlgVersions.length === 0) return;
      const pokemonId = extractIdFromUrl(enc.pokemon.url);
      const methods = new Set<string>();
      let minLv = 100, maxLv = 0;
      frlgVersions.forEach(v => {
        v.encounter_details.forEach(d => {
          methods.add(d.method.name);
          minLv = Math.min(minLv, d.min_level);
          maxLv = Math.max(maxLv, d.max_level);
        });
      });
      const key = enc.pokemon.name;
      if (!frlgPokemonMap.has(key)) {
        frlgPokemonMap.set(key, {
          methods: [...methods],
          levels: minLv === maxLv ? `Lv.${minLv}` : `Lv.${minLv}-${maxLv}`,
          pokemonId,
        });
      }
    });
  });

  const pokemonList = [...frlgPokemonMap.entries()].sort((a, b) => a[1].pokemonId - b[1].pokemonId);

  return (
    <div className="animate-fade-in-up">
      <Link to="/locations" className="text-fire-red hover:text-fire-dark text-sm font-medium">
        ← Back to Locations
      </Link>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mt-4">
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6">
          <h1 className="font-retro text-xl text-white">{displayName}</h1>
          {location?.region && (
            <p className="text-white/70 text-sm mt-1">{formatName(location.region.name)} Region</p>
          )}
        </div>

        <div className="p-6">
          {pokemonList.length > 0 ? (
            <>
              <h2 className="font-retro text-xs text-fire-dark mb-4">
                Pokémon Available ({pokemonList.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {pokemonList.map(([name, info]) => (
                  <Link
                    key={name}
                    to={`/pokedex/${info.pokemonId}`}
                    className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors group"
                  >
                    <img
                      src={getSprite(info.pokemonId)}
                      alt={name}
                      className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">{formatName(name)}</p>
                      <p className="text-xs text-gray-500">{info.levels}</p>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {info.methods.map(m => (
                          <span key={m} className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                            {formatName(m)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No wild Pokémon encounter data available for this location.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
