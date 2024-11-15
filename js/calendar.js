import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from './firebase-config.js';
import { updateTimeSlots } from './services.js';

const bookingsCache = new Map();

async function checkBookedTimes(selectedDate) {
    // Controlla cache
    if (bookingsCache.has(selectedDate)) {
        return bookingsCache.get(selectedDate);
    }
    
    try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where("date", "==", selectedDate));
        const querySnapshot = await getDocs(q);
        
        const bookedTimes = [];
        querySnapshot.forEach(doc => {
            bookedTimes.push(doc.data().time);
        });
        
        bookingsCache.set(selectedDate, bookedTimes);
        return bookedTimes;
    } catch (error) {
        console.error('Errore nel recupero prenotazioni:', error);
        return [];
    }
}

document.addEventListener('click', async function(e) {
    if (e.target.classList.contains('calendar-day') && 
        !e.target.classList.contains('disabled') && 
        !e.target.classList.contains('empty')) {
        
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        
        e.target.classList.add('selected');
        
        // Ottieni il giorno selezionato
        const selectedDay = parseInt(e.target.textContent);
        
        // Ottieni il mese e l'anno dalla intestazione del calendario
        const monthYear = document.querySelector('.calendar-title').textContent;
        const [month, year] = monthYear.split(' ');
        
        // Array per la conversione del mese
        const months = {
            'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3,
            'maggio': 4, 'giugno': 5, 'luglio': 6, 'agosto': 7,
            'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11
        };
        
        // Crea l'oggetto data
        const date = new Date(parseInt(year), months[month], selectedDay);
        
        // Array dei giorni della settimana in italiano
        const weekDays = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
        
        // Formatta la data
        const formattedDate = `${weekDays[date.getDay()]} ${selectedDay} ${month} ${year}`;
        
        // Salva la data formattata
        localStorage.setItem('selectedDate', formattedDate);
        
        // Aggiorna gli slot temporali
        await updateTimeSlots(formattedDate);
    }
});

function updateCalendar(date) {
    const daysGrid = document.querySelector('.days-grid');
    if (!daysGrid) return;
    
    daysGrid.innerHTML = '';
    
    // Ottieni il primo e l'ultimo giorno del mese
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    // Ottieni il giorno della settimana del primo giorno (0-6)
    let firstDayOfWeek = firstDay.getDay();
    // Converti da domenica = 0 a lunedì = 0
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Aggiungi i giorni vuoti all'inizio
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        daysGrid.appendChild(emptyDay);
    }
    
    // Ottieni la data di oggi e domani per confronto
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Aggiungi i giorni del mese
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
        currentDate.setHours(0, 0, 0, 0);
        
        // Disabilita i giorni passati, oggi e le domeniche
        const isSunday = currentDate.getDay() === 0;
        const isPastOrToday = currentDate <= today;
        
        if (isSunday || isPastOrToday) {
            dayElement.classList.add('disabled');
        }
        
        daysGrid.appendChild(dayElement);
    }
}

function handleMonthNavigation() {
    const prevMonthBtn = document.querySelector('.prev');
    const nextMonthBtn = document.querySelector('.next');
    const monthDisplay = document.querySelector('.calendar-title');
    
    if (!prevMonthBtn || !nextMonthBtn || !monthDisplay) {
        console.error('Elementi di navigazione calendario non trovati');
        return;
    }

    let currentDate = new Date();
    
    // Imposta il limite massimo a due mesi avanti
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2);

    function updateMonthDisplay() {
        const monthNames = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 
                          'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
        monthDisplay.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }

    function updateNavigationButtons() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const firstDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const firstDayOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        
        // Mostra/nascondi freccia precedente
        prevMonthBtn.style.visibility = firstDayOfCurrentMonth <= today ? 'hidden' : 'visible';
        
        // Mostra/nascondi freccia successiva
        nextMonthBtn.style.visibility = firstDayOfNextMonth > maxDate ? 'hidden' : 'visible';
    }

    prevMonthBtn.addEventListener('click', () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() - 1);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (newDate >= today) {
            currentDate = newDate;
            updateCalendar(currentDate);
            updateMonthDisplay();
            updateNavigationButtons();
        }
    });

    nextMonthBtn.addEventListener('click', () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + 1);
        
        if (newDate <= maxDate) {
            currentDate = newDate;
            updateCalendar(currentDate);
            updateMonthDisplay();
            updateNavigationButtons();
        }
    });

    // Inizializzazione
    updateCalendar(currentDate);
    updateMonthDisplay();
    updateNavigationButtons();
}

document.addEventListener('DOMContentLoaded', () => {
    handleMonthNavigation();
});