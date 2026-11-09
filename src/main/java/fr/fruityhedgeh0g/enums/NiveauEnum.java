package fr.fruityhedgeh0g.enums;

import com.fasterxml.jackson.annotation.JsonValue;
import fr.fruityhedgeh0g.exceptions.InvalidResourceException;

import java.util.Arrays;

/** How prominently a Mécène is honoured, in the order the public sees them. */
public enum NiveauEnum {
    OR,
    ARGENT,
    BRONZE;

    @JsonValue
    public String id() {
        return name().toLowerCase();
    }

    /** The Niveau named by its id, as the API reads it. */
    public static NiveauEnum of(String id) {
        return Arrays.stream(values()).filter(n -> n.id().equals(id)).findFirst()
                .orElseThrow(() -> new InvalidResourceException("Unknown Niveau: " + id));
    }
}
