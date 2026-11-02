# StudyMate AI

A beginner-friendly full-stack study assistant with:
- Signup/login using JWT and bcrypt
- AI summaries
- AI flashcard generation
- Saved summaries and flashcard sets in MongoDB
- A personal library
- React + Vite frontend and Express backend

## Requirements
- Node.js LTS (18+; preferably current LTS)
- Git
- VS Code
- MongoDB Atlas account
- Gemini API key

## 1. Install and check tools
Install Node.js from https://nodejs.org and Git from https://git-scm.com/downloads.
In the VS Code terminal, run:
```bash
node -v
npm -v
git --version
```

## 2. Configure backend
Open the `server` folder in the VS Code workspace (or open the project root and use terminal commands below).
```bash
cd server
npm install
```
Copy `.env.example` to `.env`, then fill in the values:
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: a long random secret
- `GEMINI_API_KEY`: your Gemini API key
- `CLIENT_ORIGIN=http://localhost:5173`

Start backend:
```bash
npm run dev
```
Backend runs at http://localhost:5000.

## 3. Configure frontend
Open a second terminal in VS Code:
```bash
cd client
npm install
```
Create `client/.env` with:
```env
VITE_API_URL=http://localhost:5000/api
```
Start frontend:
```bash
npm run dev
```
Open the URL printed by Vite, usually http://localhost:5173.

## 4. MongoDB Atlas setup
1. Create a free cluster at https://www.mongodb.com/atlas/database.
2. In Database Access, create a database user and password.
3. In Network Access, add your current IP address for development.
4. Click Connect > Drivers and copy the connection string.
5. Replace `<db_password>` with your database user's password. URL-encode special characters in the password.
6. Add the database name `studymate` before the query string, for example:
   `mongodb+srv://USERNAME:PASSWORD@cluster.example.mongodb.net/studymate?retryWrites=true&w=majority`
Do not share the connection string.

## 5. Gemini API setup
Create an API key from Google AI Studio: https://aistudio.google.com/apikey
Put it in `server/.env` as `GEMINI_API_KEY=...`.
Never put the Gemini key in a `VITE_` frontend variable or commit `.env` to GitHub.

## 6. GitHub
From the project root:
```bash
git init
git add .
git commit -m "Initial StudyMate AI project"
```
Create an empty repository on GitHub named `studymate-ai`. Do not add a README/license/gitignore there if you already have these locally.
Then run the commands GitHub shows, typically:
```bash
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/studymate-ai.git
git push -u origin main
```
Check `git status` before committing. `.env` files are ignored by `.gitignore`.

## 7. Security notes
- Never commit `.env` files or API keys.
- This is a learning project, not a production security audit.
- Use a strong `JWT_SECRET`.
- Do not use your MongoDB Atlas admin password as the database app user's password.
- The app stores password hashes, not plaintext passwords.
- Authentication tokens are stored in localStorage for simplicity in this learning demo. For production, prefer secure, HttpOnly cookies and additional security hardening.

## 8. Common issues
- `MONGODB_URI is missing`: check `server/.env`.
- Mongo connection error: check Atlas database user, password, IP allowlist, and connection string.
- `Invalid API key`: check `GEMINI_API_KEY`.
- `Failed to fetch`: make sure backend is running on port 5000 and frontend's `VITE_API_URL` is correct.
- `Cannot find module`: run `npm install` inside the relevant `server` or `client` folder.
- If Gemini's selected model is unavailable to your API key/region, change `GEMINI_MODEL` in `server/.env` to a model available in your Google AI Studio account.

## 9. Features intentionally kept simple
This version includes signup/login, summarization, flashcard generation, and personal history. It does not include PDF uploads, password reset, quiz mode, or deletion/editing. Add those only after this version works.
