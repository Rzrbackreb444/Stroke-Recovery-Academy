import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routes = readFileSync("server/routes.ts", "utf8");
const storage = readFileSync("server/storage.ts", "utf8");
const community = readFileSync("client/src/pages/RecoveryCommunity.tsx", "utf8");

test("community posts define all four audience levels and keep legacy creates private", () => {
  assert.match(routes, /const postVisibility = visibility \|\| "private"/);
  assert.match(routes, /\["public", "members", "pod", "private"\]\.includes\(postVisibility\)/);
  assert.match(community, /useState<"private" \| "members" \| "pod" \| "public">\("private"\)/);
  assert.match(community, /value="private"/);
  assert.match(community, /value="members"/);
  assert.match(community, /value="pod"/);
  assert.match(community, /value="public"/);
});

test("canonical and legacy activity lists only expose posts to an allowed reader", () => {
  const canonicalList = routes.match(
    /app\.get\('\/api\/community\/posts'[\s\S]*?res\.json\(posts\.rows\);/,
  )?.[0];
  assert.ok(canonicalList, "canonical community list route should exist");
  assert.match(canonicalList, /ap\.visibility = 'public'/);
  assert.match(canonicalList, /ap\.visibility = 'members'[\s\S]*?\$3::text IS NOT NULL/);
  assert.match(canonicalList, /ap\.visibility = 'private'[\s\S]*?ap\.author_id = \$3/);
  assert.match(canonicalList, /ap\.visibility = 'pod'/);
  assert.match(canonicalList, /FROM pod_members pm/);
  assert.match(canonicalList, /pm\.pod_id = ap\.pod_id/);

  const legacyList = routes.match(
    /app\.get\('\/api\/activity'[\s\S]*?res\.json\(visible\);/,
  )?.[0];
  assert.ok(legacyList, "legacy activity list route should exist");
  assert.match(legacyList, /post\.visibility === "members"/);
  assert.match(legacyList, /post\.visibility === "private"\) return post\.authorId === viewerId/);
  assert.match(legacyList, /post\.visibility === "pod"/);
  assert.match(legacyList, /joinedPodIds\.has\(post\.podId\)/);
});

test("private posts are protected across detail, comments, reactions, and media", () => {
  const detail = routes.match(
    /app\.get\('\/api\/activity\/:id'[\s\S]*?res\.json\(\{ \.\.\.post, media, reactions, comments \}\);/,
  )?.[0];
  assert.ok(detail, "activity detail route should exist");
  assert.match(detail, /post\.visibility === "private" && post\.authorId !== viewerId/);
  assert.match(detail, /post\.visibility === "members" && !viewerId/);
  assert.match(detail, /post\.visibility === "pod"/);

  const comments = routes.match(
    /app\.get\('\/api\/community\/comments\/:id'[\s\S]*?res\.json\(comments\.rows\);/,
  )?.[0];
  assert.ok(comments, "community comments route should exist");
  assert.match(comments, /SELECT visibility, author_id, pod_id FROM activity_posts/);
  assert.match(comments, /postRow\.visibility === "private" && postRow\.author_id !== viewerId/);
  assert.match(comments, /postRow\.visibility === "pod"/);
  assert.match(comments, /FROM pod_members WHERE pod_id = \$1 AND user_id = \$2/);

  const reaction = routes.match(
    /app\.post\('\/api\/activity\/:id\/react'[\s\S]*?res\.json\(result\);/,
  )?.[0];
  assert.ok(reaction, "reaction route should exist");
  assert.match(reaction, /post\.visibility === "private" && post\.authorId !== userId/);
  assert.match(
    reaction,
    /post\.visibility === "pod" && post\.authorId !== userId[\s\S]*?storage\.isUserPodMember\(userId, post\.podId\)/,
  );

  const commentWrite = routes.match(
    /app\.post\('\/api\/activity\/:id\/comment'[\s\S]*?res\.json\(comment\);/,
  )?.[0];
  assert.ok(commentWrite, "comment write route should exist");
  assert.match(commentWrite, /post\.visibility === "private" && post\.authorId !== userId/);
  assert.match(
    commentWrite,
    /post\.visibility === "pod" && post\.authorId !== userId[\s\S]*?storage\.isUserPodMember\(userId, post\.podId\)/,
  );

  assert.match(
    storage,
    /async isUserPodMember\(userId: string, podId: number\): Promise<boolean>[\s\S]*?eq\(podMembers\.podId, podId\)[\s\S]*?eq\(podMembers\.userId, userId\)/,
  );

  const dedicatedMedia = routes.match(
    /app\.get\('\/uploads\/community\/:filename'[\s\S]*?return res\.sendFile/,
  )?.[0];
  assert.ok(dedicatedMedia, "dedicated community media route should exist");
  assert.match(dedicatedMedia, /media\.visibility === 'private' && media\.authorId !== viewerId/);
  assert.match(dedicatedMedia, /media\.visibility === 'pod'/);

  const legacyMedia = routes.match(
    /app\.use\('\/uploads', async[\s\S]*?app\.use\('\/uploads', express\.static/,
  )?.[0];
  assert.ok(legacyMedia, "legacy uploads privacy middleware should exist");
  assert.match(legacyMedia, /if \(!media\) return next\(\);/);
  assert.match(
    legacyMedia,
    /catch \{[\s\S]*?return res\.status\(404\)\.end\(\);/,
    "activity-media lookup failures must not fall through to public static uploads",
  );
});
