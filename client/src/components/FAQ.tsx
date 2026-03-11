import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How is this different from traditional stroke rehabilitation?",
    answer:
      "Traditional rehab follows conservative timelines based on insurance, not biology. Nick's methods combine proven clinical techniques with patient-driven innovation — refined over 6 years of real recovery — that simply aren't in medical textbooks. You get both cutting-edge neuroscience AND street-tested methods that actually work.",
  },
  {
    question: "I'm years post-stroke. Is it too late for me?",
    answer:
      "Absolutely not. Nick's biggest breakthroughs happened in years 4, 5, and 6. The medical system's \"1-year recovery window\" is an insurance construct, not biology. Neuroplasticity never stops — your brain can continue healing and adapting for decades after stroke with the right approach.",
  },
  {
    question: "What makes the Sasquatch Method unique?",
    answer:
      "Nick is the only person teaching stroke recovery who personally went from 0% to 90% function. Every technique has been battle-tested for 6 years. He combines Think-Flinch-Existence, Baseball Bat Therapy, Enhanced Mirror Therapy, and plateau-busting strategies that don't exist anywhere else. This isn't theory — it's lived experience.",
  },
  {
    question: "Do I need expensive equipment?",
    answer:
      "No. Nick's baseball bat method uses a $5 Walmart bat and outperformed $15,000 clinical equipment. Many breakthrough techniques use household items. He shows you exactly what's worth investing in and what you can do yourself. Recovery shouldn't bankrupt you.",
  },
  {
    question: "How does this work alongside my current therapy?",
    answer:
      "This complements your clinical therapy — it doesn't replace it. Use what your therapists teach, then apply Nick's TAKE→LEARN→EXPERIMENT→COMBINE→APPLY formula on top. Many survivors use these methods alongside traditional rehab and see accelerated progress. Always consult your medical team about new techniques.",
  },
  {
    question: "What if I'm still in a wheelchair?",
    answer:
      "That's exactly where Nick started — in a Hoyer lift with 0% function. The system includes protocols for every level: wheelchair transfers, standing exercises, weight-bearing progressions, and the complete path to independent walking. If he could do it from that starting point, you can too.",
  },
];

export default function FAQ() {
  return (
    <section className="py-20 bg-[#0D0D0D]" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-[#C9941A] text-sm font-semibold uppercase tracking-widest mb-4" data-testid="badge-faq-category">
            Questions Answered
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4" data-testid="text-faq-title">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-400" data-testid="text-faq-subtitle">
            Everything you need to know about the Sasquatch Method
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-[#1e1e1e] rounded-xl px-6 bg-[#111]"
              data-testid={`faq-item-${index}`}
            >
              <AccordionTrigger className="text-left font-semibold text-white hover:no-underline hover:text-[#C9941A] transition-colors py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 leading-relaxed pt-0 pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
