import React, { useState } from "react";
import { IconMail, IconUser, IconLock, IconPhone } from "./icons/Icons.jsx";

const API_URL = "http://127.0.0.1:8000/api/auth";

export default function LoginPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper for input field styling
  const inputGroupClass = "relative mb-6";
  const inputClass = "w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all";
  const inputIconClass = "absolute left-3 top-1/2 -translate-y-1/2";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isLogin) {
      // --- Handle Login ---
      try {
        const res = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: username, // Use "username" field for all identifiers
            password: password,
          }),
        });
        
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || "Login failed");
        }
        
        // On success, call the handler from App.jsx
        onLoginSuccess(data.user, data.access_token);

      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    } else {
      // --- Handle Sign Up ---
      try {
        const res = await fetch(`${API_URL}/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            email,
            phone,
            password,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || "Sign up failed");
        }
        
        // On success, call the handler from App.jsx
        onLoginSuccess(data.user, data.access_token);

      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-800 p-4">
      <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-slate-200">
        <h1 className="text-4xl font-bold text-center text-slate-800 mb-4">
          Tether
        </h1>
        <h2 className="text-xl text-center text-slate-600 mb-10">
          {isLogin ? "Welcome Back" : "Create Your Account"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* --- Error Message --- */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
              <p>{error}</p>
            </div>
          )}

          {/* --- Login Identifier --- */}
          {isLogin && (
            <div className={inputGroupClass}>
              <label htmlFor="identifier" className="sr-only">Username, Email, or Phone</label>
              <div className="relative">
                <span className={inputIconClass}><IconUser /></span>
                <input
                  type="text"
                  id="identifier"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                  placeholder="Username, Email, or Phone"
                  required
                />
              </div>
            </div>
          )}

          {/* --- Signup Fields --- */}
          {!isLogin && (
            <>
              <div className={inputGroupClass}>
                <label htmlFor="username" className="sr-only">Username</label>
                <div className="relative">
                  <span className={inputIconClass}><IconUser /></span>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={inputClass}
                    placeholder="Username"
                    required
                  />
                </div>
              </div>
              <div className={inputGroupClass}>
                <label htmlFor="email" className="sr-only">Email</label>
                <div className="relative">
                  <span className={inputIconClass}><IconMail /></span>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="Email Address"
                    required
                  />
                </div>
              </div>
              <div className={inputGroupClass}>
                <label htmlFor="phone" className="sr-only">Phone</label>
                <div className="relative">
                  <span className={inputIconClass}><IconPhone /></span>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    placeholder="Phone Number"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* --- Password (Shared) --- */}
          <div className={inputGroupClass}>
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
              <span className={inputIconClass}><IconLock /></span>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Password"
                required
              />
            </div>
          </div>

          {/* --- Submit Button --- */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 text-white font-bold text-lg py-4 px-6 rounded-lg shadow-lg hover:bg-cyan-700 transition-all duration-300 disabled:bg-slate-400"
            >
              {loading ? "Working..." : (isLogin ? "Login" : "Create Account")}
            </button>
          </div>
        </form>

        {/* --- Toggle Button --- */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(""); // Clear errors on toggle
            }}
            className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
          >
            {isLogin
              ? "Need an account? Sign Up"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}