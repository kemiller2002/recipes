const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const recipesDir = path.join(__dirname, "../recipes");
const htmlDir = path.join(__dirname, "../html");

if (!fs.existsSync(htmlDir)) {
  fs.mkdirSync(htmlDir, { recursive: true });
}

const files = fs
  .readdirSync(recipesDir)
  .filter(file => file.endsWith(".md"));

for (const file of files) {
  const markdownPath = path.join(recipesDir, file);
  const markdown = fs.readFileSync(markdownPath, "utf8");

  const body = marked(markdown);

  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : "Recipe";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="../recipe.css" />
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