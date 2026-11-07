import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const startTimeRef = useRef(null);
  const totalDuration = 4500;

  useEffect(() => {
    if (!toast) {
      setProgress(100);
      setIsExiting(false);
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    try {
      if (typeof window !== 'undefined' && navigator?.vibrate) {
        if (toast.type === 'error') {
          navigator.vibrate([20, 40, 20]);
        } else {
          navigator.vibrate(18);
        }
      }
    } catch {
      // Ignorar si el navegador no soporta vibración
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

    const nextY = diffY < 0 ? diffY : diffY * 0.25;
    const nextX = diffX > 0 ? diffX : diffX * 0.25;

    setDragOffset({ x: nextX, y: nextY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsPaused(false);

    if (dragOffset.y < -35 || dragOffset.x > 60) {
      handleDismiss();
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const title =
    toast.title ||
    (isSuccess ? 'Confirmación' : isError ? 'Atención Requerida' : 'Notificación');

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
        className={`pointer-events-auto relative overflow-hidden rounded-2xl border shadow-xl backdrop-blur-xl bg-white/95 ${
          isSuccess
            ? 'border-[#64829E]/40 shadow-[#64829E]/15'
            : isError
            ? 'border-[#FF6B47]/50 shadow-[#FF6B47]/15'
            : 'border-[#E5DED4] shadow-[#333333]/10'
        } ${isExiting ? 'scale-95' : 'animate-toast-top sm:animate-toast-bottom'}`}
      >
        <div className="flex sm:hidden justify-center pt-1.5 pb-0.5">
          <div className="w-9 h-1 rounded-full bg-[#64829E]/30" />
        </div>

        <div className="flex items-start gap-3.5 p-3.5 sm:p-4">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
              isSuccess
                ? 'bg-[#64829E]/15 border-[#64829E]/30 text-[#64829E]'
                : isError
                ? 'bg-[#FF6B47]/15 border-[#FF6B47]/30 text-[#FF6B47]'
                : 'bg-[#F9F5F1] border-[#E5DED4] text-[#64829E]'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#64829E]" />}
            {isError && <AlertTriangle className="w-5 h-5 text-[#FF6B47]" />}
            {!isSuccess && !isError && <Info className="w-5 h-5 text-[#64829E]" />}
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-tight text-[#333333] font-display">
                {title}
              </span>
              <span className="text-[10px] text-[#64829E] font-mono hidden sm:inline">
                Ahora
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#333333]/80 mt-0.5 leading-snug break-words">
              {toast.message}
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="w-8 h-8 sm:w-7 sm:h-7 -mr-1 -mt-1 flex items-center justify-center rounded-lg text-[#64829E] hover:text-[#333333] hover:bg-[#F9F5F1] active:scale-95 transition-all cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-full h-1 bg-[#F9F5F1] overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear ${
              isSuccess
                ? 'bg-[#64829E]'
                : isError
                ? 'bg-[#FF6B47]'
                : 'bg-[#64829E]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </aside>
  );
}
