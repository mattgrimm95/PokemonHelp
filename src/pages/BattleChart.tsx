import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { KANTO_DEX } from "../data/frlg-pokemon";
import { EFFECTIVENESS, TYPE_COLORS, type PokemonType } from "../data/typeChart";
import { api, formatName, getSprite, getOfficialArtwork, type PokemonData, type MoveData } from "../services/pokeapi";
import TypeBadge from "../components/TypeBadge";

interface PickerProps {
  label: string;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onClear: () => void;
  pokemon: PokemonData | undefined;
}

function PokemonPicker({ label, selectedId, onSelect, onClear, pokemon }: PickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return KANTO_DEX;
    const q = search.toLowerCase();
    return KANTO_DEX.filter(p => p.name.includes(q) || String(p.id).includes(q));
  }, [search]);

  const handleSelect = useCallback((id: number) => {
    onSelect(id);
    setOpen(false);
    setSearch("");
  }, [onSelect]);

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 mb-2 font-medium">{label}</p>
      {selectedId && pokemon ? (
        <div className="bg-white rounded-xl shadow-md p-3 text-center relative border-2 border-transparent hover:border-fire-red/20 transition-all">
          <button
            onClick={onClear}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 transition-colors"
          >
            ✕
          </button>
          <img
            src={getOfficialArtwork(selectedId)}
            alt={pokemon.name}
            className="w-24 h-24 mx-auto object-contain"
          />
          <p className="font-bold text-sm mt-1">{formatName(pokemon.name)}</p>
          <div className="flex gap-1 justify-center mt-1">
            {pokemon.types.map(t => (
              <TypeBadge key={t.type.name} type={t.type.name} size="sm" />
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full min-h-[140px] bg-white/50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-fire-red hover:text-fire-red transition-all"
        >
          <span className="text-3xl mb-1">+</span>
          <span className="text-xs">Select {label}</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setOpen(false); setSearch(""); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-retro text-xs text-fire-dark">Choose {label}</h2>
                <button onClick={() => { setOpen(false); setSearch(""); }} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
              </div>
              <input
                type="text"
                placeholder="Search by name or number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-fire-red/30"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto flex-1 p-3">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1">
                {filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
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
    </div>
  );
}

export default function BattleChart() {
  const [attackerId, setAttackerId] = useState<number | null>(null);
  const [defenderId, setDefenderId] = useState<number | null>(null);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);

  const { data: attacker } = useQuery<PokemonData>({
    queryKey: ["pokemon", attackerId],
    queryFn: () => api.getPokemon(attackerId!),
    staleTime: 24 * 60 * 60 * 1000,
    enabled: !!attackerId,
  });

  const { data: defender } = useQuery<PokemonData>({
    queryKey: ["pokemon", defenderId],
    queryFn: () => api.getPokemon(defenderId!),
    staleTime: 24 * 60 * 60 * 1000,
    enabled: !!defenderId,
  });

  const { data: moveData, isLoading: moveLoading } = useQuery<MoveData>({
    queryKey: ["move", selectedMove],
    queryFn: () => api.getMove(selectedMove!),
    staleTime: 24 * 60 * 60 * 1000,
    enabled: !!selectedMove,
  });

  const frlgMoves = useMemo(() => {
    if (!attacker) return [];
    return attacker.moves
      .filter(m => m.version_group_details.some(v => v.version_group.name === "firered-leafgreen"))
      .map(m => m.move.name)
      .sort((a, b) => a.localeCompare(b));
  }, [attacker]);

  const clearAttacker = useCallback(() => { setAttackerId(null); setSelectedMove(null); }, []);
  const clearDefender = useCallback(() => { setDefenderId(null); }, []);

  const result = useMemo(() => {
    if (!moveData || !defender) return null;
    const moveType = moveData.type.name as PokemonType;
    const defTypes = defender.types.map(t => t.type.name as PokemonType);

    let multiplier = 1;
    for (const d of defTypes) {
      const eff = EFFECTIVENESS[moveType]?.[d];
      multiplier *= eff ?? 1;
    }

    const attackerTypes = attacker?.types.map(t => t.type.name) ?? [];
    const hasStab = attackerTypes.includes(moveType);

    return { moveType, defTypes, multiplier, hasStab };
  }, [moveData, defender, attacker]);

  function describeResult(mult: number): { text: string; color: string; emoji: string } {
    if (mult === 0) return { text: "No Effect", color: "text-gray-500", emoji: "🚫" };
    if (mult === 0.25) return { text: "Doubly Resisted (¼×)", color: "text-red-700", emoji: "🛡️🛡️" };
    if (mult === 0.5) return { text: "Not Very Effective (½×)", color: "text-red-500", emoji: "🛡️" };
    if (mult === 1) return { text: "Normal Damage (1×)", color: "text-gray-700", emoji: "➖" };
    if (mult === 2) return { text: "Super Effective! (2×)", color: "text-green-600", emoji: "💥" };
    if (mult === 4) return { text: "Doubly Super Effective!! (4×)", color: "text-green-700", emoji: "💥💥" };
    return { text: `${mult}× Damage`, color: mult > 1 ? "text-green-600" : "text-red-500", emoji: mult > 1 ? "💥" : "🛡️" };
  }

  return (
    <div className="animate-fade-in-up">
      <h1 className="font-retro text-xl text-fire-dark mb-4">Battle Chart</h1>
      <p className="text-sm text-gray-500 mb-6">Pick an attacker, a defender, and a move to see the type effectiveness bonus.</p>

      {/* Pokemon selectors */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-stretch">
        <PokemonPicker
          label="Attacker"
          selectedId={attackerId}
          onSelect={id => { setAttackerId(id); setSelectedMove(null); }}
          onClear={clearAttacker}
          pokemon={attacker}
        />
        <div className="flex items-center justify-center text-3xl text-gray-300 font-bold shrink-0 self-center">
          ⚔️
        </div>
        <PokemonPicker
          label="Defender"
          selectedId={defenderId}
          onSelect={setDefenderId}
          onClear={clearDefender}
          pokemon={defender}
        />
      </div>

      {/* Move selector */}
      {attacker && frlgMoves.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <h2 className="font-retro text-xs text-fire-dark mb-3">
            Select Move ({frlgMoves.length} available in FRLG)
          </h2>
          <div className="relative">
            <select
              value={selectedMove ?? ""}
              onChange={e => setSelectedMove(e.target.value || null)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-fire-red/30 focus:border-fire-red transition-all text-sm appearance-none"
            >
              <option value="">-- Choose a move --</option>
              {frlgMoves.map(m => (
                <option key={m} value={m}>{formatName(m)}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</div>
          </div>

          {moveData && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <TypeBadge type={moveData.type.name} size="md" />
              <span className="text-xs text-gray-500 capitalize">{moveData.damage_class.name}</span>
              {moveData.power && <span className="text-xs text-gray-500">Power: {moveData.power}</span>}
              {moveData.accuracy && <span className="text-xs text-gray-500">Acc: {moveData.accuracy}%</span>}
              <span className="text-xs text-gray-500">PP: {moveData.pp}</span>
            </div>
          )}
          {moveLoading && <div className="skeleton h-6 w-40 mt-3" />}
        </div>
      )}

      {/* Result display */}
      {result && moveData && defender && attacker && (
        <div
          key={`battle-${selectedMove}-${defenderId}-${attackerId}`}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div
            className={`p-6 text-center relative overflow-hidden ${
              result.multiplier === 0 ? "bg-gray-200" :
              result.multiplier < 1 ? "bg-red-50" :
              result.multiplier > 1 ? "bg-green-50" :
              "bg-gray-50"
            }`}
            style={{ "--move-color": TYPE_COLORS[result.moveType] || "#888" } as React.CSSProperties}
          >
            {/* Projectile that flies attacker → defender */}
            <div className="battle-fly" />
            {/* Impact burst at defender */}
            <div className="battle-impact" />

            <div className="flex items-center justify-center gap-4 mb-4 flex-wrap relative z-[1]">
              <div className="battle-lunge flex flex-col items-center">
                <img src={getSprite(attackerId!)} alt="" className="w-16 h-16 object-contain" style={{ imageRendering: "pixelated" }} />
                <span className="text-xs font-bold">{formatName(attacker.name)}</span>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">uses</p>
                <div className="flex items-center gap-2">
                  <TypeBadge type={moveData.type.name} size="md" />
                  <span className="font-bold text-sm">{formatName(moveData.name)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">on</p>
              </div>
              <div className="battle-shake flex flex-col items-center">
                <img src={getSprite(defenderId!)} alt="" className="w-16 h-16 object-contain" style={{ imageRendering: "pixelated" }} />
                <span className="text-xs font-bold">{formatName(defender.name)}</span>
                <div className="flex gap-1 mt-0.5">
                  {defender.types.map(t => <TypeBadge key={t.type.name} type={t.type.name} size="sm" />)}
                </div>
              </div>
            </div>

            <div className="result-pop">
              {(() => {
                const info = describeResult(result.multiplier);
                return (
                  <div className="mb-3">
                    <p className="text-2xl mb-1">{info.emoji}</p>
                    <p className={`font-retro text-lg ${info.color}`}>{info.text}</p>
                  </div>
                );
              })()}

              {result.hasStab && (
                <div className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                  STAB bonus! (Same Type Attack Bonus -- 1.5× extra damage)
                </div>
              )}

              {result.hasStab && result.multiplier > 0 && (
                <p className="text-sm text-gray-600">
                  Effective multiplier with STAB: <span className="font-bold">{result.multiplier * 1.5}×</span>
                </p>
              )}
            </div>
          </div>

          {/* Move description */}
          {moveData.effect_entries.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">Move Effect</p>
              <p className="text-sm text-gray-700">
                {moveData.effect_entries.find(e => e.language.name === "en")?.short_effect ?? "No description."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!attackerId && !defenderId && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">⚔️</p>
          <p className="font-retro text-xs">Select an Attacker and Defender to get started!</p>
        </div>
      )}
    </div>
  );
}
