import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usePokemon, useSpecies, useEncounters, useEvolutionChain } from "../hooks/usePokeApi";
import { api, getOfficialArtwork, formatName, extractIdFromUrl, getSprite, type AbilityData } from "../services/pokeapi";
import StatBar from "../components/StatBar";
import TypeBadge from "../components/TypeBadge";

function toFeetInches(meters: number): string {
  const totalInches = meters * 39.3701;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${String(inches).padStart(2, "0")}"`;
}

function toLbs(kg: number): string {
  return `${(kg * 2.20462).toFixed(1)} lbs`;
}

export default function PokemonDetail() {
  const { id } = useParams<{ id: string }>();
  const numId = Number(id);
  const location = useLocation();
  const cameFromEvolution = (location.state as { from?: string } | null)?.from === "evolution";
  const [expandedAbility, setExpandedAbility] = useState<string | null>(null);

  const { data: pokemon, isLoading: loadingPoke } = usePokemon(numId);
  const { data: species, isLoading: loadingSpecies } = useSpecies(numId);
  const { data: encounters } = useEncounters(numId);

  const evoChainId = species?.evolution_chain?.url
    ? extractIdFromUrl(species.evolution_chain.url)
    : undefined;
  const { data: evoChain } = useEvolutionChain(evoChainId);

  if (loadingPoke || loadingSpecies) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-fire-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-retro text-xs">Loading...</p>
        </div>
      </div>
    );
  }

  if (!pokemon || !species) {
    return <p className="text-center text-gray-500 py-12">Pokemon not found.</p>;
  }

  const flavorEntry = species.flavor_text_entries.find(
    e => e.language.name === "en" && (e.version.name === "firered" || e.version.name === "leafgreen")
  ) ?? species.flavor_text_entries.find(e => e.language.name === "en");

  const genus = species.genera.find(g => g.language.name === "en")?.genus ?? "";

  const frlgEncounters = encounters?.filter(enc =>
    enc.version_details.some(v => v.version.name === "firered" || v.version.name === "leafgreen")
  ) ?? [];

  const frlgMoves = pokemon.moves
    .filter(m => m.version_group_details.some(v => v.version_group.name === "firered-leafgreen"))
    .map(m => ({
      name: m.move.name,
      details: m.version_group_details.find(v => v.version_group.name === "firered-leafgreen")!,
    }))
    .sort((a, b) => a.details.level_learned_at - b.details.level_learned_at);

  const bst = pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0);
  const heightM = pokemon.height / 10;
  const weightKg = pokemon.weight / 10;

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-3">
          <Link to="/pokedex" className="text-fire-red hover:text-fire-dark text-sm font-medium">
            ← Pokédex
          </Link>
          {cameFromEvolution && (
            <Link to="/evolution" className="text-cyan-600 hover:text-cyan-800 text-sm font-medium">
              ← Evolution Explorer
            </Link>
          )}
        </div>
        <div className="flex gap-2">
          {numId > 1 && (
            <Link to={`/pokedex/${numId - 1}`} className="px-3 py-1 bg-white rounded-lg shadow text-sm hover:shadow-md transition-shadow">
              ← #{numId - 1}
            </Link>
          )}
          {numId < 151 && (
            <Link to={`/pokedex/${numId + 1}`} className="px-3 py-1 bg-white rounded-lg shadow text-sm hover:shadow-md transition-shadow">
              #{numId + 1} →
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-br from-fire-red to-fire-orange p-6 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img
              src={getOfficialArtwork(numId)}
              alt={pokemon.name}
              className="w-48 h-48 object-contain drop-shadow-2xl animate-float"
            />
            <div className="text-center md:text-left">
              <p className="text-white/60 font-retro text-xs mb-1">#{String(numId).padStart(3, "0")}</p>
              <h1 className="font-retro text-2xl mb-1">{formatName(pokemon.name)}</h1>
              <p className="text-white/80 text-sm mb-3">{genus}</p>
              <div className="flex gap-2 justify-center md:justify-start">
                {pokemon.types.map(t => (
                  <TypeBadge key={t.type.name} type={t.type.name} size="lg" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-retro text-xs text-fire-dark mb-3">Description</h2>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              {flavorEntry?.flavor_text.replace(/[\n\f]/g, " ") ?? "No description available."}
            </p>

            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Height</p>
                <p className="font-bold text-sm">{toFeetInches(heightM)}</p>
                <p className="text-[10px] text-gray-400">{heightM.toFixed(1)}m</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Weight</p>
                <p className="font-bold text-sm">{toLbs(weightKg)}</p>
                <p className="text-[10px] text-gray-400">{weightKg.toFixed(1)}kg</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Base Exp</p>
                <p className="font-bold text-sm">{pokemon.base_experience}</p>
              </div>
            </div>

            <h3 className="font-semibold text-sm text-gray-800 mb-2">Abilities <span className="text-xs text-gray-400 font-normal">(click for details)</span></h3>
            <div className="space-y-2 mb-4">
              {pokemon.abilities.map(a => (
                <AbilityButton
                  key={a.ability.name}
                  name={a.ability.name}
                  isHidden={a.is_hidden}
                  expanded={expandedAbility === a.ability.name}
                  onToggle={() => setExpandedAbility(expandedAbility === a.ability.name ? null : a.ability.name)}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-retro text-xs text-fire-dark mb-3">Base Stats</h2>
            <div className="space-y-2 mb-2">
              {pokemon.stats.map(s => (
                <StatBar key={s.stat.name} statName={s.stat.name} value={s.base_stat} />
              ))}
            </div>
            <p className="text-right text-sm font-bold text-gray-600">Total: {bst}</p>
          </div>

          {frlgEncounters.length > 0 && (
            <div>
              <h2 className="font-retro text-xs text-fire-dark mb-3">Where to Find (FRLG)</h2>
              <div className="space-y-2">
                {frlgEncounters.map(enc => (
                  <div key={enc.location_area.name} className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-sm text-gray-800">{formatName(enc.location_area.name)}</p>
                    {enc.version_details
                      .filter(v => v.version.name === "firered" || v.version.name === "leafgreen")
                      .map((v, i) => (
                        <p key={i} className="text-xs text-gray-500 mt-1">
                          {formatName(v.version.name)} — {v.encounter_details.map(d => `${formatName(d.method.name)} (Lv.${d.min_level}-${d.max_level}, ${d.chance}%)`).join(", ")}
                        </p>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {evoChain && (
            <div>
              <h2 className="font-retro text-xs text-fire-dark mb-3">Evolution Chain</h2>
              <EvolutionDisplay chain={evoChain.chain} />
            </div>
          )}

          <div className="md:col-span-2">
            <details>
              <summary className="font-retro text-xs text-fire-dark mb-3 cursor-pointer">
                Learnable Moves (FRLG) — {frlgMoves.length} moves
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3 max-h-96 overflow-y-auto">
                {frlgMoves.map((m, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-xs flex justify-between items-center">
                    <span className="font-medium">{formatName(m.name)}</span>
                    <span className="text-gray-400">
                      {m.details.move_learn_method.name === "level-up"
                        ? `Lv.${m.details.level_learned_at}`
                        : formatName(m.details.move_learn_method.name)}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbilityButton({ name, isHidden, expanded, onToggle }: { name: string; isHidden: boolean; expanded: boolean; onToggle: () => void }) {
  const { data: ability, isLoading } = useQuery<AbilityData>({
    queryKey: ["ability", name],
    queryFn: () => api.getAbility(name),
    staleTime: 24 * 60 * 60 * 1000,
    enabled: expanded,
  });

  const effectText = ability?.effect_entries.find(e => e.language.name === "en")?.short_effect
    ?? ability?.flavor_text_entries.find(e => e.language.name === "en")?.flavor_text;

  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between gap-2 ${
          isHidden ? "bg-purple-100 text-purple-700 hover:bg-purple-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        } ${expanded ? "ring-2 ring-fire-red/30" : ""}`}
      >
        <span>{formatName(name)}{isHidden ? " (Hidden)" : ""}</span>
        <span className={`transition-transform ${expanded ? "rotate-180" : ""}`}>▾</span>
      </button>
      {expanded && (
        <div className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-100 animate-fade-in-up">
          {isLoading ? (
            <div className="skeleton h-4 w-3/4" />
          ) : effectText ? (
            <p>{effectText}</p>
          ) : (
            <p className="text-gray-400 italic">No description available.</p>
          )}
        </div>
      )}
    </div>
  );
}

function EvolutionDisplay({ chain }: { chain: import("../services/pokeapi").EvolutionChainLink }) {
  const nodes: { name: string; id: number; trigger: string }[] = [];

  function walk(link: import("../services/pokeapi").EvolutionChainLink, depth: number) {
    const id = extractIdFromUrl(link.species.url);
    let trigger = "";
    if (link.evolution_details.length > 0) {
      const d = link.evolution_details[0];
      if (d.min_level) trigger = `Lv. ${d.min_level}`;
      else if (d.item) trigger = formatName(d.item.name);
      else if (d.trigger.name === "trade") trigger = "Trade";
      else if (d.min_happiness) trigger = `Happiness ${d.min_happiness}`;
      else trigger = formatName(d.trigger.name);
    }
    nodes.push({ name: link.species.name, id, trigger });
    for (const evo of link.evolves_to) {
      walk(evo, depth + 1);
    }
  }
  walk(chain, 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {nodes.map((n, i) => (
        <div key={n.id} className="flex items-center gap-2">
          {i > 0 && (
            <div className="text-center">
              <span className="text-gray-400 text-lg">→</span>
              <p className="text-[10px] text-gray-500">{n.trigger}</p>
            </div>
          )}
          <Link to={`/pokedex/${n.id}`} className="flex flex-col items-center group">
            <img
              src={getSprite(n.id)}
              alt={n.name}
              className="w-16 h-16 object-contain group-hover:scale-110 transition-transform"
              style={{ imageRendering: "pixelated" }}
            />
            <span className="text-xs font-medium text-gray-700">{formatName(n.name)}</span>
          </Link>
        </div>
      ))}
    </div>
  );
}
