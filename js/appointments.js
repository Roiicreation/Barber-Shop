import { db } from './firebase-config.js';
import { collection, query, where, getDocs, doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Funzione per confermare la cancellazione
export async function confirmDeleteAppointment(appointmentId) {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>Conferma Cancellazione</h3>
            <p>Sei sicuro di voler cancellare questo appuntamento?</p>
            <div class="popup-buttons">
                <button class="popup-btn cancel" onclick="closePopup()">Annulla</button>
                <button class="popup-btn confirm" onclick="deleteAppointment('${appointmentId}')">Conferma</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
}

// Funzione per chiudere il popup
export function closePopup() {
    const popup = document.querySelector('.popup-overlay');
    if (popup) {
        popup.remove();
    }
}

// Funzione per eliminare l'appuntamento
export async function deleteAppointment(appointmentId) {
    try {
        const appointmentRef = doc(db, 'bookings', appointmentId);
        await deleteDoc(appointmentRef);
        closePopup();
        await loadDashboardAppointments();
        showNotification('Appuntamento cancellato con successo', 'success');
    } catch (error) {
        console.error('Errore nella cancellazione:', error);
        showNotification('Errore durante la cancellazione', 'error');
    }
}

// Funzione per mostrare le notifiche
export function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
