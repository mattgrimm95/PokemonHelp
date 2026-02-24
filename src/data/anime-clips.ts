/**
 * Pokemon + move combinations that have a selectable "anime-style" battle clip.
 * YouTube clips: only included when transcript/title confirms this Pokemon using this move.
 * Clips are at most 40 seconds (move + context).
 */

export interface AnimeClipCombo {
  pokemonId: number;
  moveName: string;
  /** Unique key for the choreography script (e.g. "pikachu-thunderbolt") */
  clipId: string;
  /** Opponent shown in the clip (for canvas animation; ignored for YouTube-only) */
  defenderId: number;
  defenderName: string;
  /** Effectiveness shown in the clip (for result text) */
  effectiveness: number;
  /** YouTube video ID for an anime clip of this move (optional) */
  youtubeVideoId?: string;
  /** Start time in seconds; used with youtubeVideoId */
  youtubeStartSeconds?: number;
  /** End time in seconds; clip is capped so end - start ≤ 40 */
  youtubeEndSeconds?: number;
}

/** Placeholder defender for YouTube-only clips (not used by canvas animation) */
const DEF = { defenderId: 25, defenderName: "pikachu", effectiveness: 1 } as const;

/** Only clips verified via YouTube title/description or transcript (Pokemon + move explicit) */
export const ANIME_CLIP_COMBOS: AnimeClipCombo[] = [
  // 1. Pikachu – Thunderbolt. Video: "Pikachu using thunderbolt clip (short version)". Description: "Clip of Pikachu using thunderbolt". (Video 0:02)
  {
    pokemonId: 25,
    moveName: "thunderbolt",
    clipId: "pikachu-thunderbolt",
    ...DEF,
    youtubeVideoId: "MgC0kunvePc",
    youtubeStartSeconds: 0,
    youtubeEndSeconds: 40,
  },
  // 2. Snorlax – Body Slam. Video: "Snorlax Used Body Slam!". Transcript: "Snorlax ... use body slam". (Video 0:25)
  {
    pokemonId: 143,
    moveName: "body-slam",
    clipId: "snorlax-body-slam",
    ...DEF,
    youtubeVideoId: "RKpK28T3MeA",
    youtubeStartSeconds: 0,
    youtubeEndSeconds: 40,
  },
  // 3. Blastoise – Hydro Pump. Video: "Can't Beat the Heat" (Pokémon TV). Gary's Blastoise uses Hydro Pump; transcript: "That was the most powerful Hydro Pump I've ever seen", "[HYDRO PUMP MOVE]". Clip: chapter "Boss Moves Blastoise!" (1:27–2:07).
  {
    pokemonId: 9,
    moveName: "hydro-pump",
    clipId: "blastoise-hydro-pump",
    ...DEF,
    youtubeVideoId: "dHPTV4AHUyc",
    youtubeStartSeconds: 87,
    youtubeEndSeconds: 127,
  },
  // 4. Squirtle – Hydro Pump. Video: "Squirtle learns hydro pump and defeats Rudy's starmie". Title confirms. (Video 1:12; clip 0–40s)
  {
    pokemonId: 7,
    moveName: "hydro-pump",
    clipId: "squirtle-hydro-pump",
    ...DEF,
    youtubeVideoId: "7nUeUx13Y4o",
    youtubeStartSeconds: 0,
    youtubeEndSeconds: 40,
  },
  // 5. Dugtrio – Dig. Video: "Dig Those Diglett!" (full episode). Transcript: "[Pokédex] Dugtrio. The evolved form of Diglett.", "[all Dugtrio] Trio, trio, trio", "Diglett, dig" / "Dugtrio plants the trees". Segment 15:00–15:40 = A Groundbreaking Revelation.
  {
    pokemonId: 51,
    moveName: "dig",
    clipId: "dugtrio-dig",
    ...DEF,
    youtubeVideoId: "mRR7mbV0u4U",
    youtubeStartSeconds: 900,
    youtubeEndSeconds: 940,
  },
  // 6. Arcanine – Flamethrower. Video: "Arcanine Use Flamethrower!" (Episode 77 "The Fourth Round Rumble"). Transcript: "Arcanine flamethrower". Clip 0–13s.
  {
    pokemonId: 59,
    moveName: "flamethrower",
    clipId: "arcanine-flamethrower",
    ...DEF,
    youtubeVideoId: "CX34b1s8G5g",
    youtubeStartSeconds: 0,
    youtubeEndSeconds: 13,
  },
  // 7. Bulbasaur – Solar Beam. Video: "Bulbasaur Learns The Attack Solarbeam". Transcript: "solar beam Bulbasaur's strongest attack... Bulbasaur get ready to use your solar beam fire the solar beam". Clip 0–33s.
  {
    pokemonId: 1,
    moveName: "solar-beam",
    clipId: "bulbasaur-solar-beam",
    ...DEF,
    youtubeVideoId: "c802ropErhM",
    youtubeStartSeconds: 0,
    youtubeEndSeconds: 33,
  },
  // 8. Charmander – Ember. Video: "Pokemon Fight Charmander used EMBER" (Short). Title + description: "Charmander used EMBER to Koffing!". Clip 0–10s.
  {
    pokemonId: 4,
    moveName: "ember",
    clipId: "charmander-ember",
    ...DEF,
    youtubeVideoId: "lwhivF85VCE",
    youtubeStartSeconds: 0,
    youtubeEndSeconds: 10,
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
