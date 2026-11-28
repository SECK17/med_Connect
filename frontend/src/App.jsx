// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/auth/Login.jsx";
import Register from "./components/auth/Register.jsx";
import CreateAdmin from "./components/auth/CreateAdmin.jsx";
import ForgotPassword from "./components/auth/ForgotPassword.jsx";
import ResetPassword from "./components/auth/ResetPassword.jsx";
import VerifyEmail from "./components/auth/VerifyEmail.jsx";
import AdminDashboard from "./components/admin/AdminDashboard.jsx";
import MedecinLayout from "./components/medecin/MedecinDashboard.jsx";
import PatientLayout from "./components/patient/PatientDashboard.jsx";
import Accueil from "./components/patient/pages/Accueil.jsx";
import RendezVous from "./components/patient/pages/RendezVous.jsx";
import DossierMedical from "./components/patient/pages/DossierMedical.jsx";
import Medecins from "./components/patient/pages/Medecins.jsx";
import Hopitaux from "./components/patient/pages/Hopitaux.jsx";
import DonSang from "./components/patient/pages/DonSang.jsx";
import Alertes from "./components/patient/pages/Alertes.jsx";
import Profil from "./components/patient/pages/Profil.jsx";
import JournalAcces from "./components/patient/pages/JournalAcces.jsx";
import MedecinAccueil from "./components/medecin/pages/Accueil.jsx";
import DemandesRDV from "./components/medecin/pages/DemandesRDV.jsx";
import MedecinRendezVous    from "./components/medecin/pages/RendezVous.jsx";
import MedecinConsultations from "./components/medecin/pages/Consultations.jsx";
import MedecinOrdonnances   from "./components/medecin/pages/Ordonnances.jsx";
import MedecinDisponibilites from "./components/medecin/pages/Disponibilites.jsx";
import MedecinProfil from "./components/medecin/pages/Profil.jsx";
import DossierPatient from "./components/medecin/pages/DossierPatient.jsx";
import MedecinMessages from "./components/medecin/pages/Messages.jsx";
import PatientChat from "./components/patient/pages/Chat.jsx";
import DonneurLayout  from "./components/donneur/DonneurDashboard.jsx";
import DonneurAccueil from "./components/donneur/pages/Accueil.jsx";
import DonneurProfil  from "./components/donneur/pages/Profil.jsx";
import DonneurDonSang from "./components/donneur/pages/DonSang.jsx";
import AdminHopitalLayout   from "./components/adminHopital/AdminHopitalDashboard.jsx";
import AdminHopitalAccueil  from "./components/adminHopital/pages/Accueil.jsx";
import AdminHopitalMedecins from "./components/adminHopital/pages/Medecins.jsx";
import AdminHopitalDonneurs from "./components/adminHopital/pages/Donneurs.jsx";
import AdminHopitalAlertes  from "./components/adminHopital/pages/Alertes.jsx";
import AdminHopitalProfil   from "./components/adminHopital/pages/Profil.jsx";
import AdminHopitalRDV      from "./components/adminHopital/pages/RendezVous.jsx";
import AdminHopitalPatients from "./components/adminHopital/pages/Patients.jsx";
import NotFound from "./components/NotFound.jsx";
import BandeauErreur from "./components/BandeauErreur.jsx";

// ─────────────────────────────────────────────
// Guard pages publiques : redirige si déjà connecté
// ─────────────────────────────────────────────
function PublicRoute({ children }) {
  const token = sessionStorage.getItem("token");
  const role  = sessionStorage.getItem("role");

  if (!token) return children;
  if (role === "admin")        return <Navigate to="/dashboard" replace />;
  if (role === "admin_hopital") return <Navigate to="/dashboard/admin-hopital/accueil" replace />;
  if (role === "medecin")      return <Navigate to="/dashboard/medecin/accueil" replace />;
  if (role === "donneur")      return <Navigate to="/dashboard/donneur/accueil" replace />;
  return <Navigate to="/dashboard/patient/accueil" replace />;
}

// ─────────────────────────────────────────────
// Guard générique : vérifie token + rôle autorisé
// ─────────────────────────────────────────────
function PrivateRoute({ children, allowedRole }) {
  const token = sessionStorage.getItem("token");
  const role  = sessionStorage.getItem("role");

  // Pas connecté → login
  if (!token) return <Navigate to="/login" replace />;

  // Mauvais rôle → renvoie vers son propre dashboard
  if (allowedRole && role !== allowedRole) {
    if (role === "admin")    return <Navigate to="/dashboard" replace />;
    if (role === "medecin")  return <Navigate to="/dashboard/medecin/accueil" replace />;
    if (role === "patient")  return <Navigate to="/dashboard/patient/accueil" replace />;
    if (role === "donneur")  return <Navigate to="/dashboard/donneur/accueil" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ─────────────────────────────────────────────
// Redirige vers le bon dashboard selon le rôle
// ─────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Auth ── */}
        <Route path="/login"        element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register"     element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/create-admin" element={<CreateAdmin />} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password"  element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/verify-email"    element={<VerifyEmail />} />
        <Route path="/"             element={<PublicRoute><Navigate to="/login" replace /></PublicRoute>} />

        {/* ── Redirection automatique post-login ── */}
        <Route path="/dashboard" element={
          <PrivateRoute allowedRole="admin">
            <AdminDashboard />
          </PrivateRoute>
        } />

        {/* ── Patient ── */}
        <Route
          path="/dashboard/patient"
          element={
            <PrivateRoute allowedRole="patient">
              <PatientLayout />
            </PrivateRoute>
          }
        >
          <Route index                  element={<Navigate to="accueil" replace />} />
          <Route path="accueil"         element={<Accueil />} />
          <Route path="rendezvous"      element={<RendezVous />} />
          <Route path="dossier"         element={<DossierMedical />} />
          <Route path="medecins"        element={<Medecins />} />
          <Route path="hopitaux"        element={<Hopitaux />} />
          <Route path="sang"            element={<DonSang />} />
          <Route path="alertes"         element={<Alertes />} />
          <Route path="messages"         element={<PatientChat />} />
          <Route path="profil"          element={<Profil />} />
          <Route path="acces"           element={<JournalAcces />} />
          <Route path="*"               element={<NotFound />} />
        </Route>

        {/* ── Médecin ── */}
        <Route
          path="/dashboard/medecin"
          element={
            <PrivateRoute allowedRole="medecin">
              <MedecinLayout />
            </PrivateRoute>
          }
        >
          <Route index            element={<Navigate to="accueil" replace />} />
          <Route path="accueil"  element={<MedecinAccueil />} />
          <Route path="demandes"        element={<DemandesRDV />} />
          <Route path="rendezvous"      element={<MedecinRendezVous />} />
          <Route path="consultations"   element={<MedecinConsultations />} />
          <Route path="ordonnances"     element={<MedecinOrdonnances />} />
          <Route path="disponibilites"  element={<MedecinDisponibilites />} />
          <Route path="dossiers"        element={<DossierPatient />} />
          <Route path="messages"        element={<MedecinMessages />} />
          <Route path="profil"          element={<MedecinProfil />} />
          <Route path="*"               element={<NotFound />} />
        </Route>

        {/* ── Donneur ── */}
        <Route
          path="/dashboard/donneur"
          element={
            <PrivateRoute allowedRole="donneur">
              <DonneurLayout />
            </PrivateRoute>
          }
        >
          <Route index           element={<Navigate to="accueil" replace />} />
          <Route path="accueil"  element={<DonneurAccueil />} />
          <Route path="don-sang" element={<DonneurDonSang />} />
          <Route path="acces"    element={<JournalAcces />} />
          <Route path="profil"   element={<DonneurProfil />} />
          <Route path="*"        element={<NotFound />} />
        </Route>

        {/* ── Admin Hôpital ── */}
        <Route
          path="/dashboard/admin-hopital"
          element={
            <PrivateRoute allowedRole="admin_hopital">
              <AdminHopitalLayout />
            </PrivateRoute>
          }
        >
          <Route index                   element={<Navigate to="accueil" replace />} />
          <Route path="accueil"          element={<AdminHopitalAccueil />} />
          <Route path="rendezvous"       element={<AdminHopitalRDV />} />
          <Route path="medecins"         element={<AdminHopitalMedecins />} />
          <Route path="patients"         element={<AdminHopitalPatients />} />
          <Route path="donneurs"         element={<AdminHopitalDonneurs />} />
          <Route path="alertes"          element={<AdminHopitalAlertes />} />
          <Route path="profil"           element={<AdminHopitalProfil />} />
          <Route path="*"               element={<NotFound />} />
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BandeauErreur />
    </BrowserRouter>
  );
}