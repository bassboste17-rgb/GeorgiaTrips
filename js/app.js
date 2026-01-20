const firebaseConfig = {
  apiKey: "AIzaSyBBybpmsrByBZtwThfCd3u0pfHFjEL2ap0",
  authDomain: "rentime-e201e.firebaseapp.com",
  projectId: "rentime-e201e",
  storageBucket: "rentime-e201e.appspot.com",
  messagingSenderId: "420054668757",
  appId: "1:420054668757:web:0accf1d8b9d621fd94195c",
  measurementId: "G-DGWLG9P1ZB"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

// Sign in with Email
document.getElementById('signin-email-form').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('signin-email').value;
  const pass = document.getElementById('signin-password').value;
  auth.signInWithEmailAndPassword(email, pass)
    .then(() => window.location.href = "home.html")
    .catch(err => alert(err.message));
});

// Sign up with Email
document.getElementById('signup-email-form').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const pass = document.getElementById('signup-password').value;
  auth.createUserWithEmailAndPassword(email, pass)
    .then(() => window.location.href = "home.html")
    .catch(err => alert(err.message));
});

// Google Sign-in
document.getElementById('google-signin').addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(() => window.location.href = "home.html")
    .catch(err => alert(err.message));
});
