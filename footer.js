// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase კონფიგურაცია
const firebaseConfig = {
  apiKey: "AIzaSyBBybpmsrByBZtwThfCd3u0pfHFjEL2ap0",
  authDomain: "rentime-e201e.firebaseapp.com",
  projectId: "rentime-e201e",
  storageBucket: "rentime-e201e.appspot.com",
  messagingSenderId: "420054668757",
  appId: "1:420054668757:web:0accf1d8b9d621fd94195c",
  measurementId: "G-DGWLG9P1ZB"
};

// Firebase ინიციალიზაცია
let app;
let db;

try {
  app = initializeApp(firebaseConfig, 'footer-app');
  db = getFirestore(app);
} catch (error) {
  const { getApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
  try {
    app = getApp('footer-app');
    db = getFirestore(app);
  } catch (e) {
    app = initializeApp(firebaseConfig, 'footer-app');
    db = getFirestore(app);
  }
}

// Newsletter ფუნქციის ინიციალიზაცია
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  const emailInput = document.getElementById('newsletterEmail');
  const messageEl = document.getElementById('newsletterMessage');

  if (!form || !emailInput) {
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim().toLowerCase();
    
    if (!email) {
      showMessage('newsletterEnterEmail', 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
      const existingQuery = query(
        collection(db, "newsletter_subscribers"),
        where("email", "==", email)
      );
      const existingDocs = await getDocs(existingQuery);

      if (!existingDocs.empty) {
        showMessage('newsletterAlreadySubscribed', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        return;
      }

      await addDoc(collection(db, "newsletter_subscribers"), {
        email: email,
        subscribedAt: serverTimestamp()
      });

      showMessage('newsletterSuccess', 'success');
      emailInput.value = '';

    } catch (error) {
      console.error('Error subscribing:', error);
      showMessage('newsletterError', 'error');
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
  });

  function showMessage(i18nKey, type) {
    messageEl.setAttribute('data-i18n', i18nKey);
    messageEl.style.display = 'block';
    
    if (type === 'success') {
      messageEl.style.color = '#28a745';
    } else if (type === 'error') {
      messageEl.style.color = '#dc3545';
    } else if (type === 'warning') {
      messageEl.style.color = '#ffc107';
    }

    // თარგმნა languageSwitcher-ით
    if (typeof window.languageSwitcher !== "undefined") {
      window.languageSwitcher.updatePageTranslations();
    }

    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 5000);
  }
}

// Load footer
fetch("footer.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("footer").innerHTML = data;

    initNewsletter();

    if (typeof window.languageSwitcher !== "undefined") {
      setTimeout(() => {
        window.languageSwitcher.updatePageTranslations();
      }, 100);
    }

    window.addEventListener("languageChanged", () => {
      if (typeof window.languageSwitcher !== "undefined") {
        window.languageSwitcher.updatePageTranslations();
      }
    });
  });