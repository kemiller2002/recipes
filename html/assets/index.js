const recipes = JSON.parse(document.getElementById("recipe-data").textContent);

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
  return count === 1 ? `${count} ${noun}` : `${count} ${noun}s`;
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
    counts[`${facetKey}:${value}`] = count;
  }

  return counts;
}

function renderActiveFilters() {
  const pills = [];

  if (state.search) {
    pills.push(`<span class="active-filter">Search: ${state.search}<button type="button" data-clear-search>&times;</button></span>`);
  }

  for (const toggle of state.toggles) {
    pills.push(`<span class="active-filter">${formatSlug(toggle)}<button type="button" data-clear-toggle="${toggle}">&times;</button></span>`);
  }

  for (const [facetKey, values] of Object.entries(state.facets)) {
    for (const value of values) {
      pills.push(
        `<span class="active-filter">${formatSlug(value)}<button type="button" data-clear-facet="${facetKey}" data-clear-value="${value}">&times;</button></span>`
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
    items.push(`${recipe.metadata.totalTimeMinutes} min`);
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
    els.entries.innerHTML = `<div class="empty-state">
      <h3>No recipes match this combination.</h3>
      <p>Try removing a facet or broadening the text search.</p>
    </div>`;
    return;
  }

  els.entries.innerHTML = filtered.map((recipe) => {
    const badges = badgeList(recipe)
      .map((value) => `<span>${value}</span>`)
      .join("");

    const tags = tagList(recipe)
      .map((value) => `<span>${formatSlug(value)}</span>`)
      .join("");

    const booleans = [];
    if (recipe.booleans.weeknightFriendly) booleans.push("Weeknight");
    if (recipe.booleans.specialOccasion) booleans.push("Special Occasion");
    if (recipe.booleans.freezerFriendly) booleans.push("Freezer Friendly");
    if (recipe.booleans.hasSubRecipes) booleans.push("Multi-Part");

    return `<a class="recipe-card" href="${recipe.href}">
      <div class="recipe-card__topline">
        <span>${(recipe.filters.dishCourses || []).slice(0, 1).map(formatSlug).join(" · ") || "Recipe"}</span>
        <span>•</span>
        <span>${(recipe.filters.primaryIngredients || []).slice(0, 2).map(formatSlug).join(" / ") || "Collection Entry"}</span>
      </div>

      <div>
        <h3 class="recipe-card__title">${recipe.title}</h3>
        <p class="recipe-card__description">${recipe.description}</p>
      </div>

      <div class="card-badges">${badges}</div>
      <div class="card-tags">${tags}</div>
      <div class="card-badges">${booleans.map((value) => `<span>${value}</span>`).join("")}</div>

      <div class="recipe-card__footer">
        <div></div>
        <span class="recipe-card__cta">Open recipe →</span>
      </div>
    </a>`;
  }).join("");
}

function render() {
  const filtered = recipes.filter(recipeMatches).sort(compareRecipes);
  const counts = computeFacetCounts();

  els.resultCount.textContent = `${pluralize(filtered.length, "result")}`;

  for (const button of els.toggleButtons) {
    button.classList.toggle("is-active", state.toggles.has(button.dataset.toggle));
  }

  for (const button of els.facetButtons) {
    const facetKey = button.dataset.facet;
    const value = button.dataset.value;
    const isActive = state.facets[facetKey].has(value);

    button.classList.toggle("is-active", isActive);
    button.disabled = !isActive && counts[`${facetKey}:${value}`] === 0;
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
