const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const recipesDir = path.join(__dirname, "../recipes");
const htmlDir = path.join(__dirname, "../html");

if (!fs.existsSync(htmlDir)) {
  fs.mkdirSync(htmlDir, { recursive: true });
}

function wrapIngredientLine(line) {
  return line.replace(
    /^-\s+((?:\d+[\d/–\-.\s]*|½|⅓|⅔|¼|¾|⅛|⅜|⅝|⅞)\s*(?:cups?|tbsp|tsp|tablespoons?|teaspoons?|lb|lbs|oz|ounces?|cloves?|slices?|cans?|qt|quarts?|g|kg|ml|l)?\.?)\s+(.+)$/i,
    `- <span class="amount">$1</span> <span class="item">$2</span>`,
  );
}

function wrapActionLine(line) {
  return line.replace(
    /^(\d+\.\s+)(Simmer|Cook|Add|Stir|Heat|Drain|Rinse|Soak|Mash|Season|Serve|Deglaze|Bring|Reduce|Taste|Adjust|Reserve|Place|Remove|Cover|Uncover)\b/i,
    `$1<span class="verb">$2</span>`,
  );
}

function enhanceMarkdown(markdown) {
  return markdown
    .split("\n")
    .map((line) => {
      if (line.startsWith("- ")) {
        return wrapIngredientLine(line);
      }

      if (/^\d+\.\s+/.test(line)) {
        return wrapActionLine(line);
      }

      return line;
    })
    .join("\n");
}

const files = fs.readdirSync(recipesDir).filter((file) => file.endsWith(".md"));

for (const file of files) {
  const markdownPath = path.join(recipesDir, file);
  const rawMarkdown = fs.readFileSync(markdownPath, "utf8");

  const enhancedMarkdown = enhanceMarkdown(rawMarkdown);
  const body = marked.parse(enhancedMarkdown);

  const titleMatch = rawMarkdown.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : "Recipe";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="recipe.css" />
</head>
<body>
  <main class="recipe">
    <article class="recipe-card">
${body}
    </article>
  </main>
</body>
</html>`;

  const outputName = file.replace(/\.md$/, ".html");
  const outputPath = path.join(htmlDir, outputName);

  fs.writeFileSync(outputPath, html, "utf8");

  console.log(`Built ${outputName}`);
}
