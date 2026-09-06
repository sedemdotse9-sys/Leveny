# Setting up the Comments page

The Comments page (`comments.html`) needs a small, **free** Firebase
project behind it so real visitors' comments actually reach you (and
you can reply from any device) instead of only living in one
browser's local storage.

## 1. Create the Firebase project

1. Go to <https://console.firebase.google.com> and click **Add project**.
   Name it whatever you like (e.g. "leveny"). You can skip Google
   Analytics — not needed.
2. In the left sidebar: **Build → Firestore Database → Create database**.
   Pick any region close to you, start in **production mode** (we
   supply our own rules in step 4, so this is safe).
3. In the left sidebar: **Build → Authentication → Get started →
   Sign-in method → Email/Password → Enable**.
4. Still in Authentication, go to the **Users** tab → **Add user** →
   enter your own email + a password. This one account is *you*, the
   site owner — it's how the page knows to show you the "New
   Announcement" button and the Reply buttons.

## 2. Get your web config

1. Click the gear icon → **Project settings → General**.
2. Scroll to **Your apps → Add app → Web (`</>`)**. Give it any
   nickname, you don't need Firebase Hosting.
3. It'll show a `firebaseConfig` object — copy the values into
   `js/firebase-config.js` in this repo (replace every `PASTE_...`
   placeholder).

## 3. Copy your UID

1. Back in **Authentication → Users**, copy the value in the
   **User UID** column for the account you made in step 1.4.
2. Paste it into `js/firebase-config.js` as `LEVENY_OWNER_UID`.
3. Paste that same UID into `firestore.rules`, replacing
   `OWNER_UID_PLACEHOLDER` (it appears once, inside `isOwner()`).

## 4. Publish the security rules

1. **Firestore Database → Rules** tab.
2. Select all, delete, and paste in the full contents of
   `firestore.rules` from this repo.
3. Click **Publish**.

These rules are what actually keep the page honest: anyone can post
a comment, but only your signed-in account can post an announcement
or have a reply tagged with the "★ Sedem" owner badge — that's
enforced on Firebase's servers, not just hidden in the page's HTML.

## 5. Commit & push

Push `comments.html`, `css/comments.css`, `js/comments.js`,
`js/firebase-config.js`, `firestore.rules`, and the updated pages
(everywhere the "Profile" link now points to `comments.html`)
straight to your repo — GitHub Pages will pick it up automatically.

## Using it day-to-day

- **Visitors**: no sign-in needed. They land on Comments from the
  Profile icon, type a name + message, and it appears for everyone
  in real time.
- **You**: click the small lock icon ("Owner Sign In") near the page
  title, sign in with the email/password from step 1.4. You'll now
  see a **New** button to post announcements at the top, and a
  **Reply** link under every comment. Your replies get a gold
  "★ Sedem" badge. Sign-in persists in that browser until you sign
  out, so you won't have to log in every visit.

## Free tier limits (Spark plan)

Firestore's free tier is generous for a fan site: 50K reads / 20K
writes / 20K deletes per day, 1 GiB stored. A comments board would
need a *lot* of traffic to come close to that — you can revisit if
it ever does.
