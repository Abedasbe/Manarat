import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCyDNurTjkrPhKFDBwrpFkceDdp-z7bzaE",
  authDomain: "manarat-130102.firebaseapp.com",
  projectId: "manarat-130102",
  storageBucket: "manarat-130102.firebasestorage.app",
  messagingSenderId: "164370016812",
  appId: "1:164370016812:web:e09e41a0ce4cf25e8e3f89",
  measurementId: "G-JEHXJSEV7C"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);