const stats = [
  { value: "90,000+", label: "Community reach" },
  { value: "0→90%", label: "Nick's documented recovery" },
  { value: "6+ years", label: "Of lived experience" },
];

export default function StatsStrip() {
  return (
    <div className="border-y border-[#1a1a1a] bg-[#080808]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-black text-white mb-1">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
