export function SasquatchWordmark() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-12 p-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-[#78716C] mb-3">Header Scale (56px height)</p>
        <div className="flex items-center gap-3">
          <svg width="40" height="56" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4C16 4 12 8 12 14C12 18 14 22 16 24L14 28L12 32L14 38L16 44L18 48L20 50L22 48L24 44L26 38L28 32L26 28L24 24C26 22 28 18 28 14C28 8 24 4 20 4Z" fill="#2A2421"/>
            <rect x="22" y="22" width="3" height="14" transform="rotate(30 23.5 29)" fill="#78716C"/>
            <rect x="24" y="16" width="12" height="4" transform="rotate(30 30 18)" fill="#C06B3E"/>
          </svg>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-[#2A2421] text-lg tracking-tight">Stroke Recovery</span>
            <span className="font-bold text-[#2A2421] text-lg tracking-tight">Academy</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#C06B3E] mt-0.5">Rebuild &middot; Rewire &middot; Rise</span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-[#78716C] mb-3">Shirt / Badge Scale (100px wide)</p>
        <div className="flex items-center gap-2">
          <svg width="28" height="40" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4C16 4 12 8 12 14C12 18 14 22 16 24L14 28L12 32L14 38L16 44L18 48L20 50L22 48L24 44L26 38L28 32L26 28L24 24C26 22 28 18 28 14C28 8 24 4 20 4Z" fill="#2A2421"/>
            <rect x="22" y="22" width="3" height="14" transform="rotate(30 23.5 29)" fill="#78716C"/>
            <rect x="24" y="16" width="12" height="4" transform="rotate(30 30 18)" fill="#C06B3E"/>
          </svg>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-[#2A2421] text-sm tracking-tight">Stroke Recovery</span>
            <span className="font-bold text-[#2A2421] text-sm tracking-tight">Academy</span>
            <span className="text-[7px] font-semibold uppercase tracking-[0.2em] text-[#C06B3E] mt-0.5">Rebuild &middot; Rewire &middot; Rise</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-6 border border-[#E2C2A4]/40 rounded-lg">
        <p className="text-xs uppercase tracking-widest text-[#78716C] mb-3">Dark on Cream (full wordmark)</p>
        <div className="flex items-center gap-4">
          <svg width="60" height="84" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4C16 4 12 8 12 14C12 18 14 22 16 24L14 28L12 32L14 38L16 44L18 48L20 50L22 48L24 44L26 38L28 32L26 28L24 24C26 22 28 18 28 14C28 8 24 4 20 4Z" fill="#2A2421"/>
            <rect x="22" y="22" width="3" height="14" transform="rotate(30 23.5 29)" fill="#78716C"/>
            <rect x="24" y="16" width="12" height="4" transform="rotate(30 30 18)" fill="#C06B3E"/>
          </svg>
          <div>
            <div className="font-bold text-3xl text-[#2A2421] tracking-tight leading-none">Stroke Recovery</div>
            <div className="font-bold text-3xl text-[#2A2421] tracking-tight leading-none">Academy</div>
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-[#C06B3E] mt-1">Rebuild &middot; Rewire &middot; Rise</div>
          </div>
        </div>
      </div>
    </div>
  );
}
