import fs from "fs";
import path from "path";
import matter from "gray-matter";
import yaml from "js-yaml";
import { marked } from "marked";

const ROOT = "culinary";
const ENTRIES = path.join(ROOT, "entries");
const PEOPLE = path.join(ROOT, "people");
const OUTPUT = "html";
const CSS_SOURCE = path.join(ROOT, "templates", "print.css");
const PRINT_JS_SOURCE = path.join(ROOT, "templates", "print-fit.js");
fs.mkdirSync(OUTPUT, { recursive: true });

function readYaml(filePath) {
  return yaml.load(fs.readFileSync(filePath, "utf8"));
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function findRecipeFiles() {
  return walk(ENTRIES).filter((file) => file.endsWith("recipe.md"));
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function makeOutputName({ division, categorySlug, classFolder, personId }) {
  return `${personId}-${division}-${categorySlug}-${classFolder}.html`;
}

function buildEntry(recipePath) {
  const parts = recipePath.split(path.sep);

  const division = parts[2];
  const categorySlug = parts[3];
  const classFolder = parts[4];
  const personId = parts[5];

  const classPath = path.join(
    ENTRIES,
    division,
    categorySlug,
    classFolder,
    "_class.yml",
  );

  const personPath = path.join(PEOPLE, `${personId}.yml`);

  if (!fs.existsSync(classPath)) {
    throw new Error(`Missing class file: ${classPath}`);
  }

  if (!fs.existsSync(personPath)) {
    throw new Error(`Missing person file: ${personPath}`);
  }

  const classInfo = readYaml(classPath);
  const person = readYaml(personPath);
  const household = readYaml(path.join(PEOPLE, `${person.household}.yml`));

  const rawRecipe = fs.readFileSync(recipePath, "utf8");
  const parsed = matter(rawRecipe);

  const title = parsed.data.title || "Untitled Recipe";
  const servings = parsed.data.servings || "";
  const prepTime = parsed.data.prepTime || "";
  const cookTime = parsed.data.cookTime || "";

  const recipeHtml = marked.parse(parsed.content);

  const mainBody = `<header class="fair-header">

      <h1>${escapeHtml(title)}</h1>

      <dl class="entry-meta">
        <div>
          <dt>Entry #</dt>
          <dd>${escapeHtml(classInfo.classNumber)}</dd>
        </div>

        <div>
          <dt>Category</dt>
          <dd>${escapeHtml(classInfo.category)}</dd>
        </div>

        <div>
          <dt>Class</dt>
          <dd>${escapeHtml(classInfo.classNumber)} - ${escapeHtml(classInfo.className)}</dd>
        </div>
      </dl>

      <dl class="recipe-meta">
        <div>
          <dt>Servings</dt>
          <dd>${escapeHtml(servings)}</dd>
        </div>

        <div>
          <dt>Prep Time</dt>
          <dd>${escapeHtml(prepTime)}</dd>
        </div>

        <div>
          <dt>Cook Time</dt>
          <dd>${escapeHtml(cookTime)}</dd>
        </div>
      </dl>
    </header>

    <section class="recipe-body">
      ${recipeHtml}
    </section>

    <footer class="entrant-footer">
      <p>${escapeHtml(person.name)}</p>
      <p>${escapeHtml(household.address)}</p>
      <p>${escapeHtml(household.city)}, ${escapeHtml(household.state)} ${escapeHtml(household.zip)}</p>
      <p>${escapeHtml(person.phone)}</p>
      <p>${escapeHtml(household.email)}</p>
    </footer>`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="./print.css" />
</head>
<body>
  <main class="entry-sheet">
    ${mainBody}
  </main>
  <script src="print-fit.js"></script>
</body>
</html>`;

  const outFile = path.join(
    OUTPUT,
    makeOutputName({ division, categorySlug, classFolder, personId }),
  );

  fs.writeFileSync(outFile, html);
  console.log(`Generated ${outFile}`);
}

if (fs.existsSync(CSS_SOURCE)) {
  fs.copyFileSync(CSS_SOURCE, path.join(OUTPUT, "print.css"));
}

if (fs.existsSync(PRINT_JS_SOURCE)) {
  fs.copyFileSync(PRINT_JS_SOURCE, path.join(OUTPUT, "print-fit.js"));
}

for (const recipeFile of findRecipeFiles()) {
  buildEntry(recipeFile);
}
