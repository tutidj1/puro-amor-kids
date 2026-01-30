import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

function initAuthProtection() {
    onAuthStateChanged(auth, (user) => {
        const path = window.location.pathname;
        const page = path.split("/").pop();

        if (user) {
            console.log("Usuario autenticado:", user.email);
            if (page === 'login.html' || page === 'login') {
                window.location.href = 'admin.html';
            }
        } else {
            console.log("No hay usuario activo");
            if (page === 'admin.html' || page === 'admin') {
                window.location.href = 'login.html';
            }
        }
    });
}

async function login(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // El listener de onAuthStateChanged se encargará de la redirección
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        throw error;
    }
}

async function logout() {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
}

// Exponer funciones globalmente si es necesario
window.loginApp = {
    login,
    logout
};

initAuthProtection();
