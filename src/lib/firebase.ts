// Inicialização resiliente do Firebase.
//
// O app funciona 100% offline com localStorage. O Realtime Database é apenas
// um espelho opcional para sincronizar entre dispositivos: se as variáveis de
// ambiente não estiverem presentes (ou a lib falhar), `rtdb` fica `null` e a
// camada de dados (`src/lib/store.ts`) simplesmente ignora a nuvem.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.databaseURL,
);

let app: FirebaseApp | null = null;
let rtdb: Database | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    rtdb = getDatabase(app);
  } catch (error) {
    console.warn("[firebase] inicialização falhou, seguindo apenas offline:", error);
    app = null;
    rtdb = null;
  }
}

export { app, rtdb };
