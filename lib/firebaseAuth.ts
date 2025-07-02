import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  User,
  updateProfile
} from "firebase/auth";
import { auth } from "./firebaseConfig";

export { auth };

// ✅ ログイン用
export const loginUser = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password).then(res => res.user);
};

// ✅ 新規登録用（メール認証付き）
export const registerUser = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password).then(res => res.user);
};

// ✅ メール認証送信
export const sendVerificationEmail = async (user: User): Promise<void> => {
  try {
    await sendEmailVerification(user, {
      url: `${window.location.origin}/login?verified=true`, // 認証後のリダイレクト先
      handleCodeInApp: false,
    });
    console.log("認証メール送信完了");
  } catch (error) {
    console.error("認証メール送信エラー:", error);
    throw error;
  }
};

// ✅ ユーザープロフィール更新（表示名など）
export const updateUserProfile = async (user: User, profile: { displayName?: string; photoURL?: string }): Promise<void> => {
  try {
    await updateProfile(user, profile);
    console.log("ユーザープロフィール更新完了");
  } catch (error) {
    console.error("ユーザープロフィール更新エラー:", error);
    throw error;
  }
};

// ✅ メール認証状態をチェック
export const checkEmailVerification = (user: User | null): boolean => {
  return user?.emailVerified || false;
};

// ✅ 認証メール再送信
export const resendVerificationEmail = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ユーザーがログインしていません");
  }
  
  if (user.emailVerified) {
    throw new Error("メールは既に認証済みです");
  }
  
  await sendVerificationEmail(user);
};
