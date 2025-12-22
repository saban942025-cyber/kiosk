import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDTdmqaOHerwTOpfe9qKSCP895CcIErOwo",
  authDomain: "kiosk-saban94.firebaseapp.com",
  projectId: "kiosk-saban94",
  storageBucket: "kiosk-saban94.firebasestorage.app",
  messagingSenderId: "305877295234",
  appId: "1:305877295234:web:388472509b86a7052a949b",
  measurementId: "G-1LFT3538QN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
