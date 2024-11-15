// Importa le funzioni necessarie da Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, query, where, getDocs, addDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Configurazione Firebase (usa solo questa in tutto il progetto)
const firebaseConfig = {
    apiKey: "AIzaSyDlFshRUjs2NyBLiy9Ji31mnKX0BOxncTo",
    authDomain: "sito-parrucchiere.firebaseapp.com",
    databaseURL: "https://sito-parrucchiere-default-rtdb.firebaseio.com",
    projectId: "sito-parrucchiere",
    storageBucket: "sito-parrucchiere.appspot.com",
    messagingSenderId: "994870656654",
    appId: "1:994870656654:web:aa1ff9c14e8ad4235a53df",
    measurementId: "G-70HLJT6TV8"
};

// Inizializza Firebase con opzioni di sicurezza
const app = initializeApp(firebaseConfig);

// Configura Firestore
const db = getFirestore(app);

// Configura Auth con opzioni di sicurezza per i cookie
const auth = getAuth(app);
auth.settings = {
    appVerificationDisabledForTesting: false,
    persistence: 'local',
    cookieOptions: {
        secure: true,
        sameSite: 'strict',
        domain: window.location.hostname
    }
};

// Usa la persistenza locale invece dei cookie
setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
        console.error("Errore nell'impostazione della persistenza:", error);
    });

// Funzioni di utilità per il calendario
async function checkDateAvailability(date) {
    try {
        const appointmentsRef = collection(db, 'appointments');
        const q = query(appointmentsRef, where("date", "==", date));
        const querySnapshot = await getDocs(q);
        return querySnapshot.size < 8; // Massimo 8 appuntamenti per giorno
    } catch (error) {
        console.error('Errore nel controllo disponibilità:', error);
        return false;
    }
}

async function saveAppointment(appointmentData) {
    try {
        const appointmentsRef = collection(db, 'appointments');
        const docRef = await addDoc(appointmentsRef, {
            ...appointmentData,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error('Errore nel salvare l\'appuntamento:', error);
        throw error;
    }
}

export { db, auth, checkDateAvailability, saveAppointment };
