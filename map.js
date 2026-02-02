// map.js - გაუმჯობესებული ვერსია loading ინდიკატორით
document.addEventListener("DOMContentLoaded", () => {
  console.log("Map.js ჩატვირთულია");

  const svgObject = document.getElementById("georgia-map");
  const mapContainer = document.querySelector(".map-container");

  if (!svgObject) {
    console.error("Map object not found");
    return;
  }

  // Loading ინდიკატორის შექმნა
  function createLoadingIndicator() {
    // შევამოწმოთ უკვე არსებობს თუ არა
    if (document.getElementById("map-loading-indicator")) {
      return;
    }

    const loadingDiv = document.createElement("div");
    loadingDiv.id = "map-loading-indicator";
    loadingDiv.innerHTML = `
      <div class="map-loader">
        <div class="map-spinner"></div>
        <p class="map-loading-text">რუკა იტვირთება...</p>
      </div>
    `;

    // CSS სტილები loading ინდიკატორისთვის
    const style = document.createElement("style");
    style.id = "map-loading-styles";
    style.textContent = `
      #map-loading-indicator {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        z-index: 100;
        border-radius: 20px;
        transition: opacity 0.5s ease, visibility 0.5s ease;
      }

      #map-loading-indicator.hidden {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }

      .map-loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
      }

      .map-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.2);
        border-top: 4px solid #e5383b;
        border-radius: 50%;
        animation: mapSpin 1s linear infinite;
      }

      @keyframes mapSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .map-loading-text {
        color: #fff;
        font-size: 1.1rem;
        font-family: "BPG Glaho", sans-serif;
        margin: 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      }

      /* SVG რუკა თავდაპირველად დამალული */
      #georgia-map {
        opacity: 0;
        transition: opacity 0.5s ease;
      }

      #georgia-map.loaded {
        opacity: 1;
      }
    `;

    // დავამატოთ სტილები
    if (!document.getElementById("map-loading-styles")) {
      document.head.appendChild(style);
    }

    // დავამატოთ loading ინდიკატორი map container-ში
    if (mapContainer) {
      mapContainer.style.position = "relative";
      mapContainer.appendChild(loadingDiv);
    }
  }

  // Loading ინდიკატორის დამალვა
  function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById("map-loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.classList.add("hidden");
      // სრულად წაშლა ანიმაციის შემდეგ
      setTimeout(() => {
        if (loadingIndicator.parentNode) {
          loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
      }, 500);
    }
    // SVG-ს გამოჩენა
    svgObject.classList.add("loaded");
  }

  // Loading ინდიკატორის ჩვენება
  createLoadingIndicator();

  let isMapInitialized = false;
  let retryCount = 0;
  const maxRetries = 30; // გავზარდეთ retry-ების რაოდენობა

  function initializeMap() {
    if (isMapInitialized) {
      console.log("Map already initialized");
      hideLoadingIndicator();
      return;
    }

    console.log("Initializing map...");

    const svgDoc = svgObject.contentDocument;

    if (!svgDoc) {
      console.log("SVG document not ready, retrying...", retryCount);
      if (retryCount < maxRetries) {
        retryCount++;
        // Safari-სთვის უფრო ხანგრძლივი დაყოვნება
        const delay = retryCount < 5 ? 200 : 400;
        setTimeout(initializeMap, delay);
      } else {
        console.error("Failed to load SVG after max retries");
        hideLoadingIndicator();
      }
      return;
    }

    const svg = svgDoc.querySelector("svg");

    if (!svg) {
      console.error("SVG element not found in document");
      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(initializeMap, 300);
      } else {
        hideLoadingIndicator();
      }
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
          fill: #ffffff !important;
        }
        
        .region-label:hover {
          fill: #ffffff !important;
        }

        path {
          transition: fill 0.2s ease;
          will-change: fill;
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
      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(initializeMap, 300);
      } else {
        hideLoadingIndicator();
      }
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

    // Event handler-ები - ოპტიმიზირებული მობილურისთვის
    const eventHandlers = new Map();

    function renderMapRegions() {
      console.log("Rendering map regions...");

      // წავშალოთ ძველი ლეიბლები
      while (labelGroup.firstChild) {
        labelGroup.removeChild(labelGroup.firstChild);
      }

      // წავშალოთ ძველი event handlers
      eventHandlers.forEach((handlers, path) => {
        handlers.forEach(({ event, handler }) => {
          path.removeEventListener(event, handler);
        });
      });
      eventHandlers.clear();

      paths.forEach((path) => {
        const id = path.id || path.getAttribute("id");
        if (!id || !regions[id]) {
          return;
        }

        const { translationKey, color, page, labelPos } = regions[id];
        const name = getRegionName(translationKey);

        // სტილების დაყენება
        path.style.fill = color;
        path.style.cursor = "pointer";
        path.setAttribute("title", name);
        path.setAttribute("aria-label", name);
        path.setAttribute("data-translation-key", translationKey);

        // ტექსტის ელემენტის შექმნა
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.classList.add("region-label");
        text.setAttribute("x", labelPos.x);
        text.setAttribute("y", labelPos.y);
        text.setAttribute("visibility", "hidden");
        text.setAttribute("data-translation-key", translationKey);
        text.setAttribute("fill", "#ffffff");
        text.style.fill = "#ffffff";
        text.textContent = name;
        labelGroup.appendChild(text);

        // Event handlers - ოპტიმიზირებული
        const handlers = [];

        // Mouse events (desktop)
        const mouseEnterHandler = () => {
          path.style.fill = "#e5383b";
          text.setAttribute("visibility", "visible");
        };

        const mouseLeaveHandler = () => {
          path.style.fill = color;
          text.setAttribute("visibility", "hidden");
        };

        const clickHandler = (e) => {
          e.preventDefault();
          if (page) {
            window.location.href = page;
          }
        };

        path.addEventListener("mouseenter", mouseEnterHandler, { passive: true });
        path.addEventListener("mouseleave", mouseLeaveHandler, { passive: true });
        path.addEventListener("click", clickHandler);

        handlers.push({ event: "mouseenter", handler: mouseEnterHandler });
        handlers.push({ event: "mouseleave", handler: mouseLeaveHandler });
        handlers.push({ event: "click", handler: clickHandler });

        // Touch events (mobile) - გაუმჯობესებული Safari-სთვის
        let touchTimeout = null;

        const touchStartHandler = (e) => {
          // არ გავაუქმოთ default ქცევა სკროლისთვის
          path.style.fill = "#e5383b";
          text.setAttribute("visibility", "visible");

          // დავაყენოთ timeout ნავიგაციისთვის
          touchTimeout = setTimeout(() => {
            if (page) {
              window.location.href = page;
            }
          }, 200);
        };

        const touchEndHandler = (e) => {
          if (touchTimeout) {
            clearTimeout(touchTimeout);
          }
          
          path.style.fill = color;
          text.setAttribute("visibility", "hidden");

          // ნავიგაცია touch end-ზე
          if (page) {
            window.location.href = page;
          }
        };

        const touchCancelHandler = () => {
          if (touchTimeout) {
            clearTimeout(touchTimeout);
          }
          path.style.fill = color;
          text.setAttribute("visibility", "hidden");
        };

        path.addEventListener("touchstart", touchStartHandler, { passive: true });
        path.addEventListener("touchend", touchEndHandler, { passive: true });
        path.addEventListener("touchcancel", touchCancelHandler, { passive: true });

        handlers.push({ event: "touchstart", handler: touchStartHandler });
        handlers.push({ event: "touchend", handler: touchEndHandler });
        handlers.push({ event: "touchcancel", handler: touchCancelHandler });

        eventHandlers.set(path, handlers);
      });

      console.log("Map regions rendered successfully");
    }

    // Initial render
    renderMapRegions();

    // ენის შეცვლის event listener
    window.addEventListener("languageChanged", () => {
      console.log("Language changed, re-rendering map...");
      setTimeout(renderMapRegions, 100);
    });

    isMapInitialized = true;
    console.log("Map initialized successfully");

    // დავმალოთ loading ინდიკატორი
    hideLoadingIndicator();
  }

  // გლობალური ფუნქცია რუკის რეინიციალიზაციისთვის
  window.initializeMap = function () {
    if (isMapInitialized) {
      const svgDoc = svgObject.contentDocument;
      if (svgDoc) {
        const paths = svgDoc.querySelectorAll("path");
        const labelGroup = svgDoc.getElementById("region-labels");

        if (paths.length > 0 && labelGroup) {
          // რეინიციალიზაცია
          while (labelGroup.firstChild) {
            labelGroup.removeChild(labelGroup.firstChild);
          }

          const regions = {
            "GE-AB": { translationKey: "regionAbkhazia", color: "#3a3a3a", page: "abkhazia.html", labelPos: { x: 120, y: 70 } },
            "GE-AJ": { translationKey: "regionAdjara", color: "#4d4d4d", page: "ajara.html", labelPos: { x: 220, y: 300 } },
            "GE-GU": { translationKey: "regionGuria", color: "#525252", page: "guria.html", labelPos: { x: 200, y: 250 } },
            "GE-IM": { translationKey: "regionImereti", color: "#5a5a5a", page: "imereti.html", labelPos: { x: 300, y: 230 } },
            "GE-KA": { translationKey: "regionKakheti", color: "#474747", page: "kakheti.html", labelPos: { x: 640, y: 260 } },
            "GE-KK": { translationKey: "regionKvemoKartli", color: "#5f5f5f", page: "kvemo-kartli.html", labelPos: { x: 490, y: 320 } },
            "GE-MM": { translationKey: "regionMtskhetaMtianeti", color: "#444444", page: "mtkheta-mtianeti.html", labelPos: { x: 480, y: 200 } },
            "GE-RL": { translationKey: "regionRachaLechkhumi", color: "#575757", page: "racha-lechkhumi.html", labelPos: { x: 340, y: 150 } },
            "GE-SJ": { translationKey: "regionSamtskheJavakheti", color: "#4a4a4a", page: "samtskhe-javakheti.html", labelPos: { x: 310, y: 300 } },
            "GE-SK": { translationKey: "regionShidaKartli", color: "#505050", page: "shida-kartli.html", labelPos: { x: 400, y: 240 } },
            "GE-SZ": { translationKey: "regionSamegrelo", color: "#424242", page: "samegrelo-zemo-svaneti.html", labelPos: { x: 200, y: 170 } },
            "GE-TB": { translationKey: "regionTbilisi", color: "#666666", page: "tbilisi.html", labelPos: { x: 520, y: 320 } },
          };

          function getRegionName(translationKey) {
            if (window.languageSwitcher && window.languageSwitcher.translate) {
              return window.languageSwitcher.translate(translationKey);
            }
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

          paths.forEach((path) => {
            const id = path.id || path.getAttribute("id");
            if (!id || !regions[id]) return;

            const { translationKey, labelPos } = regions[id];
            const name = getRegionName(translationKey);

            path.setAttribute("title", name);
            path.setAttribute("aria-label", name);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.classList.add("region-label");
            text.setAttribute("x", labelPos.x);
            text.setAttribute("y", labelPos.y);
            text.setAttribute("visibility", "hidden");
            text.setAttribute("fill", "#ffffff");
            text.style.fill = "#ffffff";
            text.textContent = name;
            labelGroup.appendChild(text);
          });
        }
      }
    }
  };

  // ინიციალიზაციის სტრატეგიები
  function startMapInitialization() {
    console.log("Starting map initialization process...");

    // Safari-ს აქვს პრობლემა object tag-ებთან - დავამატოთ პრელოადინგი
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isSafari || isIOS) {
      console.log("Safari/iOS detected, using optimized loading strategy");
    }

    // Strategy 1: შევამოწმოთ უკვე ჩატვირთულია თუ არა
    if (svgObject.contentDocument && svgObject.contentDocument.querySelector("svg")) {
      console.log("SVG already loaded, initializing immediately");
      initializeMap();
      return;
    }

    // Strategy 2: load event listener
    svgObject.addEventListener("load", () => {
      console.log("SVG load event fired");
      // Safari-სთვის დამატებითი დაყოვნება
      const delay = isSafari || isIOS ? 300 : 100;
      setTimeout(initializeMap, delay);
    });

    // Strategy 3: error handling
    svgObject.addEventListener("error", () => {
      console.error("SVG failed to load");
      hideLoadingIndicator();
    });

    // Strategy 4: Polling - Safari-სთვის ოპტიმიზირებული
    let pollCount = 0;
    const maxPolls = 40; // 40 * 200ms = 8 წამი
    const pollInterval = setInterval(() => {
      pollCount++;

      if (isMapInitialized) {
        clearInterval(pollInterval);
        return;
      }

      if (svgObject.contentDocument && svgObject.contentDocument.querySelector("svg")) {
        console.log("Map initialized via polling after", pollCount, "attempts");
        initializeMap();
        clearInterval(pollInterval);
        return;
      }

      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        console.error("Failed to initialize map after polling");
        hideLoadingIndicator();
      }
    }, 200);
  }

  // დაიწყოს ინიციალიზაცია
  startMapInitialization();

  // Window load event
  window.addEventListener("load", () => {
    console.log("Window loaded, checking map...");
    if (!isMapInitialized) {
      setTimeout(() => {
        if (!isMapInitialized) {
          console.log("Map still not initialized after window load, retrying...");
          initializeMap();
        }
      }, 500);
    }
  });

  // Page visibility change - Safari-სთვის
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !isMapInitialized) {
      console.log("Page became visible, checking map...");
      setTimeout(initializeMap, 200);
    }
  });
});
