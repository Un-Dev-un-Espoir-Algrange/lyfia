import { Mecene, MeceneInput } from "./types";
import { apiFetch } from "../../lib/http";

const base = (id: string) => `/api/mecenes/${encodeURIComponent(id)}`;

/**
 * Les Mécènes, sur MeceneController : le public reçoit, pour chaque Secteur, ceux de sa dernière Année ; le Bureau
 * écrit, masque ou supprime ceux de son Secteur.
 */
export const fetchMecenes = () => apiFetch<Mecene[]>("/api/mecenes");

/** Tous les Mécènes, de toutes les Années, des Secteurs que gère la personne (tous pour le Super admin). */
export const fetchManagedMecenes = () => apiFetch<Mecene[]>("/api/mecenes?managed=true");

export const createMecene = (input: MeceneInput) => apiFetch<Mecene>("/api/mecenes", { method: "POST", body: JSON.stringify(input) });

export const updateMecene = (id: string, input: MeceneInput) => apiFetch<Mecene>(base(id), { method: "PUT", body: JSON.stringify(input) });

export const deleteMecene = (id: string) => apiFetch<void>(base(id), { method: "DELETE" });
