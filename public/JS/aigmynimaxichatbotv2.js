//aigmynimaxichatbotv2.js

// --- Firebase SDK Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

// --- Firebase Configuration ---
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

// Initialize Firebase services
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const database = getDatabase(firebaseApp);
const provider = new GoogleAuthProvider();

// --- Global Variables for Chatbot Data (populated from Firebase) ---
let roomsData = {};
let categoriesMap = {};
let currentSelectedRoom = null; // To store the currently selected room's data

document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM elements references (Chatbot) ---
    const chatbotContainer = document.getElementById('chatbotContainer');
    const chatbotBody = document.getElementById('chatbotBody');
    const quickAccessButtons = document.querySelectorAll('.btn-quick-access'); // Initial buttons
    const closeChatbotButton = document.getElementById('closeChatbotButton');
    const reservationModal = document.getElementById('reservationModal');
    const reservationRoomNumberSpan = document.getElementById('reservationRoomNumber');
    const reservationDateInput = document.getElementById('reservationDate');
    const reservationTimeInput = document.getElementById('reservationTime');
    const roomStatusDisplay = document.getElementById('roomStatusDisplay');
    const confirmReservationBtn = document.getElementById('confirmReservationBtn');
    const featuresModal = document.getElementById('featuresModal');
    const imagesModal = document.getElementById('imagesModal');
    const videosModal = document.getElementById('videosModal');
    const genericModal = document.getElementById('genericModal'); // Generic modal for images/videos
    const genericModalContent = document.getElementById('genericModalContent'); // Content for generic modal

    // --- Get DOM elements references (Authentication from index.js) ---
    // These elements are expected to be present in the HTML page where this script is loaded.
    const googleSignInButton = document.getElementById('google-signin-button');
    const logoutButton = document.getElementById('logout-button');
    const userNameSpan = document.getElementById('user-name');
    const infoLabel = document.getElementById('info-label');
    const continueButton = document.getElementById('continue-button');
    let accessSplashButton = document.getElementById('access-splash-button'); // From aigmynimaxihome.html
    let displayUserName = document.getElementById('display-user-name'); // From aigmynimaxihome.html

    // --- Lógica adicional para manejar el clic del botón de acceso ---
    if (accessSplashButton) {
      accessSplashButton.addEventListener('click', () => {
        goToLoginSplash();
      });
    }
    
    // --- Navigation Functions (from index.js, adapted) ---
    // These functions dictate page redirection. If this script is the ONLY one for your app,
    // you'll need to ensure your HTML structure (index.html for login, aigmynimaxihome.html for main)
    // supports these redirects, or adapt to single-page application routing if preferred.
    function goToLoginSplash() {
        if (!window.location.pathname.endsWith('index3.html') && window.location.pathname !== '/') {
            window.location.href = 'index3.html';
        }
    }

    function goToMainInterface() {
        window.location.href = 'aigmynimaxihome.html';
    }

    // --- UI Update Functions (from index.js) ---
    function updateAuthUI(user) {
        if (userNameSpan && googleSignInButton && logoutButton && infoLabel) {
            if (user) {
                googleSignInButton.classList.add('hidden');
                userNameSpan.textContent = `Hola, ${user.displayName}!`;
                logoutButton.classList.remove('hidden');
                infoLabel.textContent = "Has iniciado sesión.";

                // Mensaje de autenticación restaurado aquí, sin el estilo especial
                //displayMessageInChatbot(`¡Hola, ${user.displayName}! Has iniciado sesión con Google.`, "bot");
            } else {
                userNameSpan.textContent = '';
                logoutButton.classList.add('hidden');
                googleSignInButton.classList.remove('hidden');
                infoLabel.textContent = "Inicia sesión con Google para continuar.";
            }
        }

        // Update elements specific to aigmynimaxihome.html if they exist
        if (window.location.pathname.endsWith('aigmynimaxihome.html')) {
            accessSplashButton = document.getElementById('access-splash-button');
            displayUserName = document.getElementById('display-user-name');

            if (user) {
                if (displayUserName) displayUserName.textContent = user.displayName;
                if (accessSplashButton) accessSplashButton.textContent = "Mi cuenta";
            } else {
                if (displayUserName) displayUserName.textContent = '';
                if (accessSplashButton) accessSplashButton.textContent = "Acceder";
            }
        }
    }

    // --- Firebase Authentication Listeners (from index.js) ---
    if (googleSignInButton) {
        googleSignInButton.addEventListener('click', () => {
            signInWithPopup(auth, provider)
                .then((result) => {
                    const user = result.user;
                    //console.log("Usuario autenticado con Google:", user);
                    updateAuthUI(user);
                    registerUserInDB(user);
                    // No automatic navigation; continue button handles it
                }).catch((error) => {
                    console.error("Error durante el inicio de sesión con Google:", error.message);
                    displayCustomMessage("Error de inicio de sesión", error.message);
                });
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            signOut(auth).then(() => {
                //console.log("Usuario ha cerrado sesión.");
                updateAuthUI(null);
            }).catch((error) => {
                //console.error("Error al cerrar sesión:", error);
                displayCustomMessage("Error al cerrar sesión", error.message);
            });
        });
    }

    if (continueButton) {
        continueButton.addEventListener('click', goToMainInterface);
    }

    // --- Firebase Authentication State Observer ---
    onAuthStateChanged(auth, (user) => {
        updateAuthUI(user); // Update UI based on auth state
        if (user) {
            //console.log("Usuario autenticado. Cargando datos del chatbot...");
            loadDataFromFirebase(); // Load chatbot data only if authenticated
        } else {
            //console.log("Usuario no autenticado. La información del chatbot puede ser limitada o no disponible.");
            // MODIFICACIÓN: Agregar link para autenticación
            //displayMessageInChatbot(`Por favor, inicia sesión para acceder a toda la información.<br><a href="#" onclick="window.goToLoginSplash()" style="color: #AD1457; text-decoration: underline; cursor: pointer;">Inicia sesión con Google para continuar.</a>`, "bot");
            // Optionally, you might load a limited set of data or prompt for login
            // If the chatbot should still show some content without auth, modify loadDataFromFirebase
            // to handle cases where `user` is null (e.g., fetch public data only).
        }
    });

    // --- Firebase Realtime Database Functions (from index.js and new for chatbot) ---
    function registerUserInDB(user) {
        const uid = user.uid;
        const uname = user.displayName;
        const uemail = user.email;
        const emailEncoded = btoa(uemail).replace(/=/g, '');

        const userRef = ref(database, 'usuario/idkey:' + emailEncoded);

        onValue(userRef, (snapshot) => {
            let data = snapshot.val();
            if (data !== null) {
                //console.log("Usuario ya registrado en DB.");
            } else {
                //console.log('Registrando nuevo usuario en DB...');
                set(userRef, {
                    nombre: uname,
                    email: uemail,
                    key: uid,
                    idrol: 4, // Default role
                    idnivel: 2 // Default level
                })
                .then(() => console.log("Primer registro del usuario exitoso."))
                .catch((error) => console.error("Error al registrar el usuario:", error));
            }
        }, { onlyOnce: true });
    }

    /**
     * Loads room and category data from Firebase Realtime Database.
     */
    function loadDataFromFirebase() {
        // Fetch rooms data
        const roomsRef = ref(database, 'rooms');
        onValue(roomsRef, (snapshot) => {
            roomsData = snapshot.val();
           // console.log("Rooms data loaded from Firebase:", roomsData);
            // Check if both data sets are loaded before initializing chatbot
            if (Object.keys(categoriesMap).length > 0 && Object.keys(roomsData).length > 0) {
                initializeChatbotWithFirebaseData();
            }
        }, (error) => {
            console.error("Error fetching rooms data:", error);
            displayMessageInChatbot("No se pudieron cargar los datos de las habitaciones. Intenta de nuevo más tarde.", "bot");
        });

        // Fetch categories data
        const categoriesRef = ref(database, 'categories');
        onValue(categoriesRef, (snapshot) => {
            categoriesMap = snapshot.val();
            //console.log("Categories data loaded from Firebase:", categoriesMap);
            // Check if both data sets are loaded before initializing chatbot
            if (Object.keys(roomsData).length > 0 && Object.keys(categoriesMap).length > 0) {
                initializeChatbotWithFirebaseData();
            }
        }, (error) => {
            console.error("Error fetching categories data:", error);
            displayMessageInChatbot("No se pudieron cargar los datos de las categorías. Intenta de nuevo más tarde.", "bot");
        });
    }

    /**
     * Initializes the chatbot display once Firebase data is available.
     */
    function initializeChatbotWithFirebaseData() {
        displayWelcomeMessage(); // Esto muestra el mensaje de bienvenida fijo

        // Si el usuario está autenticado, muestra el mensaje de confirmación de Google
        if (auth.currentUser) {
            displayMessageInChatbot(`Te has autenticado con Google.`, "bot");
        }

        // Adjunta los escuchadores de eventos para los botones de acceso rápido externos
        quickAccessButtons.forEach(button => {
            button.removeEventListener('click', handleQuickAccessClick); // Evita escuchadores duplicados
            button.addEventListener('click', handleQuickAccessClick);
        });
    }

    function handleQuickAccessClick(event) {
        const category = event.target.dataset.category;
        displayCategoryInfo(category);
    }

    // --- Custom Message Box (from index.js, replacing alert) ---
    function displayCustomMessage(title, message) {
        const messageBox = document.createElement('div');
        messageBox.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 9999;
            text-align: center;
            max-width: 350px;
            width: 90%;
        `;
        messageBox.innerHTML = `
            <h4 style="color: #ad1457; margin-bottom: 15px;">${title}</h4>
            <p style="color: #333; margin-bottom: 20px;">${message}</p>
            <button style="background-color: #f06292; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;" onclick="this.parentNode.remove()">Cerrar</button>
        `;
        document.body.appendChild(messageBox);
    }

    // --- Core Chatbot Functions (adapted to use Firebase data) ---

    /**
     * Displays a welcome message in the chatbot.
     */
    function displayWelcomeMessage() {
        if (chatbotContainer) chatbotContainer.classList.add('is-active');

        const welcomeMessageHtml = `
            <div class="welcome-message">
                <h3>¡Bienvenido a Aimotel!</h3>
                <p>Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?</p>
            </div>
            `;
        chatbotBody.innerHTML = welcomeMessageHtml;

        // No es necesario re-adjuntar listeners para los botones de acceso rápido aquí,
        // ya que los botones internos han sido eliminados.
        // Los botones externos ya tienen sus listeners adjuntos en initializeChatbotWithFirebaseData.
    }

    /**
     * Displays a message in the chatbot body.
     * @param {string} message - The message content.
     * @param {string} sender - 'user' or 'bot'.
     */
    function displayMessageInChatbot(message, sender = "bot") {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chatbot-message');
        if (sender === "user") {
            messageDiv.style.textAlign = 'right';
            messageDiv.style.backgroundColor = '#dcf8c6';
            messageDiv.style.alignSelf = 'flex-end';
        } else {
            // Apply specific styles for the authentication message
            if (message.includes("Te has autenticado con Google.")) {
                messageDiv.style.backgroundColor = '#C8E6C9'; // Verde menta claro
                messageDiv.style.color = '#1B5E20'; // Verde oscuro
                messageDiv.style.fontWeight = 'bold';
                messageDiv.style.padding = '10px 15px';
                messageDiv.style.borderRadius = '8px';
                messageDiv.style.marginBottom = '10px';
                messageDiv.style.textAlign = 'center'; // Centrar el texto
            }
        }
        messageDiv.innerHTML = message; // Use innerHTML to render the link
        chatbotBody.appendChild(messageDiv);
        chatbotBody.scrollTop = chatbotBody.scrollHeight;
    }

    /**
     * Displays information for a specific category of rooms.
     * @param {string} categoryKey - The key of the category (e.g., 'jacuzzi').
     */
    function displayCategoryInfo(categoryKey) {
        let category;
        let roomTabsHtml = '';
        let sectionTitle = '';

        if (categoryKey === "all-rooms") {
            sectionTitle = "Todas las Habitaciones";
            category = {
                title: sectionTitle,
                rooms: Object.keys(roomsData)
            };
        } else {
            category = categoriesMap[categoryKey];
            if (!category) {
                chatbotBody.innerHTML = `<p>Lo siento, no se encontró información para esa categoría.</p>`;
                return;
            }
            sectionTitle = category.title;
        }

        if (chatbotContainer) chatbotContainer.classList.add('is-active');

        // --- INICIO DE LA MODIFICACIÓN PARA EL TÍTULO DE HABITACIONES Y SU ESTILO ---
        // Se crea un solo título "Habitaciones" con fondo rosado oscuro y texto negro centrado.
        const roomsSectionTitleHtml = `
            <div style="
                text-align: center;
                margin-top: 15px;
                margin-bottom: 15px;
                font-size: 1.2em;
                font-weight: bold;
                color: #000; /* Texto negro */
                padding: 10px 0;
                border-radius: 8px; /* Pequeño redondeo para el fondo */
            ">
                Habitaciones
            </div>
        `;
        // --- FIN DE LA MODIFICACIÓN PARA EL TÍTULO DE HABITACIONES Y SU ESTILO ---


        if (category.rooms && category.rooms.length > 0) {
            roomTabsHtml = `<div class="room-tabs">`;
            category.rooms.forEach((roomName) => {
                const roomNumber = roomName.replace('Habitación ', '');
                // --- INICIO DE LA MODIFICACIÓN PARA LOS BOTONES DE HABITACIONES ---
                // Se ajusta el estilo del botón para el tamaño, color de texto y centrado del número.
                // Se cambia el color de fondo a rosado claro (#FFCDD2).
                roomTabsHtml += `
                    <button class="room-tab" data-room-name="${roomName}" style="
                        background-color: #ffb4bb; /* Color de relleno rosado más claro */
                        border-radius: 50%; /* Hacerlo circular */
                        width: 45px; /* Aumentar tamaño */
                        height: 45px; /* Aumentar tamaño */
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-weight: bold;
                        color: #000; /* Color de texto negro */
                        border: 1px solid #ccc; /* Borde sutil */
                        margin: 5px;
                        cursor: pointer;
                        font-size: 1.1em; /* Ajustar tamaño de fuente */
                    ">
                        ${roomNumber}
                    </button>
                `;
                // --- FIN DE LA MODIFICACIÓN PARA LOS BOTONES DE HABITACIONES ---
            });
            roomTabsHtml += `</div>`;
        } else {
            roomTabsHtml = `<p>No hay habitaciones disponibles en esta categoría.</p>`;
        }

        const categoryContentHtml = `
            <div class="chatbot-section-title">
                <span>${sectionTitle}</span>
                <button class="close-section">X</button>
            </div>
            <p>Disfruta de una experiencia de lujo con todas las comodidades.</p>
            ${roomsSectionTitleHtml} ${roomTabsHtml}
            <div id="roomDetailsContainer"></div>
        `;
        chatbotBody.innerHTML = categoryContentHtml;

        const roomTabs = chatbotBody.querySelectorAll('.room-tab');
        roomTabs.forEach(tab => {
            tab.addEventListener('click', (event) => {
                roomTabs.forEach(t => t.classList.remove('active'));
                event.target.classList.add('active');
                const selectedRoomName = event.target.dataset.roomName;
                loadRoomDetails(selectedRoomName);
            });
        });

        if (category.rooms && category.rooms.length > 0) {
            const firstRoomName = category.rooms[0];
            const firstRoomTab = chatbotBody.querySelector(`.room-tab[data-room-name="${firstRoomName}"]`);
            if (firstRoomTab) firstRoomTab.classList.add('active');
            loadRoomDetails(firstRoomName);
        }

        const closeSectionButton = chatbotBody.querySelector('.close-section');
        if (closeSectionButton) {
            closeSectionButton.addEventListener('click', () => {
                chatbotBody.innerHTML = '';
                displayWelcomeMessage();
                if (chatbotContainer) chatbotContainer.classList.remove('is-active');
            });
        }
    }

    /**
     * Loads and displays detailed information for a specific room.
     * @param {string} roomName - The full name of the room (e.g., 'Habitación 1').
     */
    function loadRoomDetails(roomName) {
        const roomDetailsContainer = document.getElementById('roomDetailsContainer');
        const room = roomsData[roomName];

        if (!room) {
            if (roomDetailsContainer) roomDetailsContainer.innerHTML = `<p>Lo siento, no se encontró información para ${roomName}.</p>`;
            return;
        }

        currentSelectedRoom = { ...room, roomName: roomName };
        const roomNumber = roomName.replace('Habitación ', '');

        let featuresHtml = room.features.map(feature => `<li>${feature}</li>`).join('');
        let imagesHtml = '';
        if (room.images && room.images.length > 0) {
            imagesHtml = `<div class="image-grid">`;
            room.images.slice(0, 2).forEach(imageUrl => { // Show first 2 for preview
                imagesHtml += `<img src="${imageUrl}" alt="Imagen de Habitación ${roomNumber}" onerror="this.onerror=null;this.src='https://placehold.co/200x200/cccccc/000000?text=No+Imagen';">`;
            });
            imagesHtml += `</div>`;
        } else {
            imagesHtml = `<p class="no-content-message">No hay imágenes disponibles para esta habitación.</p>`;
        }

        let videosHtml = '';
        if (room.videos && room.videos.length > 0) {
            const videoUrl = room.videos[0];
            const videoId = videoUrl.split('v=')[1] ? videoUrl.split('v=')[1].split('&')[0] : videoUrl.split('/').pop().split('?')[0];
            const embedUrl = `https://www.youtube.com/embed/${videoId}`; // Correct YouTube embed URL format
            videosHtml += `
                <div class="video-container">
                    <iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            `;
        } else {
            videosHtml = `<p class="no-content-message">No hay videos disponibles para esta habitación.</p>`;
        }

        const roomDetailHtml = `
            <button class="room-selection-banner" id="openReservationModalBtn" data-room-name="${roomName}">
                <img src="https://github.com/aimoteles/aimotelesimg/blob/e09c0b422097beb77071c92dcd021b6c72b26249/chatbot/reservacalendar1.png?raw=true" alt="Calendar Icon" class="calendar-icon"/>
                Habitación ${roomNumber}
                <br>
                Reserva aquí y ahora hasta un 40%
            </button>

            <div class="content-tabs">
                <button class="content-tab-button active" data-tab="features">Cuenta con</button>
                <button class="content-tab-button" data-tab="images">Imágenes</button>
                <button class="content-tab-button" data-tab="videos">Videos</button>
            </div>

            <div id="featuresContent" class="tab-content-section active">
                <div class="room-info-card" data-modal-target="featuresModal">
                    <ul>${featuresHtml}</ul>
                    <p class="room-price"><strong>Valor:</strong> ${room.price}</p>
                    <p><strong>Hora Adicional:</strong> ${room.additionalHour}</p>
                    <p><strong>Persona Adicional:</strong> ${room.additionalPerson}</p>
                    <p><strong>Amanecida:</strong> ${room.overnight}</p>
                    <p><strong>Horario:</strong> ${room.schedule}</p>
                    <a href="#" class="view-more-link" data-modal-target="featuresModal">Ver más...</a>
                    <div class="booking-button-container">
                        <button class="btn-reserve-room" data-room-name="${roomName}">Reservar Habitación ${roomNumber}</button>
                    </div>
                </div>
            </div>

            <div id="imagesContent" class="tab-content-section">
                <div class="room-info-card" data-modal-target="imagesModal">
                    ${imagesHtml}
                    <a href="#" class="view-more-link" data-modal-target="imagesModal">Ver más...</a>
                </div>
            </div>

            <div id="videosContent" class="tab-content-section">
                <div class="room-info-card" data-modal-target="videosModal">
                    ${videosHtml}
                    <a href="#" class="view-more-link" data-modal-target="videosModal">Ver más...</a>
                </div>
            </div>
        `;
        if (roomDetailsContainer) roomDetailsContainer.innerHTML = roomDetailHtml;

        const contentTabButtons = roomDetailsContainer.querySelectorAll('.content-tab-button');
        const tabContentSections = roomDetailsContainer.querySelectorAll('.tab-content-section');

        contentTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                contentTabButtons.forEach(btn => {
                    btn.classList.remove('active');
                    // No se restablecen estilos aquí, se asume que el CSS por defecto los maneja.
                });
                tabContentSections.forEach(section => section.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(`${button.dataset.tab}Content`).classList.add('active');
            });
        });

        roomDetailsContainer.querySelectorAll('.view-more-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = link.dataset.modalTarget;
                openModalWithContent(modalId, room);
            });
        });

        roomDetailsContainer.querySelectorAll('.room-info-card').forEach(card => {
            // Add double-click listener directly to the card
            card.addEventListener('dblclick', (e) => {
                const modalId = card.dataset.modalTarget;
                openModalWithContent(modalId, room);
            });
        });

        const openReservationModalBtn = document.getElementById('openReservationModalBtn');
        if (openReservationModalBtn) {
            openReservationModalBtn.addEventListener('click', (event) => {
                const roomToReserve = event.currentTarget.dataset.roomName;
                openReservationModal(roomToReserve);
            });
        }
        const reserveButtons = roomDetailsContainer.querySelectorAll('.btn-reserve-room');
        reserveButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const roomToReserve = event.target.dataset.roomName;
                openReservationModal(roomToReserve);
            });
        });
    }

    /**
     * Opens a generic modal to display images or videos.
     * @param {string} modalId - The ID of the modal to open (e.g., "featuresModal", "imagesModal", "videosModal").
     * @param {object} roomData - The current room's data.
     */
    function openModalWithContent(modalId, roomData) {
        let targetModal;
        if (modalId === 'featuresModal') {
            targetModal = featuresModal;
        } else if (modalId === 'imagesModal') {
            targetModal = imagesModal;
        } else if (modalId === 'videosModal') {
            targetModal = videosModal;
        } else {
            // Use generic modal for unhandled cases or as a fallback
            targetModal = genericModal;
        }

        const modalBody = targetModal.querySelector('.modal-body');
        modalBody.innerHTML = '';

        const roomNumber = roomData.roomName ? roomData.roomName.replace('Habitación ', '') : '';

        if (modalId === 'featuresModal') {
            let featuresHtml = roomData.features.map(feature => `<li>${feature}</li>`).join('');
            modalBody.innerHTML = `
                <ul>${featuresHtml}</ul>
                <p class="room-price"><strong>Valor:</strong> ${roomData.price}</p>
                <p><strong>Hora Adicional:</strong> ${roomData.additionalHour}</p>
                <p><strong>Persona Adicional:</strong> ${roomData.additionalPerson}</p>
                <p><strong>Amanecida:</strong> ${roomData.overnight}</p>
                <p><strong>Horario:</strong> ${roomData.schedule}</p>
            `;
        } else if (modalId === 'imagesModal') {
            if (roomData.images && roomData.images.length > 0) {
                let imagesHtml = `<div class="modal-image-grid">`;
                roomData.images.forEach(imageUrl => {
                    imagesHtml += `<img src="${imageUrl}" alt="Imagen de Habitación ${roomNumber}" onerror="this.onerror=null;this.src='https://placehold.co/200x200/cccccc/000000?text=No+Imagen';">`;
                });
                imagesHtml += `</div>`;
                modalBody.innerHTML = imagesHtml;
            } else {
                modalBody.innerHTML = `<p class="no-content-message">No hay imágenes disponibles para esta habitación.</p>`;
            }
        } else if (modalId === 'videosModal') {
            if (roomData.videos && roomData.videos.length > 0) {
                let videosHtml = '';
                roomData.videos.forEach(videoUrl => {
                    const videoId = videoUrl.split('v=')[1] ? videoUrl.split('v=')[1].split('&')[0] : videoUrl.split('/').pop().split('?')[0];
                    const embedUrl = `https://www.youtube.com/embed/${videoId}`; // Correct YouTube embed URL format
                    videosHtml += `
                        <div class="modal-video-container">
                            <iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                    `;
                });
                modalBody.innerHTML = videosHtml;
            } else {
                modalBody.innerHTML = `<p class="no-content-message">No hay videos disponibles para esta habitación.</p>`;
            }
        }

        if (targetModal) {
            targetModal.style.display = "flex";

            // Se busca el botón de cierre con la clase 'close-section'.
            const modalCloseButton = targetModal.querySelector('.close-section');
            if (modalCloseButton) {
                // Se elimina cualquier listener previo para evitar duplicados si el modal se abre varias veces.
                const oldListener = modalCloseButton._modalCloseListener;
                if (oldListener) {
                    modalCloseButton.removeEventListener('click', oldListener);
                }

                // Se define el nuevo listener para cerrar este modal específico.
                const newListener = function() {
                    targetModal.style.display = "none";
                };
                modalCloseButton.addEventListener('click', newListener);
                // Se guarda una referencia al listener para poder eliminarlo si es necesario.
                modalCloseButton._modalCloseListener = newListener;
            }

            // Añadir el evento para cerrar el modal al hacer doble click en su contenido.
            modalBody.ondblclick = () => {
                targetModal.style.display = "none";
            };
        }
    }

    /**
     * Closes the generic content modal.
     */
    function closeGenericModal() {
        if (genericModal) {
            genericModal.style.display = 'none';
            if (genericModalContent) genericModalContent.innerHTML = '';
        }
    }

    /**
     * Opens the reservation modal for a specific room.
     * @param {string} roomName - The name of the room to reserve.
     */
    function openReservationModal(roomName) {
        const room = roomsData[roomName];
        if (!room) {
            console.error(`Room data not found for ${roomName}`);
            displayCustomMessage("Error", "No se encontró información para la habitación seleccionada.");
            return;
        }

        reservationRoomNumberSpan.textContent = roomName.replace('Habitación ', '');

        flatpickr(reservationDateInput, {
            dateFormat: "Y-m-d",
            minDate: "today",
            locale: "es"
        });

        flatpickr(reservationTimeInput, {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
            minuteIncrement: 15,
            locale: "es"
        });

        updateRoomStatusDisplay(room.status);
        if (reservationModal) reservationModal.style.display = "flex";
    }

    /**
     * Updates the display of the room status.
     * @param {string} status - The status of the room.
     */
    function updateRoomStatusDisplay(status) {
        roomStatusDisplay.textContent = status;
        roomStatusDisplay.className = 'room-status';
        if (status === "Disponible") {
            roomStatusDisplay.classList.add('status-available');
        } else if (status === "Ocupada") {
            roomStatusDisplay.classList.add('status-occupied');
        } else if (status === "Reservada") {
            roomStatusDisplay.classList.add('status-reserved');
        }
    }

    /**
     * Handles the reservation confirmation.
     */
    function confirmReservation() {
        const roomNumber = reservationRoomNumberSpan.textContent;
        const reservationDate = reservationDateInput.value;
        const reservationTime = reservationTimeInput.value;

        if (!reservationDate || !reservationTime) {
            displayCustomMessage('Error de Reserva', 'Por favor, selecciona una fecha y hora para la reserva.');
            return;
        }

        const roomRef = ref(database, `rooms/Habitación ${roomNumber}`);
        update(roomRef, { status: 'Reservada' })
            .then(() => {
                displayMessageInChatbot(`¡Reserva para Habitación ${roomNumber} confirmada el ${reservationDate} a las ${reservationTime}!`, "bot");
                if (reservationModal) reservationModal.style.display = "none";
                // Optionally re-load room details to show updated status
                loadRoomDetails(`Habitación ${roomNumber}`);
            })
            .catch(error => {
                console.error("Error al actualizar el estado de la habitación:", error);
                displayCustomMessage("Error de Reserva", "Hubo un error al procesar tu reserva. Intenta de nuevo.");
            });
    }

    // --- General Event Listeners ---
    closeChatbotButton.addEventListener('click', () => {
        chatbotBody.innerHTML = '';
        if (chatbotContainer) chatbotContainer.classList.remove('is-active');
    });

    // Close modals when clicking outside them
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = "none";
        }
    };

    if (confirmReservationBtn) {
        confirmReservationBtn.addEventListener('click', confirmReservation);
    }

    // Event listener for "Acceder" / "Mi cuenta" button on aigmynimaxihome.html
    // This is already handled by onAuthStateChanged updating accessSplashButton and its click handler.

    // Expose goToLoginSplash to the global scope for inline onclick in displayMessageInChatbot
    window.goToLoginSplash = goToLoginSplash;
});
