// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCmzWdc1_c7S1AMavThQqJo7MdOwAELnL4",
  authDomain: "boardev-c50f6.firebaseapp.com",
  projectId: "boardev-c50f6",
  storageBucket: "boardev-c50f6.firebasestorage.app",
  messagingSenderId: "160705795287",
  appId: "1:160705795287:web:2fe68096223a5b962b0c92",
  measurementId: "G-05DHB51KH9"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Exportado para montar URLs da REST API do Firestore no backend.
export const firebaseProjectId = firebaseConfig.projectId;
// Exportado para autenticar chamadas REST server-side sem depender do SDK web.
export const firebaseApiKey = firebaseConfig.apiKey;
export { db };