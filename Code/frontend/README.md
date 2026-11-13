# Frontend

## Run with XAMPP

React's JSX source cannot be served directly by Apache. Start Apache in XAMPP, then from `Code/frontend` install and build:

```powershell
npm ci
Copy-Item .env.example .env.production
npm run build
```

`.env.example` uses the real PHP API by default. The build output is served at `http://localhost/EduProjectHub/Code/frontend/dist/`. Import the database files and use the real account credentials configured in MySQL.

Import the database files in the order documented in `../../database/README.md`. The default API URL is `/EduProjectHub/Code/Backend`; configure `VITE_API_URL` if the project is hosted at a different path. Rebuild after changing Vite environment variables. Production builds reject mock mode; for an isolated development-only UI demo, create `.env.local` with `VITE_USE_MOCK=true`.

Apache must allow `.htaccess` overrides and enable `mod_rewrite` so frontend routes work after refresh. The `public/.htaccess` file is copied into `dist`.

## API contract

Frontend feature pages call their service in `src/api`. JavaScript models use camelCase; PHP and MySQL use snake_case, with conversion handled by the service layer. PHP responses use `{ "data": ... }` and `{ "error": ... }`. Authenticated mutations use the PHP session cookie and a CSRF token. `auth.php`, `users.php`, `groups.php`, `tasks.php`, `progress.php`, `semesters.php`, `reports.php`, `notifications.php`, `topics.php`, `defense.php`, and `chatbot.php` use the shared database connection in `../../database/database.php`.

The login identity is `users.username`; PHP keeps the authenticated user ID in the session. A stored browser user object is only a display cache and is validated against `auth.php?action=me` on page load.
