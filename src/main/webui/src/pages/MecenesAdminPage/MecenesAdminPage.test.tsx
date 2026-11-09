import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/AuthContext";
import { testUser } from "../../test/testUser";
import { seedMecene } from "../../test/fakeApi";
import MecenesAdminPage from "./MecenesAdminPage";

const renderAs = (role: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider user={testUser(role)}>
        <MecenesAdminPage />
      </AuthProvider>
    </QueryClientProvider>
  );

describe("MecenesAdminPage", () => {
  it("shows its Secteur's Mécènes of the latest Année, filtered by Année", async () => {
    seedMecene({ name: "Ancien", sectorId: "sector-1", annee: 2025 });
    seedMecene({ name: "Actuel", sectorId: "sector-1", annee: 2026 });
    seedMecene({ name: "Ailleurs", sectorId: "sector-2", annee: 2026 });
    renderAs("bureau");

    expect(await screen.findByRole("button", { name: /Actuel/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ancien/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ailleurs/ })).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Mécènes de l'année"), "2025");
    expect(screen.getByRole("button", { name: /Ancien/ })).toBeInTheDocument();
  });

  it("takes up an earlier Année's Mécène found by its name", async () => {
    seedMecene({ name: "Garage du Centre", niveau: "argent", sectorId: "sector-1", annee: 2025, description: "Fidèle.", website: "https://garage.fr" });
    renderAs("bureau");

    await userEvent.click(await screen.findByRole("button", { name: "+ Nouveau mécène" }));
    const annee = screen.getByLabelText("Année");
    await userEvent.clear(annee);
    await userEvent.type(annee, "2026");
    await userEvent.type(screen.getByLabelText("Nom"), "garage");
    await userEvent.click(screen.getByRole("button", { name: "Reprendre « Garage du Centre » (Argent, 2025)" }));

    expect(screen.getByLabelText("Nom")).toHaveValue("Garage du Centre");
    expect(screen.getByLabelText(/Description/)).toHaveValue("Fidèle.");
    expect(screen.getByLabelText(/Site de l'entreprise/)).toHaveValue("https://garage.fr");
    await userEvent.click(screen.getByRole("button", { name: "Créer le mécène" }));

    await userEvent.selectOptions(await screen.findByLabelText("Mécènes de l'année"), "2026");
    await waitFor(() => expect(screen.getByRole("button", { name: /Garage du Centre/ })).toBeInTheDocument());
  });

  it("warns of a name already taken that Année", async () => {
    seedMecene({ name: "Garage", sectorId: "sector-1", annee: 2026 });
    renderAs("bureau");

    await userEvent.click(await screen.findByRole("button", { name: "+ Nouveau mécène" }));
    await userEvent.type(screen.getByLabelText("Nom"), "GARAGE");
    expect(screen.getByText("Un mécène de ce nom existe déjà pour cette année.")).toBeInTheDocument();
  });

  it("offers no Galerie for a logo", async () => {
    renderAs("bureau");
    await userEvent.click(await screen.findByRole("button", { name: "+ Nouveau mécène" }));
    expect(screen.queryByRole("button", { name: "Choisir dans la Galerie" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Déposer une image" })).toBeInTheDocument();
  });
});
