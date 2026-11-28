import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Search } from "lucide-react";
import { io } from "socket.io-client";
import ChatWindow from "../../chat/ChatWindow";
import { API_URL } from "../../../config.js";
import { signalerErreur } from "../../../utils/erreurs.js";

const SOCKET_URL = API_URL;

const COLORS = [
  "bg-blue-500","bg-emerald-500","bg-violet-500","bg-orange-500",
  "bg-rose-500","bg-teal-500","bg-amber-500","bg-indigo-500",
];
const avatarColor = (id) => COLORS[(id || 0) % COLORS.length];

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selected,      setSelected]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");

  const token = sessionStorage.getItem("token");
  const meId  = parseInt(sessionStorage.getItem("userId"));

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${SOCKET_URL}/api/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setConversations(await res.json());
    } catch (err) { signalerErreur(err); }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fonction asynchrone : l'état n'est modifié qu'après la réponse de l'API
    fetchConversations();

    const socket = io(SOCKET_URL, { auth: (cb) => cb({ token: sessionStorage.getItem("token") }) }); // jeton relu à chaque reconnexion
    socket.emit("join_user", { userId: meId });
    socket.on("new_message_notif", () => fetchConversations());
    return () => socket.disconnect();
  }, []);

  const q = search.toLowerCase();
  const filtered = conversations.filter(c => (c.nom || "").toLowerCase().includes(q));

  const fmt = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const now  = new Date();
    if (now - date < 86400000) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const initials = (nom) => {
    if (!nom) return "?";
    return nom.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

      {/* ── Panneau gauche — liste patients ── */}
      <div className={`flex flex-col border-r border-gray-100 ${selected ? "hidden md:flex" : "flex"} w-full md:w-[300px] flex-shrink-0`}>

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <h2 className="text-[17px] font-bold text-gray-900 mb-3">Messages patients</h2>
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <Search size={13} className="text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un patient…"
              className="flex-1 bg-transparent text-[13px] outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Liste patients */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-10 text-center text-[13px] text-gray-400">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-3 px-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                <MessageSquare size={22} className="text-blue-300" />
              </div>
              <p className="text-[13px] font-semibold text-gray-600 text-center">Aucun message reçu</p>
              <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                Les patients vous contacteront depuis leurs rendez-vous
              </p>
            </div>
          ) : (
            filtered.map(c => (
              <button
                key={c.interlocuteur_id}
                onClick={() => { setSelected(c); fetchConversations(); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 border-b border-gray-50 ${
                  selected?.interlocuteur_id === c.interlocuteur_id ? "bg-blue-50 border-l-[3px] border-l-blue-600" : ""
                }`}
              >
                {/* Avatar coloré avec initiales */}
                <div className={`w-12 h-12 rounded-full ${avatarColor(c.interlocuteur_id)} flex items-center justify-center text-white font-bold text-[14px] flex-shrink-0 shadow-sm`}>
                  {initials(c.nom)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <span className="text-[14px] font-semibold text-gray-900 truncate">{c.nom || "Patient"}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{fmt(c.date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-[12px] truncate flex-1 ${c.non_lus > 0 ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                      {c.dernier_message}
                    </p>
                    {c.non_lus > 0 && (
                      <span className="ml-2 min-w-[18px] h-[18px] bg-blue-600 rounded-full text-[10px] text-white font-bold flex items-center justify-center px-1 flex-shrink-0">
                        {c.non_lus}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Panneau droit — discussion ── */}
      <div className={`flex-1 min-w-0 ${!selected ? "hidden md:flex items-center justify-center bg-gray-50" : "flex"}`}>
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.interlocuteur_id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <ChatWindow
                meId={meId}
                interlocuteur={{ id: selected.interlocuteur_id, nom: selected.nom, role: "patient" }}
                onClose={() => setSelected(null)}
                onNewMessage={fetchConversations}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-4 text-center px-8"
            >
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-gray-100">
                <MessageSquare size={30} className="text-blue-300" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-gray-700">Messages patients</p>
                <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">
                  Sélectionnez un patient pour voir et répondre
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
