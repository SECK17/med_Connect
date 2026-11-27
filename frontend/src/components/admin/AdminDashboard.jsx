import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  Users, Stethoscope, Heart, Clock, CheckCircle2, XCircle, Trash2,
  LogOut, ShieldCheck, User, Droplets, AlertCircle, LayoutDashboard,
  UserCheck, Activity, Server, Database, Wifi, Search,
  ChevronRight, TrendingUp, Zap, Building2, MapPin, Phone, Plus, X, Loader2, Mail,
  ArrowRightLeft, FileText, CheckCircle, XCircle as XCircleIcon,
  Pencil, AlertTriangle, Bell, CalendarDays,
} from "lucide-react";
import { API_URL } from "../../config.js";

/* ── Constantes ────────────────────────────────────────────── */
const NAV = [
  { key: "overview",    label: "Vue d'ensemble",   icon: LayoutDashboard },
  { key: "users",       label: "Utilisateurs",     icon: Users },
  { key: "validations", label: "Validations",      icon: UserCheck, badge: true },
  { key: "hopitaux",    label: "Hôpitaux",         icon: Building2 },
  { key: "demandes",    label: "Demandes hôpital", icon: ArrowRightLeft, badge: "demandes" },
  { key: "don_sang",    label: "Don de sang",      icon: Heart },
];

const ROLE_CFG = {
  admin:         { label: "Admin",       bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500",  avatar: "bg-violet-100 text-violet-700"  },
  medecin:       { label: "Médecin",     bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", avatar: "bg-emerald-100 text-emerald-700" },
  patient:       { label: "Patient",     bg: "bg-sky-100",     text: "text-sky-700",     dot: "bg-sky-500",     avatar: "bg-sky-100 text-sky-700"         },
  donneur:       { label: "Donneur",     bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500",    avatar: "bg-rose-100 text-rose-700"       },
  admin_hopital: { label: "Admin hôp.", bg: "bg-orange-100",  text: "text-orange-700", dot: "bg-orange-500", avatar: "bg-orange-100 text-orange-700"  },
};

const HEALTH = [
  { label: "Serveur API",        icon: Server,   status: "ok" },
  { label: "Base de données",    icon: Database, status: "ok" },
  { label: "Réseau & API",       icon: Wifi,     status: "ok" },
];

const DAYS_FR  = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const MONTHS_FR = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

/* ── Composant principal ───────────────────────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [section, setSection]         = useState("overview");
  const [userFilter, setUserFilter]   = useState("tous");
  const [userSearch, setUserSearch]   = useState("");
  const [rejectModal, setRejectModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [toast, setToast]             = useState(null);
  const [time, setTime]               = useState(new Date());

  // Hôpitaux
  const [hopitaux, setHopitaux]               = useState([]);
  const [selectedHopital, setSelectedHopital] = useState(null);
  const [hopitalTab, setHopitalTab]           = useState("admin");
  const [hopitalMedecins, setHopitalMedecins] = useState([]);
  const [hopitalPatients, setHopitalPatients] = useState([]);
  const [loadingHop, setLoadingHop]           = useState(false);
  const [hopitalAdmins, setHopitalAdmins]     = useState([]);
  const [showHopAdminCreate, setShowHopAdminCreate] = useState(false);

  // Stats RDV par hôpital { [hopital_id]: { total, confirme, en_attente, annule } }
  const [hopitauxRdvStats, setHopitauxRdvStats] = useState({});
  // Stats RDV détaillées pour le drawer hôpital sélectionné
  const [hopRdvStats, setHopRdvStats] = useState(null);

  // Don de sang global
  const [allAlertes, setAllAlertes]         = useState([]);
  const [loadingAlertes, setLoadingAlertes] = useState(false);
  const [alerteFilter, setAlerteFilter]     = useState("active");

  // Gestion CRUD hôpitaux
  const [hopitalModal, setHopitalModal]     = useState(null); // null | { mode: 'create'|'edit', data: {} }
  const [hopitalForm, setHopitalForm]       = useState({ nom: "", type: "Hôpital", ville: "", telephone: "", adresse: "" });
  const [savingHop, setSavingHop]           = useState(false);
  const [deletingHop, setDeletingHop]       = useState(null);

  // Demandes changement hôpital
  const [demandes, setDemandes]           = useState([]);
  const [loadingDemandes, setLoadingDemandes] = useState(false);
  const [demandeFilter, setDemandeFilter] = useState("en_attente");
  const [rejetModal, setRejetModal]       = useState(null);
  const [rejetMotif, setRejetMotif]       = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // Formulaire création admin hôpital (inline dans le panel hôpital)
  const [createForm, setCreateForm]   = useState({ nom: "", email: "", password: "", telephone: "" });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const token   = sessionStorage.getItem("token");
  const adminNom = sessionStorage.getItem("nom") || "Admin";
  const initiale = adminNom.charAt(0).toUpperCase();

  /* horloge en temps réel */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchHopitaux();
    fetchHopitalAdmins();
    fetchHopitauxRdvStats();
  }, []);

  useEffect(() => {
    if (section === "hopitaux") {
      if (hopitaux.length === 0) fetchHopitaux();
      fetchHopitalAdmins();
    }
    if (section === "demandes") fetchDemandes(demandeFilter);
    if (section === "don_sang") fetchAllAlertes();
  }, [section]);

  useEffect(() => {
    if (section === "demandes") fetchDemandes(demandeFilter);
  }, [demandeFilter]);

  const fetchHopitauxRdvStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hopitaux/rdv-stats-all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const map = {};
        data.forEach(s => { map[s.hopital_id] = s; });
        setHopitauxRdvStats(map);
      }
    } catch {}
  };

  const fetchHopitaux = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hopitaux`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setHopitaux(await res.json());
    } catch {}
  };

  const selectHopital = async (hop) => {
    setSelectedHopital(hop);
    setHopitalTab("admin");
    setShowHopAdminCreate(false);
    setCreateForm({ nom: "", email: "", password: "", telephone: "" });
    setHopitalMedecins([]);
    setHopitalPatients([]);
    setHopRdvStats(null);
    setLoadingHop(true);
    try {
      const [rMed, rPat, rRdv] = await Promise.all([
        fetch(`${API_URL}/api/hopitaux/${hop.id}/medecins`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/hopitaux/${hop.id}/patients`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/hopitaux/${hop.id}/rdv-stats`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (rMed.ok) setHopitalMedecins(await rMed.json());
      if (rPat.ok) setHopitalPatients(await rPat.json());
      if (rRdv.ok) setHopRdvStats(await rRdv.json());
    } catch {}
    setLoadingHop(false);
  };

  const fetchAllAlertes = async () => {
    setLoadingAlertes(true);
    try {
      const res = await fetch(`${API_URL}/api/alertes-sang/toutes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAllAlertes(await res.json());
    } catch {}
    finally { setLoadingAlertes(false); }
  };

  const openCreateHopital = () => {
    setHopitalForm({ nom: "", type: "Hôpital", ville: "", telephone: "", adresse: "" });
    setHopitalModal({ mode: "create" });
  };

  const openEditHopital = (hop) => {
    setHopitalForm({ nom: hop.nom, type: hop.type, ville: hop.ville, telephone: hop.telephone || "", adresse: hop.adresse || "" });
    setHopitalModal({ mode: "edit", id: hop.id });
  };

  const saveHopital = async () => {
    if (!hopitalForm.nom || !hopitalForm.ville) return showToast("Nom et ville requis.", "error");
    setSavingHop(true);
    try {
      const isEdit = hopitalModal.mode === "edit";
      const url    = isEdit ? `${API_URL}/api/hopitaux/${hopitalModal.id}` : `${API_URL}/api/hopitaux`;
      const res = await fetch(url, {
        method:  isEdit ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify(hopitalForm),
      });
      if (res.ok) {
        showToast(isEdit ? "Hôpital mis à jour !" : "Hôpital créé !");
        setHopitalModal(null);
        fetchHopitaux();
      } else {
        const d = await res.json();
        showToast(d.message || "Erreur", "error");
      }
    } catch { showToast("Erreur réseau", "error"); }
    finally { setSavingHop(false); }
  };

  const deleteHopital = async (id) => {
    setDeletingHop(id);
    try {
      const res = await fetch(`${API_URL}/api/hopitaux/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (res.ok) { showToast("Hôpital supprimé.", "info"); fetchHopitaux(); setSelectedHopital(null); }
      else showToast(d.message, "error");
    } catch { showToast("Erreur réseau", "error"); }
    finally { setDeletingHop(null); }
  };

  const fetchDemandes = async (statut = "en_attente") => {
    setLoadingDemandes(true);
    try {
      const res = await fetch(`${API_URL}/api/demandes-hopital?statut=${statut}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setDemandes(await res.json());
    } catch {}
    finally { setLoadingDemandes(false); }
  };

  const validerDemande = async (id) => {
    setActionLoading(id + "_val");
    try {
      const res = await fetch(`${API_URL}/api/demandes-hopital/${id}/valider`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { showToast("Demande validée — hôpital mis à jour !"); fetchDemandes(demandeFilter); }
      else { const d = await res.json(); showToast(d.message, "error"); }
    } catch { showToast("Erreur réseau", "error"); }
    finally { setActionLoading(null); }
  };

  const rejeterDemande = async () => {
    const id = rejetModal?.id;
    if (!id) return;
    setActionLoading(id + "_rej");
    try {
      const res = await fetch(`${API_URL}/api/demandes-hopital/${id}/rejeter`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ motif: rejetMotif }),
      });
      if (res.ok) {
        showToast("Demande rejetée.", "info");
        setRejetModal(null);
        setRejetMotif("");
        fetchDemandes(demandeFilter);
      } else { const d = await res.json(); showToast(d.message, "error"); }
    } catch { showToast("Erreur réseau", "error"); }
    finally { setActionLoading(null); }
  };

  const fetchHopitalAdmins = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin-hopital`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setHopitalAdmins(await res.json());
    } catch {}
  };

  const createAdminHop = async () => {
    if (!createForm.nom || !createForm.email || !createForm.password || !selectedHopital) return;
    setCreatingAdmin(true);
    try {
      const res = await fetch(`${API_URL}/api/admin-hopital`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...createForm, hopital_id: selectedHopital.id }),
      });
      if (res.ok) {
        showToast("Admin créé avec succès !");
        setShowHopAdminCreate(false);
        setCreateForm({ nom: "", email: "", password: "", telephone: "" });
        fetchHopitalAdmins();
      } else {
        const d = await res.json();
        showToast(d.message || "Erreur lors de la création", "error");
      }
    } catch { showToast("Erreur réseau", "error"); }
    finally { setCreatingAdmin(false); }
  };

  const deleteAdminHop = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin-hopital/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { showToast("Admin retiré.", "info"); fetchHopitalAdmins(); }
      else { const d = await res.json(); showToast(d.message || "Erreur", "error"); }
    } catch { showToast("Erreur réseau", "error"); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleValidate = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/validate`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { showToast("Compte médecin validé !"); fetchUsers(); }
      else { const d = await res.json(); throw new Error(d.message); }
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleReject = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/reject`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { showToast("Compte rejeté.", "info"); setRejectModal(null); fetchUsers(); }
      else { const d = await res.json(); throw new Error(d.message); }
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleDelete = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { showToast("Utilisateur supprimé.", "info"); setDeleteModal(null); fetchUsers(); }
      else { const d = await res.json(); throw new Error(d.message); }
    } catch (err) { showToast(err.message, "error"); }
  };

  /* Stats dérivées */
  const stats = {
    total:           users.length,
    patients:        users.filter(u => u.role === "patient").length,
    medecins:        users.filter(u => u.role === "medecin").length,
    donneurs:        users.filter(u => u.role === "donneur").length,
    admins_hopital:  users.filter(u => u.role === "admin_hopital").length,
    pendingMedecins: users.filter(u => u.role === "medecin" && !u.isVerified && u.isActive !== false).length,
  };

  const pendingList = users.filter(u => u.role === "medecin" && !u.isVerified && u.isActive !== false);

  const activity = [...users]
    .filter(u => u.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 9);

  const filteredUsers = users.filter(u => {
    if (userFilter !== "tous" && u.role !== userFilter) return false;
    const q = userSearch.toLowerCase();
    if (q && !u.nom?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false;
    return true;
  });

  /* Horloge formatée */
  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const ss = String(time.getSeconds()).padStart(2, "0");
  const dateStr = `${DAYS_FR[time.getDay()]} ${time.getDate()} ${MONTHS_FR[time.getMonth()]} ${time.getFullYear()}`;

  /* ── Rendu ── */
  return (
    <div className="flex min-h-screen bg-slate-100 overflow-hidden">

      {/* ══════════════════════════════════════
          SIDEBAR (collapsible via group-hover)
      ══════════════════════════════════════ */}
      <aside className="group fixed top-0 left-0 bottom-0 w-[64px] hover:w-[230px] transition-all duration-300 ease-in-out bg-indigo-950 z-50 shadow-2xl shadow-indigo-950/50 flex flex-col overflow-hidden">

        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-indigo-800/40 flex-shrink-0">
          <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-400/30">
            <Heart size={16} className="text-indigo-950" />
          </div>
          <div className="overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75 whitespace-nowrap">
            <div className="text-[15px] font-extrabold text-white tracking-tight">MedConnect</div>
            <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-widest">Administration</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-hidden">
          <div className="px-2 mb-3 h-4 overflow-hidden">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap">
              Navigation
            </span>
          </div>
          {NAV.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`relative w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150 group/btn ${
                section === key
                  ? "bg-violet-600 shadow-lg shadow-violet-900/50"
                  : "hover:bg-indigo-900/60"
              }`}
            >
              {/* Indicateur actif */}
              {section === key && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-full" />
              )}

              <div className={`relative w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                section === key ? "bg-white/20" : "bg-indigo-800/40 group-hover/btn:bg-indigo-700/60"
              }`}>
                <Icon size={16} className={section === key ? "text-white" : "text-indigo-400 group-hover/btn:text-indigo-200"} />
                {badge === true && stats.pendingMedecins > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-indigo-950 group-hover:hidden" />
                )}
                {badge === "demandes" && demandes.filter(d => d.statut === "en_attente").length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-400 rounded-full border-2 border-indigo-950 group-hover:hidden" />
                )}
              </div>

              <div className="flex-1 flex items-center justify-between overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75 whitespace-nowrap">
                <span className={`text-[13px] font-medium ${section === key ? "text-white" : "text-indigo-300"}`}>
                  {label}
                </span>
                {badge === true && stats.pendingMedecins > 0 && (
                  <span className="bg-amber-400 text-indigo-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                    {stats.pendingMedecins}
                  </span>
                )}
                {badge === "demandes" && demandes.filter(d => d.statut === "en_attente").length > 0 && (
                  <span className="bg-rose-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                    {demandes.filter(d => d.statut === "en_attente").length}
                  </span>
                )}
              </div>
            </button>
          ))}
        </nav>

        {/* Footer admin */}
        <div className="px-2 pb-4 flex-shrink-0 border-t border-indigo-800/40 pt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center text-indigo-950 font-extrabold text-[14px] flex-shrink-0 shadow-md">
              {initiale}
            </div>
            <div className="overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75 whitespace-nowrap flex-1">
              <div className="text-[12px] font-bold text-white truncate">{adminNom}</div>
              <div className="text-[10px] text-amber-400/80 flex items-center gap-1">
                <ShieldCheck size={9} /> Administrateur
              </div>
            </div>
            <button
              onClick={() => { sessionStorage.clear(); navigate("/login"); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-7 h-7 rounded-lg flex items-center justify-center text-indigo-400 hover:bg-red-500/20 hover:text-red-400"
              title="Déconnexion"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          ZONE PRINCIPALE
      ══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col ml-[64px] min-h-screen">

        {/* Topbar */}
        <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm flex-shrink-0">
          {/* Horloge */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="text-[11px] text-gray-400 font-medium">{dateStr}</div>
              <div className="text-[18px] font-bold text-indigo-950 font-mono leading-none tracking-wider">
                {hh}:{mm}
                <span className="text-gray-300">:{ss}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {stats.pendingMedecins > 0 && (
              <button
                onClick={() => setSection("validations")}
                className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-semibold px-3 py-1.5 rounded-xl hover:bg-amber-100 transition-colors"
              >
                <AlertCircle size={13} className="text-amber-500" />
                {stats.pendingMedecins} en attente
              </button>
            )}
            <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 pl-2 pr-3 py-1.5 rounded-xl">
              <div className="w-7 h-7 bg-amber-400 rounded-lg flex items-center justify-center text-indigo-950 text-[11px] font-extrabold">
                {initiale}
              </div>
              <div className="hidden sm:block">
                <div className="text-[12px] font-bold text-violet-900 leading-tight">{adminNom}</div>
                <div className="text-[10px] text-violet-500 leading-none">Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">

            {/* ────────────────────────────────
                VUE D'ENSEMBLE
            ──────────────────────────────── */}
            {section === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

                {/* Titre */}
                <div className="flex items-end justify-between">
                  <div>
                    <h1 className="text-[22px] font-extrabold text-indigo-950 tracking-tight">
                      Bonjour, {adminNom} 👋
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">Vue d'ensemble du système MedConnect</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[12px] text-emerald-700 font-semibold">Système opérationnel</span>
                  </div>
                </div>

                {/* Stat cards — gradient */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: "Utilisateurs",  value: stats.total,            icon: Users,       from: "from-violet-500",  to: "to-indigo-700",  glow: "shadow-violet-500/30"  },
                    { label: "Patients",      value: stats.patients,         icon: User,        from: "from-sky-400",     to: "to-blue-600",    glow: "shadow-sky-500/30"     },
                    { label: "Médecins",      value: stats.medecins,         icon: Stethoscope, from: "from-emerald-400", to: "to-teal-600",    glow: "shadow-emerald-500/30" },
                    { label: "Admins",         value: stats.admins_hopital,   icon: Building2,   from: "from-orange-400",  to: "to-amber-500",   glow: "shadow-orange-500/30"  },
                    { label: "En attente",    value: stats.pendingMedecins,  icon: Clock,       from: "from-amber-400",   to: "to-orange-500",  glow: "shadow-amber-500/30"   },
                    { label: "Donneurs",      value: stats.donneurs,         icon: Droplets,    from: "from-rose-400",    to: "to-pink-600",    glow: "shadow-rose-500/30"    },
                  ].map(({ label, value, icon: Icon, from, to, glow }, i) => (
                    <motion.div key={label}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-5 text-white shadow-lg ${glow}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                          <Icon size={17} className="text-white" />
                        </div>
                        <TrendingUp size={14} className="text-white/50" />
                      </div>
                      <div className="text-3xl font-extrabold">{value}</div>
                      <div className="text-[11px] text-white/75 mt-0.5 font-medium">{label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* ── Graphe inscriptions par mois ── */}
                {!loading && users.length > 0 && (() => {
                  const months = Array.from({ length: 6 }, (_, i) => {
                    const d = new Date();
                    d.setDate(1);
                    d.setMonth(d.getMonth() - (5 - i));
                    const y = d.getFullYear(), m = d.getMonth();
                    return {
                      label: d.toLocaleDateString("fr-FR", { month: "short" }),
                      patients:  users.filter(u => u.role === "patient"  && new Date(u.createdAt).getFullYear() === y && new Date(u.createdAt).getMonth() === m).length,
                      medecins:  users.filter(u => u.role === "medecin"  && new Date(u.createdAt).getFullYear() === y && new Date(u.createdAt).getMonth() === m).length,
                      total:     users.filter(u => new Date(u.createdAt).getFullYear() === y && new Date(u.createdAt).getMonth() === m).length,
                    };
                  });
                  return (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-gray-200 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
                          <TrendingUp size={14} className="text-violet-500"/> Inscriptions — 6 derniers mois
                        </h2>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[11px] text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"/>Patients</span>
                          <span className="flex items-center gap-1 text-[11px] text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/>Médecins</span>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={months} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradPat" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#0EA5E9" stopOpacity={0.18}/>
                              <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="gradMed" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#10B981" stopOpacity={0.18}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false}/>
                          <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false}/>
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB", boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}
                            formatter={(v, n) => [v, n === "patients" ? "Patients" : "Médecins"]}/>
                          <Area type="monotone" dataKey="patients" stroke="#0EA5E9" strokeWidth={2} fill="url(#gradPat)" dot={false}/>
                          <Area type="monotone" dataKey="medecins" stroke="#10B981" strokeWidth={2} fill="url(#gradMed)" dot={false}/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </motion.div>
                  );
                })()}

                {/* Alerte validation */}
                {stats.pendingMedecins > 0 && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5"
                  >
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertCircle size={15} className="text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-amber-800">
                        {stats.pendingMedecins} médecin{stats.pendingMedecins > 1 ? "s" : ""} en attente de validation
                      </div>
                      <div className="text-[11px] text-amber-600">Ces comptes ne peuvent pas se connecter tant qu'ils ne sont pas validés.</div>
                    </div>
                    <button onClick={() => setSection("validations")}
                      className="flex items-center gap-1 text-[12px] font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap"
                    >
                      Voir <ChevronRight size={13} />
                    </button>
                  </motion.div>
                )}

                {/* Deux colonnes : activité + santé */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">

                  {/* Feed activité */}
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                      <Activity size={15} className="text-violet-500" />
                      <h2 className="text-[14px] font-bold text-gray-900">Activité récente</h2>
                      <span className="ml-auto text-[11px] text-gray-400">Dernières inscriptions</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {loading ? (
                        <div className="py-8 text-center text-[13px] text-gray-400">Chargement…</div>
                      ) : activity.length === 0 ? (
                        <div className="py-8 text-center text-[13px] text-gray-400">Aucune activité</div>
                      ) : activity.map((u, i) => {
                        const rc = ROLE_CFG[u.role] || ROLE_CFG.patient;
                        return (
                          <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] flex-shrink-0 ${rc.avatar}`}>
                              {(u.nom || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-semibold text-gray-900 truncate">{u.nom}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${rc.bg} ${rc.text}`}>
                                  {rc.label}
                                </span>
                                <span className="text-[11px] text-gray-400 truncate">{u.email}</span>
                              </div>
                            </div>
                            <div className="text-[11px] text-gray-400 flex-shrink-0">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "—"}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Santé système */}
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Zap size={14} className="text-emerald-500" />
                        <h2 className="text-[14px] font-bold text-gray-900">Santé du système</h2>
                      </div>
                      <div className="px-5 py-3 space-y-3">
                        {HEALTH.map(({ label, icon: Icon, status }) => (
                          <div key={label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <Icon size={13} className="text-emerald-600" />
                              </div>
                              <span className="text-[13px] text-gray-700 font-medium">{label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="text-[11px] text-emerald-600 font-semibold">OK</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Répartition rapide */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                      <h3 className="text-[13px] font-bold text-gray-900 mb-4">Répartition</h3>
                      <div className="space-y-3">
                        {[
                          { label: "Patients",     value: stats.patients,       total: stats.total, color: "bg-sky-500"    },
                          { label: "Médecins",     value: stats.medecins,       total: stats.total, color: "bg-emerald-500"},
                          { label: "Donneurs",     value: stats.donneurs,       total: stats.total, color: "bg-rose-500"   },
                          { label: "Admins",       value: stats.admins_hopital, total: stats.total, color: "bg-orange-500" },
                        ].map(({ label, value, total, color }) => {
                          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                          return (
                            <div key={label}>
                              <div className="flex justify-between mb-1">
                                <span className="text-[12px] text-gray-600 font-medium">{label}</span>
                                <span className="text-[12px] text-gray-400">{value} · {pct}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className={`h-full rounded-full ${color}`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ────────────────────────────────
                UTILISATEURS
            ──────────────────────────────── */}
            {section === "users" && (
              <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h1 className="text-[20px] font-extrabold text-indigo-950 tracking-tight">Utilisateurs</h1>
                  <p className="text-[13px] text-gray-500 mt-0.5">Gérer tous les comptes de la plateforme</p>
                </div>

                {/* Filtres + recherche */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
                    {[
                      { key: "tous",          label: "Tous",          count: stats.total           },
                      { key: "patient",       label: "Patients",      count: stats.patients        },
                      { key: "medecin",       label: "Médecins",      count: stats.medecins        },
                      { key: "donneur",       label: "Donneurs",      count: stats.donneurs        },
                      { key: "admin_hopital", label: "Admins hôp.",   count: stats.admins_hopital  },
                    ].map(({ key, label, count }) => (
                      <button key={key} onClick={() => setUserFilter(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                          userFilter === key
                            ? "bg-indigo-950 text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        {label}
                        <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                          userFilter === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                        }`}>{count}</span>
                      </button>
                    ))}
                  </div>
                  <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                      placeholder="Rechercher…"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Grille de cartes */}
                {loading ? (
                  <div className="text-center py-16 text-[13px] text-gray-400">Chargement…</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-16">
                    <Users size={32} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-[13px] text-gray-400">Aucun utilisateur trouvé</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredUsers.map((u, i) => {
                      const rc = ROLE_CFG[u.role] || ROLE_CFG.patient;
                      return (
                        <motion.div key={u.id}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                          className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:border-gray-300 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-[15px] flex-shrink-0 ${rc.avatar}`}>
                              {(u.nom || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="text-[14px] font-bold text-gray-900 truncate">{u.nom}</div>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rc.bg} ${rc.text}`}>
                                  {rc.label}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-400 truncate mt-0.5">{u.email}</div>
                              {u.role === "medecin" && (
                                <div className="space-y-1 mt-1.5">
                                  <div className="flex items-center gap-1">
                                    {u.isVerified
                                      ? <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full"><CheckCircle2 size={9}/> Validé</span>
                                      : <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full"><Clock size={9}/> En attente</span>
                                    }
                                    {u.specialite && (
                                      <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">{u.specialite}</span>
                                    )}
                                  </div>
                                  {u.hopital && (
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                      <Building2 size={9} className="text-gray-400" />
                                      <span className="truncate">{u.hopital}</span>
                                    </div>
                                  )}
                                  {!u.hopital && (
                                    <div className="text-[10px] text-gray-300 italic">Hôpital non renseigné</div>
                                  )}
                                </div>
                              )}
                              {u.role === "admin_hopital" && (() => {
                                const ha = hopitalAdmins.find(a => a.user?.id === u.id);
                                const hop = ha ? hopitaux.find(h => h.id === ha.hopital_id) : null;
                                return (
                                  <div className="mt-1.5">
                                    {hop ? (
                                      <div className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full w-fit">
                                        <Building2 size={9}/> <span className="truncate max-w-[120px]">{hop.nom}</span>
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-gray-300 italic">Hôpital non assigné</div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <span className="text-[11px] text-gray-400">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "—"}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {u.role === "medecin" && !u.isVerified && u.isActive !== false && (
                                <>
                                  <button onClick={() => handleValidate(u.id)}
                                    className="flex items-center gap-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg transition-colors"
                                  >
                                    <CheckCircle2 size={9} /> Valider
                                  </button>
                                  <button onClick={() => setRejectModal(u)}
                                    className="flex items-center gap-1 text-[10px] font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2 py-1 rounded-lg transition-colors"
                                  >
                                    <XCircle size={9} /> Rejeter
                                  </button>
                                </>
                              )}
                              <button onClick={() => setDeleteModal(u)}
                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ────────────────────────────────
                VALIDATIONS
            ──────────────────────────────── */}
            {section === "validations" && (
              <motion.div key="validations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="flex items-end justify-between">
                  <div>
                    <h1 className="text-[20px] font-extrabold text-indigo-950 tracking-tight">Validations médecins</h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">Comptes en attente de vérification</p>
                  </div>
                  {stats.pendingMedecins > 0 && (
                    <div className="flex items-center gap-2 bg-amber-100 border border-amber-200 text-amber-800 text-[13px] font-semibold px-4 py-2 rounded-xl">
                      <Clock size={14} />
                      {stats.pendingMedecins} en attente
                    </div>
                  )}
                </div>

                {pendingList.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-white border border-gray-200 rounded-2xl py-20 text-center"
                  >
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={28} className="text-emerald-500" />
                    </div>
                    <p className="text-[15px] font-semibold text-gray-700">Tout est à jour</p>
                    <p className="text-[13px] text-gray-400 mt-1">Aucun compte médecin en attente de validation</p>
                  </motion.div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingList.map((u, i) => (
                      <motion.div key={u.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white border-2 border-amber-200 rounded-2xl p-5 hover:shadow-lg hover:shadow-amber-100 transition-all"
                      >
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-extrabold text-[16px] flex-shrink-0">
                            {(u.nom || "M").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[15px] font-bold text-gray-900">{u.nom}</div>
                            <div className="text-[12px] text-gray-500 truncate">{u.email}</div>
                            {u.specialite && (
                              <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                                <Stethoscope size={10} /> {u.specialite}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0">
                            <Clock size={9} /> En attente
                          </div>
                        </div>

                        <div className="text-[11px] text-gray-400 mb-4">
                          Inscrit le {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => handleValidate(u.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-xl transition-colors shadow-md shadow-emerald-200"
                          >
                            <CheckCircle2 size={14} /> Valider
                          </button>
                          <button onClick={() => setRejectModal(u)}
                            className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[13px] font-bold rounded-xl transition-colors"
                          >
                            <XCircle size={14} /> Rejeter
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ────────────────────────────────
                HÔPITAUX
            ──────────────────────────────── */}
            {section === "hopitaux" && (
              <motion.div key="hopitaux" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* ── Header ── */}
                <div className="flex items-end justify-between">
                  <div>
                    <h1 className="text-[22px] font-extrabold text-indigo-950 tracking-tight">Hôpitaux</h1>
                    <p className="text-[13px] text-slate-500 mt-0.5">{hopitaux.length} établissement(s) enregistré(s)</p>
                  </div>
                  <button onClick={openCreateHopital}
                    className="flex items-center gap-2 bg-indigo-950 hover:bg-indigo-900 text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-md shadow-indigo-200"
                  >
                    <Plus size={14} /> Ajouter un hôpital
                  </button>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Total",            val: hopitaux.length,                                  bg: "bg-indigo-50",  icon: Building2,      ico: "text-indigo-600",  num: "text-indigo-950" },
                    { label: "Avec admin",  val: hopitalAdmins.length,                             bg: "bg-emerald-50", icon: ShieldCheck,    ico: "text-emerald-600", num: "text-emerald-700" },
                    { label: "Sans admin",  val: Math.max(0, hopitaux.length - hopitalAdmins.length), bg: "bg-amber-50",   icon: AlertTriangle, ico: "text-amber-600",   num: "text-amber-700"  },
                  ].map(({ label, val, bg, icon: Icon, ico, num }) => (
                    <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon size={18} className={ico} />
                      </div>
                      <div>
                        <div className={`text-[26px] font-extrabold leading-none ${num}`}>{val}</div>
                        <div className="text-[11px] text-gray-500 font-medium mt-0.5">{label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Grille des cards ── */}
                {hopitaux.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-2xl py-20 text-center">
                    <Building2 size={32} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-[14px] font-semibold text-gray-600 mb-1">Aucun hôpital enregistré</p>
                    <button onClick={openCreateHopital} className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-800 mt-1">
                      + Ajouter le premier hôpital
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {hopitaux.map((h, i) => {
                      const admin = hopitalAdmins.find(a => a.hopital_id === h.id);
                      return (
                        <motion.div key={h.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          onClick={() => selectHopital(h)}
                          className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all group cursor-pointer"
                        >
                          {/* Card top */}
                          <div className="bg-gradient-to-br from-indigo-50 via-slate-50 to-white px-5 py-4 border-b border-gray-100">
                            <div className="flex items-start gap-3">
                              <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                                <Building2 size={19} className="text-indigo-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[14px] font-extrabold text-gray-900 truncate">{h.nom}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">{h.type}</span>
                                  <span className="flex items-center gap-0.5 text-[11px] text-gray-400"><MapPin size={9}/> {h.ville}</span>
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button onClick={e => { e.stopPropagation(); openEditHopital(h); }}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Modifier"
                                ><Pencil size={12}/></button>
                                <button onClick={e => { e.stopPropagation(); deleteHopital(h.id); }}
                                  disabled={deletingHop === h.id}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Supprimer"
                                >
                                  {deletingHop === h.id ? <Loader2 size={12} className="animate-spin"/> : <Trash2 size={12}/>}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Card body */}
                          <div className="px-5 py-3.5">
                            {admin ? (
                              <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center text-rose-700 font-bold text-[11px] flex-shrink-0">
                                  {(admin.user?.nom || "A").charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[12px] font-semibold text-gray-900 truncate">{admin.user?.nom}</div>
                                  <div className="text-[10px] text-gray-400">Admin</div>
                                </div>
                                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200 flex-shrink-0">
                                  <CheckCircle2 size={8}/> Actif
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mb-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                <AlertTriangle size={11} className="text-amber-500 flex-shrink-0"/>
                                <span className="text-[11px] text-amber-700 font-medium">Aucun admin assigné</span>
                              </div>
                            )}
                            {/* Stats RDV de cet hôpital */}
                            {(() => {
                              const s = hopitauxRdvStats[h.id];
                              if (!s) return null;
                              return (
                                <div className="flex items-center gap-2 mb-3 text-[11px]">
                                  <span className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                                    <CalendarDays size={9}/> {s.total} RDV
                                  </span>
                                  {s.confirme > 0 && (
                                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{s.confirme} confirmés</span>
                                  )}
                                  {s.en_attente > 0 && (
                                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{s.en_attente} en attente</span>
                                  )}
                                </div>
                              );
                            })()}
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-gray-400 font-medium">Voir les détails</span>
                              <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all"/>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* ── Drawer détail hôpital ── */}
                <AnimatePresence>
                  {selectedHopital && (
                    <>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
                        onClick={() => { setSelectedHopital(null); setShowHopAdminCreate(false); }}
                      />
                      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 bottom-0 w-full max-w-[480px] bg-white z-50 shadow-2xl flex flex-col"
                      >
                        {/* Drawer header gradient */}
                        <div className="bg-gradient-to-br from-indigo-950 to-indigo-700 px-5 pt-5 pb-0">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Building2 size={20} className="text-white"/>
                              </div>
                              <div>
                                <div className="text-[16px] font-extrabold text-white leading-tight">{selectedHopital.nom}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-full">{selectedHopital.type}</span>
                                  <span className="flex items-center gap-0.5 text-[11px] text-indigo-200"><MapPin size={9}/> {selectedHopital.ville}</span>
                                  {selectedHopital.telephone && (
                                    <span className="flex items-center gap-0.5 text-[11px] text-indigo-200"><Phone size={9}/> {selectedHopital.telephone}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button onClick={() => { setSelectedHopital(null); setShowHopAdminCreate(false); }}
                              className="w-8 h-8 bg-white/10 hover:bg-white/25 rounded-lg flex items-center justify-center text-white transition-colors flex-shrink-0 mt-0.5"
                            ><X size={16}/></button>
                          </div>

                          {/* Tabs dans le header */}
                          <div className="flex gap-0.5">
                            {[
                              { k: "admin",    l: "Admin",     Icon: ShieldCheck,  count: null                      },
                              { k: "medecins", l: "Médecins",  Icon: Stethoscope, count: hopitalMedecins.length    },
                              { k: "patients", l: "Patients",  Icon: User,        count: hopitalPatients.length    },
                              { k: "rdvs",     l: "RDVs",      Icon: CalendarDays, count: hopRdvStats?.total ?? null },
                            ].map(({ k, l, Icon, count }) => (
                              <button key={k} onClick={() => setHopitalTab(k)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-[12px] font-semibold transition-all ${
                                  hopitalTab === k
                                    ? "bg-white text-indigo-950"
                                    : "text-white/60 hover:text-white hover:bg-white/10"
                                }`}
                              >
                                <Icon size={12}/> {l}
                                {count !== null && (
                                  <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                                    hopitalTab === k ? "bg-indigo-100 text-indigo-700" : "bg-white/20 text-white"
                                  }`}>{count}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Drawer body */}
                        <div className="flex-1 overflow-y-auto bg-gray-50">
                          {loadingHop ? (
                            <div className="flex items-center justify-center h-40 text-[13px] text-gray-400">Chargement…</div>
                          ) : (
                            <AnimatePresence mode="wait">

                              {/* ── Secrétaire ── */}
                              {hopitalTab === "admin" && (() => {
                                const admin = hopitalAdmins.find(a => a.hopital_id === selectedHopital.id);
                                return (
                                  <motion.div key="adm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
                                    {admin ? (
                                      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4">
                                        <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 font-extrabold text-[22px] flex-shrink-0">
                                          {(admin.user?.nom || "A").charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-[15px] font-bold text-gray-900">{admin.user?.nom}</div>
                                          <div className="flex items-center gap-1 text-[12px] text-gray-500 mt-0.5">
                                            <Mail size={11}/> {admin.user?.email}
                                          </div>
                                          {admin.user?.telephone && admin.user.telephone !== "—" && (
                                            <div className="flex items-center gap-1 text-[12px] text-gray-500">
                                              <Phone size={11}/> {admin.user.telephone}
                                            </div>
                                          )}
                                          <span className="inline-flex items-center gap-1 mt-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            <CheckCircle2 size={9}/> Admin actif
                                          </span>
                                        </div>
                                        <button onClick={() => deleteAdminHop(admin.id)}
                                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                          title="Retirer"
                                        ><Trash2 size={15}/></button>
                                      </div>
                                    ) : showHopAdminCreate ? (
                                      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
                                        <div className="text-[13px] font-semibold text-gray-700">
                                          Assigner un admin à <span className="text-indigo-600">{selectedHopital.nom}</span>
                                        </div>
                                        {[
                                          { key: "nom",       label: "Nom complet *",   placeholder: "Ex: Kouyaté Mamadou",  type: "text"     },
                                          { key: "email",     label: "Email *",          placeholder: "admin@hopital.gn",     type: "email"    },
                                          { key: "password",  label: "Mot de passe *",   placeholder: "Minimum 6 caractères", type: "password" },
                                          { key: "telephone", label: "Téléphone",        placeholder: "Ex: 620 00 00 00",     type: "text"     },
                                        ].map(({ key, label, placeholder, type }) => (
                                          <div key={key}>
                                            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">{label}</label>
                                            <input type={type} value={createForm[key] || ""}
                                              onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))}
                                              placeholder={placeholder}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                            />
                                          </div>
                                        ))}
                                        <div className="flex gap-2 pt-1">
                                          <button onClick={createAdminHop}
                                            disabled={creatingAdmin || !createForm.nom || !createForm.email || !createForm.password}
                                            className="flex-1 h-10 bg-indigo-950 hover:bg-indigo-900 disabled:opacity-50 text-white text-[13px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                          >
                                            {creatingAdmin ? <Loader2 size={13} className="animate-spin"/> : <><Plus size={13}/> Créer</>}
                                          </button>
                                          <button onClick={() => setShowHopAdminCreate(false)}
                                            className="h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] rounded-xl transition-colors"
                                          >Annuler</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center justify-center py-16">
                                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                                          <ShieldCheck size={26} className="text-indigo-300"/>
                                        </div>
                                        <p className="text-[14px] font-semibold text-gray-700 mb-1">Aucun admin</p>
                                        <p className="text-[12px] text-gray-400 mb-5 text-center">Cet hôpital n'a pas encore d'admin assigné.</p>
                                        <button
                                          onClick={() => { setShowHopAdminCreate(true); setCreateForm({ nom: "", email: "", password: "", telephone: "" }); }}
                                          className="flex items-center gap-2 bg-indigo-950 hover:bg-indigo-900 text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-colors"
                                        >
                                          <Plus size={14}/> Assigner un admin
                                        </button>
                                      </div>
                                    )}
                                  </motion.div>
                                );
                              })()}

                              {/* ── Médecins ── */}
                              {hopitalTab === "medecins" && (
                                <motion.div key="med" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                  {hopitalMedecins.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                      <Stethoscope size={28} className="text-gray-200 mb-2"/>
                                      <p className="text-[13px] text-gray-400">Aucun médecin enregistré ici</p>
                                    </div>
                                  ) : (
                                    <div className="divide-y divide-gray-100">
                                      {hopitalMedecins.map((m, i) => (
                                        <motion.div key={m.id}
                                          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                          className="flex items-center gap-3 px-5 py-3.5 bg-white hover:bg-gray-50 transition-colors"
                                        >
                                          <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-[13px] flex-shrink-0">
                                            {m.nom.charAt(0).toUpperCase()}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-semibold text-gray-900 truncate">{m.nom}</div>
                                            <div className="text-[11px] text-gray-400 truncate">{m.email}</div>
                                          </div>
                                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            {m.specialite && m.specialite !== "—" && (
                                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">{m.specialite}</span>
                                            )}
                                            {m.valide ? (
                                              <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium"><CheckCircle2 size={9}/> Validé</span>
                                            ) : (
                                              <button
                                                onClick={() => handleValidate(m.id)}
                                                className="flex items-center gap-0.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded-full transition-colors"
                                              >
                                                <CheckCircle2 size={9}/> Valider
                                              </button>
                                            )}
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>
                                  )}
                                </motion.div>
                              )}

                              {/* ── Patients ── */}
                              {hopitalTab === "patients" && (
                                <motion.div key="pat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                  {hopitalPatients.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                      <User size={28} className="text-gray-200 mb-2"/>
                                      <p className="text-[13px] text-gray-400">Aucun patient n'a encore consulté ici</p>
                                    </div>
                                  ) : (
                                    <div className="divide-y divide-gray-100">
                                      {hopitalPatients.map((p, i) => (
                                        <motion.div key={p.id}
                                          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                          className="flex items-center gap-3 px-5 py-3.5 bg-white hover:bg-gray-50 transition-colors"
                                        >
                                          <div className="w-9 h-9 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 font-bold text-[13px] flex-shrink-0">
                                            {p.nom.charAt(0).toUpperCase()}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-semibold text-gray-900 truncate">{p.nom}</div>
                                            <div className="text-[11px] text-gray-400 truncate">{p.email}</div>
                                          </div>
                                          {p.groupeSanguin && p.groupeSanguin !== "—" && (
                                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200 flex-shrink-0">
                                              <Droplets size={9}/> {p.groupeSanguin}
                                            </span>
                                          )}
                                        </motion.div>
                                      ))}
                                    </div>
                                  )}
                                </motion.div>
                              )}

                              {/* ── RDVs ── */}
                              {hopitalTab === "rdvs" && (
                                <motion.div key="rdvs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-3">
                                  {!hopRdvStats ? (
                                    <div className="text-center py-10 text-gray-400 text-sm">Chargement…</div>
                                  ) : (
                                    <>
                                      <div className="grid grid-cols-2 gap-3">
                                        {[
                                          { label: "Total",      val: hopRdvStats.total,      bg: "bg-slate-50",   num: "text-slate-800",   border: "border-slate-200"   },
                                          { label: "Confirmés",  val: hopRdvStats.confirme,   bg: "bg-emerald-50", num: "text-emerald-700", border: "border-emerald-200" },
                                          { label: "En attente", val: hopRdvStats.en_attente, bg: "bg-amber-50",   num: "text-amber-700",   border: "border-amber-200"   },
                                          { label: "Transmis",   val: hopRdvStats.transfere,  bg: "bg-blue-50",    num: "text-blue-700",    border: "border-blue-200"    },
                                          { label: "Annulés",    val: hopRdvStats.annule,     bg: "bg-red-50",     num: "text-red-600",     border: "border-red-200"     },
                                        ].map(({ label, val, bg, num, border }) => (
                                          <div key={label} className={`${bg} border ${border} rounded-xl p-4`}>
                                            <div className={`text-[30px] font-extrabold leading-none ${num}`}>{val}</div>
                                            <div className="text-[11px] text-gray-500 font-medium mt-1">{label}</div>
                                          </div>
                                        ))}
                                      </div>
                                      {hopRdvStats.total === 0 && (
                                        <div className="text-center py-6 text-[13px] text-gray-400">
                                          Aucun rendez-vous enregistré pour cet hôpital.
                                        </div>
                                      )}
                                    </>
                                  )}
                                </motion.div>
                              )}

                            </AnimatePresence>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

              </motion.div>
            )}

            {/* ────────────────────────────────
                DON DE SANG GLOBAL
            ──────────────────────────────── */}
            {section === "don_sang" && (
              <motion.div key="don_sang" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                {/* Header */}
                <div className="flex items-end justify-between flex-wrap gap-3">
                  <div>
                    <h1 className="text-[20px] font-extrabold text-indigo-950 tracking-tight flex items-center gap-2">
                      <Heart size={18} className="text-rose-500" /> Don de sang — Vue globale
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">Toutes les alertes sang de la plateforme</p>
                  </div>
                  <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
                    {[
                      { key: "active",   label: "Actives"   },
                      { key: "terminee", label: "Terminées" },
                      { key: "annulee",  label: "Annulées"  },
                      { key: "all",      label: "Toutes"    },
                    ].map(({ key, label }) => (
                      <button key={key} onClick={() => setAlerteFilter(key)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                          alerteFilter === key ? "bg-indigo-950 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                {/* Stats rapides */}
                {(() => {
                  const actives   = allAlertes.filter(a => a.statut === "active");
                  const critiques = actives.filter(a => a.urgence === "Critique");
                  const hopitaux_ = [...new Set(actives.map(a => a.hopital_nom))];
                  return (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: "Alertes actives",     val: actives.length,    bg: "bg-rose-50",    ico: "bg-rose-100 text-rose-600",    num: "text-rose-600"    },
                        { label: "Niveaux critiques",   val: critiques.length,  bg: "bg-red-50",     ico: "bg-red-100 text-red-600",      num: "text-red-600"     },
                        { label: "Hôpitaux concernés",  val: hopitaux_.length,  bg: "bg-violet-50",  ico: "bg-violet-100 text-violet-600",num: "text-violet-700"  },
                        { label: "Total alertes",       val: allAlertes.length, bg: "bg-slate-50",   ico: "bg-slate-100 text-slate-600",  num: "text-slate-700"   },
                      ].map(({ label, val, bg, ico, num }, i) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                          className={`${bg} border border-gray-100 rounded-2xl p-4`}
                        >
                          <div className={`w-8 h-8 rounded-xl ${ico} flex items-center justify-center mb-3`}>
                            <Heart size={14} />
                          </div>
                          <div className={`text-[26px] font-extrabold leading-none mb-1 ${num}`}>{loadingAlertes ? "—" : val}</div>
                          <div className="text-[11px] text-gray-500 font-medium">{label}</div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })()}

                {/* Liste alertes */}
                {loadingAlertes ? (
                  <div className="text-center py-16 text-gray-400 text-sm">Chargement…</div>
                ) : (() => {
                  const filtered = alerteFilter === "all"
                    ? allAlertes
                    : allAlertes.filter(a => a.statut === alerteFilter);

                  const URGENCE_CFG = {
                    Critique: { bg: "bg-red-100",    text: "text-red-700",    border: "border-red-200"    },
                    Urgent:   { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
                    Moyen:    { bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200"  },
                    Faible:   { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200"   },
                  };
                  const STATUT_CFG = {
                    active:   { bg: "bg-emerald-100", text: "text-emerald-700", label: "Active"   },
                    terminee: { bg: "bg-gray-100",    text: "text-gray-500",    label: "Terminée" },
                    annulee:  { bg: "bg-red-100",     text: "text-red-500",     label: "Annulée"  },
                  };

                  if (filtered.length === 0) return (
                    <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">
                      <Bell size={28} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-[13px] text-gray-400">Aucune alerte pour ce filtre</p>
                    </div>
                  );

                  return (
                    <div className="space-y-3">
                      {filtered.map((a, i) => {
                        const ucfg = URGENCE_CFG[a.urgence] || URGENCE_CFG.Moyen;
                        const scfg = STATUT_CFG[a.statut]   || STATUT_CFG.active;
                        return (
                          <motion.div key={a.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                            className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4"
                          >
                            <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                              <Droplets size={18} className="text-rose-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-[14px] font-bold text-gray-900">Groupe {a.groupe_sang}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ucfg.bg} ${ucfg.text} ${ucfg.border}`}>{a.urgence}</span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${scfg.bg} ${scfg.text}`}>{scfg.label}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                <Building2 size={10} className="text-gray-400" />
                                <span className="font-medium">{a.hopital_nom || "—"}</span>
                                {a.quantite && <span className="text-gray-300">·</span>}
                                {a.quantite && <span>{a.quantite}</span>}
                              </div>
                              {a.message && <div className="text-[11px] text-gray-400 italic mt-0.5">"{a.message}"</div>}
                            </div>
                            <div className="text-[11px] text-gray-300 flex-shrink-0">
                              {new Date(a.created_at).toLocaleDateString("fr-FR")}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* ────────────────────────────────
                DEMANDES HÔPITAL
            ──────────────────────────────── */}
            {section === "demandes" && (
              <motion.div key="demandes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                {/* Header */}
                <div className="flex items-end justify-between flex-wrap gap-3">
                  <div>
                    <h1 className="text-[20px] font-extrabold text-indigo-950 tracking-tight flex items-center gap-2">
                      <ArrowRightLeft size={18} className="text-violet-500" /> Demandes de changement d'hôpital
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">Validez ou rejetez les demandes des médecins</p>
                  </div>
                  {/* Filtres statut */}
                  <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
                    {[
                      { key: "en_attente", label: "En attente", color: "bg-amber-500" },
                      { key: "validee",    label: "Validées",   color: "bg-emerald-500" },
                      { key: "rejetee",    label: "Rejetées",   color: "bg-red-500" },
                    ].map(({ key, label, color }) => (
                      <button key={key} onClick={() => setDemandeFilter(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                          demandeFilter === key ? "bg-indigo-950 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${demandeFilter === key ? "bg-white" : color}`} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Liste */}
                {loadingDemandes ? (
                  <div className="text-center py-16 text-gray-400 text-sm">Chargement…</div>
                ) : demandes.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-2xl py-20 text-center">
                    <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ArrowRightLeft size={26} className="text-violet-300" />
                    </div>
                    <p className="text-[15px] font-semibold text-gray-700">Aucune demande</p>
                    <p className="text-[13px] text-gray-400 mt-1">
                      {demandeFilter === "en_attente" ? "Pas de demande en attente pour l'instant." :
                       demandeFilter === "validee"    ? "Aucune demande validée." :
                       "Aucune demande rejetée."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {demandes.map((d, i) => (
                      <motion.div key={d.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className={`bg-white border rounded-2xl p-5 ${
                          d.statut === "en_attente" ? "border-amber-200 shadow-sm shadow-amber-50" :
                          d.statut === "validee"    ? "border-emerald-200" : "border-red-100"
                        }`}
                      >
                        <div className="flex items-start gap-4 flex-wrap">
                          {/* Avatar médecin */}
                          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-extrabold text-[16px] flex-shrink-0">
                            {(d.medecin?.nom || "M").charAt(0).toUpperCase()}
                          </div>

                          {/* Infos */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[15px] font-bold text-gray-900">{d.medecin?.nom || "—"}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                d.statut === "en_attente" ? "bg-amber-100 text-amber-700" :
                                d.statut === "validee"    ? "bg-emerald-100 text-emerald-700" :
                                "bg-red-100 text-red-600"
                              }`}>
                                {d.statut === "en_attente" ? "En attente" : d.statut === "validee" ? "Validée" : "Rejetée"}
                              </span>
                            </div>
                            <div className="text-[12px] text-gray-500 mb-2">{d.medecin?.email}</div>

                            {/* Flèche hôpital */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[12px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
                                {d.hopital_actuel || "Non renseigné"}
                              </span>
                              <ArrowRightLeft size={12} className="text-gray-400 flex-shrink-0" />
                              <span className="text-[12px] bg-violet-100 text-violet-700 px-2.5 py-1 rounded-lg font-bold">
                                {d.hopital_demande}
                              </span>
                            </div>

                            {/* Justificatif */}
                            {d.justificatif && (
                              <a
                                href={`${API_URL}/uploads/demandes/${d.justificatif}`}
                                target="_blank" rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline"
                              >
                                <FileText size={11} /> {d.justificatif}
                              </a>
                            )}

                            {/* Motif rejet */}
                            {d.statut === "rejetee" && d.motif_rejet && (
                              <div className="mt-2 text-[11px] text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">
                                Motif : {d.motif_rejet}
                              </div>
                            )}

                            <div className="text-[11px] text-gray-300 mt-1.5">
                              Soumise le {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                            </div>
                          </div>

                          {/* Actions */}
                          {d.statut === "en_attente" && (
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              <button
                                onClick={() => validerDemande(d.id)}
                                disabled={actionLoading === d.id + "_val"}
                                className="flex items-center gap-1.5 h-9 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[12px] font-bold rounded-xl transition-colors shadow-sm shadow-emerald-200"
                              >
                                {actionLoading === d.id + "_val"
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : <CheckCircle size={12} />}
                                Valider
                              </button>
                              <button
                                onClick={() => { setRejetModal(d); setRejetMotif(""); }}
                                className="flex items-center gap-1.5 h-9 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[12px] font-bold rounded-xl transition-colors"
                              >
                                <XCircleIcon size={12} /> Rejeter
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}


          </AnimatePresence>
        </main>
      </div>

      {/* ══ Toast ══ */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-[13px] font-semibold border ${
              toast.type === "error" ? "bg-red-50 border-red-200 text-red-700" :
              toast.type === "info"  ? "bg-blue-50 border-blue-200 text-blue-700" :
              "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {toast.type === "error" ? <XCircle size={14}/> : <CheckCircle2 size={14}/>}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Modal Hôpital (Créer / Modifier) ══ */}
      <AnimatePresence>
        {hopitalModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setHopitalModal(null)}
          >
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <span className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                  <Building2 size={15} className="text-indigo-500" />
                  {hopitalModal.mode === "create" ? "Ajouter un hôpital" : "Modifier l'hôpital"}
                </span>
                <button onClick={() => setHopitalModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { key: "nom",       label: "Nom *",      placeholder: "Ex : Hôpital Principal de Dakar" },
                  { key: "ville",     label: "Ville *",    placeholder: "Ex : Dakar" },
                  { key: "telephone", label: "Téléphone",  placeholder: "Ex : 33 000 00 00" },
                  { key: "adresse",   label: "Adresse",    placeholder: "Ex : Avenue Cheikh Anta Diop" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">{label}</label>
                    <input
                      value={hopitalForm[key]}
                      onChange={e => setHopitalForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Type *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Hôpital", "Clinique", "CHU", "Centre"].map(t => (
                      <button key={t} onClick={() => setHopitalForm(f => ({ ...f, type: t }))}
                        className={`py-2 rounded-lg text-[12px] font-semibold border transition-all ${hopitalForm.type === t ? "bg-indigo-950 text-white border-indigo-950" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300"}`}
                      >{t}</button>
                    ))}
                  </div>
                </div>
                <button onClick={saveHopital} disabled={savingHop || !hopitalForm.nom || !hopitalForm.ville}
                  className="w-full h-11 bg-indigo-950 hover:bg-indigo-900 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors mt-1"
                >
                  {savingHop ? <Loader2 size={16} className="animate-spin" /> : hopitalModal.mode === "create" ? <><Plus size={14} /> Créer l'hôpital</> : <><CheckCircle size={14} /> Enregistrer</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Modal Rejeter Demande ══ */}
      <AnimatePresence>
        {rejetModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setRejetModal(null)}
          >
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <XCircleIcon size={20} className="text-red-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Rejeter la demande</div>
                  <div className="text-[12px] text-gray-500">{rejetModal.medecin?.nom}</div>
                </div>
              </div>
              <div className="text-[13px] text-gray-600 mb-3">
                <span className="font-semibold">{rejetModal.hopital_actuel || "Non renseigné"}</span>
                {" → "}
                <span className="font-semibold text-violet-700">{rejetModal.hopital_demande}</span>
              </div>
              <div className="mb-4">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Motif du rejet (optionnel)</label>
                <textarea
                  value={rejetMotif}
                  onChange={e => setRejetMotif(e.target.value)}
                  placeholder="Ex: Documents insuffisants, demande non justifiée…"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={rejeterDemande} disabled={actionLoading === rejetModal.id + "_rej"}
                  className="flex-1 h-10 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-[13px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  {actionLoading === rejetModal.id + "_rej"
                    ? <Loader2 size={13} className="animate-spin" />
                    : <XCircleIcon size={13} />}
                  Confirmer le rejet
                </button>
                <button onClick={() => setRejetModal(null)} className="h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] rounded-xl transition-colors">
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ══ Modal Rejeter ══ */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setRejectModal(null)}
          >
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle size={20} className="text-red-600" />
                </div>
                <div className="font-bold text-gray-900">Rejeter ce médecin ?</div>
              </div>
              <p className="text-[13px] text-gray-500 mb-5">
                Le compte de <span className="font-bold text-gray-800">{rejectModal.nom}</span> sera rejeté.
              </p>
              <div className="flex gap-2">
                <button onClick={() => handleReject(rejectModal.id)} className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold rounded-xl transition-colors">
                  Confirmer
                </button>
                <button onClick={() => setRejectModal(null)} className="h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] rounded-xl transition-colors">
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Modal Supprimer ══ */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setDeleteModal(null)}
          >
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 size={20} className="text-red-600" />
                </div>
                <div className="font-bold text-gray-900">Supprimer cet utilisateur ?</div>
              </div>
              <p className="text-[13px] text-gray-500 mb-5">
                <span className="font-bold text-gray-800">{deleteModal.nom}</span> sera définitivement supprimé. Cette action est irréversible.
              </p>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(deleteModal.id)} className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold rounded-xl transition-colors">
                  Supprimer
                </button>
                <button onClick={() => setDeleteModal(null)} className="h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] rounded-xl transition-colors">
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
