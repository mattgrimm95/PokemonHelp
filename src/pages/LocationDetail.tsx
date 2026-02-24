import { useParams, Link } from "react-router-dom";
import { useLocation as useLocationApi } from "../hooks/usePokeApi";
import { useQuery } from "@tanstack/react-query";
import { api, formatName, extractIdFromUrl, getSprite } from "../services/pokeapi";
import { FRLG_LOCATIONS } from "../data/frlg-locations";
import type { LocationAreaData } from "../services/pokeapi";

const FRLG_VERSIONS = new Set(["firered", "leafgreen"]);
const FALLBACK_VERSIONS = new Set(["red", "blue", "yellow", "gold", "silver", "ruby", "sapphire"]);

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

  const frlgPokemonMap = new Map<string, { methods: Set<string>; minLv: number; maxLv: number; pokemonId: number; versionSource: string }>();

  areas?.forEach(area => {
    area.pokemon_encounters.forEach(enc => {
      const pokemonId = extractIdFromUrl(enc.pokemon.url);
      const key = enc.pokemon.name;

      const frlgVersions = enc.version_details.filter(v => FRLG_VERSIONS.has(v.version.name));
      const fallbackVersions = enc.version_details.filter(v => FALLBACK_VERSIONS.has(v.version.name));
      const versionsToUse = frlgVersions.length > 0 ? frlgVersions : fallbackVersions;
      if (versionsToUse.length === 0) return;

      const versionSource = frlgVersions.length > 0 ? "frlg" : "classic";
      const existing = frlgPokemonMap.get(key);
      const methods = existing?.methods ?? new Set<string>();
      let minLv = existing?.minLv ?? 100;
      let maxLv = existing?.maxLv ?? 0;

      versionsToUse.forEach(v => {
        v.encounter_details.forEach(d => {
          methods.add(d.method.name);
          minLv = Math.min(minLv, d.min_level);
          maxLv = Math.max(maxLv, d.max_level);
        });
      });

      frlgPokemonMap.set(key, { methods, minLv, maxLv, pokemonId, versionSource: existing?.versionSource === "frlg" ? "frlg" : versionSource });
    });
  });

  const pokemonList = [...frlgPokemonMap.entries()]
    .sort((a, b) => a[1].pokemonId - b[1].pokemonId)
    .map(([name, info]) => ({
      name,
      pokemonId: info.pokemonId,
      methods: [...info.methods],
      levels: info.minLv === info.maxLv ? `Lv.${info.minLv}` : `Lv.${info.minLv}-${info.maxLv}`,
      approximate: info.versionSource !== "frlg",
    }));

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
          {staticLoc && (
            <div className="mb-6">
              <p className="text-gray-700 text-sm leading-relaxed mb-3">{staticLoc.description}</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-800 mb-1">💡 Fun Fact</p>
                <p className="text-sm text-amber-700">{staticLoc.funFact}</p>
              </div>
            </div>
          )}

          {pokemonList.length > 0 ? (
            <>
              <h2 className="font-retro text-xs text-fire-dark mb-4">
                Pokémon Available ({pokemonList.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {pokemonList.map(p => (
                  <Link
                    key={p.name}
                    to={`/pokedex/${p.pokemonId}`}
                    className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors group"
                  >
                    <img
                      src={getSprite(p.pokemonId)}
                      alt={p.name}
                      className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">{formatName(p.name)}</p>
                      <p className="text-xs text-gray-500">{p.levels}</p>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {p.methods.map(m => (
                          <span key={m} className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                            {formatName(m)}
                          </span>
                        ))}
                        {p.approximate && (
                          <span className="text-[10px] bg-blue-100 px-1.5 py-0.5 rounded text-blue-600">
                            ~ approx
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {pokemonList.some(p => p.approximate) && (
                <p className="text-xs text-gray-400 mt-3">
                  Pokémon marked "~ approx" use encounter data from earlier Kanto games (levels may vary slightly in FRLG).
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No wild Pokémon encounter data available for this location. This is likely a town or city without wild grass.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
