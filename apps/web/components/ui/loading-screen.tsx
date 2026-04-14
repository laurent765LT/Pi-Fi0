'use client';

export function LoadingScreen() {
  return (
    <>
      <style jsx global>{`
        @keyframes loading-pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(59, 31, 168, 0.4);
          }
          50% {
            transform: scale(1.06);
            box-shadow: 0 0 30px 8px rgba(59, 31, 168, 0.15);
          }
        }
        @keyframes loading-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{
          background:
            'linear-gradient(135deg, #FAFAF8 0%, #EDE8FF 50%, #E4EAFF 100%)',
        }}
      >
        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 40%, rgba(59,31,168,0.06) 0%, transparent 60%)',
          }}
          aria-hidden="true"
        />

        {/* Logo mark with pulse */}
        <div
          className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #3B1FA8 0%, #5535C4 100%)',
            animation: 'loading-pulse 2s ease-in-out infinite',
          }}
        >
          {/* Lightning bolt SVG */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M13 2L4.09 12.63a1 1 0 0 0 .78 1.62H11l-1 7.75L19.91 11.37a1 1 0 0 0-.78-1.62H13l1-7.75Z"
              fill="white"
            />
          </svg>
        </div>

        {/* Loading text */}
        <p
          className="mt-5 font-body text-sm font-medium text-ink-3 tracking-wide"
          style={{
            animation: 'loading-fade-in 0.5s ease-out 0.2s both',
          }}
        >
          Chargement...
        </p>
      </div>
    </>
  );
}
