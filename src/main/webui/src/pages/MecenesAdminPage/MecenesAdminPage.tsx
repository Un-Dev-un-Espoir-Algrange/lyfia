import React, { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import ImagePicker from "../../components/organisms/ImagePicker/ImagePicker";
import AdminCrudList from "../../components/organisms/AdminCrudList/AdminCrudList";
import MeceneLogo from "../../components/molecules/MeceneLogo/MeceneLogo";
import FormField from "../../components/molecules/FormField/FormField";
import Select from "../../components/atoms/Select/Select";
import Checkbox from "../../components/atoms/Checkbox/Checkbox";
import Badge from "../../components/atoms/Badge/Badge";
import Spinner from "../../components/atoms/Spinner/Spinner";
import { useManagedMecenes, useMeceneMutations } from "../../features/mecenes/useMecenes";
import { Mecene, MeceneInput, NIVEAU_LABELS, NIVEAUX, Niveau } from "../../features/mecenes/types";
import { useIsSuperAdmin, useSectors } from "../../features/sectors/useSector";
import { matchesSearch } from "../../lib/textSearch";
import styles from "./MecenesAdminPage.module.css";

interface Draft {
  name: string;
  niveau: Niveau;
  annee: string;
  description: string;
  website: string;
  mediaId: string | null;
  shown: boolean;
  /** Choisi par le Super admin, à la création. */
  sectorId: string;
}

const thisYear = () => String(new Date().getFullYear());

const toDraft = (mecene: Mecene): Draft => ({
  name: mecene.name,
  niveau: mecene.niveau,
  annee: String(mecene.annee),
  description: mecene.description ?? "",
  website: mecene.website ?? "",
  mediaId: mecene.mediaId,
  shown: mecene.shown,
  sectorId: mecene.sectorId,
});

const draftToInput = (draft: Draft): MeceneInput => ({
  name: draft.name,
  niveau: draft.niveau,
  annee: Number(draft.annee),
  description: draft.description.trim() || null,
  website: draft.website.trim() || null,
  mediaId: draft.mediaId,
  shown: draft.shown,
  sectorId: draft.sectorId || null,
});

const sameName = (a: string, b: string) => a.trim().localeCompare(b.trim(), "fr", { sensitivity: "base" }) === 0;

/**
 * Mécènes (Bureau) : ceux de son Secteur, de toutes les Années (tous les Secteurs pour le Super admin, qui choisit
 * celui d'un nouveau Mécène). Un Mécène vaut pour une Année : en tapant son nom, on retrouve ceux des Années
 * précédentes pour reprendre leurs informations.
 */
export const MecenesAdminPage: React.FC = () => {
  const { data: mecenes, isLoading } = useManagedMecenes();
  const superAdmin = useIsSuperAdmin();
  const { user } = useAuth();
  const { data: sectors } = useSectors();
  const openSectors = (sectors ?? []).filter((s) => !s.closed);
  const { create, update, remove } = useMeceneMutations();
  const [annee, setAnnee] = useState("");

  const annees = useMemo(() => [...new Set((mecenes ?? []).map((m) => m.annee))].sort((a, b) => b - a), [mecenes]);
  // Par défaut, la dernière Année : celle que voit le public
  const chosenAnnee = annee || (annees[0] !== undefined ? String(annees[0]) : "");

  if (isLoading) return <Spinner label="Chargement des mécènes..." />;

  const all = mecenes ?? [];
  const items = all.filter((m) => chosenAnnee === "toutes" || String(m.annee) === chosenAnnee);
  const sectorOf = (draft: Draft, mecene?: Mecene) => mecene?.sectorId ?? (superAdmin ? draft.sectorId : (user?.sector?.sectorId ?? ""));

  /** Les Mécènes des Années précédentes dont le nom ressemble à la saisie, le plus récent de chaque nom. */
  const earlier = (draft: Draft) => {
    if (draft.name.trim().length < 2) return [];
    const sectorId = sectorOf(draft);
    const found: Mecene[] = [];
    for (const m of all) {
      if (m.sectorId !== sectorId || String(m.annee) === draft.annee || !matchesSearch(m.name, draft.name)) continue;
      if (!found.some((f) => sameName(f.name, m.name))) found.push(m);
    }
    return found.slice(0, 5);
  };

  const taken = (draft: Draft, mecene?: Mecene) =>
    all.some((m) => m.id !== mecene?.id && m.sectorId === sectorOf(draft, mecene) && String(m.annee) === draft.annee && sameName(m.name, draft.name));

  return (
    <>
      <div className={styles.filters}>
        <Select
          label="Mécènes de l'année"
          value={chosenAnnee}
          onChange={setAnnee}
          options={[...annees.map((a) => ({ value: String(a), label: String(a) })), { value: "toutes", label: "Toutes les années" }]}
        />
      </div>
      <AdminCrudList
        title="Mécènes"
        hint="Les entreprises qui donnent à l'organisation de l'édition d'une Année. Le public voit, pour chaque Secteur, les mécènes affichés de sa dernière Année ; un mécène masqué reste enregistré."
        items={items}
        idOf={(mecene) => mecene.id}
        display={(mecene) => ({
          title: mecene.name,
          subtitle: [NIVEAU_LABELS[mecene.niveau], String(mecene.annee), superAdmin ? mecene.sectorName : null].filter(Boolean).join(" · "),
          leading: <MeceneLogo mecene={mecene} className={styles.thumb} />,
          badge: <Badge label={mecene.shown ? "Affiché" : "Masqué"} tone={mecene.shown ? "accent" : "muted"} />,
        })}
        toDraft={toDraft}
        renderFields={(draft, setDraft, mecene) => (
          <>
            {superAdmin && !mecene && (
              <Select
                label="Secteur"
                value={draft.sectorId}
                onChange={(sectorId) => setDraft({ ...draft, sectorId })}
                options={[{ value: "", label: "Choisir un secteur" }, ...openSectors.map((s) => ({ value: s.sectorId, label: s.name }))]}
              />
            )}
            <FormField label="Nom" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
            {taken(draft, mecene) && <p className={styles.warning}>Un mécène de ce nom existe déjà pour cette année.</p>}
            {!mecene && earlier(draft).length > 0 && (
              <div className={styles.earlier}>
                <span className={styles.earlierLabel}>Déjà mécène :</span>
                {earlier(draft).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={styles.earlierButton}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        name: m.name,
                        niveau: m.niveau,
                        description: m.description ?? "",
                        website: m.website ?? "",
                        mediaId: m.mediaId,
                      })
                    }
                  >
                    Reprendre « {m.name} » ({NIVEAU_LABELS[m.niveau]}, {m.annee})
                  </button>
                ))}
              </div>
            )}
            <div className={styles.row}>
              <Select
                label="Niveau"
                value={draft.niveau}
                onChange={(niveau) => setDraft({ ...draft, niveau: niveau as Niveau })}
                options={NIVEAUX.map((n) => ({ value: n, label: NIVEAU_LABELS[n] }))}
              />
              <FormField
                label="Année"
                type="number"
                min={2000}
                max={2100}
                value={draft.annee}
                onChange={(e) => setDraft({ ...draft, annee: e.target.value })}
                required
              />
            </div>
            <ImagePicker
              label="Logo (optionnel)"
              format="logo"
              galerie={false}
              value={draft.mediaId}
              onChange={(mediaId) => setDraft({ ...draft, mediaId })}
            />
            <FormField
              label="Description (affichée en grand pour les mécènes Or)"
              multiline
              rows={4}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
            <FormField
              label="Site de l'entreprise (optionnel)"
              placeholder="www.exemple.fr"
              value={draft.website}
              onChange={(e) => setDraft({ ...draft, website: e.target.value })}
            />
            <Checkbox label="Affiché" checked={draft.shown} onChange={(shown) => setDraft({ ...draft, shown })} />
          </>
        )}
        onUpdate={(id, draft) => update.mutateAsync({ id, ...draftToInput(draft) })}
        create={{
          buttonLabel: "+ Nouveau mécène",
          submitLabel: "Créer le mécène",
          emptyDraft: {
            name: "",
            niveau: "bronze",
            annee: chosenAnnee && chosenAnnee !== "toutes" ? chosenAnnee : thisYear(),
            description: "",
            website: "",
            mediaId: null,
            shown: true,
            sectorId: "",
          },
          onCreate: (draft) => create.mutateAsync(draftToInput(draft)),
        }}
        remove={{
          title: "Supprimer ce mécène ?",
          message: (mecene) => `Le mécène « ${mecene.name} » (${mecene.annee}) sera définitivement supprimé. Pour seulement le retirer du site, masquez-le.`,
          onRemove: (id) => remove.mutateAsync(id),
        }}
      />
    </>
  );
};

export default MecenesAdminPage;
