package fr.fruityhedgeh0g.services;

import fr.fruityhedgeh0g.dtos.MeceneDto;
import fr.fruityhedgeh0g.entities.MeceneEntity;
import fr.fruityhedgeh0g.entities.SectorEntity;
import fr.fruityhedgeh0g.enums.FeatureEnum;
import fr.fruityhedgeh0g.enums.NiveauEnum;
import fr.fruityhedgeh0g.exceptions.DuplicateResourceException;
import fr.fruityhedgeh0g.exceptions.ForbiddenActionException;
import fr.fruityhedgeh0g.exceptions.InvalidResourceException;
import fr.fruityhedgeh0g.exceptions.UnknownResourceException;
import fr.fruityhedgeh0g.repositories.MeceneRepository;
import fr.fruityhedgeh0g.repositories.SectorRepository;
import fr.fruityhedgeh0g.security.SecteurScope;
import fr.fruityhedgeh0g.security.Viewer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * The Mécènes, per Secteur (ADR 0004): the public sees, for each Secteur, the Mécènes shown of its latest Année that
 * has any; the Bureau of a Secteur writes and puts aside its own, the Super admin those of any Secteur.
 */
@ApplicationScoped
public class MeceneService {

    @Inject MeceneRepository meceneRepository;
    @Inject MediaUses mediaUses;
    @Inject SectorRepository sectorRepository;
    @Inject FeatureLevers featureLevers;
    @Inject Viewer viewer;

    /** What the public sees: last year's Mécènes stay thanked until the new ones arrive. */
    public List<MeceneDto> listForPublic() {
        // A Secteur whose Mécènes are off keeps them away from the public (ADR 0009)
        Set<UUID> hidden = featureLevers.hiddenFromPublic(FeatureEnum.MECENES);
        List<MeceneEntity> shown = meceneRepository.listInOrder().stream()
                .filter(MeceneEntity::isShown)
                .filter(m -> !m.getSector().isClosed())
                .filter(m -> !hidden.contains(m.getSector().getSectorId()))
                .toList();
        Map<UUID, Integer> latest = shown.stream()
                .collect(Collectors.toMap(m -> m.getSector().getSectorId(), MeceneEntity::getAnnee, Math::max));
        return shown.stream()
                .filter(m -> m.getAnnee() == latest.get(m.getSector().getSectorId()))
                .map(MeceneDto::of)
                .toList();
    }

    /** Every Mécène, of every Année, of the Secteurs this person manages: the Mécènes admin screen. */
    public List<MeceneDto> listManaged() {
        SecteurScope scope = viewer.scope();
        return meceneRepository.listInOrder().stream()
                .filter(m -> !m.getSector().isClosed() || viewer.seesClosedSecteurs())
                .filter(m -> scope.covers(m.getSector()))
                .map(MeceneDto::of)
                .toList();
    }

    @Transactional
    public MeceneDto create(MeceneDto.Input input) {
        MeceneEntity mecene = new MeceneEntity();
        mecene.setSector(sectorFor(input.sectorId()));
        apply(mecene, input);
        meceneRepository.persist(mecene);
        return MeceneDto.of(mecene);
    }

    @Transactional
    public MeceneDto update(UUID meceneId, MeceneDto.Input input) {
        MeceneEntity mecene = managedOrThrow(meceneId);
        apply(mecene, input);
        return MeceneDto.of(mecene);
    }

    @Transactional
    public void delete(UUID meceneId) {
        meceneRepository.delete(managedOrThrow(meceneId));
    }

    /** A Mécène is for the writer's own Secteur; the Super admin chooses one. */
    private SectorEntity sectorFor(UUID chosen) {
        SecteurScope scope = viewer.scope();
        if (!scope.everySecteur()) {
            if (scope.sectorId() == null) throw new ForbiddenActionException("A Mécène belongs to its writer's Secteur.");
            return sectorRepository.findById(scope.sectorId());
        }
        if (chosen == null) throw new InvalidResourceException("A Mécène belongs to a Secteur.");
        SectorEntity sector = sectorRepository.findByIdOptional(chosen)
                .orElseThrow(() -> new UnknownResourceException("Sector not found: " + chosen));
        if (sector.isClosed()) throw new InvalidResourceException("A Secteur fermé gets no new Mécène.");
        return sector;
    }

    private MeceneEntity managedOrThrow(UUID meceneId) {
        MeceneEntity mecene = meceneRepository.findByIdOptional(meceneId)
                .filter(m -> !m.getSector().isClosed() || viewer.seesClosedSecteurs())
                .orElseThrow(() -> new UnknownResourceException("Mécène not found: " + meceneId));
        if (!viewer.scope().covers(mecene.getSector()))
            throw new ForbiddenActionException("A Mécène is managed by its own Secteur's Bureau.");
        if (mecene.getSector().isClosed()) throw new InvalidResourceException("A Secteur fermé is read-only.");
        return mecene;
    }

    private void apply(MeceneEntity mecene, MeceneDto.Input input) {
        if (input.name() == null || input.name().isBlank()) throw new InvalidResourceException("A Mécène has a name.");
        if (input.niveau() == null) throw new InvalidResourceException("A Mécène has a Niveau.");
        if (input.annee() == null) throw new InvalidResourceException("A Mécène is of an Année.");
        String name = input.name().trim();
        boolean taken = meceneRepository.of(mecene.getSector().getSectorId(), input.annee()).stream()
                .anyMatch(other -> !Objects.equals(other.getMeceneId(), mecene.getMeceneId()) && other.getName().equalsIgnoreCase(name));
        if (taken) throw new DuplicateResourceException("A Mécène of this Secteur already bears this name for " + input.annee());
        mecene.setName(name);
        mecene.setNiveau(NiveauEnum.of(input.niveau()));
        mecene.setAnnee(input.annee());
        mecene.setDescription(input.description() == null || input.description().isBlank() ? null : input.description().trim());
        mecene.setWebsite(website(input.website()));
        mecene.setShown(input.shown() == null || input.shown());
        mecene.setMedia(mediaUses.usable(input.mediaId()));
    }

    /** Its own site, on the web; « www.exemple.fr » is read as https://www.exemple.fr. */
    private static String website(String typed) {
        if (typed == null || typed.isBlank()) return null;
        String url = typed.trim();
        if (!url.matches("(?i)^https?://.*")) url = "https://" + url;
        try {
            URI uri = URI.create(url);
            if (uri.getHost() == null || !uri.getHost().contains(".")) throw new IllegalArgumentException();
            return url;
        } catch (IllegalArgumentException e) {
            throw new InvalidResourceException("A Mécène's site is an address on the web: " + typed);
        }
    }
}
