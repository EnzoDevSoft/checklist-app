import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyC8wT2dn3UAwH739jObDPpBHazz2isaQRU",
  authDomain: "auditoria-app-6a824.firebaseapp.com",
  projectId: "auditoria-app-6a824",
  storageBucket: "auditoria-app-6a824.firebasestorage.app",
  messagingSenderId: "1041940515549",
  appId: "1:1041940515549:web:876c95f047f1867ffe2934"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)