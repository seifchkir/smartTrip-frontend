import { Injectable } from '@angular/core';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, UserCredential } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app;
  private auth;
  private firestore;
  private storage;
  private analytics;

  constructor() {
    // Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyDDR35-Eb2NFCz93IPsMyjiNaRgNSyV_pg",
      authDomain: "smarttrip-1ab25.firebaseapp.com",
      databaseURL: "https://smarttrip-1ab25-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "smarttrip-1ab25",
      storageBucket: "smarttrip-1ab25.firebasestorage.app",
      messagingSenderId: "311824399476",
      appId: "1:311824399476:web:97eca544f940cccb30e521",
      measurementId: "G-RCNN3B82QW"
    };

    // Initialize Firebase
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.firestore = getFirestore(this.app);
    this.storage = getStorage(this.app);
    this.analytics = getAnalytics(this.app);

    console.log('Firebase initialized successfully');
  }

  // Authentication methods
  async signIn(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async signUp(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  async signOut(): Promise<void> {
    return signOut(this.auth);
  }

  // Firestore methods
  async getUserProfile(userId: string) {
    const userDoc = doc(this.firestore, 'users', userId);
    const userSnapshot = await getDoc(userDoc);
    return userSnapshot.exists() ? userSnapshot.data() : null;
  }

  async createUserProfile(userId: string, userData: any) {
    const userDoc = doc(this.firestore, 'users', userId);
    return setDoc(userDoc, userData);
  }

  async updateUserProfile(userId: string, userData: any) {
    const userDoc = doc(this.firestore, 'users', userId);
    return updateDoc(userDoc, userData);
  }

  // Storage methods
  async uploadProfileImage(userId: string, file: File) {
    const storageRef = ref(this.storage, `users/${userId}/profile.jpg`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  // Get Firebase instances
  getAuth() {
    return this.auth;
  }

  getFirestore() {
    return this.firestore;
  }

  getStorage() {
    return this.storage;
  }
}