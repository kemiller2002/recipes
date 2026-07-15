const fs = require("fs");
const path = require("path");

const recipesDir = path.join(__dirname, "../recipes");
const htmlDir = path.join(__dirname, "../html");

if (!fs.existsSync(htmlDir)) {
  fs.mkdirSync(htmlDir, { recursive: true });
}

function stripFrontmatter(markdown) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);

  if (!match) {
    return { data: {}, body: markdown };
  }

  return {
    data: parseSimpleYaml(match[1]),
    body: markdown.slice(match[0].length)
  };
}

function parseScalar(rawValue) {
  const value = rawValue.trim();

  if (value === "null") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "[]") return [];

  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.replace(/^['"]|['"]$/g, ""));
  }

  return value.replace(/^['"]|['"]$/g, "");
}

function parseSimpleYaml(yamlText) {
  const root = {};
  const stack = [{ indent: -1, value: root }];

  for (const rawLine of yamlText.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith("#")) {
      continue;
    }

    const match = rawLine.match(/^(\s*)([^:]+):(.*)$/);
    if (!match) {
      continue;
    }

    const indent = match[1].length;
    const key = match[2].trim();
    const rawValue = match[3];

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].value;
    const trimmedValue = rawValue.trim();

    if (!trimmedValue) {
      parent[key] = {};
      stack.push({ indent, value: parent[key] });
      continue;
    }

    parent[key] = parseScalar(trimmedValue);
  }

  return root;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stripMarkdownInline(value) {
  return String(value)
    .replace(/[*_`~]/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .trim();
}

function titleFromBody(body) {
  const match = body.match(/^#\s+(.+)$/m);
  return match ? stripMarkdownInline(match[1]) : "Recipe";
}

function descriptionFromBody(body) {
  const lines = body.split(/\r?\n/);
  let seenTitle = false;
  const buffer = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!seenTitle) {
      if (line.startsWith("# ")) {
        seenTitle = true;
      }
      continue;
    }

    if (!line) {
      if (buffer.length) break;
      continue;
    }

    if (/^---+$/.test(line) || line.startsWith("#")) {
      if (buffer.length) break;
      continue;
    }

    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      if (buffer.length) break;
      return "";
    }

    buffer.push(stripMarkdownInline(line));
  }

  return buffer.join(" ").trim();
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

function applyInlineMarkdown(text) {
  return text
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function flushList(state, html) {
  if (!state.listType || !state.listItems.length) {
    return;
  }

  const tag = state.listType === "ol" ? "ol" : "ul";
  html.push(`<${tag}>`);
  for (const item of state.listItems) {
    html.push(`  <li>${item}</li>`);
  }
  html.push(`</${tag}>`);
  state.listType = null;
  state.listItems = [];
}

function flushParagraph(state, html) {
  if (!state.paragraph.length) {
    return;
  }

  html.push(`<p>${state.paragraph.join(" ")}</p>`);
  state.paragraph = [];
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  const state = {
    listType: null,
    listItems: [],
    paragraph: []
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph(state, html);
      flushList(state, html);
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      flushParagraph(state, html);
      flushList(state, html);
      html.push("<hr>");
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph(state, html);
      flushList(state, html);
      const level = headingMatch[1].length;
      html.push(`<h${level}>${applyInlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph(state, html);
      flushList(state, html);
      html.push(
        `<blockquote><p>${applyInlineMarkdown(trimmed.replace(/^>\s?/, ""))}</p></blockquote>`,
      );
      continue;
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph(state, html);
      if (state.listType && state.listType !== "ol") {
        flushList(state, html);
      }
      state.listType = "ol";
      state.listItems.push(applyInlineMarkdown(orderedMatch[2]));
      continue;
    }

    const unorderedMatch = trimmed.match(/^-\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph(state, html);
      if (state.listType && state.listType !== "ul") {
        flushList(state, html);
      }
      state.listType = "ul";
      state.listItems.push(applyInlineMarkdown(unorderedMatch[1]));
      continue;
    }

    if (state.listType) {
      flushList(state, html);
    }

    state.paragraph.push(applyInlineMarkdown(trimmed));
  }

  flushParagraph(state, html);
  flushList(state, html);

  return html.join("\n");
}

function formatMetaItem(label, value) {
  if (!value || value === "null") {
    return "";
  }

  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

const files = fs.readdirSync(recipesDir).filter((file) => file.endsWith(".md"));

for (const file of files) {
  const markdownPath = path.join(recipesDir, file);
  const rawMarkdown = fs.readFileSync(markdownPath, "utf8");
  const { data: frontmatter, body } = stripFrontmatter(rawMarkdown);
  const enhancedMarkdown = enhanceMarkdown(body);
  const recipeHtml = markdownToHtml(enhancedMarkdown);

  const title = frontmatter.title || titleFromBody(body);
  const description = frontmatter.description || descriptionFromBody(body);

  const metaItems = [
    formatMetaItem("Servings", frontmatter.servings),
    formatMetaItem("Yield", frontmatter.yield && frontmatter.yield !== "servings" ? frontmatter.yield : null),
    formatMetaItem("Prep", frontmatter.prepTime),
    formatMetaItem("Cook", frontmatter.cookTime),
    formatMetaItem("Total", frontmatter.totalTime),
    formatMetaItem("Difficulty", frontmatter.difficulty)
  ].filter(Boolean);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="recipe.css" />
  <link rel="stylesheet" href="print.css" />
</head>
<body>
  <main class="recipe-print-page">
    <div class="screen-toolbar">
      <a class="screen-toolbar__link" href="index.html">Back to recipes</a>
      <button class="screen-toolbar__button" type="button" data-print-recipe>Print</button>
    </div>

    <article class="entry-sheet">
      <header class="fair-header">
        <h1>${escapeHtml(title)}</h1>
        ${description ? `<p class="recipe-summary">${escapeHtml(description)}</p>` : ""}
        ${metaItems.length ? `<dl class="recipe-meta">${metaItems.join("\n")}</dl>` : ""}
      </header>

      <section class="recipe-body">
${recipeHtml}
      </section>
    </article>
  </main>

  <script src="print-fit.js"></script>
  <script>
    (function () {
      const button = document.querySelector("[data-print-recipe]");
      if (!button) return;

      button.addEventListener("click", () => {
        if (typeof fitAllSheets === "function") {
          fitAllSheets();
        }
        window.print();
      });
    })();
  </script>
</body>
</html>`;

  const outputName = file.replace(/\.md$/, ".html");
  const outputPath = path.join(htmlDir, outputName);

  fs.writeFileSync(outputPath, html, "utf8");
  console.log(`Built ${outputName}`);
}
