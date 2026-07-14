const FIT_CLASSES = ["compact", "two-column", "tiny", "micro"];

const FIT_MODES = [
  [],
  ["compact"],
  ["compact", "two-column"],
  ["compact", "two-column", "tiny"],
  ["compact", "two-column", "tiny", "micro"],
];

const SAFETY_BUFFER_PX = 0;

function applyMode(sheet, mode) {
  sheet.classList.remove(...FIT_CLASSES);
  sheet.classList.add(...mode);
  void sheet.offsetHeight;
}

function getContentOverflow(sheet) {
  const body = sheet.querySelector(".recipe-body");

  if (!body) {
    return 9999;
  }

  const bodyBox = body.getBoundingClientRect();
  let maxOverflow = -Infinity;

  for (const child of body.querySelectorAll("*")) {
    for (const rect of child.getClientRects()) {
      maxOverflow = Math.max(
        maxOverflow,
        rect.right - bodyBox.right,
        rect.bottom - bodyBox.bottom,
      );
    }
  }

  return maxOverflow;
}

function fitSheet(sheet) {
  for (const mode of FIT_MODES) {
    applyMode(sheet, mode);

    if (getContentOverflow(sheet) <= -SAFETY_BUFFER_PX) {
      return;
    }
  }

  applyMode(sheet, ["compact", "two-column", "tiny", "micro"]);
}

function fitAllSheets() {
  for (const sheet of document.querySelectorAll(".entry-sheet")) {
    fitSheet(sheet);
  }
}

window.addEventListener("load", fitAllSheets);
window.addEventListener("resize", fitAllSheets);

if (document.fonts?.ready) {
  document.fonts.ready.then(fitAllSheets);
}
