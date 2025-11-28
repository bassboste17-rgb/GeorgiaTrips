import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js"
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js"

// Firebase კონფიგურაცია
const firebaseConfig = {
  apiKey: "AIzaSyBBybpmsrByBZtwThfCd3u0pfHFjEL2ap0",
  authDomain: "rentime-e201e.firebaseapp.com",
  projectId: "rentime-e201e",
  storageBucket: "rentime-e201e.firebasestorage.app",
  messagingSenderId: "420054668757",
  appId: "1:420054668757:web:0accf1d8b9d621fd94195c",
  measurementId: "G-DGWLG9P1ZB",
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

// Load navbar
fetch("navbar.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("navbar").innerHTML = data

    const translationsScript = document.createElement("script")
    translationsScript.src = "translations.js"
    document.head.appendChild(translationsScript)

    // Mobile menu toggle
    const toggle = document.querySelector(".mobile-menu-toggle")
    const navbarRight = document.querySelector(".navbar-right")

    toggle?.addEventListener("click", () => {
      navbarRight.classList.toggle("active")
    })

    const authLink = document.getElementById("auth-link")

    function updateActiveLanguageButton() {
      const currentLang = localStorage.getItem("language") || "ka"
      const langButtons = document.querySelectorAll(".languages button")

      langButtons.forEach((btn) => {
        btn.classList.remove("active")
        const btnLang = btn.getAttribute("onclick").match(/'(\w+)'/)[1]
        if (btnLang === currentLang) {
          btn.classList.add("active")
        }
      })
    }

    // Update navbar translations when language changes
    function updateNavbarTranslations() {
      if (typeof window.languageSwitcher !== "undefined") {
        // Update nav menu items
        const navItems = document.querySelectorAll(".nav-menu a")
        if (navItems.length >= 5) {
          navItems[0].textContent = window.languageSwitcher.translate("navHome")
          navItems[1].textContent = window.languageSwitcher.translate("navPosts")
          navItems[2].textContent = window.languageSwitcher.translate("navAbout")
          navItems[3].textContent = window.languageSwitcher.translate("navContact")
          navItems[4].textContent = window.languageSwitcher.translate("navBooking")
        }

        // Update auth dropdown if user is logged in
        const userMenu = document.querySelector(".user-menu")
        if (userMenu) {
          const dropdownLinks = userMenu.querySelectorAll(".dropdown a")
          if (dropdownLinks.length >= 4) {
            dropdownLinks[0].textContent = window.languageSwitcher.translate("navMyProfile")
            dropdownLinks[1].textContent = window.languageSwitcher.translate("navAddPost")
            dropdownLinks[2].textContent = window.languageSwitcher.translate("navMyPosts")
            dropdownLinks[3].textContent = window.languageSwitcher.translate("navLogout")
          }
        } else {
          // Update auth link for non-logged in users
          const authLinkElement = authLink.querySelector("a")
          if (authLinkElement) {
            authLinkElement.textContent = window.languageSwitcher.translate("navAuth")
          }
        }

        updateActiveLanguageButton()
      }
    }

    // Listen for language changes
    window.addEventListener("languageChanged", updateNavbarTranslations)

    setTimeout(() => {
      updateActiveLanguageButton()
    }, 100)

    onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        // მომხმარებელი ავტორიზირებულია და email დადასტურებულია
        const username = user.displayName || localStorage.getItem("username") || "მომხმარებელი"

        // განახლება localStorage-ში სინქრონიზაციისთვის
        localStorage.setItem("username", username)
        localStorage.setItem("userEmail", user.email)

        // dropdown მენიუს HTML
        authLink.innerHTML = `
          <div class="user-menu">
            <span class="user-name">${username}</span>
            <div class="dropdown">
              <a href="profile.html" data-i18n="navMyProfile">${window.languageSwitcher?.translate("navMyProfile") || "ჩემი პროფილი"}</a>
              <a href="addPost.html" data-i18n="navAddPost">${window.languageSwitcher?.translate("navAddPost") || "პოსტის დამატება"}</a>
              <a href="myposts.html" data-i18n="navMyPosts">${window.languageSwitcher?.translate("navMyPosts") || "ჩემი პოსტები"}</a>
              <a href="#" id="logout-btn" data-i18n="navLogout">${window.languageSwitcher?.translate("navLogout") || "გასვლა"}</a>
            </div>
          </div>
        `

        // Dropdown toggle (click-ზე)
        const userName = document.querySelector(".user-name")
        const dropdown = document.querySelector(".dropdown")
        let open = false

        userName.addEventListener("click", (e) => {
          e.stopPropagation()
          open = !open
          dropdown.style.display = open ? "block" : "none"
        })

        const logoutBtn = document.getElementById("logout-btn")
        logoutBtn?.addEventListener("click", async (e) => {
          e.preventDefault()

          try {
            // Firebase-დან გასვლა
            await signOut(auth)

            // localStorage-ის გასუფთავება
            localStorage.removeItem("username")
            localStorage.removeItem("userEmail")

            // sessionStorage-ის გასუფთავება
            sessionStorage.clear()

            console.log("[v0] User signed out successfully")

            // გადამისამართება login გვერდზე
            window.location.href = "login.html"
          } catch (error) {
            console.error("გასვლის შეცდომა:", error)
            alert("გასვლისას დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან.")
          }
        })

        // გარეთ დაჭერისას დაიხუროს dropdown
        document.addEventListener("click", (e) => {
          if (!e.target.closest(".user-menu")) {
            dropdown.style.display = "none"
            open = false
          }
        })
      } else {
        // მომხმარებელი არ არის ავტორიზირებული
        localStorage.removeItem("username")
        localStorage.removeItem("userEmail")

        authLink.innerHTML = `<a href="login.html" class="auth-link" data-i18n="navAuth">${window.languageSwitcher?.translate("navAuth") || "ავტორიზაცია"}</a>`
      }

      // Apply translations after auth state is set
      setTimeout(updateNavbarTranslations, 100)
    })
  })
  .catch((err) => console.error("Navbar loading failed:", err))
