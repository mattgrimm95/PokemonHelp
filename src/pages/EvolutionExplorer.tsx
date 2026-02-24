import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { KANTO_DEX } from "../data/frlg-pokemon";
import { api, formatName, extractIdFromUrl, getSprite, type EvolutionChainData, type EvolutionChainLink } from "../services/pokeapi";

const CHAIN_IDS = [
  1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,
  21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,
  41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,
  61,62,63,64,65,66,67,
];

interface FlatEvo {
  name: string;
  id: number;
  trigger: string;
}

function flattenChain(link: EvolutionChainLink): FlatEvo[][] {
  const id = extractIdFromUrl(link.species.url);
  const base: FlatEvo = { name: link.species.name, id, trigger: "" };

  if (link.evolves_to.length === 0) {
    return [[base]];
  }

  const paths: FlatEvo[][] = [];
  for (const evo of link.evolves_to) {
    const detail = evo.evolution_details[0];
    let trigger = "";
    if (detail) {
      if (detail.min_level) trigger = `Lv. ${detail.min_level}`;
      else if (detail.item) trigger = formatName(detail.item.name);
      else if (detail.trigger?.name === "trade") trigger = "Trade";
      else if (detail.min_happiness) trigger = `Happiness`;
      else if (detail.trigger) trigger = formatName(detail.trigger.name);
    }

    const subPaths = flattenChain(evo);
    for (const sub of subPaths) {
      sub[0].trigger = trigger;
      paths.push([base, ...sub]);
    }
  }
  return paths;
}

export default function EvolutionExplorer() {
  const [search, setSearch] = useState("");

  const { data: chains, isLoading } = useQuery<EvolutionChainData[]>({
    queryKey: ["all-evolution-chains"],
    queryFn: async () => {
      const results: EvolutionChainData[] = [];
      for (let i = 0; i < CHAIN_IDS.length; i += 10) {
        const batch = CHAIN_IDS.slice(i, i + 10);
        const batchResults = await Promise.all(
          batch.map(id => api.getEvolutionChain(id).catch(() => null))
        );
        results.push(...batchResults.filter((r): r is EvolutionChainData => r !== null));
      }
      return results;
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  const kantoChains = useMemo(() => {
    if (!chains) return [];
    const kantoIds = new Set(KANTO_DEX.map(p => p.id));
    return chains.filter(c => {
      const baseId = extractIdFromUrl(c.chain.species.url);
      return kantoIds.has(baseId);
    });
  }, [chains]);

  const filtered = useMemo(() => {
    if (!search) return kantoChains;
    const q = search.toLowerCase();
    return kantoChains.filter(c => {
      const paths = flattenChain(c.chain);
      return paths.some(path => path.some(node => node.name.includes(q)));
    });
  }, [kantoChains, search]);

  return (
    <div className="animate-fade-in-up">
      <h1 className="font-retro text-xl text-fire-dark mb-4">Evolution Explorer</h1>

      <input
        type="text"
        placeholder="Search by Pokémon name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-fire-red/30 focus:border-fire-red transition-all text-sm mb-6"
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(chain => {
            const paths = flattenChain(chain.chain);
            const isSingleStage = paths.every(p => p.length === 1);
            if (isSingleStage) return null;

            return (
              <div key={chain.id} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
                {paths.map((path, pi) => (
                  <div key={pi} className={`flex items-center gap-1 flex-wrap ${pi > 0 ? "mt-3 pt-3 border-t border-gray-100" : ""}`}>
                    {path.map((node, ni) => (
                      <div key={node.id} className="flex items-center gap-1">
                        {ni > 0 && (
                          <div className="flex flex-col items-center mx-1">
                            <span className="text-xl text-gray-300">→</span>
                            {node.trigger && (
                              <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                {node.trigger}
                              </span>
                            )}
                          </div>
                        )}
                        <Link
                          to={`/pokedex/${node.id}`}
                          className="flex flex-col items-center group shrink-0"
                        >
                          <img
                            src={getSprite(node.id)}
                            alt={node.name}
                            className="w-14 h-14 sm:w-16 sm:h-16 object-contain group-hover:scale-110 transition-transform"
                            style={{ imageRendering: "pixelated" }}
                            loading="lazy"
                          />
                          <span className="text-xs font-medium text-gray-700 group-hover:text-fire-red transition-colors">
                            {formatName(node.name)}
                          </span>
                        </Link>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
