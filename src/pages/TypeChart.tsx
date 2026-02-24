import { useState, useMemo } from "react";
import { TYPES, EFFECTIVENESS, TYPE_COLORS, type PokemonType } from "../data/typeChart";
import TypeBadge from "../components/TypeBadge";

function effectivenessLabel(v: number): string {
  if (v === 0) return "0";
  if (v === 0.5) return "½";
  if (v === 2) return "2";
  return "";
}

function effectivenessColor(v: number): string {
  if (v === 0) return "bg-gray-900 text-gray-400";
  if (v === 0.5) return "bg-red-200 text-red-800";
  if (v === 2) return "bg-green-300 text-green-900";
  return "bg-gray-50";
}

function toggleType(arr: PokemonType[], t: PokemonType): PokemonType[] {
  if (arr.includes(t)) return arr.filter(x => x !== t);
  if (arr.length >= 2) return [arr[1], t];
  return [...arr, t];
}

function calcMultiplier(atkTypes: PokemonType[], defTypes: PokemonType[]): number {
  let best = 0;
  for (const atk of atkTypes) {
    let mult = 1;
    for (const def of defTypes) {
      mult *= EFFECTIVENESS[atk][def];
    }
    best = Math.max(best, mult);
  }
  return best;
}

function describeResult(v: number): { text: string; class: string } {
  if (v === 0) return { text: "No Effect (0×)", class: "text-gray-500" };
  if (v === 0.25) return { text: "Doubly Resisted (¼×)", class: "text-red-700" };
  if (v === 0.5) return { text: "Not Very Effective (½×)", class: "text-red-500" };
  if (v === 1) return { text: "Normal (1×)", class: "text-gray-700" };
  if (v === 2) return { text: "Super Effective! (2×)", class: "text-green-600" };
  if (v === 4) return { text: "Doubly Super Effective!! (4×)", class: "text-green-700 font-bold" };
  return { text: `${v}×`, class: v > 1 ? "text-green-600" : "text-red-500" };
}

export default function TypeChart() {
  const [atkTypes, setAtkTypes] = useState<PokemonType[]>([]);
  const [defTypes, setDefTypes] = useState<PokemonType[]>([]);

  const quickResult = useMemo(() => {
    if (atkTypes.length === 0 || defTypes.length === 0) return null;
    return calcMultiplier(atkTypes, defTypes);
  }, [atkTypes, defTypes]);

  const resultInfo = quickResult !== null ? describeResult(quickResult) : null;

  return (
    <div className="animate-fade-in-up">
      <h1 className="font-retro text-xl text-fire-dark mb-4">Type Chart</h1>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="font-retro text-xs text-fire-dark mb-1">Quick Lookup</h2>
        <p className="text-xs text-gray-400 mb-4">Select up to 2 types per side for dual-type matchups</p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <p className="text-xs text-gray-500 mb-2 text-center">
              Attacking Type{atkTypes.length === 2 ? "s" : ""}
              {atkTypes.length > 0 && (
                <button onClick={() => setAtkTypes([])} className="ml-2 text-gray-400 hover:text-gray-600">✕ clear</button>
              )}
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {TYPES.map(t => (
                <TypeBadge
                  key={t}
                  type={t}
                  size="sm"
                  onClick={() => setAtkTypes(toggleType(atkTypes, t))}
                  selected={atkTypes.includes(t)}
                />
              ))}
            </div>
          </div>

          <div className="text-3xl text-gray-300 font-bold shrink-0">→</div>

          <div className="flex-1 w-full">
            <p className="text-xs text-gray-500 mb-2 text-center">
              Defending Type{defTypes.length === 2 ? "s" : ""}
              {defTypes.length > 0 && (
                <button onClick={() => setDefTypes([])} className="ml-2 text-gray-400 hover:text-gray-600">✕ clear</button>
              )}
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {TYPES.map(t => (
                <TypeBadge
                  key={t}
                  type={t}
                  size="sm"
                  onClick={() => setDefTypes(toggleType(defTypes, t))}
                  selected={defTypes.includes(t)}
                />
              ))}
            </div>
          </div>
        </div>

        {resultInfo && (
          <div className="mt-6 text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-3 bg-gray-50 rounded-xl px-6 py-4 flex-wrap justify-center">
              <div className="flex gap-1 items-center">
                {atkTypes.map(t => <TypeBadge key={t} type={t} size="lg" />)}
              </div>
              <span className="text-gray-400 font-bold">vs</span>
              <div className="flex gap-1 items-center">
                {defTypes.map(t => <TypeBadge key={t} type={t} size="lg" />)}
              </div>
              <span className="text-gray-400 font-bold">=</span>
              <span className={`font-retro text-base sm:text-lg ${resultInfo.class}`}>
                {resultInfo.text}
              </span>
            </div>
            {atkTypes.length === 2 && (
              <p className="text-xs text-gray-400 mt-2">
                Best result from either attacking type is shown (a Pokémon uses one move at a time)
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-4 overflow-x-auto">
        <h2 className="font-retro text-xs text-fire-dark mb-4">Full Type Matrix</h2>
        <p className="text-xs text-gray-500 mb-3">Rows = Attacking type, Columns = Defending type</p>
        <div className="min-w-[700px]">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr>
                <th className="p-1 text-right text-gray-500">ATK ↓ / DEF →</th>
                {TYPES.map(t => (
                  <th key={t} className="p-1">
                    <div
                      className="w-full py-1 rounded text-white font-bold text-center"
                      style={{ backgroundColor: TYPE_COLORS[t] }}
                    >
                      {t.slice(0, 3).toUpperCase()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TYPES.map(atk => (
                <tr key={atk} className="hover:bg-gray-50/50">
                  <td className="p-1 text-right pr-2">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-white font-bold"
                      style={{ backgroundColor: TYPE_COLORS[atk] }}
                    >
                      {atk.slice(0, 3).toUpperCase()}
                    </span>
                  </td>
                  {TYPES.map(def => {
                    const v = EFFECTIVENESS[atk][def];
                    return (
                      <td key={def} className="p-0.5">
                        <div className={`w-full aspect-square flex items-center justify-center rounded font-bold ${effectivenessColor(v)}`}>
                          {effectivenessLabel(v)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-600 justify-center flex-wrap">
          <span className="flex items-center gap-1"><span className="w-4 h-4 bg-green-300 rounded inline-block" /> 2× Super Effective</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 bg-red-200 rounded inline-block" /> ½× Not Very Effective</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 bg-gray-900 rounded inline-block" /> 0 Immune</span>
        </div>
      </div>
    </div>
  );
}
