import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../auth/AuthContext";
import { testUser } from "../../test/testUser";
import { seedMecene } from "../../test/fakeApi";
import MecenesPage from "./MecenesPage";

const renderAs = (role: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <AuthProvider user={testUser(role)}>
          <MecenesPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("MecenesPage", () => {
  it("shows the Or first with their description, then the Argent and the Bronze", async () => {
    seedMecene({ name: "Bronze & Fils", niveau: "bronze", sectorId: "sector-1", description: "Pas affichée ici" });
    seedMecene({ name: "Garage du Centre", niveau: "or", sectorId: "sector-1", description: "Partenaire depuis dix ans." });
    seedMecene({ name: "Boulangerie", niveau: "argent", sectorId: "sector-2" });
    renderAs("visiteur");

    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(["Mécènes Or", "Mécènes Argent", "Mécènes Bronze"]);
    expect(screen.getByText("Partenaire depuis dix ans.")).toBeInTheDocument();
    expect(screen.queryByText("Pas affichée ici")).not.toBeInTheDocument();
  });

  it("shows each Secteur's latest Année only, without those put aside", async () => {
    seedMecene({ name: "Ancien", sectorId: "sector-1", annee: 2025 });
    seedMecene({ name: "Actuel", sectorId: "sector-1", annee: 2026 });
    seedMecene({ name: "Masqué", sectorId: "sector-1", annee: 2027, shown: false });
    renderAs("visiteur");

    expect(await screen.findByRole("button", { name: /Actuel/ })).toBeInTheDocument();
    expect(screen.queryByText("Ancien")).not.toBeInTheDocument();
    expect(screen.queryByText("Masqué")).not.toBeInTheDocument();
  });

  it("opens everything about a Mécène in a modal", async () => {
    seedMecene({ name: "Boulangerie", niveau: "bronze", sectorId: "sector-2", description: "Le pain des motards.", website: "https://boulangerie.fr" });
    renderAs("visiteur");

    await userEvent.click(await screen.findByRole("button", { name: /Boulangerie/ }));
    const dialog = screen.getByRole("dialog", { name: "Boulangerie" });
    expect(within(dialog).getByText("Le pain des motards.")).toBeInTheDocument();
    expect(within(dialog).getByText(/Secteur Thionville · 2026/)).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /Visiter son site/ })).toHaveAttribute("href", "https://boulangerie.fr");
  });

  it("says so when there is no Mécène yet", async () => {
    renderAs("visiteur");
    expect(await screen.findByText("Aucun mécène pour le moment.")).toBeInTheDocument();
  });
});
