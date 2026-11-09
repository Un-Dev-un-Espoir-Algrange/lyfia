/** Niveau d'un Mécène, dans l'ordre où le public les voit. */
export type Niveau = "or" | "argent" | "bronze";

export const NIVEAUX: Niveau[] = ["or", "argent", "bronze"];

export const NIVEAU_LABELS: Record<Niveau, string> = { or: "Or", argent: "Argent", bronze: "Bronze" };

/** Un Mécène : reflète MeceneDto côté backend. D'un Secteur et d'une Année. */
export interface Mecene {
  id: string;
  name: string;
  niveau: Niveau;
  annee: number;
  description: string | null;
  /** Son propre site, hors de celui-ci. */
  website: string | null;
  /** Son logo ; null : son nom seul. */
  mediaId: string | null;
  /** Un Mécène masqué reste enregistré mais n'apparaît plus au public. */
  shown: boolean;
  sectorId: string;
  sectorName: string;
}

/** `sectorId` n'est choisi que par le Super admin, à la création ; les autres écrivent pour leur Secteur. */
export type MeceneInput = Omit<Mecene, "id" | "sectorId" | "sectorName"> & { sectorId?: string | null };
