import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { KANTO_DEX } from "../data/frlg-pokemon";
import { TYPES, type PokemonType, EFFECTIVENESS } from "../data/typeChart";
import { api, formatName, getSprite, type PokemonData } from "../services/pokeapi";
import { getAttackCoverage, suggestCoverageTypes } from "../services/typeEffectiveness";
import TypeBadge from "../components/TypeBadge";
import StatBar from "../components/StatBar";

interface TeamSlot {
  pokemonId: number | null;
  moves: string[];
}

const EMPTY_TEAM: TeamSlot[] = Array.from({ length: 6 }, () => ({ pokemonId: null, moves: [] }));

function loadTeam(): TeamSlot[] {
  try {
    const raw = localStorage.getItem("pokemon-help-team");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return EMPTY_TEAM;
}

function saveTeam(team: TeamSlot[]) {
  localStorage.setItem("pokemon-help-team", JSON.stringify(team));
}

export default function TeamBuilder() {
  const [team, setTeam] = useState<TeamSlot[]>(loadTeam);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { saveTeam(team); }, [team]);

  const filledIds = team.filter(s => s.pokemonId !== null).map(s => s.pokemonId!);

  const { data: pokemonDataMap } = useQuery<Record<number, PokemonData>>({
    queryKey: ["team-pokemon", filledIds.join(",")],
    queryFn: async () => {
      const results = await Promise.all(filledIds.map(id => api.getPokemon(id)));
      const map: Record<number, PokemonData> = {};
      results.forEach(p => { map[p.id] = p; });
      return map;
    },
    enabled: filledIds.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const teamTypes: PokemonType[][] = useMemo(() => {
    if (!pokemonDataMap) return [];
    return team
      .filter(s => s.pokemonId && pokemonDataMap[s.pokemonId])
      .map(s => pokemonDataMap[s.pokemonId!]!.types.map(t => t.type.name as PokemonType));
  }, [team, pokemonDataMap]);

  const teamBst = useMemo(() => {
    if (!pokemonDataMap) return null;
    const stats: Record<string, number[]> = {};
    team.forEach(s => {
      if (!s.pokemonId || !pokemonDataMap[s.pokemonId]) return;
      pokemonDataMap[s.pokemonId]!.stats.forEach(st => {
        if (!stats[st.stat.name]) stats[st.stat.name] = [];
        stats[st.stat.name].push(st.base_stat);
      });
    });
    return stats;
  }, [team, pokemonDataMap]);

  const defensiveAnalysis = useMemo(() => {
    if (teamTypes.length === 0) return null;
    const weaknesses: PokemonType[] = [];
    const resistances: PokemonType[] = [];
    for (const atkType of TYPES) {
      let weakCount = 0, resistCount = 0;
      for (const defTypes of teamTypes) {
        let mult = 1;
        for (const d of defTypes) mult *= EFFECTIVENESS[atkType][d];
        if (mult >= 2) weakCount++;
        if (mult < 1) resistCount++;
      }
      if (weakCount >= 3) weaknesses.push(atkType);
      if (resistCount >= 3) resistances.push(atkType);
    }
    return { weaknesses, resistances };
  }, [teamTypes]);

  const setPokemon = useCallback((slotIdx: number, pokemonId: number) => {
    setTeam(prev => {
      const next = [...prev];
      next[slotIdx] = { pokemonId, moves: [] };
      return next;
    });
    setEditingSlot(null);
    setSearch("");
  }, []);

  const removePokemon = useCallback((slotIdx: number) => {
    setTeam(prev => {
      const next = [...prev];
      next[slotIdx] = { pokemonId: null, moves: [] };
      return next;
    });
  }, []);

  const filteredPokemon = useMemo(() => {
    if (!search) return KANTO_DEX;
    const q = search.toLowerCase();
    return KANTO_DEX.filter(p =>
      p.name.includes(q) || String(p.id).includes(q)
    );
  }, [search]);

  return (
    <div className="animate-fade-in-up">
      <h1 className="font-retro text-xl text-fire-dark mb-4">Team Builder</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {team.map((slot, idx) => (
          <div key={idx} className="relative">
            {slot.pokemonId && pokemonDataMap?.[slot.pokemonId] ? (
              <div className="bg-white rounded-xl shadow-md p-3 text-center border-2 border-transparent hover:border-fire-red/30 transition-all">
                <button
                  onClick={() => removePokemon(idx)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 transition-colors z-10"
                >
                  ✕
                </button>
                <Link to={`/pokedex/${slot.pokemonId}`}>
                  <img
                    src={getSprite(slot.pokemonId)}
                    alt=""
                    className="w-16 h-16 mx-auto object-contain hover:scale-110 transition-transform"
                    style={{ imageRendering: "pixelated" }}
                  />
                </Link>
                <p className="font-bold text-xs mt-1 truncate">
                  {formatName(pokemonDataMap[slot.pokemonId]!.name)}
                </p>
                <div className="flex gap-1 justify-center mt-1">
                  {pokemonDataMap[slot.pokemonId]!.types.map(t => (
                    <TypeBadge key={t.type.name} type={t.type.name} size="sm" />
                  ))}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingSlot(idx)}
                className="w-full h-full min-h-[130px] bg-white/50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-fire-red hover:text-fire-red transition-all"
              >
                <span className="text-3xl mb-1">+</span>
                <span className="text-xs">Slot {idx + 1}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {editingSlot !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setEditingSlot(null); setSearch(""); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-retro text-xs text-fire-dark">Choose Pokémon</h2>
                <button onClick={() => { setEditingSlot(null); setSearch(""); }} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
              </div>
              <input
                type="text"
                placeholder="Search by name or number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-fire-red/30"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-2">{filteredPokemon.length} Pokémon</p>
            </div>
            <div className="overflow-y-auto flex-1 p-3">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1">
                {filteredPokemon.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPokemon(editingSlot, p.id)}
                    className="flex flex-col items-center p-1.5 rounded-lg hover:bg-fire-red/10 transition-colors group"
                  >
                    <img
                      src={getSprite(p.id)}
                      alt=""
                      className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
                      style={{ imageRendering: "pixelated" }}
                      loading="lazy"
                    />
                    <span className="text-[10px] font-medium mt-0.5 text-gray-700 truncate w-full text-center">
                      {formatName(p.name)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {filledIds.length > 0 && pokemonDataMap && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="font-retro text-xs text-fire-dark mb-3">Team Weaknesses</h2>
            {defensiveAnalysis && (
              <>
                {defensiveAnalysis.weaknesses.length > 0 ? (
                  <div className="mb-3">
                    <p className="text-xs text-red-600 font-medium mb-1">⚠️ Weak to (3+ members):</p>
                    <div className="flex flex-wrap gap-1">
                      {defensiveAnalysis.weaknesses.map(t => <TypeBadge key={t} type={t} size="sm" />)}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-green-600 mb-3">✅ No major shared weaknesses</p>
                )}
                {defensiveAnalysis.resistances.length > 0 && (
                  <div>
                    <p className="text-xs text-green-600 font-medium mb-1">🛡️ Well covered against:</p>
                    <div className="flex flex-wrap gap-1">
                      {defensiveAnalysis.resistances.map(t => <TypeBadge key={t} type={t} size="sm" />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="font-retro text-xs text-fire-dark mb-3">Team Stats Average</h2>
            {teamBst && (
              <div className="space-y-1.5">
                {Object.entries(teamBst).map(([name, values]) => (
                  <StatBar
                    key={name}
                    statName={name}
                    value={Math.round(values.reduce((a, b) => a + b, 0) / values.length)}
                  />
                ))}
              </div>
            )}
            <p className="text-right text-xs text-gray-500 mt-2">
              Total BST: {filledIds.reduce((sum, id) => {
                const p = pokemonDataMap[id];
                return sum + (p?.stats.reduce((s, st) => s + st.base_stat, 0) ?? 0);
              }, 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 md:col-span-2">
            <h2 className="font-retro text-xs text-fire-dark mb-3">Offensive Type Coverage</h2>
            <p className="text-xs text-gray-500 mb-3">
              Types your team's STAB moves can hit super-effectively:
            </p>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const stabTypes: PokemonType[] = [];
                filledIds.forEach(id => {
                  const p = pokemonDataMap[id];
                  if (p) p.types.forEach(t => {
                    if (!stabTypes.includes(t.type.name as PokemonType))
                      stabTypes.push(t.type.name as PokemonType);
                  });
                });
                const coverage = getAttackCoverage(stabTypes);
                return (
                  <>
                    <div className="w-full">
                      <p className="text-xs font-medium text-green-700 mb-1">Super Effective ({coverage.superEffective.length}):</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {coverage.superEffective.map(t => <TypeBadge key={t} type={t} size="sm" />)}
                        {coverage.superEffective.length === 0 && <span className="text-xs text-gray-400">None</span>}
                      </div>
                    </div>
                    <div className="w-full">
                      <p className="text-xs font-medium text-red-700 mb-1">Not Covered ({coverage.notVeryEffective.length + coverage.immune.length}):</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {[...coverage.notVeryEffective, ...coverage.immune].map(t => <TypeBadge key={t} type={t} size="sm" />)}
                        {coverage.notVeryEffective.length === 0 && coverage.immune.length === 0 && <span className="text-xs text-gray-400">All covered!</span>}
                      </div>
                    </div>
                    {suggestCoverageTypes(stabTypes).length > 0 && (
                      <div className="w-full">
                        <p className="text-xs font-medium text-blue-700 mb-1">💡 Recommended types to add:</p>
                        <div className="flex flex-wrap gap-1">
                          {suggestCoverageTypes(stabTypes).map(t => <TypeBadge key={t} type={t} size="sm" />)}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {filledIds.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">⚔️</p>
          <p className="font-retro text-xs">Click a slot to add Pokémon to your team!</p>
        </div>
      )}
    </div>
  );
}
