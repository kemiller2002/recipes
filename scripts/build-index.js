const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HTML_DIR = path.join(ROOT, "html");
const ASSET_DIR = path.join(HTML_DIR, "assets");
const SEARCH_INDEX_PATH = path.join(
  HTML_DIR,
  "metadata",
  "recipe-search-index.json"
);

fs.mkdirSync(ASSET_DIR, { recursive: true });

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function titleFromSlug(value) {
  return String(value)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function countBy(items, keyFn) {
  const counts = new Map();

  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function uniqueFacetValues(recipes, pathParts) {
  const values = new Set();

  for (const recipe of recipes) {
    let current = recipe;

    for (const part of pathParts) {
      current = current?.[part];
    }

    for (const value of current || []) {
      values.add(value);
    }
  }

  return [...values].sort((a, b) => a.localeCompare(b));
}

function facetSection(title, facetKey, values) {
  if (!values.length) {
    return "";
  }

  const options = values
    .map((value) => {
      const label = escapeHtml(titleFromSlug(value));
      const escapedValue = escapeHtml(value);

      return `        <button class="facet-pill" type="button" data-facet="${facetKey}" data-value="${escapedValue}">
          <span>${label}</span>
          <span class="facet-pill__count" data-count-for="${facetKey}:${escapedValue}"></span>
        </button>`;
    })
    .join("\n");

  return `      <section class="facet-group" aria-labelledby="${facetKey}-heading">
        <div class="facet-group__header">
          <h3 id="${facetKey}-heading">${escapeHtml(title)}</h3>
        </div>
${options}
      </section>`;
}

const data = readJson(SEARCH_INDEX_PATH);
const recipes = data.recipes || [];

const cuisines = uniqueFacetValues(recipes, ["filters", "cuisines"]);
const collections = uniqueFacetValues(recipes, ["filters", "collections"]);
const methods = uniqueFacetValues(recipes, ["filters", "cookingMethods"]);
const courses = uniqueFacetValues(recipes, ["filters", "dishCourses"]);
const occasions = uniqueFacetValues(recipes, ["filters", "occasions"]);

const totalRecipes = recipes.length;
const meatlessCount = recipes.filter(
  (recipe) => recipe.booleans.vegetarian === true
).length;
const quickCount = recipes.filter(
  (recipe) =>
    typeof recipe.metadata.totalTimeMinutes === "number" &&
    recipe.metadata.totalTimeMinutes <= 45
).length;
const specialCount = recipes.filter(
  (recipe) => recipe.booleans.specialOccasion === true
).length;

const topCollections = countBy(
  recipes.flatMap((recipe) => recipe.filters.collections || []),
  (value) => value
)
  .slice(0, 4)
  .map(([value, count]) => {
    return `<li><span>${escapeHtml(titleFromSlug(value))}</span><strong>${count}</strong></li>`;
  })
  .join("");

const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Recipe Atlas</title>
  <meta name="description" content="Search and filter the recipe collection by cuisine, technique, occasion, ingredients, and service style.">
  <link rel="stylesheet" href="assets/index.css">
</head>
<body>
  <main class="page-shell">
    <section class="hero">
      <div class="hero__copy">
        <p class="eyebrow">Recipe Atlas</p>
        <h1>Search the collection like a menu database, not a folder of files.</h1>
        <p class="hero__lede">The homepage now runs on structured recipe classifications, with searchable summaries, faceted filters, and service-oriented metadata.</p>
        <div class="hero__stats">
          <article>
            <span class="hero__stat-value">${totalRecipes}</span>
            <span class="hero__stat-label">classified recipes</span>
          </article>
          <article>
            <span class="hero__stat-value">${quickCount}</span>
            <span class="hero__stat-label">45 minutes or less</span>
          </article>
          <article>
            <span class="hero__stat-value">${meatlessCount}</span>
            <span class="hero__stat-label">vegetarian entries</span>
          </article>
          <article>
            <span class="hero__stat-value">${specialCount}</span>
            <span class="hero__stat-label">special-occasion dishes</span>
          </article>
        </div>
      </div>

      <aside class="hero__panel">
        <h2>Collection signals</h2>
        <ul class="signal-list">
          ${topCollections}
        </ul>
        <p class="hero__panel-note">Cards below are driven by <code>html/metadata/recipe-search-index.json</code>.</p>
      </aside>
    </section>

    <section class="workspace" aria-label="Recipe search workspace">
      <aside class="filters">
        <div class="filters__sticky">
          <div class="filter-search">
            <label class="filter-label" for="search">Search</label>
            <input id="search" type="search" placeholder="Try beef, soup, grill, make-ahead..." autocomplete="off">
          </div>

          <div class="quick-toggles">
            <button class="toggle-chip" type="button" data-toggle="weeknightFriendly">Weeknight</button>
            <button class="toggle-chip" type="button" data-toggle="vegetarian">Vegetarian</button>
            <button class="toggle-chip" type="button" data-toggle="freezerFriendly">Freezer Friendly</button>
            <button class="toggle-chip" type="button" data-toggle="specialOccasion">Special Occasion</button>
            <button class="toggle-chip" type="button" data-toggle="potluckFriendly">Potluck</button>
          </div>

          <div class="sort-row">
            <label class="filter-label" for="sortBy">Sort</label>
            <select id="sortBy">
              <option value="featured">Featured</option>
              <option value="title">Title</option>
              <option value="time">Fastest</option>
              <option value="servings">Servings</option>
              <option value="confidence">Confidence</option>
            </select>
          </div>

          <div class="facet-sections">
${facetSection("Cuisine", "cuisines", cuisines)}
${facetSection("Collection", "collections", collections)}
${facetSection("Method", "cookingMethods", methods)}
${facetSection("Course", "dishCourses", courses)}
${facetSection("Occasion", "occasions", occasions)}
          </div>

          <button id="clearFilters" class="clear-button" type="button">Clear filters</button>
        </div>
      </aside>

      <section class="results">
        <div class="results__toolbar">
          <div>
            <p class="results__label">Visible recipes</p>
            <h2 id="resultCount">${totalRecipes} results</h2>
          </div>
          <div id="activeFilters" class="active-filters" aria-live="polite"></div>
        </div>

        <div id="entries" class="recipe-grid"></div>
      </section>
    </section>
  </main>

  <script id="recipe-data" type="application/json">
${JSON.stringify(recipes, null, 2)}
  </script>
  <script src="assets/index.js"></script>
</body>
</html>
`;

const css = `:root {
  --bg: #f3ede2;
  --bg-strong: #e7dcc8;
  --surface: rgba(255, 251, 245, 0.84);
  --surface-strong: #fffaf2;
  --surface-accent: #fbf1de;
  --ink: #1e1b18;
  --muted: #6f665f;
  --line: rgba(80, 57, 38, 0.16);
  --line-strong: rgba(80, 57, 38, 0.28);
  --accent: #8d3b2e;
  --accent-warm: #d58d39;
  --accent-cool: #285561;
  --success: #355f3b;
  --shadow: 0 22px 70px rgba(58, 39, 18, 0.12);
  --radius-xl: 28px;
  --radius-lg: 22px;
  --radius-md: 16px;
  --radius-sm: 999px;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  color: var(--ink);
  background:
    radial-gradient(circle at top left, rgba(213, 141, 57, 0.24), transparent 28rem),
    radial-gradient(circle at top right, rgba(40, 85, 97, 0.18), transparent 26rem),
    linear-gradient(180deg, #f8f1e6 0%, #f3ede2 42%, #efe6d5 100%);
  font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(141, 59, 46, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(141, 59, 46, 0.03) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.38), transparent 85%);
}

.page-shell {
  width: min(1380px, calc(100% - 28px));
  margin: 0 auto;
  padding: 28px 0 56px;
}

.hero {
  display: grid;
  gap: 18px;
  margin-bottom: 24px;
}

.hero__copy,
.hero__panel,
.filters__sticky,
.results__toolbar,
.recipe-card,
.empty-state {
  border: 1px solid var(--line);
  background: var(--surface);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow);
}

.hero__copy {
  padding: 28px;
  border-radius: var(--radius-xl);
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero h1 {
  margin: 0;
  max-width: 12ch;
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
  font-size: clamp(2.6rem, 7vw, 5.2rem);
  line-height: 0.94;
  letter-spacing: -0.05em;
}

.hero__lede {
  max-width: 62ch;
  margin: 18px 0 0;
  color: var(--muted);
  font-size: 1.03rem;
  line-height: 1.7;
}

.hero__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
  gap: 12px;
  margin-top: 26px;
}

.hero__stats article,
.signal-list li {
  border: 1px solid var(--line);
  background: rgba(255, 250, 242, 0.88);
  border-radius: 18px;
}

.hero__stats article {
  padding: 14px 16px;
}

.hero__stat-value {
  display: block;
  font-family: "Iowan Old Style", Georgia, serif;
  font-size: 2rem;
  line-height: 1;
}

.hero__stat-label {
  display: block;
  margin-top: 6px;
  color: var(--muted);
  font-size: 0.86rem;
}

.hero__panel {
  padding: 22px;
  border-radius: var(--radius-xl);
}

.hero__panel h2 {
  margin: 0 0 16px;
  font-size: 1rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.signal-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.signal-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
}

.signal-list strong {
  color: var(--accent);
}

.hero__panel-note {
  margin: 16px 0 0;
  color: var(--muted);
  font-size: 0.92rem;
}

.workspace {
  display: grid;
  gap: 18px;
}

.filters__sticky {
  padding: 18px;
  border-radius: var(--radius-xl);
}

.filter-label,
.results__label {
  display: block;
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.filter-search input,
.sort-row select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  padding: 14px 15px;
  color: var(--ink);
  font: inherit;
}

.filter-search input:focus,
.sort-row select:focus {
  outline: 2px solid rgba(141, 59, 46, 0.18);
  border-color: var(--accent);
}

.quick-toggles,
.active-filters,
.card-tags,
.card-badges,
.facet-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-toggles {
  margin-top: 16px;
}

.toggle-chip,
.facet-pill,
.active-filter,
.clear-button {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(255, 250, 242, 0.82);
  color: var(--ink);
  font: inherit;
}

.toggle-chip,
.facet-pill,
.clear-button {
  cursor: pointer;
}

.toggle-chip,
.active-filter {
  padding: 9px 13px;
}

.toggle-chip.is-active,
.facet-pill.is-active {
  border-color: transparent;
  background: linear-gradient(135deg, var(--accent), #ab6546);
  color: white;
}

.sort-row {
  margin-top: 16px;
}

.facet-sections {
  margin-top: 22px;
  display: grid;
  gap: 18px;
}

.facet-group {
  gap: 8px;
}

.facet-group__header {
  width: 100%;
}

.facet-group h3 {
  margin: 0 0 2px;
  font-size: 0.95rem;
}

.facet-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 11px;
}

.facet-pill__count {
  min-width: 1.6em;
  padding: 2px 7px;
  border-radius: var(--radius-sm);
  background: rgba(40, 85, 97, 0.12);
  color: var(--accent-cool);
  font-size: 0.78rem;
  text-align: center;
}

.facet-pill.is-active .facet-pill__count {
  background: rgba(255, 255, 255, 0.18);
  color: white;
}

.clear-button {
  width: 100%;
  margin-top: 24px;
  padding: 12px 14px;
}

.results {
  min-width: 0;
}

.results__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
  padding: 18px 20px;
  border-radius: var(--radius-xl);
}

.results__toolbar h2 {
  margin: 0;
  font-family: "Iowan Old Style", Georgia, serif;
  font-size: clamp(1.7rem, 3vw, 2.4rem);
}

.active-filters {
  align-items: center;
  justify-content: flex-end;
}

.active-filter {
  background: rgba(141, 59, 46, 0.08);
}

.active-filter button {
  margin-left: 8px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
}

.recipe-grid {
  display: grid;
  gap: 16px;
}

.recipe-card {
  position: relative;
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: var(--radius-lg);
  color: inherit;
  text-decoration: none;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}

.recipe-card:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong);
  background: rgba(255, 251, 245, 0.96);
}

.recipe-card__topline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.recipe-card__title {
  margin: 0;
  font-family: "Iowan Old Style", Georgia, serif;
  font-size: clamp(1.4rem, 2.5vw, 2rem);
  line-height: 1;
  letter-spacing: -0.03em;
}

.recipe-card__description {
  margin: 0;
  color: var(--muted);
  line-height: 1.65;
}

.card-badges span,
.card-tags span {
  display: inline-flex;
  align-items: center;
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
}

.card-tags span {
  background: var(--surface-accent);
}

.recipe-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
}

.recipe-card__cta {
  color: var(--accent);
  font-weight: 700;
}

.empty-state {
  padding: 28px;
  border-radius: var(--radius-xl);
}

.empty-state h3 {
  margin: 0 0 8px;
  font-size: 1.3rem;
}

.empty-state p {
  margin: 0;
  color: var(--muted);
}

@media (min-width: 900px) {
  .hero {
    grid-template-columns: 2fr minmax(280px, 0.9fr);
  }

  .workspace {
    grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
    align-items: start;
  }

  .filters__sticky {
    position: sticky;
    top: 20px;
  }

  .recipe-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 899px) {
  .page-shell {
    width: min(100%, calc(100% - 18px));
    padding-top: 18px;
  }

  .hero__copy,
  .hero__panel,
  .filters__sticky,
  .results__toolbar,
  .recipe-card,
  .empty-state {
    border-radius: 22px;
  }

  .results__toolbar {
    align-items: flex-start;
  }
}
`;

const js = `const recipes = JSON.parse(document.getElementById("recipe-data").textContent);

const state = {
  search: "",
  sortBy: "featured",
  toggles: new Set(),
  facets: {
    cuisines: new Set(),
    collections: new Set(),
    cookingMethods: new Set(),
    dishCourses: new Set(),
    occasions: new Set()
  }
};

const els = {
  search: document.getElementById("search"),
  sortBy: document.getElementById("sortBy"),
  clearFilters: document.getElementById("clearFilters"),
  resultCount: document.getElementById("resultCount"),
  activeFilters: document.getElementById("activeFilters"),
  entries: document.getElementById("entries"),
  toggleButtons: [...document.querySelectorAll("[data-toggle]")],
  facetButtons: [...document.querySelectorAll("[data-facet]")],
  countLabels: [...document.querySelectorAll("[data-count-for]")]
};

function formatSlug(value) {
  return String(value)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function pluralize(count, noun) {
  return count === 1 ? \`\${count} \${noun}\` : \`\${count} \${noun}s\`;
}

function recipeMatches(recipe, facetOverrides) {
  const query = state.search.trim().toLowerCase();

  if (query && !recipe.searchText.toLowerCase().includes(query)) {
    return false;
  }

  for (const toggleKey of state.toggles) {
    if (recipe.booleans[toggleKey] !== true) {
      return false;
    }
  }

  const activeFacets = facetOverrides || state.facets;

  for (const [facetKey, selectedValues] of Object.entries(activeFacets)) {
    if (!selectedValues.size) {
      continue;
    }

    const recipeValues = recipe.filters[facetKey] || [];

    if (![...selectedValues].every((value) => recipeValues.includes(value))) {
      return false;
    }
  }

  return true;
}

function compareRecipes(a, b) {
  if (state.sortBy === "title") {
    return a.title.localeCompare(b.title);
  }

  if (state.sortBy === "time") {
    return (a.metadata.totalTimeMinutes ?? Number.MAX_SAFE_INTEGER) -
      (b.metadata.totalTimeMinutes ?? Number.MAX_SAFE_INTEGER) ||
      a.title.localeCompare(b.title);
  }

  if (state.sortBy === "servings") {
    return (b.metadata.estimatedServings ?? -1) -
      (a.metadata.estimatedServings ?? -1) ||
      a.title.localeCompare(b.title);
  }

  if (state.sortBy === "confidence") {
    return (b.metadata.confidence ?? 0) - (a.metadata.confidence ?? 0) ||
      a.title.localeCompare(b.title);
  }

  const featuredScore = (recipe) => {
    let score = recipe.metadata.confidence || 0;
    if (recipe.booleans.weeknightFriendly) score += 0.22;
    if (recipe.booleans.specialOccasion) score += 0.1;
    if (recipe.filters.collections?.includes("comfort-food")) score += 0.08;
    if (typeof recipe.metadata.totalTimeMinutes === "number") {
      score += Math.max(0, 0.18 - recipe.metadata.totalTimeMinutes / 500);
    }
    return score;
  };

  return featuredScore(b) - featuredScore(a) || a.title.localeCompare(b.title);
}

function computeFacetCounts() {
  const counts = {};

  for (const button of els.facetButtons) {
    const facetKey = button.dataset.facet;
    const value = button.dataset.value;
    const scopedFacets = {};

    for (const [key, values] of Object.entries(state.facets)) {
      scopedFacets[key] = new Set(values);
    }

    scopedFacets[facetKey].add(value);

    const count = recipes.filter((recipe) => recipeMatches(recipe, scopedFacets)).length;
    counts[\`\${facetKey}:\${value}\`] = count;
  }

  return counts;
}

function renderActiveFilters() {
  const pills = [];

  if (state.search) {
    pills.push(\`<span class="active-filter">Search: \${state.search}<button type="button" data-clear-search>&times;</button></span>\`);
  }

  for (const toggle of state.toggles) {
    pills.push(\`<span class="active-filter">\${formatSlug(toggle)}<button type="button" data-clear-toggle="\${toggle}">&times;</button></span>\`);
  }

  for (const [facetKey, values] of Object.entries(state.facets)) {
    for (const value of values) {
      pills.push(
        \`<span class="active-filter">\${formatSlug(value)}<button type="button" data-clear-facet="\${facetKey}" data-clear-value="\${value}">&times;</button></span>\`
      );
    }
  }

  els.activeFilters.innerHTML = pills.join("");
}

function badgeList(recipe) {
  const items = [];

  if (recipe.filters.cuisines?.length) {
    items.push(formatSlug(recipe.filters.cuisines[0]));
  }

  if (recipe.metadata.totalTimeMinutes) {
    items.push(\`\${recipe.metadata.totalTimeMinutes} min\`);
  }

  if (recipe.metadata.estimatedServings) {
    items.push(pluralize(recipe.metadata.estimatedServings, "serving"));
  }

  if (recipe.metadata.difficulty) {
    items.push(formatSlug(recipe.metadata.difficulty));
  }

  return items.slice(0, 4);
}

function tagList(recipe) {
  return [
    ...(recipe.filters.flavorProfiles || []),
    ...(recipe.filters.cookingMethods || []),
    ...(recipe.filters.collections || [])
  ].slice(0, 5);
}

function renderCards(filtered) {
  if (!filtered.length) {
    els.entries.innerHTML = \`<div class="empty-state">
      <h3>No recipes match this combination.</h3>
      <p>Try removing a facet or broadening the text search.</p>
    </div>\`;
    return;
  }

  els.entries.innerHTML = filtered.map((recipe) => {
    const badges = badgeList(recipe)
      .map((value) => \`<span>\${value}</span>\`)
      .join("");

    const tags = tagList(recipe)
      .map((value) => \`<span>\${formatSlug(value)}</span>\`)
      .join("");

    const booleans = [];
    if (recipe.booleans.weeknightFriendly) booleans.push("Weeknight");
    if (recipe.booleans.specialOccasion) booleans.push("Special Occasion");
    if (recipe.booleans.freezerFriendly) booleans.push("Freezer Friendly");
    if (recipe.booleans.hasSubRecipes) booleans.push("Multi-Part");

    return \`<a class="recipe-card" href="\${recipe.href}">
      <div class="recipe-card__topline">
        <span>\${(recipe.filters.dishCourses || []).slice(0, 1).map(formatSlug).join(" · ") || "Recipe"}</span>
        <span>•</span>
        <span>\${(recipe.filters.primaryIngredients || []).slice(0, 2).map(formatSlug).join(" / ") || "Collection Entry"}</span>
      </div>

      <div>
        <h3 class="recipe-card__title">\${recipe.title}</h3>
        <p class="recipe-card__description">\${recipe.description}</p>
      </div>

      <div class="card-badges">\${badges}</div>
      <div class="card-tags">\${tags}</div>
      <div class="card-badges">\${booleans.map((value) => \`<span>\${value}</span>\`).join("")}</div>

      <div class="recipe-card__footer">
        <div></div>
        <span class="recipe-card__cta">Open recipe →</span>
      </div>
    </a>\`;
  }).join("");
}

function render() {
  const filtered = recipes.filter(recipeMatches).sort(compareRecipes);
  const counts = computeFacetCounts();

  els.resultCount.textContent = \`\${pluralize(filtered.length, "result")}\`;

  for (const button of els.toggleButtons) {
    button.classList.toggle("is-active", state.toggles.has(button.dataset.toggle));
  }

  for (const button of els.facetButtons) {
    const facetKey = button.dataset.facet;
    const value = button.dataset.value;
    const isActive = state.facets[facetKey].has(value);

    button.classList.toggle("is-active", isActive);
    button.disabled = !isActive && counts[\`\${facetKey}:\${value}\`] === 0;
  }

  for (const label of els.countLabels) {
    label.textContent = counts[label.dataset.countFor] ?? 0;
  }

  renderActiveFilters();
  renderCards(filtered);
}

els.search.addEventListener("input", (event) => {
  state.search = event.target.value.trim();
  render();
});

els.sortBy.addEventListener("change", (event) => {
  state.sortBy = event.target.value;
  render();
});

for (const button of els.toggleButtons) {
  button.addEventListener("click", () => {
    const key = button.dataset.toggle;
    if (state.toggles.has(key)) {
      state.toggles.delete(key);
    } else {
      state.toggles.add(key);
    }
    render();
  });
}

for (const button of els.facetButtons) {
  button.addEventListener("click", () => {
    const facetKey = button.dataset.facet;
    const value = button.dataset.value;
    const set = state.facets[facetKey];

    if (set.has(value)) {
      set.delete(value);
    } else {
      set.add(value);
    }

    render();
  });
}

els.clearFilters.addEventListener("click", () => {
  state.search = "";
  state.sortBy = "featured";
  state.toggles.clear();

  for (const set of Object.values(state.facets)) {
    set.clear();
  }

  els.search.value = "";
  els.sortBy.value = "featured";
  render();
});

els.activeFilters.addEventListener("click", (event) => {
  const clearSearch = event.target.closest("[data-clear-search]");
  if (clearSearch) {
    state.search = "";
    els.search.value = "";
    render();
    return;
  }

  const toggleButton = event.target.closest("[data-clear-toggle]");
  if (toggleButton) {
    state.toggles.delete(toggleButton.dataset.clearToggle);
    render();
    return;
  }

  const facetButton = event.target.closest("[data-clear-facet]");
  if (facetButton) {
    state.facets[facetButton.dataset.clearFacet].delete(facetButton.dataset.clearValue);
    render();
  }
});

render();
`;

fs.writeFileSync(path.join(HTML_DIR, "index.html"), indexHtml);
fs.writeFileSync(path.join(ASSET_DIR, "index.css"), css);
fs.writeFileSync(path.join(ASSET_DIR, "index.js"), js);

console.log(`Generated html/index.html with ${recipes.length} recipes`);
