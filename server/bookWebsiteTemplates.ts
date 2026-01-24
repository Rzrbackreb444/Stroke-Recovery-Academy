export interface BookWebsiteTemplate {
  id: string;
  name: string;
  category: "fiction" | "non_fiction" | "children" | "memoir" | "business" | "romance" | "thriller" | "self_help" | "cookbook" | "poetry" | "academic" | "religious";
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
  layout: {
    heroStyle: "full_cover" | "split" | "minimal" | "animated" | "video_bg" | "parallax";
    navigationStyle: "fixed" | "sticky" | "hidden" | "sidebar";
    sectionOrder: string[];
  };
  sections: TemplateSectionConfig[];
  sampleContent: {
    tagline: string;
    description: string;
    ctaText: string;
    testimonialPlaceholder: string;
  };
}

export interface TemplateSectionConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  style: Record<string, string>;
}

export const BOOK_WEBSITE_TEMPLATES: BookWebsiteTemplate[] = [
  {
    id: "childrens_whimsical",
    name: "Whimsical Wonder",
    category: "children",
    description: "Playful, colorful design perfect for children's picture books with animated elements and fun typography",
    previewImageUrl: "/templates/childrens-whimsical.jpg",
    theme: {
      primaryColor: "#FF6B6B",
      accentColor: "#4ECDC4",
      backgroundColor: "#FFF9E6",
      textColor: "#2C3E50",
      fontFamily: "Comic Neue, cursive",
      headingFont: "Fredoka One, cursive"
    },
    layout: {
      heroStyle: "animated",
      navigationStyle: "sticky",
      sectionOrder: ["hero", "book_preview", "characters", "author", "buy", "newsletter"]
    },
    sections: [
      { id: "hero", name: "Hero Banner", enabled: true, order: 0, style: { animation: "bounce", overlayOpacity: "0.1" } },
      { id: "book_preview", name: "Book Preview", enabled: true, order: 1, style: { layout: "flip_book", showPagePeeks: "true" } },
      { id: "characters", name: "Meet the Characters", enabled: true, order: 2, style: { layout: "carousel", cardStyle: "rounded" } },
      { id: "author", name: "About the Author", enabled: true, order: 3, style: { layout: "side_by_side", imageShape: "circle" } },
      { id: "buy", name: "Get Your Copy", enabled: true, order: 4, style: { buttonStyle: "playful", showConfetti: "true" } },
      { id: "newsletter", name: "Join the Adventure", enabled: true, order: 5, style: { style: "fun_form" } }
    ],
    sampleContent: {
      tagline: "A magical adventure awaits!",
      description: "Join our lovable characters on an unforgettable journey filled with wonder, friendship, and important life lessons.",
      ctaText: "Start the Adventure!",
      testimonialPlaceholder: "My kids absolutely love this book! They ask for it every night. - Happy Parent"
    }
  },
  {
    id: "childrens_educational",
    name: "Learn & Play",
    category: "children",
    description: "Educational children's book template with interactive elements, bright colors, and learning-focused design",
    previewImageUrl: "/templates/childrens-educational.jpg",
    theme: {
      primaryColor: "#5C6BC0",
      accentColor: "#FFB74D",
      backgroundColor: "#F5F5F5",
      textColor: "#37474F",
      fontFamily: "Nunito, sans-serif",
      headingFont: "Baloo 2, cursive"
    },
    layout: {
      heroStyle: "split",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "learning_objectives", "sample_pages", "author", "reviews", "buy"]
    },
    sections: [
      { id: "hero", name: "Welcome Banner", enabled: true, order: 0, style: { showAgeRange: "true", showSubjectTags: "true" } },
      { id: "learning_objectives", name: "What Kids Learn", enabled: true, order: 1, style: { layout: "icon_grid", iconStyle: "colorful" } },
      { id: "sample_pages", name: "Peek Inside", enabled: true, order: 2, style: { layout: "gallery", showZoom: "true" } },
      { id: "author", name: "Meet the Creator", enabled: true, order: 3, style: { showCredentials: "true" } },
      { id: "reviews", name: "What Parents Say", enabled: true, order: 4, style: { layout: "cards", showStars: "true" } },
      { id: "buy", name: "Get Your Copy", enabled: true, order: 5, style: { showFormats: "true", showPricing: "true" } }
    ],
    sampleContent: {
      tagline: "Learning made fun!",
      description: "An engaging educational adventure that makes learning exciting for young minds ages 4-8.",
      ctaText: "Order Now",
      testimonialPlaceholder: "Perfect for homeschooling! The illustrations are gorgeous. - Educator"
    }
  },
  {
    id: "childrens_bedtime",
    name: "Dreamy Nights",
    category: "children",
    description: "Soft, soothing design ideal for bedtime stories with gentle animations and calming color palette",
    previewImageUrl: "/templates/childrens-bedtime.jpg",
    theme: {
      primaryColor: "#7E57C2",
      accentColor: "#FFD54F",
      backgroundColor: "#1A237E",
      textColor: "#E8EAF6",
      fontFamily: "Quicksand, sans-serif",
      headingFont: "Comfortaa, cursive"
    },
    layout: {
      heroStyle: "parallax",
      navigationStyle: "hidden",
      sectionOrder: ["hero", "story_preview", "author", "testimonials", "buy", "newsletter"]
    },
    sections: [
      { id: "hero", name: "Starry Welcome", enabled: true, order: 0, style: { showStars: "true", animation: "twinkle" } },
      { id: "story_preview", name: "Sneak Peek", enabled: true, order: 1, style: { layout: "book_spread", showMoon: "true" } },
      { id: "author", name: "About the Author", enabled: true, order: 2, style: { layout: "cozy", showBedtimeRoutine: "true" } },
      { id: "testimonials", name: "Sweet Dreams Stories", enabled: true, order: 3, style: { layout: "floating", showZzz: "true" } },
      { id: "buy", name: "Bring Home Sweet Dreams", enabled: true, order: 4, style: { buttonStyle: "soft" } },
      { id: "newsletter", name: "Bedtime Story Updates", enabled: true, order: 5, style: { style: "gentle" } }
    ],
    sampleContent: {
      tagline: "Sweet dreams start here",
      description: "A gentle bedtime story that helps little ones drift off to peaceful sleep with beautiful illustrations.",
      ctaText: "Get Your Copy",
      testimonialPlaceholder: "The perfect bedtime read. My daughter is asleep before I finish! - Grateful Mom"
    }
  },
  {
    id: "fiction_literary",
    name: "Literary Classic",
    category: "fiction",
    description: "Elegant, sophisticated design for literary fiction with refined typography and classic aesthetics",
    previewImageUrl: "/templates/fiction-literary.jpg",
    theme: {
      primaryColor: "#8D6E63",
      accentColor: "#C9941A",
      backgroundColor: "#FAF8F3",
      textColor: "#3E2723",
      fontFamily: "Crimson Pro, serif",
      headingFont: "Playfair Display, serif"
    },
    layout: {
      heroStyle: "minimal",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "synopsis", "excerpt", "author", "reviews", "awards", "buy"]
    },
    sections: [
      { id: "hero", name: "Book Cover", enabled: true, order: 0, style: { layout: "centered", showAwards: "true" } },
      { id: "synopsis", name: "The Story", enabled: true, order: 1, style: { layout: "elegant_text", dropCap: "true" } },
      { id: "excerpt", name: "Read an Excerpt", enabled: true, order: 2, style: { layout: "manuscript", showChapterSelect: "true" } },
      { id: "author", name: "About the Author", enabled: true, order: 3, style: { layout: "biography", showBooks: "true" } },
      { id: "reviews", name: "Critical Acclaim", enabled: true, order: 4, style: { layout: "quotes", showPublications: "true" } },
      { id: "awards", name: "Recognition", enabled: true, order: 5, style: { layout: "badges" } },
      { id: "buy", name: "Available Now", enabled: true, order: 6, style: { layout: "elegant", showFormats: "true" } }
    ],
    sampleContent: {
      tagline: "A masterpiece of contemporary fiction",
      description: "A sweeping narrative that explores the depths of human experience through exquisite prose and unforgettable characters.",
      ctaText: "Order Your Copy",
      testimonialPlaceholder: "Utterly captivating. A triumph of storytelling. - The Literary Review"
    }
  },
  {
    id: "thriller_dark",
    name: "Dark Suspense",
    category: "thriller",
    description: "Moody, intense design for thrillers and mysteries with dramatic visuals and suspenseful atmosphere",
    previewImageUrl: "/templates/thriller-dark.jpg",
    theme: {
      primaryColor: "#B71C1C",
      accentColor: "#FF5252",
      backgroundColor: "#121212",
      textColor: "#E0E0E0",
      fontFamily: "Roboto, sans-serif",
      headingFont: "Oswald, sans-serif"
    },
    layout: {
      heroStyle: "full_cover",
      navigationStyle: "hidden",
      sectionOrder: ["hero", "hook", "excerpt", "author", "reviews", "series", "buy"]
    },
    sections: [
      { id: "hero", name: "Cover Reveal", enabled: true, order: 0, style: { overlay: "dark", showTagline: "true" } },
      { id: "hook", name: "The Hook", enabled: true, order: 1, style: { layout: "dramatic", animation: "fade_in" } },
      { id: "excerpt", name: "First Chapter", enabled: true, order: 2, style: { layout: "dark_reader", showProgress: "true" } },
      { id: "author", name: "The Author", enabled: true, order: 3, style: { layout: "mysterious", showOtherBooks: "true" } },
      { id: "reviews", name: "Praise", enabled: true, order: 4, style: { layout: "dramatic_quotes" } },
      { id: "series", name: "The Series", enabled: true, order: 5, style: { layout: "timeline" } },
      { id: "buy", name: "Get It Now", enabled: true, order: 6, style: { urgency: "true", countdown: "false" } }
    ],
    sampleContent: {
      tagline: "Some secrets are worth killing for",
      description: "A heart-pounding thriller that will keep you guessing until the very last page. Trust no one.",
      ctaText: "Buy Now",
      testimonialPlaceholder: "I couldn't put it down. Absolutely gripping! - Bestselling Author"
    }
  },
  {
    id: "romance_passionate",
    name: "Passionate Hearts",
    category: "romance",
    description: "Warm, romantic design with elegant flourishes perfect for contemporary and historical romance",
    previewImageUrl: "/templates/romance-passionate.jpg",
    theme: {
      primaryColor: "#E91E63",
      accentColor: "#F8BBD9",
      backgroundColor: "#FFF5F7",
      textColor: "#4A1942",
      fontFamily: "Lora, serif",
      headingFont: "Great Vibes, cursive"
    },
    layout: {
      heroStyle: "split",
      navigationStyle: "sticky",
      sectionOrder: ["hero", "blurb", "excerpt", "tropes", "author", "series", "reviews", "buy"]
    },
    sections: [
      { id: "hero", name: "Cover Feature", enabled: true, order: 0, style: { showHearts: "true", animation: "float" } },
      { id: "blurb", name: "The Story", enabled: true, order: 1, style: { layout: "romantic", showHeatLevel: "true" } },
      { id: "excerpt", name: "Sneak Peek", enabled: true, order: 2, style: { layout: "love_letter" } },
      { id: "tropes", name: "Tropes You'll Love", enabled: true, order: 3, style: { layout: "tags", showIcons: "true" } },
      { id: "author", name: "Meet the Author", enabled: true, order: 4, style: { layout: "warm", showSocial: "true" } },
      { id: "series", name: "More to Love", enabled: true, order: 5, style: { layout: "book_covers" } },
      { id: "reviews", name: "Reader Love", enabled: true, order: 6, style: { layout: "hearts", showStars: "true" } },
      { id: "buy", name: "Fall in Love", enabled: true, order: 7, style: { buttonStyle: "romantic" } }
    ],
    sampleContent: {
      tagline: "Love conquers all",
      description: "A swoony, heartfelt romance that will make you believe in happily ever after.",
      ctaText: "Read Now",
      testimonialPlaceholder: "5 stars! The chemistry was off the charts! - Romance Book Blog"
    }
  },
  {
    id: "memoir_personal",
    name: "Personal Journey",
    category: "memoir",
    description: "Intimate, authentic design for memoirs and autobiographies with a focus on personal storytelling",
    previewImageUrl: "/templates/memoir-personal.jpg",
    theme: {
      primaryColor: "#5D4037",
      accentColor: "#A1887F",
      backgroundColor: "#EFEBE9",
      textColor: "#3E2723",
      fontFamily: "Merriweather, serif",
      headingFont: "Libre Baskerville, serif"
    },
    layout: {
      heroStyle: "split",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "story", "timeline", "excerpt", "author", "impact", "reviews", "buy"]
    },
    sections: [
      { id: "hero", name: "My Story", enabled: true, order: 0, style: { layout: "personal", showPhoto: "true" } },
      { id: "story", name: "The Journey", enabled: true, order: 1, style: { layout: "narrative", showQuote: "true" } },
      { id: "timeline", name: "Life Moments", enabled: true, order: 2, style: { layout: "vertical_timeline" } },
      { id: "excerpt", name: "Read a Chapter", enabled: true, order: 3, style: { layout: "personal_journal" } },
      { id: "author", name: "About Me", enabled: true, order: 4, style: { layout: "authentic", showPhotos: "true" } },
      { id: "impact", name: "Making a Difference", enabled: true, order: 5, style: { layout: "mission" } },
      { id: "reviews", name: "Reader Stories", enabled: true, order: 6, style: { layout: "testimonials", showImpact: "true" } },
      { id: "buy", name: "Get the Book", enabled: true, order: 7, style: { showDedication: "true" } }
    ],
    sampleContent: {
      tagline: "A story of resilience and hope",
      description: "An honest, moving account of triumph over adversity that will inspire readers to embrace their own journey.",
      ctaText: "Order Now",
      testimonialPlaceholder: "This book changed my perspective on life. Truly transformative. - Reader"
    }
  },
  {
    id: "business_professional",
    name: "Executive Edge",
    category: "business",
    description: "Clean, professional design for business books with a focus on credibility and authority",
    previewImageUrl: "/templates/business-professional.jpg",
    theme: {
      primaryColor: "#1565C0",
      accentColor: "#42A5F5",
      backgroundColor: "#FFFFFF",
      textColor: "#212121",
      fontFamily: "Inter, sans-serif",
      headingFont: "Montserrat, sans-serif"
    },
    layout: {
      heroStyle: "split",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "problem", "solution", "chapters", "author", "endorsements", "bulk_orders", "buy"]
    },
    sections: [
      { id: "hero", name: "Book Launch", enabled: true, order: 0, style: { showCredentials: "true", showBestseller: "true" } },
      { id: "problem", name: "The Challenge", enabled: true, order: 1, style: { layout: "stats", showIcons: "true" } },
      { id: "solution", name: "The Solution", enabled: true, order: 2, style: { layout: "framework", showDiagram: "true" } },
      { id: "chapters", name: "What You'll Learn", enabled: true, order: 3, style: { layout: "accordion", showPreview: "true" } },
      { id: "author", name: "About the Author", enabled: true, order: 4, style: { layout: "professional", showLogos: "true" } },
      { id: "endorsements", name: "Endorsements", enabled: true, order: 5, style: { layout: "logos_and_quotes", showTitles: "true" } },
      { id: "bulk_orders", name: "Bulk Orders", enabled: true, order: 6, style: { showPricing: "true", showBenefits: "true" } },
      { id: "buy", name: "Get Your Copy", enabled: true, order: 7, style: { showBonuses: "true" } }
    ],
    sampleContent: {
      tagline: "Transform your business",
      description: "The definitive guide to achieving breakthrough results through proven strategies and actionable frameworks.",
      ctaText: "Order Now",
      testimonialPlaceholder: "Required reading for every leader. - Fortune 500 CEO"
    }
  },
  {
    id: "self_help_transformative",
    name: "Life Transformation",
    category: "self_help",
    description: "Inspiring, uplifting design for self-help and personal development books",
    previewImageUrl: "/templates/self-help-transformative.jpg",
    theme: {
      primaryColor: "#00897B",
      accentColor: "#4DB6AC",
      backgroundColor: "#E0F2F1",
      textColor: "#004D40",
      fontFamily: "Open Sans, sans-serif",
      headingFont: "Poppins, sans-serif"
    },
    layout: {
      heroStyle: "full_cover",
      navigationStyle: "sticky",
      sectionOrder: ["hero", "promise", "transformation", "chapters", "author", "testimonials", "resources", "buy"]
    },
    sections: [
      { id: "hero", name: "Your Journey Starts", enabled: true, order: 0, style: { showBadge: "true", animation: "grow" } },
      { id: "promise", name: "The Promise", enabled: true, order: 1, style: { layout: "before_after" } },
      { id: "transformation", name: "Real Results", enabled: true, order: 2, style: { layout: "success_stories", showPhotos: "true" } },
      { id: "chapters", name: "Inside the Book", enabled: true, order: 3, style: { layout: "journey_map" } },
      { id: "author", name: "Your Guide", enabled: true, order: 4, style: { layout: "mentor", showCertifications: "true" } },
      { id: "testimonials", name: "Success Stories", enabled: true, order: 5, style: { layout: "video_and_text" } },
      { id: "resources", name: "Bonus Resources", enabled: true, order: 6, style: { layout: "download_cards" } },
      { id: "buy", name: "Start Your Transformation", enabled: true, order: 7, style: { showGuarantee: "true" } }
    ],
    sampleContent: {
      tagline: "Unlock your potential",
      description: "Discover the proven system that has helped thousands transform their lives and achieve their dreams.",
      ctaText: "Begin Your Journey",
      testimonialPlaceholder: "This book gave me the tools to completely change my life. - Transformed Reader"
    }
  },
  {
    id: "cookbook_delicious",
    name: "Culinary Delights",
    category: "cookbook",
    description: "Appetizing, photo-rich design for cookbooks with recipe previews and ingredient highlights",
    previewImageUrl: "/templates/cookbook-delicious.jpg",
    theme: {
      primaryColor: "#E65100",
      accentColor: "#FF9800",
      backgroundColor: "#FFF8E1",
      textColor: "#4E342E",
      fontFamily: "Nunito Sans, sans-serif",
      headingFont: "Abril Fatface, cursive"
    },
    layout: {
      heroStyle: "full_cover",
      navigationStyle: "sticky",
      sectionOrder: ["hero", "featured_recipes", "categories", "sample_recipe", "author", "reviews", "buy"]
    },
    sections: [
      { id: "hero", name: "Welcome to the Kitchen", enabled: true, order: 0, style: { showFoodPhoto: "true" } },
      { id: "featured_recipes", name: "Featured Recipes", enabled: true, order: 1, style: { layout: "photo_grid", showDifficulty: "true" } },
      { id: "categories", name: "Recipe Categories", enabled: true, order: 2, style: { layout: "icon_tabs" } },
      { id: "sample_recipe", name: "Try This Recipe", enabled: true, order: 3, style: { layout: "full_recipe", showIngredients: "true" } },
      { id: "author", name: "Meet the Chef", enabled: true, order: 4, style: { layout: "kitchen_bio", showCredentials: "true" } },
      { id: "reviews", name: "Kitchen Tested", enabled: true, order: 5, style: { layout: "recipe_reviews", showPhotos: "true" } },
      { id: "buy", name: "Get Cooking", enabled: true, order: 6, style: { showFormats: "true", showBonusRecipes: "true" } }
    ],
    sampleContent: {
      tagline: "Delicious recipes for every occasion",
      description: "Over 100 mouthwatering recipes with step-by-step instructions, beautiful photography, and pro tips.",
      ctaText: "Order Your Copy",
      testimonialPlaceholder: "Every recipe I've tried has been amazing! Restaurant quality at home. - Home Cook"
    }
  },
  {
    id: "poetry_artistic",
    name: "Verse & Vision",
    category: "poetry",
    description: "Artistic, minimalist design for poetry collections with focus on typography and white space",
    previewImageUrl: "/templates/poetry-artistic.jpg",
    theme: {
      primaryColor: "#6A1B9A",
      accentColor: "#AB47BC",
      backgroundColor: "#FAFAFA",
      textColor: "#212121",
      fontFamily: "EB Garamond, serif",
      headingFont: "Cormorant Garamond, serif"
    },
    layout: {
      heroStyle: "minimal",
      navigationStyle: "hidden",
      sectionOrder: ["hero", "featured_poem", "themes", "author", "reviews", "buy"]
    },
    sections: [
      { id: "hero", name: "Collection", enabled: true, order: 0, style: { layout: "centered", minimalist: "true" } },
      { id: "featured_poem", name: "Featured Poem", enabled: true, order: 1, style: { layout: "centered_verse", animation: "fade" } },
      { id: "themes", name: "Themes", enabled: true, order: 2, style: { layout: "word_cloud" } },
      { id: "author", name: "The Poet", enabled: true, order: 3, style: { layout: "artistic", showBio: "true" } },
      { id: "reviews", name: "Praise", enabled: true, order: 4, style: { layout: "elegant_quotes" } },
      { id: "buy", name: "Acquire", enabled: true, order: 5, style: { layout: "minimal" } }
    ],
    sampleContent: {
      tagline: "Words that move the soul",
      description: "A collection of poems exploring love, loss, and the human experience through evocative imagery.",
      ctaText: "Own This Collection",
      testimonialPlaceholder: "Hauntingly beautiful. Each poem is a masterpiece. - Poetry Magazine"
    }
  },
  {
    id: "religious_spiritual",
    name: "Sacred Words",
    category: "religious",
    description: "Reverent, dignified design for religious and spiritual books with traditional elements",
    previewImageUrl: "/templates/religious-spiritual.jpg",
    theme: {
      primaryColor: "#5D4037",
      accentColor: "#D4AF37",
      backgroundColor: "#F5F0E8",
      textColor: "#3E2723",
      fontFamily: "Spectral, serif",
      headingFont: "Cinzel, serif"
    },
    layout: {
      heroStyle: "split",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "message", "chapters", "scripture", "author", "testimonials", "study_guide", "buy"]
    },
    sections: [
      { id: "hero", name: "The Book", enabled: true, order: 0, style: { layout: "dignified", showBlessing: "true" } },
      { id: "message", name: "The Message", enabled: true, order: 1, style: { layout: "scripture_style", showVerse: "true" } },
      { id: "chapters", name: "Chapters", enabled: true, order: 2, style: { layout: "numbered_list" } },
      { id: "scripture", name: "Key Scriptures", enabled: true, order: 3, style: { layout: "verse_cards" } },
      { id: "author", name: "About the Author", enabled: true, order: 4, style: { layout: "ministry", showCredentials: "true" } },
      { id: "testimonials", name: "Lives Changed", enabled: true, order: 5, style: { layout: "testimony" } },
      { id: "study_guide", name: "Study Resources", enabled: true, order: 6, style: { showDownloads: "true" } },
      { id: "buy", name: "Order", enabled: true, order: 7, style: { showBulkPricing: "true" } }
    ],
    sampleContent: {
      tagline: "Wisdom for the journey",
      description: "A profound exploration of faith that will deepen your spiritual life and strengthen your walk.",
      ctaText: "Get Your Copy",
      testimonialPlaceholder: "This book transformed my prayer life and brought me closer to God. - Pastor"
    }
  },
  {
    id: "aesthetic_workbook",
    name: "Aesthetic Workbook",
    category: "self_help",
    description: "Modern, clean design with soft neutrals and elegant typography - perfect for workbooks and digital downloads",
    previewImageUrl: "/templates/aesthetic-workbook.jpg",
    theme: {
      primaryColor: "#B8A99A",
      accentColor: "#D4C5B9",
      backgroundColor: "#FAF7F5",
      textColor: "#3D3D3D",
      fontFamily: "DM Sans, sans-serif",
      headingFont: "Cormorant Garamond, serif"
    },
    layout: {
      heroStyle: "minimal",
      navigationStyle: "hidden",
      sectionOrder: ["hero", "about", "whats_inside", "preview", "author", "testimonials", "buy"]
    },
    sections: [
      { id: "hero", name: "Welcome", enabled: true, order: 0, style: { layout: "centered", showBadge: "true" } },
      { id: "about", name: "About This Workbook", enabled: true, order: 1, style: { layout: "elegant_text" } },
      { id: "whats_inside", name: "What's Inside", enabled: true, order: 2, style: { layout: "icon_list", showPageCount: "true" } },
      { id: "preview", name: "Sneak Peek", enabled: true, order: 3, style: { layout: "page_spread", showMockup: "true" } },
      { id: "author", name: "Created By", enabled: true, order: 4, style: { layout: "minimal_bio" } },
      { id: "testimonials", name: "What Others Say", enabled: true, order: 5, style: { layout: "quote_cards" } },
      { id: "buy", name: "Get Instant Access", enabled: true, order: 6, style: { showFormats: "true", showInstantDownload: "true" } }
    ],
    sampleContent: {
      tagline: "Your journey to growth starts here",
      description: "A beautifully designed workbook with guided exercises, reflection prompts, and actionable strategies.",
      ctaText: "Download Now",
      testimonialPlaceholder: "This workbook is absolutely stunning and the exercises are so helpful! - Sarah"
    }
  },
  {
    id: "motivational_bold",
    name: "Bold Motivational",
    category: "self_help",
    description: "Eye-catching design with bold typography and vibrant accent colors - perfect for motivational and inspirational books",
    previewImageUrl: "/templates/motivational-bold.jpg",
    theme: {
      primaryColor: "#FF6B35",
      accentColor: "#1A1A2E",
      backgroundColor: "#FFFFFF",
      textColor: "#1A1A2E",
      fontFamily: "Montserrat, sans-serif",
      headingFont: "Anton, sans-serif"
    },
    layout: {
      heroStyle: "full_cover",
      navigationStyle: "sticky",
      sectionOrder: ["hero", "hook", "promise", "chapters", "author", "reviews", "buy"]
    },
    sections: [
      { id: "hero", name: "Cover Reveal", enabled: true, order: 0, style: { layout: "bold", showTagline: "true" } },
      { id: "hook", name: "The Problem", enabled: true, order: 1, style: { layout: "dramatic_text" } },
      { id: "promise", name: "The Solution", enabled: true, order: 2, style: { layout: "bullet_points", showIcons: "true" } },
      { id: "chapters", name: "What You'll Discover", enabled: true, order: 3, style: { layout: "numbered_cards" } },
      { id: "author", name: "About the Author", enabled: true, order: 4, style: { layout: "dynamic" } },
      { id: "reviews", name: "Reader Reviews", enabled: true, order: 5, style: { layout: "bold_quotes" } },
      { id: "buy", name: "Take Action Now", enabled: true, order: 6, style: { urgency: "true", showCountdown: "false" } }
    ],
    sampleContent: {
      tagline: "Stop waiting. Start winning.",
      description: "The no-nonsense guide to breaking through barriers and achieving your biggest goals.",
      ctaText: "Get Your Copy Today",
      testimonialPlaceholder: "This book lit a fire under me! Life-changing advice. - Mark"
    }
  },
  {
    id: "personal_dev_minimal",
    name: "Mindful Minimalist",
    category: "self_help",
    description: "Clean, calming design with plenty of whitespace - ideal for mindfulness, wellness, and personal growth books",
    previewImageUrl: "/templates/personal-dev-minimal.jpg",
    theme: {
      primaryColor: "#2D5A4A",
      accentColor: "#A8D5BA",
      backgroundColor: "#FDFCFB",
      textColor: "#2C3E50",
      fontFamily: "Raleway, sans-serif",
      headingFont: "Playfair Display, serif"
    },
    layout: {
      heroStyle: "minimal",
      navigationStyle: "hidden",
      sectionOrder: ["hero", "philosophy", "benefits", "excerpt", "author", "testimonials", "buy"]
    },
    sections: [
      { id: "hero", name: "Introduction", enabled: true, order: 0, style: { layout: "breathing_space", animation: "fade" } },
      { id: "philosophy", name: "The Philosophy", enabled: true, order: 1, style: { layout: "centered_quote" } },
      { id: "benefits", name: "What You'll Gain", enabled: true, order: 2, style: { layout: "minimal_list" } },
      { id: "excerpt", name: "Read an Excerpt", enabled: true, order: 3, style: { layout: "clean_text" } },
      { id: "author", name: "About the Author", enabled: true, order: 4, style: { layout: "gentle" } },
      { id: "testimonials", name: "Testimonials", enabled: true, order: 5, style: { layout: "soft_cards" } },
      { id: "buy", name: "Begin Your Journey", enabled: true, order: 6, style: { layout: "minimal" } }
    ],
    sampleContent: {
      tagline: "Find peace in the present moment",
      description: "A gentle guide to cultivating mindfulness, reducing stress, and living with intention.",
      ctaText: "Order Now",
      testimonialPlaceholder: "This book helped me find calm in the chaos. Beautifully written. - Lisa"
    }
  },
  {
    id: "lead_magnet_pro",
    name: "Lead Magnet Pro",
    category: "business",
    description: "Conversion-focused design for ebooks, guides, and lead magnets with email capture emphasis",
    previewImageUrl: "/templates/lead-magnet-pro.jpg",
    theme: {
      primaryColor: "#6366F1",
      accentColor: "#818CF8",
      backgroundColor: "#F8FAFC",
      textColor: "#1E293B",
      fontFamily: "Inter, sans-serif",
      headingFont: "Plus Jakarta Sans, sans-serif"
    },
    layout: {
      heroStyle: "split",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "problem", "solution", "preview", "author", "cta", "faq"]
    },
    sections: [
      { id: "hero", name: "Free Download", enabled: true, order: 0, style: { showEmailCapture: "true", showBadge: "true" } },
      { id: "problem", name: "The Challenge", enabled: true, order: 1, style: { layout: "pain_points" } },
      { id: "solution", name: "The Solution", enabled: true, order: 2, style: { layout: "benefits_grid" } },
      { id: "preview", name: "Inside the Guide", enabled: true, order: 3, style: { layout: "mockup_carousel" } },
      { id: "author", name: "Created By", enabled: true, order: 4, style: { layout: "credibility" } },
      { id: "cta", name: "Get Your Free Copy", enabled: true, order: 5, style: { showEmailCapture: "true", showSocialProof: "true" } },
      { id: "faq", name: "FAQ", enabled: true, order: 6, style: { layout: "accordion" } }
    ],
    sampleContent: {
      tagline: "Free guide to transform your results",
      description: "Download this comprehensive guide and discover the exact strategies used by top performers.",
      ctaText: "Get Free Instant Access",
      testimonialPlaceholder: "Incredibly valuable content. Can't believe it's free! - Jamie"
    }
  },
  {
    id: "journal_planner",
    name: "Guided Journal",
    category: "self_help",
    description: "Warm, inviting design for journals, planners, and interactive workbooks with reflection prompts",
    previewImageUrl: "/templates/journal-planner.jpg",
    theme: {
      primaryColor: "#C4A77D",
      accentColor: "#E8DDD4",
      backgroundColor: "#FFFBF5",
      textColor: "#4A4A4A",
      fontFamily: "Lato, sans-serif",
      headingFont: "Libre Baskerville, serif"
    },
    layout: {
      heroStyle: "split",
      navigationStyle: "sticky",
      sectionOrder: ["hero", "about", "features", "sample_pages", "how_to_use", "author", "buy"]
    },
    sections: [
      { id: "hero", name: "Your New Journal", enabled: true, order: 0, style: { layout: "warm", showMockup: "true" } },
      { id: "about", name: "About This Journal", enabled: true, order: 1, style: { layout: "story" } },
      { id: "features", name: "What's Included", enabled: true, order: 2, style: { layout: "feature_cards", showIcons: "true" } },
      { id: "sample_pages", name: "Peek Inside", enabled: true, order: 3, style: { layout: "page_gallery", showZoom: "true" } },
      { id: "how_to_use", name: "How to Use", enabled: true, order: 4, style: { layout: "steps" } },
      { id: "author", name: "Created By", enabled: true, order: 5, style: { layout: "personal" } },
      { id: "buy", name: "Start Journaling", enabled: true, order: 6, style: { showFormats: "true" } }
    ],
    sampleContent: {
      tagline: "Write your way to clarity",
      description: "A beautifully crafted guided journal with daily prompts, reflection exercises, and goal-setting pages.",
      ctaText: "Get Your Journal",
      testimonialPlaceholder: "The prompts are so thoughtful. This journal has become my daily ritual. - Emma"
    }
  },
  {
    id: "dark_sophisticated",
    name: "Dark Sophisticated",
    category: "non_fiction",
    description: "Elegant dark theme with gold accents - perfect for premium non-fiction and thought leadership books",
    previewImageUrl: "/templates/dark-sophisticated.jpg",
    theme: {
      primaryColor: "#C9941A",
      accentColor: "#D4AF37",
      backgroundColor: "#1A1A1A",
      textColor: "#E5E5E5",
      fontFamily: "Source Serif Pro, serif",
      headingFont: "Cinzel, serif"
    },
    layout: {
      heroStyle: "full_cover",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "synopsis", "author", "chapters", "endorsements", "media", "buy"]
    },
    sections: [
      { id: "hero", name: "The Book", enabled: true, order: 0, style: { layout: "dramatic", showAwards: "true" } },
      { id: "synopsis", name: "Synopsis", enabled: true, order: 1, style: { layout: "elegant_dark" } },
      { id: "author", name: "The Author", enabled: true, order: 2, style: { layout: "premium", showCredentials: "true" } },
      { id: "chapters", name: "Inside", enabled: true, order: 3, style: { layout: "gold_numbered" } },
      { id: "endorsements", name: "Endorsements", enabled: true, order: 4, style: { layout: "premium_quotes" } },
      { id: "media", name: "In the Media", enabled: true, order: 5, style: { layout: "logo_bar" } },
      { id: "buy", name: "Order Now", enabled: true, order: 6, style: { layout: "premium" } }
    ],
    sampleContent: {
      tagline: "A groundbreaking perspective",
      description: "A masterfully crafted exploration that challenges conventional thinking and offers profound insights.",
      ctaText: "Pre-Order Now",
      testimonialPlaceholder: "An essential read for anyone serious about understanding this topic. - NYT"
    }
  },
  {
    id: "boho_creative",
    name: "Boho Creative",
    category: "self_help",
    description: "Warm bohemian aesthetic with earthy tones and organic shapes - perfect for creative and wellness content",
    previewImageUrl: "/templates/boho-creative.jpg",
    theme: {
      primaryColor: "#C17F59",
      accentColor: "#E6D5C3",
      backgroundColor: "#FDF8F3",
      textColor: "#5D4E46",
      fontFamily: "Nunito, sans-serif",
      headingFont: "Josefin Sans, sans-serif"
    },
    layout: {
      heroStyle: "split",
      navigationStyle: "hidden",
      sectionOrder: ["hero", "story", "whats_inside", "preview", "author", "community", "buy"]
    },
    sections: [
      { id: "hero", name: "Welcome", enabled: true, order: 0, style: { layout: "organic", showDecorations: "true" } },
      { id: "story", name: "The Story", enabled: true, order: 1, style: { layout: "handwritten_feel" } },
      { id: "whats_inside", name: "What You'll Find", enabled: true, order: 2, style: { layout: "organic_list" } },
      { id: "preview", name: "Sneak Peek", enabled: true, order: 3, style: { layout: "polaroid_gallery" } },
      { id: "author", name: "Hi, I'm the Creator", enabled: true, order: 4, style: { layout: "casual_warm" } },
      { id: "community", name: "Join Our Community", enabled: true, order: 5, style: { showSocial: "true" } },
      { id: "buy", name: "Get Yours", enabled: true, order: 6, style: { layout: "natural" } }
    ],
    sampleContent: {
      tagline: "Embrace your creative spirit",
      description: "A soulful guide to living authentically and nurturing your creative gifts.",
      ctaText: "Shop Now",
      testimonialPlaceholder: "The vibe of this book is everything! It feels like a warm hug. - Creative Soul"
    }
  },
  {
    id: "tech_startup",
    name: "Tech Startup",
    category: "business",
    description: "Modern, tech-forward design with gradient accents - ideal for tech, startup, and innovation books",
    previewImageUrl: "/templates/tech-startup.jpg",
    theme: {
      primaryColor: "#7C3AED",
      accentColor: "#A78BFA",
      backgroundColor: "#0F172A",
      textColor: "#E2E8F0",
      fontFamily: "Space Grotesk, sans-serif",
      headingFont: "Clash Display, sans-serif"
    },
    layout: {
      heroStyle: "animated",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "problem", "solution", "data", "author", "testimonials", "buy"]
    },
    sections: [
      { id: "hero", name: "Launch", enabled: true, order: 0, style: { layout: "gradient", showAnimation: "true" } },
      { id: "problem", name: "The Challenge", enabled: true, order: 1, style: { layout: "stats_driven" } },
      { id: "solution", name: "The Framework", enabled: true, order: 2, style: { layout: "tech_cards" } },
      { id: "data", name: "The Data", enabled: true, order: 3, style: { layout: "metrics", showCharts: "true" } },
      { id: "author", name: "The Author", enabled: true, order: 4, style: { layout: "founder", showCompanies: "true" } },
      { id: "testimonials", name: "Founder Reviews", enabled: true, order: 5, style: { layout: "tech_quotes" } },
      { id: "buy", name: "Get the Book", enabled: true, order: 6, style: { showPreorder: "true" } }
    ],
    sampleContent: {
      tagline: "Build. Scale. Disrupt.",
      description: "The playbook for building category-defining companies in the age of AI and innovation.",
      ctaText: "Pre-Order Now",
      testimonialPlaceholder: "Essential reading for every founder. Practical and actionable. - Y Combinator Partner"
    }
  }
];

export function getTemplatesByCategory(category: string): BookWebsiteTemplate[] {
  return BOOK_WEBSITE_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(templateId: string): BookWebsiteTemplate | undefined {
  return BOOK_WEBSITE_TEMPLATES.find(t => t.id === templateId);
}

export function getAllTemplateCategories(): string[] {
  const categories = new Set(BOOK_WEBSITE_TEMPLATES.map(t => t.category));
  return Array.from(categories);
}

export function applyTemplateToWebsite(templateId: string): Partial<{
  theme: string;
  primaryColor: string;
  accentColor: string;
  sections: any[];
  tagline: string;
}> {
  const template = getTemplateById(templateId);
  if (!template) return {};

  return {
    theme: template.id,
    primaryColor: template.theme.primaryColor,
    accentColor: template.theme.accentColor,
    sections: template.sections,
    tagline: template.sampleContent.tagline
  };
}
