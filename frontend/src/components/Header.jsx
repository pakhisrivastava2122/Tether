import React from "react";
// FIX 1: Import new icons (removed .jsx extension)
import { IconUser, IconBell, IconSettings } from "./icons/Icons";

// Add `user`, `onLogout`, `confirmedMatch` props
export default function Header({
  user,
  onLogout,
  setCurrentPage,
  confirmedMatch,
}) {
  return (
    <header className="absolute top-0 left-0 w-full z-10 py-6 px-4 md:px-8">
      <div className="container mx-auto flex justify-between items-center">
        {/* Brand Logo & Name - FIX: Changed FindMe to Tether */}
        <h1
          className="text-3xl font-bold text-white cursor-pointer"
          onClick={() => setCurrentPage("home")}
        >
          Tether
        </h1>

        <div className="flex items-center gap-4">
          {user ? (
            // --- If user is logged in ---
            <div className="flex items-center gap-3">
              {/* --- NEW: My Match Button --- */}
              {/* This will only show if 'confirmedMatch' is not null */}
              {confirmedMatch && (
                <button
                  onClick={() => setCurrentPage("match")}
                  title="View Confirmed Match"
                  className="relative flex items-center justify-center text-white bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition"
                >
                  <IconBell className="h-5 w-5 text-white" />
                  {/* Notification dot */}
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-cyan-400"></span>
                </button>
              )}

              {/* --- NEW: Profile Button --- */}
              <button
                onClick={() => setCurrentPage("profile")}
                title="My Profile"
                className="flex items-center justify-center text-white bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition"
              >
                <IconSettings className="h-5 w-5 text-white" />
              </button>

              {/* --- Logout Button --- */}
              <button
                onClick={onLogout}
                className="bg-slate-700 text-white font-medium py-2 px-5 rounded-full hover:bg-slate-800 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            // --- If user is logged out (Original Login Button) ---
            <button
              onClick={() => setCurrentPage("login")} // Set to "login"
              className="flex items-center gap-2 bg-white text-slate-900 font-medium py-2 px-4 rounded-full hover:bg-slate-200 transition"
            >
              <IconUser className="w-5 h-5 text-slate-700" />
              <span>Login</span>
            </button>
          )}
        </div>
        
      </div> {/* FIX 2: Was </nav>, changed to </div> to match opening tag on line 14 */}
    </header>
  );
}