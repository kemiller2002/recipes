import fs from "fs";
import path from "path";

const ROOT = "culinary/entries";

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  let hasSubdirs = false;

  for (const entry of entries) {
    if (entry.isDirectory()) {
      hasSubdirs = true;
      walk(path.join(dir, entry.name));
    }
  }

  if (hasSubdirs) return;

  const classFile = path.join(dir, "_class.yml");

  if (fs.existsSync(classFile)) return;

  const parts = dir.split(path.sep);

  const classFolder = parts[parts.length - 1];
  const category = parts[parts.length - 2];
  const division = parts[parts.length - 3];

  const match = classFolder.match(/^(\d+)-(.*)$/);

  let classNumber = "";
  let className = classFolder;

  if (match) {
    classNumber = match[1];

    className = match[2]
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const yaml = `division: "${division}"
category: "${category}"
class_number: "${classNumber}"
class_name: "${className}"
`;

  fs.writeFileSync(classFile, yaml);

  console.log(`Created ${classFile}`);
}

walk(ROOT);

console.log("Done");
