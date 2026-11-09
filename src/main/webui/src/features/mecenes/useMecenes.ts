import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMecene, deleteMecene, fetchManagedMecenes, fetchMecenes, updateMecene } from "./meceneApi";
import { MeceneInput } from "./types";
import { queryKeys } from "../queryKeys";

/** Les Mécènes que voit le public : la page Nos mécènes et le bandeau de l'accueil. */
export function useMecenes() {
  return useQuery({ queryKey: queryKeys.mecenes.public, queryFn: fetchMecenes });
}

/** Tous les Mécènes des Secteurs que gère la personne, pour l'écran d'administration. */
export function useManagedMecenes() {
  return useQuery({ queryKey: queryKeys.mecenes.managed, queryFn: fetchManagedMecenes });
}

export function useMeceneMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.mecenes.all });

  const create = useMutation({ mutationFn: createMecene, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: (input: { id: string } & MeceneInput) => updateMecene(input.id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteMecene, onSuccess: invalidate });

  return { create, update, remove };
}
