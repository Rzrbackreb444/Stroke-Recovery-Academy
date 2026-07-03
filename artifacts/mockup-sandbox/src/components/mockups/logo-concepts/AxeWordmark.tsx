export function AxeWordmark() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-12 p-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-[#78716C] mb-3">Header Scale (56px height)</p>
        <div className="flex items-center gap-3">
          <svg width="40" height="56" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12L14 12L14 44L12 50L10 44L10 12Z" fill="#2A2421"/>
            <path d="M14 14L32 8L34 12L16 18L14 14Z" fill="#C06B3E"/>
            <path d="M14 22L30 16L32 20L16 26L14 22Z" fill="#C06B3E"/>
            <path d="M32 8L36 6" stroke="#2A2421" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-[#2A2421] text-lg tracking-tight">Stroke Recovery</span>
            <span className="font-bold text-[#2A2421] text-lg tracking-tight">Academy</span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-[#78716C] mb-3">Shirt / Badge Scale (100px wide)</p>
        <div className="flex items-center gap-2">
          <svg width="28" height="40" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12L14 12L14 44L12 50L10 44L10 12Z" fill="#2A2421"/>
            <path d="M14 14L32 8L34 12L16 18L14 14Z" fill="#C06B3E"/>
            <path d="M14 22L30 16L32 20L16 26L14 22Z" fill="#C06B3E"/>
            <path d="M32 8L36 6" stroke="#2A2421" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-[#2A2421] text-sm tracking-tight">Stroke Recovery</span>
            <span className="font-bold text-[#2A2421] text-sm tracking-tight">Academy</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-6 border border-[#E2C2A4]/40 rounded-lg">
        <p className="text-xs uppercase tracking-widest text-[#78716C] mb-3">Icon-only mark</p>
        <div className="flex gap-8 items-center">
          <svg width="80" height="80" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12L14 12L14 44L12 50L10 44L10 12Z" fill="#2A2421"/>
            <path d="M14 14L32 8L34 12L16 18L14 14Z" fill="#C06B3E"/>
            <path d="M14 22L30 16L32 20L16 26L14 22Z" fill="#C06B3E"/>
            <path d="M32 8L36 6" stroke="#2A2421" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div>
            <div className="font-bold text-2xl text-[#2A2421]">SRA</div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C06B3E]">Rebuild &middot; Rewire &middot; Rise</div>
          </div>
        </div>
      </div>
    </div>
  );
}
