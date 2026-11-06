# React + Vite

## Run the demo with XAMPP

The source `index.html` is an entry point for Vite; Apache cannot execute the
React JSX source directly. To serve the built demo from this project directory:

1. Start **Apache** in the XAMPP Control Panel.
2. From `Code/frontend`, install dependencies and build the demo:

   ```powershell
   npm ci
   Copy-Item .env.example .env.production
   npm run build
   ```

   The production build uses mock data (`VITE_USE_MOCK=true` in
   `.env.production`) and is written to `Code/frontend/dist`. The local
   `.env.production` file is ignored by Git.
3. Open `http://localhost/EduProjectHub/Code/frontend/dist/`.
4. Sign in with `sv`, `gv`, or `admin`; the mock password is `123456`.

Apache must allow `.htaccess` overrides (`AllowOverride All`) and have
`mod_rewrite` enabled so React routes work when refreshed. The included
`public/.htaccess` is copied into `dist` during the build.

## PHP API configuration

The frontend calls the PHP endpoints in `../Backend`. By default, API requests
use `/EduProjectHub/Code/Backend`; when running Vite, that path is proxied to
Apache on `http://localhost`. Set `VITE_API_URL` to the backend URL if the
project is hosted under a different path or Apache uses a different host/port.

The groups and tasks APIs use PHP sessions and CSRF tokens. Authentication,
reports, grades, join requests, invitations, and chatbot endpoints do not yet
exist in the PHP backend; those live-mode calls report that limitation rather
than sending requests to unimplemented routes. Set `VITE_USE_MOCK=true` to use
the frontend's mock data while those endpoints are being implemented.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
