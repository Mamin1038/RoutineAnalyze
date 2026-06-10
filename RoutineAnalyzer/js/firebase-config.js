import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, GoogleAuthProvider, signInWithPopup, 
    createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCSfnnkl5If_-aHhtWhsi3afAIVR0qQo60",
    authDomain: "rsc-website-a3d72.firebaseapp.com",
    projectId: "rsc-website-a3d72",
    storageBucket: "rsc-website-a3d72.firebasestorage.app",
    messagingSenderId: "622877367685",
    appId: "1:622877367685:web:13bc81a7214f5501d0f8ec",
    measurementId: "G-02GTJNN433"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

export { 
    signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    onAuthStateChanged, signOut, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs 
};