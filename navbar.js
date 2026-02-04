import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js"
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js"
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js"

// Immediately set English as default if no language is saved (runs before anything else)
;(function() {
  const savedLang = localStorage.getItem("language")
  if (!savedLang) {
    localStorage.setItem("language", "en")
    // Reload page to apply English translations on first visit
    window.location.reload()
  }
})()

// Firebase configuration
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
const db = getFirestore(app)

// Function to format display name (for Facebook long names)
function formatDisplayName(name, maxLength = 15) {
  if (!name) return "User";
  
  // If name is already short, return as is
  if (name.length <= maxLength) return name;
  
  // If name contains space, take only first name
  const firstName = name.split(' ')[0];
  
  // If first name is also long, shorten it
  if (firstName.length > maxLength) {
    return firstName.substring(0, maxLength - 2) + '..';
  }
  
  return firstName;
}

// Function to check if user is logged in with social provider or phone
function isSocialOrPhoneProvider(user) {
  if (!user || !user.providerData || user.providerData.length === 0) {
    return false;
  }
  const socialProviders = ['google.com', 'facebook.com', 'twitter.com', 'github.com', 'phone'];
  return user.providerData.some(provider => socialProviders.includes(provider.providerId));
}

// Function to get user's name from Firestore
async function getUserNameFromFirestore(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Check multiple possible name fields
      return userData.name || userData.displayName || userData.fullName || userData.firstName || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user name from Firestore:", error);
    return null;
  }
}

// Navbar scroll effect - transparent at top, solid when scrolled
function handleNavbarScroll() {
  // Try multiple selectors to find the navbar
  const navbar = document.querySelector('header.navbar') || 
                 document.querySelector('.navbar') || 
                 document.getElementById('navbar');
  
  if (!navbar) return;
  
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

// Load navbar
fetch("navbar.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("navbar").innerHTML = data
    
    // Initial scroll check after navbar loads
    handleNavbarScroll();
    
    // Add scroll listener AFTER navbar is loaded
    window.addEventListener('scroll', handleNavbarScroll, { passive: true });

    // Check if translations.js is already loaded
    if (typeof window.translations === 'undefined' && typeof window.languageSwitcher === 'undefined') {
      const translationsScript = document.createElement("script")
      translationsScript.src = "translations.js"
      document.head.appendChild(translationsScript)
    }

    // Mobile menu toggle
    const toggle = document.querySelector(".mobile-menu-toggle")
    const navbarRight = document.querySelector(".navbar-right")

    toggle?.addEventListener("click", () => {
      navbarRight.classList.toggle("active")
    })

    const authLink = document.getElementById("auth-link")
    const notificationBell = document.getElementById("notificationBell")

    // Function to update active language button
    function updateActiveLanguageButton() {
      // Default language is 'en' (English)
      const currentLang = localStorage.getItem("language") || "en"
      const langButtons = document.querySelectorAll(".languages button")

      langButtons.forEach((btn) => {
        btn.classList.remove("active")
        const btnLang = btn.getAttribute("data-lang")
        if (btnLang === currentLang) {
          btn.classList.add("active")
        }
      })
    }

    function changeLanguageAndReload(lang) {
      // Change language in localStorage
      localStorage.setItem("language", lang)
      
      // Change language with languageSwitcher
      if (window.languageSwitcher && typeof window.languageSwitcher.setLanguage === "function") {
        window.languageSwitcher.setLanguage(lang)
      }

      // Update active button
      updateActiveLanguageButton()

      // Reload page
      setTimeout(() => {
        window.location.reload()
      }, 20)
    }

    // Make function global so it can be accessed from navbar.html
    window.changeLanguageAndReload = changeLanguageAndReload

    function setupLanguageButtons() {
      const langButtons = document.querySelectorAll(".languages button")

      langButtons.forEach((btn) => {
        btn.removeAttribute("onclick")

        btn.addEventListener("click", function () {
          const lang = this.getAttribute("data-lang") || "en"
          changeLanguageAndReload(lang)
        })
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

    // Initialize default language (English) on first load
    function initializeDefaultLanguage() {
      const savedLang = localStorage.getItem("language")
      if (!savedLang) {
        // If no language is saved, set English and reload
        localStorage.setItem("language", "en")
        
        // Apply English using languageSwitcher if available
        if (window.languageSwitcher && typeof window.languageSwitcher.setLanguage === "function") {
          window.languageSwitcher.setLanguage("en")
        }
        
        // Reload to apply English translations
        setTimeout(() => {
          window.location.reload()
        }, 50)
        return
      }
      
      // If language is already saved, just update UI
      updateActiveLanguageButton()
      setupLanguageButtons()
    }

    setTimeout(() => {
      initializeDefaultLanguage()
    }, 100)

    // Notifications listener function for navbar
    function setupNavbarNotificationsListener(user) {
      if (!user) return

      const notifQuery = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        where("read", "==", false),
      )

      onSnapshot(
        notifQuery,
        (snapshot) => {
          const unreadCount = snapshot.size
          const navbarNotifBadge = document.getElementById("navbarNotifBadge")

          if (navbarNotifBadge) {
            navbarNotifBadge.textContent = unreadCount
            navbarNotifBadge.style.display = unreadCount > 0 ? "flex" : "none"
          }
        },
        (error) => {
          console.error("Notification listener error:", error)
        },
      )
    }

    // Function to render user menu
    function renderUserMenu(rawUsername) {
      // Formatted name for navbar (short version)
      const displayUsername = formatDisplayName(rawUsername)
      
      // Save full name to localStorage
      localStorage.setItem("username", rawUsername)

      // Dropdown menu HTML
      authLink.innerHTML = `
        <div class="user-menu">
          <span class="user-name" title="${rawUsername}">${displayUsername}</span>
          <div class="dropdown">
            <a href="profile.html" data-i18n="navMyProfile">${window.languageSwitcher?.translate("navMyProfile") || "My Profile"}</a>
            <a href="addPost.html" data-i18n="navAddPost">${window.languageSwitcher?.translate("navAddPost") || "Add Post"}</a>
            <a href="myposts.html" data-i18n="navMyPosts">${window.languageSwitcher?.translate("navMyPosts") || "My Posts"}</a>
            <a href="#" id="logout-btn" data-i18n="navLogout">${window.languageSwitcher?.translate("navLogout") || "Logout"}</a>
          </div>
        </div>
      `

      // Dropdown toggle (on click)
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
          // Sign out from Firebase
          await signOut(auth)

          // Clear localStorage
          localStorage.removeItem("username")
          localStorage.removeItem("userEmail")

          // Clear sessionStorage
          sessionStorage.clear()

          // Redirect to login page
          window.location.href = "login.html"
        } catch (error) {
          console.error("Logout error:", error)
          alert("An error occurred while logging out. Please try again.")
        }
      })

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".user-menu")) {
          dropdown.style.display = "none"
          open = false
        }
      })
    }

    onAuthStateChanged(auth, async (user) => {
      // Fix: Don't require emailVerified for Facebook/Google/Phone users
      // Only require emailVerified for email/password registered users
      const isValidUser = user && (user.emailVerified || isSocialOrPhoneProvider(user));
      
      if (isValidUser) {
        // User is authenticated
        // First try to get name from Firebase Auth
        let rawUsername = user.displayName;
        
        // If no displayName (common for phone auth), try localStorage
        if (!rawUsername) {
          rawUsername = localStorage.getItem("username");
        }
        
        // If still no name, fetch from Firestore (this is where phone registration saves the name)
        if (!rawUsername || rawUsername === "User") {
          const firestoreName = await getUserNameFromFirestore(user.uid);
          if (firestoreName) {
            rawUsername = firestoreName;
          }
        }
        
        // Fallback to "User" if all else fails
        if (!rawUsername) {
          rawUsername = "User";
        }
        
        // Save email/phone to localStorage
        localStorage.setItem("userEmail", user.email || user.phoneNumber || "")

        // Show notification bell when user is authenticated
        if (notificationBell) {
          notificationBell.classList.add("show")
        }

        // Start listening for notifications
        setupNavbarNotificationsListener(user)

        // Render user menu with the username
        renderUserMenu(rawUsername)
      } else {
        // User is not authenticated
        localStorage.removeItem("username")
        localStorage.removeItem("userEmail")

        // Hide notification bell when user is not authenticated
        if (notificationBell) {
          notificationBell.classList.remove("show")
        }

        authLink.innerHTML = `<a href="login.html" class="auth-link" data-i18n="navAuth">${window.languageSwitcher?.translate("navAuth") || "Login"}</a>`
      }

      // Apply translations after auth state is set
      setTimeout(updateNavbarTranslations, 100)
    })
  })
  .catch((err) => console.error("Navbar loading failed:", err))
