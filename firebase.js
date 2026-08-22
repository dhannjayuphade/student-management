import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyCTIKG1yfUqXoDY7FLDlAJxXvOkaO6-44U",
  authDomain: "student-study-manager.firebaseapp.com",
  projectId: "student-study-manager",
  storageBucket: "student-study-manager.firebasestorage.app",
  messagingSenderId: "124945078913",
  appId: "1:124945078913:web:1daf63383001944e13cb80",
  measurementId: "G-LSE43DVZNV"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


export {
  app,
  auth,
  db,

  signInAnonymously,
  onAuthStateChanged,
  signOut,

  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,

  collection,
  query,
  where,
  orderBy,
  onSnapshot,

  serverTimestamp
};
