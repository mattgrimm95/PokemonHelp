import { TYPES, EFFECTIVENESS, type PokemonType } from "../data/typeChart";

export interface TypeCoverageResult {
  superEffective: PokemonType[];
  neutral: PokemonType[];
  notVeryEffective: PokemonType[];
  immune: PokemonType[];
}

export function getAttackCoverage(moveTypes: PokemonType[]): TypeCoverageResult {
  const best: Record<PokemonType, number> = {} as Record<PokemonType, number>;
  for (const def of TYPES) {
    best[def] = 0;
    for (const atk of moveTypes) {
      best[def] = Math.max(best[def], EFFECTIVENESS[atk][def]);
    }
  }
  return {
    superEffective: TYPES.filter(t => best[t] >= 2),
    neutral: TYPES.filter(t => best[t] === 1),
    notVeryEffective: TYPES.filter(t => best[t] > 0 && best[t] < 1),
    immune: TYPES.filter(t => best[t] === 0),
  };
}

export function getDefensiveWeaknesses(teamTypes: PokemonType[][]): Record<PokemonType, number[]> {
  const result: Record<string, number[]> = {};
  for (const atkType of TYPES) {
    result[atkType] = teamTypes.map(defTypes => {
      let mult = 1;
      for (const d of defTypes) {
        mult *= EFFECTIVENESS[atkType][d];
      }
      return mult;
    });
  }
  return result as Record<PokemonType, number[]>;
}

export function suggestCoverageTypes(currentMoveTypes: PokemonType[]): PokemonType[] {
  const coverage = getAttackCoverage(currentMoveTypes);
  const uncovered = [...coverage.notVeryEffective, ...coverage.immune];
  if (uncovered.length === 0) return [];

  const scores: { type: PokemonType; hits: number }[] = [];
  for (const candidate of TYPES) {
    if (currentMoveTypes.includes(candidate)) continue;
    let hits = 0;
    for (const def of uncovered) {
      if (EFFECTIVENESS[candidate][def] >= 2) hits++;
    }
    if (hits > 0) scores.push({ type: candidate, hits });
  }
  scores.sort((a, b) => b.hits - a.hits);
  return scores.slice(0, 3).map(s => s.type);
}
