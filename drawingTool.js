let drawingArea = document.getElementById("drawingArea");
let currentMode = null;
// const supportedModes = ["draw", "rectangle", "circle", "drag"];
let strokeWidth = 1;
let isDrawing = false;
let currentElement;
let selectedElement = null;
let initialX, initialY;
let offsetX, offsetY;
let scale = 1;
const zoomFactor = 0.1;
let image;
let rubberBand;

const strokeColorElement = document.getElementById("strokeColor");
const strokeColor = strokeColorElement.value ?? "black";
strokeColorElement.addEventListener("input", function () {
  if (selectedElement) {
    selectedElement.setAttribute("stroke", this.value);
  }
});

function resizeRubberBand(selectedElement) {
  removeRubberBand();
  createRubberBand(selectedElement);
}

const strokeWidthElement = document.getElementById("strokeWidth");
strokeWidthElement.addEventListener("input", function () {
  if (selectedElement) {
    selectedElement.setAttribute("stroke-width", this.value);
    resizeRubberBand(selectedElement);
  }
});

const fillColorElement = document.getElementById("fillColor");
let transparentFillElement = document.getElementById("transparentFill");
fillColorElement.addEventListener("input", function () {
  if (selectedElement) {
    selectedElement.setAttribute("fill", this.value);
  }

  if (transparentFillElement.checked) {
    document.getElementById("transparentFill").checked = false;
  }
});

transparentFillElement.addEventListener("input", function () {
  if (selectedElement) {
    if (transparentFillElement.checked) {
      selectedElement.setAttribute("fill", undefined);
    } else {
      selectedElement.setAttribute("fill", fillColorElement.value);
    }
  }
});

document
  .getElementById("transparentFill")
  .addEventListener("input", function () {
    let transparentFillElement = document.getElementById("transparentFill");
    if (selectedElement && transparentFillElement) {
      if (transparentFillElement.checked) {
        // selectedElement.setAttribute("fill", "transparent");
      } else {
        selectedElement.setAttribute("fill", fillColorElement.value);
      }
    }
  });

document.getElementById("zoomIn").addEventListener("click", () => zoom(true));
document.getElementById("zoomOut").addEventListener("click", () => zoom(false));
drawingArea.addEventListener("mousedown", mousedown);
drawingArea.addEventListener("mousemove", draw);
drawingArea.addEventListener("mouseup", endDrawing);
drawingArea.addEventListener("click", selectElement);
document.addEventListener("keydown", function (event) {
  console.log("keydown");
  if (
    (event.key === "Delete" || event.key === "Backspace") &&
    selectedElement
  ) {
    selectedElement.remove();
    selectedElement = null;
    removeRubberBand();
  }
});

function setMode(mode) {
  currentMode = mode;
  updateButtonHighlight();
}

function updateButtonHighlight() {
  ["drag", "draw", "rectangle", "circle"].forEach((mode) => {
    let button = document.getElementById(mode);
    if (button) {
      if (mode === currentMode) {
        button.classList.add("button-highlight");
      } else {
        button.classList.remove("button-highlight");
      }
    }
  });
}

function mousedown(event) {
  if (currentMode === "drag") {
    if (event.target.tagName === "image") {
      return;
    }
    if (selectedElement && event.target === selectedElement) {
      if (event.target.tagName === "rect") {
        offsetX =
          event.clientX - parseFloat(selectedElement.getAttributeNS(null, "x"));
        offsetY =
          event.clientY - parseFloat(selectedElement.getAttributeNS(null, "y"));
      } else if (event.target.tagName === "circle") {
        offsetX =
          event.clientX -
          parseFloat(selectedElement.getAttributeNS(null, "cx"));
        offsetY =
          event.clientY -
          parseFloat(selectedElement.getAttributeNS(null, "cy"));
      }
      drawingArea.addEventListener("mousemove", drag);
      drawingArea.addEventListener("mouseup", endDrag);
    }
  } else {
    if (event.target === drawingArea) {
      isDrawing = true;
      selectedElement = null;
      initialX = event.offsetX;
      initialY = event.offsetY;

      let fillColor = transparentFillElement.checked
        ? ""
        : fillColorElement.value;

      if (currentMode === "draw") {
        currentElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polyline"
        );
        currentElement.setAttribute(
          "points",
          `${event.offsetX},${event.offsetY} `
        );
      }

      if (currentMode === "rectangle") {
        currentElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        currentElement.setAttribute("x", initialX);
        currentElement.setAttribute("y", initialY);
        currentElement.setAttribute("width", 0);
        currentElement.setAttribute("height", 0);
      }

      if (currentMode === "circle") {
        currentElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        currentElement.setAttribute("cx", initialX);
        currentElement.setAttribute("cy", initialY);
        currentElement.setAttribute("r", 0);
      }

      // common props
      currentElement.setAttribute("fill", fillColor);
      currentElement.setAttribute("stroke", strokeColor);
      currentElement.setAttribute("stroke-width", strokeWidthElement.value);
      drawingArea.appendChild(currentElement);
    }
  }
}

function draw(event) {
  if (!isDrawing) return;

  if (currentMode === "draw") {
    let points = currentElement.getAttribute("points");
    points += `${event.offsetX},${event.offsetY} `;
    currentElement.setAttribute("points", points);
  }

  if (currentMode === "rectangle") {
    currentElement.setAttribute("width", Math.abs(event.offsetX - initialX));
    currentElement.setAttribute("height", Math.abs(event.offsetY - initialY));
    currentElement.setAttribute("x", Math.min(event.offsetX, initialX));
    currentElement.setAttribute("y", Math.min(event.offsetY, initialY));
    // currentElement.setAttribute("z", 50);
  }

  if (currentMode === "circle") {
    let radius = Math.sqrt(
      Math.pow(event.offsetX - initialX, 2) +
        Math.pow(event.offsetY - initialY, 2)
    );
    currentElement.setAttribute("r", radius);
  }
}

function endDrawing() {
  isDrawing = false;
}

function selectElement(evt) {
  console.log("selectElement");
  if (isDrawing) return;

  if (
    evt.target !== drawingArea &&
    // evt.target !== currentElement &&
    evt.target !== image
  ) {
    selectedElement = evt.target;
    strokeWidthElement.value = selectedElement.getAttribute("stroke-width");
    strokeColorElement.value = selectedElement.getAttribute("stroke");
    fillColorElement.value = selectedElement.getAttribute("fill");
    transparentFillElement.checked =
      selectedElement.getAttribute("fill") === undefined;

    console.log(`selectedElement: ${selectedElement}`);
    createRubberBand(selectedElement);
  } else {
    removeRubberBand();
    selectedElement = null;
  }
}

function createRubberBand(elem) {
  removeRubberBand();
  let bbox = elem.getBBox();
  const xOffset = bbox.x - strokeWidthElement.value / 2;
  const yOffset = bbox.y - strokeWidthElement.value / 2;
  const widthOffset = bbox.width + Number(strokeWidthElement.value);
  const heightOffset = bbox.height + Number(strokeWidthElement.value);

  rubberBand = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  console.log(`strokeWidthElement.value=${strokeWidthElement.value}`);

  rubberBand.setAttribute("id", "rubberBand");
  rubberBand.setAttribute("x", xOffset);
  rubberBand.setAttribute("y", yOffset);
  rubberBand.setAttribute("width", widthOffset);
  rubberBand.setAttribute("height", heightOffset);
  rubberBand.setAttribute("patternUnits", "userSpaceOnUse");
  rubberBand.setAttribute("fill", "none");
  rubberBand.setAttribute("stroke", "blue");
  rubberBand.setAttribute("stroke-dasharray", "3,3");
  drawingArea.appendChild(rubberBand);

  createHandle(xOffset, yOffset);
  createHandle(xOffset + widthOffset, yOffset);
  createHandle(xOffset, yOffset + heightOffset);
  createHandle(xOffset + widthOffset, yOffset + heightOffset);
}

function createHandle(x, y) {
  let handle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  handle.classList.add("handle"); // Fügt eine Klasse für die Handles hinzu
  handle.setAttribute("x", x - 4);
  handle.setAttribute("y", y - 4);
  handle.setAttribute("width", 8);
  handle.setAttribute("height", 8);
  handle.setAttribute("fill", "blue");
  let dragging = false;
  let startX, startY;

  handle.addEventListener("mousedown", function (event) {
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
  });

  window.addEventListener("mousemove", function (event) {
    if (dragging) {
      let dx = event.clientX - startX;
      let dy = event.clientY - startY;

      if (selectedElement.tagName === "rect") {
        let newWidth = Number(selectedElement.getAttribute("width")) + dx;
        let newHeight = Number(selectedElement.getAttribute("height")) + dy;
        selectedElement.setAttribute("width", newWidth);
        selectedElement.setAttribute("height", newHeight);
      } else if (selectedElement.tagName === "circle") {
        let cx = Number(selectedElement.getAttribute("cx"));
        let cy = Number(selectedElement.getAttribute("cy"));
        let oldRadius = Number(selectedElement.getAttribute("r"));
        let oldDistance = Math.sqrt(
          Math.pow(startX - cx, 2) + Math.pow(startY - cy, 2)
        );
        let newDistance = Math.sqrt(
          Math.pow(event.clientX - cx, 2) + Math.pow(event.clientY - cy, 2)
        );
        let newRadius = oldRadius + newDistance - oldDistance;
        selectedElement.setAttribute("r", newRadius);
      } else if (selectedElement.tagName === "polyline") {
        let points = selectedElement
          .getAttribute("points")
          .trim()
          .split(/\s+/)
          .map((point) => point.split(",").map(Number));
        let initialDistance = Math.sqrt(
          Math.pow(startX - initialX, 2) + Math.pow(startY - initialY, 2)
        );
        let newDistance = Math.sqrt(
          Math.pow(event.clientX - initialX, 2) +
            Math.pow(event.clientY - initialY, 2)
        );
        let scaleFactor = newDistance / initialDistance;

        let newPoints = points.map(([x, y]) => [
          (x - initialX) * scaleFactor + initialX,
          (y - initialY) * scaleFactor + initialY,
        ]);
        selectedElement.setAttribute(
          "points",
          newPoints.map((point) => point.join(",")).join(" ")
        );
      }

      startX = event.clientX;
      startY = event.clientY;

      resizeRubberBand(selectedElement);
    }
  });

  window.addEventListener("mouseup", function (event) {
    dragging = false;
  });

  drawingArea.appendChild(handle);
}

function removeRubberBand() {
  let rubberBand = document.getElementById("rubberBand");
  if (rubberBand) {
    rubberBand.remove();
  }

  // Entfernt nur die Handle-Elemente, ohne andere Elemente zu beeinflussen
  Array.from(drawingArea.querySelectorAll("rect.handle")).forEach((handle) =>
    handle.remove()
  );
}

function drag(evt) {
  console.log("drag");
  if (!selectedElement) return;

  let x = evt.clientX - offsetX;
  let y = evt.clientY - offsetY;
  if (selectedElement.tagName === "rect") {
    selectedElement.setAttributeNS(null, "x", x);
    selectedElement.setAttributeNS(null, "y", y);
  } else if (selectedElement.tagName === "circle") {
    selectedElement.setAttributeNS(null, "cx", x);
    selectedElement.setAttributeNS(null, "cy", y);
  }

  createRubberBand(selectedElement);
  console.log("Dragging element:", selectedElement);
}

function endDrag() {
  drawingArea.removeEventListener("mousemove", drag);
  drawingArea.removeEventListener("mouseup", endDrag);
  selectedElement = null;
  console.log("Stopped dragging:", selectedElement);
}

function zoom(isZoomIn) {
  scale *= isZoomIn ? 1 + zoomFactor : 1 - zoomFactor;
  updateViewBox();
}

function updateViewBox() {
  const newWidth = drawingArea.clientWidth / scale;
  const newHeight = drawingArea.clientHeight / scale;
  drawingArea.setAttribute("viewBox", `0 0 ${newWidth} ${newHeight}`);
}

// Hintergrundbild hinzufügen (erforderlich, dass das Bild als SVG, PNG oder JPG vorliegt)
function addBackgroundImage(imageUrl) {
  image = document.createElementNS("http://www.w3.org/2000/svg", "image");
  image.setAttributeNS(null, "href", imageUrl);
  image.setAttribute("width", drawingArea.clientWidth);
  image.setAttribute("height", drawingArea.clientHeight);
  image.style.pointerEvents = "none";
  drawingArea.insertBefore(image, drawingArea.firstChild);
}

// Fügen Sie hier den Link zu Ihrem Hintergrundbild ein
addBackgroundImage(
  "https://arc-rider.ninoxdb.de/share/h8l99ffozh8a70ckmnmegn32f2m4kka6u6k9"
);
