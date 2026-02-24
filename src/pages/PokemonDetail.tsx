import { useParams, Link } from "react-router-dom";
import { usePokemon, useSpecies, useEncounters, useEvolutionChain } from "../hooks/usePokeApi";
import { getOfficialArtwork, formatName, extractIdFromUrl, getSprite } from "../services/pokeapi";
import StatBar from "../components/StatBar";
import TypeBadge from "../components/TypeBadge";

export default function PokemonDetail() {
  const { id } = useParams<{ id: string }>();
  const numId = Number(id);

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

  return (
    <div className="animate-fade-in-up">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Link to="/pokedex" className="text-fire-red hover:text-fire-dark text-sm font-medium">
          ← Back to Pokédex
        </Link>
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
        {/* Header */}
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
          {/* Description */}
          <div>
            <h2 className="font-retro text-xs text-fire-dark mb-3">Description</h2>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              {flavorEntry?.flavor_text.replace(/[\n\f]/g, " ") ?? "No description available."}
            </p>

            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Height</p>
                <p className="font-bold text-sm">{(pokemon.height / 10).toFixed(1)}m</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Weight</p>
                <p className="font-bold text-sm">{(pokemon.weight / 10).toFixed(1)}kg</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Base Exp</p>
                <p className="font-bold text-sm">{pokemon.base_experience}</p>
              </div>
            </div>

            <h3 className="font-semibold text-sm text-gray-800 mb-2">Abilities</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {pokemon.abilities.map(a => (
                <span key={a.ability.name} className={`px-3 py-1 rounded-full text-xs font-medium ${a.is_hidden ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}>
                  {formatName(a.ability.name)}{a.is_hidden ? " (Hidden)" : ""}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div>
            <h2 className="font-retro text-xs text-fire-dark mb-3">Base Stats</h2>
            <div className="space-y-2 mb-2">
              {pokemon.stats.map(s => (
                <StatBar key={s.stat.name} statName={s.stat.name} value={s.base_stat} />
              ))}
            </div>
            <p className="text-right text-sm font-bold text-gray-600">Total: {bst}</p>
          </div>

          {/* Encounters */}
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

          {/* Evolution Chain */}
          {evoChain && (
            <div>
              <h2 className="font-retro text-xs text-fire-dark mb-3">Evolution Chain</h2>
              <EvolutionDisplay chain={evoChain.chain} />
            </div>
          )}

          {/* Moves (collapsible) */}
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
