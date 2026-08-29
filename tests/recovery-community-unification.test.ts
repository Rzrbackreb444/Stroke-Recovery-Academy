import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync("client/src/App.tsx", "utf8");
const header = readFileSync("client/src/components/RecoveryHeader.tsx", "utf8");
const community = readFileSync("client/src/pages/RecoveryCommunity.tsx", "utf8");
const serverRoutes = readFileSync("server/routes.ts", "utf8");
const resources = readFileSync("client/src/pages/RecoveryResources.tsx", "utf8");
const journal = readFileSync("client/src/pages/RecoveryJournal.tsx", "utf8");
const videoSessions = readFileSync("client/src/pages/VideoSessions.tsx", "utf8");
const storage = readFileSync("server/storage.ts", "utf8");

test("legacy survivor social routes redirect to the canonical community wall", () => {
  assert.match(app, /<Route path="\/recovery\/activity">[\s\S]*?<RecoveryRouteRedirect to="\/recovery\/community" \/>/);
  assert.match(app, /<Route path="\/recovery\/social">[\s\S]*?<RecoveryRouteRedirect to="\/recovery\/community" \/>/);
  assert.match(app, /<Route path="\/social-network">[\s\S]*?<RecoveryRouteRedirect to="\/recovery\/community" \/>/);
  assert.match(app, /<Route path="\/activity">[\s\S]*?<RecoveryRouteRedirect to="\/recovery\/community" \/>/);
});

test("primary recovery navigation exposes community and a distinct live-video destination", () => {
  assert.match(header, /href: "\/recovery\/community", label: "Community"/);
  assert.match(header, /href: "\/recovery\/video", label: "Live Video"/);
  assert.match(header, /href: "\/recovery\/video", label: "Live Video Sessions"/);
  assert.match(header, /data-testid={`mobile-nav-\$\{link\.label/);
  assert.match(app, /<Route path="\/recovery\/video">[\s\S]*?<ProtectedRoute loginReturnPath="\/recovery\/video">/);
});

test("wall composer checks upload responses and exposes upload/post retries", () => {
  assert.match(community, /file\.type\.startsWith\("image\/"\)/);
  assert.match(community, /file\.type\.startsWith\("video\/"\)/);
  assert.match(community, /if \(!res\.ok \|\| !data\.url \|\| !data\.mediaType\)/);
  assert.match(community, /data-testid="button-retry-upload"/);
  assert.match(community, /data-testid="button-retry-post"/);
  assert.match(community, /media: media\.map\(\(\{ url, mediaType \}\) => \(\{ mediaUrl: url, mediaType \}\)\)/);
  assert.match(community, /disabled=\{postMutation\.isPending \|\| uploading \|\| failedFiles\.length > 0/);
});

test("activity creation validates media and cleans up if attachment persistence fails", () => {
  assert.match(serverRoutes, /You can attach up to 10 media files/);
  assert.match(serverRoutes, /One of the attached media files is invalid/);
  assert.match(serverRoutes, /if \(!textContent && submittedMedia\.length === 0\)/);
  assert.match(serverRoutes, /await storage\.deleteActivityPost\(post\.id\)/);
});

test("community upload URLs are gated by the owning post visibility", () => {
  assert.match(serverRoutes, /app\.get\('\/uploads\/community\/:filename'/);
  assert.match(serverRoutes, /media\.visibility === 'private' && media\.authorId !== viewerId/);
  assert.match(serverRoutes, /media\.visibility === 'members' && !viewerId/);
  assert.match(serverRoutes, /url: `\/uploads\/community\/\$\{req\.file\.filename\}`/);
  assert.match(serverRoutes, /app\.use\('\/uploads', async \(req: any, res, next\)/);
});

test("recovery surfaces provide intentional handoffs into the community wall", () => {
  assert.match(resources, /href="\/recovery\/community" data-testid="link-resources-community"/);
  assert.match(resources, /href="\/recovery\/video" data-testid="link-resources-live-video"/);
  assert.match(journal, /href="\/recovery\/community"/);
  assert.match(community, /href="\/recovery\/video"/);
});

test("canonical wall retains survivor interaction and moderation controls", () => {
  assert.match(community, /button-react-/);
  assert.match(community, /button-toggle-comments-/);
  assert.match(community, /Report/);
  assert.match(community, /Block member/);
  assert.match(community, /ProfileEditModal/);
});

test("live sessions keep UI status values and protect host-only ending", () => {
  assert.match(storage, /\.set\(\{ status: 'live', startedAt: new Date\(\) \}\)/);
  assert.match(storage, /\.set\(\{ status: 'ended', endedAt: new Date\(\) \}\)/);
  assert.match(serverRoutes, /Only the session host can end this session/);
  assert.match(serverRoutes, /This session is no longer available/);
  assert.match(videoSessions, /data-testid="text-video-sessions-title"/);
  assert.match(videoSessions, /copyMeetingLink/);
  assert.match(videoSessions, /View Recording/);
});