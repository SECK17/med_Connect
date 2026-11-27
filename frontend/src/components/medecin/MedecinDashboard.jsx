import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, CalendarDays, User, LogOut, Heart,
  Menu, X, Stethoscope, Bell, FolderOpen, Clock, ClipboardList, CheckCircle2,
  MessageSquare, BellRing,
} from "lucide-react";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { API_URL } from "../../config.js";

const NAV = [
  { to: "accueil",        label: "Tableau de bord",  icon: LayoutDashboard },
  { to: "demandes",       label: "Demandes RDV",      icon: CalendarDays    },
  { to: "rendezvous",     label: "Rendez-vous",       icon: Bell            },
  { to: "messages",       label: "Messages",          icon: MessageSquare,  badge: "msg" },
  { to: "consultations",  label: "Consultations",     icon: ClipboardList   },
  { to: "disponibilites", label: "Disponibilités",    icon: Clock           },
  { to: "dossiers",       label: "Dossiers patients", icon: FolderOpen      },
  { to: "profil",         label: "Mon Profil",        icon: User            },
];

export default function MedecinLayout() {
  const navigate = useNavigate();
  const [nom, setNom]       = useState("");
  const [email, setEmail]   = useState("");
  const [mobile, setMobile] = useState(false);
  const [notifs,     setNotifs]     = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadMsg,  setUnreadMsg]  = useState(0);

  const notifCount = notifs.filter(n => !n.read).length;
  const { permission, subscribed, subscribe } = usePushNotifications();

  const loadNotifs = () => {
    const saved = JSON.parse(localStorage.getItem("medconnect_medecin_notifications") || "[]");
    setNotifs(saved);
  };

  const fetchUnreadMsg = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/messages/unread/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setUnreadMsg(d.count); }
    } catch {}
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const role  = sessionStorage.getItem("role");
    if (!token || role !== "medecin") { navigate("/login"); return; }
    setNom(sessionStorage.getItem("nom")   || "");
    setEmail(sessionStorage.getItem("email") || "");
    loadNotifs();
    fetchUnreadMsg();
  }, [navigate]);

  const markAllRead = () => {
    const updated = notifs.map(n => ({ ...n, read: true }));
    localStorage.setItem("medconnect_medecin_notifications", JSON.stringify(updated));
    setNotifs(updated);
  };

  const clearAll = () => {
    localStorage.setItem("medconnect_medecin_notifications", "[]");
    setNotifs([]);
  };

  const logout = () => { sessionStorage.clear(); navigate("/login"); };
  const initiales = nom.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">

      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-200">
          <Heart size={17} className="text-white" />
        </div>
        <div>
          <div className="text-[15px] font-extrabold text-gray-900 tracking-tight">MedConnect</div>
          <div className="text-[10px] text-blue-600 font-semibold">Espace Médecin</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 mb-3">Menu</p>
        {NAV.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => { setMobile(false); if (badge === "msg") fetchUnreadMsg(); }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group
              ${isActive
                ? "bg-blue-50 text-blue-700 border-l-[3px] border-blue-600"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                  ${isActive ? "bg-blue-100" : "bg-gray-100 group-hover:bg-gray-200"}`}
                >
                  <Icon size={14} className={isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"} />
                </div>
                <span className="flex-1">{label}</span>
                {badge === "msg" && unreadMsg > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadMsg}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0 shadow shadow-blue-200">
            {initiales}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold text-gray-900 truncate">{nom}</div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              <Stethoscope size={9} /> Médecin
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={logout}
            title="Se déconnecter"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={14} />
          </motion.button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Overlay mobile */}
      <AnimatePresence>
        {mobile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setMobile(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-[230px] bg-white border-r border-gray-200 z-50 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile */}
      <AnimatePresence>
        {mobile && (
          <motion.aside
            initial={{ x: -230 }} animate={{ x: 0 }} exit={{ x: -230 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex md:hidden flex-col fixed top-0 left-0 bottom-0 w-[230px] bg-white border-r border-gray-200 z-50 shadow-xl"
          >
            <button
              onClick={() => setMobile(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center"
            >
              <X size={14} />
            </button>
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-[230px]">

        {/* Topbar — bleu foncé (inverse du patient) */}
        <header className="h-14 bg-blue-700 flex items-center justify-between px-5 sticky top-0 z-30 shadow-md">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="md:hidden w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center"
            onClick={() => setMobile(!mobile)}
          >
            <Menu size={18} />
          </motion.button>

          <div className="flex items-center gap-2 ml-auto">
            {/* Bouton activer notifications push */}
            {permission !== 'granted' && !subscribed && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={subscribe}
                className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1.5 rounded-lg transition-colors"
                title="Activer les notifications push"
              >
                <BellRing size={13} /> Notifs
              </motion.button>
            )}

            {/* Cloche notifications */}
            <div className="relative">
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => { setShowNotifs(v => !v); if (!showNotifs) loadNotifs(); }}
                className="relative w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              >
                <Bell size={17} />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center shadow">
                    {notifCount}
                  </span>
                )}
              </motion.button>

              {/* Panneau notifications */}
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
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <Bell size={13} className="text-blue-600"/>
                          <span className="text-[13px] font-bold text-gray-900">Notifications</span>
                          {notifCount > 0 && (
                            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{notifCount} non lues</span>
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

                      {/* Liste */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notifs.length === 0 ? (
                          <div className="py-10 text-center">
                            <Bell size={24} className="mx-auto text-gray-200 mb-2"/>
                            <p className="text-[12px] text-gray-400">Aucune notification</p>
                          </div>
                        ) : (
                          notifs.map((n, i) => (
                            <div key={i} className={`flex gap-3 px-4 py-3 transition-colors ${n.read ? "bg-white" : "bg-blue-50/50"}`}>
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
                                <div className="text-[12px] font-semibold text-gray-900">{n.title || "Notification"}</div>
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

            <div className="flex items-center gap-2 bg-white/15 border border-white/20 pl-2 pr-3 py-1.5 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-white text-blue-700 flex items-center justify-center text-[11px] font-extrabold shadow">
                {initiales}
              </div>
              <span className="hidden sm:block text-[13px] font-semibold text-white max-w-[110px] truncate">
                Dr. {nom.split(" ")[0]}
              </span>
            </div>
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
