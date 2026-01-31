import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BookOpen, 
  Globe, 
  DollarSign, 
  ShoppingBag,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  TrendingUp,
  Users,
  Star,
  Copy,
  CheckCircle2,
  LayoutTemplate,
  Sparkles,
  Mail,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface BookListing {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  coverImageUrl?: string;
  genre: string;
  status: string;
  totalSales: number;
  totalRevenue: number;
  createdAt: string;
  editions?: any[];
}

interface BookWebsite {
  id: number;
  slug: string;
  title: string;
  authorName: string;
  theme: string;
  coverImageUrl?: string;
  isPublished: boolean;
  viewCount: number;
  clickCount: number;
  publishedAt?: string;
  createdAt: string;
}

const genres = [
  "Fiction", "Non-Fiction", "Memoir", "Self-Help", "Business", 
  "Romance", "Mystery", "Thriller", "Science Fiction", "Fantasy",
  "Biography", "History", "Children", "Young Adult", "Poetry",
  "Health", "Cooking", "Travel", "Religion", "Art"
];

interface BookWebsiteTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  previewImageUrl: string;
  theme: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    headingFont: string;
  };
  sampleContent: {
    tagline: string;
    description: string;
    ctaText: string;
    testimonialPlaceholder: string;
  };
}

const categoryLabels: Record<string, string> = {
  author_portfolio: "Author Portfolio",
  fiction: "Fiction",
  non_fiction: "Non-Fiction",
  children: "Children's Books",
  memoir: "Memoir & Biography",
  business: "Business",
  romance: "Romance",
  thriller: "Thriller",
  self_help: "Self-Help",
  cookbook: "Cookbook",
  poetry: "Poetry",
  academic: "Academic",
  religious: "Religious",
  fantasy: "Fantasy",
  ebook: "Ebook & Digital"
};

export default function SellBooks() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("listings");
  const [showNewListingDialog, setShowNewListingDialog] = useState(false);
  const [showNewWebsiteDialog, setShowNewWebsiteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BookWebsiteTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: templates, isLoading: templatesLoading } = useQuery<BookWebsiteTemplate[]>({
    queryKey: ["/api/book-website-templates"],
  });

  const { data: listings, isLoading: listingsLoading } = useQuery<BookListing[]>({
    queryKey: ["/api/marketplace/my-books"],
    enabled: !!user,
  });

  const { data: websites, isLoading: websitesLoading } = useQuery<BookWebsite[]>({
    queryKey: ["/api/book-websites"],
    enabled: !!user,
  });

  const { data: earnings } = useQuery<{ totals: { totalEarnings: number; pendingPayout: number; salesCount: number } }>({
    queryKey: ["/api/marketplace/author/earnings"],
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9941A]" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const totalRevenue = listings?.reduce((sum, l) => sum + (l.totalRevenue || 0), 0) || 0;
  const totalSales = listings?.reduce((sum, l) => sum + (l.totalSales || 0), 0) || 0;
  const publishedCount = listings?.filter(l => l.status === "published").length || 0;

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <GlobalHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sell Your Books</h1>
            <p className="text-gray-400 mt-1">
              List books in the marketplace or create dedicated websites. Keep 85% of every sale.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowNewWebsiteDialog(true)}
              data-testid="button-new-website"
            >
              <Globe className="h-4 w-4 mr-2" />
              Create Website
            </Button>
            <Button 
              onClick={() => setShowNewListingDialog(true)}
              data-testid="button-new-listing"
            >
              <Plus className="h-4 w-4 mr-2" />
              List New Book
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <DollarSign className="h-5 w-5 text-[#C9941A]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Earnings</p>
                  <p className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-[#C9941A]/10">
                  <ShoppingBag className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Sales</p>
                  <p className="text-2xl font-bold">{totalSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Published Books</p>
                  <p className="text-2xl font-bold">{publishedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/10">
                  <Globe className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Book Websites</p>
                  <p className="text-2xl font-bold">{websites?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="listings" data-testid="tab-listings">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Marketplace Listings
            </TabsTrigger>
            <TabsTrigger value="websites" data-testid="tab-websites">
              <Globe className="h-4 w-4 mr-2" />
              Book Websites
            </TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">
              <LayoutTemplate className="h-4 w-4 mr-2" />
              Website Templates
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            {listingsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-6">
                      <div className="h-40 bg-[#1a1a1a] rounded mb-4" />
                      <div className="h-4 bg-[#1a1a1a] rounded w-3/4 mb-2" />
                      <div className="h-4 bg-[#1a1a1a] rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : listings?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Books Listed Yet</h3>
                  <p className="text-gray-400 mb-4">
                    Start selling your books in the KreAIte marketplace
                  </p>
                  <Button onClick={() => setShowNewListingDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    List Your First Book
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings?.map(listing => (
                  <ListingCard 
                    key={listing.id} 
                    listing={listing} 
                    onCreateWebsite={() => {
                      setShowNewWebsiteDialog(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="websites" className="space-y-4">
            {websitesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-6">
                      <div className="h-40 bg-[#1a1a1a] rounded mb-4" />
                      <div className="h-4 bg-[#1a1a1a] rounded w-3/4 mb-2" />
                      <div className="h-4 bg-[#1a1a1a] rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : websites?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Book Websites Yet</h3>
                  <p className="text-gray-400 mb-4">
                    Create a professional landing page for your book
                  </p>
                  <Button onClick={() => setShowNewWebsiteDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Website
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {websites?.map(website => (
                  <WebsiteCard key={website.id} website={website} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Book Website Templates</h2>
                  <p className="text-gray-400">Choose a professionally designed template for your book</p>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48" data-testid="select-template-category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {templatesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="pt-6">
                        <div className="h-48 bg-[#1a1a1a] rounded mb-4" />
                        <div className="h-4 bg-[#1a1a1a] rounded w-3/4 mb-2" />
                        <div className="h-4 bg-[#1a1a1a] rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates
                    ?.filter(t => selectedCategory === "all" || t.category === selectedCategory)
                    .map(template => (
                      <Card 
                        key={template.id} 
                        className="overflow-hidden hover-elevate cursor-pointer group"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowNewWebsiteDialog(true);
                        }}
                        data-testid={`template-card-${template.id}`}
                      >
                        <div 
                          className="h-48 relative"
                          style={{ 
                            background: `linear-gradient(135deg, ${template.theme.backgroundColor} 0%, ${template.theme.primaryColor}20 100%)` 
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div 
                              className="w-24 h-36 rounded-lg shadow-xl transform group-hover:scale-105 transition-transform"
                              style={{ 
                                backgroundColor: template.theme.backgroundColor,
                                border: `3px solid ${template.theme.primaryColor}`
                              }}
                            >
                              <div className="p-2">
                                <div 
                                  className="h-2 rounded mb-1"
                                  style={{ backgroundColor: template.theme.primaryColor, width: '60%' }}
                                />
                                <div 
                                  className="h-1 rounded mb-2"
                                  style={{ backgroundColor: template.theme.accentColor, width: '80%' }}
                                />
                                <div className="space-y-1">
                                  {[1,2,3,4].map(i => (
                                    <div 
                                      key={i}
                                      className="h-0.5 rounded"
                                      style={{ backgroundColor: template.theme.textColor, opacity: 0.3, width: `${70 + Math.random() * 30}%` }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="absolute top-3 right-3">
                            <Badge variant="secondary" className="text-xs">
                              {categoryLabels[template.category] || template.category}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{template.name}</h3>
                            <div className="flex gap-1">
                              <div 
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: template.theme.primaryColor }}
                                title="Primary Color"
                              />
                              <div 
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: template.theme.accentColor }}
                                title="Accent Color"
                              />
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {template.description}
                          </p>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Button 
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTemplate(template);
                              setShowNewWebsiteDialog(true);
                            }}
                            data-testid={`button-use-template-${template.id}`}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Use This Template
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              )}

              {templates && templates.filter(t => selectedCategory === "all" || t.category === selectedCategory).length === 0 && (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <LayoutTemplate className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
                    <p className="text-gray-400">
                      No templates available for this category. Try selecting a different category.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Split</CardTitle>
                  <CardDescription>You keep 85% of every sale</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Your Share</span>
                      <span className="font-bold text-green-600">85%</span>
                    </div>
                    <div className="w-full bg-[#1a1a1a] rounded-full h-4">
                      <div className="bg-[#C9941A] h-4 rounded-full" style={{ width: '85%' }} />
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>Platform Fee: 15%</span>
                      <span>Your Earnings: ${(totalRevenue * 0.85 / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sales Performance</CardTitle>
                  <CardDescription>Your book sales overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {listings?.slice(0, 5).map(listing => (
                      <div key={listing.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {listing.coverImageUrl ? (
                            <img 
                              src={listing.coverImageUrl} 
                              alt={listing.title}
                              className="w-10 h-14 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-[#1a1a1a] rounded flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{listing.title}</p>
                            <p className="text-xs text-gray-400">{listing.totalSales} sales</p>
                          </div>
                        </div>
                        <span className="font-semibold">${(listing.totalRevenue / 100).toFixed(2)}</span>
                      </div>
                    ))}
                    {(!listings || listings.length === 0) && (
                      <p className="text-center text-gray-400 py-4">No sales data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <NewListingDialog 
          open={showNewListingDialog} 
          onOpenChange={setShowNewListingDialog}
        />
        
        <NewWebsiteDialog 
          open={showNewWebsiteDialog} 
          onOpenChange={(open) => {
            setShowNewWebsiteDialog(open);
            if (!open) setSelectedTemplate(null);
          }}
          selectedTemplate={selectedTemplate}
        />
      </main>

      <Footer />
    </div>
  );
}

function ListingCard({ listing, onCreateWebsite }: { listing: BookListing; onCreateWebsite: () => void }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const statusColors: Record<string, string> = {
    published: "bg-[#C9941A]/10 text-green-700",
    draft: "bg-yellow-500/10 text-yellow-700",
    pending_review: "bg-blue-500/10 text-blue-700",
    suspended: "bg-red-500/10 text-red-700",
  };

  return (
    <Card data-testid={`card-listing-${listing.id}`}>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          {listing.coverImageUrl ? (
            <img 
              src={listing.coverImageUrl} 
              alt={listing.title}
              className="w-20 h-28 object-cover rounded shadow"
            />
          ) : (
            <div className="w-20 h-28 bg-[#1a1a1a] rounded flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold truncate">{listing.title}</h3>
              <Badge className={statusColors[listing.status] || "bg-[#1a1a1a]"}>
                {listing.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-gray-400 mb-2">{listing.genre}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <ShoppingBag className="h-3 w-3" />
                {listing.totalSales} sales
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                ${(listing.totalRevenue / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => navigate(`/marketplace/book/${listing.id}`)}>
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
        <Button variant="outline" size="sm">
          <Pencil className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={onCreateWebsite}>
          <Globe className="h-3 w-3 mr-1" />
          Website
        </Button>
      </CardFooter>
    </Card>
  );
}

function WebsiteCard({ website }: { website: BookWebsite }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const baseUrl = window.location.origin;

  const copyUrl = () => {
    navigator.clipboard.writeText(`${baseUrl}/book/${website.slug}`);
    toast({ title: "URL copied to clipboard" });
  };

  return (
    <Card data-testid={`card-website-${website.id}`}>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          {website.coverImageUrl ? (
            <img 
              src={website.coverImageUrl} 
              alt={website.title}
              className="w-20 h-28 object-cover rounded shadow"
            />
          ) : (
            <div className="w-20 h-28 bg-gradient-to-br from-primary/20 to-primary/5 rounded flex items-center justify-center">
              <Globe className="h-8 w-8 text-[#C9941A]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold truncate">{website.title}</h3>
              <Badge className={website.isPublished ? "bg-[#C9941A]/10 text-green-700" : "bg-yellow-500/10 text-yellow-700"}>
                {website.isPublished ? "Live" : "Draft"}
              </Badge>
            </div>
            <p className="text-sm text-gray-400 mb-2">/{website.slug}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {website.viewCount} views
              </span>
              <span className="flex items-center gap-1">
                <LayoutTemplate className="h-3 w-3" />
                {website.theme}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2 flex-wrap">
        {website.isPublished && (
          <Button variant="outline" size="sm" asChild>
            <a href={`/book/${website.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Visit
            </a>
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => navigate(`/book-website/${website.id}`)}>
          <Pencil className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={copyUrl}>
          <Copy className="h-3 w-3 mr-1" />
          Copy URL
        </Button>
      </CardFooter>
    </Card>
  );
}

function NewListingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    genre: "",
    coverImageUrl: "",
    price: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.genre || !formData.price) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/marketplace/publish", {
        title: formData.title,
        subtitle: formData.subtitle,
        description: formData.description,
        genre: formData.genre,
        coverImageUrl: formData.coverImageUrl,
        projectId: 1,
        editions: [{
          editionType: "digital_ebook",
          price: Math.round(parseFloat(formData.price) * 100),
          currency: "USD"
        }]
      });

      toast({ title: "Book listed successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/my-books"] });
      onOpenChange(false);
      setFormData({ title: "", subtitle: "", description: "", genre: "", coverImageUrl: "", price: "" });
    } catch (error: any) {
      toast({ title: error.message || "Failed to list book", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>List a New Book</DialogTitle>
          <DialogDescription>
            Add your book to the KreAIte marketplace. You keep 85% of every sale.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Book Title *</Label>
            <Input 
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter your book title"
              data-testid="input-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input 
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
              placeholder="Optional subtitle"
              data-testid="input-subtitle"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea 
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your book..."
              rows={4}
              data-testid="input-description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Genre *</Label>
              <Select 
                value={formData.genre} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}
              >
                <SelectTrigger data-testid="select-genre">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map(g => (
                    <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD) *</Label>
              <Input 
                id="price"
                type="number"
                step="0.01"
                min="0.99"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="9.99"
                data-testid="input-price"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cover">Cover Image URL</Label>
            <Input 
              id="cover"
              value={formData.coverImageUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, coverImageUrl: e.target.value }))}
              placeholder="https://..."
              data-testid="input-cover"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} data-testid="button-submit-listing">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              List Book
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewWebsiteDialog({ 
  open, 
  onOpenChange, 
  selectedTemplate 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  selectedTemplate?: BookWebsiteTemplate | null;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    authorName: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "",
    slug: "",
    theme: selectedTemplate?.id || "classic",
    genre: selectedTemplate?.category || "",
    primaryColor: selectedTemplate?.theme.primaryColor || "#C9941A",
    accentColor: selectedTemplate?.theme.accentColor || "#1a1a1a",
    tagline: selectedTemplate?.sampleContent.tagline || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.authorName || !formData.slug) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/book-websites", formData);

      toast({ title: "Book website created!" });
      queryClient.invalidateQueries({ queryKey: ["/api/book-websites"] });
      onOpenChange(false);
      setFormData({ 
        title: "", 
        authorName: "", 
        slug: "", 
        theme: "classic", 
        genre: "",
        primaryColor: "#C9941A",
        accentColor: "#1a1a1a",
        tagline: ""
      });
    } catch (error: any) {
      toast({ title: error.message || "Failed to create website", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Book Website</DialogTitle>
          <DialogDescription>
            Create a professional landing page for your book with buy links, reviews, and author info.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ws-title">Book Title *</Label>
            <Input 
              id="ws-title"
              value={formData.title}
              onChange={(e) => {
                const title = e.target.value;
                setFormData(prev => ({ 
                  ...prev, 
                  title,
                  slug: prev.slug || generateSlug(title)
                }));
              }}
              placeholder="Enter your book title"
              data-testid="input-website-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws-author">Author Name *</Label>
            <Input 
              id="ws-author"
              value={formData.authorName}
              onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
              placeholder="Your author name"
              data-testid="input-website-author"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws-slug">URL Slug *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">/book/</span>
              <Input 
                id="ws-slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                placeholder="my-awesome-book"
                data-testid="input-website-slug"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select 
                value={formData.theme} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, theme: value }))}
              >
                <SelectTrigger data-testid="select-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themes.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} - {t.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Genre</Label>
              <Select 
                value={formData.genre} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}
              >
                <SelectTrigger data-testid="select-website-genre">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map(g => (
                    <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} data-testid="button-submit-website">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Website
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
