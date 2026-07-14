import fs from "fs";
import path from "path";
import matter from "gray-matter";
import yaml from "js-yaml";

const ROOT = "culinary";
const ENTRIES = path.join(ROOT, "entries");
const PEOPLE = path.join(ROOT, "people");
const OUTPUT = "html";
const METADATA = path.join(OUTPUT, "metadata");

fs.mkdirSync(METADATA, { recursive: true });

function readYaml(filePath) {
  return yaml.load(fs.readFileSync(filePath, "utf8"));
}

function slugToTitle(slug) {
  return slug
    .replace(/^\d+-/, "")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getDirectories(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function getPeople() {
  if (!fs.existsSync(PEOPLE)) return [];

  return fs
    .readdirSync(PEOPLE)
    .filter((file) => file.endsWith(".yml"))
    .map((file) => {
      const personId = path.basename(file, ".yml");
      const person = readYaml(path.join(PEOPLE, file));

      return {
        id: personId,
        name: person.name || personId,
      };
    })
    .filter((person) => person.id !== "household")
    .sort((a, b) => a.name.localeCompare(b.name));
}

function findRecipesInClass(classDir, classInfo, peopleById) {
  return walk(classDir)
    .filter((file) => path.basename(file) === "recipe.md")
    .map((recipePath) => {
      const relativePath = path.relative(ENTRIES, recipePath);
      const parts = relativePath.split(path.sep);
      const personId = parts[3] || "";
      const recipeFolder = parts[4] || "";
      const rawRecipe = fs.readFileSync(recipePath, "utf8");
      const parsed = matter(rawRecipe);
      const person = peopleById[personId];

      return {
        personId,
        personName: person?.name || personId,
        recipeSlug: recipeFolder,
        recipeName: parsed.data.title || slugToTitle(recipeFolder),
        recipePath: relativePath,
        classNumber: classInfo.classNumber,
        className: classInfo.className,
      };
    })
    .sort((a, b) => {
      return (
        a.personName.localeCompare(b.personName) ||
        a.recipeName.localeCompare(b.recipeName)
      );
    });
}

function getCategories(peopleById) {
  const categories = {};

  for (const division of getDirectories(ENTRIES)) {
    const divisionPath = path.join(ENTRIES, division);

    for (const categorySlug of getDirectories(divisionPath)) {
      const categoryPath = path.join(divisionPath, categorySlug);
      const categoryName = slugToTitle(categorySlug);

      if (!categories[division]) {
        categories[division] = {};
      }

      if (!categories[division][categoryName]) {
        categories[division][categoryName] = {
          slug: categorySlug,
          classes: [],
        };
      }

      for (const classFolder of getDirectories(categoryPath)) {
        const classDir = path.join(categoryPath, classFolder);
        const classPath = path.join(classDir, "_class.yml");

        let classInfo = {
          className: slugToTitle(classFolder),
          classNumber: "",
        };

        if (fs.existsSync(classPath)) {
          const loadedClassInfo = readYaml(classPath);
          classInfo = {
            ...classInfo,
            ...loadedClassInfo,
          };
        }

        categories[division][categoryName].classes.push({
          slug: classFolder,
          classNumber: classInfo.classNumber || "",
          name: classInfo.className || slugToTitle(classFolder),
          recipes: findRecipesInClass(
            classDir,
            {
              classNumber: classInfo.classNumber || "",
              className: classInfo.className || slugToTitle(classFolder),
            },
            peopleById,
          ),
        });
      }

      categories[division][categoryName].classes.sort((a, b) => {
        return String(a.classNumber || a.slug).localeCompare(
          String(b.classNumber || b.slug),
          undefined,
          { numeric: true },
        );
      });
    }
  }

  return categories;
}

const people = getPeople();
const peopleById = Object.fromEntries(people.map((person) => [person.id, person]));
const output = {
  people,
  categories: getCategories(peopleById),
};

fs.writeFileSync(
  path.join(METADATA, "recipe-taxonomy.json"),
  JSON.stringify(output, null, 2),
);

console.log("Generated html/metadata/recipe-taxonomy.json");
