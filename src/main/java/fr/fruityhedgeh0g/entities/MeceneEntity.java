package fr.fruityhedgeh0g.entities;

import fr.fruityhedgeh0g.entities.medias.MediaEntity;
import fr.fruityhedgeh0g.enums.NiveauEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * A Mécène: a company a Secteur honours for giving to its édition of one Année, at a Niveau. The same company giving
 * again another Année is another Mécène.
 */
@Entity
@Table(name = "mecenes", uniqueConstraints = @UniqueConstraint(columnNames = {"sector_id", "annee", "name"}))
@NoArgsConstructor
@Getter
@Setter
public class MeceneEntity extends AuditTemplate {

    @Id
    @Column(name = "mecene_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID meceneId;

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "niveau", nullable = false)
    private NiveauEnum niveau;

    @Column(name = "annee", nullable = false)
    private int annee;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    /** Its own site, outside this one. */
    @Column(name = "website")
    private String website;

    /** Its logo; none: its name alone. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "media_id")
    private MediaEntity media;

    /** A Mécène can be put aside without being deleted. */
    @Column(name = "shown", nullable = false)
    private boolean shown = true;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "sector_id", nullable = false)
    private SectorEntity sector;
}
