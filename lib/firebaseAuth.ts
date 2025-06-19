import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig";

export { auth };

// ✅ ログイン用
export const loginUser = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password).then(res => res.user);
};

// ✅ 新規登録用 ← これが必要
export const registerUser = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password).then(res => res.user);
};
