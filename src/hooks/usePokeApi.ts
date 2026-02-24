import { useQuery } from "@tanstack/react-query";
import { api, type PokemonData, type SpeciesData, type EncounterData, type EvolutionChainData, type LocationAreaData, type LocationData, type MoveData } from "../services/pokeapi";

const STALE_TIME = 24 * 60 * 60 * 1000; // 24 hours

export function usePokemon(id: number | string) {
  return useQuery<PokemonData>({
    queryKey: ["pokemon", id],
    queryFn: () => api.getPokemon(id),
    staleTime: STALE_TIME,
    enabled: !!id,
  });
}

export function useSpecies(id: number | string) {
  return useQuery<SpeciesData>({
    queryKey: ["species", id],
    queryFn: () => api.getSpecies(id),
    staleTime: STALE_TIME,
    enabled: !!id,
  });
}

export function useEncounters(id: number) {
  return useQuery<EncounterData[]>({
    queryKey: ["encounters", id],
    queryFn: () => api.getEncounters(id),
    staleTime: STALE_TIME,
    enabled: !!id,
  });
}

export function useEvolutionChain(id: number | undefined) {
  return useQuery<EvolutionChainData>({
    queryKey: ["evolution-chain", id],
    queryFn: () => api.getEvolutionChain(id!),
    staleTime: STALE_TIME,
    enabled: !!id,
  });
}

export function useLocation(id: number) {
  return useQuery<LocationData>({
    queryKey: ["location", id],
    queryFn: () => api.getLocation(id),
    staleTime: STALE_TIME,
    enabled: !!id,
  });
}

export function useLocationArea(nameOrId: string | number) {
  return useQuery<LocationAreaData>({
    queryKey: ["location-area", nameOrId],
    queryFn: () => api.getLocationArea(nameOrId),
    staleTime: STALE_TIME,
    enabled: !!nameOrId,
  });
}

export function useMove(nameOrId: string | number) {
  return useQuery<MoveData>({
    queryKey: ["move", nameOrId],
    queryFn: () => api.getMove(nameOrId),
    staleTime: STALE_TIME,
    enabled: !!nameOrId,
  });
}

export function usePokemonBatch(ids: number[]) {
  return useQuery<PokemonData[]>({
    queryKey: ["pokemon-batch", ids.join(",")],
    queryFn: () => Promise.all(ids.map(id => api.getPokemon(id))),
    staleTime: STALE_TIME,
    enabled: ids.length > 0,
  });
}
