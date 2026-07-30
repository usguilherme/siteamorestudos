import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import app from "./firebase";

export const auth = getAuth(app);

export const loginUser = signInWithEmailAndPassword;
export const logoutUser = () => signOut(auth);