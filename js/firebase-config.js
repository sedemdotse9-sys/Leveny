/* ============================================================
   FIREBASE-CONFIG.JS — Leveny
   Paste your own Firebase project's config below. This is the
   ONLY file you should need to edit to get comments.html
   talking to your own free Firebase project.

   Where to get these values:
     1. https://console.firebase.google.com -> Add project (free)
     2. Build > Firestore Database -> Create database (Start in
        "production mode" is fine, we ship our own rules below)
     3. Build > Authentication -> Sign-in method -> enable
        "Email/Password" -> Users tab -> Add user (this is YOU,
        the site owner — one email + password, nothing else)
     4. Project settings (gear icon) > General > "Your apps" >
        Add app > Web (</>) > register it (no hosting needed) ->
        copy the firebaseConfig object it gives you -> paste the
        values into OWNER_UID/LEVENY_FIREBASE_CONFIG below.

   These values are NOT secret — Firebase web config is meant to
   be public. What actually protects your data is the Firestore
   Security Rules (see firestore.rules in this repo), which you
   paste into Firebase Console > Firestore Database > Rules.

   OWNER_UID: after creating your one Auth user in step 3, open
   Authentication > Users, copy the "User UID" column value for
   your account, and paste it below AND into firestore.rules
   wherever you see OWNER_UID_PLACEHOLDER.
============================================================ */

window.LEVENY_FIREBASE_CONFIG = {
    apiKey: "PASTE_YOUR_API_KEY",
    authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
    projectId: "PASTE_YOUR_PROJECT_ID",
    storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
    messagingSenderId: "PASTE_YOUR_SENDER_ID",
    appId: "PASTE_YOUR_APP_ID"
};

/* Your own Auth UID (Authentication > Users > User UID column).
   Only this account will ever be able to post announcements or
   have replies tagged with the "Sedem" owner badge — everything
   is enforced server-side in firestore.rules, not just here. */
window.LEVENY_OWNER_UID = "OWNER_UID_PLACEHOLDER";

/* The name shown on your own replies & announcements. */
window.LEVENY_OWNER_NAME = "Sedem";
