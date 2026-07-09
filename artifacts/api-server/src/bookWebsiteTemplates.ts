export interface BookWebsiteTemplate {
  id: string;
  name: string;
  category: "fiction" | "non_fiction" | "children" | "memoir" | "business" | "romance" | "thriller" | "self_help" | "cookbook" | "poetry" | "academic" | "religious" | "author_portfolio" | "fantasy" | "ebook";
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
  },
  {
    id: "author_sage",
    name: "Sage Author",
    category: "author_portfolio",
    description: "Elegant author portfolio with sage green accents, split layout, and sophisticated typography - inspired by premium author websites",
    previewImageUrl: "/templates/author-sage.jpg",
    theme: {
      primaryColor: "#8FAE8B",
      accentColor: "#B5C9B1",
      backgroundColor: "#FAF9F7",
      textColor: "#2D2D2D",
      fontFamily: "Cormorant Garamond, serif",
      headingFont: "Playfair Display, serif"
    },
    layout: {
      heroStyle: "split",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "about_me", "books", "blog", "press", "contact", "newsletter"]
    },
    sections: [
      { id: "hero", name: "Welcome", enabled: true, order: 0, style: { layout: "split_photo", showSocial: "true" } },
      { id: "about_me", name: "About Me", enabled: true, order: 1, style: { layout: "elegant_bio", showPhoto: "true" } },
      { id: "books", name: "My Books", enabled: true, order: 2, style: { layout: "cover_gallery", showBuyLinks: "true" } },
      { id: "blog", name: "Blog", enabled: true, order: 3, style: { layout: "recent_posts" } },
      { id: "press", name: "Press", enabled: true, order: 4, style: { layout: "logo_bar", showQuotes: "true" } },
      { id: "contact", name: "Contact", enabled: true, order: 5, style: { layout: "simple_form" } },
      { id: "newsletter", name: "Newsletter", enabled: true, order: 6, style: { layout: "elegant_signup" } }
    ],
    sampleContent: {
      tagline: "Hello, I'm [Author Name]",
      description: "Welcome to my website. Here you'll find information about all my books and links to all my social media.",
      ctaText: "About Me",
      testimonialPlaceholder: "A masterful storyteller with an elegant prose style. - The Literary Review"
    }
  },
  {
    id: "manuscript_romance",
    name: "Manuscript",
    category: "romance",
    description: "Romantic author template with dusty rose accents, elegant script typography, and newsletter-focused design",
    previewImageUrl: "/templates/manuscript-romance.jpg",
    theme: {
      primaryColor: "#C5A3A3",
      accentColor: "#E8D5D5",
      backgroundColor: "#FBF8F8",
      textColor: "#4A3F3F",
      fontFamily: "Cormorant Garamond, serif",
      headingFont: "Playfair Display, serif"
    },
    layout: {
      heroStyle: "full_cover",
      navigationStyle: "sticky",
      sectionOrder: ["hero", "what_i_write", "newsletter", "about", "books", "contact"]
    },
    sections: [
      { id: "hero", name: "Welcome Banner", enabled: true, order: 0, style: { layout: "romantic_hero", showTagline: "true" } },
      { id: "what_i_write", name: "What I Write", enabled: true, order: 1, style: { layout: "elegant_description" } },
      { id: "newsletter", name: "Newsletter Signup", enabled: true, order: 2, style: { layout: "featured_signup", showIncentive: "true" } },
      { id: "about", name: "Hello There", enabled: true, order: 3, style: { layout: "personal_intro", showPhoto: "true" } },
      { id: "books", name: "My Books", enabled: true, order: 4, style: { layout: "book_carousel" } },
      { id: "contact", name: "Get in Touch", enabled: true, order: 5, style: { layout: "contact_form" } }
    ],
    sampleContent: {
      tagline: "Love Stories in the Making",
      description: "I write page-turning swoon-worthy moments, slow-burn tension, and happily-ever-afters.",
      ctaText: "Join My Newsletter",
      testimonialPlaceholder: "Your new favorite partner-in-swoon and certified provider of late-night book hangovers."
    }
  },
  {
    id: "kinfolk_fantasy",
    name: "Kinfolk Fantasy",
    category: "fantasy",
    description: "Elegant fantasy novel landing page with book mockup, ethereal typography, and mystical aesthetics",
    previewImageUrl: "/templates/kinfolk-fantasy.jpg",
    theme: {
      primaryColor: "#2C3E50",
      accentColor: "#8B7355",
      backgroundColor: "#F5F3EF",
      textColor: "#2C3E50",
      fontFamily: "EB Garamond, serif",
      headingFont: "Cinzel, serif"
    },
    layout: {
      heroStyle: "split",
      navigationStyle: "hidden",
      sectionOrder: ["hero", "synopsis", "world", "characters", "excerpt", "author", "buy"]
    },
    sections: [
      { id: "hero", name: "Book Launch", enabled: true, order: 0, style: { layout: "device_mockup", showSocial: "true" } },
      { id: "synopsis", name: "The Story", enabled: true, order: 1, style: { layout: "dramatic_text" } },
      { id: "world", name: "The World", enabled: true, order: 2, style: { layout: "map_and_lore" } },
      { id: "characters", name: "Characters", enabled: true, order: 3, style: { layout: "character_cards" } },
      { id: "excerpt", name: "Read a Chapter", enabled: true, order: 4, style: { layout: "parchment_style" } },
      { id: "author", name: "About the Author", enabled: true, order: 5, style: { layout: "elegant" } },
      { id: "buy", name: "Discover More Books", enabled: true, order: 6, style: { layout: "elegant_cta" } }
    ],
    sampleContent: {
      tagline: "An Epic Fantasy Adventure",
      description: "Write a short and striking summary of your book to capture the reader's attention. This is a great way to introduce your book.",
      ctaText: "Buy on Amazon",
      testimonialPlaceholder: "A richly imagined world with unforgettable characters. - Fantasy Book Review"
    }
  },
  {
    id: "bookstore_modern",
    name: "Modern Bookstore",
    category: "ebook",
    description: "Clean bookstore-style landing page with multiple book showcases, categories, and e-commerce integration",
    previewImageUrl: "/templates/bookstore-modern.jpg",
    theme: {
      primaryColor: "#E85A5A",
      accentColor: "#5AC8C8",
      backgroundColor: "#FFFFFF",
      textColor: "#333333",
      fontFamily: "Open Sans, sans-serif",
      headingFont: "Poppins, sans-serif"
    },
    layout: {
      heroStyle: "full_cover",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "featured", "categories", "new_releases", "bestsellers", "newsletter", "footer"]
    },
    sections: [
      { id: "hero", name: "This Month", enabled: true, order: 0, style: { layout: "featured_books", showDiscount: "true" } },
      { id: "featured", name: "Order E-Books Online", enabled: true, order: 1, style: { layout: "promo_cards" } },
      { id: "categories", name: "Browse by Genre", enabled: true, order: 2, style: { layout: "category_grid" } },
      { id: "new_releases", name: "New Releases", enabled: true, order: 3, style: { layout: "book_slider" } },
      { id: "bestsellers", name: "Bestsellers", enabled: true, order: 4, style: { layout: "book_grid" } },
      { id: "newsletter", name: "Stay Updated", enabled: true, order: 5, style: { layout: "inline_signup" } },
      { id: "footer", name: "Footer", enabled: true, order: 6, style: { showShop: "true" } }
    ],
    sampleContent: {
      tagline: "Discover Your Next Favorite Book",
      description: "Browse our collection of bestselling ebooks and new releases. Instant digital delivery.",
      ctaText: "Read More",
      testimonialPlaceholder: "The best online bookstore experience. Fast delivery and great selection! - Happy Reader"
    }
  },
  {
    id: "author_minimal",
    name: "Author Minimal",
    category: "author_portfolio",
    description: "Ultra-clean minimalist author website with focus on the writing, large typography, and subtle animations",
    previewImageUrl: "/templates/author-minimal.jpg",
    theme: {
      primaryColor: "#1A1A1A",
      accentColor: "#666666",
      backgroundColor: "#FFFFFF",
      textColor: "#1A1A1A",
      fontFamily: "Inter, sans-serif",
      headingFont: "Libre Baskerville, serif"
    },
    layout: {
      heroStyle: "minimal",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "latest_book", "about", "all_books", "newsletter", "contact"]
    },
    sections: [
      { id: "hero", name: "Introduction", enabled: true, order: 0, style: { layout: "text_centered", animation: "fade" } },
      { id: "latest_book", name: "Latest Work", enabled: true, order: 1, style: { layout: "full_width_feature" } },
      { id: "about", name: "About", enabled: true, order: 2, style: { layout: "minimal_bio" } },
      { id: "all_books", name: "Bibliography", enabled: true, order: 3, style: { layout: "minimal_list" } },
      { id: "newsletter", name: "Subscribe", enabled: true, order: 4, style: { layout: "simple_input" } },
      { id: "contact", name: "Contact", enabled: true, order: 5, style: { layout: "email_only" } }
    ],
    sampleContent: {
      tagline: "Writer. Storyteller.",
      description: "Exploring the human condition through fiction.",
      ctaText: "Read More",
      testimonialPlaceholder: "Sparse prose that packs an emotional punch. - The New Yorker"
    }
  },
  {
    id: "canva_landing",
    name: "Canva-Style Landing",
    category: "ebook",
    description: "Professional Canva-inspired landing page for digital products with mockup displays and conversion optimization",
    previewImageUrl: "/templates/canva-landing.jpg",
    theme: {
      primaryColor: "#00C4CC",
      accentColor: "#7B68EE",
      backgroundColor: "#F8F8F8",
      textColor: "#2D2D2D",
      fontFamily: "Nunito Sans, sans-serif",
      headingFont: "DM Sans, sans-serif"
    },
    layout: {
      heroStyle: "split",
      navigationStyle: "hidden",
      sectionOrder: ["hero", "features", "mockups", "what_you_get", "testimonials", "pricing", "faq"]
    },
    sections: [
      { id: "hero", name: "Product Showcase", enabled: true, order: 0, style: { layout: "device_mockup", showBadges: "true" } },
      { id: "features", name: "Key Features", enabled: true, order: 1, style: { layout: "icon_grid" } },
      { id: "mockups", name: "Preview", enabled: true, order: 2, style: { layout: "laptop_showcase" } },
      { id: "what_you_get", name: "What's Included", enabled: true, order: 3, style: { layout: "checklist" } },
      { id: "testimonials", name: "Reviews", enabled: true, order: 4, style: { layout: "card_carousel" } },
      { id: "pricing", name: "Get It Now", enabled: true, order: 5, style: { layout: "pricing_card", showGuarantee: "true" } },
      { id: "faq", name: "FAQ", enabled: true, order: 6, style: { layout: "accordion" } }
    ],
    sampleContent: {
      tagline: "Hosted on Canva • No Coding • Includes Website Design Tips",
      description: "A professionally designed template that makes creating your author website effortless.",
      ctaText: "Get Instant Access",
      testimonialPlaceholder: "This template saved me hours of work! So easy to customize. - Bestselling Author"
    }
  },
  {
    id: "biography_elegant",
    name: "Biography Elegance",
    category: "memoir",
    description: "Sophisticated biography and memoir template with timeline, photo galleries, and life story sections",
    previewImageUrl: "/templates/biography-elegant.jpg",
    theme: {
      primaryColor: "#8B7355",
      accentColor: "#C4B49A",
      backgroundColor: "#FAF8F5",
      textColor: "#3D3D3D",
      fontFamily: "Crimson Pro, serif",
      headingFont: "Cormorant Garamond, serif"
    },
    layout: {
      heroStyle: "full_cover",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "introduction", "timeline", "gallery", "legacy", "book", "contact"]
    },
    sections: [
      { id: "hero", name: "Life Story", enabled: true, order: 0, style: { layout: "portrait_feature", showDates: "true" } },
      { id: "introduction", name: "The Beginning", enabled: true, order: 1, style: { layout: "narrative_text" } },
      { id: "timeline", name: "Life Journey", enabled: true, order: 2, style: { layout: "vertical_timeline", showPhotos: "true" } },
      { id: "gallery", name: "Photo Gallery", enabled: true, order: 3, style: { layout: "masonry_grid" } },
      { id: "legacy", name: "Legacy", enabled: true, order: 4, style: { layout: "quote_and_text" } },
      { id: "book", name: "The Book", enabled: true, order: 5, style: { layout: "book_feature" } },
      { id: "contact", name: "Contact", enabled: true, order: 6, style: { layout: "elegant_form" } }
    ],
    sampleContent: {
      tagline: "A Life Well Lived",
      description: "The extraordinary journey of perseverance, triumph, and the lessons that shaped a lifetime.",
      ctaText: "Read the Story",
      testimonialPlaceholder: "An inspiring account of an remarkable life. - Biography Magazine"
    }
  },
  {
    id: "epic_fantasy_dark",
    name: "Epic Fantasy Dark",
    category: "fantasy",
    description: "Dramatic dark theme for epic fantasy authors with book series showcase, atmospheric backgrounds, and immersive design",
    previewImageUrl: "/templates/epic-fantasy-dark.jpg",
    theme: {
      primaryColor: "#D4AF37",
      accentColor: "#8B4513",
      backgroundColor: "#1A1A1A",
      textColor: "#E8E8E8",
      fontFamily: "EB Garamond, serif",
      headingFont: "Cinzel Decorative, serif"
    },
    layout: {
      heroStyle: "full_cover",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "about_author", "book_series", "latest_book", "world", "newsletter", "buy"]
    },
    sections: [
      { id: "hero", name: "Epic Banner", enabled: true, order: 0, style: { layout: "cinematic", showAward: "true" } },
      { id: "about_author", name: "The Author", enabled: true, order: 1, style: { layout: "split_dark", showPhoto: "true" } },
      { id: "book_series", name: "View My Books", enabled: true, order: 2, style: { layout: "series_grid", showDescriptions: "true" } },
      { id: "latest_book", name: "Latest Release", enabled: true, order: 3, style: { layout: "featured_book" } },
      { id: "world", name: "The World", enabled: true, order: 4, style: { layout: "lore_cards", showMap: "true" } },
      { id: "newsletter", name: "Start Reading", enabled: true, order: 5, style: { layout: "dark_signup" } },
      { id: "buy", name: "Available Now On", enabled: true, order: 6, style: { layout: "retailer_logos" } }
    ],
    sampleContent: {
      tagline: "Amazon Editor's Picks: Best Epic Fantasy",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a turpis efficitur ex faucibus porta.",
      ctaText: "Start Reading",
      testimonialPlaceholder: "An epic tale of magic and adventure that will leave you breathless. - Fantasy Book Review"
    }
  },
  {
    id: "series_showcase",
    name: "Book Series Showcase",
    category: "fiction",
    description: "Perfect for authors with multiple books in a series - showcases each book with descriptions, covers, and buy links",
    previewImageUrl: "/templates/series-showcase.jpg",
    theme: {
      primaryColor: "#4A5568",
      accentColor: "#718096",
      backgroundColor: "#F7FAFC",
      textColor: "#2D3748",
      fontFamily: "Merriweather, serif",
      headingFont: "Oswald, sans-serif"
    },
    layout: {
      heroStyle: "split",
      navigationStyle: "sticky",
      sectionOrder: ["hero", "series_overview", "books", "reading_order", "author", "extras", "buy"]
    },
    sections: [
      { id: "hero", name: "Series Banner", enabled: true, order: 0, style: { layout: "series_hero", showBookCount: "true" } },
      { id: "series_overview", name: "About the Series", enabled: true, order: 1, style: { layout: "elegant_description" } },
      { id: "books", name: "The Books", enabled: true, order: 2, style: { layout: "book_cards", showBuyButtons: "true" } },
      { id: "reading_order", name: "Reading Order", enabled: true, order: 3, style: { layout: "numbered_timeline" } },
      { id: "author", name: "Meet the Author", enabled: true, order: 4, style: { layout: "centered_bio" } },
      { id: "extras", name: "Bonus Content", enabled: true, order: 5, style: { layout: "extras_grid" } },
      { id: "buy", name: "Get the Series", enabled: true, order: 6, style: { layout: "bundle_option" } }
    ],
    sampleContent: {
      tagline: "The Complete [Series Name] Collection",
      description: "Follow the epic journey across multiple books in this beloved series.",
      ctaText: "Start with Book 1",
      testimonialPlaceholder: "This series has become my all-time favorite! - Amazon Reviewer"
    }
  },
  {
    id: "worldbuilding_fantasy",
    name: "Fantasy Worldbuilding",
    category: "fantasy",
    description: "Immersive template for fantasy authors featuring world maps, character galleries, lore sections, and rich visual storytelling",
    previewImageUrl: "/templates/worldbuilding-fantasy.jpg",
    theme: {
      primaryColor: "#6B4423",
      accentColor: "#8B7355",
      backgroundColor: "#F5F0E8",
      textColor: "#3D2914",
      fontFamily: "Crimson Pro, serif",
      headingFont: "Uncial Antiqua, cursive"
    },
    layout: {
      heroStyle: "full_cover",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "world_intro", "map", "races", "magic", "characters", "books", "author"]
    },
    sections: [
      { id: "hero", name: "Welcome to the Realm", enabled: true, order: 0, style: { layout: "parchment_style" } },
      { id: "world_intro", name: "The World", enabled: true, order: 1, style: { layout: "lore_text" } },
      { id: "map", name: "Interactive Map", enabled: true, order: 2, style: { layout: "map_display", interactive: "true" } },
      { id: "races", name: "Races & Cultures", enabled: true, order: 3, style: { layout: "culture_cards" } },
      { id: "magic", name: "Magic System", enabled: true, order: 4, style: { layout: "magic_guide" } },
      { id: "characters", name: "Characters", enabled: true, order: 5, style: { layout: "character_gallery" } },
      { id: "books", name: "The Saga", enabled: true, order: 6, style: { layout: "timeline_books" } },
      { id: "author", name: "The Chronicler", enabled: true, order: 7, style: { layout: "fantasy_bio" } }
    ],
    sampleContent: {
      tagline: "Enter a world of magic and wonder",
      description: "Discover the rich tapestry of lands, peoples, and ancient mysteries waiting to be explored.",
      ctaText: "Begin Your Adventure",
      testimonialPlaceholder: "The worldbuilding in this series is absolutely incredible! - Goodreads"
    }
  },
  {
    id: "horror_thriller",
    name: "Dark Horror",
    category: "thriller",
    description: "Spine-chilling dark theme for horror and thriller authors with atmospheric design and suspenseful elements",
    previewImageUrl: "/templates/horror-thriller.jpg",
    theme: {
      primaryColor: "#8B0000",
      accentColor: "#4A0000",
      backgroundColor: "#0A0A0A",
      textColor: "#C8C8C8",
      fontFamily: "Bitter, serif",
      headingFont: "Nosifer, cursive"
    },
    layout: {
      heroStyle: "full_cover",
      navigationStyle: "hidden",
      sectionOrder: ["hero", "tagline", "books", "excerpt", "author", "reviews", "newsletter"]
    },
    sections: [
      { id: "hero", name: "The Cover", enabled: true, order: 0, style: { layout: "horror_reveal" } },
      { id: "tagline", name: "The Hook", enabled: true, order: 1, style: { layout: "dramatic_quote" } },
      { id: "books", name: "Nightmares", enabled: true, order: 2, style: { layout: "dark_grid" } },
      { id: "excerpt", name: "Read If You Dare", enabled: true, order: 3, style: { layout: "scary_excerpt" } },
      { id: "author", name: "The Author", enabled: true, order: 4, style: { layout: "shadowy_bio" } },
      { id: "reviews", name: "What Readers Say", enabled: true, order: 5, style: { layout: "horror_quotes" } },
      { id: "newsletter", name: "Enter the Darkness", enabled: true, order: 6, style: { layout: "creepy_signup" } }
    ],
    sampleContent: {
      tagline: "Some doors should never be opened",
      description: "A terrifying journey into the darkest corners of the human psyche.",
      ctaText: "Read Now",
      testimonialPlaceholder: "I couldn't sleep for a week. Absolutely terrifying! - Horror Reader"
    }
  },
  {
    id: "scifi_futuristic",
    name: "Sci-Fi Futuristic",
    category: "fiction",
    description: "Sleek futuristic design for science fiction authors with neon accents, tech aesthetics, and space-inspired visuals",
    previewImageUrl: "/templates/scifi-futuristic.jpg",
    theme: {
      primaryColor: "#00D4FF",
      accentColor: "#FF00FF",
      backgroundColor: "#0D1117",
      textColor: "#C9D1D9",
      fontFamily: "Exo 2, sans-serif",
      headingFont: "Orbitron, sans-serif"
    },
    layout: {
      heroStyle: "animated",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "synopsis", "universe", "characters", "technology", "books", "author", "newsletter"]
    },
    sections: [
      { id: "hero", name: "Launch", enabled: true, order: 0, style: { layout: "space_intro", showStars: "true" } },
      { id: "synopsis", name: "The Mission", enabled: true, order: 1, style: { layout: "holographic_text" } },
      { id: "universe", name: "The Universe", enabled: true, order: 2, style: { layout: "galaxy_map" } },
      { id: "characters", name: "The Crew", enabled: true, order: 3, style: { layout: "crew_cards" } },
      { id: "technology", name: "Technology", enabled: true, order: 4, style: { layout: "tech_showcase" } },
      { id: "books", name: "The Series", enabled: true, order: 5, style: { layout: "book_timeline" } },
      { id: "author", name: "The Creator", enabled: true, order: 6, style: { layout: "futuristic_bio" } },
      { id: "newsletter", name: "Join the Fleet", enabled: true, order: 7, style: { layout: "comm_signup" } }
    ],
    sampleContent: {
      tagline: "The future of humanity hangs in the balance",
      description: "A thrilling space opera that explores the boundaries of human evolution and interstellar conflict.",
      ctaText: "Launch Sequence",
      testimonialPlaceholder: "The best sci-fi I've read in years! - Sci-Fi Magazine"
    }
  },
  {
    id: "creator_blog",
    name: "Creator Blog",
    category: "author_portfolio",
    description: "Modern blog-focused template for digital creators with sidebar navigation, quick facts, and social integration",
    previewImageUrl: "/templates/creator-blog.jpg",
    theme: {
      primaryColor: "#2D2D2D",
      accentColor: "#E8E8E8",
      backgroundColor: "#FAFAFA",
      textColor: "#2D2D2D",
      fontFamily: "Inter, sans-serif",
      headingFont: "DM Sans, sans-serif"
    },
    layout: {
      heroStyle: "split",
      navigationStyle: "sidebar",
      sectionOrder: ["hero", "quick_facts", "about", "blog", "books", "social", "newsletter"]
    },
    sections: [
      { id: "hero", name: "Hey, I'm...", enabled: true, order: 0, style: { layout: "personal_intro", showPhoto: "true" } },
      { id: "quick_facts", name: "Quick-fire Facts", enabled: true, order: 1, style: { layout: "fact_grid" } },
      { id: "about", name: "About", enabled: true, order: 2, style: { layout: "casual_bio" } },
      { id: "blog", name: "Blog", enabled: true, order: 3, style: { layout: "post_grid", showCategories: "true" } },
      { id: "books", name: "My Books", enabled: true, order: 4, style: { layout: "book_cards" } },
      { id: "social", name: "Social", enabled: true, order: 5, style: { layout: "social_links" } },
      { id: "newsletter", name: "Stay in the Loop", enabled: true, order: 6, style: { layout: "simple_signup" } }
    ],
    sampleContent: {
      tagline: "Hey, I'm [Name]",
      description: "I'm a writer and digital creator sharing what I learn about building an independent career online.",
      ctaText: "Learn More",
      testimonialPlaceholder: "Your content has been so helpful on my own writing journey! - Reader"
    }
  },
  {
    id: "luxury_moody",
    name: "Luxury Moody",
    category: "memoir",
    description: "Elegant dark luxury template with moody aesthetics, sophisticated typography, and premium feel",
    previewImageUrl: "/templates/luxury-moody.jpg",
    theme: {
      primaryColor: "#C9B89A",
      accentColor: "#8B7355",
      backgroundColor: "#1E1E1E",
      textColor: "#E8E4DF",
      fontFamily: "Cormorant Garamond, serif",
      headingFont: "Marcellus, serif"
    },
    layout: {
      heroStyle: "full_cover",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "story", "gallery", "chapters", "author", "press", "order"]
    },
    sections: [
      { id: "hero", name: "The Journey", enabled: true, order: 0, style: { layout: "dramatic_dark", showOverlay: "true" } },
      { id: "story", name: "The Story", enabled: true, order: 1, style: { layout: "elegant_text" } },
      { id: "gallery", name: "Photo Gallery", enabled: true, order: 2, style: { layout: "masonry_dark" } },
      { id: "chapters", name: "Inside", enabled: true, order: 3, style: { layout: "chapter_preview" } },
      { id: "author", name: "The Author", enabled: true, order: 4, style: { layout: "portrait_bio" } },
      { id: "press", name: "Press & Reviews", enabled: true, order: 5, style: { layout: "elegant_quotes" } },
      { id: "order", name: "Order Now", enabled: true, order: 6, style: { layout: "premium_cta" } }
    ],
    sampleContent: {
      tagline: "A memoir of transformation",
      description: "Through darkness and into light. A story of passion, loss, and finding purpose.",
      ctaText: "Pre-Order Now",
      testimonialPlaceholder: "Absolutely stunning. A memoir that will stay with you forever. - Literary Review"
    }
  },
  {
    id: "writer_workspace",
    name: "Writer Workspace",
    category: "author_portfolio",
    description: "Clean, productivity-focused template for writers showcasing their writing process, tools, and resources",
    previewImageUrl: "/templates/writer-workspace.jpg",
    theme: {
      primaryColor: "#5C6BC0",
      accentColor: "#7986CB",
      backgroundColor: "#FFFFFF",
      textColor: "#37474F",
      fontFamily: "Source Sans Pro, sans-serif",
      headingFont: "Source Serif Pro, serif"
    },
    layout: {
      heroStyle: "minimal",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "writing_journey", "books", "process", "resources", "newsletter"]
    },
    sections: [
      { id: "hero", name: "Welcome", enabled: true, order: 0, style: { layout: "clean_intro" } },
      { id: "writing_journey", name: "My Writing Journey", enabled: true, order: 1, style: { layout: "timeline" } },
      { id: "books", name: "Published Works", enabled: true, order: 2, style: { layout: "book_showcase" } },
      { id: "process", name: "Writing Process", enabled: true, order: 3, style: { layout: "step_cards" } },
      { id: "resources", name: "Resources for Writers", enabled: true, order: 4, style: { layout: "resource_grid" } },
      { id: "newsletter", name: "Writing Tips Newsletter", enabled: true, order: 5, style: { layout: "signup_with_preview" } }
    ],
    sampleContent: {
      tagline: "Words are my craft",
      description: "Exploring the art and business of writing. Tips, tools, and resources for fellow writers.",
      ctaText: "Get Writing Tips",
      testimonialPlaceholder: "A treasure trove of writing wisdom! - Fellow Author"
    }
  },
  {
    id: "cozy_reader",
    name: "Cozy Reader",
    category: "fiction",
    description: "Warm, inviting template for cozy fiction genres like cozy mystery, romance, and women's fiction",
    previewImageUrl: "/templates/cozy-reader.jpg",
    theme: {
      primaryColor: "#D4A574",
      accentColor: "#E8D5C4",
      backgroundColor: "#FFF8F0",
      textColor: "#5D4E46",
      fontFamily: "Lora, serif",
      headingFont: "Merriweather, serif"
    },
    layout: {
      heroStyle: "split",
      navigationStyle: "sticky",
      sectionOrder: ["hero", "about_book", "series", "author", "reading_guide", "newsletter", "buy"]
    },
    sections: [
      { id: "hero", name: "Welcome", enabled: true, order: 0, style: { layout: "warm_welcome", showTeacup: "true" } },
      { id: "about_book", name: "About the Book", enabled: true, order: 1, style: { layout: "cozy_description" } },
      { id: "series", name: "The Series", enabled: true, order: 2, style: { layout: "series_cards" } },
      { id: "author", name: "Meet the Author", enabled: true, order: 3, style: { layout: "friendly_bio" } },
      { id: "reading_guide", name: "Reading Guide", enabled: true, order: 4, style: { layout: "discussion_questions" } },
      { id: "newsletter", name: "Cozy Newsletter", enabled: true, order: 5, style: { layout: "warm_signup" } },
      { id: "buy", name: "Get Your Copy", enabled: true, order: 6, style: { layout: "cozy_cta" } }
    ],
    sampleContent: {
      tagline: "Curl up with a good book",
      description: "A heartwarming tale perfect for cozy nights with a cup of tea.",
      ctaText: "Order Your Copy",
      testimonialPlaceholder: "The perfect cozy read! I devoured it in one sitting. - Book Blogger"
    }
  },
  {
    id: "business_data_driven",
    name: "Data-Driven Business",
    category: "business",
    description: "Professional template with built-in charts, graphs, dashboards, and data visualization for business books",
    previewImageUrl: "/templates/business-data-driven.jpg",
    theme: {
      primaryColor: "#2563EB",
      accentColor: "#3B82F6",
      backgroundColor: "#F8FAFC",
      textColor: "#1E293B",
      fontFamily: "Inter, sans-serif",
      headingFont: "Plus Jakarta Sans, sans-serif"
    },
    layout: {
      heroStyle: "minimal",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "key_metrics", "problem", "framework", "case_studies", "chapters", "author", "results", "buy"]
    },
    sections: [
      { id: "hero", name: "Data-Backed Results", enabled: true, order: 0, style: { layout: "stats_hero", showMetrics: "true" } },
      { id: "key_metrics", name: "Key Metrics", enabled: true, order: 1, style: { layout: "dashboard_cards", chartTypes: "bar,line,pie" } },
      { id: "problem", name: "The Data Problem", enabled: true, order: 2, style: { layout: "stats_comparison", showCharts: "true" } },
      { id: "framework", name: "The Framework", enabled: true, order: 3, style: { layout: "process_diagram", showBullets: "true" } },
      { id: "case_studies", name: "Case Studies", enabled: true, order: 4, style: { layout: "results_charts", showROI: "true" } },
      { id: "chapters", name: "Chapter Overview", enabled: true, order: 5, style: { layout: "numbered_list" } },
      { id: "author", name: "About the Expert", enabled: true, order: 6, style: { layout: "credentials" } },
      { id: "results", name: "Reader Results", enabled: true, order: 7, style: { layout: "testimonial_metrics" } },
      { id: "buy", name: "Get the Data", enabled: true, order: 8, style: { showBonuses: "true" } }
    ],
    sampleContent: {
      tagline: "Data-driven decisions. Exponential growth.",
      description: "Transform your business with proven, data-backed strategies that have generated over $500M in results.",
      ctaText: "Get the Framework",
      testimonialPlaceholder: "The ROI from implementing these strategies was 340% in the first year. - CFO, Fortune 500"
    }
  },
  {
    id: "business_consultant",
    name: "Consultant Authority",
    category: "business",
    description: "Premium consulting-focused template with frameworks, process diagrams, and professional credibility elements",
    previewImageUrl: "/templates/business-consultant.jpg",
    theme: {
      primaryColor: "#0F172A",
      accentColor: "#C9941A",
      backgroundColor: "#FFFFFF",
      textColor: "#334155",
      fontFamily: "Source Sans Pro, sans-serif",
      headingFont: "Playfair Display, serif"
    },
    layout: {
      heroStyle: "split",
      navigationStyle: "sticky",
      sectionOrder: ["hero", "logos", "problem", "methodology", "results", "chapters", "author", "speaking", "buy"]
    },
    sections: [
      { id: "hero", name: "Consulting Authority", enabled: true, order: 0, style: { layout: "authority_split", showAwards: "true" } },
      { id: "logos", name: "Featured In", enabled: true, order: 1, style: { layout: "logo_bar" } },
      { id: "problem", name: "The Challenge", enabled: true, order: 2, style: { layout: "bullet_points", showIcons: "true" } },
      { id: "methodology", name: "The Methodology", enabled: true, order: 3, style: { layout: "process_flow", showDiagram: "true" } },
      { id: "results", name: "Client Results", enabled: true, order: 4, style: { layout: "case_study_cards", showMetrics: "true" } },
      { id: "chapters", name: "The Framework", enabled: true, order: 5, style: { layout: "chapter_cards" } },
      { id: "author", name: "About the Author", enabled: true, order: 6, style: { layout: "thought_leader" } },
      { id: "speaking", name: "Book the Author", enabled: true, order: 7, style: { layout: "speaking_cta" } },
      { id: "buy", name: "Get the Book", enabled: true, order: 8, style: { showBulkPricing: "true" } }
    ],
    sampleContent: {
      tagline: "The definitive framework for business transformation",
      description: "Proven methodologies from working with 200+ Fortune 500 companies. Now available in book form.",
      ctaText: "Order Your Copy",
      testimonialPlaceholder: "Essential reading for every executive. - Harvard Business Review"
    }
  },
  {
    id: "business_workbook",
    name: "Interactive Workbook",
    category: "business",
    description: "Workbook-style template with interactive elements, exercises, checklists, and progress tracking",
    previewImageUrl: "/templates/business-workbook.jpg",
    theme: {
      primaryColor: "#7C3AED",
      accentColor: "#A78BFA",
      backgroundColor: "#FAF5FF",
      textColor: "#4C1D95",
      fontFamily: "Nunito, sans-serif",
      headingFont: "DM Sans, sans-serif"
    },
    layout: {
      heroStyle: "minimal",
      navigationStyle: "sticky",
      sectionOrder: ["hero", "preview", "modules", "exercises", "bonuses", "author", "guarantee", "buy"]
    },
    sections: [
      { id: "hero", name: "Your Workbook", enabled: true, order: 0, style: { layout: "playful", showPages: "true" } },
      { id: "preview", name: "Sample Pages", enabled: true, order: 1, style: { layout: "page_gallery", showInteractive: "true" } },
      { id: "modules", name: "Workbook Modules", enabled: true, order: 2, style: { layout: "module_cards", showProgress: "true" } },
      { id: "exercises", name: "Exercises Inside", enabled: true, order: 3, style: { layout: "exercise_list", showChecklists: "true" } },
      { id: "bonuses", name: "Bonus Materials", enabled: true, order: 4, style: { layout: "bonus_cards" } },
      { id: "author", name: "Your Guide", enabled: true, order: 5, style: { layout: "friendly_expert" } },
      { id: "guarantee", name: "Satisfaction Guarantee", enabled: true, order: 6, style: { layout: "guarantee_badge" } },
      { id: "buy", name: "Get Your Workbook", enabled: true, order: 7, style: { showFormats: "true" } }
    ],
    sampleContent: {
      tagline: "Learn by doing. Achieve by completing.",
      description: "This interactive workbook takes you step-by-step through proven exercises to transform your business.",
      ctaText: "Get the Workbook",
      testimonialPlaceholder: "I filled every page and it changed my business. - Entrepreneur"
    }
  },
  {
    id: "notion_tracker",
    name: "Notion-Style Tracker",
    category: "non_fiction",
    description: "Clean, minimal design inspired by Notion with navigation sidebar, database-like layouts, and structured content",
    previewImageUrl: "/templates/notion-tracker.jpg",
    theme: {
      primaryColor: "#37352F",
      accentColor: "#2383E2",
      backgroundColor: "#FFFFFF",
      textColor: "#37352F",
      fontFamily: "Inter, sans-serif",
      headingFont: "Inter, sans-serif"
    },
    layout: {
      heroStyle: "minimal",
      navigationStyle: "sidebar",
      sectionOrder: ["hero", "navigation", "content", "chapters", "resources", "author", "newsletter"]
    },
    sections: [
      { id: "hero", name: "Welcome", enabled: true, order: 0, style: { layout: "notion_header", showIcon: "true" } },
      { id: "navigation", name: "Quick Navigation", enabled: true, order: 1, style: { layout: "sidebar_nav" } },
      { id: "content", name: "Book Content", enabled: true, order: 2, style: { layout: "database_view" } },
      { id: "chapters", name: "Chapters", enabled: true, order: 3, style: { layout: "table_view", showTags: "true" } },
      { id: "resources", name: "Resources", enabled: true, order: 4, style: { layout: "link_cards" } },
      { id: "author", name: "About", enabled: true, order: 5, style: { layout: "minimal_bio" } },
      { id: "newsletter", name: "Stay Updated", enabled: true, order: 6, style: { layout: "simple_form" } }
    ],
    sampleContent: {
      tagline: "Your Complete Guide",
      description: "Navigate through this comprehensive resource with ease. Everything you need, organized beautifully.",
      ctaText: "Start Reading",
      testimonialPlaceholder: "So well organized. I can find anything instantly. - Reader"
    }
  },
  {
    id: "bookstore_publisher",
    name: "Publisher Bookstore",
    category: "author_portfolio",
    description: "Professional bookstore design for publishers and multi-book authors with bestseller sections and e-commerce",
    previewImageUrl: "/templates/bookstore-publisher.jpg",
    theme: {
      primaryColor: "#C9941A",
      accentColor: "#F59E0B",
      backgroundColor: "#FFFBEB",
      textColor: "#1C1917",
      fontFamily: "Libre Baskerville, serif",
      headingFont: "Playfair Display, serif"
    },
    layout: {
      heroStyle: "full_cover",
      navigationStyle: "fixed",
      sectionOrder: ["hero", "bestsellers", "new_releases", "categories", "featured_author", "newsletter", "shop"]
    },
    sections: [
      { id: "hero", name: "Featured Book", enabled: true, order: 0, style: { layout: "promo_banner" } },
      { id: "bestsellers", name: "Bestsellers", enabled: true, order: 1, style: { layout: "book_carousel" } },
      { id: "new_releases", name: "New Releases", enabled: true, order: 2, style: { layout: "book_grid" } },
      { id: "categories", name: "Browse by Category", enabled: true, order: 3, style: { layout: "category_cards" } },
      { id: "featured_author", name: "Featured Author", enabled: true, order: 4, style: { layout: "author_spotlight" } },
      { id: "newsletter", name: "Book Club", enabled: true, order: 5, style: { layout: "newsletter_signup" } },
      { id: "shop", name: "Shop All", enabled: true, order: 6, style: { layout: "shop_grid" } }
    ],
    sampleContent: {
      tagline: "Discover Your Next Great Read",
      description: "Award-winning books across every genre. Find your perfect story today.",
      ctaText: "Shop Now",
      testimonialPlaceholder: "The best selection of quality books online. - Avid Reader"
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
