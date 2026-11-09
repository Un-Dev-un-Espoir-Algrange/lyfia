import React from "react";
import { photoUrl } from "../../../features/galerie/galerieApi";
import { Mecene } from "../../../features/mecenes/types";
import styles from "./MeceneLogo.module.css";

/** Les initiales d'un nom : « Garage du Centre » → « GC ». */
export const initials = (name: string) =>
  name
    .split(/[\s\-']+/)
    .filter((word) => /^\p{L}/u.test(word) && word.length > 2)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("") || name.trim().slice(0, 2).toUpperCase();

/**
 * Le logo d'un Mécène ; sans image, son nom en typographie, jamais le logo de l'association, qui laisserait croire
 * que c'est elle. L'image est décorative : le nom du Mécène est toujours écrit à côté.
 */
export const MeceneLogo: React.FC<{ mecene: Pick<Mecene, "name" | "mediaId">; className?: string }> = ({ mecene, className }) => (
  <span className={`${styles.logo}${className ? ` ${className}` : ""}`}>
    {mecene.mediaId ? (
      <img src={photoUrl(mecene.mediaId, "affichage")} alt="" loading="lazy" />
    ) : (
      <span className={styles.initials} aria-hidden="true">
        {initials(mecene.name)}
      </span>
    )}
  </span>
);

export default MeceneLogo;
