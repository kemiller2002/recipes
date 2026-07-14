import fs from "fs";
import path from "path";

const OUTPUT = "html";

// Delete previous build
fs.rmSync(OUTPUT, {
  recursive: true,
  force: true,
});

// Recreate output folder
fs.mkdirSync(OUTPUT, {
  recursive: true,
});