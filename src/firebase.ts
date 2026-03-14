import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyD61l98FA-MAH4-AWQRnVuD6X76o3wX-6I',
  authDomain: 'javapath-8f066.firebaseapp.com',
  projectId: 'javapath-8f066',
  storageBucket: 'javapath-8f066.firebasestorage.app',
  messagingSenderId: '50905660624',
  appId: '1:50905660624:web:3a4dc5676ca2c2c554f2d5',
  measurementId: 'G-R5E6YYNPCQ',
  databaseURL: 'https://javapath-8f066-default-rtdb.europe-west1.firebasedatabase.app',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getDatabase(app)
export const googleProvider = new GoogleAuthProvider()
