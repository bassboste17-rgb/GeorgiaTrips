// map.js - გასწორებული ვერსია თეთრი ტექსტით
document.addEventListener("DOMContentLoaded", () => {
  console.log("Map.js ჩატვირთულია");

  const svgObject = document.getElementById("georgia-map");

  if (!svgObject) {
    console.error("Map object not found");
    return;
  }

  let isMapInitialized = false;
  let retryCount = 0;
  const maxRetries = 10;

  function initializeMap() {
    if (isMapInitialized) {
      console.log("Map already initialized");
      return;
    }

    console.log("Initializing map...");

    const svgDoc = svgObject.contentDocument;

    if (!svgDoc) {
      console.log("SVG document not ready, retrying...", retryCount);
      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(initializeMap, 300);
      } else {
        console.error("Failed to load SVG after max retries");
      }
      return;
    }

    const svg = svgDoc.querySelector("svg");

    if (!svg) {
      console.error("SVG element not found in document");
      return;
    }

    // დავრწმუნდეთ, რომ SVG სწორად არის დაყენებული
    if (!svg.hasAttribute("viewBox")) {
      try {
        const bbox = svg.getBBox();
        svg.setAttribute("viewBox", `0 0 ${bbox.width} ${bbox.height}`);
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      } catch (e) {
        console.warn("Could not set viewBox:", e);
      }
    }

    // შევქმნათ სტილების ელემენტი - ტექსტი თეთრად!
    let style = svgDoc.querySelector("style");
    if (!style) {
      style = document.createElementNS("http://www.w3.org/2000/svg", "style");
      style.textContent = `
        .region-label {
          pointer-events: none;
          font-size: 16px;
          font-family: 'BPG Glaho', sans-serif;
          font-weight: bold;
          text-shadow: 2px 2px 3px rgba(0, 0, 0, 0.8);
          fill: #ffffff !important; /* თეთრი ფერი */
        }
        
        .region-label:hover {
          fill: #ffffff !important; /* თეთრივე დარჩეს hover-ზე */
        }
      `;
      svg.insertBefore(style, svg.firstChild);
    }

    // შევქმნათ ლეიბლების ჯგუფი
    let labelGroup = svgDoc.getElementById("region-labels");
    if (!labelGroup) {
      labelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      labelGroup.setAttribute("id", "region-labels");
      svg.appendChild(labelGroup);
    }

    const paths = svgDoc.querySelectorAll("path");

    if (paths.length === 0) {
      console.warn("No paths found in SVG");
      return;
    }

    console.log("Found", paths.length, "paths in SVG");

    const regions = {
      "GE-AB": {
        translationKey: "regionAbkhazia",
        color: "#3a3a3a",
        page: "abkhazia.html",
        labelPos: { x: 120, y: 70 },
      },
      "GE-AJ": {
        translationKey: "regionAdjara",
        color: "#4d4d4d",
        page: "ajara.html",
        labelPos: { x: 220, y: 300 },
      },
      "GE-GU": {
        translationKey: "regionGuria",
        color: "#525252",
        page: "guria.html",
        labelPos: { x: 200, y: 250 },
      },
      "GE-IM": {
        translationKey: "regionImereti",
        color: "#5a5a5a",
        page: "imereti.html",
        labelPos: { x: 300, y: 230 },
      },
      "GE-KA": {
        translationKey: "regionKakheti",
        color: "#474747",
        page: "kakheti.html",
        labelPos: { x: 640, y: 260 },
      },
      "GE-KK": {
        translationKey: "regionKvemoKartli",
        color: "#5f5f5f",
        page: "kvemo-kartli.html",
        labelPos: { x: 490, y: 320 },
      },
      "GE-MM": {
        translationKey: "regionMtskhetaMtianeti",
        color: "#444444",
        page: "mtkheta-mtianeti.html",
        labelPos: { x: 480, y: 200 },
      },
      "GE-RL": {
        translationKey: "regionRachaLechkhumi",
        color: "#575757",
        page: "racha-lechkhumi.html",
        labelPos: { x: 340, y: 150 },
      },
      "GE-SJ": {
        translationKey: "regionSamtskheJavakheti",
        color: "#4a4a4a",
        page: "samtskhe-javakheti.html",
        labelPos: { x: 310, y: 300 },
      },
      "GE-SK": {
        translationKey: "regionShidaKartli",
        color: "#505050",
        page: "shida-kartli.html",
        labelPos: { x: 400, y: 240 },
      },
      "GE-SZ": {
        translationKey: "regionSamegrelo",
        color: "#424242",
        page: "samegrelo-zemo-svaneti.html",
        labelPos: { x: 200, y: 170 },
      },
      "GE-TB": {
        translationKey: "regionTbilisi",
        color: "#666666",
        page: "tbilisi.html",
        labelPos: { x: 520, y: 320 },
      },
    };

    function getRegionName(translationKey) {
      if (window.languageSwitcher && window.languageSwitcher.translate) {
        return window.languageSwitcher.translate(translationKey);
      }
      // Fallback
      const fallbackNames = {
        regionAbkhazia: "აფხაზეთი",
        regionAdjara: "აჭარა",
        regionGuria: "გურია",
        regionImereti: "იმერეთი",
        regionKakheti: "კახეთი",
        regionKvemoKartli: "ქვემო ქართლი",
        regionMtskhetaMtianeti: "მცხეთა-მთიანეთი",
        regionRachaLechkhumi: "რაჭა-ლეჩხუმი",
        regionSamtskheJavakheti: "სამცხე-ჯავახეთი",
        regionShidaKartli: "შიდა ქართლი",
        regionSamegrelo: "სამეგრელო",
        regionTbilisi: "თბილისი",
      };
      return fallbackNames[translationKey] || translationKey;
    }

    function renderMapRegions() {
      console.log("Rendering map regions...");
      
      // წავშალოთ ძველი ლეიბლები
      while (labelGroup.firstChild) {
        labelGroup.removeChild(labelGroup.firstChild);
      }

      paths.forEach((path, index) => {
        const id = path.id || path.getAttribute("id");
        if (!id || !regions[id]) {
          console.log("Skipping path without ID or region data:", id);
          return;
        }

        const { translationKey, color, page, labelPos } = regions[id];
        const name = getRegionName(translationKey);

        // გავასუფთავოთ ძველი სტილები
        path.style.fill = "";
        path.style.cursor = "";
        path.removeAttribute("title");
        path.removeAttribute("aria-label");

        // დავამატოთ ახალი სტილები
        path.style.fill = color;
        path.style.cursor = "pointer";
        path.setAttribute("title", name);
        path.setAttribute("aria-label", name);
        path.setAttribute("data-translation-key", translationKey);

        // შევქმნათ ტექსტის ელემენტი - ყოველთვის თეთრი ტექსტით
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.classList.add("region-label");
        text.setAttribute("x", labelPos.x);
        text.setAttribute("y", labelPos.y);
        text.setAttribute("visibility", "hidden");
        text.setAttribute("data-translation-key", translationKey);
        text.setAttribute("fill", "#ffffff"); // ყოველთვის თეთრი
        text.style.fill = "#ffffff"; // inline სტილიც
        text.textContent = name;
        labelGroup.appendChild(text);

        // წავშალოთ ძველი event listeners
        const newPath = path.cloneNode(true);
        path.parentNode.replaceChild(newPath, path);

        // დავამატოთ ახალი event listeners
        newPath.addEventListener("mouseenter", () => {
          newPath.style.fill = "#e5383b";
          text.setAttribute("visibility", "visible");
          text.setAttribute("fill", "#ffffff"); // hover-ზეც თეთრი
        });

        newPath.addEventListener("mouseleave", () => {
          newPath.style.fill = color;
          text.setAttribute("visibility", "hidden");
          text.setAttribute("fill", "#ffffff"); // ყოველთვის თეთრი
        });

        newPath.addEventListener("click", () => {
          console.log("Clicked region:", name, "page:", page);
          if (page) {
            window.location.href = page;
          }
        });

        // დავამატოთ touch events მობილური მოწყობილობებისთვის
        newPath.addEventListener("touchstart", (e) => {
          e.preventDefault();
          newPath.style.fill = "#e5383b";
          text.setAttribute("visibility", "visible");
          text.setAttribute("fill", "#ffffff");
        });

        newPath.addEventListener("touchend", (e) => {
          e.preventDefault();
          newPath.style.fill = color;
          text.setAttribute("visibility", "hidden");
          text.setAttribute("fill", "#ffffff");
          
          if (page) {
            setTimeout(() => {
              window.location.href = page;
            }, 300);
          }
        });
      });

      console.log("Map regions rendered successfully");
    }

    // Initial render
    renderMapRegions();

    // დავამატოთ event listener ენის შეცვლისთვის
    window.addEventListener("languageChanged", () => {
      console.log("Language changed, re-rendering map...");
      setTimeout(renderMapRegions, 100);
    });

    // დავამატოთ visibility change event
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && !isMapInitialized) {
        setTimeout(initializeMap, 100);
      }
    });

    isMapInitialized = true;
    console.log("Map initialized successfully");
  }

  // Try multiple initialization strategies
  function startMapInitialization() {
    console.log("Starting map initialization process...");
    
    // Strategy 1: Check if already loaded
    if (svgObject.contentDocument) {
      console.log("SVG already loaded, initializing immediately");
      initializeMap();
      return;
    }
    
    // Strategy 2: Add load event listener
    svgObject.addEventListener("load", () => {
      console.log("SVG load event fired");
      setTimeout(initializeMap, 100);
    });
    
    // Strategy 3: Regular polling
    const pollInterval = setInterval(() => {
      if (!isMapInitialized && svgObject.contentDocument) {
        console.log("Map initialized via polling");
        initializeMap();
        clearInterval(pollInterval);
      }
      retryCount++;
      if (retryCount >= 20) { // 20 * 250ms = 5 seconds
        clearInterval(pollInterval);
        console.error("Failed to initialize map after polling");
      }
    }, 250);
  }

  // Start initialization
  startMapInitialization();

  // დავამატოთ window load event-იც
  window.addEventListener("load", () => {
    console.log("Window loaded, checking map...");
    if (!isMapInitialized) {
      setTimeout(() => {
        if (!isMapInitialized) {
          console.log("Map still not initialized after window load, retrying...");
          initializeMap();
        }
      }, 1000);
    }
  });
});