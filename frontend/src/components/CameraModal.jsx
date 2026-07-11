import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, X, RotateCcw, Check } from "lucide-react";

export default function CameraModal({ isOpen, onCapture, onClose }) {
  const videoRef = useRef(null);
  const [stream,      setStream]      = useState(null);
  const [captured,    setCaptured]    = useState(null); // { blob, url }
  const [facingMode,  setFacingMode]  = useState("environment");
  const [error,       setError]       = useState(null);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    if (isOpen) startCamera();
    else         stopStream();
    return () => stopStream();
  }, [isOpen, facingMode]); // eslint-disable-line

  const startCamera = async () => {
    setError(null);
    setLoading(true);
    setCaptured(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setError("Impossible d'accéder à la caméra.\nVérifiez que vous avez autorisé l'accès.");
    } finally {
      setLoading(false);
    }
  };

  const stopStream = () => {
    setStream(prev => {
      prev?.getTracks().forEach(t => t.stop());
      return null;
    });
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      setCaptured({ blob, url });
      stopStream();
    }, "image/jpeg", 0.92);
  };

  const retake = () => {
    if (captured) URL.revokeObjectURL(captured.url);
    setCaptured(null);
    startCamera();
  };

  const confirm = () => {
    if (!captured) return;
    const file = new File([captured.blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
    onCapture(file, captured.url);
  };

  const handleClose = () => {
    stopStream();
    if (captured) URL.revokeObjectURL(captured.url);
    setCaptured(null);
    setError(null);
    onClose();
  };

  const switchCamera = () => {
    stopStream();
    setFacingMode(f => f === "environment" ? "user" : "environment");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-[70] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/60 absolute top-0 left-0 right-0 z-10">
            <button onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            >
              <X size={20} />
            </button>
            <span className="text-white font-semibold text-[14px]">
              {captured ? "Aperçu de la photo" : "Prendre une photo"}
            </span>
            {!captured ? (
              <button onClick={switchCamera}
                title="Changer de caméra"
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <RotateCcw size={17} />
              </button>
            ) : (
              <div className="w-10" />
            )}
          </div>

          {/* Contenu principal */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            {error ? (
              <div className="flex flex-col items-center gap-4 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <Camera size={32} className="text-white/40" />
                </div>
                <p className="text-white/70 text-[14px] whitespace-pre-line">{error}</p>
                <button onClick={handleClose}
                  className="px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-[13px] font-semibold transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <p className="text-white/60 text-[13px]">Démarrage de la caméra…</p>
              </div>
            ) : captured ? (
              <img src={captured.url} alt="capture"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video ref={videoRef} playsInline muted
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-center gap-6 px-6 py-8 bg-black/60 absolute bottom-0 left-0 right-0">
            {captured ? (
              <>
                <button onClick={retake}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-[13px] font-semibold transition-colors"
                >
                  <RotateCcw size={14} /> Reprendre
                </button>
                <button onClick={confirm}
                  className="flex items-center gap-2 px-7 py-3 bg-white hover:bg-gray-100 text-black rounded-2xl text-[14px] font-bold shadow-lg transition-colors"
                >
                  <Check size={16} /> Utiliser cette photo
                </button>
              </>
            ) : !error && !loading ? (
              <button onClick={capturePhoto}
                className="w-18 h-18 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-2xl transition-colors border-4 border-white/30"
                style={{ width: 72, height: 72 }}
              >
                <Camera size={30} className="text-black" />
              </button>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
