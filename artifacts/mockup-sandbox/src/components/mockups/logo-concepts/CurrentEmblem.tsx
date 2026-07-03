export function CurrentEmblem() {
  const emblemUrl = "/sra-emblem.png";
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-12 p-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-[#78716C] mb-3">Header Scale (56px height)</p>
        <img src={emblemUrl} alt="Current SRA Emblem" className="h-14 w-auto" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-[#78716C] mb-3">Shirt / Badge Scale (100px wide)</p>
        <img src={emblemUrl} alt="Current SRA Emblem" className="h-20 w-auto" />
      </div>
      <div className="p-6 border border-[#E2C2A4]/40 rounded-lg">
        <p className="text-xs uppercase tracking-widest text-[#78716C] mb-3">Full Resolution</p>
        <img src={emblemUrl} alt="Current SRA Emblem" className="h-48 w-auto" />
      </div>
    </div>
  );
}
