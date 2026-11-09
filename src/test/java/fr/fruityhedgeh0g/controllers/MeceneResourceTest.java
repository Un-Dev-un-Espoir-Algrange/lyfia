package fr.fruityhedgeh0g.controllers;

import fr.fruityhedgeh0g.entities.MeceneEntity;
import fr.fruityhedgeh0g.entities.SectorEntity;
import fr.fruityhedgeh0g.entities.UserEntity;
import fr.fruityhedgeh0g.entities.configurations.FeatureSectorLeverEntity;
import fr.fruityhedgeh0g.enums.FeatureEnum;
import fr.fruityhedgeh0g.enums.NiveauEnum;
import fr.fruityhedgeh0g.enums.RoleEnum;
import fr.fruityhedgeh0g.repositories.FeatureSectorLeverRepository;
import fr.fruityhedgeh0g.repositories.MeceneRepository;
import fr.fruityhedgeh0g.repositories.SectorRepository;
import fr.fruityhedgeh0g.repositories.UserRepository;
import fr.fruityhedgeh0g.security.DatabaseRoleAugmentor;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.common.http.TestHTTPEndpoint;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.oidc.Claim;
import io.quarkus.test.security.oidc.OidcSecurity;
import io.restassured.http.ContentType;
import io.restassured.response.ValidatableResponse;
import jakarta.inject.Inject;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.equalTo;

/** The Mécènes: Visiteurs see each Secteur's latest Année, its Bureau manages them. */
@QuarkusTest
@TestHTTPEndpoint(MeceneController.class)
class MeceneResourceTest {

    static final String BUREAU_ID = "00000000-0000-0000-0051-000000000005";
    static final String SUPER_ADMIN_ID = "00000000-0000-0000-0051-000000000007";

    @Inject MeceneRepository meceneRepository;
    @Inject UserRepository userRepository;
    @Inject SectorRepository sectorRepository;
    @Inject FeatureSectorLeverRepository sectorLeverRepository;

    private UUID algrange;
    private UUID thionville;
    private UUID closed;

    @BeforeEach
    void seed() {
        QuarkusTransaction.requiringNew().run(() -> {
            algrange = sector("Algrange", false).getSectorId();
            thionville = sector("Thionville", false).getSectorId();
            closed = sector("Fermé", true).getSectorId();
            userRepository.persist(person(BUREAU_ID, RoleEnum.BUREAU, sectorRepository.findById(algrange)));
            userRepository.persist(person(SUPER_ADMIN_ID, RoleEnum.SUPER_ADMIN, null));
        });
    }

    @AfterEach
    void cleanUp() {
        QuarkusTransaction.requiringNew().run(() -> {
            meceneRepository.deleteAll();
            sectorLeverRepository.deleteAll();
            userRepository.delete("userId in ?1", List.of(UUID.fromString(BUREAU_ID), UUID.fromString(SUPER_ADMIN_ID)));
            sectorRepository.delete("sectorId in ?1", List.of(algrange, thionville, closed));
        });
    }

    private SectorEntity sector(String name, boolean isClosed) {
        SectorEntity s = SectorEntity.builder().name("Mécène " + name + " " + UUID.randomUUID()).build();
        s.setClosed(isClosed);
        sectorRepository.persist(s);
        return s;
    }

    private static UserEntity person(String id, RoleEnum role, SectorEntity sector) {
        return UserEntity.builder().birthDate(java.time.LocalDate.of(1990, 1, 1)).userId(UUID.fromString(id)).firstName("Mécène")
                .lastName(role.name()).role(role).sector(sector).build();
    }

    private void mecene(String name, UUID sectorId, int annee, boolean shown) {
        QuarkusTransaction.requiringNew().run(() -> {
            MeceneEntity m = new MeceneEntity();
            m.setName(name);
            m.setNiveau(NiveauEnum.OR);
            m.setAnnee(annee);
            m.setShown(shown);
            m.setSector(sectorRepository.findById(sectorId));
            meceneRepository.persist(m);
        });
    }

    private static ValidatableResponse create(String body) {
        return given().contentType(ContentType.JSON).body(body).when().post().then();
    }

    @Test
    void visiteursSeeEachSecteursLatestAnnee() {
        mecene("Ancien", algrange, 2025, true);
        mecene("Garage", algrange, 2026, true);
        mecene("De côté", algrange, 2027, false);
        mecene("Boulangerie", thionville, 2024, true);
        mecene("Disparu", closed, 2026, true);

        given().when().get().then().statusCode(200).body("name", containsInAnyOrder("Garage", "Boulangerie"));
    }

    @Test
    void aSecteurWhoseMecenesAreOffKeepsThemFromThePublic() {
        mecene("Garage", algrange, 2026, true);
        mecene("Boulangerie", thionville, 2026, true);
        QuarkusTransaction.requiringNew().run(() -> sectorLeverRepository.persist(FeatureSectorLeverEntity.builder()
                .feature(FeatureEnum.MECENES.id()).sector(sectorRepository.findById(algrange)).isActive(false).build()));

        given().when().get().then().statusCode(200).body("name", containsInAnyOrder("Boulangerie"));
    }

    @Test
    @TestSecurity(user = "bureau", augmentors = DatabaseRoleAugmentor.class)
    @OidcSecurity(claims = @Claim(key = "sub", value = BUREAU_ID))
    void theBureauWritesItsSecteursMecenes() {
        String id = create("{\"name\":\" Garage \",\"niveau\":\"or\",\"annee\":2026,\"website\":\"www.garage.fr\"}")
                .statusCode(200)
                .body("name", equalTo("Garage"))
                .body("niveau", equalTo("or"))
                .body("website", equalTo("https://www.garage.fr"))
                .body("shown", equalTo(true))
                .body("sectorId", equalTo(algrange.toString()))
                .extract().path("id");
        create("{\"name\":\"garage\",\"niveau\":\"argent\",\"annee\":2026}").statusCode(409);
        create("{\"name\":\"Garage\",\"niveau\":\"argent\",\"annee\":2027}").statusCode(200);

        given().contentType(ContentType.JSON).body("{\"name\":\"Garage\",\"niveau\":\"bronze\",\"annee\":2026,\"shown\":false}")
                .when().put("/" + id).then().statusCode(200).body("niveau", equalTo("bronze")).body("shown", equalTo(false));
        mecene("Ailleurs", thionville, 2026, true);
        given().when().get("?managed=true").then().body("annee", containsInAnyOrder(2027, 2026));

        given().when().delete("/" + id).then().statusCode(204);
        given().when().get("?managed=true").then().body("annee", containsInAnyOrder(2027));
    }

    @Test
    @TestSecurity(user = "bureau", augmentors = DatabaseRoleAugmentor.class)
    @OidcSecurity(claims = @Claim(key = "sub", value = BUREAU_ID))
    void aMeceneIsNamedRankedAndOfAnAnnee() {
        create("{\"name\":\" \",\"niveau\":\"or\",\"annee\":2026}").statusCode(400);
        create("{\"name\":\"Garage\",\"niveau\":\"platine\",\"annee\":2026}").statusCode(400);
        create("{\"name\":\"Garage\",\"niveau\":\"or\"}").statusCode(400);
        create("{\"name\":\"Garage\",\"niveau\":\"or\",\"annee\":2026,\"website\":\"pas un site\"}").statusCode(400);
    }

    @Test
    @TestSecurity(user = "bureau", augmentors = DatabaseRoleAugmentor.class)
    @OidcSecurity(claims = @Claim(key = "sub", value = BUREAU_ID))
    void theBureauLeavesOtherSecteursMecenesAlone() {
        mecene("Boulangerie", thionville, 2026, true);
        UUID other = QuarkusTransaction.requiringNew().call(() -> meceneRepository.listAll().getFirst().getMeceneId());
        given().contentType(ContentType.JSON).body("{\"name\":\"Pris\",\"niveau\":\"or\",\"annee\":2026}")
                .when().put("/" + other).then().statusCode(403);
        given().when().delete("/" + other).then().statusCode(403);
    }

    @Test
    @TestSecurity(user = "super", augmentors = DatabaseRoleAugmentor.class)
    @OidcSecurity(claims = @Claim(key = "sub", value = SUPER_ADMIN_ID))
    void theSuperAdminChoosesAnOpenSecteur() {
        create("{\"name\":\"Garage\",\"niveau\":\"or\",\"annee\":2026}").statusCode(400);
        create("{\"name\":\"Garage\",\"niveau\":\"or\",\"annee\":2026,\"sectorId\":\"" + closed + "\"}").statusCode(400);
        create("{\"name\":\"Garage\",\"niveau\":\"or\",\"annee\":2026,\"sectorId\":\"" + thionville + "\"}")
                .statusCode(200).body("sectorId", equalTo(thionville.toString()));
    }

    @Test
    void anonymousVisiteurCannotWrite() {
        create("{\"name\":\"Garage\",\"niveau\":\"or\",\"annee\":2026}").statusCode(401);
        given().when().get().then().body("$", empty());
    }

    @Test
    @TestSecurity(user = "membre", roles = {"benevole", "membre"})
    void aMembreCannotWrite() {
        create("{\"name\":\"Garage\",\"niveau\":\"or\",\"annee\":2026}").statusCode(403);
    }
}
