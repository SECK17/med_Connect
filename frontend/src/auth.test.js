// Tests de auth.js : interception de fetch, renouvellement de session, fin de session.
import { describe, test, expect, vi, beforeEach } from "vitest";
import { API_URL } from "./config.js";

const json = (status, corps) => new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });

// auth.js remplace window.fetch au chargement : on installe d'abord un faux « réseau »,
// puis on recharge le module pour chaque test.
let reseau;
let auth;
beforeEach(async () => {
  vi.resetModules();
  reseau = vi.fn();
  window.fetch = reseau;
  window.history.pushState({}, "", "/dashboard");
  auth = await import("./auth.js");
});

describe("Interception des appels à l'API", () => {
  test("ajoute credentials: include (cookie de session) sans toucher au reste", async () => {
    reseau.mockResolvedValue(json(200, { ok: true }));
    await window.fetch(`${API_URL}/api/medecins`, { headers: { Authorization: "Bearer a" } });
    expect(reseau).toHaveBeenCalledWith(`${API_URL}/api/medecins`, expect.objectContaining({ credentials: "include" }));
  });

  test("les appels hors API ne sont pas modifiés", async () => {
    reseau.mockResolvedValue(new Response("ok"));
    await window.fetch("https://tuiles.exemple.org/1/2/3.png");
    expect(reseau).toHaveBeenCalledWith("https://tuiles.exemple.org/1/2/3.png", {});
  });

  test("401 : renouvelle la session puis rejoue la requête avec le nouveau jeton", async () => {
    sessionStorage.setItem("token", "ancien");
    reseau
      .mockResolvedValueOnce(json(401, { code: "TOKEN_EXPIRE" }))
      .mockResolvedValueOnce(json(200, { token: "nouveau", user: { id: 7, role: "patient", nom: "Awa", email: "awa@x.sn" } }))
      .mockResolvedValueOnce(json(200, [{ id: 1 }]));

    const res = await window.fetch(`${API_URL}/api/messages`, { headers: { Authorization: "Bearer ancien" } });

    expect(await res.json()).toEqual([{ id: 1 }]);
    expect(reseau.mock.calls[1][0]).toBe(`${API_URL}/api/auth/refresh`);
    expect(reseau.mock.calls[2][1].headers.Authorization).toBe("Bearer nouveau");
    expect(sessionStorage.getItem("token")).toBe("nouveau");
    expect(sessionStorage.getItem("userId")).toBe("7");
  });

  test("plusieurs 401 en même temps : un seul renouvellement", async () => {
    reseau.mockImplementation((url) => {
      if (url.endsWith("/api/auth/refresh")) return Promise.resolve(json(200, { token: "nouveau" }));
      return Promise.resolve(url.includes("rejoue") ? json(200, {}) : json(401, {}));
    });
    const appel = (n) => window.fetch(`${API_URL}/api/x${n}`, { headers: { Authorization: "Bearer ancien" } });
    await Promise.all([appel(1), appel(2), appel(3)]);
    expect(reseau.mock.calls.filter(([url]) => url.endsWith("/api/auth/refresh"))).toHaveLength(1);
  });

  test("renouvellement impossible : la session est vidée et l'utilisateur renvoyé à la connexion", async () => {
    sessionStorage.setItem("token", "ancien");
    const assign = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({ ...window.location, pathname: "/dashboard", assign });
    reseau.mockResolvedValueOnce(json(401, {})).mockResolvedValueOnce(json(401, {}));

    const res = await window.fetch(`${API_URL}/api/messages`, { headers: { Authorization: "Bearer ancien" } });

    expect(res.status).toBe(401);
    expect(sessionStorage.getItem("token")).toBeNull();
    expect(assign).toHaveBeenCalledWith("/login");
  });

  test("401 sur la connexion (mauvais mot de passe) : pas de renouvellement", async () => {
    reseau.mockResolvedValue(json(401, { message: "Email ou mot de passe incorrect." }));
    await window.fetch(`${API_URL}/api/auth/login`, { method: "POST", headers: { Authorization: "Bearer x" } });
    expect(reseau).toHaveBeenCalledTimes(1);
  });

  test("401 sans jeton envoyé : pas de renouvellement", async () => {
    reseau.mockResolvedValue(json(401, {}));
    await window.fetch(`${API_URL}/api/medecins`);
    expect(reseau).toHaveBeenCalledTimes(1);
  });
});

describe("Déconnexion", () => {
  test("deconnexion() révoque la session côté serveur et vide la session locale", async () => {
    sessionStorage.setItem("token", "t");
    reseau.mockResolvedValue(json(200, {}));
    await auth.deconnexion();
    expect(reseau).toHaveBeenCalledWith(`${API_URL}/api/auth/logout`, expect.objectContaining({ method: "POST", credentials: "include" }));
    expect(sessionStorage.getItem("token")).toBeNull();
  });

  test("deconnexion() hors ligne : la session locale est quand même vidée", async () => {
    sessionStorage.setItem("token", "t");
    reseau.mockRejectedValue(new TypeError("Failed to fetch"));
    await auth.deconnexion();
    expect(sessionStorage.getItem("token")).toBeNull();
  });

  test("deconnexionPartout() appelle logout-all avec le jeton", async () => {
    sessionStorage.setItem("token", "t");
    reseau.mockResolvedValue(json(200, {}));
    await auth.deconnexionPartout();
    const [url, options] = reseau.mock.calls[0];
    expect(url).toBe(`${API_URL}/api/auth/logout-all`);
    expect(options.headers.Authorization).toBe("Bearer t");
    expect(sessionStorage.getItem("token")).toBeNull();
  });
});
