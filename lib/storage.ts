import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "./firebaseConfig";
import { v4 as uuidv4 } from "uuid";

const storage = getStorage(app);

// タイムアウト付きのPromiseラッパー
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`操作がタイムアウトしました (${timeoutMs}ms)`)), timeoutMs)
    )
  ]);
};

export const uploadImage = async (file: File) => {
  try {
    console.log("画像アップロード開始:", file.name, "サイズ:", file.size);
    
    // ファイルサイズチェック (10MB制限)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("ファイルサイズが大きすぎます (10MB以下にしてください)");
    }
    
    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      throw new Error("画像ファイルを選択してください");
    }
    
    const fileName = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const imageRef = ref(storage, `textbookImages/${fileName}`);
    
    console.log("Firebase Storageにアップロード中...");
    const uploadResult = await withTimeout(
      uploadBytes(imageRef, file),
      60000 // 60秒タイムアウト
    );
    console.log("アップロード完了:", uploadResult);
    
    console.log("ダウンロードURL取得中...");
    const url = await withTimeout(
      getDownloadURL(imageRef),
      30000 // 30秒タイムアウト
    );
    console.log("ダウンロードURL取得完了:", url);
    
    return url;
  } catch (error) {
    console.error("画像アップロードエラー詳細:", error);
    throw error;
  }
};

// アバター画像をアップロードする関数
export const uploadAvatar = async (file: File, userId: string) => {
  try {
    console.log("アバター画像アップロード開始:", file.name, "サイズ:", file.size);
    
    // ファイルサイズチェック (5MB制限)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("ファイルサイズが大きすぎます (5MB以下にしてください)");
    }
    
    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      throw new Error("画像ファイルを選択してください");
    }
    
    // ユーザーIDを使ってファイル名を生成
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${extension}`;
    const avatarRef = ref(storage, `avatars/${fileName}`);
    
    console.log("Firebase Storageにアバターアップロード中...");
    const uploadResult = await withTimeout(
      uploadBytes(avatarRef, file),
      60000 // 60秒タイムアウト
    );
    console.log("アバターアップロード完了:", uploadResult);
    
    console.log("アバターダウンロードURL取得中...");
    const url = await withTimeout(
      getDownloadURL(avatarRef),
      30000 // 30秒タイムアウト
    );
    console.log("アバターダウンロードURL取得完了:", url);
    
    return url;
  } catch (error) {
    console.error("アバター画像アップロードエラー詳細:", error);
    throw error;
  }
};

// 複数画像を一括アップロードする関数
export const uploadImages = async (files: File[], bookId?: string): Promise<string[]> => {
  try {
    console.log("複数画像アップロード開始:", files.length, "枚");
    
    const uploadPromises = files.map(async (file, index) => {
      // ファイルサイズチェック (10MB制限)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`画像 ${index + 1}: ファイルサイズが大きすぎます (10MB以下にしてください)`);
      }
      
      // ファイルタイプチェック
      if (!file.type.startsWith('image/')) {
        throw new Error(`画像 ${index + 1}: 画像ファイルを選択してください`);
      }
      
      const fileName = bookId 
        ? `${bookId}-${index}-${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        : `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const imageRef = ref(storage, `textbookImages/${fileName}`);
      
      console.log(`画像 ${index + 1} アップロード中...`);
      const uploadResult = await withTimeout(
        uploadBytes(imageRef, file),
        60000 // 60秒タイムアウト
      );
      
      console.log(`画像 ${index + 1} ダウンロードURL取得中...`);
      const url = await withTimeout(
        getDownloadURL(imageRef),
        30000 // 30秒タイムアウト
      );
      
      console.log(`画像 ${index + 1} アップロード完了:`, url);
      return url;
    });
    
    const urls = await Promise.all(uploadPromises);
    console.log("全画像アップロード完了:", urls);
    return urls;
  } catch (error) {
    console.error("複数画像アップロードエラー詳細:", error);
    throw error;
  }
};
