const BASE = "https://pokeapi.co/api/v2";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PokeAPI error: ${res.status} ${url}`);
  return res.json();
}

export interface PokemonStat {
  base_stat: number;
  stat: { name: string };
}

export interface PokemonType {
  slot: number;
  type: { name: string; url: string };
}

export interface PokemonAbility {
  ability: { name: string; url: string };
  is_hidden: boolean;
}

export interface PokemonSprites {
  front_default: string | null;
  front_shiny: string | null;
  other: {
    "official-artwork": {
      front_default: string | null;
      front_shiny: string | null;
    };
  };
}

export interface PokemonMove {
  move: { name: string; url: string };
  version_group_details: {
    level_learned_at: number;
    move_learn_method: { name: string };
    version_group: { name: string };
  }[];
}

export interface PokemonData {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  stats: PokemonStat[];
  types: PokemonType[];
  abilities: PokemonAbility[];
  sprites: PokemonSprites;
  moves: PokemonMove[];
}

export interface SpeciesData {
  id: number;
  name: string;
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
    version: { name: string };
  }[];
  evolution_chain: { url: string };
  genera: { genus: string; language: { name: string } }[];
  gender_rate: number;
  capture_rate: number;
  base_happiness: number;
  growth_rate: { name: string };
}

export interface EncounterData {
  location_area: { name: string; url: string };
  version_details: {
    version: { name: string };
    max_chance: number;
    encounter_details: {
      min_level: number;
      max_level: number;
      method: { name: string };
      chance: number;
    }[];
  }[];
}

export interface EvolutionChainLink {
  species: { name: string; url: string };
  evolution_details: {
    trigger: { name: string };
    min_level: number | null;
    item: { name: string } | null;
    held_item: { name: string } | null;
    min_happiness: number | null;
    time_of_day: string;
  }[];
  evolves_to: EvolutionChainLink[];
}

export interface EvolutionChainData {
  id: number;
  chain: EvolutionChainLink;
}

export interface LocationAreaData {
  id: number;
  name: string;
  names: { name: string; language: { name: string } }[];
  pokemon_encounters: {
    pokemon: { name: string; url: string };
    version_details: {
      version: { name: string };
      max_chance: number;
      encounter_details: {
        min_level: number;
        max_level: number;
        method: { name: string };
        chance: number;
      }[];
    }[];
  }[];
}

export interface LocationData {
  id: number;
  name: string;
  names: { name: string; language: { name: string } }[];
  region: { name: string };
  areas: { name: string; url: string }[];
}

export interface MoveData {
  id: number;
  name: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  type: { name: string };
  damage_class: { name: string };
  effect_entries: { short_effect: string; language: { name: string } }[];
}

export interface AbilityData {
  id: number;
  name: string;
  effect_entries: { effect: string; short_effect: string; language: { name: string } }[];
  flavor_text_entries: { flavor_text: string; language: { name: string }; version_group: { name: string } }[];
}

export const api = {
  getPokemon: (idOrName: number | string) =>
    fetchJson<PokemonData>(`${BASE}/pokemon/${idOrName}`),

  getSpecies: (idOrName: number | string) =>
    fetchJson<SpeciesData>(`${BASE}/pokemon-species/${idOrName}`),

  getEncounters: (id: number) =>
    fetchJson<EncounterData[]>(`${BASE}/pokemon/${id}/encounters`),

  getEvolutionChain: (id: number) =>
    fetchJson<EvolutionChainData>(`${BASE}/evolution-chain/${id}`),

  getLocation: (id: number) =>
    fetchJson<LocationData>(`${BASE}/location/${id}`),

  getLocationArea: (nameOrId: string | number) =>
    fetchJson<LocationAreaData>(`${BASE}/location-area/${nameOrId}`),

  getMove: (nameOrId: string | number) =>
    fetchJson<MoveData>(`${BASE}/move/${nameOrId}`),

  getAbility: (nameOrId: string | number) =>
    fetchJson<AbilityData>(`${BASE}/ability/${nameOrId}`),
};

export function getOfficialArtwork(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function getSprite(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function formatName(name: string): string {
  return name
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function extractIdFromUrl(url: string): number {
  const parts = url.replace(/\/$/, "").split("/");
  return parseInt(parts[parts.length - 1], 10);
}
