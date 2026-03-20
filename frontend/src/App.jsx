import React, { useState, useEffect } from "react";
// Imports an 'components/' as per your project structure
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import HowItWorks from "./components/HowItWorks.jsx";
import ReportForm from "./components/ReportForm.jsx";
import Footer from "./components/Footer.jsx";
import MatchConfirmationPage from "./components/MatchConfirmationPage.jsx";
import LoginPage from "./components/LoginPage.jsx";
import ProfilePage from "./components/ProfilePage.jsx"; // Import the new page

// API URL
const API_URL = "http://127.0.0.1:8000/api";

export default function App() {
  // --- Auth State ---
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // --- Page State ---
  // 'login', 'home', 'match', 'profile'
  const [currentPage, setCurrentPage] = useState("login"); // Default to login

  // --- Match State ---
  const [currentMatchId, setCurrentMatchId] = useState(null);
  // NEW: Store the confirmed match object to persist
  const [confirmedMatch, setConfirmedMatch] = useState(null);

  // --- NEW: Helper function to fetch user's match status ---
  const fetchUserStatus = async (token) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/me/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const matchData = await res.json();
        if (matchData.confirmed_match) {
          console.log("Persistent match found:", matchData.submission_id);
          setConfirmedMatch(matchData.confirmed_match);
          setCurrentMatchId(matchData.submission_id); // Set the active match ID
        }
      } else {
        console.warn("Could not fetch user status.");
      }
    } catch (err) {
      console.error("Error fetching user status:", err);
    }
  };

  // --- Check for existing token and match status on load ---
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("user");

    const loadApp = async () => {
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setAuthToken(token);
        setUser(parsedUser);
        // NEW: Check for a confirmed match
        await fetchUserStatus(token);
        setCurrentPage("home"); // Start on home if logged in
      } else {
        setCurrentPage("login"); // Start on login if not
      }
      setIsLoadingAuth(false);
    };
    
    loadApp();
  }, []);

  // --- Handler for successful login ---
  const handleLoginSuccess = async (userData, token) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setAuthToken(token);
    setUser(userData);
    // NEW: Check for match status right after login
    await fetchUserStatus(token);
    setCurrentPage("home"); // Go to home after login
  };

  // --- NEW: Handler for user profile updates ---
  const handleUserUpdate = (newUserData) => {
    // Update state and local storage with new user details
    setUser(newUserData);
    localStorage.setItem("user", JSON.stringify(newUserData));
  };

  // --- Handler for logout ---
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setAuthToken(null);
    setUser(null);
    // NEW: Clear match state on logout
    setConfirmedMatch(null);
    setCurrentMatchId(null);
    setCurrentPage("login"); // Go to login after logout
  };

  /**
   * Called by ReportForm when backend *finds* a match.
   */
  const handleMatchFound = (submissionId) => {
    console.log("Match found! Submission ID:", submissionId);
    setCurrentMatchId(submissionId);
    // We don't set confirmedMatch here, only after user confirms
    setCurrentPage("match");
  };

  /**
   * Passed to MatchConfirmationPage to reset state.
   */
  const handleMatchComplete = (status, submissionId) => {
    if (status === "confirmed") {
      // NEW: Set the confirmed match state so the header icon appears
      setConfirmedMatch({ submission_id: submissionId });
      setCurrentMatchId(submissionId);
    } else {
      // User rejected
      setConfirmedMatch(null);
      setCurrentMatchId(null);
    }
    // Go back home
    setCurrentPage("home");
  };

  // --- RENDER LOGIC ---

  // Show loading while checking auth
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  // If NOT logged in, show ONLY the login page
  // This now correctly forces login first
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // If we are here, user IS logged in.
  return (
    <div className="bg-slate-50 text-slate-800 antialiased">
      {/* This is the new Header.
        It now receives the user, onLogout, and confirmedMatch
      */}
      <Header
        user={user}
        onLogout={handleLogout}
        setCurrentPage={setCurrentPage}
        confirmedMatch={confirmedMatch}
      />

      <main>
        {/* Conditional Page Rendering */}

        {currentPage === "home" && (
          <>
            <Hero />
            <HowItWorks />
            {/* ReportForm now gets the authToken */}
            <ReportForm
              onMatchFound={handleMatchFound}
              authToken={authToken}
            />
            <Footer />
          </>
        )}

        {currentPage === "match" && (
          <MatchConfirmationPage
            submissionId={currentMatchId}
            onConfirm={() => handleMatchComplete("confirmed", currentMatchId)}
            onReject={() => handleMatchComplete("rejected", currentMatchId)}
          />
        )}

        {/* --- NEW: Profile Page Route --- */}
        {currentPage === "profile" && (
          <ProfilePage
            user={user}
            authToken={authToken}
            onUserUpdate={handleUserUpdate}
            onLogout={handleLogout}
          />
        )}
      </main>
      
      {/* Footer is now part of the home page fragment */}
    </div>
  );
}