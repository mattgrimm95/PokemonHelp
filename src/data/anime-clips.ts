/**
 * Pokemon + move combinations that have a selectable "anime-style" battle clip.
 * Each clip uses a fixed opponent for the animation (ignores current defender selection).
 */

export interface AnimeClipCombo {
  pokemonId: number;
  moveName: string;
  /** Unique key for the choreography script (e.g. "pikachu-thunderbolt") */
  clipId: string;
  /** Opponent shown in the clip (e.g. Pikachu vs Vulpix) */
  defenderId: number;
  defenderName: string;
  /** Effectiveness shown in the clip (for result text) */
  effectiveness: number;
  /** YouTube video ID for an anime clip of this move (optional) */
  youtubeVideoId?: string;
}

export const ANIME_CLIP_COMBOS: AnimeClipCombo[] = [
  {
    pokemonId: 25,
    moveName: "thunderbolt",
    clipId: "pikachu-thunderbolt",
    defenderId: 37,
    defenderName: "vulpix",
    effectiveness: 0.5,
    youtubeVideoId: "MgC0kunvePc",
  },
  {
    pokemonId: 37,
    moveName: "ember",
    clipId: "vulpix-ember",
    defenderId: 25,
    defenderName: "pikachu",
    effectiveness: 1,
  },
];

const COMBO_KEY = (pid: number, move: string) => `${pid}-${move.toLowerCase()}`;
const COMBO_MAP = new Map(
  ANIME_CLIP_COMBOS.map((c) => [COMBO_KEY(c.pokemonId, c.moveName), c])
);

export function getAnimeClipCombo(
  attackerId: number,
  moveName: string
): AnimeClipCombo | undefined {
  return COMBO_MAP.get(COMBO_KEY(attackerId, moveName));
}

export function hasAnimeClip(attackerId: number, moveName: string): boolean {
  return getAnimeClipCombo(attackerId, moveName) !== undefined;
}

/** Move names that have anime clips for a given attacker (for UI hints) */
export function getAnimeClipMovesForPokemon(attackerId: number): string[] {
  return ANIME_CLIP_COMBOS.filter((c) => c.pokemonId === attackerId).map(
    (c) => c.moveName
  );
}

export function hasYoutubeClip(attackerId: number, moveName: string): boolean {
  return !!getAnimeClipCombo(attackerId, moveName)?.youtubeVideoId;
}

export function getYoutubeMovesForPokemon(attackerId: number): string[] {
  return ANIME_CLIP_COMBOS.filter(
    (c) => c.pokemonId === attackerId && c.youtubeVideoId
  ).map((c) => c.moveName);
}
