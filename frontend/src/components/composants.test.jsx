// Tests de composants : déconnexion de tous les appareils, message sur la connexion,
// page « Accès à mon dossier », journal de l'administrateur.
import { describe, test, expect, vi } from "vitest";
import { render, screen, waitFor, renderHook, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { API_URL } from "../config.js";
import DeconnexionPartout from "./DeconnexionPartout.jsx";
import Login from "./auth/Login.jsx";
import JournalAcces from "./patient/pages/JournalAcces.jsx";
import useJournal from "./admin/hooks/useJournal.js";

const reponse = (corps, { status = 200, entetes = {} } = {}) =>
  new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json", ...entetes } });

function PageConnexionTest() {
  return <div>Page de connexion — {useLocation().state?.message}</div>;
}

describe("Déconnecter tous mes appareils", () => {
  const afficher = () => render(
    <MemoryRouter initialEntries={["/profil"]}>
      <Routes>
        <Route path="/profil" element={<DeconnexionPartout />} />
        <Route path="/login" element={<PageConnexionTest />} />
      </Routes>
    </MemoryRouter>,
  );

  test("demande une confirmation avant d'agir", async () => {
    const reseau = vi.spyOn(window, "fetch");
    afficher();
    await userEvent.click(screen.getByRole("button", { name: /Déconnecter tous mes appareils/ }));
    expect(screen.getByText(/Toutes vos sessions seront fermées/)).toBeInTheDocument();
    expect(reseau).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(screen.queryByText(/Toutes vos sessions seront fermées/)).toBeNull();
  });

  test("après confirmation : révoque toutes les sessions et renvoie à la connexion avec un message", async () => {
    sessionStorage.setItem("token", "jeton");
    const reseau = vi.spyOn(window, "fetch").mockResolvedValue(reponse({}));
    afficher();
    await userEvent.click(screen.getByRole("button", { name: /Déconnecter tous mes appareils/ }));
    await userEvent.click(screen.getByRole("button", { name: /Oui, tout déconnecter/ }));
    await screen.findByText(/Page de connexion/);
    expect(reseau.mock.calls[0][0]).toBe(`${API_URL}/api/auth/logout-all`);
    expect(screen.getByText(/déconnecté de tous vos appareils/)).toBeInTheDocument();
    expect(sessionStorage.getItem("token")).toBeNull();
  });
});

describe("Page de connexion", () => {
  test("affiche le message transmis par la page précédente", () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/login", state: { message: "Vous avez été déconnecté de tous vos appareils." } }]}>
        <Login />
      </MemoryRouter>,
    );
    expect(screen.getByText("Vous avez été déconnecté de tous vos appareils.")).toBeInTheDocument();
  });

  test("sans message : rien n'est affiché", () => {
    render(<MemoryRouter initialEntries={["/login"]}><Login /></MemoryRouter>);
    expect(screen.queryByText(/déconnecté/)).toBeNull();
  });
});

describe("Accès à mon dossier (patient, donneur)", () => {
  const ENTREES = [
    { id: 2, acteur_id: 9, acteur_nom: "Dr Ba", acteur_role: "medecin", action: "lecture", ressource: "analyses", autorise: false, created_at: "2026-11-26T09:02:00Z" },
    { id: 1, acteur_id: 8, acteur_nom: "Dr Fall", acteur_role: "medecin", action: "lecture", ressource: "ordonnances", autorise: true, created_at: "2026-11-26T09:01:00Z" },
  ];
  const afficher = (role) => {
    sessionStorage.setItem("userId", "5");
    sessionStorage.setItem("role", role);
    sessionStorage.setItem("token", "t");
    vi.spyOn(window, "fetch").mockResolvedValue(reponse(ENTREES, { entetes: { "X-Total-Count": "2", "X-Total-Pages": "1" } }));
    return render(<MemoryRouter><JournalAcces /></MemoryRouter>);
  };

  test("décrit chaque accès en français et signale les refus", async () => {
    afficher("patient");
    expect(await screen.findByText("Dr Fall a consulté vos ordonnances")).toBeInTheDocument();
    expect(screen.getByText("Dr Ba a tenté de consulter vos analyses")).toBeInTheDocument();
    expect(screen.getAllByText("Accès refusé")).toHaveLength(1);
    expect(window.fetch.mock.calls[0][0]).toBe(`${API_URL}/api/journal/patient/5?page=1&limit=20`);
  });

  test("le filtre « Accès refusés » ne garde que les refus", async () => {
    afficher("patient");
    await screen.findByText("Dr Fall a consulté vos ordonnances");
    await userEvent.click(screen.getByRole("button", { name: /Accès refusés/ }));
    expect(screen.queryByText("Dr Fall a consulté vos ordonnances")).toBeNull();
    expect(screen.getByText("Dr Ba a tenté de consulter vos analyses")).toBeInTheDocument();
  });

  test("couleurs de l'espace : bleu pour le patient, rouge pour le donneur", async () => {
    const { unmount } = afficher("patient");
    await screen.findByText("Dr Fall a consulté vos ordonnances");
    expect(screen.getByRole("button", { name: /Tous/ }).className).toMatch(/blue/);
    unmount();
    afficher("donneur");
    await screen.findByText("Dr Fall a consulté vos ordonnances");
    expect(screen.getByRole("button", { name: /Tous/ }).className).toMatch(/red/);
    // accès autorisé en gris neutre : les refus (rouges) restent visibles
    const autorise = screen.getByText("Dr Fall a consulté vos ordonnances").closest("div.border-l-4");
    expect(autorise.className).toMatch(/slate/);
  });
});

describe("Journal d'accès (administrateur)", () => {
  test("ne charge rien tant que la section n'est pas affichée", () => {
    const reseau = vi.spyOn(window, "fetch");
    renderHook(() => useJournal({ token: "t", actif: false }));
    expect(reseau).not.toHaveBeenCalled();
  });

  test("charge la page demandée avec les filtres, et revient à la page 1 quand un filtre change", async () => {
    const reseau = vi.spyOn(window, "fetch").mockImplementation(() =>
      Promise.resolve(reponse([{ id: 1 }], { entetes: { "X-Total-Count": "60", "X-Total-Pages": "3" } })));
    const { result } = renderHook(() => useJournal({ token: "t", actif: true }));
    await waitFor(() => expect(result.current.totalJournal).toBe(60));
    expect(result.current.pagesJournal).toBe(3);
    expect(reseau.mock.calls[0][0]).toBe(`${API_URL}/api/journal?page=1&limit=25`);

    act(() => result.current.setPage(2));
    await waitFor(() => expect(reseau.mock.calls.at(-1)[0]).toContain("page=2"));

    act(() => result.current.changerFiltre("autorise", "false"));
    await waitFor(() => expect(reseau.mock.calls.at(-1)[0]).toBe(`${API_URL}/api/journal?page=1&limit=25&autorise=false`));
    expect(result.current.page).toBe(1);
  });

  test("erreur de l'API : message affichable", async () => {
    vi.spyOn(window, "fetch").mockResolvedValue(reponse({ message: "Accès refusé." }, { status: 403 }));
    const { result } = renderHook(() => useJournal({ token: "t", actif: true }));
    await waitFor(() => expect(result.current.erreurJournal).toBe("Accès refusé."));
    expect(result.current.chargementJournal).toBe(false);
  });
});
