/**
 * Autor: jl_
 * ADSI - SENA
 * email: devluisluzardo@gmail.com
 * Fecha creacion: 21 Sept-2023
 *
 * desscripcion: v.1.6. - Lógica de autenticación y redirección.
 * Este script se carga en index.html
 * Fecha actualización : 27 julio - 2025
 **/

// Firebase: Authentication
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// Firebase: RealTime Database
import {
    getDatabase,
    ref,
    set,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

// Firebase: Initialize service
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCQMU7Gy-S3sLJwobGwti4vz73oTF3gu8E",
  authDomain: "gmynimaxipedidos.firebaseapp.com",
  databaseURL: "https://gmynimaxipedidos-default-rtdb.firebaseio.com",
  projectId: "gmynimaxipedidos",
  storageBucket: "gmynimaxipedidos.firebasestorage.app",
  messagingSenderId: "506980395484",
  appId: "1:506980395484:web:d2c7d8ad519e1caeb08719",
  measurementId: "G-6MJP58HB6W"
};


const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();


// DOM Elements for index.html
const googleSignInSection = document.getElementById('google-signin-section'); // New container for Google
const userLoggedInSection = document.getElementById('user-logged-in-section'); // New container for logged-in user
const googleSignInButton = document.getElementById('google-signin-button');
const logoutButton = document.getElementById('logout-button');
const userNameSpan = document.getElementById('user-name');
const infoLabel = document.getElementById('info-label'); // Text "Inicia sesión con Google para continuar."
const continueButton = document.getElementById('continue-button'); 
const userImage = document.getElementById('user-image'); // Element for user image

// --- Navigation Functions ---

function goToLoginSplash() {
    // Already on the login page, no action needed unless explicitly redirecting from h ome
    if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        window.location.href = 'index3.html';
    }
}

function goToMainInterface() {
    window.location.href = 'aigmynimaxihome.html';
}

// --- UI Update Functions for index.html ---

function updateUI(user) {
    if (userNameSpan && googleSignInButton && logoutButton && infoLabel && userImage && continueButton && googleSignInSection && userLoggedInSection) { 
        if (user) {
            // Authenticated user
            googleSignInSection.classList.add('hidden'); // Hide Google section
            userLoggedInSection.classList.remove('hidden'); // Show logged-in user section

            userNameSpan.textContent = user.displayName; // Display username
            
            userImage.src = "https://raw.githubusercontent.com/Mynimaxitienda/gmynimaxitiendaimagenes/refs/heads/main/Navbar/sliderencab/usuarios.png"; // Active user image
            //continueButton.disabled = false; // Enable "Pide Ya..." button
            continueButton.style.opacity = '1'; // Ensure it's not faded
            continueButton.style.cursor = 'pointer'; // Normal cursor
        } else {
            // Unauthenticated user
            googleSignInSection.classList.remove('hidden'); // Show Google section
            userLoggedInSection.classList.add('hidden'); // Hide logged-in user section

            userNameSpan.textContent = ''; // Clear username
            
            userImage.src = "https://raw.githubusercontent.com/Mynimaxitienda/gmynimaxitiendaimagenes/refs/heads/main/Navbar/sliderencab/usuarioinac.png"; // Inactive user image
            //continueButton.disabled = false; // Disable "Pide Ya..." button
            //continueButton.style.opacity = '0.6'; // Visually fade it
            continueButton.style.cursor = 'not-allowed'; // Not-allowed cursor
        }
    }
}

// --- Firebase Authentication ---

if (googleSignInButton) {
    googleSignInButton.addEventListener('click', () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                const user = result.user;
                //console.log("User authenticated with Google:", user);
                updateUI(user);
                registerUserInDB(user);
            }).catch((error) => {
                console.error("Error during Google sign-in:", error.message);
                displayMessage("Error de inicio de sesión", error.message);
            });
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        signOut(auth).then(() => {
            //console.log("User logged out.");
            updateUI(null);
        }).catch((error) => {
            console.error("Error logging out:", error);
            displayMessage("Error al cerrar sesión", error.message);
        });
    });
}

// Event listener for "Pide Ya..." button (on index.html)
if (continueButton) {
    continueButton.addEventListener('click', () => {
        // Only allow navigation if the button is not disabled
        if (!continueButton.disabled) {
            goToMainInterface();
        } else {
            displayMessage("Acceso Denegado", "Debes iniciar sesión para continuar.");
        }
    });
}

// Check authentication state on page load
onAuthStateChanged(auth, (user) => {
  updateUI(user);
});


// --- Firebase Realtime Database ---

function registerUserInDB(user) {
    const uid = user.uid;
    const uname = user.displayName;
    const uemail = user.email;
    const emailEncoded = btoa(uemail).replace(/=/g, ''); // Encode email in Base64 and remove '='

    const db = getDatabase();
    const dbf = ref(db, 'usuario/idkey:' + emailEncoded);

    onValue(dbf, (snapshot) => {
        let data = snapshot.val();
        if (data !== null) {
            //console.log("User authenticated and already registered in DB on page load!");
        } else {
            //console.log('No value in the node on page load, registering user...');
            set(ref(db, 'usuario/idkey:' + emailEncoded), {
                nombre: uname,
                email: uemail,
                key: uid,
                idrol: 4, // Default Role
                idnivel: 2 // Default Level
            })
            .then(() => {
                //console.log("First user registration successful on page load!");
            })
            .catch((error) => {
                console.error("Error registering user on page load:", error);
                displayMessage("Error de registro", "No se pudo registrar el usuario en la base de datos.");
            });
        }
    }, {
        onlyOnce: true
    });
}

// --- Custom Message Box (replacing alert) ---
function displayMessage(title, message) {
    const messageBox = document.createElement('div');
    messageBox.className = 'message-box'; // Apply the CSS class
    messageBox.innerHTML = `
        <h4>${title}</h4>
        <p>${message}</p>
        <button onclick="this.parentNode.remove()">Cerrar</button>
    `;
    document.body.appendChild(messageBox);
}

// Initial check on page load to handle first-time visitors
document.addEventListener('DOMContentLoaded', () => {
    // No automatic timer to go to main interface
    // User must use the "Pide Ya..." button
});
