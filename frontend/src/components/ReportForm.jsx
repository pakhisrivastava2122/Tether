/*
  This file is being corrected. The `reporter` state definition
  was missing in the previous update.
*/
import React, { useState } from "react";
// FIX: Adding the .jsx extension to the import path
import {
  IconUser,
  IconMail,
  IconMapPin,
  IconPlus,
  IconX,
  IconUpload
} from "./icons/Icons.jsx";

// FIX: Added `authToken` prop
export default function ReportForm({ onMatchFound, authToken }) {
  const [role, setRole] = useState("parent");

  // Reporter Info
  // FIX: Adding back the state definition
  const [reporter, setReporter] = useState({
    name: "",
    email: "",
    altEmail: "",
    phone: "",
    altPhone: ""
  });

  // Child Info
  // FIX: Adding back the state definition
  const [child, setChild] = useState({
    name: "",
    age: "",
    skin: "",
    city: "",
    address: ""
  });

  // FIX: Adding back the state definitions
  const [birthMarks, setBirthMarks] = useState([""]);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleReporter = (key, val) =>
    setReporter({ ...reporter, [key]: val });

  const handleChild = (key, val) =>
    setChild({ ...child, [key]: val });

  const handleAddBirthmark = () => setBirthMarks([...birthMarks, ""]);
  const handleRemoveBirthmark = (i) =>
    setBirthMarks(birthMarks.filter((_, idx) => idx !== i));
  const handleBirthmarkChange = (i, val) =>
    setBirthMarks(birthMarks.map((b, idx) => (idx === i ? val : b)));

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      // Create a local preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhoto(null);
      setPreview(null);
    }
  };
  
  const clearForm = () => {
     setRole("parent");
     setReporter({ name: "", email: "", altEmail: "", phone: "", altPhone: "" });
     setChild({ name: "", age: "", skin: "", city: "", address: "" });
     setBirthMarks([""]);
     setPhoto(null);
     setPreview(null);
  }

  // ===========================
  // SUBMIT TO BACKEND
  // ===========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) {
      setErrorMessage("A photo is required.");
      return;
    }
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    const form = new FormData();

    form.append("role", role);

    // reporter
    form.append("reporter_name", reporter.name);
    form.append("reporter_email", reporter.email);
    form.append("reporter_alt_email", reporter.altEmail);
    form.append("reporter_phone", reporter.phone);
    form.append("reporter_alt_phone", reporter.altPhone);

    // child
    form.append("child_name", child.name);
    form.append("child_age", child.age);
    form.append("skin_complexion", child.skin);
    form.append("city", child.city);

    if (role === "volunteer") {
      form.append("address", child.address);
    } else {
      form.append("address", "");
    }

    // birthmarks (filter out empty strings)
    form.append("birthmarks", JSON.stringify(birthMarks.filter(b => b.trim() !== "")));

    // file
    form.append("file", photo);

    try {
      // Use port 8000 for the FastAPI backend
      const res = await fetch("http://127.0.0.1:8000/api/report", {
        method: "POST",
        // FIX: Add Authorization header
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: form
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "An error occurred during submission.");
      }

      const data = await res.json();
      console.log("REPORT API RESPONSE →", data);

      if (data.match_found) {
        // A match was found! Call the function from App.jsx
        // This will trigger the page switch.
        setSuccessMessage("Match found! Loading details...");
        // FIX: Ensure onMatchFound is called
        if (typeof onMatchFound === 'function') {
          setTimeout(() => onMatchFound(data.submission_id), 1500);
        } else {
          console.error("onMatchFound is not a function prop", onMatchFound);
        }
        clearForm();
      } else {
        // No match, just show a success message
        setSuccessMessage("Report submitted successfully. We will notify you if a match is found.");
        clearForm();
      }
    } catch (e) {
      console.error("UPLOAD ERROR", e);
      setErrorMessage(`Upload failed: ${e.message}`);
    }

    setLoading(false);
  };

  const roleBtn = (r) => (
    `w-1/2 py-3 rounded-lg font-semibold transition-all ${
      role === r
        ? "bg-cyan-600 text-white shadow"
        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
    }`
  );

  const inputBox =
    "w-full pl-10 pr-3 py-3 border rounded-lg border-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none transition-all";

  const labelClass = "text-sm font-medium text-slate-700 mb-2 block";

  return (
    <section id="report-form" className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-lg border">
        <h2 className="text-3xl font-bold text-center mb-2 text-slate-800">
          Tether - Report
        </h2>
        
        <p className="text-center text-slate-600 mb-8">
          {role === 'parent' 
            ? 'Report your missing child.' 
            : 'Report a child you have found.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ROLE BUTTONS */}
          <div className="flex bg-slate-100 p-1 rounded-lg mb-8">
            <button type="button" className={roleBtn("parent")} onClick={() => setRole("parent")}>
              I'm a Parent
            </button>
            <button type="button" className={roleBtn("volunteer")} onClick={() => setRole("volunteer")}>
              I'm a Volunteer
            </button>
          </div>

          {/* REPORTER INFO */}
          <fieldset className="border border-slate-200 p-4 rounded-lg">
            <legend className="text-lg font-semibold px-2 text-slate-800">Your Information</legend>
            <div className="grid sm:grid-cols-2 gap-4 pt-4">

              {/* Name */}
              <div>
                <label className={labelClass} htmlFor="rep_name">Name*</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconUser /></span>
                  <input id="rep_name" className={inputBox} required
                        value={reporter.name}
                        onChange={(e) => handleReporter("name", e.target.value)}
                        placeholder="Your name" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={labelClass} htmlFor="rep_email">Email*</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconMail /></span>
                  <input id="rep_email" type="email" className={inputBox}
                        value={reporter.email}
                        onChange={(e) => handleReporter("email", e.target.value)}
                        required
                        placeholder="Email" />
                </div>
              </div>

              {/* Alt Email */}
              <div>
                <label className={labelClass} htmlFor="rep_alt_email">Alternate Email</label>
                <input id="rep_alt_email" type="email" className={inputBox + " pl-4"}
                        value={reporter.altEmail}
                        onChange={(e) => handleReporter("altEmail", e.target.value)}
                        placeholder="Optional backup email" />
              </div>

              {/* Phone */}
              <div>
                <label className={labelClass} htmlFor="rep_phone">Phone*</label>
                <input id="rep_phone" type="tel" className={inputBox + " pl-4"}
                        value={reporter.phone}
                        required
                        onChange={(e) => handleReporter("phone", e.target.value)}
                        placeholder="Your phone number" />
              </div>
              
              {/* Alt Phone */}
              <div>
                <label className={labelClass} htmlFor="rep_alt_phone">Alt Phone</label>
                <input id="rep_alt_phone" type="tel" className={inputBox + " pl-4"}
                       value={reporter.altPhone}
                       onChange={(e) => handleReporter("altPhone", e.target.value)} />
              </div>

            </div>
          </fieldset>
          

          {/* CHILD INFO */}
          <fieldset className="border border-slate-200 p-4 rounded-lg">
            <legend className="text-lg font-semibold px-2 text-slate-800">
              {role === 'parent' ? 'Lost Child Information' : 'Found Child Information'}
            </legend>
            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              <div>
                <label className={labelClass} htmlFor="child_name">Child Name*</label>
                <input id="child_name" className={inputBox + " pl-4"} required
                      value={child.name}
                      onChange={(e) => handleChild("name", e.target.value)} 
                      placeholder={role === 'parent' ? "Your child's name" : "Name (if known)"}
                      />
              </div>

              <div>
                <label className={labelClass} htmlFor="child_age">Age* (Approximate)</label>
                <input id="child_age" type="number" className={inputBox + " pl-4"} required
                      value={child.age}
                      onChange={(e) => handleChild("age", e.target.value)} 
                      placeholder="e.g., 5"
                      />
              </div>

              <div>
                <label className={labelClass} htmlFor="child_skin">Skin Complexion*</label>
                <select id="child_skin" className={inputBox + " pl-4"} required
                        value={child.skin}
                        onChange={(e) => handleChild("skin", e.target.value)}>
                  <option value="">Select...</option>
                  <option value="Pale">Pale</option>
                  <option value="Fair">Fair</option>
                  <option value="Medium">Medium</option>
                  <option value="Dark">Dark</option>
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="child_city">City*</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconMapPin /></span>
                  <input id="child_city" className={inputBox} required
                        placeholder={role === 'parent' ? "City last seen" : "City found"}
                        value={child.city}
                        onChange={(e) => handleChild("city", e.target.value)} />
                </div>
              </div>

              {role === "volunteer" && (
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="child_addr">Address Found*</label>
                  <input id="child_addr" className={inputBox + " pl-4"} required
                        placeholder="Exact place found (e.g., 'Main St. Park')"
                        value={child.address}
                        onChange={(e) => handleChild("address", e.target.value)} />
                </div>
              )}
            </div>
          </fieldset>


          {/* BIRTHMARKS */}
          <div>
            <label className={labelClass}>Birthmarks / Identifying Marks</label>

            {birthMarks.map((b, i) => (
              <div key={i} className="flex items-center mb-2">
                <input
                  className={inputBox + " pl-4"}
                  value={b}
                  placeholder="e.g. Mole on right cheek"
                  onChange={(e) => handleBirthmarkChange(i, e.target.value)}
                />
                {birthMarks.length > 1 && (
                  <button type="button" className="ml-3 p-1 rounded-full hover:bg-slate-100" onClick={() => handleRemoveBirthmark(i)}>
                    <IconX />
                  </button>
                )}
              </div>
            ))}

            <button type="button" className="text-cyan-600 flex items-center mt-2 font-medium hover:text-cyan-700"
                    onClick={handleAddBirthmark}>
              <IconPlus /> Add Birthmark
            </button>
          </div>

          {/* IMAGE UPLOAD */}
          <div>
            <label className={labelClass}>Child Photo* (Clear, front-facing preferred)</label>
            <div className="border-2 border-dashed border-slate-300 p-6 rounded-xl text-center flex flex-col items-center">
              <IconUpload />
              <input type="file" required accept="image/jpeg, image/png" className="mt-4 block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-cyan-50 file:text-cyan-700
                hover:file:bg-cyan-100"
                    onChange={handlePhotoChange} />
              <p className="text-xs text-slate-500 mt-2">PNG or JPG</p>
              {preview && (
                <img src={preview} alt="preview"
                    className="mt-4 max-h-48 rounded-lg shadow-md" />
              )}
            </div>
          </div>

          {/* --- Messages --- */}
          {successMessage && (
            <div className="text-center p-4 rounded-lg bg-green-100 text-green-700">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="text-center p-4 rounded-lg bg-red-100 text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-lg bg-cyan-600 text-white font-bold text-lg hover:bg-cyan-700 transition-all shadow-md hover:shadow-lg disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </section>
  );
}