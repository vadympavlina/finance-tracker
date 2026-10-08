import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { get, getDatabase, onValue, ref, update } from 'firebase/database'
import { firebaseConfig } from './config'
import type { CloudBackend, CloudData } from './types'

/** Production backend: Firebase Auth + Realtime Database. Loaded lazily (own chunk). */
export function createFirebaseBackend(): CloudBackend {
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  auth.languageCode = 'uk'
  const db = getDatabase(app)
  const userRef = (uid: string, path = '') => ref(db, `users/${uid}${path}`)

  return {
    onAuth: (cb) => onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null)),
    async signIn(email, password) {
      await signInWithEmailAndPassword(auth, email, password)
    },
    async signUp(email, password, name) {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (name) await updateProfile(cred.user, { displayName: name }).catch(() => {})
    },
    async signInWithGoogle() {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      // Installed PWAs on iOS can't open popups reliably — fall back to a redirect.
      const standalone = window.matchMedia('(display-mode: standalone)').matches
      if (standalone) return signInWithRedirect(auth, provider)
      await signInWithPopup(auth, provider)
    },
    async resetPassword(email) {
      await sendPasswordResetEmail(auth, email)
    },
    async signOut() {
      await signOut(auth)
    },
    async read(uid) {
      const snap = await get(userRef(uid, '/data'))
      return snap.exists() ? (snap.val() as CloudData) : null
    },
    subscribe: (uid, cb) => onValue(userRef(uid, '/data'), (snap) => cb(snap.exists() ? (snap.val() as CloudData) : null)),
    async update(uid, paths) {
      await update(userRef(uid), paths)
    },
    onConnection: (cb) => onValue(ref(db, '.info/connected'), (snap) => cb(snap.val() === true)),
  }
}
