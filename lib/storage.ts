import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "./firebaseConfig";
import { v4 as uuidv4 } from "uuid";

const storage = getStorage(app);

export const uploadImage = async (file: File) => {
  const imageRef = ref(storage, `textbookImages/${uuidv4()}-${file.name}`);
  await uploadBytes(imageRef, file);
  const url = await getDownloadURL(imageRef);
  return url;
};
