import React, { useMemo, useState } from "react";
import PageHero from "../../components/organisms/PageHero/PageHero";
import Modal from "../../components/molecules/Modal/Modal";
import MeceneLogo from "../../components/molecules/MeceneLogo/MeceneLogo";
import ButtonLink from "../../components/atoms/ButtonLink/ButtonLink";
import Badge from "../../components/atoms/Badge/Badge";
import Icon from "../../components/atoms/Icon/Icon";
import Spinner from "../../components/atoms/Spinner/Spinner";
import { useMecenes } from "../../features/mecenes/useMecenes";
import { Mecene, NIVEAU_LABELS, NIVEAUX, Niveau } from "../../features/mecenes/types";
import { shuffled } from "../../features/mecenes/shuffle";
import { inSecteurChoice, useSecteurChoice } from "../../features/sectors/secteurChoice";
import styles from "./MecenesPage.module.css";

const HEADINGS: Record<Niveau, string> = { or: "Mécènes Or", argent: "Mécènes Argent", bronze: "Mécènes Bronze" };

/** Tout ce que l'on sait d'un Mécène, ouvert depuis son encart. */
const MeceneDetail: React.FC<{ mecene: Mecene | null; onClose: () => void }> = ({ mecene, onClose }) => (
  <Modal isOpen={mecene !== null} onClose={onClose} title={mecene?.name ?? ""}>
    {mecene && (
      <div className={styles.detail}>
        <MeceneLogo mecene={mecene} className={styles.detailLogo} />
        <p className={styles.detailMeta}>
          <Badge label={`Mécène ${NIVEAU_LABELS[mecene.niveau]}`} tone="accent" /> {mecene.sectorName} · {mecene.annee}
        </p>
        {mecene.description && <p className={styles.description}>{mecene.description}</p>}
        {mecene.website && (
          <a className={styles.website} href={mecene.website} target="_blank" rel="noopener noreferrer">
            Visiter son site
            <Icon name="arrowRight" size={18} strokeWidth={2.5} />
          </a>
        )}
      </div>
    )}
  </Modal>
);

/**
 * Nos mécènes : les entreprises qui donnent à l'organisation des éditions, pour chaque Secteur celles de sa dernière
 * Année. Les Or d'abord, en grand, puis les Argent et les Bronze ; dans un même Niveau, l'ordre change à chaque
 * visite, pour n'en favoriser aucun.
 */
export const MecenesPage: React.FC = () => {
  const { data: mecenes, isLoading, isError } = useMecenes();
  const { sectorId: secteurChoice } = useSecteurChoice();
  const [open, setOpen] = useState<Mecene | null>(null);

  const byNiveau = useMemo(() => {
    const shown = shuffled((mecenes ?? []).filter((m) => inSecteurChoice(secteurChoice, m.sectorId)));
    return NIVEAUX.map((niveau) => ({ niveau, mecenes: shown.filter((m) => m.niveau === niveau) })).filter((group) => group.mecenes.length > 0);
  }, [mecenes, secteurChoice]);

  return (
    <>
      <PageHero eyebrow="Nous soutenir" title="Nos mécènes" lead="Merci aux entreprises qui soutiennent l'organisation de nos éditions." />
      <div className="container">
        {isLoading ? (
          <Spinner label="Chargement des mécènes..." />
        ) : isError ? (
          <p className={styles.empty}>Impossible de charger les mécènes pour le moment.</p>
        ) : byNiveau.length === 0 ? (
          <p className={styles.empty}>Aucun mécène pour le moment.</p>
        ) : (
          byNiveau.map(({ niveau, mecenes: ofNiveau }) => (
            <section key={niveau} className={styles.niveau} aria-labelledby={`niveau-${niveau}`}>
              <h2 id={`niveau-${niveau}`} className={`${styles.niveauTitle} ${styles[niveau]}`}>
                {HEADINGS[niveau]}
              </h2>
              <ul className={`${styles.grid} ${styles[`grid-${niveau}`]}`}>
                {ofNiveau.map((mecene) => (
                  <li key={mecene.id}>
                    <button
                      type="button"
                      className={`${styles.card} ${styles[`card-${niveau}`]}`}
                      onClick={() => setOpen(mecene)}
                      aria-haspopup="dialog"
                    >
                      <MeceneLogo mecene={mecene} className={styles.cardLogo} />
                      <span className={styles.cardBody}>
                        <span className={styles.cardName}>{mecene.name}</span>
                        {niveau === "or" && mecene.description && <span className={styles.cardDescription}>{mecene.description}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        <aside className={styles.join}>
          <p>Votre entreprise souhaite soutenir nos actions ?</p>
          <ButtonLink to="/contact" label="Devenir mécène" variant="accent" arrow />
        </aside>
      </div>
      <MeceneDetail mecene={open} onClose={() => setOpen(null)} />
    </>
  );
};

export default MecenesPage;
