import { GoogleGenAI } from "@google/genai";

// This is using Replit's AI Integrations service, which provides Gemini-compatible API access
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const SASQUATCH_QUOTES = [
  "Your recovery is possible. Your story matters. Your future is unwritten.",
  "The only question is: Are you ready to begin?",
  "When experts give you limitations, respond with curiosity about what might be possible.",
  "Extraordinary comebacks are built from tiny, consistent improvements.",
  "Never is just another word for 'I don't know how yet.'",
  "Rock bottom isn't a curse - it's your best foundation.",
  "Every person has moments when life hits the reset button. These aren't endings - they're beginnings disguised as disasters.",
  "Your brain has incredible healing power through neuroplasticity.",
  "Think-Twitch-Move: The Core Progression of recovery.",
  "Small victories build big comebacks.",
  "A body in motion stays in motion.",
  "Take whatever the stroke gives you, learn from therapists, experiment, and apply to your own recovery.",
  "The human spirit, when it refuses to accept limitations, can accomplish things that seem absolutely impossible.",
  "You're standing at the starting line of the most extraordinary comeback of your life.",
  "Celebrate small victories - understanding that extraordinary comebacks are built from tiny improvements.",
  "From 0% function to 90% recovery - proof that your greatest comeback starts with your greatest setback.",
  "This isn't therapy. It's a system. A blueprint manual for rebuilding everything from the ground up.",
  "Recovery by design, not by chance.",
  "Rebuild your body, brain, and belief system - one rep at a time.",
  "When you graduate from Recovery University, you become a living diploma.",
];

const SYSTEM_PROMPT = `You are the Stroked Out Sasquatch - a professional AI recovery coach for stroke survivors. You were created by Nick Kremers, a stroke survivor who went from 0% function to 90% recovery after a massive hemorrhagic stroke in 2018.

Your communication style:
- Professional, warm, and deeply knowledgeable about stroke recovery
- Direct and clear, with genuine compassion and understanding
- Speak as a fellow survivor who has walked the recovery path
- Reference the "Recovery University" concept when appropriate - survivors are students earning their Ph.D. in Proving the Impossible Possible
- Support accountability in exercises and therapy with encouragement
- Recognize and celebrate progress, no matter how small

Core recovery principles:
1. Neuroplasticity - the brain can rewire itself with consistent, intentional practice
2. The three integrated Sasquatch systems:
   - S.A.S.C.H. (daily formula): Seize, Absorb, Swing, Combine, Hammer — the 5-step daily operating system
   - S.O.S. (daily reset): Survive, Organize, Strive — the 3-step reset for hard days
   - C.O.M.P.A.S.S. (advanced navigation): Control, Own, Mutate, Patience, Anger, Small Wins, Stack — the 7-pillar long-game framework
3. Think-Twitch-Move progression - start with mental imagery, then small muscle activations, then full movements
4. Never Zero - 1 rep saves your streak; small daily efforts create profound change over time
5. Small victories compound into extraordinary recoveries

For manuscript reviews:
- Provide structured, professional feedback with specific sections
- Be encouraging but honest about what's working and what needs improvement
- Focus on helping them tell their story effectively
- Ask thoughtful questions to understand their goals and audience
- Give actionable recommendations they can implement

When responding:
- Use clear, professional language
- Keep responses appropriately sized - concise for simple questions, thorough for complex topics
- Include relevant recovery wisdom when appropriate
- Ask about their exercises, therapy, and progress
- Reference specific recovery techniques: mirror therapy, weight bearing, constraint-induced movement therapy, repetitive task practice
- End with encouragement or a clear next step

Never provide medical advice. Always encourage working with their healthcare team. You're a recovery coach and mentor, not a medical professional.`;

const CREATOR_SYSTEM_PROMPT = `You are the Stroke Recovery Academy Creative Partner - a professional AI assistant for content creators. You help writers, musicians, course builders, and digital creators produce high-quality content.

Your communication style:
- Professional, warm, and supportive
- Clear and direct without being abrupt
- Knowledgeable and practical
- Focused on actionable guidance

Key capabilities:
1. Book writing - Generate chapters, outlines, character profiles, dialogue, and plot structures
2. Music composition - Write lyrics, suggest chord progressions, create song structures
3. Course creation - Design curricula, write lesson content, create quizzes and assessments
4. Video content - Write scripts, develop storyboards, create content outlines
5. Image creation - Generate detailed prompts, suggest compositions, describe visual concepts

When responding:
- Provide specific, actionable content they can use immediately
- When asked to generate content, produce complete, polished drafts
- Offer brief explanations of your approach when helpful
- Ask clarifying questions only when essential information is missing
- Keep conversational responses concise; make generated content thorough

Content generation guidelines:
- Match the user's requested tone and style
- Produce professional-quality drafts ready for review
- Include appropriate structure (headings, sections, formatting)
- Flag any assumptions you've made

You can generate content directly into their project. When they ask for chapters, outlines, or other content, provide complete, usable drafts.`;

export async function generateCoachResponse(
  userMessage: string,
  conversationHistory: { role: string; content: string }[] = [],
  context: string = "recovery",
  userContext?: {
    name?: string;
    exerciseCount?: number;
    streak?: number;
    lastExercises?: string[];
    milestones?: string[];
    streakBand?: string;
    todayReps?: string[];
    todayVerdict?: string | null;
    tomorrowSuggestion?: string | null;
    hasLoggedToday?: boolean;
    morningBrief?: string | null;
    morningFocusItems?: string[] | null;
  }
): Promise<{ response: string; quote?: string }> {
  try {
    const randomQuote = SASQUATCH_QUOTES[Math.floor(Math.random() * SASQUATCH_QUOTES.length)];
    
    let systemPrompt: string;
    let ackMessage: string;
    
    if (context === "creative assistant") {
      systemPrompt = CREATOR_SYSTEM_PROMPT;
      ackMessage = "I understand. I'm your Stroke Recovery Academy Creative Partner, here to help you create professional content. What would you like to work on?";
    } else if (context.length > 100) {
      // If context is a long string, use it as the full system prompt (e.g., SASQUATCH_COACH_PROMPT)
      systemPrompt = context;
      // Add user context if available — Sasquatch references the actual day
      // (today's reps, the audit verdict you already gave them, the streak
      // number out loud) instead of generic "keep pushing" lines.
      if (userContext) {
        const contextLines: string[] = [];
        if (userContext.name) contextLines.push(`The user's name (or forged persona name) is ${userContext.name}. Use it sparingly when it lands — never on every reply.`);
        if (userContext.streak && userContext.streak > 0) {
          const tier = userContext.streakBand ? ` (${userContext.streakBand} tier)` : '';
          contextLines.push(`They're on Day ${userContext.streak} of their Never Zero streak${tier}. Name the number out loud when it fits.`);
        } else {
          contextLines.push(`They have NOT logged a Never Zero rep today. Don't shame — invite. Make logging one rep the easy next move.`);
        }
        if (userContext.hasLoggedToday && userContext.todayReps?.length) {
          contextLines.push(`Today's reps already logged (reference by name when relevant — proves you're paying attention): ${userContext.todayReps.map((r) => `"${r}"`).join(', ')}.`);
        }
        if (userContext.todayVerdict) {
          contextLines.push(`Your most recent audit VERDICT for them today was: "${userContext.todayVerdict}" — stay consistent with that voice; don't contradict yourself.`);
        }
        if (userContext.tomorrowSuggestion) {
          contextLines.push(`The 1-rep you suggested for tomorrow was: "${userContext.tomorrowSuggestion}" — if they ask "what should I do?", that's the answer unless context says otherwise.`);
        }
        if (userContext.exerciseCount) contextLines.push(`Lifetime exercises completed: ${userContext.exerciseCount}.`);
        if (userContext.lastExercises?.length) contextLines.push(`Recent exercises: ${userContext.lastExercises.slice(0, 3).join(', ')}.`);
        if (userContext.milestones?.length) contextLines.push(`Recent milestones: ${userContext.milestones.slice(0, 2).join(', ')}.`);
        if (userContext.morningBrief) {
          contextLines.push(`This morning's Daily Loop brief you already sent them: "${userContext.morningBrief}" — if they reference it or ask about their morning, you're consistent with it. Don't re-read it aloud; just know it was sent.`);
        }
        if (userContext.morningFocusItems?.length) {
          contextLines.push(`Today's focus items from the daily loop: ${userContext.morningFocusItems.map((f) => `"${f}"`).join(', ')} — if they ask "what should I focus on?", reference these.`);
        }
        if (contextLines.length > 0) {
          systemPrompt += `\n\nUSER CONTEXT (use this to make every reply feel personal — never echo it verbatim, weave it):\n${contextLines.join('\n')}`;
        }
      }
      ackMessage = "Hey warrior! I'm here for you. What's on your mind?";
    } else {
      systemPrompt = SYSTEM_PROMPT;
      ackMessage = "I understand. I'm your recovery coach, here to support your journey. Let's make progress together.";
    }
    
    const contents = [
      { role: "user" as const, parts: [{ text: systemPrompt }] },
      { role: "model" as const, parts: [{ text: ackMessage }] },
      ...conversationHistory.map(msg => ({
        role: msg.role === "user" ? "user" as const : "model" as const,
        parts: [{ text: msg.content }]
      })),
      { role: "user" as const, parts: [{ text: userMessage }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });

    return {
      response: response.text || "Keep pushing, survivor! Your comeback story is being written right now.",
      quote: randomQuote,
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    const fallbackQuote = SASQUATCH_QUOTES[Math.floor(Math.random() * SASQUATCH_QUOTES.length)];
    return {
      response: `I'm having a technical moment, but remember: "${fallbackQuote}" Keep pushing forward!`,
      quote: fallbackQuote,
    };
  }
}

export function getRandomQuote(): string {
  return SASQUATCH_QUOTES[Math.floor(Math.random() * SASQUATCH_QUOTES.length)];
}

export type ContentType = 
  | 'chapter' 
  | 'outline' 
  | 'lesson' 
  | 'quiz' 
  | 'lyrics' 
  | 'script' 
  | 'blog' 
  | 'social'
  | 'curriculum';

export interface GenerationRequest {
  type: ContentType;
  prompt: string;
  context?: {
    title?: string;
    genre?: string;
    tone?: string;
    audience?: string;
    style?: string;
    existingContent?: string;
    wordCount?: number;
  };
}

export interface GeneratedContent {
  content: string;
  title?: string;
  type: ContentType;
  wordCount: number;
  metadata?: Record<string, any>;
}

const CONTENT_GENERATION_PROMPTS: Record<ContentType, string> = {
  chapter: `Generate a complete book chapter based on the following request. 
Write in a professional, engaging style with proper paragraph structure.
Include vivid descriptions, natural dialogue where appropriate, and smooth transitions.
Format with the chapter title as a heading.`,

  outline: `Create a detailed book outline based on the following request.
Include chapter titles, brief summaries of each chapter, and key plot points or themes.
Structure it clearly with numbered chapters and bullet points for details.`,

  lesson: `Create a comprehensive course lesson based on the following request.
Include clear learning objectives, main content sections, key takeaways, and practical examples.
Structure with proper headings and subheadings.`,

  quiz: `Generate a quiz or assessment based on the following topic.
Include a mix of question types (multiple choice, true/false, short answer).
Provide answer keys with brief explanations.
Format clearly with numbered questions.`,

  lyrics: `Write song lyrics based on the following request.
Include verse structure, chorus, and bridge where appropriate.
Format with clear section labels (Verse 1, Chorus, etc.).
Consider rhythm and rhyme scheme.`,

  script: `Write a video script based on the following request.
Include scene descriptions, dialogue, and visual/audio cues.
Format in standard script format with clear speaker labels.
Include timing estimates where relevant.`,

  blog: `Write a blog post based on the following request.
Include an engaging introduction, clear sections with headings, and a compelling conclusion.
Optimize for readability with short paragraphs and bullet points where appropriate.`,

  social: `Create social media content based on the following request.
Optimize for engagement with compelling hooks and calls to action.
Include appropriate hashtag suggestions where relevant.`,

  curriculum: `Design a complete course curriculum based on the following request.
Include module titles, lesson breakdowns, learning objectives, and suggested assessments.
Structure as a comprehensive learning path.`
};

export async function generateStructuredContent(request: GenerationRequest): Promise<GeneratedContent> {
  try {
    const basePrompt = CONTENT_GENERATION_PROMPTS[request.type];
    
    let contextString = '';
    if (request.context) {
      const ctx = request.context;
      if (ctx.title) contextString += `Title/Topic: ${ctx.title}\n`;
      if (ctx.genre) contextString += `Genre: ${ctx.genre}\n`;
      if (ctx.tone) contextString += `Tone: ${ctx.tone}\n`;
      if (ctx.audience) contextString += `Target Audience: ${ctx.audience}\n`;
      if (ctx.style) contextString += `Style: ${ctx.style}\n`;
      if (ctx.wordCount) contextString += `Target Word Count: ${ctx.wordCount}\n`;
      if (ctx.existingContent) contextString += `\nExisting Content for Reference:\n${ctx.existingContent}\n`;
    }

    const fullPrompt = `${basePrompt}

${contextString}

User Request: ${request.prompt}

Generate professional, publication-ready content. Do not include meta-commentary about the content - just produce the content itself.`;

    const contents = [
      { role: "user" as const, parts: [{ text: CREATOR_SYSTEM_PROMPT }] },
      { role: "model" as const, parts: [{ text: "I understand. I'm ready to generate professional content for you." }] },
      { role: "user" as const, parts: [{ text: fullPrompt }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });

    const generatedText = response.text || '';
    const wordCount = generatedText.split(/\s+/).filter(word => word.length > 0).length;

    return {
      content: generatedText,
      type: request.type,
      wordCount,
      title: request.context?.title,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'gemini-2.5-flash',
        requestType: request.type
      }
    };
  } catch (error) {
    console.error("Content generation error:", error);
    throw new Error("Failed to generate content. Please try again.");
  }
}

export { SASQUATCH_QUOTES };
