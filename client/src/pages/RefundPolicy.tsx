import { Link } from "wouter";
import { ArrowLeft, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white" data-testid="page-refund-policy">
      <RecoverySEO
        title="Refund Policy | Stroke Recovery Academy"
        description="Our refund policy for subscriptions, courses, and one-time purchases on Stroke Recovery Academy."
        canonical="/legal/refund-policy"
      />
      <RecoveryHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/recovery/dashboard">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-[#E2741B] mb-6"
            data-testid="link-back-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E2741B]/15 border border-[#E2741B]/30 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-[#E2741B]" />
            </div>
            <h1 className="text-3xl font-black" data-testid="text-page-title">
              Refund Policy
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="border-[#333] text-white/80"
            data-testid="button-print"
          >
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </div>
        <p className="text-sm text-gray-500 mb-8">Last updated: May 1, 2026</p>

        <Separator className="bg-[#1a1a1a] mb-8" />

        <div className="space-y-6 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Subscriptions (Survivor+ and Survivor Pro)</h2>
            <p>
              You may cancel your monthly or annual subscription at any time from your account settings.
              Cancellation stops the next renewal — you keep access through the end of the period you've already paid for.
            </p>
            <p className="mt-2">
              <strong className="text-white">14-day satisfaction guarantee:</strong> If you cancel within 14 days
              of your first paid subscription charge and contact us, we'll refund that charge in full. After 14
              days, monthly charges are non-refundable; annual subscriptions may receive a pro-rata refund for the
              unused portion at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. One-Time Purchases (Books, Courses, Print)</h2>
            <p>
              Digital one-time purchases (e-books, course modules, downloadable templates) are eligible for a full
              refund within <strong className="text-white">30 days of purchase</strong> if you have completed less
              than 25% of the content.
            </p>
            <p className="mt-2">
              Print books and physical merchandise (Lulu Print-on-Demand) are non-refundable once shipped, except
              in cases of physical defect or shipping damage. Photograph the issue and email us within 14 days of
              delivery.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Survivor Scholarship</h2>
            <p>
              If financial hardship is preventing you from accessing the Platform, apply for the Survivor
              Scholarship at <Link href="/recovery/scholarship" className="text-[#E2741B] underline" data-testid="link-scholarship">
                /recovery/scholarship
              </Link>{" "}
              instead of requesting a refund. We grant scholarships generously to survivors and their caregivers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Marketplace (Creator-Sold Content)</h2>
            <p>
              Refund eligibility for items purchased from independent creators on the Marketplace is set by each
              creator and listed on the product page. The Platform's standard policy (30 days, &lt;25% completed) applies
              when no creator policy is published.
            </p>
            <p className="mt-2">
              Approved Marketplace refunds reverse the creator's earnings on that order.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Credits and AI Generations</h2>
            <p>
              Purchased credits used for AI image, voice, video, or music generation are{" "}
              <strong className="text-white">non-refundable once spent</strong> because we incur an immediate
              third-party API cost. Unused credits are refundable within 30 days of purchase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Payment Method</h2>
            <p>
              Approved refunds are returned to the original payment method via Stripe. They typically appear in
              your account within 5–10 business days, depending on your bank or card issuer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. How to Request a Refund</h2>
            <p>
              Email{" "}
              <a
                href="mailto:billing@strokerecoveryacademy.com"
                className="text-[#E2741B] underline"
                data-testid="link-billing-email"
              >
                billing@strokerecoveryacademy.com
              </a>{" "}
              with:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>The email address on your account</li>
              <li>The order/subscription ID (visible in your settings)</li>
              <li>The reason for your request — we read every one</li>
            </ul>
            <p className="mt-2">
              We respond within 3 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Chargebacks</h2>
            <p>
              Please contact us before disputing a charge with your bank. Chargebacks are usually a sign that
              something went wrong on our end — and we'd rather fix it directly. Filed chargebacks suspend your
              account until resolved.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Updates to This Policy</h2>
            <p>
              We may update this policy. Material changes will be posted here and emailed to active subscribers at
              least 14 days before they take effect.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
