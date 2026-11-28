import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config.js";

import { deconnexion } from "../auth.js";
const ROLE_LABELS = {
  patient: "Patient",
  medecin: "Médecin",
  donneur: "Donneur de sang",
  admin: "Administrateur",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => sessionStorage.getItem("token")
    ? { role: sessionStorage.getItem("role"), nom: sessionStorage.getItem("nom") }
    : null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);

  const fetchUsers = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data);

      // Vérifier si c'est le premier admin
      const admins = data.filter(u => u.role === "admin");
      if (admins.length > 0) {
        const firstAdminId = Math.min(...admins.map(a => a.id));
        const currentUserId = data.find(u => u.email === sessionStorage.getItem("email"))?.id;
        setIsFirstAdmin(currentUserId === firstAdminId);
      }
    } catch (err) {
      console.error("Erreur chargement utilisateurs:", err);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const userRole = sessionStorage.getItem("role");

    if (!token) {
      navigate("/login");
      return;
    }

    // Load users if admin
    if (userRole === "admin") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fonction asynchrone : l'état n'est modifié qu'après la réponse de l'API
      fetchUsers();
    }
  }, [navigate]);

  const handleLogout = async () => {
    await deconnexion();
    navigate("/login");
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;

    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/auth/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = ROLE_LABELS[user?.role] || "Utilisateur";

  if (!user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", padding: "20px 40px", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1200px", margin: "0 auto" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px" }}>MedConnect</h1>
            <p style={{ margin: "5px 0 0", opacity: 0.9 }}>Espace {ROLE_LABELS[user.role]}</p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              color: "white",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 20px" }}>
        <div style={{ background: "white", borderRadius: "12px", padding: "40px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
          <h2 style={{ color: "#1f2937", marginBottom: "10px" }}>Bienvenue, {user.nom} !</h2>
          <p style={{ color: "#6b7280", marginBottom: "30px" }}>
            Vous êtes connecté en tant que <strong>{roleLabel}</strong>.
          </p>

          {/* Admin Section */}
          {user.role === "admin" && (
            <>
              {isFirstAdmin && (
                <div style={{ marginBottom: "30px" }}>
                  <button
                    onClick={() => navigate("/create-admin")}
                    style={{
                      background: "#10B981",
                      color: "white",
                      padding: "12px 24px",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Créer un administrateur
                  </button>
                  <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "8px" }}>
                    Seul le premier administrateur peut créer d'autres administrateurs
                  </p>
                </div>
              )}

              <h3 style={{ color: "#1f2937", marginBottom: "20px" }}>Tous les utilisateurs</h3>
              {users.length === 0 ? (
                <p style={{ color: "#6b7280" }}>Aucun utilisateur trouvé.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                        <th style={{ padding: "12px", textAlign: "left", color: "#6b7280", fontSize: "14px" }}>Nom</th>
                        <th style={{ padding: "12px", textAlign: "left", color: "#6b7280", fontSize: "14px" }}>Email</th>
                        <th style={{ padding: "12px", textAlign: "left", color: "#6b7280", fontSize: "14px" }}>Rôle</th>
                        <th style={{ padding: "12px", textAlign: "left", color: "#6b7280", fontSize: "14px" }}>Téléphone</th>
                        <th style={{ padding: "12px", textAlign: "left", color: "#6b7280", fontSize: "14px" }}>Date création</th>
                        <th style={{ padding: "12px", textAlign: "left", color: "#6b7280", fontSize: "14px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "12px", color: "#1f2937" }}>{u.nom}</td>
                          <td style={{ padding: "12px", color: "#6b7280" }}>{u.email}</td>
                          <td style={{ padding: "12px" }}>
                            <span style={{
                              background: u.role === "admin" ? "#dbeafe" : u.role === "medecin" ? "#fef3c7" : "#d1fae5",
                              color: u.role === "admin" ? "#1e40af" : u.role === "medecin" ? "#92400e" : "#065f46",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}>
                              {ROLE_LABELS[u.role]}
                            </span>
                          </td>
                          <td style={{ padding: "12px", color: "#6b7280" }}>{u.telephone}</td>
                          <td style={{ padding: "12px", color: "#6b7280", fontSize: "14px" }}>
                            {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={loading}
                              style={{
                                background: "#fee2e2",
                                color: "#dc2626",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                cursor: loading ? "not-allowed" : "pointer",
                              }}
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Regular User Cards */}
          {user.role !== "admin" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
            <div style={{ background: "#f9fafb", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <h3 style={{ color: "#1f2937", margin: "0 0 10px", fontSize: "16px" }}>Mon Profil</h3>
              <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>Gérer vos informations personnelles</p>
            </div>

            {user.role === "patient" && (
              <>
                <div style={{ background: "#f9fafb", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                  <h3 style={{ color: "#1f2937", margin: "0 0 10px", fontSize: "16px" }}>Mes Rendez-vous</h3>
                  <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>Voir et gérer vos rendez-vous</p>
                </div>
                <div style={{ background: "#f9fafb", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                  <h3 style={{ color: "#1f2937", margin: "0 0 10px", fontSize: "16px" }}>Dossier Médical</h3>
                  <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>Accéder à votre dossier médical</p>
                </div>
              </>
            )}

            {user.role === "medecin" && (
              <>
                <div style={{ background: "#f9fafb", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                  <h3 style={{ color: "#1f2937", margin: "0 0 10px", fontSize: "16px" }}>Mes Patients</h3>
                  <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>Gérer vos patients</p>
                </div>
                <div style={{ background: "#f9fafb", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                  <h3 style={{ color: "#1f2937", margin: "0 0 10px", fontSize: "16px" }}>Agenda</h3>
                  <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>Gérer votre agenda</p>
                </div>
              </>
            )}

            {user.role === "donneur" && (
              <>
                <div style={{ background: "#f9fafb", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                  <h3 style={{ color: "#1f2937", margin: "0 0 10px", fontSize: "16px" }}>Mes Dons</h3>
                  <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>Historique de vos dons de sang</p>
                </div>
                <div style={{ background: "#f9fafb", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                  <h3 style={{ color: "#1f2937", margin: "0 0 10px", fontSize: "16px" }}>Prochain Don</h3>
                  <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>Planifier votre prochain don</p>
                </div>
              </>
            )}
          </div>
          )}
        </div>
      </main>
    </div>
  );
}
