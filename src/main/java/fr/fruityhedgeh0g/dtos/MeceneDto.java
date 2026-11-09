package fr.fruityhedgeh0g.dtos;

import fr.fruityhedgeh0g.entities.MeceneEntity;
import fr.fruityhedgeh0g.enums.NiveauEnum;

import java.util.UUID;

/** A Mécène, with the name of its Secteur for the public. */
public record MeceneDto(UUID id, String name, NiveauEnum niveau, int annee, String description, String website, UUID mediaId,
                        boolean shown, UUID sectorId, String sectorName) {

    public static MeceneDto of(MeceneEntity mecene) {
        return new MeceneDto(mecene.getMeceneId(), mecene.getName(), mecene.getNiveau(), mecene.getAnnee(), mecene.getDescription(),
                mecene.getWebsite(), mecene.getMedia() == null ? null : mecene.getMedia().getMediaId(), mecene.isShown(),
                mecene.getSector().getSectorId(), mecene.getSector().getName());
    }

    /** What the Bureau writes about a Mécène; {@code sectorId} is chosen by the Super admin only, at creation. */
    public record Input(String name, String niveau, Integer annee, String description, String website, UUID mediaId, Boolean shown,
                        UUID sectorId) {}
}
