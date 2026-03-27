import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBhHJMwNWPYGQoIx2Xv1UOtsu_0uLLJw4A",
  authDomain: "citybest-a0915.firebaseapp.com",
  projectId: "citybest-a0915",
  storageBucket: "citybest-a0915.firebasestorage.app",
  messagingSenderId: "488789349661",
  appId: "1:488789349661:web:836b22f445afbb1873fdf4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
