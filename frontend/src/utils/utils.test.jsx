// Tests des modules utilitaires : fichiers médicaux, signalement d'erreur, messages non lus.
import { describe, test, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { API_URL } from "../config.js";
import { fileUrl, isPdf, formatDate } from "./fichiers.js";
import { signalerErreur, EVENEMENT_ERREUR, MESSAGE_RESEAU } from "./erreurs.js";
import { compterNonLus } from "./messages.js";
import BandeauErreur from "../components/BandeauErreur.jsx";

describe("Fichiers médicaux", () => {
  test("fileUrl ajoute le jeton lu au moment de l'appel", () => {
    sessionStorage.setItem("token", "a b/c");
    expect(fileUrl("uploads/analyses/x.png")).toBe(`${API_URL}/uploads/analyses/x.png?token=a%20b%2Fc`);
    sessionStorage.setItem("token", "nouveau");
    expect(fileUrl("uploads/analyses/x.png")).toMatch(/token=nouveau$/);
  });

  test("isPdf reconnaît les PDF, quelle que soit la casse", () => {
    expect(isPdf("a/B.PDF")).toBe(true);
    expect(isPdf("a/b.png")).toBe(false);
    expect(isPdf(undefined)).toBeFalsy();
  });

  test("formatDate écrit la date en français", () => {
    expect(formatDate("2026-11-20")).toBe("20 novembre 2026");
  });
});

describe("Signalement des erreurs", () => {
  test("signalerErreur trace l'erreur et diffuse l'événement", () => {
    const trace = vi.spyOn(console, "error").mockImplementation(() => {});
    const recu = vi.fn();
    window.addEventListener(EVENEMENT_ERREUR, recu);
    signalerErreur(new Error("panne"));
    expect(trace).toHaveBeenCalled();
    expect(recu.mock.calls[0][0].detail.message).toBe(MESSAGE_RESEAU);
    window.removeEventListener(EVENEMENT_ERREUR, recu);
  });

  test("le bandeau s'affiche, se ferme au clic, et disparaît seul", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<BandeauErreur />);
    expect(screen.queryByRole("alert")).toBeNull();

    act(() => signalerErreur(new Error("x"), "Serveur injoignable"));
    expect(screen.getByRole("alert")).toHaveTextContent("Serveur injoignable");
    await userEvent.click(screen.getByLabelText("Fermer"));
    expect(screen.queryByRole("alert")).toBeNull();

    vi.useFakeTimers();
    act(() => signalerErreur(new Error("x")));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(8000));
    expect(screen.queryByRole("alert")).toBeNull();
    vi.useRealTimers();
  });
});

describe("Messages non lus", () => {
  test("sans connexion : null, sans appel réseau", async () => {
    const reseau = vi.spyOn(window, "fetch");
    expect(await compterNonLus()).toBeNull();
    expect(reseau).not.toHaveBeenCalled();
  });

  test("renvoie le nombre de messages non lus", async () => {
    sessionStorage.setItem("token", "t");
    vi.spyOn(window, "fetch").mockResolvedValue(new Response(JSON.stringify({ count: 3 }), { status: 200 }));
    expect(await compterNonLus()).toBe(3);
  });

  test("panne réseau : null et erreur signalée", async () => {
    sessionStorage.setItem("token", "t");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    const recu = vi.fn();
    window.addEventListener(EVENEMENT_ERREUR, recu);
    expect(await compterNonLus()).toBeNull();
    expect(recu).toHaveBeenCalled();
    window.removeEventListener(EVENEMENT_ERREUR, recu);
  });
});
