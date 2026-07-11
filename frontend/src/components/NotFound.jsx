import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Heart, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  const role = sessionStorage.getItem("role");
  const home = role === "patient"       ? "/dashboard/patient/accueil"
             : role === "medecin"       ? "/dashboard/medecin/accueil"
             : role === "donneur"       ? "/dashboard/donneur/accueil"
             : role === "admin_hopital" ? "/dashboard/admin-hopital/accueil"
             : role === "admin"         ? "/dashboard"
             : "/login";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Heart size={18} className="text-white" />
          </div>
          <span className="text-[17px] font-extrabold text-gray-900 tracking-tight">MedConnect</span>
        </div>

        {/* 404 */}
        <div className="mb-6">
          <div className="text-[96px] font-black text-blue-100 leading-none select-none">404</div>
          <div className="-mt-4 text-[22px] font-extrabold text-gray-900">Page introuvable</div>
          <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
            La page que vous cherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-[13px] font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={14} /> Retour
          </button>
          <button
            onClick={() => navigate(home)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
          >
            <Home size={14} /> Tableau de bord
          </button>
        </div>
      </motion.div>
    </div>
  );
}
