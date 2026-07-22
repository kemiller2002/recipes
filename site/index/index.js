(async function () {
  const FACET_CONFIG = [
    { key: "cuisines", label: "Cuisine" },
    { key: "collections", label: "Collection" },
    { key: "cookingMethods", label: "Method" },
    { key: "dishCourses", label: "Course" },
    { key: "occasions", label: "Occasion" },
  ];

  const QUICK_TOGGLES = [
    { key: "weeknightFriendly", label: "Weeknight" },
    { key: "vegetarian", label: "Vegetarian" },
    { key: "freezerFriendly", label: "Freezer Friendly" },
    { key: "specialOccasion", label: "Special Occasion" },
    { key: "potluckFriendly", label: "Potluck" },
  ];

  const state = {
    recipes: [],
    search: "",
    sortBy: "featured",
    toggles: new Set(),
    facets: Object.fromEntries(FACET_CONFIG.map((facet) => [facet.key, new Set()])),
    facetValues: {},
  };

  const els = {
    heroStats: document.getElementById("heroStats"),
    collectionSignals: document.getElementById("collectionSignals"),
    dataNote: document.getElementById("dataNote"),
    filterToggle: document.getElementById("filterToggle"),
    filterClose: document.getElementById("filterClose"),
    filterBackdrop: document.getElementById("filterBackdrop"),
    filterPanel: document.getElementById("filterPanel"),
    search: document.getElementById("search"),
    sortBy: document.getElementById("sortBy"),
    quickToggles: document.getElementById("quickToggles"),
    facetSections: document.getElementById("facetSections"),
    clearFilters: document.getElementById("clearFilters"),
    resultCount: document.getElementById("resultCount"),
    activeFilters: document.getElementById("activeFilters"),
    entries: document.getElementById("entries"),
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

  function uniqueSortedValues(recipes, keyPath) {
    const values = new Set();

    for (const recipe of recipes) {
      let current = recipe;
      for (const key of keyPath) {
        current = current?.[key];
      }
      for (const value of current || []) {
        values.add(value);
      }
    }

    return [...values].sort((a, b) => a.localeCompare(b));
  }

  function topCollections(recipes) {
    const counts = new Map();

    for (const recipe of recipes) {
      for (const collection of recipe.filters.collections || []) {
        counts.set(collection, (counts.get(collection) || 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5);
  }

  function setPanelOpen(isOpen) {
    if (window.innerWidth >= 900) {
      return;
    }

    els.filterPanel.classList.toggle("is-open", isOpen);
    els.filterBackdrop.hidden = !isOpen;
    els.filterToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("filters-open", isOpen);
  }

  function activeFilterCount() {
    let count = state.search ? 1 : 0;
    count += state.toggles.size;
    for (const values of Object.values(state.facets)) {
      count += values.size;
    }
    return count;
  }

  function updateFilterToggleLabel() {
    const count = activeFilterCount();
    els.filterToggle.textContent = count ? `Filters (${count})` : "Filters";
  }

  function createHeroStats(recipes) {
    const quickCount = recipes.filter(
      (recipe) =>
        typeof recipe.metadata.totalTimeMinutes === "number" &&
        recipe.metadata.totalTimeMinutes <= 45,
    ).length;

    const meatlessCount = recipes.filter(
      (recipe) => recipe.booleans.vegetarian === true,
    ).length;

    const specialCount = recipes.filter(
      (recipe) => recipe.booleans.specialOccasion === true,
    ).length;

    const stats = [
      { value: recipes.length, label: "metadata-backed recipes" },
      { value: quickCount, label: "45 minutes or less" },
      { value: meatlessCount, label: "vegetarian recipes" },
      { value: specialCount, label: "special-occasion dishes" },
    ];

    const fragment = document.createDocumentFragment();
    for (const stat of stats) {
      const card = document.createElement("article");
      const value = document.createElement("span");
      value.className = "hero__stat-value";
      value.textContent = stat.value;
      const label = document.createElement("span");
      label.className = "hero__stat-label";
      label.textContent = stat.label;
      card.append(value, label);
      fragment.appendChild(card);
    }
    els.heroStats.replaceChildren(fragment);
  }

  function createCollectionSignals(recipes) {
    const fragment = document.createDocumentFragment();
    for (const [collection, count] of topCollections(recipes)) {
      const item = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = formatSlug(collection);
      const value = document.createElement("strong");
      value.textContent = count;
      item.append(label, value);
      fragment.appendChild(item);
    }
    els.collectionSignals.replaceChildren(fragment);
  }

  function createQuickToggles() {
    const fragment = document.createDocumentFragment();

    for (const toggle of QUICK_TOGGLES) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "toggle-chip";
      button.dataset.toggle = toggle.key;
      button.textContent = toggle.label;
      button.addEventListener("click", () => {
        if (state.toggles.has(toggle.key)) {
          state.toggles.delete(toggle.key);
        } else {
          state.toggles.add(toggle.key);
        }
        render();
      });
      fragment.appendChild(button);
    }

    els.quickToggles.replaceChildren(fragment);
  }

  function createFacetSections() {
    const fragment = document.createDocumentFragment();

    for (const facet of FACET_CONFIG) {
      const values = state.facetValues[facet.key] || [];
      if (!values.length) continue;

      const section = document.createElement("section");
      section.className = "facet-group";

      const header = document.createElement("div");
      header.className = "facet-group__header";
      const title = document.createElement("h4");
      title.textContent = facet.label;
      header.appendChild(title);
      section.appendChild(header);

      for (const value of values) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "facet-pill";
        button.dataset.facet = facet.key;
        button.dataset.value = value;

        const label = document.createElement("span");
        label.textContent = formatSlug(value);
        const count = document.createElement("span");
        count.className = "facet-pill__count";
        count.dataset.countFor = `${facet.key}:${value}`;

        button.append(label, count);
        button.addEventListener("click", () => {
          const set = state.facets[facet.key];
          if (set.has(value)) {
            set.delete(value);
          } else {
            set.add(value);
          }
          render();
        });

        section.appendChild(button);
      }

      fragment.appendChild(section);
    }

    els.facetSections.replaceChildren(fragment);
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
      if (!selectedValues.size) continue;
      const recipeValues = recipe.filters[facetKey] || [];
      const hasAny = [...selectedValues].some((value) => recipeValues.includes(value));
      if (!hasAny) return false;
    }

    return true;
  }

  function featuredScore(recipe) {
    let score = recipe.metadata.confidence || 0;
    if (recipe.booleans.weeknightFriendly) score += 0.2;
    if (recipe.booleans.specialOccasion) score += 0.08;
    if (recipe.filters.collections?.includes("comfort-food")) score += 0.05;
    if (typeof recipe.metadata.totalTimeMinutes === "number") {
      score += Math.max(0, 0.16 - recipe.metadata.totalTimeMinutes / 520);
    }
    return score;
  }

  function compareRecipes(a, b) {
    switch (state.sortBy) {
      case "title":
        return a.title.localeCompare(b.title);
      case "time":
        return (
          (a.metadata.totalTimeMinutes ?? Number.MAX_SAFE_INTEGER) -
          (b.metadata.totalTimeMinutes ?? Number.MAX_SAFE_INTEGER) ||
          a.title.localeCompare(b.title)
        );
      case "servings":
        return (
          (b.metadata.estimatedServings ?? -1) -
          (a.metadata.estimatedServings ?? -1) ||
          a.title.localeCompare(b.title)
        );
      case "confidence":
        return (
          (b.metadata.confidence ?? 0) -
          (a.metadata.confidence ?? 0) ||
          a.title.localeCompare(b.title)
        );
      default:
        return featuredScore(b) - featuredScore(a) || a.title.localeCompare(b.title);
    }
  }

  function computeFacetCounts() {
    const counts = {};

    for (const facet of FACET_CONFIG) {
      for (const value of state.facetValues[facet.key] || []) {
        const scopedFacets = {};
        for (const [key, values] of Object.entries(state.facets)) {
          scopedFacets[key] = new Set(values);
        }
        scopedFacets[facet.key].add(value);
        counts[`${facet.key}:${value}`] = state.recipes.filter((recipe) =>
          recipeMatches(recipe, scopedFacets),
        ).length;
      }
    }

    return counts;
  }

  function renderActiveFilters() {
    els.activeFilters.replaceChildren();

    function appendPill(label, onClear) {
      const pill = document.createElement("span");
      pill.className = "active-filter";
      pill.textContent = label;
      const clear = document.createElement("button");
      clear.type = "button";
      clear.textContent = "×";
      clear.addEventListener("click", onClear);
      pill.appendChild(clear);
      els.activeFilters.appendChild(pill);
    }

    if (state.search) {
      appendPill(`Search: ${state.search}`, () => {
        state.search = "";
        els.search.value = "";
        render();
      });
    }

    for (const toggle of state.toggles) {
      appendPill(formatSlug(toggle), () => {
        state.toggles.delete(toggle);
        render();
      });
    }

    for (const [facetKey, values] of Object.entries(state.facets)) {
      for (const value of values) {
        appendPill(formatSlug(value), () => {
          state.facets[facetKey].delete(value);
          render();
        });
      }
    }
  }

  function createBadge(text) {
    const el = document.createElement("span");
    el.textContent = text;
    return el;
  }

  function renderCards(filtered) {
    els.entries.replaceChildren();

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      const title = document.createElement("h3");
      title.textContent = "No recipes match this combination.";
      const detail = document.createElement("p");
      detail.textContent = "Try removing a facet or broadening the text search.";
      empty.append(title, detail);
      els.entries.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();

    for (const recipe of filtered) {
      const card = document.createElement("a");
      card.className = "recipe-card";
      card.href = recipe.href;

      const topline = document.createElement("div");
      topline.className = "recipe-card__topline";
      const course = (recipe.filters.dishCourses || []).slice(0, 1).map(formatSlug).join(" · ") || "Recipe";
      const ingredients = (recipe.filters.primaryIngredients || [])
        .slice(0, 2)
        .map(formatSlug)
        .join(" / ") || "Collection Entry";
      topline.textContent = `${course} • ${ingredients}`;

      const body = document.createElement("div");
      const title = document.createElement("h3");
      title.className = "recipe-card__title";
      title.textContent = recipe.title;
      const description = document.createElement("p");
      description.className = "recipe-card__description";
      description.textContent = recipe.description || "No summary available.";
      body.append(title, description);

      const badges = document.createElement("div");
      badges.className = "card-badges";
      if (recipe.filters.cuisines?.length) {
        badges.appendChild(createBadge(formatSlug(recipe.filters.cuisines[0])));
      }
      if (recipe.metadata.totalTimeMinutes) {
        badges.appendChild(createBadge(`${recipe.metadata.totalTimeMinutes} min`));
      }
      if (recipe.metadata.estimatedServings) {
        badges.appendChild(
          createBadge(pluralize(recipe.metadata.estimatedServings, "serving")),
        );
      }
      if (recipe.metadata.difficulty) {
        badges.appendChild(createBadge(formatSlug(recipe.metadata.difficulty)));
      }

      const tags = document.createElement("div");
      tags.className = "card-tags";
      const tagValues = [
        ...(recipe.filters.flavorProfiles || []),
        ...(recipe.filters.cookingMethods || []),
        ...(recipe.filters.collections || []),
      ].slice(0, 5);
      for (const value of tagValues) {
        tags.appendChild(createBadge(formatSlug(value)));
      }

      const booleanBadges = document.createElement("div");
      booleanBadges.className = "card-badges";
      if (recipe.booleans.weeknightFriendly) {
        booleanBadges.appendChild(createBadge("Weeknight"));
      }
      if (recipe.booleans.specialOccasion) {
        booleanBadges.appendChild(createBadge("Special Occasion"));
      }
      if (recipe.booleans.freezerFriendly) {
        booleanBadges.appendChild(createBadge("Freezer Friendly"));
      }
      if (recipe.booleans.hasSubRecipes) {
        booleanBadges.appendChild(createBadge("Multi-Part"));
      }

      const footer = document.createElement("div");
      footer.className = "recipe-card__footer";
      const spacer = document.createElement("div");
      const cta = document.createElement("span");
      cta.className = "recipe-card__cta";
      cta.textContent = "Open recipe →";
      footer.append(spacer, cta);

      card.append(topline, body, badges, tags, booleanBadges, footer);
      fragment.appendChild(card);
    }

    els.entries.appendChild(fragment);
  }

  function render() {
    const filtered = state.recipes.filter(recipeMatches).sort(compareRecipes);
    const facetCounts = computeFacetCounts();

    els.resultCount.textContent = pluralize(filtered.length, "result");
    updateFilterToggleLabel();

    for (const button of els.quickToggles.querySelectorAll("[data-toggle]")) {
      button.classList.toggle("is-active", state.toggles.has(button.dataset.toggle));
    }

    for (const button of els.facetSections.querySelectorAll("[data-facet]")) {
      const facetKey = button.dataset.facet;
      const value = button.dataset.value;
      const isActive = state.facets[facetKey].has(value);
      button.classList.toggle("is-active", isActive);
      button.disabled = !isActive && facetCounts[`${facetKey}:${value}`] === 0;
      const count = button.querySelector("[data-count-for]");
      if (count) {
        count.textContent = facetCounts[`${facetKey}:${value}`] ?? 0;
      }
    }

    renderActiveFilters();
    renderCards(filtered);
  }

  async function loadData() {
    if (window.RECIPE_INDEX_DATA?.recipes) {
      return window.RECIPE_INDEX_DATA;
    }

    const response = await fetch("metadata/recipe-search-index.json");
    if (!response.ok) {
      throw new Error(`Failed to load recipe metadata (${response.status})`);
    }
    return response.json();
  }

  function setError(message) {
    els.resultCount.textContent = "Unavailable";
    els.entries.innerHTML = `<div class="empty-state"><h3>Recipe index unavailable.</h3><p>${message}</p></div>`;
  }

  els.search.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    render();
  });

  els.sortBy.addEventListener("change", (event) => {
    state.sortBy = event.target.value;
    render();
  });

  els.clearFilters.addEventListener("click", () => {
    state.search = "";
    state.sortBy = "featured";
    state.toggles.clear();
    for (const values of Object.values(state.facets)) {
      values.clear();
    }
    els.search.value = "";
    els.sortBy.value = "featured";
    render();
  });

  els.filterToggle.addEventListener("click", () => setPanelOpen(true));
  els.filterClose.addEventListener("click", () => setPanelOpen(false));
  els.filterBackdrop.addEventListener("click", () => setPanelOpen(false));

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 900) {
      setPanelOpen(false);
    }
  });

  try {
    const data = await loadData();
    state.recipes = Array.isArray(data.recipes) ? data.recipes : [];
    state.facetValues = Object.fromEntries(
      FACET_CONFIG.map((facet) => [
        facet.key,
        uniqueSortedValues(state.recipes, ["filters", facet.key]),
      ]),
    );

    createHeroStats(state.recipes);
    createCollectionSignals(state.recipes);
    createQuickToggles();
    createFacetSections();
    els.dataNote.textContent = `Generated from metadata on ${data.generatedAt}.`;
    render();
  } catch (error) {
    console.error(error);
    setError(error.message);
  }
})();
