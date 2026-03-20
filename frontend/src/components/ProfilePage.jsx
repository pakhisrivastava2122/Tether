import React, { useState } from "react";
// FIX: Import icons (with .jsx extension as per your project)
import { IconMail, IconUser, IconLock, IconPhone } from "./icons/Icons";

const API_URL = "http://127.0.0.1:8000/api/auth";

// Helper for input field styling
const inputGroupClass = "relative mb-4";
const inputClass = "w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all";
const inputIconClass = "absolute left-3 top-1/2 -translate-y-1/2";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";

export default function ProfilePage({ user, authToken, onUserUpdate, onLogout }) {
  // State for user details form
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [detailsSuccess, setDetailsSuccess] = useState("");

  // State for password form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setDetailsLoading(true);
    setDetailsError("");
    setDetailsSuccess("");

    try {
      const res = await fetch(`${API_URL}/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ username, email, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to update details");
      }
      // Call parent update function
      onUserUpdate(data); 
      setDetailsSuccess("Profile updated successfully!");
    } catch (err) {
      setDetailsError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassLoading(true);
    setPassError("");
    setPassSuccess("");

    try {
      const res = await fetch(`${API_URL}/me/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to update password");
      }
      setPassSuccess(
        "Password updated successfully! You will be logged out."
      );
      // Log out after password change
      setTimeout(onLogout, 2000);
    } catch (err) {
      setPassError(err.message);
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-24 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* --- Update Details Form --- */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              Update Profile
            </h2>
            <form onSubmit={handleDetailsSubmit}>
              {detailsError && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
                  {detailsError}
                </div>
              )}
              {detailsSuccess && (
                <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">
                  {detailsSuccess}
                </div>
              )}

              <div className={inputGroupClass}>
                <label htmlFor="username" className={labelClass}>
                  Username
                </label>
                <div className="relative">
                  <span className={inputIconClass}>
                    <IconUser />
                  </span>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className={inputGroupClass}>
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <div className="relative">
                  <span className={inputIconClass}>
                    <IconMail />
                  </span>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className={inputGroupClass}>
                <label htmlFor="phone" className={labelClass}>
                  Phone
                </label>
                <div className="relative">
                  <span className={inputIconClass}>
                    <IconPhone />
                  </span>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={detailsLoading}
                className="w-full bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-cyan-700 transition-all disabled:bg-slate-400"
              >
                {detailsLoading ? "Updating..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* --- Change Password Form --- */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              Change Password
            </h2>
            <form onSubmit={handlePasswordSubmit}>
              {passError && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
                  {passError}
                </div>
              )}
              {passSuccess && (
                <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">
                  {passSuccess}
                </div>
              )}

              <div className={inputGroupClass}>
                <label htmlFor="old_password" className={labelClass}>
                  Old Password
                </label>
                <div className="relative">
                  <span className={inputIconClass}>
                    <IconLock />
                  </span>
                  <input
                    type="password"
                    id="old_password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className={inputGroupClass}>
                <label htmlFor="new_password" className={labelClass}>
                  New Password
                </label>
                <div className="relative">
                  <span className={inputIconClass}>
                    <IconLock />
                  </span>
                  <input
                    type="password"
                    id="new_password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="w-full bg-slate-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-slate-800 transition-all disabled:bg-slate-400"
              >
                {passLoading ? "Updating..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}