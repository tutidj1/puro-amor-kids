// Configuración de Firebase - Versión Compatible (v10.8.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBdqfaSrmKKlfLOY0wdoof4bETPK_qP7dY",
  authDomain: "puroamorkids.firebaseapp.com",
  projectId: "puroamorkids",
  storageBucket: "puroamorkids.firebasestorage.app",
  messagingSenderId: "207436845093",
  appId: "1:207436845093:web:9418072f5cf8634ada2fcc",
  measurementId: "G-084R00YNE1"
};

// Inicialización
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, db, analytics, auth };
