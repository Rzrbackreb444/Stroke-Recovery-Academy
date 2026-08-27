import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToString } from "react-dom/server";
import * as HelmetAsync from "react-helmet-async";
import { build } from "esbuild";
import { renderSsrPage } from "../server/seo/ssrShell";
import { ROUTES } from "../shared/seo/routeRegistry";
import {
  generatePageSchema,
  generateRouteSchemas,
} from "../shared/seo/schemaGenerator";

const HelmetProvider =
  (HelmetAsync as any).HelmetProvider ??
  (HelmetAsync as any).default?.HelmetProvider;
let recoverySeoModule: any;
let recoverySeoComponent: any;
let bundleDirectory: string | undefined;

before(async () => {
  bundleDirectory = await mkdtemp(join(resolve("tests"), ".recovery-seo-schema-"));
  const bundlePath = join(bundleDirectory, "RecoverySEO.cjs");
  await build({
    entryPoints: [resolve("client/src/components/RecoverySEO.tsx")],
    bundle: true,
    format: "cjs",
    platform: "node",
    outfile: bundlePath,
    external: ["react", "react-dom", "react-helmet-async"],
  });
  const loadedModule = await import(pathToFileURL(bundlePath).href);
  recoverySeoModule = loadedModule;
  recoverySeoComponent =
    typeof loadedModule.default === "function"
      ? loadedModule.default
      : loadedModule.default?.default;
});

after(async () => {
  if (bundleDirectory) {
    await rm(bundleDirectory, { recursive: true, force: true });
  }
});

const FORBIDDEN_MEDICAL_TYPES = [
  "MedicalOrganization",
  "MedicalWebPage",
  "MedicalAudience",
  "MedicalCondition",
] as const;

function schemaTypes(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(schemaTypes);
  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  const ownTypes = record["@type"];
  const types =
    typeof ownTypes === "string"
      ? [ownTypes]
      : Array.isArray(ownTypes)
        ? ownTypes.filter((type): type is string => typeof type === "string")
        : [];

  return [
    ...types,
    ...Object.values(record).flatMap(schemaTypes),
  ];
}

function assertNoForbiddenMedicalTypes(label: string, value: unknown): void {
  const emittedTypes = schemaTypes(value);
  for (const forbiddenType of FORBIDDEN_MEDICAL_TYPES) {
    assert.ok(
      !emittedTypes.includes(forbiddenType),
      `${label} emitted forbidden schema type ${forbiddenType}; emitted types: ${emittedTypes.join(", ")}`,
    );
  }
}

function parseJsonLdScripts(html: string): unknown[] {
  return [...html.matchAll(
    /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  )].map((match) => JSON.parse(match[1]));
}

function renderReactRecoverySeo(props: Record<string, unknown>): unknown[] {
  const helmetContext: {
    helmet?: { script: { toString(): string } };
  } = {};

  renderToString(
    React.createElement(
      HelmetProvider,
      { context: helmetContext },
      React.createElement(recoverySeoComponent, props),
    ),
  );

  assert.ok(helmetContext.helmet, "RecoverySEO should populate Helmet context");
  return parseJsonLdScripts(helmetContext.helmet.script.toString());
}

const baseSsrConfig = {
  url: "/recovery/test-schema",
  title: "Recovery schema test",
  description: "Survivor-led recovery education and peer support.",
  h1: "Recovery schema test",
  hero: { subhead: "A survivor-led recovery education page." },
  sections: [
    {
      h2: "Peer support",
      paragraphs: ["Practice, reflection, and support from lived experience."],
    },
  ],
  faqs: [],
  related: [],
} as const;

test("React RecoverySEO emits ordinary page, organization, course, and peer-support schemas", () => {
  const {
    SASQUATCH_METHOD_SCHEMA,
    createRecoveryCourseSchema,
  } = recoverySeoModule;
  const pageSchemas = renderReactRecoverySeo({
    title: "Recovery education",
    description: "Survivor-led recovery education and peer support.",
    canonical: "/recovery",
    pageType: "medical",
    additionalSchema: [
      SASQUATCH_METHOD_SCHEMA,
      createRecoveryCourseSchema({
        name: "Recovery Foundations",
        description: "A peer-supported recovery education course.",
        url: "/recovery/course",
        numberOfLessons: 3,
        durationHours: 1,
        level: "Beginner",
      }),
    ],
  });

  assertNoForbiddenMedicalTypes("React RecoverySEO", pageSchemas);
  const emittedTypes = new Set(schemaTypes(pageSchemas));
  assert.ok(emittedTypes.has("WebPage"));
  assert.ok(emittedTypes.has("EducationalOrganization"));
  assert.ok(emittedTypes.has("Organization"));
  assert.ok(emittedTypes.has("Course"));
  assert.ok(emittedTypes.has("Audience"));
  assert.ok(
    pageSchemas.some((schema) =>
      JSON.stringify(schema).includes("peer support"),
    ),
    "React RecoverySEO should retain peer-support positioning",
  );
});

test("React recovery schema helpers never emit medical classifications", () => {
  const {
    NICK_KREMERS_SCHEMA,
    SASQUATCH_METHOD_SCHEMA,
    STROKE_CONDITION_SCHEMA,
    STROKE_RECOVERY_ORG_SCHEMA,
    createLocalBusinessSchema,
    createRecoveryArticleSchema,
    createRecoveryCourseSchema,
    createRecoveryExerciseSchema,
    createRecoveryHowToSchema,
    createRecoveryProductSchema,
  } = recoverySeoModule;
  const schemas = [
    NICK_KREMERS_SCHEMA,
    STROKE_RECOVERY_ORG_SCHEMA,
    STROKE_CONDITION_SCHEMA,
    SASQUATCH_METHOD_SCHEMA,
    createRecoveryCourseSchema({
      name: "Recovery Foundations",
      description: "A peer-supported recovery education course.",
      url: "/recovery/course",
      numberOfLessons: 3,
      durationHours: 1,
      level: "Beginner",
    }),
    createRecoveryProductSchema({
      name: "Recovery workbook",
      description: "A lived-experience workbook.",
      url: "/recovery/store/workbook",
      category: "Recovery education",
    }),
    createRecoveryExerciseSchema({
      name: "Daily practice",
      description: "A survivor-led practice.",
      bodyLocation: "Upper body",
      difficulty: "beginner",
      duration: "PT5M",
    }),
    createRecoveryArticleSchema({
      headline: "Peer support in recovery",
      description: "A survivor-led article.",
      datePublished: "2026-01-01",
      url: "/recovery/blog/peer-support",
    }),
    createRecoveryHowToSchema({
      name: "Build a recovery routine",
      description: "A peer-supported routine.",
      steps: [{ name: "Start", text: "Choose one practice." }],
    }),
    createLocalBusinessSchema({
      name: "Recovery center directory",
      description: "A directory of recovery resources.",
    }),
  ];

  assertNoForbiddenMedicalTypes("React recovery schema helpers", schemas);
});

test("shared public recovery registry schemas stay ordinary and peer-support oriented", () => {
  const publicRecoveryRoutes = ROUTES.filter(
    (entry) =>
      entry.category === "recovery-landing" ||
      entry.category === "recovery-content",
  );
  assert.ok(publicRecoveryRoutes.length > 0);

  for (const entry of publicRecoveryRoutes) {
    const fullUrl = `https://strokerecoveryacademy.com${entry.canonical || "/recovery/example"}`;
    assert.notEqual(
      entry.schemaType,
      "MedicalWebPage",
      `${entry.pattern} must not be registered as MedicalWebPage`,
    );
    const schemas = generateRouteSchemas(entry, fullUrl);
    assertNoForbiddenMedicalTypes(`shared route ${entry.pattern}`, schemas);
    assert.ok(
      !FORBIDDEN_MEDICAL_TYPES.includes(entry.schemaType as (typeof FORBIDDEN_MEDICAL_TYPES)[number]),
      `${entry.pattern} should use an ordinary public recovery page schema`,
    );
  }

  const articleEntry = publicRecoveryRoutes.find(
    (entry) => entry.schemaType === "Article",
  );
  assert.ok(articleEntry, "expected a public recovery Article route");
  assert.equal(
    (generatePageSchema(
      articleEntry,
      "https://strokerecoveryacademy.com/recovery/article",
    ) as Record<string, unknown>)["@type"],
    "Article",
  );
});

test("SSR recovery metadata normalizes legacy medical input to ordinary schemas", () => {
  for (const schemaType of ["WebPage", "Article", "MedicalWebPage"] as const) {
    const html = renderSsrPage({ ...baseSsrConfig, schemaType });
    const schemas = parseJsonLdScripts(html);
    assertNoForbiddenMedicalTypes(`SSR ${schemaType}`, schemas);
    assert.ok(
      schemas.some((schema) =>
        ["WebPage", "Article"].includes(
          String((schema as Record<string, unknown>)["@type"]),
        ),
      ),
    );
  }
});