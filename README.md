# Leveny — Sign Up / Login (with a real local backend)

This is a small, self-contained login system:
- **`server.js`** — a Node.js/Express server. It stores accounts in `users.json` (passwords are hashed with bcrypt, never stored as plain text) and profile pictures in `uploads/`.
- **`public/login.html`** — the sign in / sign up page.
- **`public/dashboard.html`** — the page you land on after logging in.
- **`public/assets/`** — shared theme (dark/light mode) used by both pages.

## Requirements

You need [Node.js](https://nodejs.org) installed (version 18 or newer is fine). To check if you already have it, open a terminal and run:

```
node -v
```

If that prints a version number, you're set. If it says "command not found," install Node.js from nodejs.org first (just click through the installer).

## How to run it

1. **Open a terminal and go into this folder.** For example, if you unzipped it to your Desktop:
   ```
   cd Desktop/leveny-app
   ```

2. **Install the dependencies** (only needs to be done once, or whenever you change `package.json`):
   ```
   npm install
   ```
   This downloads Express, bcrypt, and Multer into a `node_modules` folder — you'll see it appear after this finishes.

3. **Start the server:**
   ```
   node server.js
   ```
   You should see:
   ```
   Leveny server running at http://localhost:3000
   Open http://localhost:3000/login.html to get started
   ```

4. **Open your browser** and go to:
   ```
   http://localhost:3000/login.html
   ```
   Create an account, then log in with it. You'll land on the dashboard.

5. **To stop the server**, go back to the terminal and press `Ctrl + C`.

## Where your data lives

- **Accounts** are saved in `users.json` in this folder (created automatically the first time someone signs up). Each entry has a username, email, and a bcrypt password hash — never the real password.
- **Profile pictures** are saved in the `uploads/` folder and linked to the account in `users.json`.

Both of these persist between server restarts — closing and reopening the server won't lose your accounts.

## Restarting later

Every time you want to use it again, you just need step 3 and 4 above (`node server.js`, then open the URL) — you don't need to run `npm install` again unless you delete `node_modules` or change dependencies.

## A note on scope

This is a local development setup, meant to run on your own machine (`localhost`). It's not deployed anywhere and isn't hardened for the public internet — things like HTTPS, rate limiting, and production session handling would need to be added before putting this in front of real users online.
