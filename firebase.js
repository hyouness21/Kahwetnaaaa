import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB6tdEiKk0vO3cp9HaKBYFW9vT4shLpUXE",
  authDomain: "kahwetna-6453a.firebaseapp.com",
  projectId: "kahwetna-6453a",
  storageBucket: "kahwetna-6453a.firebasestorage.app",
  messagingSenderId: "664496128564",
  appId: "1:664496128564:web:47af2339a1a9fef7044061",
  measurementId: "G-YSQS3PX0FB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc, updateDoc };
