import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Sparkles } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const totalDuration = 4500;

  // Haptic feedback & auto-dismiss lifecycle
  useEffect(() => {
    if (!toast) {
      setProgress(100);
      setIsExiting(false);
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    // Trigger subtle mobile haptic feedback if available
    try {
      if (typeof window !== 'undefined' && navigator?.vibrate) {
        if (toast.type === 'error') {
          navigator.vibrate([20, 40, 20]);
        } else {
          navigator.vibrate(18);
        }
      }
    } catch {
      // Ignore vibration errors on unsupported environments
    }

    startTimeRef.current = Date.now();
    setProgress(100);
    setIsExiting(false);
    setDragOffset({ x: 0, y: 0 });

    const interval = setInterval(() => {
      if (isPaused) return;

      const elapsed = Date.now() - startTimeRef.current;
      const remainingPercent = Math.max(0, 100 - (elapsed / totalDuration) * 100);
      setProgress(remainingPercent);

      if (remainingPercent <= 0) {
        clearInterval(interval);
        handleDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast, isPaused]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
      setDragOffset({ x: 0, y: 0 });
    }, 220);
  };

  // Touch gesture handling for mobile screens
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setIsDragging(true);
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;

    // Mobile swipe up or swipe right dismissal
    const nextY = diffY < 0 ? diffY : diffY * 0.25; // Resistance pulling down
    const nextX = diffX > 0 ? diffX : diffX * 0.25; // Resistance pulling left

    setDragOffset({ x: nextX, y: nextY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsPaused(false);

    // If swiped up > 35px or swiped right > 60px, dismiss
    if (dragOffset.y < -35 || dragOffset.x > 60) {
      handleDismiss();
    } else {
      // Snap back smoothly
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const title =
    toast.title ||
    (isSuccess ? 'Confirmación del Sistema' : isError ? 'Atención Requerida' : 'Notificación de Servicio');

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed z-50 top-3 inset-x-3.5 mx-auto max-w-sm sm:max-w-md sm:top-auto sm:bottom-6 sm:right-6 sm:inset-x-auto w-auto sm:w-full pointer-events-none transition-all duration-200"
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
          opacity: isExiting ? 0 : Math.max(0.4, 1 - Math.abs(dragOffset.y) / 100 - Math.abs(dragOffset.x) / 120),
          transition: isDragging ? 'none' : 'transform 0.22s ease-out, opacity 0.22s ease-out',
        }}
        className={`pointer-events-auto relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl bg-[#141720]/95 ${
          isSuccess
            ? 'border-emerald-500/30 shadow-emerald-950/40'
            : isError
            ? 'border-rose-500/30 shadow-rose-950/40'
            : 'border-amber-500/30 shadow-amber-950/40'
        } ${isExiting ? 'scale-95' : 'animate-toast-top sm:animate-toast-bottom'}`}
      >
        {/* Mobile drag handle hint */}
        <div className="flex sm:hidden justify-center pt-1.5 pb-0.5">
          <div className="w-9 h-1 rounded-full bg-slate-600/50" />
        </div>

        <div className="flex items-start gap-3.5 p-3.5 sm:p-4">
          {/* Status Icon Badge */}
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
              isSuccess
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : isError
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {isError && <AlertTriangle className="w-5 h-5 text-rose-400" />}
            {!isSuccess && !isError && <Info className="w-5 h-5 text-amber-400" />}
          </div>

          {/* Text Message */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold tracking-tight text-white font-display">
                {title}
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                Justo ahora
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-snug break-words">
              {toast.message}
            </p>
          </div>

          {/* Close button with 44px minimum mobile hit area */}
          <button
            onClick={handleDismiss}
            className="w-8 h-8 sm:w-7 sm:h-7 -mr-1 -mt-1 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live progress countdown bar */}
        <div className="w-full h-1 bg-slate-800/80 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear ${
              isSuccess
                ? 'bg-emerald-400'
                : isError
                ? 'bg-rose-400'
                : 'bg-amber-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </aside>
  );
}
