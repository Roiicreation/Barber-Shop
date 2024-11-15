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

// Funzione per controllare se un servizio è selezionato
function isServiceSelected() {
    return document.querySelector('.service-card.selected') !== null;
}

// Funzione centralizzata per mostrare il popup
function showServiceSelectionPopup() {
    if (isPopupActive) return;
    
    console.log('Mostrando popup - Nessun servizio selezionato');
    isPopupActive = true;
    
    const popup = document.createElement('div');
    popup.className = 'service-selection-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Seleziona un servizio</h3>
            <p>Devi selezionare almeno un servizio per continuare.</p>
            <button class="close-popup">OK</button>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Gestione chiusura
    const closeBtn = popup.querySelector('.close-popup');
    closeBtn.addEventListener('click', () => {
        console.log('Chiusura popup');
        popup.classList.remove('show');
        setTimeout(() => {
            popup.remove();
            isPopupActive = false;
        }, 300);
    });
    
    setTimeout(() => popup.classList.add('show'), 10);
}

// Funzione per procedere allo step 2
function proceedToStep2() {
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
}

// Funzione principale di navigazione
function handleStep1Navigation(event) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Tentativo di navigazione allo step 2');
    
    // Verifica se un servizio è selezionato
    const selectedService = document.querySelector('.service-card.selected');
    console.log('Servizio selezionato:', selectedService ? true : false);
    
    if (!selectedService) {
        console.log('Nessun servizio selezionato, mostro popup');
        showServiceSelectionPopup();
        // Importante: blocca qui l'esecuzione
        return false;
    }
    
    // Se arriviamo qui, un servizio è stato selezionato
    localStorage.setItem('selectedService', selectedService.dataset.service);
    
    // Rimuovi eventuali popup attivi
    const existingPopup = document.querySelector('.service-selection-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Procedi allo step 2 solo se c'è un servizio selezionato
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inizializzazione gestione step 1');
    
    // Rimuovi tutti i listener esistenti dal pulsante Avanti
    const step1NextBtn = document.querySelector('#step1 .next-step');
    if (step1NextBtn) {
        // Rimuovi qualsiasi onclick inline
        step1NextBtn.removeAttribute('onclick');
        
        // Rimuovi tutti i vecchi listener clonando il pulsante
        const newBtn = step1NextBtn.cloneNode(true);
        step1NextBtn.parentNode.replaceChild(newBtn, step1NextBtn);
        
        // Aggiungi il nuovo listener
        newBtn.addEventListener('click', handleStep1Navigation);
    }
    
    // Rimuovi eventuali popup residui all'avvio
    document.querySelectorAll('.service-selection-popup').forEach(popup => popup.remove());
});

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
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('time-slot') && 
            !e.target.classList.contains('disabled')) {
            
            console.log('Click su slot orario');
            
            // Rimuovi selezione precedente
            document.querySelectorAll('.time-slot').forEach(slot => {
                slot.classList.remove('selected');
                slot.style.backgroundColor = slot.classList.contains('disabled') ? '#e8b4b4' : '#4CAF50';
            });
            
            // Aggiungi nuova selezione
            e.target.classList.add('selected');
            e.target.style.backgroundColor = '#1a365d';
            
            // Salva l'orario
            const selectedTime = e.target.textContent.trim();
            console.log('Orario salvato:', selectedTime);
            localStorage.setItem('selectedTime', selectedTime);
        }
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

// Aggiungi questa funzione per inizializzare gli slot temporali all'avvio
document.addEventListener('DOMContentLoaded', () => {
    updateTimeSlots(null); // Passa null per disabilitare tutti gli slot all'inizio
});

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-popup';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Modifica la gestione del click sul pulsante "Avanti"
document.addEventListener('DOMContentLoaded', function() {
    const nextButton = document.querySelector('#step1 .next-step');
    if (nextButton) {
        // Rimuovi eventuali listener esistenti
        const newBtn = nextButton.cloneNode(true);
        nextButton.parentNode.replaceChild(newBtn, nextButton);
        
        // Aggiungi un unico event listener
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Verifica semplice e diretta
            const selectedService = document.querySelector('.service-card.selected');
            
            if (!selectedService) {
                showServiceSelectionPopup();
                return false;
            }
            
            // Salva il nome del servizio, non il dataset
            const serviceName = selectedService.querySelector('.service-name').textContent.trim();
            localStorage.setItem('selectedService', serviceName);
            
            // Rimuovi eventuali popup attivi
            const existingPopup = document.querySelector('.service-selection-popup');
            if (existingPopup) {
                existingPopup.remove();
            }
            
            // Procedi allo step 2
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
        });
    }
});

// Funzione per verificare se data e ora sono selezionate
function isDateTimeSelected() {
    const selectedDate = localStorage.getItem('selectedDate');
    const selectedTime = localStorage.getItem('selectedTime');
    const dateSelected = document.querySelector('.calendar-day.selected');
    const timeSelected = document.querySelector('.time-slot.selected');
    
    console.log('Verifica selezioni:');
    console.log('Data in localStorage:', selectedDate);
    console.log('Ora in localStorage:', selectedTime);
    console.log('Data selezionata DOM:', dateSelected);
    console.log('Ora selezionata DOM:', timeSelected);
    
    return selectedDate && selectedTime && dateSelected && timeSelected;
}

// Gestione del pulsante "Avanti" dello step 2
document.addEventListener('DOMContentLoaded', function() {
    // Rimuovi l'avviso esistente se presente
    const existingTooltip = document.querySelector('.selection-info-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // Resto del codice per la gestione del pulsante Avanti
    const step2NextBtn = document.querySelector('#step2 .next-step');
    if (step2NextBtn) {
        step2NextBtn.style.display = 'none';
        
        function updateUI() {
            const dateSelected = document.querySelector('.calendar-day.selected');
            const timeSelected = document.querySelector('.time-slot.selected');
            
            if (dateSelected && timeSelected) {
                step2NextBtn.style.display = 'block';
            } else {
                step2NextBtn.style.display = 'none';
            }
        }
        
        updateUI();
        
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('calendar-day') || 
                e.target.classList.contains('time-slot')) {
                setTimeout(updateUI, 100);
            }
        });
    }
});

// Funzione per mostrare il popup di conferma con countdown
function showConfirmationPopup() {
    return new Promise((resolve) => {
        const popup = document.createElement('div');
        popup.className = 'confirmation-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <i class="fas fa-check-circle"></i>
                <h3>Prenotazione Confermata!</h3>
                <p>La tua prenotazione è stata registrata con successo.</p>
                <button class="close-popup">OK (<span class="countdown">5</span>)</button>
            </div>
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.classList.add('show'), 10);
        
        // Gestione countdown e reindirizzamento
        const countdownElement = popup.querySelector('.countdown');
        let secondsLeft = 5;
        
        const countdownInterval = setInterval(() => {
            secondsLeft--;
            if (countdownElement) {
                countdownElement.textContent = secondsLeft;
            }
            
            if (secondsLeft <= 0) {
                clearInterval(countdownInterval);
                popup.classList.remove('show');
                setTimeout(() => {
                    popup.remove();
                    resolve();
                }, 300);
            }
        }, 1000);
        
        // Gestione click manuale sul pulsante
        popup.querySelector('.close-popup').addEventListener('click', () => {
            clearInterval(countdownInterval);
            popup.classList.remove('show');
            setTimeout(() => {
                popup.remove();
                resolve();
            }, 300);
        });
    });
}

// Modifica la funzione validateForm esistente
function validateForm() {
    const nameInput = document.getElementById('booking-name');
    const phoneInput = document.getElementById('booking-phone');
    
    if (!nameInput || !phoneInput) {
        console.error('Campi del form non trovati');
        return false;
    }
    
    let isValid = true;
    
    // Valida Nome e Cognome
    if (!nameInput.value.trim() || !phoneInput.value.trim()) {
        showValidationPopup();
        isValid = false;
        return isValid;
    }
    
    // Continua con le altre validazioni esistenti
    if (nameInput.value.trim().length < 3) {
        showFieldError(nameInput, 'Inserisci nome e cognome validi');
        isValid = false;
    }
    
    if (!isValidPhoneNumber(phoneInput.value.trim())) {
        showFieldError(phoneInput, 'Inserisci un numero di telefono valido');
        isValid = false;
    }
    
    return isValid;
}

// Aggiungi la funzione per il popup di validazione
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

// Funzione per mostrare errori sotto i campi
function showFieldError(inputElement, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '14px';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;
    
    inputElement.style.borderColor = '#dc3545';
    inputElement.parentNode.appendChild(errorDiv);
}

// Funzione per validare il formato del numero di telefono
function isValidPhoneNumber(phone) {
    // Accetta numeri di telefono italiani (fissi e mobili)
    const phoneRegex = /^(\+39)?[0-9]{9,10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Modifica la gestione della conferma prenotazione
document.addEventListener('DOMContentLoaded', function() {
    const confirmButton = document.querySelector('#step3 .confirm-booking');
    if (confirmButton) {
        confirmButton.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Valida il form prima di procedere
            if (!validateForm()) {
                return;
            }
            
            try {
                const nameInput = document.getElementById('booking-name');
                const phoneInput = document.getElementById('booking-phone');
                
                // Crea l'oggetto prenotazione
                const bookingData = {
                    name: nameInput.value.trim(),
                    phone: phoneInput.value.trim(),
                    date: localStorage.getItem('selectedDate'),
                    time: localStorage.getItem('selectedTime'),
                    service: localStorage.getItem('selectedService'),
                    createdAt: new Date().toISOString()
                };
                
                // Salva la prenotazione
                await saveBooking(bookingData);
                
                // Mostra il popup e poi reindirizza
                await showConfirmationPopup();
                window.location.href = '/';
                
            } catch (error) {
                console.error('Errore durante il salvataggio:', error);
                showErrorMessage('Si è verificato un errore durante la prenotazione. Riprova.');
            }
        });
    }

    // Aggiorna anche qui gli ID per gli event listener
    const inputs = document.querySelectorAll('#booking-name, #booking-phone');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            this.style.borderColor = '';
            const errorMessage = this.parentNode.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        });
    });
});


