import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShieldCheck, 
  Award, 
  CheckCircle, 
  Users, 
  Globe, 
  DollarSign, 
  FileCheck,
  Star,
  Lock,
  Verified
} from "lucide-react";

interface TrustSignalsProps {
  variant?: 'full' | 'compact' | 'badges';
  className?: string;
}

const certifications = [
  { name: "SSL Secured", icon: Lock, description: "256-bit encryption" },
  { name: "GDPR Compliant", icon: CheckCircle, description: "EU data protection" },
  { name: "SOC 2 Type II", icon: Award, description: "Security certified" },
  { name: "PCI Compliant", icon: ShieldCheck, description: "Payment security" },
];

const stats = [
  { value: "10K+", label: "Creators", icon: Users },
  { value: "$2M+", label: "Creator Payouts", icon: DollarSign },
  { value: "50K+", label: "Projects Created", icon: FileCheck },
  { value: "150+", label: "Countries", icon: Globe },
];

export default function TrustSignals({ variant = 'full', className = '' }: TrustSignalsProps) {
  if (variant === 'badges') {
    return (
      <div className={`flex flex-wrap gap-2 justify-center ${className}`} data-testid="trust-badges">
        {certifications.map((cert) => (
          <Badge 
            key={cert.name} 
            variant="outline" 
            className="gap-1 px-3 py-1"
            data-testid={`badge-${cert.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <cert.icon className="w-3 h-3" />
            {cert.name}
          </Badge>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground ${className}`} data-testid="trust-compact">
        {certifications.slice(0, 3).map((cert) => (
          <div key={cert.name} className="flex items-center gap-1">
            <cert.icon className="w-4 h-4 text-primary" />
            <span>{cert.name}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className={`py-12 bg-muted/30 ${className}`} data-testid="trust-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Verified className="w-3 h-3 mr-1" />
            Trusted Platform
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Trusted by Creators Worldwide
          </h2>
          <p className="mt-2 text-muted-foreground">
            Enterprise-grade security and reliability for your creative work
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {stats.map((stat) => (
            <div 
              key={stat.label} 
              className="text-center"
              data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <stat.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {certifications.map((cert) => (
            <Card 
              key={cert.name} 
              className="bg-card/50 border-border/50"
              data-testid={`cert-${cert.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <cert.icon className="w-6 h-6 text-primary" />
                <div>
                  <div className="font-medium text-foreground">{cert.name}</div>
                  <div className="text-xs text-muted-foreground">{cert.description}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <span className="font-medium">4.8/5</span>
          <span>from 1,247 reviews</span>
        </div>
      </div>
    </section>
  );
}

export function AuthorCredentials({ 
  author 
}: { 
  author: { 
    name: string; 
    title?: string; 
    verified?: boolean;
    expertise?: string[];
    publications?: number;
  } 
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30" data-testid="author-credentials">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{author.name}</span>
          {author.verified && (
            <Verified className="w-4 h-4 text-primary" />
          )}
        </div>
        {author.title && (
          <div className="text-sm text-muted-foreground">{author.title}</div>
        )}
        {author.expertise && author.expertise.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {author.expertise.map((exp) => (
              <Badge key={exp} variant="secondary" className="text-xs">
                {exp}
              </Badge>
            ))}
          </div>
        )}
        {author.publications && author.publications > 0 && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <FileCheck className="w-3 h-3" />
            {author.publications} published works on Stroke Recovery Academy
          </div>
        )}
      </div>
    </div>
  );
}

export function ExpertiseBadge({ 
  level, 
  area 
}: { 
  level: 'beginner' | 'intermediate' | 'expert' | 'master';
  area: string;
}) {
  const colors = {
    beginner: 'bg-[#E2741B]/10 text-[#E2741B] border-green-500/20',
    intermediate: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    expert: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    master: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  };

  return (
    <Badge className={`${colors[level]} gap-1`} data-testid={`expertise-${level}`}>
      <Award className="w-3 h-3" />
      {level.charAt(0).toUpperCase() + level.slice(1)} in {area}
    </Badge>
  );
}
