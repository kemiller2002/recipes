---
title:
slug:
description:
servings:
yield:
prepTime:
cookTime:
totalTime:
difficulty:
source:
author:

search:
  cuisines: []
  courses: []
  mealTypes: []
  cookingMethods: []
  primaryIngredients: []
  dietaryTags: []
  occasions: []
  collections: []
  keywords: []
  relatedRecipes: []
  makeAhead: null
  freezerFriendly: null
  reheatsWell: null

structure:
  hasSubRecipes: false
  subRecipes: []
---

# Recipe Title

Short summary of the finished dish, what makes it useful, and how it should be understood in the collection.

## Snapshot

- Yield:
- Prep Time:
- Cook Time:
- Total Time:
- Difficulty:
- Best For:

## Why This Works

- Key texture point
- Key flavor point
- Key service or use-case point

---

## Main Recipe

Optional one-line note about the base recipe or primary component.

### Ingredients

-

### Equipment

- Primary cooking vessel
- Heat source
- Specialty tools

### Steps

1.

---

## Sub-Recipe Name

Use a new `##` section for each component, topping, filling, sauce, garnish, or service element.

### Yield

- Optional

### Ingredients

-

### Equipment

- Optional

### Steps

1.

---

## Assembly

Use this section when multiple sub-recipes need to come together at service time.

1.

---

## Optional Variations

- Variation idea
- Ingredient swap
- Service variation

---

## Make-Ahead, Storage, and Reheating

- Make-Ahead:
- Refrigerator:
- Freezer:
- Reheating:

---

## Serving Suggestions

- Garnish ideas
- Suggested pairings
- When to serve it

---

## Notes

- Anything uncertain
- Testing notes
- Classification edge cases that should be reflected in metadata

---

## Template Rules

- Keep the frontmatter filled in. Use `null` only when the value is truly unknown.
- Keep `search.*` values in lowercase kebab-case so they can map cleanly into search metadata later.
- Set `structure.hasSubRecipes: true` and list slugs in `structure.subRecipes` when the recipe contains distinct components.
- Treat each `##` section as a display card in the rendered recipe page.
- Use `## Main Recipe` for the base dish and one `## ...` block per sub-recipe, topping, sauce, garnish, or assembly stage.
- Within each `##` block, prefer `### Ingredients`, `### Equipment`, `### Steps`, `### Yield`, or `### Notes`.
- Put the short summary directly under `# Recipe Title`; do not hide it later in the file.
- Keep service/storage details in their dedicated section rather than scattering them through notes.
