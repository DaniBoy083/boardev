import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCmzWdc1_c7S1AMavThQqJo7MdOwAELnL4",
  authDomain: "boardev-c50f6.firebaseapp.com",
  projectId: "boardev-c50f6",
  storageBucket: "boardev-c50f6.firebasestorage.app",
  messagingSenderId: "160705795287",
  appId: "1:160705795287:web:2fe68096223a5b962b0c92",
  measurementId: "G-05DHB51KH9",
};

const firebaseApp = initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);
