import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyCh7xwNFKIEADHj4nOzWVVbb0mgMit4h3I",
  authDomain: "nanny-now-app.firebaseapp.com",
  projectId: "nanny-now-app",
  storageBucket: "nanny-now-app.firebasestorage.app",
  messagingSenderId: "421770252027",
  appId: "1:421770252027:web:68766c98c47c1fc1f26a5e",
  measurementId: "G-ZX1FRSE0BC",
};

// 初始化 Firebase
let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  
  // 提供錯誤處理和回退機制
  if (typeof window !== 'undefined') {
    window.firebaseError = error;
  }
}

// 開發環境連接模擬器（可選）
if (
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  window.location.hostname === "localhost"
) {
  // 模擬器連接代碼（如果需要）
  // try {
  //   connectFirestoreEmulator(db, 'localhost', 8080);
  //   connectAuthEmulator(auth, 'http://localhost:9099');
  // } catch (error) {
  //   console.log('Firebase emulators already connected');
  // }
}

// 導出
export { db, auth };
export default app;