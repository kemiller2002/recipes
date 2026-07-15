const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "html", "metadata");
const SEED_PATH = path.join(ROOT, "data", "recipe-classification-seed.json");
const FULL_OUTPUT_PATH = path.join(OUTPUT_DIR, "recipe-classifications.json");
const SEARCH_OUTPUT_PATH = path.join(OUTPUT_DIR, "recipe-search-index.json");

const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function parseScalar(rawValue) {
  const value = rawValue.trim();

  if (value === "null") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "[]") return [];

  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];

    return inner
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        if (
          (item.startsWith('"') && item.endsWith('"')) ||
          (item.startsWith("'") && item.endsWith("'"))
        ) {
          return item.slice(1, -1);
        }

        return item;
      });
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  return value;
}

function parseSimpleYaml(yamlText) {
  const root = {};
  const stack = [{ indent: -1, value: root }];

  for (const rawLine of yamlText.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith("#")) {
      continue;
    }

    const match = rawLine.match(/^(\s*)([^:]+):(.*)$/);
    if (!match) {
      continue;
    }

    const indent = match[1].length;
    const key = match[2].trim();
    const rawValue = match[3];

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].value;
    const trimmedValue = rawValue.trim();

    if (!trimmedValue) {
      parent[key] = {};
      stack.push({ indent, value: parent[key] });
      continue;
    }

    parent[key] = parseScalar(trimmedValue);
  }

  return root;
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) {
    return { data: {}, content: markdown };
  }

  return {
    data: parseSimpleYaml(match[1]),
    content: markdown.slice(match[0].length)
  };
}

function stripMarkdownInline(value) {
  return String(value)
    .replace(/[*_`~]/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .trim();
}

function getTitleFromBody(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? stripMarkdownInline(match[1]) : null;
}

function getDescriptionFromBody(markdown) {
  const lines = markdown.split(/\r?\n/);
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
      if (buffer.length) {
        break;
      }
      continue;
    }

    if (/^---+$/.test(line)) {
      if (buffer.length) {
        break;
      }
      continue;
    }

    if (line.startsWith("#")) {
      if (buffer.length) {
        break;
      }
      continue;
    }

    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      if (buffer.length) {
        break;
      }
      continue;
    }

    buffer.push(stripMarkdownInline(line));
  }

  return buffer.join(" ").trim() || null;
}

function parseRangeAverage(value) {
  if (!value) return null;

  const normalized = String(value)
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/½/g, ".5")
    .replace(/¼/g, ".25")
    .replace(/¾/g, ".75")
    .replace(/⅓/g, ".33")
    .replace(/⅔/g, ".67");

  const numbers = [...normalized.matchAll(/(\d+(?:\.\d+)?)/g)].map((match) =>
    Number(match[1])
  );

  if (!numbers.length) {
    return null;
  }

  if (numbers.length >= 2 && normalized.includes("-")) {
    return Math.round((numbers[0] + numbers[1]) / 2);
  }

  return Math.round(numbers[0]);
}

function parseDurationMinutes(value) {
  if (!value) return null;

  const normalized = String(value)
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/½/g, ".5")
    .replace(/¼/g, ".25")
    .replace(/¾/g, ".75");

  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*hour/);
  const minuteMatch = normalized.match(/(\d+(?:\.\d+)?)\s*minute/);

  if (hourMatch || minuteMatch) {
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
    return Math.round(hours * 60 + minutes);
  }

  return parseRangeAverage(normalized);
}

function buildMarkdownClassificationPatch(frontmatter) {
  const search = frontmatter.search || {};
  const patch = {
    identity: {},
    culinaryClassification: {},
    techniqueClassification: {},
    dietaryClassification: {},
    difficultyAndTime: {},
    occasionClassification: {},
    serviceAndStorage: {},
    searchAndOrganization: {}
  };

  if (frontmatter.title) patch.identity.title = frontmatter.title;
  if (frontmatter.slug) patch.identity.slug = frontmatter.slug;
  if (frontmatter.description) patch.identity.description = frontmatter.description;
  if (frontmatter.author) patch.identity.author = frontmatter.author;

  if (frontmatter.source) {
    patch.identity.source = {
      type: "unknown",
      name: frontmatter.source,
      url: null
    };
  }

  if (Array.isArray(search.cuisines) && search.cuisines.length) {
    patch.culinaryClassification.cuisines = search.cuisines;
  }
  if (Array.isArray(search.courses) && search.courses.length) {
    patch.culinaryClassification.dishCourses = search.courses;
  }
  if (Array.isArray(search.mealTypes) && search.mealTypes.length) {
    patch.culinaryClassification.mealTypes = search.mealTypes;
  }
  if (Array.isArray(search.primaryIngredients) && search.primaryIngredients.length) {
    patch.culinaryClassification.primaryIngredientCategories =
      search.primaryIngredients;
  }
  if (Array.isArray(search.cookingMethods) && search.cookingMethods.length) {
    patch.techniqueClassification.primaryCookingMethods = search.cookingMethods;
  }
  if (Array.isArray(search.dietaryTags) && search.dietaryTags.length) {
    patch.dietaryClassification.dietaryPatterns = search.dietaryTags;
  }
  if (Array.isArray(search.occasions) && search.occasions.length) {
    patch.occasionClassification.occasions = search.occasions;
  }
  if (Array.isArray(search.collections) && search.collections.length) {
    patch.searchAndOrganization.collectionNames = search.collections;
  }
  if (Array.isArray(search.keywords) && search.keywords.length) {
    patch.searchAndOrganization.keywords = search.keywords;
  }
  if (Array.isArray(search.relatedRecipes) && search.relatedRecipes.length) {
    patch.searchAndOrganization.relatedRecipes = search.relatedRecipes;
  }

  if (search.makeAhead !== undefined && search.makeAhead !== null) {
    patch.difficultyAndTime.makeAheadSuitability = search.makeAhead
      ? "high"
      : "low";
  }
  if (search.freezerFriendly !== undefined) {
    patch.difficultyAndTime.freezerFriendly = search.freezerFriendly;
  }
  if (search.reheatsWell !== undefined) {
    patch.difficultyAndTime.reheatsWell = search.reheatsWell;
  }

  if (frontmatter.difficulty) {
    patch.difficultyAndTime.difficulty = frontmatter.difficulty;
  }

  if (frontmatter.prepTime) {
    patch.difficultyAndTime.activeTimeMinutes = parseDurationMinutes(
      frontmatter.prepTime
    );
  }

  if (frontmatter.cookTime) {
    patch.difficultyAndTime.inactiveTimeMinutes = parseDurationMinutes(
      frontmatter.cookTime
    );
  }

  if (frontmatter.totalTime) {
    patch.difficultyAndTime.totalTimeMinutes = parseDurationMinutes(
      frontmatter.totalTime
    );
  } else {
    const active = patch.difficultyAndTime.activeTimeMinutes;
    const inactive = patch.difficultyAndTime.inactiveTimeMinutes;

    if (typeof active === "number" && typeof inactive === "number") {
      patch.difficultyAndTime.totalTimeMinutes = active + inactive;
    }
  }

  if (frontmatter.servings) {
    patch.serviceAndStorage.estimatedServings = parseRangeAverage(
      frontmatter.servings
    );
  }

  if (frontmatter.yield) {
    patch.serviceAndStorage.yieldType = String(frontmatter.yield)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
  } else if (frontmatter.servings) {
    patch.serviceAndStorage.yieldType = "servings";
  }

  return patch;
}

function mergeDeep(base, override) {
  if (Array.isArray(base) || Array.isArray(override)) {
    return override === undefined ? clone(base) : clone(override);
  }

  if (
    base &&
    override &&
    typeof base === "object" &&
    typeof override === "object"
  ) {
    const result = { ...clone(base) };

    for (const [key, value] of Object.entries(override)) {
      if (key in result) {
        result[key] = mergeDeep(result[key], value);
      } else {
        result[key] = clone(value);
      }
    }

    return result;
  }

  return override === undefined ? clone(base) : clone(override);
}

function compact(values) {
  return [...new Set(values.flat().filter(Boolean))];
}

function makeDefaultRecipe(title, slug, description) {
  return {
    identity: {
      title,
      slug,
      description,
      source: {
        type: "unknown",
        name: null,
        url: null
      },
      author: null,
      version: seed.schemaVersion
    },
    culinaryClassification: {
      cuisines: [],
      regionalCuisines: [],
      culturalInfluences: [],
      recipeTypes: [],
      dishCourses: [],
      mealTypes: [],
      menuRoles: [],
      cookingStyles: [],
      primaryIngredientCategories: [],
      featuredIngredients: [],
      flavorProfiles: [],
      textureProfiles: [],
      temperatureServed: [],
      servingFormats: []
    },
    techniqueClassification: {
      primaryCookingMethods: [],
      secondaryCookingMethods: [],
      preparationTechniques: [],
      equipmentRequired: [],
      preservationMethods: [],
      fermentationType: null
    },
    dietaryClassification: {
      dietaryPatterns: [],
      containsMeat: null,
      containsSeafood: null,
      vegetarian: null,
      vegan: null,
      glutenFree: null,
      dairyFree: null,
      eggFree: null,
      nutFree: null,
      alcoholFree: null,
      lowCarb: null,
      ketoCompatible: null,
      paleoCompatible: null
    },
    allergenClassification: {
      contains: [],
      mayContain: [],
      substitutionPossible: []
    },
    difficultyAndTime: {
      difficulty: null,
      skillLevel: null,
      activeTimeMinutes: null,
      inactiveTimeMinutes: null,
      totalTimeMinutes: null,
      makeAheadSuitability: null,
      makeAheadMaximumHours: null,
      freezerFriendly: null,
      reheatsWell: null,
      overnightRestRequired: null
    },
    occasionClassification: {
      occasions: [],
      seasons: [],
      holidays: [],
      eventTypes: [],
      competitionSuitable: null,
      competitionCategories: [],
      crowdFriendly: null,
      weeknightFriendly: null,
      specialOccasion: null
    },
    serviceAndStorage: {
      yieldType: null,
      estimatedServings: null,
      batchSize: null,
      bestServed: [],
      holdingSuitability: null,
      maximumHoldingMinutes: null,
      storageMethods: [],
      refrigeratedShelfLifeDays: null,
      frozenShelfLifeDays: null,
      transportability: null,
      picnicFriendly: null,
      potluckFriendly: null
    },
    sensoryClassification: {
      sweetnessLevel: null,
      saltinessLevel: null,
      acidityLevel: null,
      bitternessLevel: null,
      umamiLevel: null,
      richnessLevel: null,
      smokeLevel: null,
      heatLevel: null,
      spiceIntensity: null,
      dominantAromas: [],
      dominantFlavors: [],
      contrastingFlavors: []
    },
    ingredientAndCost: {
      ingredientCount: null,
      ingredientAvailability: null,
      specialtyIngredients: [],
      usesLeftovers: null,
      leftoverIngredientsUsed: [],
      budgetLevel: null,
      estimatedCostPerServing: null
    },
    recipeStructure: {
      componentCount: null,
      components: [],
      hasSubRecipes: null,
      requiresAssembly: null,
      requiresGarnish: null,
      garnishes: [],
      optionalComponents: []
    },
    qualityAndUse: {
      testedStatus: null,
      rating: null,
      familyFavorite: null,
      competitionResult: null,
      competitionPlacement: null,
      needsRevision: null,
      revisionNotes: null
    },
    searchAndOrganization: {
      keywords: [],
      additionalTags: [],
      relatedRecipes: [],
      pairsWith: [],
      collectionNames: []
    },
    classificationMetadata: {
      classifiedBy: seed.classifiedBy,
      classificationDate: seed.classificationDate,
      overallConfidence: null,
      uncertainFields: [],
      notes: null
    }
  };
}

function buildRecipeDocument(entry) {
  const sourcePath = path.join(ROOT, entry.sourcePath);
  const rawMarkdown = fileExists(sourcePath)
    ? fs.readFileSync(sourcePath, "utf8")
    : "";
  const { data: frontmatter, content } = parseFrontmatter(rawMarkdown);

  const markdownTitle = frontmatter.title || getTitleFromBody(content);
  const markdownDescription =
    frontmatter.description || getDescriptionFromBody(content);
  const derivedTitle = markdownTitle || entry.title;
  const derivedSlug =
    frontmatter.slug || entry.slug || path.basename(entry.sourcePath, ".md");
  const derivedDescription = markdownDescription || entry.description;

  const base = makeDefaultRecipe(derivedTitle, derivedSlug, derivedDescription);
  const markdownPatch = buildMarkdownClassificationPatch(frontmatter);
  const merged = mergeDeep(
    mergeDeep(base, entry.classification || {}),
    markdownPatch
  );

  merged.identity.title = derivedTitle;
  merged.identity.slug = derivedSlug;
  merged.identity.description = derivedDescription;

  merged.classificationMetadata.classifiedBy = seed.classifiedBy;
  merged.classificationMetadata.classificationDate = seed.classificationDate;
  merged.classificationMetadata.overallConfidence =
    entry.overallConfidence ?? null;
  merged.classificationMetadata.uncertainFields = entry.uncertainFields || [];
  merged.classificationMetadata.notes = entry.notes || null;

  return {
    sourcePath: entry.sourcePath,
    href: entry.href || `${derivedSlug}.html`,
    recipeClassification: merged
  };
}

function buildSearchDocument(recipe) {
  const doc = recipe.recipeClassification;
  const searchTerms = compact([
    doc.identity.title,
    doc.identity.slug,
    doc.identity.description,
    doc.culinaryClassification.cuisines,
    doc.culinaryClassification.regionalCuisines,
    doc.culinaryClassification.culturalInfluences,
    doc.culinaryClassification.recipeTypes,
    doc.culinaryClassification.dishCourses,
    doc.culinaryClassification.mealTypes,
    doc.culinaryClassification.menuRoles,
    doc.culinaryClassification.cookingStyles,
    doc.culinaryClassification.primaryIngredientCategories,
    doc.culinaryClassification.featuredIngredients,
    doc.culinaryClassification.flavorProfiles,
    doc.culinaryClassification.textureProfiles,
    doc.culinaryClassification.temperatureServed,
    doc.techniqueClassification.primaryCookingMethods,
    doc.techniqueClassification.secondaryCookingMethods,
    doc.techniqueClassification.preparationTechniques,
    doc.techniqueClassification.equipmentRequired,
    doc.occasionClassification.occasions,
    doc.occasionClassification.seasons,
    doc.occasionClassification.eventTypes,
    doc.sensoryClassification.dominantAromas,
    doc.sensoryClassification.dominantFlavors,
    doc.recipeStructure.components,
    doc.recipeStructure.garnishes,
    doc.searchAndOrganization.keywords,
    doc.searchAndOrganization.additionalTags,
    doc.searchAndOrganization.collectionNames
  ]);

  return {
    id: doc.identity.slug,
    title: doc.identity.title,
    slug: doc.identity.slug,
    description: doc.identity.description,
    href: recipe.href,
    sourcePath: recipe.sourcePath,
    searchText: searchTerms.join(" "),
    filters: {
      cuisines: doc.culinaryClassification.cuisines,
      recipeTypes: doc.culinaryClassification.recipeTypes,
      dishCourses: doc.culinaryClassification.dishCourses,
      mealTypes: doc.culinaryClassification.mealTypes,
      menuRoles: doc.culinaryClassification.menuRoles,
      cookingStyles: doc.culinaryClassification.cookingStyles,
      primaryIngredients: doc.culinaryClassification.primaryIngredientCategories,
      featuredIngredients: doc.culinaryClassification.featuredIngredients,
      flavorProfiles: doc.culinaryClassification.flavorProfiles,
      textureProfiles: doc.culinaryClassification.textureProfiles,
      temperatureServed: doc.culinaryClassification.temperatureServed,
      cookingMethods: compact([
        doc.techniqueClassification.primaryCookingMethods,
        doc.techniqueClassification.secondaryCookingMethods
      ]),
      equipment: doc.techniqueClassification.equipmentRequired,
      allergens: doc.allergenClassification.contains,
      dietaryPatterns: doc.dietaryClassification.dietaryPatterns,
      occasions: doc.occasionClassification.occasions,
      seasons: doc.occasionClassification.seasons,
      eventTypes: doc.occasionClassification.eventTypes,
      collections: doc.searchAndOrganization.collectionNames,
      tags: doc.searchAndOrganization.additionalTags
    },
    booleans: {
      containsMeat: doc.dietaryClassification.containsMeat,
      containsSeafood: doc.dietaryClassification.containsSeafood,
      vegetarian: doc.dietaryClassification.vegetarian,
      vegan: doc.dietaryClassification.vegan,
      glutenFree: doc.dietaryClassification.glutenFree,
      dairyFree: doc.dietaryClassification.dairyFree,
      eggFree: doc.dietaryClassification.eggFree,
      nutFree: doc.dietaryClassification.nutFree,
      freezerFriendly: doc.difficultyAndTime.freezerFriendly,
      reheatsWell: doc.difficultyAndTime.reheatsWell,
      crowdFriendly: doc.occasionClassification.crowdFriendly,
      weeknightFriendly: doc.occasionClassification.weeknightFriendly,
      specialOccasion: doc.occasionClassification.specialOccasion,
      potluckFriendly: doc.serviceAndStorage.potluckFriendly,
      picnicFriendly: doc.serviceAndStorage.picnicFriendly,
      hasSubRecipes: doc.recipeStructure.hasSubRecipes,
      requiresAssembly: doc.recipeStructure.requiresAssembly
    },
    sort: {
      title: doc.identity.title,
      totalTimeMinutes: doc.difficultyAndTime.totalTimeMinutes,
      estimatedServings: doc.serviceAndStorage.estimatedServings
    },
    metadata: {
      difficulty: doc.difficultyAndTime.difficulty,
      skillLevel: doc.difficultyAndTime.skillLevel,
      totalTimeMinutes: doc.difficultyAndTime.totalTimeMinutes,
      estimatedServings: doc.serviceAndStorage.estimatedServings,
      confidence: doc.classificationMetadata.overallConfidence
    }
  };
}

function getRecipeMarkdownFiles() {
  return fs
    .readdirSync(path.join(ROOT, "recipes"))
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.join("recipes", file))
    .sort();
}

const seedEntriesBySourcePath = new Map(
  seed.recipes.map((entry) => [entry.sourcePath, entry])
);

const recipeEntries = getRecipeMarkdownFiles().map((sourcePath) => {
  const seedEntry = seedEntriesBySourcePath.get(sourcePath);

  if (seedEntry) {
    return seedEntry;
  }

  const slug = path.basename(sourcePath, ".md");
  return {
    slug,
    title: null,
    description: null,
    sourcePath,
    href: `${slug}.html`,
    overallConfidence: 0.65,
    uncertainFields: [
      "classification-inferred-from-markdown-only"
    ],
    classification: {}
  };
});

const recipes = recipeEntries.map(buildRecipeDocument);
const searchIndex = recipes.map(buildSearchDocument);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

fs.writeFileSync(
  FULL_OUTPUT_PATH,
  JSON.stringify(
    {
      schemaVersion: seed.schemaVersion,
      generatedAt: seed.classificationDate,
      recipeCount: recipes.length,
      recipes
    },
    null,
    2
  )
);

fs.writeFileSync(
  SEARCH_OUTPUT_PATH,
  JSON.stringify(
    {
      schemaVersion: seed.schemaVersion,
      generatedAt: seed.classificationDate,
      recipeCount: searchIndex.length,
      fields: {
        id: "stable slug",
        title: "display title",
        description: "short summary for cards and search results",
        searchText: "flattened text blob for client-side search",
        filters: "structured arrays for faceted filtering",
        booleans: "fast exact-match toggles",
        metadata: "sort and ranking support"
      },
      recipes: searchIndex
    },
    null,
    2
  )
);

console.log(`Generated ${path.relative(ROOT, FULL_OUTPUT_PATH)}`);
console.log(`Generated ${path.relative(ROOT, SEARCH_OUTPUT_PATH)}`);
