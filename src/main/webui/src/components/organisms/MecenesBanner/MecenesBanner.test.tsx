import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../../auth/AuthContext";
import { testUser } from "../../../test/testUser";
import { seedMecene, setFakeFeature } from "../../../test/fakeApi";
import MecenesBanner from "./MecenesBanner";

const renderAs = (role: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <AuthProvider user={testUser(role)}>
          <MecenesBanner />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );

const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

describe("MecenesBanner", () => {
  it("scrolls every Niveau, each Mécène reached once, leading to Nos mécènes", async () => {
    seedMecene({ name: "Garage", niveau: "or", sectorId: "sector-1" });
    seedMecene({ name: "Boulangerie", niveau: "bronze", sectorId: "sector-2" });
    renderAs("visiteur");

    expect(await screen.findByRole("region", { name: "Merci à nos mécènes" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
    for (const name of ["Garage", "Boulangerie"]) expect(screen.getByRole("link", { name })).toHaveAttribute("href", "/mecenes");
  });

  it("is absent without any Mécène to show", async () => {
    renderAs("visiteur");
    await settle();
    expect(screen.queryByRole("region", { name: "Merci à nos mécènes" })).not.toBeInTheDocument();
  });

  it("is absent while Mécènes is off (ADR 0009)", async () => {
    seedMecene({ name: "Garage", sectorId: "sector-1" });
    setFakeFeature("mecenes", false);
    renderAs("visiteur");
    await settle();
    expect(screen.queryByRole("region", { name: "Merci à nos mécènes" })).not.toBeInTheDocument();
  });

  it("shows it to the Super admin, marked as turned off", async () => {
    seedMecene({ name: "Garage", sectorId: "sector-1" });
    setFakeFeature("mecenes", false);
    renderAs("super_admin");
    expect(await screen.findByText("Mécènes — désactivée.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("region", { name: "Merci à nos mécènes" })).toBeInTheDocument());
  });
});
