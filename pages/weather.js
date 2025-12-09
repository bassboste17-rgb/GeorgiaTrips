// Weather API Configuration
// Get your free API key from: https://openweathermap.org/api
const WEATHER_API_KEY = "c39748bc86e4a327a1ce839c8b47b677" // Replace with your actual API key
const WEATHER_API_BASE = "https://api.openweathermap.org/data/2.5"

// Georgian regions with their coordinates
const REGIONS = {
  აფხაზეთი: { lat: 43.0015, lon: 41.0234, name: "Abkhazia" },
  აჭარა: { lat: 41.6168, lon: 41.6367, name: "Ajara" },
  გურია: { lat: 41.9667, lon: 42.0167, name: "Guria" },
  იმერეთი: { lat: 42.2667, lon: 42.7167, name: "Imereti" },
  კახეთი: { lat: 41.6488, lon: 45.6944, name: "Kakheti" },
  "ქვემო ქართლი": { lat: 41.5667, lon: 44.6333, name: "Kvemo Kartli" },
  "მცხეთა-მთიანეთი": { lat: 42.0667, lon: 44.7167, name: "Mtskheta-Mtianeti" },
  "რაჭა-ლეჩხუმი და ქვემო სვანეთი": { lat: 42.6667, lon: 43.0333, name: "Racha-Lechkhumi" },
  "სამცხე-ჯავახეთი": { lat: 41.55, lon: 43.2833, name: "Samtskhe-Javakheti" },
  "შიდა ქართლი": { lat: 42.0833, lon: 44.1, name: "Shida Kartli" },
  "სამეგრელო-ზემო სვანეთი": { lat: 42.7333, lon: 42.1667, name: "Samegrelo-Zemo Svaneti" },
  თბილისი: { lat: 41.7151, lon: 44.8271, name: "Tbilisi" },
}

// Weather icons mapping
const WEATHER_ICONS = {
  "01d": "☀️",
  "01n": "🌙",
  "02d": "⛅",
  "02n": "☁️",
  "03d": "☁️",
  "03n": "☁️",
  "04d": "☁️",
  "04n": "☁️",
  "09d": "🌧️",
  "09n": "🌧️",
  "10d": "🌦️",
  "10n": "🌧️",
  "11d": "⛈️",
  "11n": "⛈️",
  "13d": "❄️",
  "13n": "❄️",
  "50d": "🌫️",
  "50n": "🌫️",
}

let currentPeriod = "hourly"

function t(key) {
  const currentLang = localStorage.getItem("language") || "ka"
  const translations = window.translations || {}
  return translations[currentLang]?.[key] || translations["ka"]?.[key] || key
}

// Initialize weather section
document.addEventListener("DOMContentLoaded", () => {
  setupWeatherTabs()

  // Check if API key is set
  if (WEATHER_API_KEY === "YOUR_API_KEY_HERE") {
    showWeatherError(t("weatherApiKeyError"))
    return
  }

  loadWeatherData()
})

function setupWeatherTabs() {
  const tabs = document.querySelectorAll(".weather-tab")

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove("active"))

      // Add active class to clicked tab
      this.classList.add("active")

      // Update current period
      currentPeriod = this.getAttribute("data-period")

      // Reload weather data
      loadWeatherData()
    })
  })
}

async function loadWeatherData() {
  const container = document.getElementById("weather-container")
  container.innerHTML = `<div class="loading-weather">${t("weatherLoading")}</div>`

  console.log("[v0] Loading weather data for period:", currentPeriod)

  try {
    const weatherPromises = Object.entries(REGIONS).map(([regionName, coords]) =>
      fetchWeatherForRegion(regionName, coords),
    )

    const weatherData = await Promise.all(weatherPromises)
    console.log("[v0] Weather data loaded successfully:", weatherData)
    displayWeatherData(weatherData)
  } catch (error) {
    console.error("[v0] Weather fetch error:", error)
    showWeatherError(t("weatherLoadError") + " " + error.message)
  }
}

async function fetchWeatherForRegion(regionName, coords) {
  let endpoint

  switch (currentPeriod) {
    case "hourly":
      // For 24-hour forecast, we'll use the 5-day forecast and take first 8 entries (24 hours)
      endpoint = `${WEATHER_API_BASE}/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&lang=ka&appid=${WEATHER_API_KEY}`
      break
    case "daily":
      // For 7-day forecast
      endpoint = `${WEATHER_API_BASE}/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&lang=ka&appid=${WEATHER_API_KEY}`
      break
    case "monthly":
      // For 30-day forecast (using current + 5-day forecast as approximation)
      endpoint = `${WEATHER_API_BASE}/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&lang=ka&appid=${WEATHER_API_KEY}`
      break
    default:
      endpoint = `${WEATHER_API_BASE}/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&lang=ka&appid=${WEATHER_API_KEY}`
  }

  console.log("[v0] Fetching weather for", regionName, "from:", endpoint)

  const response = await fetch(endpoint)

  console.log("[v0] API response status for", regionName, ":", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] API error response:", errorText)
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
  }

  const data = await response.json()
  console.log("[v0] Weather data for", regionName, ":", data)

  return {
    regionName,
    data,
    coords,
  }
}

function displayWeatherData(weatherData) {
  const container = document.getElementById("weather-container")
  container.innerHTML = ""

  console.log("[v0] Displaying weather data for", weatherData.length, "regions")

  weatherData.forEach(({ regionName, data }) => {
    const card = createWeatherCard(regionName, data)
    container.appendChild(card)
  })

  console.log("[v0] Weather cards displayed successfully")
}

function createWeatherCard(regionName, data) {
  const card = document.createElement("div")
  card.className = "weather-card"

  if (currentPeriod === "hourly" || currentPeriod === "daily" || currentPeriod === "monthly") {
    // Forecast data
    const current = data.list[0]
    const icon = WEATHER_ICONS[current.weather[0].icon] || "🌤️"
    const temp = Math.round(current.main.temp)
    const description = current.weather[0].description
    const humidity = current.main.humidity
    const windSpeed = Math.round(current.wind.speed * 3.6) // Convert m/s to km/h

    let forecastHTML = ""
    let forecastItems = []

    if (currentPeriod === "hourly") {
      // Show 24 hours (8 entries, each 3 hours apart)
      forecastItems = data.list.slice(0, 8)
      forecastHTML = forecastItems
        .map((item) => {
          const time = new Date(item.dt * 1000).toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" })
          const itemIcon = WEATHER_ICONS[item.weather[0].icon] || "🌤️"
          const itemTemp = Math.round(item.main.temp)
          return `
          <div class="forecast-item">
            <span class="forecast-time">${time}</span>
            <span class="forecast-icon">${itemIcon}</span>
            <span class="forecast-temp">${itemTemp}°C</span>
          </div>
        `
        })
        .join("")
    } else if (currentPeriod === "daily") {
      const dailyData = []
      const seenDates = new Set()
      let lastDate = null

      // Group by day and pick midday forecast (around 12:00) for each day
      for (const item of data.list) {
        const itemDate = new Date(item.dt * 1000)
        const dateString = itemDate.toLocaleDateString("ka-GE")
        const hour = itemDate.getHours()

        // Only add one entry per day, preferring midday (12:00) forecasts
        if (!seenDates.has(dateString)) {
          if (!lastDate || lastDate !== dateString) {
            // If this is a midday forecast or we don't have this day yet
            if (hour >= 11 && hour <= 14) {
              dailyData.push(item)
              seenDates.add(dateString)
              lastDate = dateString
            } else if (dailyData.length === 0 || lastDate !== dateString) {
              // Add first available forecast for today if no midday found
              dailyData.push(item)
              seenDates.add(dateString)
              lastDate = dateString
            }
          }
        }
      }

      // If we don't have enough daily data, fill with remaining forecasts
      if (dailyData.length < 5) {
        const existingTimes = new Set(dailyData.map((d) => d.dt))
        for (const item of data.list) {
          if (!existingTimes.has(item.dt)) {
            const dateString = new Date(item.dt * 1000).toLocaleDateString("ka-GE")
            if (!seenDates.has(dateString) && dailyData.length < 5) {
              dailyData.push(item)
              seenDates.add(dateString)
            }
          }
        }
      }

      forecastHTML = dailyData
        .map((item) => {
          const date = new Date(item.dt * 1000)
          const dayName = date.toLocaleDateString("ka-GE", { weekday: "short" })
          const dayNum = date.getDate()
          const itemIcon = WEATHER_ICONS[item.weather[0].icon] || "🌤️"
          const itemTemp = Math.round(item.main.temp)
          return `
          <div class="forecast-item">
            <span class="forecast-time">${dayName} ${dayNum}</span>
            <span class="forecast-icon">${itemIcon}</span>
            <span class="forecast-temp">${itemTemp}°C</span>
          </div>
        `
        })
        .join("")

      forecastHTML += `<div style="grid-column: 1/-1; text-align: center; font-size: 0.85rem; color: #888; margin-top: 0.5rem;">
        ${t("weatherNote5Day")}
      </div>`
    } else {
      const dailyData = []
      const seenDates = new Set()

      for (const item of data.list) {
        const dateString = new Date(item.dt * 1000).toLocaleDateString("ka-GE")
        if (!seenDates.has(dateString)) {
          seenDates.add(dateString)
          dailyData.push(item)
        }
      }

      forecastHTML = dailyData
        .map((item) => {
          const date = new Date(item.dt * 1000)
          const monthName = date.toLocaleDateString("ka-GE", { month: "short" })
          const dayNum = date.getDate()
          const itemIcon = WEATHER_ICONS[item.weather[0].icon] || "🌤️"
          const itemTemp = Math.round(item.main.temp)
          return `
          <div class="forecast-item">
            <span class="forecast-time">${monthName} ${dayNum}</span>
            <span class="forecast-icon">${itemIcon}</span>
            <span class="forecast-temp">${itemTemp}°C</span>
          </div>
        `
        })
        .join("")

      forecastHTML += `<div style="grid-column: 1/-1; text-align: center; font-size: 0.85rem; color: #888; margin-top: 0.5rem;">
        ${t("weatherNote15Day")}
      </div>`
    }

    card.innerHTML = `
      <div class="weather-card-header">
        <div class="weather-region-name">${regionName}</div>
        <div class="weather-icon">${icon}</div>
      </div>
      <div class="weather-temp">${temp}°C</div>
      <div class="weather-description">${description}</div>
      <div class="weather-details">
        <div class="weather-detail">
          <i class="fas fa-tint"></i>
          <span>${humidity}%</span>
        </div>
        <div class="weather-detail">
          <i class="fas fa-wind"></i>
          <span>${windSpeed} ${t("weatherWindSpeed")}</span>
        </div>
      </div>
      <div class="weather-forecast-list">
        ${forecastHTML}
      </div>
    `
  }

  return card
}

function showWeatherError(message) {
  const container = document.getElementById("weather-container")
  container.innerHTML = `
    <div class="weather-error">
      <i class="fas fa-exclamation-triangle"></i>
      <p>${message}</p>
      <p style="margin-top: 1rem; font-size: 0.9rem;">
        ${t("weatherApiKeyHelp")} 
        <a href="https://openweathermap.org/api" target="_blank" style="color: #e5383b; text-decoration: underline;">
          openweathermap.org/api
        </a>
      </p>
    </div>
  `
}
