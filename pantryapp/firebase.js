// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore/lite";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHkE-O-hKduyBA8eYzvHRAWzjnurQR1tY",
  authDomain: "hspantryapp-73f57.firebaseapp.com",
  projectId: "hspantryapp-73f57",
  storageBucket: "hspantryapp-73f57.appspot.com",
  messagingSenderId: "152471598059",
  appId: "1:152471598059:web:a06d5289a6079ae8a05fae"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export{app,firestore}; 
