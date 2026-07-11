import { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, Trash2, Pencil, Check, X } from "lucide-react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

const COLORS = [
  "bg-blue-500","bg-emerald-500","bg-violet-500","bg-orange-500",
  "bg-rose-500","bg-teal-500","bg-amber-500","bg-indigo-500",
];
const avatarColor = (id) => COLORS[(id || 0) % COLORS.length];

export default function ChatWindow({ meId, interlocuteur, onClose, onNewMessage }) {
  const [messages,    setMessages]    = useState([]);
  const [texte,       setTexte]       = useState("");
  const [loading,     setLoading]     = useState(true);
  const [hoveredId,   setHoveredId]   = useState(null);
  const [editingMsg,  setEditingMsg]  = useState(null); // { id, contenu }
  const [editTexte,   setEditTexte]   = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const editRef   = useRef(null);
  const token     = sessionStorage.getItem("token");

  useEffect(() => {
    if (!interlocuteur) return;

    socketRef.current = io(SOCKET_URL, { auth: { token } });
    socketRef.current.emit("join_user", { userId: meId });
    socketRef.current.emit("join_chat", { userId: meId, interlocuteurId: interlocuteur.id });

    socketRef.current.on("message_received", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socketRef.current.on("message_deleted", ({ id }) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, supprime: true } : m));
    });

    socketRef.current.on("message_edited", ({ id, contenu }) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, contenu, modifie: true } : m));
    });

    fetch(`${SOCKET_URL}/api/messages/${interlocuteur.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setMessages(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));

    return () => { socketRef.current?.disconnect(); };
  }, [interlocuteur?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (editingMsg) editRef.current?.focus();
  }, [editingMsg]);

  const envoyer = () => {
    const txt = texte.trim();
    if (!txt || !socketRef.current) return;
    socketRef.current.emit("send_message", {
      expediteur_id:   meId,
      destinataire_id: interlocuteur.id,
      contenu: txt,
    });
    setTexte("");
    onNewMessage?.();
  };

  const supprimerMsg = (msg) => {
    socketRef.current?.emit("delete_message", {
      message_id:   msg.id,
      expediteur_id: meId,
    });
    setHoveredId(null);
  };

  const demarrerEdit = (msg) => {
    setEditingMsg(msg);
    setEditTexte(msg.contenu);
    setHoveredId(null);
  };

  const validerEdit = () => {
    const txt = editTexte.trim();
    if (!txt || !editingMsg) return;
    socketRef.current?.emit("edit_message", {
      message_id:    editingMsg.id,
      expediteur_id: meId,
      nouveau_contenu: txt,
    });
    setEditingMsg(null);
    setEditTexte("");
  };

  const annulerEdit = () => { setEditingMsg(null); setEditTexte(""); };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(); }
  };

  const onEditKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); validerEdit(); }
    if (e.key === "Escape") annulerEdit();
  };

  const fmt = (d) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const initials = (nom) => {
    if (!nom) return "?";
    return nom.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 bg-blue-700 flex-shrink-0">
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div className={`w-10 h-10 rounded-full ${avatarColor(interlocuteur?.id)} flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0 ring-2 ring-white/30`}>
          {initials(interlocuteur?.nom)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-white truncate">
            {interlocuteur?.role === "medecin" ? "Dr. " : ""}{interlocuteur?.nom}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            <span className="text-[10px] text-blue-200">
              {interlocuteur?.role === "medecin" ? "Médecin" : "Patient"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ background: "#f0f2f5" }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-[13px] text-gray-400">Chargement…</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className={`w-16 h-16 rounded-full ${avatarColor(interlocuteur?.id)} flex items-center justify-center text-white font-bold text-[20px] shadow-lg`}>
              {initials(interlocuteur?.nom)}
            </div>
            <p className="text-[13px] text-gray-500 font-medium">
              {interlocuteur?.role === "medecin" ? "Dr. " : ""}{interlocuteur?.nom}
            </p>
            <p className="text-[11px] text-gray-400">Démarrez la conversation</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.expediteur_id === meId;
            const isHovered = hoveredId === m.id;
            const isEditing = editingMsg?.id === m.id;

            return (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                onMouseEnter={() => !m.supprime && setHoveredId(m.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Actions — côté gauche pour mes messages */}
                {isMine && isHovered && !isEditing && !m.supprime && (
                  <div className="flex items-center gap-1 mb-1">
                    <button
                      onClick={() => demarrerEdit(m)}
                      className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-colors"
                      title="Modifier"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => supprimerMsg(m)}
                      className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 shadow-sm transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}

                {/* Bulle */}
                <div className={`max-w-[72%] ${isMine ? "" : ""}`}>
                  {m.supprime ? (
                    <div className={`px-3.5 py-2 rounded-2xl text-[12px] italic border ${
                      isMine
                        ? "bg-blue-100 text-blue-400 border-blue-200 rounded-br-none"
                        : "bg-gray-100 text-gray-400 border-gray-200 rounded-bl-none"
                    }`}>
                      Message supprimé
                    </div>
                  ) : isEditing ? (
                    <div className="bg-white border-2 border-blue-400 rounded-2xl overflow-hidden shadow-md">
                      <textarea
                        ref={editRef}
                        value={editTexte}
                        onChange={e => setEditTexte(e.target.value)}
                        onKeyDown={onEditKeyDown}
                        rows={2}
                        className="w-full px-3 pt-2 text-[13px] resize-none outline-none text-gray-800 min-w-[180px]"
                      />
                      <div className="flex items-center justify-end gap-1.5 px-2 pb-2">
                        <span className="text-[10px] text-gray-400 mr-auto">Entrée pour valider · Échap pour annuler</span>
                        <button onClick={annulerEdit} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <X size={11} />
                        </button>
                        <button onClick={validerEdit} className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                          <Check size={11} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                      isMine
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 rounded-bl-none"
                    }`}>
                      <p>{m.contenu}</p>
                      <div className={`flex items-center justify-end gap-1.5 mt-0.5`}>
                        {m.modifie && (
                          <span className={`text-[9px] ${isMine ? "text-blue-200" : "text-gray-400"}`}>modifié</span>
                        )}
                        <span className={`text-[10px] ${isMine ? "text-blue-200" : "text-gray-400"}`}>
                          {fmt(m.created_at)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-3 py-3 border-t border-gray-100 bg-white flex-shrink-0">
        <textarea
          value={texte}
          onChange={e => setTexte(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Écrire un message…"
          rows={1}
          className="flex-1 resize-none px-3.5 py-2.5 bg-gray-100 rounded-2xl text-[13px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 max-h-28 transition-colors"
        />
        <button
          onClick={envoyer}
          disabled={!texte.trim()}
          className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0 shadow-md"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
