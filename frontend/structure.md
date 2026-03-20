```md
Tether Frontend Project Structure

This document outlines the file and folder structure for the React (Vite) frontend.

frontend/
└── src/
    ├── main.jsx          # --- App Entry Point ---
    │                     # Renders the main <App /> component
    │                     # into the HTML.
    │
    ├── index.css         # Main stylesheet, imports Tailwind CSS.
    │
    ├── App.jsx           # --- Main Application Controller ---
    │                     # This is the most important component.
    │                     # - Manages all global state:
    │                     #   - `user` & `authToken` (for auth)
    │                     #   - `currentPage` (for page navigation)
    │                     #   - `currentMatchId` & `confirmedMatch` (for
    │                     #     tracking match status)
    │                     # - Contains all core logic:
    │                     #   - `handleLoginSuccess`, `handleLogout`
    │                     #   - `handleMatchFound`, `handleMatchComplete`
    │                     # - Renders the correct "page" component
    │                     #   based on the `currentPage` state.
    │
    └── components/         # --- UI Components / "Views" ---
        ├── Header.jsx        # Navigation bar. Conditionally shows
        │                     # Login/Logout, Profile, and "My Match" buttons.
        │
        ├── LoginPage.jsx     # View for both Sign Up and Login.
        │                     # Handles API calls to /api/auth/signup & /login.
        │
        ├── ReportForm.jsx    # The main "File a Report" form for
        │                     # parents and volunteers.
        │                     # Handles FormData submission to /api/report.
        │
        ├── MatchConfirmationPage.jsx # View to show a potential match.
        │                             # Fetches details from /api/match/{id}
        │                             # and handles /api/confirm or /api/reject.
        │
        ├── ProfilePage.jsx   # View for updating user details and
        │                     # changing the password.
        │
        ├── Hero.jsx          # Landing page "hero" section.
        ├── HowItWorks.jsx    # Landing page "how it works" section.
        ├── Footer.jsx        # Landing page footer.
        │
        ├── ImageCard.jsx     # Reusable UI for showing an image on
        │                     # the MatchConfirmationPage.
        │
        └── icons/
            └── Icons.jsx     # A single file that exports all
                              # SVG icons used in the application.
```