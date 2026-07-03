export function SurvivorBadge() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-12 p-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-[#78716C] mb-3">Badge / Shirt Back (200px wide)</p>
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="96" stroke="#2A2421" strokeWidth="4" fill="none"/>
          <circle cx="100" cy="100" r="88" stroke="#E2C2A4" strokeWidth="1" fill="none"/>
          <circle cx="100" cy="100" r="84" fill="#2A2421"/>
          <path d="M100 50C88 50 78 62 78 78C78 88 82 96 86 100L82 110L78 120L82 132L86 144L90 152L96 156L100 160L104 156L110 152L114 144L118 132L122 120L118 110L114 100C118 96 122 88 122 78C122 62 112 50 100 50Z" fill="#FDFBF7"/>
          <rect x="106" y="92" width="4" height="28" transform="rotate(35 108 106)" fill="#C06B3E"/>
          <rect x="110" y="80" width="24" height="6" transform="rotate(35 122 83)" fill="#78716C"/>
          <text x="100" y="180" textAnchor="middle" fill="#C06B3E" fontSize="11" fontWeight="600" letterSpacing="0.15em" fontFamily="system-ui, sans-serif">REBUILD &middot; REWIRE &middot; RISE</text>
        </svg>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-[#78716C] mb-3">Small Badge / Hat Pin (80px wide)</p>
        <svg width="80" height="80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="96" stroke="#2A2421" strokeWidth="4" fill="none"/>
          <circle cx="100" cy="100" r="84" fill="#2A2421"/>
          <path d="M100 50C88 50 78 62 78 78C78 88 82 96 86 100L82 110L78 120L82 132L86 144L90 152L96 156L100 160L104 156L110 152L114 144L118 132L122 120L118 110L114 100C118 96 122 88 122 78C122 62 112 50 100 50Z" fill="#FDFBF7"/>
          <rect x="106" y="92" width="4" height="28" transform="rotate(35 108 106)" fill="#C06B3E"/>
          <rect x="110" y="80" width="24" height="6" transform="rotate(35 122 83)" fill="#78716C"/>
          <text x="100" y="180" textAnchor="middle" fill="#C06B3E" fontSize="11" fontWeight="600" letterSpacing="0.15em" fontFamily="system-ui, sans-serif">REBUILD &middot; REWIRE &middot; RISE</text>
        </svg>
      </div>

      <div className="flex gap-6 mt-4">
        <div className="p-4 border border-[#E2C2A4]/40 rounded-lg">
          <p className="text-xs uppercase tracking-widest text-[#78716C] mb-2">Terracotta on Cream</p>
          <svg width="80" height="80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="96" stroke="#C06B3E" strokeWidth="4" fill="none"/>
            <circle cx="100" cy="100" r="84" fill="#C06B3E"/>
            <path d="M100 50C88 50 78 62 78 78C78 88 82 96 86 100L82 110L78 120L82 132L86 144L90 152L96 156L100 160L104 156L110 152L114 144L118 132L122 120L118 110L114 100C118 96 122 88 122 78C122 62 112 50 100 50Z" fill="#FDFBF7"/>
            <rect x="106" y="92" width="4" height="28" transform="rotate(35 108 106)" fill="#2A2421"/>
            <rect x="110" y="80" width="24" height="6" transform="rotate(35 122 83)" fill="#78716C"/>
          </svg>
        </div>
        <div className="p-4 border border-[#E2C2A4]/40 rounded-lg">
          <p className="text-xs uppercase tracking-widest text-[#78716C] mb-2">Cream on Dark</p>
          <div className="bg-[#2A2421] rounded-lg p-2 inline-block">
            <svg width="80" height="80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="96" stroke="#FDFBF7" strokeWidth="4" fill="none"/>
              <circle cx="100" cy="100" r="84" fill="#FDFBF7"/>
              <path d="M100 50C88 50 78 62 78 78C78 88 82 96 86 100L82 110L78 120L82 132L86 144L90 152L96 156L100 160L104 156L110 152L114 144L118 132L122 120L118 110L114 100C118 96 122 88 122 78C122 62 112 50 100 50Z" fill="#2A2421"/>
              <rect x="106" y="92" width="4" height="28" transform="rotate(35 108 106)" fill="#C06B3E"/>
              <rect x="110" y="80" width="24" height="6" transform="rotate(35 122 83)" fill="#78716C"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
