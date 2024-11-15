import { db, auth } from './firebase-config.js';
import { 
    doc, 
    setDoc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export const userService = {
    // Registrazione nuovo utente
    registerUser: async (email, password, userData) => {
        try {
            // Crea l'utente in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Crea il documento utente in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                ...userData,
                role: 'client', // Ruolo predefinito
                createdAt: new Date()
            });

            return user;
        } catch (error) {
            throw error;
        }
    },

    // Verifica ruolo utente
    getUserRole: async (userId) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                return userDoc.data().role;
            }
            return null;
        } catch (error) {
            throw error;
        }
    },

    // Aggiorna ruolo utente (solo per admin)
    updateUserRole: async (userId, newRole) => {
        try {
            await setDoc(doc(db, 'users', userId), {
                role: newRole
            }, { merge: true });
            return true;
        } catch (error) {
            throw error;
        }
    }
}; 