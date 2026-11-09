import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import MeceneLogo from "../../molecules/MeceneLogo/MeceneLogo";
import FeatureNotice from "../../molecules/FeatureNotice/FeatureNotice";
import { useMecenes } from "../../../features/mecenes/useMecenes";
import { Mecene } from "../../../features/mecenes/types";
import { shuffled } from "../../../features/mecenes/shuffle";
import { useFeature } from "../../../features/featureFlags/useFeatureFlags";
import { useAccess } from "../../../auth/useAccess";
import { entry } from "../../../auth/access";
import { inSecteurChoice, useSecteurChoice } from "../../../features/sectors/secteurChoice";
import styles from "./MecenesBanner.module.css";

/** Assez de logos pour remplir la largeur avant que la boucle ne recommence. */
const MIN_PER_LOOP = 8;

/**
 * Le bandeau des mécènes de l'accueil : leurs logos défilent sans fin, dans un ordre mélangé à chaque visite, tous
 * Niveaux confondus ; un clic mène à Nos mécènes. Il s'arrête au survol et reste immobile pour qui demande moins
 * d'animations. Il disparaît sans mécène à montrer, ou quand Mécènes est désactivé ; le Super admin le voit, marqué
 * comme tel (ADR 0009).
 */
export const MecenesBanner: React.FC = () => {
  const { ready, seesTurnedOff } = useAccess();
  const on = useFeature("mecenes");
  if (!ready || (!on && !seesTurnedOff)) return null;
  return (
    <>
      {!on && <FeatureNotice feature="mecenes" variant="turned-off" />}
      <Marquee />
    </>
  );
};

const Marquee: React.FC = () => {
  const { data: mecenes } = useMecenes();
  const { sectorId: secteurChoice } = useSecteurChoice();
  const loop = useMemo(() => {
    const shown = shuffled((mecenes ?? []).filter((m) => inSecteurChoice(secteurChoice, m.sectorId)));
    if (shown.length === 0) return [];
    const repeated: Mecene[] = [];
    while (repeated.length < MIN_PER_LOOP) repeated.push(...shown);
    return repeated.map((mecene, index) => ({ mecene, copy: index >= shown.length }));
  }, [mecenes, secteurChoice]);

  if (loop.length === 0) return null;
  const to = entry("mecenes").path;

  // La boucle est jouée deux fois de suite, pour qu'elle reparte sans à-coup ; seule la première occurrence de
  // chaque Mécène est lue et atteinte au clavier
  const half = (second: boolean) =>
    loop.map(({ mecene, copy }, index) => {
      const hidden = second || copy;
      return (
        <li key={`${second ? "b" : "a"}-${index}`} aria-hidden={hidden || undefined}>
          <Link className={styles.item} to={to} tabIndex={hidden ? -1 : undefined}>
            <MeceneLogo mecene={mecene} className={styles.logo} />
            <span className={styles.name}>{mecene.name}</span>
          </Link>
        </li>
      );
    });

  return (
    <section className={styles.banner} aria-labelledby="mecenes-banner-title">
      <h2 id="mecenes-banner-title" className={styles.title}>
        Merci à nos mécènes
      </h2>
      <div className={styles.viewport}>
        <ul className={styles.track} style={{ "--count": loop.length } as React.CSSProperties}>
          {half(false)}
          {half(true)}
        </ul>
      </div>
    </section>
  );
};

export default MecenesBanner;
