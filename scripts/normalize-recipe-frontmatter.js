const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const RECIPES_DIR = path.join(ROOT, "recipes");
const SEED_PATH = path.join(ROOT, "data", "recipe-classification-seed.json");

const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));

const EXTRA_RECIPE_METADATA = {
  "cacao-del-sol-bbq-sauce": {
    description:
      "A competition-style barbecue sauce that layers cacao, chipotle, and dark chocolate without drifting into dessert.",
    yield: "sauce",
    difficulty: "medium",
    search: {
      cuisines: ["fusion"],
      courses: ["condiment"],
      mealTypes: ["dinner"],
      cookingMethods: ["simmer", "blend"],
      primaryIngredients: ["tomato", "chocolate"],
      dietaryTags: [],
      occasions: ["cookout", "competition"],
      collections: ["sauces", "grilling"],
      keywords: ["bbq sauce", "competition sauce", "cacao sauce"],
      relatedRecipes: [],
      makeAhead: true,
      freezerFriendly: false,
      reheatsWell: true
    }
  },
  "mayan-night-bbq-sauce": {
    description:
      "A smoky, cocoa-driven barbecue sauce with chipotle heat and a rounded, dark finish for grilled meats.",
    yield: "sauce",
    difficulty: "easy",
    search: {
      cuisines: ["fusion"],
      courses: ["condiment"],
      mealTypes: ["dinner"],
      cookingMethods: ["simmer", "blend"],
      primaryIngredients: ["tomato", "chocolate"],
      dietaryTags: [],
      occasions: ["cookout"],
      collections: ["sauces", "grilling"],
      keywords: ["bbq sauce", "mayan bbq sauce", "chipotle sauce"],
      relatedRecipes: [],
      makeAhead: true,
      freezerFriendly: false,
      reheatsWell: true
    }
  },
  "mayan-three-cacoa-bbq-sauce": {
    description:
      "A refined barbecue sauce built around cocoa powder, dark chocolate, and cacao nibs for layered bitterness and smoke.",
    yield: "sauce",
    difficulty: "medium",
    search: {
      cuisines: ["fusion"],
      courses: ["condiment"],
      mealTypes: ["dinner"],
      cookingMethods: ["simmer", "blend"],
      primaryIngredients: ["tomato", "chocolate"],
      dietaryTags: [],
      occasions: ["cookout", "competition"],
      collections: ["sauces", "grilling"],
      keywords: ["bbq sauce", "cacao bbq sauce", "competition sauce"],
      relatedRecipes: [],
      makeAhead: true,
      freezerFriendly: false,
      reheatsWell: true
    }
  },
  "sweet-home-chicago-dip": {
    description:
      "A baked Italian beef dip with sweet-pepper, giardiniera, and jus sections inspired by classic Chicago sandwich orders.",
    yield: "dip",
    difficulty: "medium",
    search: {
      cuisines: ["american"],
      courses: ["appetizer"],
      mealTypes: ["party", "dinner"],
      cookingMethods: ["bake"],
      primaryIngredients: ["beef", "dairy"],
      dietaryTags: [],
      occasions: ["game-day", "party"],
      collections: ["party-food", "dips"],
      keywords: ["italian beef dip", "baked dip", "party dip"],
      relatedRecipes: [],
      makeAhead: true,
      freezerFriendly: false,
      reheatsWell: true
    }
  },
  "sweet-home-chicken-itza-sauce": {
    description:
      "A Yucatan-inspired table sauce balancing fire-roasted tomato, cacao, orange, and chipotle.",
    yield: "sauce",
    difficulty: "easy",
    search: {
      cuisines: ["fusion"],
      courses: ["condiment"],
      mealTypes: ["dinner"],
      cookingMethods: ["simmer", "blend"],
      primaryIngredients: ["tomato", "chocolate"],
      dietaryTags: [],
      occasions: ["cookout", "competition"],
      collections: ["sauces", "grilling"],
      keywords: ["table sauce", "yucatan sauce", "cacao sauce"],
      relatedRecipes: [],
      makeAhead: true,
      freezerFriendly: false,
      reheatsWell: true
    }
  }
};

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) {
    return { frontmatter: null, body: markdown };
  }

  return {
    frontmatter: match[1],
    body: markdown.slice(match[0].length)
  };
}

function stripMarkdownInline(value) {
  return String(value)
    .replace(/[*_`~]/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .trim();
}

function titleFromBody(body) {
  const match = body.match(/^#\s+(.+)$/m);
  return match ? stripMarkdownInline(match[1]) : "";
}

function firstParagraphAfterTitle(body) {
  const lines = body.split(/\r?\n/);
  let seenTitle = false;
  const buffer = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!seenTitle) {
      if (line.startsWith("# ")) {
        seenTitle = true;
      }
      continue;
    }

    if (!line) {
      if (buffer.length) break;
      continue;
    }

    if (/^---+$/.test(line) || line.startsWith("#")) {
      if (buffer.length) break;
      continue;
    }

    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      if (buffer.length) break;
      return "";
    }

    buffer.push(stripMarkdownInline(line));
  }

  return buffer.join(" ").trim();
}

function formatMinutes(totalMinutes) {
  if (typeof totalMinutes !== "number" || Number.isNaN(totalMinutes)) {
    return null;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) {
    return `${minutes} minutes`;
  }

  if (!minutes) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }

  const hourLabel = hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hourLabel} ${minutes} minutes`;
}

function yamlValue(value) {
  if (value === null || value === undefined || value === "") {
    return "null";
  }

  if (Array.isArray(value)) {
    return `[${value.join(", ")}]`;
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value).replace(/\n/g, " ").trim();
}

function searchFromSeed(entry) {
  const classification = entry.classification || {};
  const culinary = classification.culinaryClassification || {};
  const technique = classification.techniqueClassification || {};
  const dietary = classification.dietaryClassification || {};
  const occasion = classification.occasionClassification || {};
  const searchAndOrganization = classification.searchAndOrganization || {};
  const difficulty = classification.difficultyAndTime || {};

  return {
    cuisines: culinary.cuisines || [],
    courses: culinary.dishCourses || [],
    mealTypes: culinary.mealTypes || [],
    cookingMethods: technique.primaryCookingMethods || [],
    primaryIngredients: culinary.primaryIngredientCategories || [],
    dietaryTags: dietary.dietaryPatterns || [],
    occasions: occasion.occasions || [],
    collections: searchAndOrganization.collectionNames || [],
    keywords: searchAndOrganization.keywords || [],
    relatedRecipes: searchAndOrganization.relatedRecipes || [],
    makeAhead:
      difficulty.makeAheadSuitability === "high" ||
      difficulty.makeAheadSuitability === "medium"
        ? true
        : difficulty.makeAheadSuitability === "low"
          ? false
          : null,
    freezerFriendly:
      difficulty.freezerFriendly === undefined ? null : difficulty.freezerFriendly,
    reheatsWell:
      difficulty.reheatsWell === undefined ? null : difficulty.reheatsWell
  };
}

function metadataForFile(file) {
  const slug = path.basename(file, ".md");
  const sourcePath = path.join("recipes", file);
  const seedEntry = seed.recipes.find((entry) => entry.sourcePath === sourcePath);
  const extra = EXTRA_RECIPE_METADATA[slug] || null;

  if (seedEntry) {
    const difficulty = seedEntry.classification?.difficultyAndTime || {};
    const service = seedEntry.classification?.serviceAndStorage || {};

    return {
      title: seedEntry.title,
      slug,
      description: seedEntry.description,
      servings: service.estimatedServings
        ? String(service.estimatedServings)
        : null,
      yield: service.yieldType || "servings",
      prepTime: formatMinutes(difficulty.activeTimeMinutes),
      cookTime: formatMinutes(difficulty.inactiveTimeMinutes),
      totalTime: formatMinutes(difficulty.totalTimeMinutes),
      difficulty: difficulty.difficulty || null,
      source: null,
      author: null,
      search: searchFromSeed(seedEntry)
    };
  }

  return {
    title: null,
    slug,
    description: extra?.description || null,
    servings: null,
    yield: extra?.yield || "servings",
    prepTime: null,
    cookTime: null,
    totalTime: null,
    difficulty: extra?.difficulty || null,
    source: null,
    author: null,
    search: extra?.search || {
      cuisines: [],
      courses: [],
      mealTypes: [],
      cookingMethods: [],
      primaryIngredients: [],
      dietaryTags: [],
      occasions: [],
      collections: [],
      keywords: [],
      relatedRecipes: [],
      makeAhead: null,
      freezerFriendly: null,
      reheatsWell: null
    }
  };
}

function buildFrontmatter(meta, fallbackTitle, fallbackDescription, existingBody) {
  const title = meta.title || fallbackTitle;
  const description = meta.description || fallbackDescription || null;

  return [
    "---",
    `title: ${yamlValue(title)}`,
    `slug: ${yamlValue(meta.slug)}`,
    `description: ${yamlValue(description)}`,
    `servings: ${yamlValue(meta.servings)}`,
    `yield: ${yamlValue(meta.yield)}`,
    `prepTime: ${yamlValue(meta.prepTime)}`,
    `cookTime: ${yamlValue(meta.cookTime)}`,
    `totalTime: ${yamlValue(meta.totalTime)}`,
    `difficulty: ${yamlValue(meta.difficulty)}`,
    `source: ${yamlValue(meta.source)}`,
    `author: ${yamlValue(meta.author)}`,
    "",
    "search:",
    `  cuisines: ${yamlValue(meta.search.cuisines)}`,
    `  courses: ${yamlValue(meta.search.courses)}`,
    `  mealTypes: ${yamlValue(meta.search.mealTypes)}`,
    `  cookingMethods: ${yamlValue(meta.search.cookingMethods)}`,
    `  primaryIngredients: ${yamlValue(meta.search.primaryIngredients)}`,
    `  dietaryTags: ${yamlValue(meta.search.dietaryTags)}`,
    `  occasions: ${yamlValue(meta.search.occasions)}`,
    `  collections: ${yamlValue(meta.search.collections)}`,
    `  keywords: ${yamlValue(meta.search.keywords)}`,
    `  relatedRecipes: ${yamlValue(meta.search.relatedRecipes)}`,
    `  makeAhead: ${yamlValue(meta.search.makeAhead)}`,
    `  freezerFriendly: ${yamlValue(meta.search.freezerFriendly)}`,
    `  reheatsWell: ${yamlValue(meta.search.reheatsWell)}`,
    "---",
    ""
  ].join("\n");
}

function ensureDescriptionUnderTitle(body, description) {
  if (!description) {
    return body;
  }

  if (firstParagraphAfterTitle(body)) {
    return body;
  }

  const lines = body.split(/\r?\n/);
  const titleIndex = lines.findIndex((line) => line.trim().startsWith("# "));

  if (titleIndex === -1) {
    return body;
  }

  lines.splice(titleIndex + 1, 0, "", description, "");
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

for (const file of fs.readdirSync(RECIPES_DIR).sort()) {
  if (!file.endsWith(".md")) {
    continue;
  }

  const filePath = path.join(RECIPES_DIR, file);
  const original = fs.readFileSync(filePath, "utf8");
  const { body } = parseFrontmatter(original);
  const meta = metadataForFile(file);
  const fallbackTitle = titleFromBody(body) || meta.slug;
  const fallbackDescription = firstParagraphAfterTitle(body);
  const frontmatter = buildFrontmatter(meta, fallbackTitle, fallbackDescription);
  const normalizedBody = ensureDescriptionUnderTitle(
    body.trimStart(),
    meta.description || fallbackDescription
  );

  fs.writeFileSync(filePath, `${frontmatter}${normalizedBody.trimEnd()}\n`);
  console.log(`Normalized recipes/${file}`);
}
