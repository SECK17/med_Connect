import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Calendar, FolderOpen, Stethoscope,
  Building2, Droplets, Bell, User, LogOut, Menu, X, Heart,
  CheckCircle2, MessageSquare,
} from "lucide-react";

const NAV = [
  { to: "accueil",    icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "rendezvous", icon: Calendar,        label: "Mes rendez-vous" },
  { to: "messages",   icon: MessageSquare,   label: "Messages",        badge: "msg" },
  { to: "dossier",    icon: FolderOpen,      label: "Dossier médical" },
  { to: "medecins",   icon: Stethoscope,     label: "Trouver un médecin" },
  { to: "hopitaux",   icon: Building2,       label: "Prestataires" },
  { to: "sang",       icon: Droplets,        label: "Don de sang" },
  { to: "alertes",    icon: Bell,            label: "Alertes" },
  { to: "profil",     icon: User,            label: "Mon profil" },
];

export default function PatientLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifs,      setNotifs]      = useState([]);
  const [showNotifs,  setShowNotifs]  = useState(false);
  const nom      = sessionStorage.getItem("nom") || "Patient";
  const email    = sessionStorage.getItem("email") || "";
  const initiales = nom.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const logout = () => { sessionStorage.clear(); navigate("/login"); };

  const loadNotifs = () => {
    const saved = JSON.parse(localStorage.getItem("medconnect_patient_notifications") || "[]");
    setNotifs(saved);
  };

  const markAllRead = () => {
    const updated = notifs.map(n => ({ ...n, read: true }));
    localStorage.setItem("medconnect_patient_notifications", JSON.stringify(updated));
    setNotifs(updated);
  };

  const clearAll = () => {
    localStorage.setItem("medconnect_patient_notifications", "[]");
    setNotifs([]);
  };

  useEffect(() => { loadNotifs(); }, []);

  // Précharge les tuiles CartoDB Dakar dès la connexion — même URL fixe que le TileLayer
  useEffect(() => {
    const base = "https://a.basemaps.cartocdn.com/rastertiles/voyager/13";
    for (let x = 3696; x <= 3700; x++)
      for (let y = 3755; y <= 3759; y++)
        new Image().src = `${base}/${x}/${y}.png`;
  }, []);

  const notifCount = notifs.filter(n => !n.read).length;

  const [unreadMsg, setUnreadMsg] = useState(0);

  const fetchUnreadMsg = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/messages/unread/count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setUnreadMsg(d.count); }
    } catch {}
  };

  useEffect(() => { fetchUnreadMsg(); }, []);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-blue-600">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow-md">
          <Heart size={17} className="text-white" />
        </div>
        <div>
          <div className="text-[15px] font-extrabold text-white tracking-tight">MedConnect</div>
          <div className="text-[10px] text-blue-200 font-semibold">Espace Patient</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto px-3 space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300 px-2 mb-3">Menu</p>
        {NAV.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => { setSidebarOpen(false); if (badge === "msg") fetchUnreadMsg(); }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group
              ${isActive
                ? "bg-white/20 text-white shadow-md shadow-blue-900/30"
                : "text-blue-100 hover:bg-blue-600/70 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                  ${isActive ? "bg-white/25" : "bg-white/10 group-hover:bg-white/20"}`}
                >
                  <Icon size={14} className={isActive ? "text-white" : "text-blue-200 group-hover:text-white"} />
                </div>
                <span className="flex-1">{label}</span>
                {badge === "msg" && unreadMsg > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadMsg}
                  </span>
                )}
                {to === "alertes" && false && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    0
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-blue-600">
        <div className="flex items-center gap-3 bg-blue-800/50 border border-blue-600/50 rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0">
            {initiales}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold text-white truncate">{nom}</div>
            <div className="text-[10px] text-blue-200 truncate">{email || "Patient"}</div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={logout}
            title="Se déconnecter"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-300 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            <LogOut size={14} />
          </motion.button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-blue-50">

      {/* Overlay mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 w-[230px] bg-blue-700 z-50 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -230 }} animate={{ x: 0 }} exit={{ x: -230 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex lg:hidden flex-col fixed top-0 left-0 bottom-0 w-[230px] bg-blue-700 z-50 shadow-xl"
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center"
            >
              <X size={14} />
            </button>
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[230px]">

        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 sticky top-0 z-30 shadow-sm">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={18} />
          </motion.button>

          <div className="flex items-center gap-2 ml-auto">

            {/* Cloche notifications RDV */}
            <div className="relative">
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => { setShowNotifs(v => !v); if (!showNotifs) loadNotifs(); }}
                className="relative w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-700 flex items-center justify-center transition-colors"
              >
                <Bell size={17} />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center shadow">
                    {notifCount}
                  </span>
                )}
              </motion.button>

              <AnimatePresence>
                {showNotifs && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      className="absolute right-0 top-11 w-72 sm:w-80 max-w-[calc(100vw-1rem)] bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <Bell size={13} className="text-blue-600"/>
                          <span className="text-[13px] font-bold text-gray-900">Notifications</span>
                          {notifCount > 0 && (
                            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{notifCount} non lue{notifCount > 1 ? "s" : ""}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {notifCount > 0 && (
                            <button onClick={markAllRead} className="text-[11px] text-blue-600 hover:underline font-medium px-1">
                              Tout lire
                            </button>
                          )}
                          {notifs.length > 0 && (
                            <button onClick={clearAll} className="text-[11px] text-gray-400 hover:text-red-500 font-medium px-1">
                              Effacer
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notifs.length === 0 ? (
                          <div className="py-10 text-center">
                            <Bell size={24} className="mx-auto text-gray-200 mb-2"/>
                            <p className="text-[12px] text-gray-400">Aucune notification</p>
                            <p className="text-[11px] text-gray-300 mt-0.5">Vos confirmations de RDV apparaîtront ici</p>
                          </div>
                        ) : (
                          notifs.map((n, i) => (
                            <div key={i} className={`flex gap-3 px-4 py-3 transition-colors ${n.read ? "bg-white" : "bg-blue-50/40"}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                n.type === "success" ? "bg-emerald-100" : n.type === "error" ? "bg-red-100" : "bg-blue-100"
                              }`}>
                                {n.type === "success"
                                  ? <CheckCircle2 size={13} className="text-emerald-600"/>
                                  : n.type === "error"
                                  ? <X size={13} className="text-red-500"/>
                                  : <Bell size={13} className="text-blue-600"/>
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-semibold text-gray-900">{n.title}</div>
                                <div className="text-[11px] text-gray-500 leading-snug mt-0.5">{n.message}</div>
                                {n.date && (
                                  <div className="text-[10px] text-gray-400 mt-1">
                                    {new Date(n.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                )}
                              </div>
                              {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"/>}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <NavLink to="profil" className="flex items-center gap-2 bg-blue-50 border border-blue-200 pl-2 pr-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[11px] font-extrabold shadow shadow-blue-200">
                {initiales}
              </div>
              <span className="hidden sm:block text-[13px] font-semibold text-blue-800 max-w-[100px] truncate">
                {nom.split(" ")[0]}
              </span>
            </NavLink>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-5 lg:p-6">
          <div className="max-w-[1100px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
