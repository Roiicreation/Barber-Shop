import { db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    doc, 
    getDoc,
    query,
    where,
    getDocs
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date(date).toLocaleDateString('it-IT', options);
}

document.addEventListener('DOMContentLoaded', function() {
    // Rimuovi il loader
    const loader = document.querySelector('.loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }, 1000);
    }

    // Inizializza la validazione del form solo quando siamo nello step 3
    initializeStep3Validation();
});

function initializeStep3Validation() {
    const step3 = document.getElementById('step3');
    if (!step3) return; // Se non siamo nella pagina con il form, esci

    const confirmButton = step3.querySelector('.confirm-booking');
    if (!confirmButton) return; // Se il bottone non esiste, esci

    confirmButton.addEventListener('click', async function(e) {
        e.preventDefault();
        
        // Verifica campi obbligatori
        const name = document.getElementById('booking-name');
        const phone = document.getElementById('booking-phone');
        
        if (!name || !phone || !name.value.trim() || !phone.value.trim()) {
            showValidationPopup();
            return;
        }

        try {
            // Raccogli i dati della prenotazione
            const bookingData = {
                name: name.value.trim(),
                phone: phone.value.trim(),
                date: localStorage.getItem('selectedDate'),
                time: localStorage.getItem('selectedTime'),
                service: localStorage.getItem('selectedService')
            };

            // Qui puoi aggiungere la logica per salvare i dati
            console.log('Dati prenotazione:', bookingData);
            
        } catch (error) {
            console.error('Errore:', error);
            showErrorPopup('Si è verificato un errore. Riprova più tardi.');
        }
    });
}

function showValidationPopup() {
    const popup = document.createElement('div');
    popup.className = 'validation-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Attenzione!</h3>
            <p>Per favore compila tutti i campi obbligatori.</p>
            <button class="close-popup">Chiudi</button>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Mostra il popup con animazione
    setTimeout(() => popup.classList.add('show'), 10);
    
    // Gestione chiusura
    const closeBtn = popup.querySelector('.close-popup');
    closeBtn.addEventListener('click', () => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    });
}

function showErrorPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'error-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Errore</h3>
            <p>${message}</p>
            <button class="close-popup">Chiudi</button>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    const closeBtn = popup.querySelector('.close-popup');
    closeBtn.addEventListener('click', () => popup.remove());
}