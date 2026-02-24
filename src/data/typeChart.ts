export const TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
] as const;

export type PokemonType = (typeof TYPES)[number];

export const TYPE_COLORS: Record<PokemonType, string> = {
  normal:   "#A8A878",
  fire:     "#F08030",
  water:    "#6890F0",
  electric: "#F8D030",
  grass:    "#78C850",
  ice:      "#98D8D8",
  fighting: "#C03028",
  poison:   "#A040A0",
  ground:   "#E0C068",
  flying:   "#A890F0",
  psychic:  "#F85888",
  bug:      "#A8B820",
  rock:     "#B8A038",
  ghost:    "#705898",
  dragon:   "#7038F8",
  dark:     "#705848",
  steel:    "#B8B8D0",
  fairy:    "#EE99AC",
};

// Gen III effectiveness matrix: EFFECTIVENESS[attacking][defending]
// 0 = immune, 0.5 = not very effective, 1 = normal, 2 = super effective
const E = TYPES;
type Matrix = Record<PokemonType, Record<PokemonType, number>>;

function buildMatrix(): Matrix {
  const m: Partial<Matrix> = {};
  for (const a of E) {
    m[a] = {} as Record<PokemonType, number>;
    for (const d of E) {
      m[a]![d] = 1;
    }
  }
  const set = (atk: PokemonType, def: PokemonType, v: number) => { m[atk]![def] = v; };

  // Normal
  set("normal","rock",0.5); set("normal","ghost",0); set("normal","steel",0.5);
  // Fire
  set("fire","fire",0.5); set("fire","water",0.5); set("fire","grass",2); set("fire","ice",2);
  set("fire","bug",2); set("fire","rock",0.5); set("fire","dragon",0.5); set("fire","steel",2);
  // Water
  set("water","fire",2); set("water","water",0.5); set("water","grass",0.5); set("water","ground",2);
  set("water","rock",2); set("water","dragon",0.5);
  // Electric
  set("electric","water",2); set("electric","electric",0.5); set("electric","grass",0.5);
  set("electric","ground",0); set("electric","flying",2); set("electric","dragon",0.5);
  // Grass
  set("grass","fire",0.5); set("grass","water",2); set("grass","grass",0.5); set("grass","poison",0.5);
  set("grass","ground",2); set("grass","flying",0.5); set("grass","bug",0.5); set("grass","rock",2);
  set("grass","dragon",0.5); set("grass","steel",0.5);
  // Ice
  set("ice","fire",0.5); set("ice","water",0.5); set("ice","grass",2); set("ice","ice",0.5);
  set("ice","ground",2); set("ice","flying",2); set("ice","dragon",2); set("ice","steel",0.5);
  // Fighting
  set("fighting","normal",2); set("fighting","ice",2); set("fighting","poison",0.5);
  set("fighting","flying",0.5); set("fighting","psychic",0.5); set("fighting","bug",0.5);
  set("fighting","rock",2); set("fighting","ghost",0); set("fighting","dark",2); set("fighting","steel",2);
  // Poison
  set("poison","poison",0.5); set("poison","ground",0.5); set("poison","rock",0.5);
  set("poison","ghost",0.5); set("poison","grass",2); set("poison","steel",0);
  // Ground
  set("ground","fire",2); set("ground","electric",2); set("ground","grass",0.5);
  set("ground","poison",2); set("ground","flying",0); set("ground","bug",0.5);
  set("ground","rock",2); set("ground","steel",2);
  // Flying
  set("flying","electric",0.5); set("flying","grass",2); set("flying","fighting",2);
  set("flying","bug",2); set("flying","rock",0.5); set("flying","steel",0.5);
  // Psychic
  set("psychic","fighting",2); set("psychic","poison",2); set("psychic","psychic",0.5);
  set("psychic","dark",0); set("psychic","steel",0.5);
  // Bug
  set("bug","fire",0.5); set("bug","grass",2); set("bug","fighting",0.5);
  set("bug","poison",0.5); set("bug","flying",0.5); set("bug","psychic",2);
  set("bug","ghost",0.5); set("bug","dark",2); set("bug","steel",0.5);
  // Rock
  set("rock","fire",2); set("rock","ice",2); set("rock","fighting",0.5);
  set("rock","ground",0.5); set("rock","flying",2); set("rock","bug",2); set("rock","steel",0.5);
  // Ghost
  set("ghost","normal",0); set("ghost","psychic",2); set("ghost","ghost",2);
  set("ghost","dark",0.5); set("ghost","steel",0.5);
  // Dragon
  set("dragon","dragon",2); set("dragon","steel",0.5);
  // Dark
  set("dark","fighting",0.5); set("dark","psychic",2); set("dark","ghost",2);
  set("dark","dark",0.5); set("dark","steel",0.5);
  // Steel
  set("steel","fire",0.5); set("steel","water",0.5); set("steel","electric",0.5);
  set("steel","ice",2); set("steel","rock",2); set("steel","steel",0.5); set("steel","fairy",2);
  // Fairy (PokeAPI returns modern typings for Pokemon like Clefairy, Jigglypuff, Mr. Mime)
  set("fairy","fire",0.5); set("fairy","poison",0.5); set("fairy","steel",0.5);
  set("fairy","fighting",2); set("fairy","dragon",2); set("fairy","dark",2);
  // Defensive interactions with Fairy
  set("poison","fairy",2); set("dragon","fairy",0);

  return m as Matrix;
}

export const EFFECTIVENESS = buildMatrix();

export function getEffectiveness(atkType: PokemonType, defTypes: PokemonType[]): number {
  let mult = 1;
  for (const d of defTypes) {
    mult *= EFFECTIVENESS[atkType][d];
  }
  return mult;
}
