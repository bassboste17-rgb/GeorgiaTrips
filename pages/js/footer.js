// Load footer
fetch("/pages/footer.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("footer").innerHTML = data

    if (typeof window.languageSwitcher !== "undefined") {
      setTimeout(() => {
        window.languageSwitcher.updatePageTranslations()
      }, 100)
    }

    // Listen for language changes
    window.addEventListener("languageChanged", () => {
      if (typeof window.languageSwitcher !== "undefined") {
        window.languageSwitcher.updatePageTranslations()
      }
    })
  })
