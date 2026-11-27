// Message de confirmation ou d'erreur.
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle } from "lucide-react";

export default function Toast({ toast }) {
  return (
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
  );
}
