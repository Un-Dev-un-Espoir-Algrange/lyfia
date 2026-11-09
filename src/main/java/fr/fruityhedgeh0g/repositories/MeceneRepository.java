package fr.fruityhedgeh0g.repositories;

import fr.fruityhedgeh0g.entities.MeceneEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class MeceneRepository implements PanacheRepositoryBase<MeceneEntity, UUID> {

    /** The latest Années first, then Or, Argent, Bronze, then by name. */
    public List<MeceneEntity> listInOrder() {
        return listAll(Sort.descending("annee").and("name")).stream()
                .sorted(Comparator.comparingInt(MeceneEntity::getAnnee).reversed()
                        .thenComparing(MeceneEntity::getNiveau)
                        .thenComparing(MeceneEntity::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    /** The Mécènes of a Secteur for one Année. */
    public List<MeceneEntity> of(UUID sectorId, int annee) {
        return list("sector.sectorId = ?1 and annee = ?2", sectorId, annee);
    }
}
