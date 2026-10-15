# Pi To-Do

A small to-do list app for the Pi Browser. It's a static site in `public/` with no build step.

- Add, complete, delete, and filter tasks; clear completed tasks
- Signs the user in with the Pi SDK (`username` scope), verifies the token with App Studio, and keeps a separate list per verified Pi user
- Saves tasks in the browser's `localStorage`

Run locally: `npx serve public -l 3000`, then open it in the Pi Sandbox (https://sandbox.minepi.com/mobile-app-ui/app/pi-to-do-x7xe).

Tests: `node --test test/pi.test.js`
