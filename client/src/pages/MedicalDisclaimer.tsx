import { Link } from "wouter";
import { ArrowLeft, Printer, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";

export default function MedicalDisclaimer() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white" data-testid="page-medical-disclaimer">
      <RecoverySEO
        title="Medical Disclaimer | Stroke Recovery Academy"
        description="Stroke Recovery Academy is non-clinical and provides lived-experience guidance, not medical advice. Read the full disclaimer."
        canonical="/legal/medical-disclaimer"
      />
      <RecoveryHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/recovery/dashboard">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-[#C9941A] mb-6"
            data-testid="link-back-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <h1 className="text-3xl font-black" data-testid="text-page-title">
              Medical Disclaimer
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
            <h2 className="text-xl font-bold text-white mb-3">1. Not a Medical Provider</h2>
            <p>
              Stroke Recovery Academy ("the Platform") is operated by Stroke Lyfe Inc. and is built on the lived
              experience of Nick Kremers, a stroke survivor — <strong className="text-white">not a licensed physician,
              physical therapist, occupational therapist, speech-language pathologist, neurologist, or other
              healthcare professional</strong>. The Platform does not provide medical care, diagnosis, treatment,
              or prescription of any kind.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Lived-Experience Education Only</h2>
            <p>
              All content — including videos, exercises, the 66-Day Sasquatch Transformation Challenge,
              the Daily Routine system, the AI Sasquatch Coach, blog posts, podcasts, and any community
              discussions — is offered as <strong className="text-white">peer education and motivation from
              survivors and creators</strong>. It reflects what worked for them. It is not personalized medical
              advice and may not be appropriate for your condition.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Always Consult Your Care Team</h2>
            <p>
              Before starting, modifying, or stopping any exercise routine, medication, supplement, diet,
              therapy, or recovery protocol — including anything you encounter on this Platform —{" "}
              <strong className="text-white">consult your treating physician, therapist, or other licensed
              healthcare provider</strong>. They know your medical history, current medications, comorbidities,
              and post-stroke risk profile (seizure risk, blood pressure, anticoagulation status, fall risk,
              orthostatic hypotension, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. AI Coach Is Not a Clinician</h2>
            <p>
              The "Sasquatch Coach" is a large-language-model chatbot. It can produce confident-sounding
              responses that are inaccurate, incomplete, or inappropriate for your situation. It does not
              diagnose, prescribe, triage, or replace clinical judgment. It is not a crisis counselor — if you
              are in crisis, call <strong className="text-white">988</strong> (Suicide &amp; Crisis Lifeline)
              or 911 immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Emergencies</h2>
            <p>
              If you experience any of the following, <strong className="text-white">call 911 immediately</strong>:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Sudden new weakness, numbness, or facial droop (possible new stroke)</li>
              <li>Sudden severe headache, vision loss, or loss of speech</li>
              <li>Chest pain, severe shortness of breath, or loss of consciousness</li>
              <li>A fall with injury or any uncontrolled bleeding</li>
              <li>Thoughts of harming yourself or others</li>
            </ul>
            <p className="mt-3">
              <strong className="text-white">Do not</strong> message the AI Coach, post in community, or wait
              for a Platform response in an emergency.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Exercise Risk</h2>
            <p>
              Stroke recovery exercises carry real risks: falls, joint injury, blood-pressure spikes, seizure
              triggering, cardiac events, and aspiration during swallowing work. Your tolerance is personal.
              Stop immediately and seek care if you experience pain, dizziness, chest tightness, sudden
              weakness, or any new neurological symptom. Use a spotter, stable surface, or seated modification
              when in doubt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. No Doctor-Patient Relationship</h2>
            <p>
              Use of this Platform — including correspondence with the AI Coach, community members, or any
              creators — does <strong className="text-white">not</strong> establish a doctor-patient,
              therapist-patient, or any other licensed clinical relationship.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Assumption of Risk</h2>
            <p>
              By using this Platform, you acknowledge that you have read this disclaimer, understand it, and
              voluntarily assume the risks of following any guidance you find here. You agree that Stroke Lyfe
              Inc., its founders, employees, contributors, creators, and AI providers are not liable for any
              outcome — physical, psychological, or financial — arising from your use of the Platform, to the
              maximum extent permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Contact</h2>
            <p>
              Questions about this disclaimer? Email{" "}
              <a
                href="mailto:hello@strokerecoveryacademy.com"
                className="text-[#C9941A] underline"
                data-testid="link-contact-email"
              >
                hello@strokerecoveryacademy.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
