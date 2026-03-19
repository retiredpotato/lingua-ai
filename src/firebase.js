import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, increment, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDr3oppFtMUv5u2YcmRT4NzU-we2w6LqAg",
  authDomain: "linguaai-potato.firebaseapp.com",
  projectId: "linguaai-potato",
  storageBucket: "linguaai-potato.firebasestorage.app",
  messagingSenderId: "125458925553",
  appId: "1:125458925553:web:f977ce10caf7d0f5ea2650",
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// ── Auth helpers ──────────────────────────────────────────────────────────────
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signUpWithEmail = (email, password, name) =>
  createUserWithEmailAndPassword(auth, email, password).then(async (cred) => {
    await updateProfile(cred.user, { displayName: name });
    return cred;
  });

export const signInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logOut = () => signOut(auth);

// ── Firestore helpers ─────────────────────────────────────────────────────────
export async function getOrCreateUser(user, langCode) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name: user.displayName || "Learner",
      email: user.email,
      language: langCode,
      streak: 1,
      lastActive: new Date().toDateString(),
      totalLessons: 0,
      totalTopics: 0,
      createdAt: serverTimestamp(),
    });
  }
  return (await getDoc(ref)).data();
}

export async function saveLesson(uid, topic, category) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const data = snap.data();
  const today = new Date().toDateString();
  const lastActive = data.lastActive;
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  let streakUpdate = { lastActive: today };
  if (lastActive === today) {
    streakUpdate.streak = data.streak;
  } else if (lastActive === yesterday) {
    streakUpdate.streak = increment(1);
  } else {
    streakUpdate.streak = 1;
  }

  await updateDoc(ref, {
    ...streakUpdate,
    totalLessons: increment(1),
    completedLessons: arrayUnion(`${category}:${topic}`),
  });
}

export async function saveTopicVisit(uid, topic) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    totalTopics: increment(1),
    visitedTopics: arrayUnion(topic),
  });
}

export async function saveChatMessage(uid, topic, role, content) {
  const ref = doc(db, "users", uid, "chats", topic.replace(/\s+/g, "_"));
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { topic, messages: [{ role, content, ts: Date.now() }] });
  } else {
    await updateDoc(ref, { messages: arrayUnion({ role, content, ts: Date.now() }) });
  }
}

export async function getUserProgress(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}