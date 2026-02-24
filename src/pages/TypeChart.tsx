import { useState } from "react";
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

export default function TypeChart() {
  const [atkType, setAtkType] = useState<PokemonType | null>(null);
  const [defType, setDefType] = useState<PokemonType | null>(null);

  const quickResult = atkType && defType ? EFFECTIVENESS[atkType][defType] : null;

  return (
    <div className="animate-fade-in-up">
      <h1 className="font-retro text-xl text-fire-dark mb-4">Type Chart</h1>

      {/* Quick lookup */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="font-retro text-xs text-fire-dark mb-4">Quick Lookup</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <p className="text-xs text-gray-500 mb-2 text-center">Attacking Type</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {TYPES.map(t => (
                <TypeBadge
                  key={t}
                  type={t}
                  size="sm"
                  onClick={() => setAtkType(atkType === t ? null : t)}
                  selected={atkType === t}
                />
              ))}
            </div>
          </div>

          <div className="text-3xl text-gray-300 font-bold">→</div>

          <div className="flex-1 w-full">
            <p className="text-xs text-gray-500 mb-2 text-center">Defending Type</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {TYPES.map(t => (
                <TypeBadge
                  key={t}
                  type={t}
                  size="sm"
                  onClick={() => setDefType(defType === t ? null : t)}
                  selected={defType === t}
                />
              ))}
            </div>
          </div>
        </div>

        {quickResult !== null && (
          <div className="mt-6 text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-3 bg-gray-50 rounded-xl px-6 py-4">
              <TypeBadge type={atkType!} size="lg" />
              <span className="text-gray-400 font-bold">vs</span>
              <TypeBadge type={defType!} size="lg" />
              <span className="text-gray-400 font-bold">=</span>
              <span className={`font-retro text-lg ${
                quickResult === 0 ? "text-gray-500" :
                quickResult < 1 ? "text-red-500" :
                quickResult > 1 ? "text-green-600" : "text-gray-700"
              }`}>
                {quickResult === 0 ? "No Effect" :
                 quickResult === 0.5 ? "Not Very Effective (½×)" :
                 quickResult === 2 ? "Super Effective! (2×)" :
                 "Normal (1×)"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Full matrix */}
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
        <div className="flex gap-4 mt-3 text-xs text-gray-600 justify-center">
          <span className="flex items-center gap-1"><span className="w-4 h-4 bg-green-300 rounded inline-block" /> 2× Super Effective</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 bg-red-200 rounded inline-block" /> ½× Not Very Effective</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 bg-gray-900 rounded inline-block" /> 0 Immune</span>
        </div>
      </div>
    </div>
  );
}
