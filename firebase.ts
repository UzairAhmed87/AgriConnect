import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCY5XdG2nyIjjVRSsDpRyRsNCUc1YbCazU",
  authDomain: "build4better-14f69.firebaseapp.com",
  projectId: "build4better-14f69",
  storageBucket: "build4better-14f69.firebasestorage.app",
  messagingSenderId: "823258593927",
  appId: "1:823258593927:web:e7a37bb68746bede4e9622"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
