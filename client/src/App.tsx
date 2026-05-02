import { useState, useEffect } from "react";
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
import CreatorLanding from "@/pages/CreatorLanding";
import Dashboard from "@/pages/Dashboard";
import OnboardingFlow, { useOnboardingComplete } from "@/components/OnboardingFlow";
import Community from "@/pages/Community";
import Thread from "@/pages/Thread";
import Groups from "@/pages/Groups";
import GroupDetail from "@/pages/GroupDetail";
import About from "@/pages/About";
import AboutUs from "@/pages/AboutUs";
import Marketplace from "@/pages/Marketplace";
import Publishing from "@/pages/Publishing";
import Stories from "@/pages/Stories";
import StoryView from "@/pages/StoryView";
import StoryEditor from "@/pages/StoryEditor";
import MyStories from "@/pages/MyStories";
import Pricing from "@/pages/Pricing";
import PowerPointsInbox from "@/pages/PowerPointsInbox";
import TherapistApply from "@/pages/TherapistApply";
import TherapistAdmin from "@/pages/TherapistAdmin";
import SurvivorProfilePage from "@/pages/SurvivorProfile";
import SurvivorIntake from "@/pages/SurvivorIntake";
import SurvivorProfileSettings from "@/pages/SurvivorProfileSettings";
import SurvivorIntakeBanner from "@/components/SurvivorIntakeBanner";
import AccessibilityProvider from "@/components/AccessibilityProvider";
import AvatarSettings from "@/pages/AvatarSettings";
import AdminRoute from "@/components/AdminRoute";
import MusicStudio from "@/pages/MusicStudio";
import MusicSandbox from "@/pages/MusicSandbox";
import MusicProductionStudio from "@/pages/MusicProductionStudio";
import BookStudioV3 from "@/pages/BookStudioV3";
import VideoStudio from "@/pages/VideoStudio";
import CourseStudio from "@/pages/CourseStudio";
import ImageStudio from "@/pages/ImageStudio";
import BookMarketplace from "@/pages/BookMarketplace";
import SellBooks from "@/pages/SellBooks";
import OrderConfirmation from "@/pages/OrderConfirmation";
import MyOrders from "@/pages/MyOrders";
import AuthorDashboard from "@/pages/AuthorDashboard";
import CreatorHub from "@/pages/CreatorHub";
import MovieStudio from "@/pages/MovieStudio";
import VoiceLibrary from "@/pages/VoiceLibrary";
import AudiobookFactory from "@/pages/AudiobookFactory";
import DJStudio from "@/pages/DJStudio";
import WorkflowDashboard from "@/pages/WorkflowDashboard";
// Brain Games hub — only cognitive-recovery games (Wilderness Survival).
// Casino-style games and SquatchQR were removed in the recovery-focused overhaul.
import SasquatchGames from "@/pages/SasquatchGames";
import SEOCommandCenter from "@/pages/SEOCommandCenter";
import BookPerfectionSuite from "@/pages/BookPerfectionSuite";
import WildernessSurvival from "@/pages/WildernessSurvival";
import CreatorEarnings from "@/pages/CreatorEarnings";
import MediaStudioPage from "@/pages/MediaStudioPage";
import CreatorSettings from "@/pages/CreatorSettings";
import QuickCreate from "@/pages/QuickCreate";
import AIConsultant from "@/pages/AIConsultant";
import ListingDetail from "@/pages/ListingDetail";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import AffiliateDashboard from "@/pages/AffiliateDashboard";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import MedicalDisclaimer from "@/pages/MedicalDisclaimer";
import RefundPolicy from "@/pages/RefundPolicy";
import AccountPrivacy from "@/pages/AccountPrivacy";
import Welcome from "@/pages/Welcome";
import ModerationDashboard from "@/pages/ModerationDashboard";
import AdminPanel from "@/pages/AdminPanel";
import PodcastStudioPage from "@/pages/PodcastStudioPage";
import AvatarStudioPage from "@/pages/AvatarStudioPage";
import TemplateMarketplacePage from "@/pages/TemplateMarketplacePage";
import DocHubPage from "@/pages/DocHubPage";
import CreatorStore from "@/pages/CreatorStore";
import Settings from "@/pages/Settings";
import MagicLinkLogin, { MagicLinkVerify } from "@/pages/MagicLinkLogin";
import AuthorProfile from "@/pages/AuthorProfile";
import AuthorStorefront from "@/pages/AuthorStorefront";
import CreatorProductDashboard from "@/pages/CreatorProductDashboard";
import ProductionDashboard from "@/pages/ProductionDashboard";
import ScriptStudio from "@/pages/ScriptStudio";
import LifeStoryEngine from "@/pages/LifeStoryEngine";
import WhiteLabel from "@/pages/white-label";
import WebsiteStudio from "@/pages/WebsiteStudio";
import MobileStudio from "@/pages/MobileStudio";
import AuthPage from "@/pages/AuthPage";
import AuthVerify from "@/pages/AuthVerify";
import ResetPassword from "@/pages/ResetPassword";
// Stroke Recovery Platform Pages (under /recovery/*)
import StrokeRecoveryLanding from "@/pages/Landing";
import RecoveryDashboard from "@/pages/RecoveryDashboard";
import Scholarship from "@/pages/Scholarship";
import CaregiverSettings from "@/pages/CaregiverSettings";
import Academy from "@/pages/Academy";
import SaschLanding from "@/pages/SaschLanding";
import Builder from "@/pages/Builder";
import SurvivalGrid from "@/pages/SurvivalGrid";
import Achievements from "@/pages/Achievements";
import Reminders from "@/pages/Reminders";
import Activity from "@/pages/Activity";
import Exercises from "@/pages/Exercises";
import TherapistDashboard from "@/pages/TherapistDashboard";
import CommandCenter from "@/pages/CommandCenter";
import Wearables from "@/pages/Wearables";
import Messages from "@/pages/Messages";
import VideoSessions from "@/pages/VideoSessions";
import SocialNetwork from "@/pages/SocialNetwork";
import RecoveryCommunity from "@/pages/RecoveryCommunity";
import TherapistMarketplace from "@/pages/TherapistMarketplace";
import AdminPlanBuilder from "@/pages/AdminPlanBuilder";
import AdminSEODashboard from "@/pages/AdminSEODashboard";
import FeedbackAdmin from "@/pages/FeedbackAdmin";
import FeedbackInbox from "@/pages/FeedbackInbox";
import BlogDraftStudio from "@/pages/BlogDraftStudio";
import RecoveryUniversity from "@/pages/RecoveryUniversity";
import RecoveryLesson from "@/pages/RecoveryLesson";
import RecoveryQuiz from "@/pages/RecoveryQuiz";
import RecoveryCertificate from "@/pages/RecoveryCertificate";
import RecoveryForge from "@/pages/RecoveryForge";
import BrainGym from "@/pages/BrainGym";
import StrokeLyfeOrg from "@/pages/StrokeLyfeOrg";
import RecoveryStore from "@/pages/RecoveryStore";

// Sasquatch Doctrine Core Pages
import FlickerLog from "@/pages/FlickerLog";
import DailyRoutine from "@/pages/DailyRoutine";
import RecoveryToday from "@/pages/RecoveryToday";
import SurvivorShop from "@/pages/SurvivorShop";
import MotivationStudio from "@/pages/MotivationStudio";
import MedicalLog from "@/pages/MedicalLog";
import Compass from "@/pages/Compass";
import DraftYourLegend from "@/pages/DraftYourLegend";
import CourseBuilder from "@/pages/CourseBuilder";
import NeverZero from "@/pages/NeverZero";
import RecoveryJournal from "@/pages/RecoveryJournal";
import RecoveryResources from "@/pages/RecoveryResources";
import RecoveryCenterFinder from "@/pages/RecoveryCenterFinder";
import RecoveryBlog from "@/pages/RecoveryBlog";
import RecoveryBlogPost from "@/pages/RecoveryBlogPost";
import RecoveryOnboarding from "@/pages/RecoveryOnboarding";
import RecoveryMe from "@/pages/RecoveryMe";
import RecoveryExercises from "@/pages/RecoveryExercises";
import RecoveryExerciseDetail from "@/pages/RecoveryExerciseDetail";
import RecoverySpotlight from "@/pages/RecoverySpotlight";
import RecoveryLogin from "@/pages/RecoveryLogin";
import SasquatchCoach from "@/pages/SasquatchCoach";
import SurvivorIncome from "@/pages/SurvivorIncome";
import RecoveryProtocols from "@/pages/RecoveryProtocols";
import MyBook from "@/pages/MyBook";
import AboutNick from "@/pages/AboutNick";
import Challenge from "@/pages/Challenge";
import RecoveryAnthem from "@/pages/RecoveryAnthem";
import TodayAnchor from "@/pages/TodayAnchor";
import AnchorShare from "@/pages/AnchorShare";
import RecoveryPricing from "@/pages/RecoveryPricing";
import GiftSurvivor from "@/pages/GiftSurvivor";
import CoursePlayer from "@/pages/CoursePlayer";
import InstructorAnalytics from "@/pages/InstructorAnalytics";
import TherapistHoursSettings from "@/pages/TherapistHoursSettings";
import RecoveryCircles from "@/pages/RecoveryCircles";
import RecoveryBuddy from "@/pages/RecoveryBuddy";
import CourseQuiz from "@/pages/CourseQuiz";
import CourseCertificate from "@/pages/CourseCertificate";
import StudentDashboard from "@/pages/StudentDashboard";

import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
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

function Router() {
  return (
    <>
    <AccessibilityProvider />
    <SurvivorIntakeBanner />
    <RecoveryHeader />
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
