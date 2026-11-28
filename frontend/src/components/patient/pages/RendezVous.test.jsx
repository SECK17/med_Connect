// Prise de rendez-vous : un refus du serveur ou une panne ne doit jamais produire un faux succès.
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import RendezVous from "./RendezVous.jsx";

const reponse = (corps, status = 200) => new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });

/** Faux serveur : liste des médecins, rendez-vous existants, et réponse choisie pour la création. */
function serveur(creation) {
  return vi.spyOn(window, "fetch").mockImplementation((url, options = {}) => {
    if (url.endsWith("/api/medecins")) return Promise.resolve(reponse([{ id: 3, nom: "Dr Fall", specialite: "Cardiologie", hopital: "CHU de Fann" }]));
    if (url.endsWith("/api/rendezvous") && options.method === "POST") return creation();
    return Promise.resolve(reponse([])); // rendez-vous existants, évaluations
  });
}

async function remplirEtEnvoyer() {
  sessionStorage.setItem("token", "t");
  sessionStorage.setItem("userId", "5");
  render(<MemoryRouter><RendezVous /></MemoryRouter>);
  await userEvent.click(screen.getByRole("button", { name: "Prendre un RDV" }));
  // le formulaire apparaît après l'animation de changement d'onglet
  const form = (await screen.findByRole("button", { name: "Confirmer le rendez-vous" })).closest("form");
  const [medecin, heure] = form.querySelectorAll("select");
  await screen.findByRole("option", { name: /Dr Fall/ });
  await userEvent.selectOptions(medecin, "3");
  fireEvent.change(form.querySelector('input[type="date"]'), { target: { value: "2099-12-01" } });
  await userEvent.selectOptions(heure, "10:00");
  await userEvent.type(form.querySelector("textarea"), "Contrôle");
  await userEvent.click(screen.getByRole("button", { name: "Confirmer le rendez-vous" }));
}

const rdvLocaux = () => JSON.parse(localStorage.getItem("medconnect_appointments") || "[]");

describe("Prise de rendez-vous", () => {
  test("refus du serveur : son message s'affiche, aucun rendez-vous n'est ajouté", async () => {
    serveur(() => Promise.resolve(reponse({ message: "La date du rendez-vous ne peut pas être dans le passé." }, 400)));
    await remplirEtEnvoyer();
    expect(await screen.findByText("La date du rendez-vous ne peut pas être dans le passé.")).toBeInTheDocument();
    expect(rdvLocaux()).toEqual([]);
  });

  test("panne réseau : message clair, aucun rendez-vous n'est ajouté", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    serveur(() => Promise.reject(new TypeError("Failed to fetch")));
    await remplirEtEnvoyer();
    expect(await screen.findByText(/le serveur est injoignable/)).toBeInTheDocument();
    expect(rdvLocaux()).toEqual([]);
  });

  test("cas normal : le rendez-vous est enregistré avec l'identifiant donné par le serveur", async () => {
    const reseau = serveur(() => Promise.resolve(reponse({ id: 42 }, 201)));
    await remplirEtEnvoyer();
    await screen.findByText(/confirm|envoy|enregistr/i);
    expect(rdvLocaux()).toHaveLength(1);
    expect(rdvLocaux()[0]).toMatchObject({ id: "42", doctorId: "3", date: "2099-12-01", time: "10:00", status: "En attente" });
    const [, options] = reseau.mock.calls.find(([url, o]) => url.endsWith("/api/rendezvous") && o?.method === "POST");
    expect(JSON.parse(options.body)).toMatchObject({ medecinId: "3", date: "2099-12-01", heure: "10:00", motif: "Contrôle" });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
