/*
  This component is updated to read the new nested data structure
  from the backend, e.g., `parent_report.child_entered.name`
  instead of `parent_report.child_name`.
*/
import React, { useState, useEffect } from "react";
// FIX: Updated paths to go up one directory (from 'components' to 'src')
import ImageCard from "./ImageCard";
import {
  IconCheck,
  IconXClose,
  IconCalendar,
  IconUser,
  IconInfo
} from "./icons/Icons"; // FIX: Updated path
import axios from "axios"; // Using axios as in your file

export default function MatchConfirmationPage({ submissionId, onConfirm, onReject }) {

  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [errorMessage, setErrorMessage] = useState("");

  // Base URL for the backend
  const API_URL = "http://127.0.0.1:8000";

  // ================================
  // Fetch Match Data From Backend
  // ================================
  useEffect(() => {
    if (!submissionId) {
      setErrorMessage("No submission ID provided.");
      setLoading(false);
      return;
    }

    async function loadMatch() {
      setLoading(true);
      setErrorMessage("");
      try {
        // Use port 8000 for FastAPI
        const res = await fetch(`${API_URL}/api/match/${submissionId}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Could not find match data.");
        }
        const data = await res.json();
        console.log("MATCH DATA:", data);
        setMatchData(data);
      } catch (err) {
        console.error("Error fetching match:", err);
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadMatch();
  }, [submissionId]);

  // ================================
  // Confirm Match
  // ================================
  const handleConfirm = async () => {
    setStatus("confirmed");
    try {
      await axios.post(`${API_URL}/api/confirm`, {
        submission_id: submissionId
      });
      // Call the onConfirm prop from App.jsx after a short delay
      setTimeout(onConfirm, 2500);
    } catch (err) {
      console.error("Error confirming match", err);
      // Even if API fails, we navigate back
      setTimeout(onConfirm, 2500);
    }
  };

  // ================================
  // Reject Match
  // ================================
  const handleReject = async () => {
    setStatus("rejected");
    try {
      await axios.post(`${API_URL}/api/reject`, {
        submission_id: submissionId
      });
      // Call the onReject prop from App.jsx after a short delay
      setTimeout(onReject, 2500);
    } catch (err) {
      console.error("Error rejecting match", err);
      // Even if API fails, we navigate back
      setTimeout(onReject, 2500);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // ================================
  // Loading or Error Handling
  // ================================
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-center p-10 text-xl font-semibold text-slate-700">
        Loading match result…
      </div>
    );
  
  if (errorMessage)
    return (
      <div className="flex justify-center items-center min-h-screen text-center p-10 text-xl font-semibold text-red-600 bg-red-50">
        Error: {errorMessage}
      </div>
    );

  if (!matchData)
    return (
      <div className="flex justify-center items-center min-h-screen text-center p-10 text-xl font-semibold text-slate-700">
        No match data found for this ID.
      </div>
    );

  // ⚠️ IMPORTANT: Use backend image URLs
  const parentImage = `${API_URL}${matchData.parent_report.image_path}`;
  const volunteerImage = `${API_URL}${matchData.volunteer_report.image_path}`;
  
  // --- Get Parent's submitted name for the title ---
  const parentChildName = matchData.parent_report.child_entered.name || "Child";

  return (
    <section className="py-28 md:py-36 bg-slate-100 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-slate-200">

          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-slate-800">
            We Found a Potential Match
          </h2>

          <p className="text-center text-slate-600 text-lg mb-12 max-w-2xl mx-auto">
            Please review the details and confirm if this is your child.
          </p>

          {/* --- IMAGE COMPARISON --- */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4">

            <ImageCard
              title={`Your Report (${parentChildName})`}
              imageUrl={parentImage}
              altText="Parent Uploaded Image"
            />

            {/* Match Score & Arrow */}
            <div className="w-full md:w-auto flex flex-col items-center px-4">
              <div className="text-center md:mb-4">
                <span className="text-sm font-medium text-slate-500">Match Score</span>
                <div className="text-4xl font-bold text-cyan-600 my-2">
                  {(matchData.match_score * 100).toFixed(1)}%
                </div>
              </div>
              {/* Connection Arrow (visual only) */}
              <div className="w-px h-16 md:w-32 md:h-px bg-slate-300 border-slate-300 border-dashed border-2 rounded-full"></div>
            </div>

            <ImageCard
              title="Found Child Report"
              imageUrl={volunteerImage}
              altText="Volunteer Uploaded Image"
            />

          </div>

          {/* --- DETAILS (UPDATED to use new nested schema) --- */}
          <div className="mt-16 bg-slate-50 border border-slate-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Volunteer’s Report</h3>

            <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">

              <div className="flex items-start gap-3">
                <IconCalendar />
                <div>
                  <h4 className="font-semibold text-slate-700">Uploaded</h4>
                  <p className="text-slate-600">
                    {/* This field is top-level */}
                    {formatDate(matchData.volunteer_report.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <IconUser />
                <div>
                  <h4 className="font-semibold text-slate-700">Uploaded By</h4>
                  <p className="text-slate-600">
                    {/* UPDATED: Accessing nested 'volunteer' object */}
                    {matchData.volunteer_report.volunteer.name}
                  </p>
                </div>
              </div>

              {/* Display dynamic child details from the volunteer report */}
              <div className="flex items-start gap-3">
                <IconInfo />
                <div>
                  <h4 className="font-semibold text-slate-700">Approx. Age</h4>
                  {/* UPDATED: Accessing nested 'found_child' object */}
                  <p className="text-slate-600">{matchData.volunteer_report.found_child.approx_age}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconInfo />
                <div>
                  <h4 className="font-semibold text-slate-700">Skin Complexion</h4>
                  {/* UPDATED: Accessing nested 'found_child' object */}
                  <p className="text-slate-600">{matchData.volunteer_report.found_child.skin}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconInfo />
                <div>
                  <h4 className="font-semibold text-slate-700">City Found</h4>
                  {/* UPDATED: Accessing nested 'found_child' object */}
                  <p className="text-slate-600">{matchData.volunteer_report.found_child.city_found}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconInfo />
                <div>
                  <h4 className="font-semibold text-slate-700">Address Found</h4>
                  {/* UPDATED: Accessing nested 'found_child' object */}
                  <p className="text-slate-600">{matchData.volunteer_report.found_child.address_found}</p>
                </div>
              </div>
              
              {/* Display birthmarks if any */}
              {/* UPDATED: Accessing nested 'found_child' object */}
              {matchData.volunteer_report.found_child.birthmarks && matchData.volunteer_report.found_child.birthmarks.length > 0 && (
                 <div className="flex items-start gap-3 md:col-span-2">
                  <IconInfo />
                  <div>
                    <h4 className="font-semibold text-slate-700">Identifying Marks</h4>
                    <ul className="list-disc list-inside text-slate-600">
                      {matchData.volunteer_report.found_child.birthmarks.map((mark, i) => (
                        <li key={i}>{mark}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* --- CONFIRM / REJECT BUTTONS (No changes needed) --- */}
          <div className="mt-16 text-center">

            {status === "pending" && (
              <>
                <h3 className="text-2xl font-bold text-slate-800 mb-6">
                  Is this your child?
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleReject}
                    className="flex-1 inline-flex justify-center items-center gap-2 bg-slate-700 text-white font-bold text-lg py-4 px-8 rounded-lg shadow-lg hover:bg-slate-800 transition-all transform hover:-translate-y-1"
                  >
                    <IconXClose className="h-5 w-5" />
                    No, this is not my child
                  </button>

                  <button
                    onClick={handleConfirm}
                    className="flex-1 inline-flex justify-center items-center gap-2 bg-green-600 text-white font-bold text-lg py-4 px-8 rounded-lg shadow-lg hover:bg-green-700 transition-all transform hover:-translate-y-1"
                  >
                    <IconCheck className="h-5 w-5" />
                    Yes, this is my child
                  </button>
                </div>
              </>
            )}

            {status === "confirmed" && (
              <div className="text-green-700 bg-gree.n-100 p-6 rounded-lg text-lg font-medium">
                Match confirmed! We will contact you shortly with next steps. Redirecting...
              </div>
            )}

            {status === "rejected" && (
              <div className="text-yellow-800 bg-yellow-100 p-6 rounded-lg text-lg font-medium">
                Thank you. We have marked this as incorrect and will continue searching. Redirecting...
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}