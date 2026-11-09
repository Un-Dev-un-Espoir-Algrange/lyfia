import React from "react";
import PageHero from "../../components/organisms/PageHero/PageHero";
import ButtonLink from "../../components/atoms/ButtonLink/ButtonLink";
import Icon from "../../components/atoms/Icon/Icon";
import { useAccess } from "../../auth/useAccess";
import { entry } from "../../auth/access";
import styles from "./DonationPage.module.css";

export const DonationPage: React.FC = () => {
  const { canAccess } = useAccess();
  return (
  <>
    <PageHero eyebrow="Nous soutenir" title="Faire un don" />
    <div className="container">
      <div className={styles.layout}>
        <div className={styles.body}>
          <p className={styles.lead}>
            Une Rose Un Espoir agit grâce à la générosité de ses donateurs et partenaires. Chaque don, quel que soit son
            montant, contribue directement au financement de la recherche contre le cancer et à l'accompagnement des
            malades et de leurs proches.
          </p>
          <div className={styles.note}>
            <span className={styles.noteIcon} aria-hidden="true">
              <Icon name="check" size={22} strokeWidth={3} />
            </span>
            <p>
              L'association est éligible à la réduction d'impôt pour les dons aux associations d'intérêt général. Un reçu
              fiscal vous est adressé pour tout don.
            </p>
          </div>
        </div>

        <aside className={styles.card}>
          <p className="eyebrow">Entreprises</p>
          <h2 className={styles.cardTitle}>Mécénat &amp; partenariats entreprises</h2>
          <p>
            Vous représentez une entreprise et souhaitez soutenir nos actions ? Contactez-nous pour échanger sur les
            modalités de mécénat.
          </p>
          <div className={styles.cardActions}>
            <ButtonLink to="/contact" label="Nous contacter" variant="accent" arrow />
            {canAccess("mecenes") && <ButtonLink to={entry("mecenes").path} label="Voir nos mécènes" variant="outline" />}
          </div>
        </aside>
      </div>
    </div>
  </>
  );
};

export default DonationPage;
