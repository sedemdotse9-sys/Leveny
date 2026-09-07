/* ============================================================
   FIREBASE-CONFIG.JS — Leveny
   Connected to your real Firebase project ("leveny-2009").

   These values are NOT secret — Firebase web config is meant to
   be public. What actually protects your data is the Firestore
   Security Rules (see firestore.rules in this repo), which you
   paste into Firebase Console > Firestore > Rules > Publish.

   OWNER_UID: still a placeholder below. Once you've created your
   owner account in Authentication > Users, copy its "User UID"
   value and paste it in two places:
     1. Here, replacing OWNER_UID_PLACEHOLDER
     2. In firestore.rules, replacing OWNER_UID_PLACEHOLDER inside
        the isOwner() function
   Comments/announcements will work without this, but you won't
   be recognized as the owner (no "New" button, no reply badge)
   until both are filled in and the rules are published.
============================================================ */

window.LEVENY_FIREBASE_CONFIG = {
    apiKey: "AIzaSyCh34WUPP2KVJXltdboRZXtj2XGCLk1bmg",
    authDomain: "leveny-2009.firebaseapp.com",
    projectId: "leveny-2009",
    storageBucket: "leveny-2009.firebasestorage.app",
    messagingSenderId: "495228344164",
    appId: "1:495228344164:web:f37ee02837c254b8244c71"
};

/* Your own Auth UID (Authentication > Users > User UID column).
   Only this account will ever be able to post announcements or
   have replies tagged with the "Sedem" owner badge — everything
   is enforced server-side in firestore.rules, not just here. */
window.LEVENY_OWNER_UID = "PkxVtLppn1dtMe55siwc5lHFBzm1";

/* The name shown on your own replies & announcements. */
window.LEVENY_OWNER_NAME = "Sedem";
