import doctrineBg from "@assets/doctrine_1763787301561.jpg";

const principles = [
  {
    title: "You've Already Won",
    description: "You survived. That's the first victory.",
  },
  {
    title: "Control What You Can",
    description: "Daily efforts, arena logs, control what drains you away.",
  },
  {
    title: "Stack Failures Into Success",
    description: "Every fail compounds forward. Progress through persistence.",
  },
  {
    title: "Never Zero",
    description: "If you can't do the whole drill, do a fragment. Something beats nothing.",
  },
  {
    title: "Patience Is A Virtue But A Villain",
    description: "Be patient with progress, but relentless with effort.",
  },
  {
    title: "Anger Is Fuel",
    description: "Channel it. Let defiance drive determination.",
  },
];

export default function Doctrine() {
  return (
    <section className="py-20 relative overflow-hidden bg-[#080808]">
      <div
        className="absolute inset-0 opacity-8"
        style={{
          backgroundImage: `url(${doctrineBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-[#080808]/80 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-[#C9941A] text-sm font-semibold uppercase tracking-widest mb-4" data-testid="badge-doctrine-category">
            The Sasquatch Doctrine
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 uppercase" data-testid="text-doctrine-title">
            Tattoo-Grade Laws
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto" data-testid="text-doctrine-subtitle">
            The unbreakable principles that guide every stroke warrior's recovery.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {principles.map((principle, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border border-[#1e1e1e] bg-[#0D0D0D]/80 backdrop-blur"
              data-testid={`principle-${index}`}
            >
              <div className="text-[#C9941A] text-5xl font-black mb-3 leading-none">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="text-lg font-bold mb-2 uppercase tracking-wide text-white">
                {principle.title}
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
