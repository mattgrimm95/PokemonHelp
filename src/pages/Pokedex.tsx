import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { KANTO_DEX } from "../data/frlg-pokemon";
import { TYPES, type PokemonType } from "../data/typeChart";
import { api, type PokemonData } from "../services/pokeapi";
import PokemonCard from "../components/PokemonCard";
import TypeBadge from "../components/TypeBadge";

export default function Pokedex() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<PokemonType | "">("");

  const { data: allPokemon, isLoading } = useQuery<PokemonData[]>({
    queryKey: ["all-kanto-pokemon"],
    queryFn: async () => {
      const batches: PokemonData[][] = [];
      for (let i = 0; i < KANTO_DEX.length; i += 20) {
        const batch = KANTO_DEX.slice(i, i + 20);
        const results = await Promise.all(batch.map(p => api.getPokemon(p.id)));
        batches.push(results);
      }
      return batches.flat();
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    if (!allPokemon) return [];
    return allPokemon.filter(p => {
      const matchSearch = !search || p.name.includes(search.toLowerCase()) || String(p.id).includes(search);
      const matchType = !typeFilter || p.types.some(t => t.type.name === typeFilter);
      return matchSearch && matchType;
    });
  }, [allPokemon, search, typeFilter]);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <h1 className="font-retro text-xl text-fire-dark mb-4">Pokédex</h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by name or number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-fire-red/30 focus:border-fire-red transition-all text-sm"
          />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as PokemonType | "")}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-fire-red/30 focus:border-fire-red transition-all text-sm"
          >
            <option value="">All Types</option>
            {TYPES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        {typeFilter && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-500">Filtering:</span>
            <TypeBadge type={typeFilter} onClick={() => setTypeFilter("")} />
            <button onClick={() => setTypeFilter("")} className="text-xs text-gray-400 hover:text-gray-600">✕ clear</button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="skeleton h-32" />
              <div className="p-3">
                <div className="skeleton h-4 w-3/4 mx-auto mb-2" />
                <div className="skeleton h-3 w-1/2 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">{filtered.length} Pokémon found</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {filtered.map(p => (
              <PokemonCard
                key={p.id}
                id={p.id}
                name={p.name}
                types={p.types.map(t => t.type.name)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
