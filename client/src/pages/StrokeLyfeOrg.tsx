import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import NonprofitHeader from "@/components/NonprofitHeader";
import RecoverySEO from "@/components/RecoverySEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  Gift,
  Users,
  Target,
  Calendar,
  CheckCircle,
  ArrowRight,
  Award,
  Mail,
  MapPin,
  Building,
  DollarSign,
  GraduationCap,
  Compass,
} from "lucide-react";
import strokeLyfeLogo from "@assets/Untitled_design_1776789083877.png";

const donationAmounts = [25, 50, 100, 250, 500, 1000];

const scholarshipTiers = [
  {
    id: "basic",
    name: "Survivor Scholarship",
    price: 97,
    description: "Gift full Academy access to a stroke survivor",
    features: [
      "Full Recovery University access",
      "66-Day Transformation program",
      "Sasquatch Formula training",
      "Community support access",
    ],
    icon: GraduationCap,
  },
  {
    id: "mentored",
    name: "Mentored Scholarship",
    price: 297,
    description: "Academy access + 3 months group coaching",
    features: [
      "Everything in Survivor Scholarship",
      "3 months group coaching calls",
      "Weekly accountability check-ins",
      "Direct message access to coaches",
    ],
    icon: Users,
    popular: true,
  },
  {
    id: "elite",
    name: "Elite Scholarship",
    price: 997,
    description: "Full access + 1-on-1 coaching with Nick",
    features: [
      "Everything in Mentored Scholarship",
      "4 private sessions with Nick Kremers",
      "Custom recovery plan creation",
      "Lifetime community access",
      "Certificate of completion",
    ],
    icon: Award,
  },
];

export default function StrokeLyfeOrg() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedDonation, setSelectedDonation] = useState<number>(100);
  const [customDonation, setCustomDonation] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [giftRecipientEmail, setGiftRecipientEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");

  const donationMutation = useMutation({
    mutationFn: async (data: { amount: number; isRecurring: boolean }) => {
      const response = await apiRequest("POST", "/api/recovery/payments/donate", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Donation Failed",
        description: "There was an error processing your donation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scholarshipMutation = useMutation({
    mutationFn: async (data: { tierId: string; recipientEmail: string; message: string }) => {
      const response = await apiRequest("POST", "/api/recovery/payments/gift-scholarship", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Scholarship Gift Failed",
        description: "There was an error processing your gift. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDonate = () => {
    let amount = selectedDonation;
    if (customDonation && customDonation.trim() !== "") {
      const parsed = parseInt(customDonation, 10);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    }
    if (amount < 5) {
      toast({
        title: "Minimum Donation",
        description: "Minimum donation is $5",
        variant: "destructive",
      });
      return;
    }
    donationMutation.mutate({ amount: amount * 100, isRecurring });
  };

  const handleGiftScholarship = (tierId: string) => {
    if (!giftRecipientEmail) {
      toast({
        title: "Email Required",
        description: "Please enter the recipient's email address",
        variant: "destructive",
      });
      return;
    }
    scholarshipMutation.mutate({
      tierId,
      recipientEmail: giftRecipientEmail,
      message: giftMessage,
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <RecoverySEO
        title="Stroke Lyfe Inc. — 501(c)(3) Stroke Recovery Nonprofit"
        description="Stroke Lyfe Inc. is Nick Kremers' nonprofit organization supporting stroke survivors through donations, scholarships, and survivor access programs."
        canonical="/recovery/strokelyfe-org"
        keywords={["stroke nonprofit", "stroke recovery charity", "Stroke Lyfe Inc", "stroke survivor scholarship", "stroke recovery donation", "501c3 stroke", "Nick Kremers nonprofit"]}
        breadcrumbs={[{ name: "Stroke Lyfe Inc.", url: "/recovery/strokelyfe-org" }]}
        additionalSchema={{
          "@context": "https://schema.org",
          "@type": "NGO",
          name: "Stroke Lyfe Inc.",
          alternateName: "Stroke Lyfe",
          url: "https://strokerecoveryacademy.com/recovery/strokelyfe-org",
          description: "A 501(c)(3) nonprofit founded by stroke survivor Nick Kremers to provide recovery resources, scholarships, and community to stroke survivors regardless of income or insurance status.",
          slogan: "Rebuild. Rewire. Rise.",
          founder: { "@type": "Person", name: "Nick Kremers" },
          areaServed: { "@type": "Country", name: "Worldwide" },
          nonprofitStatus: "Nonprofit501c3",
          taxID: "Available upon request",
        }}
      />
      <NonprofitHeader />
      
      <section className="relative py-20 px-4 bg-gradient-to-br from-[#E2741B] via-[#2D5A4A] to-[#E2741B] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-[#E2741B] rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-[#E2741B] rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="flex justify-center mb-6">
            <img 
              src={strokeLyfeLogo} 
              alt="Stroke Lyfe" 
              className="h-24 w-auto"
              data-testid="img-strokelyfe-logo"
            />
          </div>
          
          <Badge className="bg-[#E2741B]/20 text-[#E2741B] border-[#E2741B]/30 mb-6">
            <Building className="w-3 h-3 mr-1" />
            501(c)(3) Nonprofit Organization
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-serif">
            Stroke Lyfe Inc.
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-4 max-w-3xl mx-auto">
            Empowering stroke survivors through education, accountability, and community
          </p>
          
          <p className="text-lg text-[#E2741B] font-semibold mb-8">
            REBUILD. REWIRE. RISE.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-[#E2741B] hover:bg-[#B8860B] text-white"
              onClick={() => document.getElementById('donate')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-donate-hero"
            >
              <Heart className="w-5 h-5 mr-2" />
              Donate Now
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => document.getElementById('scholarships')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-gift-scholarship"
            >
              <Gift className="w-5 h-5 mr-2" />
              Gift a Scholarship
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white border-b">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
             <div>
               <div className="text-2xl font-bold text-[#E2741B] mb-2">Direct gifts</div>
               <div className="text-gray-600">Support a survivor you know</div>
             </div>
             <div>
               <div className="text-2xl font-bold text-[#E2741B] mb-2">Scholarships</div>
               <div className="text-gray-600">Help fund access for someone in need</div>
             </div>
             <div>
               <div className="text-2xl font-bold text-[#E2741B] mb-2">Survivor-led</div>
               <div className="text-gray-600">Built from lived experience</div>
             </div>
             <div>
               <div className="text-2xl font-bold text-[#E2741B] mb-2">Open access</div>
               <div className="text-gray-600">Support programs for the recovery journey</div>
             </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-[#E2741B]/10 text-[#E2741B] mb-4">Our Mission</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[#E2741B] mb-4 font-serif">
              No Survivor Left Behind
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Every stroke survivor deserves access to proven recovery methods. 
               Your support helps us provide scholarships and recovery access to survivors who cannot afford them.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-[#E2741B]/20 hover-elevate">
              <CardHeader>
                <div className="w-12 h-12 bg-[#E2741B]/10 rounded-lg flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-[#E2741B]" />
                </div>
                <CardTitle className="text-[#E2741B]">Academy Scholarships</CardTitle>
                <CardDescription>
                  Full access to Recovery University for survivors in financial need
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-[#E2741B]/20 hover-elevate">
              <CardHeader>
                <div className="w-12 h-12 bg-[#E2741B]/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-[#E2741B]" />
                </div>
                 <CardTitle className="text-[#E2741B]">Survivor Support</CardTitle>
                <CardDescription>
                   Community programs and practical resources that help survivors stay connected
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-[#E2741B]/20 hover-elevate">
              <CardHeader>
                <div className="w-12 h-12 bg-[#E2741B]/10 rounded-lg flex items-center justify-center mb-4">
                  <Compass className="w-6 h-6 text-[#E2741B]" />
                </div>
                <CardTitle className="text-[#E2741B]">Recovery Planning</CardTitle>
                <CardDescription>
                  Personalized 66-Day plans built around the Sasquatch Formula methodology
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section id="donate" className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-[#E2741B]/10 text-[#E2741B] mb-4">
              <Heart className="w-3 h-3 mr-1" />
              Make a Difference
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[#E2741B] mb-4 font-serif">
              Donate to Stroke Lyfe Inc.
            </h2>
            <p className="text-lg text-gray-600">
              100% of donations go directly to survivor scholarships and programs
            </p>
          </div>
          
          <Card className="border-[#E2741B]/20">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <Label className="text-[#E2741B] font-semibold mb-3 block">Select Amount</Label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {donationAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant={selectedDonation === amount && !customDonation ? "default" : "outline"}
                        className={selectedDonation === amount && !customDonation 
                          ? "bg-[#E2741B] hover:bg-[#2D5A4A]" 
                          : "border-[#E2741B]/30 hover:bg-[#E2741B]/10"
                        }
                        onClick={() => {
                          setSelectedDonation(amount);
                          setCustomDonation("");
                        }}
                        data-testid={`button-donate-${amount}`}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="custom-amount" className="text-[#E2741B] font-semibold mb-2 block">
                    Or Enter Custom Amount
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="custom-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={customDonation}
                      onChange={(e) => setCustomDonation(e.target.value)}
                      className="pl-10"
                      data-testid="input-custom-donation"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button
                    variant={!isRecurring ? "default" : "outline"}
                    className={!isRecurring ? "bg-[#E2741B]" : ""}
                    onClick={() => setIsRecurring(false)}
                    data-testid="button-one-time"
                  >
                    One-Time
                  </Button>
                  <Button
                    variant={isRecurring ? "default" : "outline"}
                    className={isRecurring ? "bg-[#E2741B]" : ""}
                    onClick={() => setIsRecurring(true)}
                    data-testid="button-recurring"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Monthly
                  </Button>
                </div>
                
                <Button
                  size="lg"
                  className="w-full bg-[#E2741B] hover:bg-[#B8860B] text-white"
                  onClick={handleDonate}
                  disabled={donationMutation.isPending}
                  data-testid="button-complete-donation"
                >
                  {donationMutation.isPending ? (
                    "Processing..."
                  ) : (
                    <>
                      <Heart className="w-5 h-5 mr-2" />
                      Donate ${customDonation || selectedDonation}
                      {isRecurring && "/month"}
                    </>
                  )}
                </Button>
                
                <p className="text-center text-sm text-gray-500">
                  Stroke Lyfe Inc. is a registered 501(c)(3) nonprofit. Your donation is tax-deductible.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="scholarships" className="py-16 px-4 bg-[#FAF8F3]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-[#E2741B]/10 text-[#E2741B] mb-4">
              <Gift className="w-3 h-3 mr-1" />
              Gift a Scholarship
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[#E2741B] mb-4 font-serif">
              Sponsor a Survivor's Recovery
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Know a stroke survivor who needs help? Gift them full access to our proven recovery programs.
            </p>
          </div>
          
          <div className="mb-8 max-w-md mx-auto">
            <Card className="border-[#E2741B]/30 bg-[#E2741B]/5">
              <CardContent className="pt-6">
                <Label htmlFor="recipient-email" className="text-[#E2741B] font-semibold mb-2 block">
                  Recipient's Email Address
                </Label>
                <Input
                  id="recipient-email"
                  type="email"
                  placeholder="survivor@email.com"
                  value={giftRecipientEmail}
                  onChange={(e) => setGiftRecipientEmail(e.target.value)}
                  className="mb-4"
                  data-testid="input-recipient-email"
                />
                <Label htmlFor="gift-message" className="text-[#E2741B] font-semibold mb-2 block">
                  Personal Message (Optional)
                </Label>
                <Textarea
                  id="gift-message"
                  placeholder="Write a message of encouragement..."
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  className="resize-none"
                  data-testid="input-gift-message"
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {scholarshipTiers.map((tier) => (
              <Card 
                key={tier.id} 
                className={`border-[#E2741B]/20 hover-elevate relative ${tier.popular ? 'ring-2 ring-[#E2741B]' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#E2741B] text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-[#E2741B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <tier.icon className="w-8 h-8 text-[#E2741B]" />
                  </div>
                  <CardTitle className="text-[#E2741B]">{tier.name}</CardTitle>
                  <div className="text-3xl font-bold text-[#E2741B]">${tier.price}</div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-[#E2741B] mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full bg-[#E2741B] hover:bg-[#2D5A4A]"
                    onClick={() => handleGiftScholarship(tier.id)}
                    disabled={scholarshipMutation.isPending}
                    data-testid={`button-gift-${tier.id}`}
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Gift This Scholarship
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

       <section id="coaching" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
           <div className="max-w-3xl mx-auto text-center">
             <Badge className="bg-[#E2741B]/10 text-[#E2741B] mb-4">
               <Heart className="w-3 h-3 mr-1" />
               Keep the brands clear
             </Badge>
             <h2 className="text-3xl md:text-4xl font-bold text-[#E2741B] mb-4 font-serif">
               Looking for Nick's coaching?
             </h2>
             <p className="text-lg text-gray-600 mb-8">
               Stroke Lyfe Inc. focuses on nonprofit access and scholarships.
               Nick's paid coaching and the Sasquatch method live separately under Stroked-Out Sasquatch.
             </p>
             <Button
               size="lg"
               className="bg-[#E2741B] hover:bg-[#2D5A4A]"
               onClick={() => navigate("/recovery/coaching")}
               data-testid="button-sasquatch-coaching"
             >
               Visit Stroked-Out Sasquatch Coaching
               <ArrowRight className="w-4 h-4 ml-2" />
             </Button>
           </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-[#E2741B] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-serif">
            Join the Movement
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Together, we're proving that stroke doesn't have to mean the end. 
            It can be the beginning of something extraordinary.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-[#E2741B] hover:bg-[#B8860B]"
              onClick={() => document.getElementById('donate')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-donate-cta"
            >
              <Heart className="w-5 h-5 mr-2" />
              Donate Today
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => navigate("/recovery/academy")}
              data-testid="button-explore-academy"
            >
              <GraduationCap className="w-5 h-5 mr-2" />
              Explore Academy
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 bg-[#0D0D0D] text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src={strokeLyfeLogo} alt="Stroke Lyfe" className="h-12 w-auto mb-4" />
              <p className="text-gray-400 text-sm">
                Stroke Lyfe Inc. is a registered 501(c)(3) nonprofit organization. 
                EIN: XX-XXXXXXX
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#E2741B]">Programs</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Recovery Academy</li>
                <li>Scholarship Fund</li>
                 <li>Survivor Support</li>
                <li>Community Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#E2741B]">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Sasquatch Formula</li>
                <li>66-Day Program</li>
                <li>Survivor Stories</li>
                <li>Research & Studies</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#E2741B]">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  support@strokelyfe.org
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  USA
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#333] pt-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Stroke Lyfe Inc. All rights reserved.</p>
            <p className="mt-2 text-[#E2741B]">REBUILD. REWIRE. RISE.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
