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
  const base = makeDefaultRecipe(entry.title, entry.slug, entry.description);
  const merged = mergeDeep(base, entry.classification || {});

  merged.classificationMetadata.classifiedBy = seed.classifiedBy;
  merged.classificationMetadata.classificationDate = seed.classificationDate;
  merged.classificationMetadata.overallConfidence =
    entry.overallConfidence ?? null;
  merged.classificationMetadata.uncertainFields = entry.uncertainFields || [];
  merged.classificationMetadata.notes = entry.notes || null;

  return {
    sourcePath: entry.sourcePath,
    href: entry.href,
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

const recipes = seed.recipes.map(buildRecipeDocument);
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
