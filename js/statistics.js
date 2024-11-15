import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Mappa servizi-prezzi
const PREZZI_SERVIZI = {
    'barba': 15,
    'Colore': 30,
    'Taglio': 20,
    'Taglio + Barba': 30,
    'Taglio Bambino': 15,
    'DEFAULT': 20
};

async function loadStatistics() {
    try {
        const bookingsRef = collection(db, 'bookings');
        const snapshot = await getDocs(bookingsRef);
        
        const clientiUnici = new Set();
        let totaleAppuntamenti = 0;
        let totaleIncasso = 0;
        const serviziConteggio = {};
        
        snapshot.forEach(doc => {
            const booking = doc.data();
            
            // Conteggio clienti e appuntamenti
            if (booking.name) {
                clientiUnici.add(booking.name.toLowerCase().trim());
            }
            totaleAppuntamenti++;
            
            // Calcolo incasso e conteggio servizi
            if (booking.service) {
                const servizio = booking.service.toLowerCase();
                const prezzo = PREZZI_SERVIZI[servizio] || PREZZI_SERVIZI['DEFAULT'];
                totaleIncasso += prezzo;
                
                // Aggiorna conteggio servizi
                serviziConteggio[servizio] = (serviziConteggio[servizio] || 0) + 1;
            } else {
                totaleIncasso += PREZZI_SERVIZI['DEFAULT'];
            }
        });

        // Forza l'aggiornamento dell'incasso
        document.querySelectorAll('span').forEach(element => {
            // Aggiorna incasso
            if (element.textContent === '0€') {
                element.textContent = `${totaleIncasso}€`;
            }
            // Aggiorna clienti totali
            if (element.textContent === '1' && element.previousElementSibling?.textContent === 'Clienti Totali') {
                element.textContent = clientiUnici.size;
            }
            // Aggiorna appuntamenti
            if (element.textContent === '5' && element.previousElementSibling?.textContent === 'Appuntamenti') {
                element.textContent = totaleAppuntamenti;
            }
        });

    } catch (error) {
        console.error('Errore nel caricamento delle statistiche:', error);
        console.error('Dettagli errore:', error.message);
    }
}

// Aggiorna le statistiche ogni minuto
setInterval(loadStatistics, 60000);

// Carica le statistiche all'avvio
document.addEventListener('DOMContentLoaded', loadStatistics);

export { loadStatistics }; 