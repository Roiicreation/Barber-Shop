import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs,
    addDoc 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Importa anche la configurazione di Firebase se non è già importata
import { db } from './firebase-config.js';

let currentStep = 1;
const totalSteps = 3;

// Variabile per tracciare lo stato del popup
let isPopupActive = false;

// Variabili di stato globali
let isNavigating = false;

// Definisci showStep come funzione globale
function showStep(stepNumber) {
    // Nascondi tutti gli step
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
        step.style.display = 'none';
    });
    
    // Mostra lo step corrente
    const currentStep = document.getElementById(`step${stepNumber}`);
    if (currentStep) {
        currentStep.classList.add('active');
        currentStep.style.display = 'block';
        
        // Se è lo step 3, aggiorna il riepilogo
        if (stepNumber === 3) {
            updateSummary();
        }
    }
}

// Funzione per aggiornare il riepilogo
function updateSummary() {
    const serviceSummary = document.getElementById('service-summary');
    const dateSummary = document.getElementById('date-summary');
    const timeSummary = document.getElementById('time-summary');
    
    if (serviceSummary) {
        serviceSummary.textContent = localStorage.getItem('selectedService') || '-';
    }
    if (dateSummary) {
        dateSummary.textContent = localStorage.getItem('selectedDate') || '-';
    }
    if (timeSummary) {
        timeSummary.textContent = localStorage.getItem('selectedTime') || '-';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Elementi DOM
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const services = document.querySelectorAll('.service-card');
    const nextButton = document.querySelector('.form-navigation .next-step');

    // Imposta lo stato iniziale
    if (step2) {
        step2.style.display = 'none';
    }

    // Gestione selezione servizi
    if (services) {
        services.forEach(service => {
            service.addEventListener('click', () => {
                // Rimuovi selezione precedente
                services.forEach(s => s.classList.remove('selected'));
                
                // Seleziona questo servizio
                service.classList.add('selected');
                
                // Abilita pulsante
                if (nextButton) {
                    nextButton.disabled = false;
                    nextButton.style.opacity = '1';
                }
            });
        });
    }

    // Gestione click pulsante Avanti
    if (nextButton) {
        
        nextButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Controlla se è stato selezionato un servizio
            const selectedService = document.querySelector('.service-card.selected');
            if (!selectedService) {
                showServiceSelectionPopup();
                return;
            }
            
            // Se un servizio è selezionato, procedi normalmente
            currentStep++;
            updateSteps();
        });
    } else {
    }

    // Gestione pulsante indietro (opzionale)
    const prevButton = document.querySelector('.prev-step');
    if (prevButton) {
        prevButton.addEventListener('click', function(e) {
            e.preventDefault();
            step2.style.display = 'none';
            step1.style.display = 'block';
        });
    }

    // Gestione selezione servizio
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            // Rimuovi selezione precedente
            serviceCards.forEach(c => c.classList.remove('selected'));
            
            // Aggiungi selezione al servizio cliccato
            this.classList.add('selected');
            
            // Ottieni il nome del servizio dalla classe service-name
            const serviceName = this.querySelector('.service-name');
            if (serviceName) {
                const serviceText = serviceName.textContent.trim();
                // Salva nel localStorage
                localStorage.setItem('selectedService', serviceText);
            }
        });
    });

    // Gestione pulsante "Indietro"
    document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const currentStep = this.closest('.form-step');
            const currentStepNumber = parseInt(currentStep.id.replace('step', ''));
            showStep(currentStepNumber - 1);
        });
    });

    // Gestione pulsante "Avanti"
    document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const currentStep = this.closest('.form-step');
            const currentStepNumber = parseInt(currentStep.id.replace('step', ''));
            showStep(currentStepNumber + 1);
        });
    });

    // Gestione form submit
    const bookingForm = document.getElementById('details-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const bookingData = {
                service: localStorage.getItem('selectedService'),
                date: localStorage.getItem('selectedDate'),
                time: localStorage.getItem('selectedTime'),
                name: document.getElementById('booking-name').value,
                phone: document.getElementById('booking-phone').value
            };
            
            try {
                const bookingId = await saveBooking(bookingData);
                showConfirmationPopup(
                    bookingData.date,
                    bookingData.time,
                    bookingData.service
                );
                
                localStorage.removeItem('selectedService');
                localStorage.removeItem('selectedDate');
                localStorage.removeItem('selectedTime');
                
                window.location.href = '#home';
                
            } catch (error) {
            }
        });
    }

    // Mostra il primo step all'avvio
    showStep(1);

    // Aggiungi event listener per il campo telefono
    const phoneInput = document.getElementById('booking-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            validatePhoneInput(this);
        });

        // Previeni l'incolla di testo non numerico
        phoneInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const numericText = pastedText.replace(/\D/g, '');
            this.value = numericText.slice(0, 10);
        });

        // Previeni la digitazione di caratteri non numerici
        phoneInput.addEventListener('keypress', function(e) {
            if (!/^\d$/.test(e.key)) {
                e.preventDefault();
            }
        });
    }

    // Gestione selezione data (un solo event listener)
    const calendar = document.querySelector('.calendar');
    if (calendar) {
        calendar.addEventListener('click', async function(e) {
            if (e.target.classList.contains('calendar-day') && 
                !e.target.classList.contains('disabled') && 
                !e.target.classList.contains('empty')) {
                
                const selectedDay = parseInt(e.target.textContent);
                const monthYear = document.querySelector('.calendar-title').textContent;
                const [month, year] = monthYear.split(' ');
                
                // Array per la conversione del mese
                const months = {
                    'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3,
                    'maggio': 4, 'giugno': 5, 'luglio': 6, 'agosto': 7,
                    'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11
                };
                
                const date = new Date(parseInt(year), months[month], selectedDay);
                const weekDays = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
                const formattedDate = `${weekDays[date.getDay()]} ${selectedDay} ${month} ${year}`;
                
                localStorage.setItem('selectedDate', formattedDate);
                await updateTimeSlots(formattedDate);
            }
        });
    }

    // Gestione selezione orario
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.addEventListener('click', function() {
            if (!this.classList.contains('disabled')) {
                // Rimuovi la selezione precedente
                document.querySelectorAll('.time-slot').forEach(s => 
                    s.classList.remove('selected'));
                
                // Seleziona il nuovo orario
                this.classList.add('selected');
                
                // Salva l'orario selezionato
                localStorage.setItem('selectedTime', this.textContent.trim());
            }
        });
    });
});

// Inizializza il primo step
showStep(1);

// Funzione per salvare la prenotazione
async function saveBooking(bookingData) {
    try {
        const db = getFirestore();
        const bookingsRef = collection(db, 'bookings');
        
        // Crea l'oggetto dati senza il campo notes
        const bookingToSave = {
            service: bookingData.service,
            date: bookingData.date,
            time: bookingData.time,
            name: bookingData.name,
            phone: bookingData.phone,
            createdAt: new Date(),
            status: 'pending'
        };
        
        const docRef = await addDoc(bookingsRef, bookingToSave);
        return docRef.id;
    } catch (error) {
        console.error('Errore nel salvare la prenotazione:', error);
        throw error;
    }
}
// Aggiungi questa funzione per la validazione del telefono
function validatePhoneInput(input) {
    // Rimuove tutti i caratteri non numerici
    input.value = input.value.replace(/\D/g, '');
    
    // Limita la lunghezza a 10 cifre
    if (input.value.length > 10) {
        input.value = input.value.slice(0, 10);
    }
}

// Funzione per ottenere le prenotazioni esistenti
async function getBookedSlots(selectedDate) {
    try {
        const db = getFirestore();
        const bookingsRef = collection(db, 'bookings');
        
        const q = query(
            bookingsRef,
            where("date", "==", selectedDate)
        );
        
        const querySnapshot = await getDocs(q);
        const bookedTimes = [];
        querySnapshot.forEach((doc) => {
            const booking = doc.data();
            bookedTimes.push(booking.time);
        });
        
        return bookedTimes;
    } catch (error) {
        console.error('Errore nel recupero delle prenotazioni:', error);
        return [];
    }
}

// Modifica la funzione updateTimeSlots per gestire correttamente gli slot
export async function updateTimeSlots(selectedDate) {
    try {
        const timeSlots = document.querySelectorAll('.time-slot');
        const timeSlotsContainer = document.querySelector('.time-slots-container');
        
        if (!selectedDate) {
            timeSlots.forEach(slot => {
                slot.style.backgroundColor = '#e9ecef';
                slot.style.color = '#a0aec0';
                slot.classList.add('disabled');
                slot.style.cursor = 'not-allowed';
                slot.classList.remove('selected');
            });
            return;
        }

        // Ottieni gli slot già prenotati
        const bookedSlots = await getBookedSlots(selectedDate);
        
        timeSlots.forEach(slot => {
            const slotTime = slot.textContent.trim();
            
            if (bookedSlots.includes(slotTime)) {
                slot.style.backgroundColor = '#e8b4b4';
                slot.style.color = '#4a5568';
                slot.classList.add('disabled');
                slot.classList.remove('selected');
                slot.style.cursor = 'not-allowed';
            } else {
                slot.style.backgroundColor = '#4CAF50';
                slot.style.color = 'white';
                slot.classList.remove('disabled');
                slot.style.cursor = 'pointer';
                
                // Rimuovi l'onclick esistente e usa l'event listener globale
                slot.removeAttribute('onclick');
            }
        });
    } catch (error) {
        console.error('Errore nell\'aggiornamento degli slot temporali:', error);
    }
}

