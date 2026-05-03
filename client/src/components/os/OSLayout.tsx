import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Video,
  Music,
  GraduationCap,
  Image,
  Brain,
  Globe,
  ShoppingBag,
  Home,
  Menu,
  X,
  User,
  LogOut,
  Zap,
  Settings,
  LayoutGrid,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import strokeLyfeLogo from "@assets/Untitled_design_1776789083877.png";

const studios = [
  { id: "book", name: "Book Studio", icon: BookOpen, path: "/book-studio", color: "text-amber-500" },
  { id: "video", name: "Video Studio", icon: Video, path: "/video-studio", color: "text-red-500" },
  { id: "music", name: "Music Studio", icon: Music, path: "/music-studio", color: "text-purple-500" },
  { id: "course", name: "Course Studio", icon: GraduationCap, path: "/course-studio", color: "text-blue-500" },
  { id: "image", name: "Image Studio", icon: Image, path: "/image-studio", color: "text-green-500" },
  { id: "doctrine", name: "Doctrine Engine", icon: Brain, path: "/doctrine-engine", color: "text-orange-500" },
  { id: "website", name: "Website Builder", icon: Globe, path: "/website-studio", color: "text-cyan-500" },
];

const navItems = [
  { name: "Dashboard", icon: Home, path: "/recovery/dashboard" },
  { name: "Academy", icon: GraduationCap, path: "/recovery/academy" },
  { name: "Store", icon: ShoppingBag, path: "/store" },
];

interface OSLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export function OSHeader() {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/recovery/dashboard" className="flex items-center gap-2">
              <img src={strokeLyfeLogo} alt="Stroke Recovery OS" className="w-32 h-32" />
              <span className="font-bold text-foreground hidden sm:block">Recovery OS</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={location === item.path ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Button>
                </Link>
              ))}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2" data-testid="nav-studios">
                    <LayoutGrid className="w-4 h-4" />
                    Studios
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {studios.map((studio) => (
                    <Link key={studio.id} href={studio.path}>
                      <DropdownMenuItem className="gap-2 cursor-pointer">
                        <studio.icon className={`w-4 h-4 ${studio.color}`} />
                        {studio.name}
                      </DropdownMenuItem>
                    </Link>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {!isLoading && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-3 h-3 text-primary" />
                    </div>
                    <span className="hidden sm:block text-sm">{user.firstName || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-destructive">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/recovery/login">
                <Button size="sm" data-testid="button-login">
                  Sign In
                </Button>
              </Link>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <img src={strokeLyfeLogo} alt="Stroke Recovery OS" className="w-40 h-40" />
                    <div>
                      <h2 className="font-bold">Recovery OS</h2>
                      <p className="text-xs text-muted-foreground">Stroke Recovery Platform</p>
                    </div>
                  </div>
                </div>
                <nav className="p-4 space-y-1">
                  {navItems.map((item) => (
                    <Link key={item.path} href={item.path} onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant={location === item.path ? "secondary" : "ghost"}
                        className="w-full justify-start gap-2"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.name}
                      </Button>
                    </Link>
                  ))}
                  <div className="pt-4 pb-2">
                    <p className="text-xs font-medium text-muted-foreground px-2 mb-2">STUDIOS</p>
                    {studios.map((studio) => (
                      <Link key={studio.id} href={studio.path} onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <studio.icon className={`w-4 h-4 ${studio.color}`} />
                          {studio.name}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function OSLayout({ children, showHeader = true }: OSLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {showHeader && <OSHeader />}
      {children}
    </div>
  );
}
