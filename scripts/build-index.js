const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HTML_DIR = path.join(ROOT, "html");
const ASSET_DIR = path.join(HTML_DIR, "assets");
const SOURCE_DIR = path.join(ROOT, "site", "index");
const SEARCH_INDEX_PATH = path.join(
  HTML_DIR,
  "metadata",
  "recipe-search-index.json",
);
const OUTPUT_DATA_PATH = path.join(ASSET_DIR, "recipe-index-data.js");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function copyFile(sourceName, destinationPath) {
  const sourcePath = path.join(SOURCE_DIR, sourceName);
  fs.copyFileSync(sourcePath, destinationPath);
}

ensureDir(HTML_DIR);
ensureDir(ASSET_DIR);

const searchIndex = readJson(SEARCH_INDEX_PATH);

if (!Array.isArray(searchIndex.recipes)) {
  throw new Error("Expected html/metadata/recipe-search-index.json to contain a recipes array.");
}

copyFile("index.html", path.join(HTML_DIR, "index.html"));
copyFile("index.css", path.join(ASSET_DIR, "index.css"));
copyFile("index.js", path.join(ASSET_DIR, "index.js"));

const browserData = {
  schemaVersion: searchIndex.schemaVersion,
  generatedAt: searchIndex.generatedAt,
  recipeCount: searchIndex.recipeCount,
  recipes: searchIndex.recipes,
};

fs.writeFileSync(
  OUTPUT_DATA_PATH,
  `window.RECIPE_INDEX_DATA = ${JSON.stringify(browserData, null, 2)};\n`,
  "utf8",
);

console.log(`Generated html/index.html with ${browserData.recipeCount} recipes`);
console.log("Copied html/assets/index.css");
console.log("Copied html/assets/index.js");
console.log("Generated html/assets/recipe-index-data.js");
