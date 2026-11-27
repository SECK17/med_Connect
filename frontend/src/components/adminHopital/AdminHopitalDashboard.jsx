import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { LayoutDashboard, Users, Bell, User, LogOut, Heart, Menu, X, Building2, Stethoscope, CalendarDays, UserRound, CheckCircle2 } from "lucide-react";
import { API_URL } from "../../config.js";

const NAV = [
  { to: "accueil",     label: "Tableau de bord", icon: LayoutDashboard },
  { to: "rendezvous",  label: "Rendez-vous",      icon: CalendarDays },
  { to: "medecins",    label: "Médecins",         icon: Stethoscope },
  { to: "patients",    label: "Patients",         icon: UserRound },
  { to: "donneurs",    label: "Donneurs",          icon: Users },
  { to: "alertes",     label: "Alertes sang",      icon: Bell },
];

export default function AdminHopitalDashboard() {
  const navigate = useNavigate();
  const [mobile,     setMobile]     = useState(false);
  const [hopitalNom, setHopitalNom] = useState("");
  const [notifs,     setNotifs]     = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const nom     = sessionStorage.getItem("nom") || "Admin";
  const initiales = nom.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const token   = sessionStorage.getItem("token");

  const loadNotifs = () => {
    const saved = JSON.parse(localStorage.getItem("medconnect_secretaire_notifications") || "[]");
    setNotifs(saved);
  };

  const markAllRead = () => {
    const updated = notifs.map(n => ({ ...n, read: true }));
    localStorage.setItem("medconnect_secretaire_notifications", JSON.stringify(updated));
    setNotifs(updated);
  };

  const clearAll = () => {
    localStorage.setItem("medconnect_secretaire_notifications", "[]");
    setNotifs([]);
  };

  const notifCount = notifs.filter(n => !n.read).length;

  useEffect(() => {
    if (!token || sessionStorage.getItem("role") !== "admin_hopital") { navigate("/login"); return; }
    fetch(`${API_URL}/api/admin-hopital/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.hopital_nom) setHopitalNom(d.hopital_nom); })
      .catch(() => {});
    loadNotifs();
  }, []);

  const logout = () => { sessionStorage.clear(); navigate("/login"); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-200">
          <Heart size={17} className="text-white" />
        </div>
        <div>
          <div className="text-[14px] font-extrabold text-gray-900 tracking-tight">MedConnect</div>
          <div className="text-[10px] text-rose-600 font-semibold">Admin Hôpital</div>
        </div>
      </div>

      {hopitalNom && (
        <div className="mx-3 mt-3 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 flex items-center gap-2">
          <Building2 size={13} className="text-rose-500 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-rose-700 leading-tight line-clamp-2">{hopitalNom}</span>
        </div>
      )}

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 mb-3">Menu</p>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={() => setMobile(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group
              ${isActive ? "bg-rose-50 text-rose-700 border-l-[3px] border-rose-500" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? "bg-rose-100" : "bg-gray-100 group-hover:bg-gray-200"}`}>
                  <Icon size={14} className={isActive ? "text-rose-600" : "text-gray-400 group-hover:text-gray-600"} />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center text-[12px] font-bold flex-shrink-0">
            {initiales}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold text-gray-900 truncate">{nom}</div>
            <div className="text-[10px] text-gray-400">Admin hôpital</div>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={logout}
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
      <AnimatePresence>
        {mobile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobile(false)}
          />
        )}
      </AnimatePresence>

      <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-[230px] z-50 shadow-sm">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobile && (
          <motion.aside initial={{ x: -230 }} animate={{ x: 0 }} exit={{ x: -230 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex md:hidden flex-col fixed top-0 left-0 bottom-0 w-[230px] z-50 shadow-xl"
          >
            <button onClick={() => setMobile(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center">
              <X size={14} />
            </button>
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-h-screen md:ml-[230px]">
        <header className="h-14 bg-rose-600 flex items-center justify-between px-5 sticky top-0 z-30 shadow-md">
          <motion.button whileTap={{ scale: 0.9 }}
            className="md:hidden w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center"
            onClick={() => setMobile(!mobile)}
          >
            <Menu size={18} />
          </motion.button>
          <div className="flex items-center gap-2 ml-auto">

            {/* Cloche notifications secrétaire */}
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
                          <Bell size={13} className="text-rose-500"/>
                          <span className="text-[13px] font-bold text-gray-900">Notifications</span>
                          {notifCount > 0 && (
                            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{notifCount} non lue{notifCount > 1 ? "s" : ""}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {notifCount > 0 && (
                            <button onClick={markAllRead} className="text-[11px] text-rose-600 hover:underline font-medium px-1">
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
                            <p className="text-[11px] text-gray-300 mt-0.5">Les réponses des médecins apparaîtront ici</p>
                          </div>
                        ) : (
                          notifs.map((n, i) => (
                            <div key={i} className={`flex gap-3 px-4 py-3 transition-colors ${n.read ? "bg-white" : "bg-rose-50/30"}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                n.type === "success" ? "bg-emerald-100" : n.type === "error" ? "bg-red-100" : "bg-rose-100"
                              }`}>
                                {n.type === "success"
                                  ? <CheckCircle2 size={13} className="text-emerald-600"/>
                                  : n.type === "error"
                                  ? <X size={13} className="text-red-500"/>
                                  : <Bell size={13} className="text-rose-500"/>
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
                              {!n.read && <div className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0 mt-1.5"/>}
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
              <div className="w-7 h-7 rounded-lg bg-white text-rose-600 flex items-center justify-center text-[11px] font-extrabold shadow">
                {initiales}
              </div>
              <span className="hidden sm:block text-[13px] font-semibold text-white max-w-[110px] truncate">{nom}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-5 lg:p-6">
          <div className="max-w-[1100px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
