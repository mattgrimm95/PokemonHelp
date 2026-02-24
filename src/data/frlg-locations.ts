export interface FrlgLocation {
  id: number;
  name: string;
  displayName: string;
  category: "town" | "city" | "route" | "dungeon" | "landmark";
}

export const FRLG_LOCATIONS: FrlgLocation[] = [
  { id: 86, name: "pallet-town", displayName: "Pallet Town", category: "town" },
  { id: 68, name: "viridian-city", displayName: "Viridian City", category: "city" },
  { id: 69, name: "pewter-city", displayName: "Pewter City", category: "city" },
  { id: 70, name: "cerulean-city", displayName: "Cerulean City", category: "city" },
  { id: 76, name: "vermilion-city", displayName: "Vermilion City", category: "city" },
  { id: 71, name: "lavender-town", displayName: "Lavender Town", category: "town" },
  { id: 72, name: "celadon-city", displayName: "Celadon City", category: "city" },
  { id: 73, name: "fuchsia-city", displayName: "Fuchsia City", category: "city" },
  { id: 74, name: "saffron-city", displayName: "Saffron City", category: "city" },
  { id: 75, name: "cinnabar-island", displayName: "Cinnabar Island", category: "city" },
  { id: 87, name: "indigo-plateau", displayName: "Indigo Plateau", category: "landmark" },
  { id: 296, name: "kanto-route-1", displayName: "Route 1", category: "route" },
  { id: 297, name: "kanto-route-2", displayName: "Route 2", category: "route" },
  { id: 298, name: "kanto-route-3", displayName: "Route 3", category: "route" },
  { id: 299, name: "kanto-route-4", displayName: "Route 4", category: "route" },
  { id: 300, name: "kanto-route-5", displayName: "Route 5", category: "route" },
  { id: 301, name: "kanto-route-6", displayName: "Route 6", category: "route" },
  { id: 302, name: "kanto-route-7", displayName: "Route 7", category: "route" },
  { id: 303, name: "kanto-route-8", displayName: "Route 8", category: "route" },
  { id: 304, name: "kanto-route-9", displayName: "Route 9", category: "route" },
  { id: 305, name: "kanto-route-10", displayName: "Route 10", category: "route" },
  { id: 306, name: "kanto-route-11", displayName: "Route 11", category: "route" },
  { id: 307, name: "kanto-route-12", displayName: "Route 12", category: "route" },
  { id: 308, name: "kanto-route-13", displayName: "Route 13", category: "route" },
  { id: 309, name: "kanto-route-14", displayName: "Route 14", category: "route" },
  { id: 310, name: "kanto-route-15", displayName: "Route 15", category: "route" },
  { id: 311, name: "kanto-route-16", displayName: "Route 16", category: "route" },
  { id: 312, name: "kanto-route-17", displayName: "Route 17", category: "route" },
  { id: 313, name: "kanto-route-18", displayName: "Route 18", category: "route" },
  { id: 314, name: "kanto-route-19", displayName: "Route 19", category: "route" },
  { id: 315, name: "kanto-route-20", displayName: "Route 20", category: "route" },
  { id: 316, name: "kanto-route-21", displayName: "Route 21", category: "route" },
  { id: 317, name: "kanto-route-22", displayName: "Route 22", category: "route" },
  { id: 318, name: "kanto-route-23", displayName: "Route 23", category: "route" },
  { id: 319, name: "kanto-route-24", displayName: "Route 24", category: "route" },
  { id: 320, name: "kanto-route-25", displayName: "Route 25", category: "route" },
  { id: 200, name: "mt-moon", displayName: "Mt. Moon", category: "dungeon" },
  { id: 194, name: "rock-tunnel", displayName: "Rock Tunnel", category: "dungeon" },
  { id: 201, name: "pokemon-tower", displayName: "Pokemon Tower", category: "dungeon" },
  { id: 197, name: "safari-zone", displayName: "Safari Zone", category: "dungeon" },
  { id: 193, name: "seafoam-islands", displayName: "Seafoam Islands", category: "dungeon" },
  { id: 196, name: "pokemon-mansion", displayName: "Pokemon Mansion", category: "dungeon" },
  { id: 192, name: "victory-road", displayName: "Victory Road", category: "dungeon" },
  { id: 198, name: "cerulean-cave", displayName: "Cerulean Cave", category: "dungeon" },
  { id: 199, name: "power-plant", displayName: "Power Plant", category: "dungeon" },
  { id: 195, name: "digletts-cave", displayName: "Diglett's Cave", category: "dungeon" },
  { id: 202, name: "viridian-forest", displayName: "Viridian Forest", category: "dungeon" },
];

export const LOCATION_CATEGORIES = [
  { key: "town" as const, label: "Towns" },
  { key: "city" as const, label: "Cities" },
  { key: "route" as const, label: "Routes" },
  { key: "dungeon" as const, label: "Dungeons & Caves" },
  { key: "landmark" as const, label: "Landmarks" },
];
