import {auth} from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export const doSignInWithEmailAndPassword = (email, password) =>{
  return signInWithEmailAndPassword(auth, email, password);
}

export const doCreateUserWithEmailAndPassword = (email, password) =>{
  return createUserWithEmailAndPassword(auth, email, password);
}

export const doSignInWithGoogle = async () =>{
  // Implement Google Sign-In logic here
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result;
}

export const doSignOut = () =>{
  return auth.signOut();
}

export const doPasswordReset = (email) =>{
  return auth.sendPasswordResetEmail(email);
}

export const doPasswordUpdate = (password) =>{
  if(auth.currentUser){
    return auth.currentUser.updatePassword(password);
  } else {
    return Promise.reject(new Error("No user is currently signed in."));
  }
}   

export const doEmailVerification = () =>{
  if(auth.currentUser){
    return auth.currentUser.sendEmailVerification({
      url: window.location.origin
    });
  } else {
    return Promise.reject(new Error("No user is currently signed in."));
  }                     
}