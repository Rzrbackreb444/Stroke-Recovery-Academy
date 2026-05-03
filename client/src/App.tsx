import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import InstallPrompt from "@/components/InstallPrompt";
import FeedbackButton from "@/components/FeedbackButton";
import { TooltipProvider } from "@/components/ui/tooltip";
import GlobalHeader from "@/components/GlobalHeader";
import RecoveryHeader from "@/components/RecoveryHeader";

// Creator Platform Pages

// ─── Eager pages (cold-load critical) ───────────────────────────────────
// HomeLanding's three branches must render synchronously at "/" so we never
// flash a Suspense fallback on the very first paint. NotFound is the always-
// mounted catch-all so it must also be eager.
import CreatorLanding from "@/pages/CreatorLanding";
import StrokeRecoveryLanding from "@/pages/Landing";
import StrokeLyfeOrg from "@/pages/StrokeLyfeOrg";
import NotFound from "@/pages/not-found";

// ─── App-shell components (small, used outside the lazy <Switch>) ──────
import OnboardingFlow, { useOnboardingComplete } from "@/components/OnboardingFlow";
import SurvivorIntakeBanner from "@/components/SurvivorIntakeBanner";
import AccessibilityProvider from "@/components/AccessibilityProvider";
import AdminRoute from "@/components/AdminRoute";
import ProtectedRoute from "@/components/ProtectedRoute";

// ─── Lazy pages (everything else — code-split per route) ───────────────
// Each line below produces its own JS chunk. The bundle for cold load
// drops from ~5MB → main + ~150 small route-level chunks fetched on
// demand. Wrapped in <Suspense> below.
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Community = lazy(() => import("@/pages/Community"));
const Thread = lazy(() => import("@/pages/Thread"));
const Groups = lazy(() => import("@/pages/Groups"));
const GroupDetail = lazy(() => import("@/pages/GroupDetail"));
const About = lazy(() => import("@/pages/About"));
const AboutUs = lazy(() => import("@/pages/AboutUs"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const Publishing = lazy(() => import("@/pages/Publishing"));
const Stories = lazy(() => import("@/pages/Stories"));
const StoryView = lazy(() => import("@/pages/StoryView"));
const StoryEditor = lazy(() => import("@/pages/StoryEditor"));
const MyStories = lazy(() => import("@/pages/MyStories"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const PowerPointsInbox = lazy(() => import("@/pages/PowerPointsInbox"));
const TherapistApply = lazy(() => import("@/pages/TherapistApply"));
const TherapistAdmin = lazy(() => import("@/pages/TherapistAdmin"));
const SurvivorProfilePage = lazy(() => import("@/pages/SurvivorProfile"));
const SurvivorIntake = lazy(() => import("@/pages/SurvivorIntake"));
const SurvivorProfileSettings = lazy(() => import("@/pages/SurvivorProfileSettings"));
const AvatarSettings = lazy(() => import("@/pages/AvatarSettings"));
const MusicStudio = lazy(() => import("@/pages/MusicStudio"));
const MusicSandbox = lazy(() => import("@/pages/MusicSandbox"));
const MusicProductionStudio = lazy(() => import("@/pages/MusicProductionStudio"));
const BookStudioV3 = lazy(() => import("@/pages/BookStudioV3"));
const VideoStudio = lazy(() => import("@/pages/VideoStudio"));
const CourseStudio = lazy(() => import("@/pages/CourseStudio"));
const ImageStudio = lazy(() => import("@/pages/ImageStudio"));
const BookMarketplace = lazy(() => import("@/pages/BookMarketplace"));
const SellBooks = lazy(() => import("@/pages/SellBooks"));
const OrderConfirmation = lazy(() => import("@/pages/OrderConfirmation"));
const MyOrders = lazy(() => import("@/pages/MyOrders"));
const AuthorDashboard = lazy(() => import("@/pages/AuthorDashboard"));
const CreatorHub = lazy(() => import("@/pages/CreatorHub"));
const MovieStudio = lazy(() => import("@/pages/MovieStudio"));
const VoiceLibrary = lazy(() => import("@/pages/VoiceLibrary"));
const AudiobookFactory = lazy(() => import("@/pages/AudiobookFactory"));
const DJStudio = lazy(() => import("@/pages/DJStudio"));
const WorkflowDashboard = lazy(() => import("@/pages/WorkflowDashboard"));
const SasquatchGames = lazy(() => import("@/pages/SasquatchGames"));
const SEOCommandCenter = lazy(() => import("@/pages/SEOCommandCenter"));
const BookPerfectionSuite = lazy(() => import("@/pages/BookPerfectionSuite"));
const WildernessSurvival = lazy(() => import("@/pages/WildernessSurvival"));
const CreatorEarnings = lazy(() => import("@/pages/CreatorEarnings"));
const MediaStudioPage = lazy(() => import("@/pages/MediaStudioPage"));
const CreatorSettings = lazy(() => import("@/pages/CreatorSettings"));
const QuickCreate = lazy(() => import("@/pages/QuickCreate"));
const AIConsultant = lazy(() => import("@/pages/AIConsultant"));
const ListingDetail = lazy(() => import("@/pages/ListingDetail"));
const AnalyticsDashboard = lazy(() => import("@/pages/AnalyticsDashboard"));
const AffiliateDashboard = lazy(() => import("@/pages/AffiliateDashboard"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const MedicalDisclaimer = lazy(() => import("@/pages/MedicalDisclaimer"));
const RefundPolicy = lazy(() => import("@/pages/RefundPolicy"));
const AccountPrivacy = lazy(() => import("@/pages/AccountPrivacy"));
const Welcome = lazy(() => import("@/pages/Welcome"));
const ModerationDashboard = lazy(() => import("@/pages/ModerationDashboard"));
const AdminPanel = lazy(() => import("@/pages/AdminPanel"));
const PodcastStudioPage = lazy(() => import("@/pages/PodcastStudioPage"));
const AvatarStudioPage = lazy(() => import("@/pages/AvatarStudioPage"));
const TemplateMarketplacePage = lazy(() => import("@/pages/TemplateMarketplacePage"));
const DocHubPage = lazy(() => import("@/pages/DocHubPage"));
const CreatorStore = lazy(() => import("@/pages/CreatorStore"));
const Settings = lazy(() => import("@/pages/Settings"));
const MagicLinkLogin = lazy(() => import("@/pages/MagicLinkLogin"));
const MagicLinkVerify = lazy(() => import("@/pages/MagicLinkLogin").then(m => ({ default: m.MagicLinkVerify })));
const AuthorProfile = lazy(() => import("@/pages/AuthorProfile"));
const AuthorStorefront = lazy(() => import("@/pages/AuthorStorefront"));
const CreatorProductDashboard = lazy(() => import("@/pages/CreatorProductDashboard"));
const ProductionDashboard = lazy(() => import("@/pages/ProductionDashboard"));
const ScriptStudio = lazy(() => import("@/pages/ScriptStudio"));
const LifeStoryEngine = lazy(() => import("@/pages/LifeStoryEngine"));
const WhiteLabel = lazy(() => import("@/pages/white-label"));
const WebsiteStudio = lazy(() => import("@/pages/WebsiteStudio"));
const MobileStudio = lazy(() => import("@/pages/MobileStudio"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const AuthVerify = lazy(() => import("@/pages/AuthVerify"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const RecoveryDashboard = lazy(() => import("@/pages/RecoveryDashboard"));
const Scholarship = lazy(() => import("@/pages/Scholarship"));
const CaregiverSettings = lazy(() => import("@/pages/CaregiverSettings"));
const Academy = lazy(() => import("@/pages/Academy"));
const SaschLanding = lazy(() => import("@/pages/SaschLanding"));
const Builder = lazy(() => import("@/pages/Builder"));
const SurvivalGrid = lazy(() => import("@/pages/SurvivalGrid"));
const Achievements = lazy(() => import("@/pages/Achievements"));
const Reminders = lazy(() => import("@/pages/Reminders"));
const Activity = lazy(() => import("@/pages/Activity"));
const Exercises = lazy(() => import("@/pages/Exercises"));
const TherapistDashboard = lazy(() => import("@/pages/TherapistDashboard"));
const CommandCenter = lazy(() => import("@/pages/CommandCenter"));
const Wearables = lazy(() => import("@/pages/Wearables"));
const Messages = lazy(() => import("@/pages/Messages"));
const VideoSessions = lazy(() => import("@/pages/VideoSessions"));
const SocialNetwork = lazy(() => import("@/pages/SocialNetwork"));
const RecoveryCommunity = lazy(() => import("@/pages/RecoveryCommunity"));
const RecoveryCampfire = lazy(() => import("@/pages/RecoveryCampfire"));
const RecoveryPremium = lazy(() => import("@/pages/RecoveryPremium"));
const TherapistMarketplace = lazy(() => import("@/pages/TherapistMarketplace"));
const AdminPlanBuilder = lazy(() => import("@/pages/AdminPlanBuilder"));
const AdminSEODashboard = lazy(() => import("@/pages/AdminSEODashboard"));
const FeedbackAdmin = lazy(() => import("@/pages/FeedbackAdmin"));
const FeedbackInbox = lazy(() => import("@/pages/FeedbackInbox"));
const BlogDraftStudio = lazy(() => import("@/pages/BlogDraftStudio"));
const AdminVoiceLab = lazy(() => import("@/pages/AdminVoiceLab"));
const RecoveryUniversity = lazy(() => import("@/pages/RecoveryUniversity"));
const RecoveryLesson = lazy(() => import("@/pages/RecoveryLesson"));
const RecoveryQuiz = lazy(() => import("@/pages/RecoveryQuiz"));
const RecoveryCertificate = lazy(() => import("@/pages/RecoveryCertificate"));
const RecoveryForge = lazy(() => import("@/pages/RecoveryForge"));
const BrainGym = lazy(() => import("@/pages/BrainGym"));
const RecoveryStore = lazy(() => import("@/pages/RecoveryStore"));
const FlickerLog = lazy(() => import("@/pages/FlickerLog"));
const DailyRoutine = lazy(() => import("@/pages/DailyRoutine"));
const RecoveryToday = lazy(() => import("@/pages/RecoveryToday"));
const SurvivorShop = lazy(() => import("@/pages/SurvivorShop"));
const MotivationStudio = lazy(() => import("@/pages/MotivationStudio"));
const MedicalLog = lazy(() => import("@/pages/MedicalLog"));
const Compass = lazy(() => import("@/pages/Compass"));
const DraftYourLegend = lazy(() => import("@/pages/DraftYourLegend"));
const CourseBuilder = lazy(() => import("@/pages/CourseBuilder"));
const NeverZero = lazy(() => import("@/pages/NeverZero"));
const RecoveryJournal = lazy(() => import("@/pages/RecoveryJournal"));
const RecoveryResources = lazy(() => import("@/pages/RecoveryResources"));
const RecoveryCenterFinder = lazy(() => import("@/pages/RecoveryCenterFinder"));
const RecoveryBlog = lazy(() => import("@/pages/RecoveryBlog"));
const RecoveryBlogPost = lazy(() => import("@/pages/RecoveryBlogPost"));
const RecoveryOnboarding = lazy(() => import("@/pages/RecoveryOnboarding"));
const RecoveryMe = lazy(() => import("@/pages/RecoveryMe"));
const RecoveryExercises = lazy(() => import("@/pages/RecoveryExercises"));
const RecoveryExerciseDetail = lazy(() => import("@/pages/RecoveryExerciseDetail"));
const RecoverySpotlight = lazy(() => import("@/pages/RecoverySpotlight"));
const RecoveryLogin = lazy(() => import("@/pages/RecoveryLogin"));
const SasquatchCoach = lazy(() => import("@/pages/SasquatchCoach"));
const SurvivorIncome = lazy(() => import("@/pages/SurvivorIncome"));
const RecoveryProtocols = lazy(() => import("@/pages/RecoveryProtocols"));
const MyBook = lazy(() => import("@/pages/MyBook"));
const AboutNick = lazy(() => import("@/pages/AboutNick"));
const Challenge = lazy(() => import("@/pages/Challenge"));
const RecoveryAnthem = lazy(() => import("@/pages/RecoveryAnthem"));
const RecoveryAnthemBuilder = lazy(() => import("@/pages/RecoveryAnthemBuilder"));
const SasquatchRadio = lazy(() => import("@/pages/SasquatchRadio"));
const LyricsStudio = lazy(() => import("@/pages/LyricsStudio"));
const LyricsStudioShare = lazy(() => import("@/pages/LyricsStudioShare"));
const AdminRadioQueue = lazy(() => import("@/pages/AdminRadioQueue"));
const TodayAnchor = lazy(() => import("@/pages/TodayAnchor"));
const AnchorShare = lazy(() => import("@/pages/AnchorShare"));
const RecoveryPricing = lazy(() => import("@/pages/RecoveryPricing"));
const GiftSurvivor = lazy(() => import("@/pages/GiftSurvivor"));
const CoursePlayer = lazy(() => import("@/pages/CoursePlayer"));
const InstructorAnalytics = lazy(() => import("@/pages/InstructorAnalytics"));
const TherapistHoursSettings = lazy(() => import("@/pages/TherapistHoursSettings"));
const RecoveryCircles = lazy(() => import("@/pages/RecoveryCircles"));
const RecoveryBuddy = lazy(() => import("@/pages/RecoveryBuddy"));
const CourseQuiz = lazy(() => import("@/pages/CourseQuiz"));
const CourseCertificate = lazy(() => import("@/pages/CourseCertificate"));
const StudentDashboard = lazy(() => import("@/pages/StudentDashboard"));
import CreatorScribeWidget from "@/components/CreatorScribeWidget";
import { LocaleProvider } from "@/lib/hooks/useLocale";
import { usePlatform } from "@/lib/hooks/usePlatform";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useRouteMeta } from "@/hooks/useRouteMeta";

function HomeLanding() {
  const platform = usePlatform();
  
  if (platform === "nonprofit") {
    return <StrokeLyfeOrg />;
  }
  
  if (platform === "recovery") {
    return <StrokeRecoveryLanding />;
  }
  
  return <CreatorLanding />;
}


// ─── Suspense fallback for lazy routes ────────────────────────────────────
// Minimal dark panel — same neutral as the recovery OS so survivors don't see
// a white flash on slow networks.
//
// Height note: this fallback renders *inside* the Switch but BELOW the shell
// components (RecoveryHeader, SurvivorIntakeBanner, AccessibilityProvider)
// which sit above the Suspense boundary in <Router/>. Using min-h-screen here
// would push the page taller than the viewport on every route transition and
// cause a visible scroll jump. min-h-[60vh] is tall enough that the loading
// state is visibly centered, short enough that the page never grows past the
// previous route's height.
function LazyRouteFallback() {
  return (
    <div
      data-testid="lazy-route-fallback"
      className="min-h-[60vh] w-full bg-[#0D0D0D] flex items-center justify-center"
    >
      <div className="flex items-center gap-2 text-[#C9941A]/80">
        <span className="h-2 w-2 rounded-full bg-[#C9941A] animate-pulse" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}

function Router() {
  return (
    <>
    <AccessibilityProvider />
    <SurvivorIntakeBanner />
    <RecoveryHeader />
    <Suspense fallback={<LazyRouteFallback />}>
      <Switch>
      {/* ============================================ */}
      {/* HOME - Domain-based landing page */}
      {/* ============================================ */}
      <Route path="/" component={HomeLanding} />
      
      {/* ============================================ */}
      {/* CREATOR PLATFORM - Main Routes */}
      {/* ============================================ */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/community" component={Community} />
      <Route path="/community/thread/:id" component={Thread} />
      <Route path="/groups" component={Groups} />
      <Route path="/groups/:slug" component={GroupDetail} />
      <Route path="/about" component={About} />
      <Route path="/about-us" component={AboutUs} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/marketplace/books" component={BookMarketplace} />
      <Route path="/sell-books">
        <ProtectedRoute>
          <SellBooks />
        </ProtectedRoute>
      </Route>
      <Route path="/marketplace/order/:id" component={OrderConfirmation} />
      <Route path="/marketplace/purchase-success" component={OrderConfirmation} />
      <Route path="/marketplace/my-orders" component={MyOrders} />
      <Route path="/listing/:id" component={ListingDetail} />
      <Route path="/books" component={BookMarketplace} />
      <Route path="/author-dashboard">
        <ProtectedRoute>
          <AuthorDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/author-profile">
        <ProtectedRoute>
          <AuthorProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/author/:slug" component={AuthorStorefront} />
      <Route path="/publishing" component={Publishing} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth/verify" component={AuthVerify} />
      <Route path="/auth/reset-password" component={ResetPassword} />
      <Route path="/games" component={SasquatchGames} />
      <Route path="/wilderness-survival" component={WildernessSurvival} />
      <Route path="/seo-command-center" component={SEOCommandCenter} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/legal/medical-disclaimer" component={MedicalDisclaimer} />
      <Route path="/legal/refund-policy" component={RefundPolicy} />
      <Route path="/settings/privacy">
        <ProtectedRoute>
          <AccountPrivacy />
        </ProtectedRoute>
      </Route>
      <Route path="/welcome">
        <ProtectedRoute>
          <Welcome />
        </ProtectedRoute>
      </Route>
      <Route path="/white-label">
        <ProtectedRoute>
          <WhiteLabel />
        </ProtectedRoute>
      </Route>
      
      {/* Magic Link Authentication */}
      <Route path="/magic-link" component={MagicLinkLogin} />
      <Route path="/magic-link/verify/:token" component={MagicLinkVerify} />
      
      {/* Creator Studios */}
      <Route path="/music-studio" component={MusicStudio} />
      <Route path="/music-sandbox">
        <ProtectedRoute>
          <MusicSandbox />
        </ProtectedRoute>
      </Route>
      <Route path="/book-studio" component={BookStudioV3} />
      <Route path="/book-perfection-suite" component={BookPerfectionSuite} />
      <Route path="/write" component={MobileStudio} />
      <Route path="/studio" component={MobileStudio} />
      <Route path="/mobile-studio" component={MobileStudio} />
      <Route path="/creator-store" component={CreatorStore} />
      <Route path="/video-studio" component={VideoStudio} />
      <Route path="/course-studio" component={CourseStudio} />
      <Route path="/image-studio" component={ImageStudio} />
      <Route path="/website-studio" component={WebsiteStudio} />
      <Route path="/creator-hub">
        <ProtectedRoute>
          <CreatorHub />
        </ProtectedRoute>
      </Route>
      <Route path="/movie-studio">
        <ProtectedRoute>
          <MovieStudio />
        </ProtectedRoute>
      </Route>
      <Route path="/voice-library">
        <ProtectedRoute>
          <VoiceLibrary />
        </ProtectedRoute>
      </Route>
      <Route path="/audiobook-factory">
        <ProtectedRoute>
          <AudiobookFactory />
        </ProtectedRoute>
      </Route>
      <Route path="/dj-studio">
        <ProtectedRoute>
          <DJStudio />
        </ProtectedRoute>
      </Route>
      <Route path="/music-production">
        <ProtectedRoute>
          <MusicProductionStudio />
        </ProtectedRoute>
      </Route>
      <Route path="/workflows">
        <ProtectedRoute>
          <WorkflowDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/creator/earnings">
        <ProtectedRoute>
          <CreatorEarnings />
        </ProtectedRoute>
      </Route>
      <Route path="/creator-products">
        <ProtectedRoute>
          <CreatorProductDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/production-dashboard">
        <ProtectedRoute>
          <ProductionDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/script-studio">
        <ProtectedRoute>
          <ScriptStudio />
        </ProtectedRoute>
      </Route>
      <Route path="/life-story">
        <ProtectedRoute>
          <LifeStoryEngine />
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute>
          <AnalyticsDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/affiliate">
        <ProtectedRoute>
          <AffiliateDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/creator/settings">
        <ProtectedRoute>
          <CreatorSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/creator-settings">
        <ProtectedRoute>
          <CreatorSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/quick-create" component={QuickCreate} />
      <Route path="/ai-consultant">
        <ProtectedRoute>
          <AIConsultant />
        </ProtectedRoute>
      </Route>
      <Route path="/media-studio">
        <ProtectedRoute>
          <MediaStudioPage />
        </ProtectedRoute>
      </Route>
      <Route path="/stories" component={Stories} />
      <Route path="/stories/new">
        <ProtectedRoute>
          <StoryEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/stories/my">
        <ProtectedRoute>
          <MyStories />
        </ProtectedRoute>
      </Route>
      <Route path="/stories/edit/:id">
        <ProtectedRoute>
          <StoryEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/stories/:slug" component={StoryView} />
      <Route path="/podcast-studio">
        <ProtectedRoute>
          <PodcastStudioPage />
        </ProtectedRoute>
      </Route>
      <Route path="/avatar-studio">
        <ProtectedRoute>
          <AvatarStudioPage />
        </ProtectedRoute>
      </Route>
      <Route path="/templates">
        <ProtectedRoute>
          <TemplateMarketplacePage />
        </ProtectedRoute>
      </Route>
      <Route path="/doc-hub">
        <ProtectedRoute>
          <DocHubPage />
        </ProtectedRoute>
      </Route>
      <Route path="/moderation">
        <ProtectedRoute>
          <ModerationDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/moderation">
        <ProtectedRoute>
          <ModerationDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute>
          <AdminPanel />
        </ProtectedRoute>
      </Route>

      {/* ============================================ */}
      {/* STROKE RECOVERY PLATFORM - /recovery/* Routes */}
      {/* ============================================ */}
      <Route path="/power-points" component={PowerPointsInbox} />
      <Route path="/power-points/inbox" component={PowerPointsInbox} />
      <Route path="/therapists/apply" component={TherapistApply} />
      <Route path="/survivor/:slug" component={SurvivorProfilePage} />
      <Route path="/recovery/intake">
        <ProtectedRoute>
          <SurvivorIntake />
        </ProtectedRoute>
      </Route>
      <Route path="/settings/profile">
        <ProtectedRoute>
          <SurvivorProfileSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/settings/avatar">
        <ProtectedRoute>
          <AvatarSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/therapists">
        <AdminRoute><TherapistAdmin /></AdminRoute>
      </Route>
      <Route path="/recovery" component={StrokeRecoveryLanding} />
      <Route path="/recovery/dashboard">
        <ProtectedRoute>
          <RecoveryDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/academy" component={Academy} />
      <Route path="/recovery/sasch" component={SaschLanding} />
      <Route path="/recovery/builder" component={Builder} />
      <Route path="/recovery/survival-grid" component={SurvivalGrid} />
      <Route path="/recovery/achievements">
        <ProtectedRoute>
          <Achievements />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/reminders">
        <ProtectedRoute>
          <Reminders />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/activity">
        <ProtectedRoute>
          <Activity />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/exercises">
        <Exercises />
      </Route>
      <Route path="/recovery/therapist">
        <ProtectedRoute>
          <TherapistDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/command-center">
        <ProtectedRoute>
          <CommandCenter />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/wearables">
        <ProtectedRoute>
          <Wearables />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/messages">
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/video">
        <ProtectedRoute>
          <VideoSessions />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/social">
        <ProtectedRoute>
          <SocialNetwork />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/community" component={RecoveryCommunity} />
      <Route path="/recovery/campfire" component={RecoveryCampfire} />
      <Route path="/recovery/premium" component={RecoveryPremium} />
      <Route path="/recovery/therapist-marketplace">
        <ProtectedRoute>
          <TherapistMarketplace />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/admin/plans">
        <ProtectedRoute>
          <AdminPlanBuilder />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/admin/feedback">
        <ProtectedRoute>
          <FeedbackAdmin />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/admin/feedback-inbox">
        <ProtectedRoute>
          <FeedbackInbox />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/blog/draft">
        <AdminRoute><BlogDraftStudio /></AdminRoute>
      </Route>
      <Route path="/admin/seo">
        <AdminRoute><AdminSEODashboard /></AdminRoute>
      </Route>
      <Route path="/admin/voice-lab">
        <AdminRoute><AdminVoiceLab /></AdminRoute>
      </Route>
      <Route path="/recovery/university" component={RecoveryUniversity} />
      <Route path="/recovery/university/lesson/:chapter" component={RecoveryLesson} />
      <Route path="/recovery/university/quiz/:chapter" component={RecoveryQuiz} />
      <Route path="/recovery/university/certificate/:part" component={RecoveryCertificate} />
      <Route path="/recovery/forge" component={RecoveryForge} />
      <Route path="/recovery/brain-gym" component={BrainGym} />
      <Route path="/recovery/strokelyfe-org" component={StrokeLyfeOrg} />
      <Route path="/strokelyfe" component={StrokeLyfeOrg} />
      <Route path="/recovery/store" component={RecoveryStore} />
      <Route path="/store" component={RecoveryStore} />

      {/* Sasquatch Doctrine Core Tools */}
      <Route path="/recovery/flicker-log">
        <ProtectedRoute>
          <FlickerLog />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/medical-log">
        <ProtectedRoute>
          <MedicalLog />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/compass">
        <ProtectedRoute>
          <Compass />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/legend">
        <ProtectedRoute>
          <DraftYourLegend />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/course-builder">
        <ProtectedRoute>
          <CourseBuilder />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/never-zero">
        <ProtectedRoute>
          <NeverZero />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/journal">
        <ProtectedRoute>
          <RecoveryJournal />
        </ProtectedRoute>
      </Route>
      <Route path="/recovery/resources" component={RecoveryResources} />
      <Route path="/recovery/center-finder" component={RecoveryCenterFinder} />
      <Route path="/recovery/login" component={RecoveryLogin} />
      <Route path="/recovery/onboarding" component={RecoveryOnboarding} />
      <Route path="/recovery/me" component={RecoveryMe} />
      <Route path="/recovery/routine" component={DailyRoutine} />
      <Route path="/recovery/today" component={RecoveryToday} />
      <Route path="/recovery/shop" component={SurvivorShop} />
      <Route path="/recovery/motivation" component={MotivationStudio} />
      <Route path="/recovery/anchor/today" component={TodayAnchor} />
      <Route path="/anchor/s/:shareId" component={AnchorShare} />
      <Route path="/recovery/exercises" component={RecoveryExercises} />
      <Route path="/recovery/exercises/:slug" component={RecoveryExerciseDetail} />
      <Route path="/recovery/blog" component={RecoveryBlog} />
      <Route path="/recovery/blog/:slug" component={RecoveryBlogPost} />
      <Route path="/recovery/spotlight" component={RecoverySpotlight} />
      <Route path="/recovery/spotlight/:slug" component={RecoverySpotlight} />
      <Route path="/recovery/protocols" component={RecoveryProtocols} />
      <Route path="/recovery/sasquatch-coach" component={SasquatchCoach} />
      <Route path="/recovery/coach" component={SasquatchCoach} />
      <Route path="/recovery/survivor-income" component={SurvivorIncome} />
      <Route path="/my-book" component={MyBook} />
      <Route path="/recovery/challenge" component={Challenge} />
      <Route path="/recovery/anthem" component={RecoveryAnthem} />
      <Route path="/recovery/anthem/build" component={RecoveryAnthemBuilder} />
      <Route path="/recovery/radio" component={SasquatchRadio} />
      <Route path="/recovery/lyrics" component={LyricsStudio} />
      <Route path="/lyrics/s/:shareId" component={LyricsStudioShare} />
      <Route path="/admin/radio" component={AdminRadioQueue} />
      <Route path="/recovery/pricing" component={RecoveryPricing} />
      <Route path="/recovery/about-nick" component={AboutNick} />
      <Route path="/recovery/gift" component={GiftSurvivor} />
      
      {/* Course Learning Pages */}
      <Route path="/course/:courseId" component={CoursePlayer} />
      <Route path="/instructor/analytics" component={InstructorAnalytics} />
      <Route path="/settings/therapist-hours" component={TherapistHoursSettings} />
      <Route path="/recovery/circles" component={RecoveryCircles} />
      <Route path="/recovery/buddy" component={RecoveryBuddy} />
      <Route path="/recovery/scholarship" component={Scholarship} />
      <Route path="/settings/caregivers" component={CaregiverSettings} />
      <Route path="/settings/caregivers/accept/:token" component={CaregiverSettings} />
      <Route path="/course/:courseId/quiz/:quizId" component={CourseQuiz} />
      <Route path="/certificate/:courseId" component={CourseCertificate} />
      <Route path="/my-learning">
        <ProtectedRoute>
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/courses" component={StudentDashboard} />

      <Route component={NotFound} />
      </Switch>
    </Suspense>
    </>
  );
}

function App() {
  const { isComplete, markComplete } = useOnboardingComplete();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useAnalytics();
  useRouteMeta();

  useEffect(() => {
    if (isComplete === false) {
      setShowOnboarding(true);
    }
  }, [isComplete]);

  const handleOnboardingComplete = () => {
    markComplete();
    setShowOnboarding(false);
  };

  if (isComplete === null) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <TooltipProvider>
          <Toaster />
          <InstallPrompt />
          <FeedbackButton />
          {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}
          {!showOnboarding && (
            <>
              <Router />
              <CreatorScribeWidget />
            </>
          )}
        </TooltipProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

export default App;
