package fr.fruityhedgeh0g.controllers;

import fr.fruityhedgeh0g.dtos.MeceneDto;
import fr.fruityhedgeh0g.enums.FeatureEnum;
import fr.fruityhedgeh0g.services.FeatureLevers;
import fr.fruityhedgeh0g.services.MeceneService;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.UUID;

/**
 * The Mécènes: Visiteurs see those of each Secteur's latest Année; the Bureau sees and manages its own, even while
 * Mécènes is off (ADR 0009).
 */
@Path("/mecenes")
@Produces(MediaType.APPLICATION_JSON)
public class MeceneController {

    @Inject MeceneService meceneService;
    @Inject SecurityIdentity identity;
    @Inject FeatureLevers featureLevers;

    /** {@code ?managed=true}: every Mécène of the Secteurs the Bureau manages, for the Mécènes admin screen. */
    @GET
    public List<MeceneDto> list(@QueryParam("managed") boolean managed) {
        featureLevers.requireForPublic(FeatureEnum.MECENES);
        return managed && identity.hasRole("bureau") ? meceneService.listManaged() : meceneService.listForPublic();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("bureau")
    public MeceneDto create(@NotNull MeceneDto.Input input) {
        return meceneService.create(input);
    }

    @PUT
    @Path("/{meceneId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("bureau")
    public MeceneDto update(@PathParam("meceneId") UUID meceneId, @NotNull MeceneDto.Input input) {
        return meceneService.update(meceneId, input);
    }

    @DELETE
    @Path("/{meceneId}")
    @RolesAllowed("bureau")
    public void delete(@PathParam("meceneId") UUID meceneId) {
        meceneService.delete(meceneId);
    }
}
