import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import { 
  BookOpen, Video, FileText, Headphones, ExternalLink, 
  Search, Heart, Brain, Users, Dumbbell, MessageCircle,
  Download, Star, Clock
} from "lucide-react";

const categories = [
  { id: "all", label: "All Resources", icon: BookOpen },
  { id: "guides", label: "Guides", icon: FileText },
  { id: "videos", label: "Videos", icon: Video },
  { id: "podcasts", label: "Podcasts", icon: Headphones },
  { id: "community", label: "Community", icon: Users },
];

const resources = [
  {
    id: 1,
    title: "Stroke Recovery Fundamentals",
    description: "A comprehensive guide to understanding stroke recovery, neuroplasticity, and the path to healing.",
    category: "guides",
    type: "PDF Guide",
    icon: FileText,
    featured: true,
    tags: ["beginner", "essential"],
  },
  {
    id: 2,
    title: "Movement Therapy Exercises",
    description: "Video series covering essential exercises for arm, hand, and leg recovery.",
    category: "videos",
    type: "Video Series",
    icon: Video,
    featured: true,
    tags: ["movement", "exercises"],
  },
  {
    id: 3,
    title: "Speech Recovery Workbook",
    description: "Printable exercises and daily practice routines for speech and language recovery.",
    category: "guides",
    type: "Workbook",
    icon: FileText,
    tags: ["speech", "printable"],
  },
  {
    id: 4,
    title: "Survivor Stories Podcast",
    description: "Weekly interviews with stroke survivors sharing their recovery journeys and insights.",
    category: "podcasts",
    type: "Podcast",
    icon: Headphones,
    tags: ["inspiration", "stories"],
  },
  {
    id: 5,
    title: "Caregiver Support Guide",
    description: "Resources and strategies for caregivers supporting loved ones through recovery.",
    category: "guides",
    type: "PDF Guide",
    icon: Heart,
    tags: ["caregivers", "support"],
  },
  {
    id: 6,
    title: "Cognitive Training Exercises",
    description: "Brain exercises and games designed to improve memory, attention, and problem-solving.",
    category: "videos",
    type: "Interactive",
    icon: Brain,
    tags: ["cognitive", "brain"],
  },
  {
    id: 7,
    title: "Support Group Directory",
    description: "Find local and online stroke support groups in your area.",
    category: "community",
    type: "Directory",
    icon: Users,
    tags: ["community", "support"],
  },
  {
    id: 8,
    title: "Daily Motivation Audio",
    description: "Short daily audio messages to keep you motivated on your recovery journey.",
    category: "podcasts",
    type: "Audio",
    icon: Headphones,
    tags: ["motivation", "daily"],
  },
];

export default function RecoveryResources() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResources = resources.filter(resource => {
    const matchesCategory = activeCategory === "all" || resource.category === activeCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredResources = resources.filter(r => r.featured);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoverySEO
        title="Stroke Recovery Resources — Guides, Videos, Podcasts & Community Tools"
        description="A stroke recovery resource library curated by Nick Kremers: survivor-led guides, rehabilitation education, caregiver tools, and peer support. Use it as a starting point for questions with your care team."
        canonical="/recovery/resources"
        keywords={[
          "stroke recovery resources", "stroke rehabilitation guides", "stroke survivor videos", "stroke recovery podcast",
          "caregiver stroke resources", "aphasia resources", "stroke support groups", "neuroplasticity resources",
          "stroke recovery tools", "post stroke care", "stroke community support"
        ]}
        speakableSelectors={["h1", ".resources-intro", ".featured-resource-title"]}
        breadcrumbs={[{ name: "Recovery Hub", url: "/recovery" }, { name: "Resources", url: "/recovery/resources" }]}
        faq={[
          { question: "What resources are available for stroke survivors?", answer: "Stroke survivors have access to a wide range of resources: rehabilitation hospitals and outpatient therapy, support groups (in-person and online), books like Nick Kremers' 'The Ultimate Stroke Recovery Revolution', educational platforms like Stroke Recovery Academy, aphasia apps, brain training tools, exercise video libraries, caregiver guides, and community forums where survivors share strategies and encouragement." },
          { question: "What is the best book for stroke recovery?", answer: "Nick Kremers' 'The Ultimate Stroke Recovery Revolution' is a comprehensive guide covering neuroplasticity science, physical rehabilitation protocols, cognitive recovery, speech therapy, mindset strategies, and life integration — written by a survivor who achieved 0% to 90% recovery. Other recommended books include 'My Stroke of Insight' by Jill Bolte Taylor and 'Stronger After Stroke' by Peter Levine." },
          { question: "Are there online communities for stroke survivors?", answer: "Yes — the Stroke Recovery Academy community connects survivors worldwide. Other communities include the American Stroke Association support network, Aphasia Recovery Connection, TalkPath Live, and Facebook groups like 'Stroke Survivors Mentoring Each Other.' Online communities provide 24/7 peer support, shared strategies, and encouragement from people who truly understand the recovery journey." },
          { question: "What podcasts cover stroke recovery?", answer: "Stroke-focused podcasts include 'Strokecast' by Bill Monroe, 'My Stroke of Insight' content, 'Aphasia Recovery Connection' podcast, and content from Stroke Recovery Academy. These provide interviews with survivors, rehabilitation experts, and caregivers covering all aspects of life after stroke." },
          { question: "What apps help with stroke recovery?", answer: "Helpful stroke recovery apps include Constant Therapy and Tactus Therapy for cognitive and speech rehab, Rehab-U for exercise guidance, Lumosity and BrainHQ for cognitive training, Cozi for scheduling and medication reminders, and TalkPath Therapy for aphasia practice. The Stroke Recovery Academy app integrates all these functions with AI coaching from Nick Kremers." }
        ]}
      />
      <RecoveryHeader />
      
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-[#E2741B]" />
            Recovery Resources
          </h1>
          <p className="text-gray-400">
            Curated guides, videos, and tools to support your recovery journey
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#1a1a1a] border-[#333] pl-10"
            data-testid="input-search-resources"
          />
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Featured Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredResources.map(resource => {
              const Icon = resource.icon;
              return (
                <Card 
                  key={resource.id} 
                  className="bg-gradient-to-br from-orange-500/10 to-zinc-900 border-[#E2741B]/30 p-5 hover-elevate cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-[#E2741B] text-black/20">
                      <Icon className="h-6 w-6 text-[#E2741B]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{resource.title}</h3>
                        <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Featured</Badge>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{resource.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                        {resource.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs border-[#333]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="bg-[#1a1a1a] border-[#333] mb-6 flex-wrap">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <TabsTrigger 
                  key={cat.id} 
                  value={cat.id} 
                  className="text-gray-300 hover:text-white data-[state=active]:bg-[#E2741B] data-[state=active]:text-black"
                  style={{ color: activeCategory === cat.id ? "#000000" : "#D1D5DB" }}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {cat.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeCategory}>
            {filteredResources.length === 0 ? (
              <Card className="bg-[#1a1a1a] border-[#333] p-8 text-center">
                <Search className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No resources found matching your search.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResources.map(resource => {
                  const Icon = resource.icon;
                  return (
                    <Card 
                      key={resource.id} 
                      className="bg-[#1a1a1a] border-[#333] p-4 hover-elevate cursor-pointer"
                      data-testid={`resource-${resource.id}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-[#1a1a1a]">
                          <Icon className="h-5 w-5 text-[#E2741B]" />
                        </div>
                        <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                      </div>
                      <h3 className="font-semibold mb-2">{resource.title}</h3>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{resource.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {resource.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs border-[#333]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card className="bg-[#1a1a1a] border-[#333] p-6 mt-8">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#E2741B]" />
            Need More Help?
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Can't find what you're looking for? Our community and coaches are here to help.
          </p>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/recovery/community" data-testid="link-resources-community">
                <Users className="h-4 w-4 mr-2" />
                Join Community
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-[#E2741B]/50 text-[#F3B27A]">
              <Link href="/recovery/video" data-testid="link-resources-live-video">
                <Video className="h-4 w-4 mr-2" />
                Live video sessions
              </Link>
            </Button>
             <Button asChild className="bg-[#E2741B] text-black">
               <Link href="/recovery/coaching">
                 <MessageCircle className="h-4 w-4 mr-2" />
                 Book Coaching
               </Link>
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
