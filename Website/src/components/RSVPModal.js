import React, { useState } from "react";
import api from "../api/axiosClient";
// Helper to detect Apple devices.
function isAppleDevice() {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export default function RSVPModal({ isOpen, onClose, eventData, type, refresh}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  // Fixed location for all events.
  const LOCATION = "141 E Summit St, Kent, OH 44240";

  // Form submit handler that moves between steps or confirms RSVP.
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (name.trim()) {
        setStep(2);
      }
    } else if (step === 2) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const formData = { 
      id: eventData.id, 
      type: type,
      participant: name, 
    };

    console.log(formData)

    api.post("/participants/add", formData)
    .then(() => refresh()) // Re-fetch board games after successful post
    .catch((error) => console.error("Error creating event:", error));

    onClose(); // Optionally close the modal after submission.
  };

  // Construct a Google Calendar URL using event details with the fixed location.
  const handleAddToGoogleCalendar = () => {
    const formatForGoogleCalendar = (timeStr) => {
      const date = new Date(timeStr);
      const pad = (num) => (num < 10 ? "0" + num : num);
      return (
        date.getUTCFullYear().toString() +
        pad(date.getUTCMonth() + 1) +
        pad(date.getUTCDate()) +
        "T" +
        pad(date.getUTCHours()) +
        pad(date.getUTCMinutes()) +
        pad(date.getUTCSeconds()) +
        "Z"
      );
    };
    const start = formatForGoogleCalendar(eventData.startTime);
    const end = formatForGoogleCalendar(eventData.endTime);
  
    const text = encodeURIComponent(eventData.title);
    const details = encodeURIComponent(eventData.description || "");
    const location = encodeURIComponent(LOCATION);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`;
    
    window.open(url, "_blank");
  };
  

  // Generate and download an ICS file for Apple Calendar using the fixed location.
  const handleDownloadICS = () => {
    const icsContent = `
      BEGIN:VCALENDAR
      VERSION:2.0
      BEGIN:VEVENT
      SUMMARY:${eventData.title}
      DESCRIPTION:${eventData.description}
      LOCATION:${LOCATION}
      DTSTART:${eventData.startTime}
      DTEND:${eventData.endTime}
      END:VEVENT
      END:VCALENDAR
          `.trim();

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "event.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 w-96"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal.
      >
        <form onSubmit={handleFormSubmit}>
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                RSVP for {eventData?.title || "the event"}
              </h2>
              <div className="mb-4">
                <label className="block text-gray-700">Name *</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">
                  Email or Discord Username (optional)
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="example@example.com or Discord#1234"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-[#942E2A] text-white px-4 py-2 rounded disabled:opacity-50"
                  disabled={!name.trim()}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Confirm Your RSVP</h2>
              <p className="mb-2">
                <span className="font-semibold">Event:</span> {eventData.title}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Name:</span> {name}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Email/Discord:</span>{" "}
                {contact || "Not provided"}
              </p>
              {/* Calendar Integration Options */}
              <div className="flex flex-col gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleAddToGoogleCalendar}
                  className="bg-[#3C574D] text-white px-4 py-2 rounded"
                >
                  Add to Google Calendar
                </button>
                {isAppleDevice() && (
                  <button
                    type="button"
                    onClick={handleDownloadICS}
                    className="bg-[#3C574D] text-white px-4 py-2 rounded"
                  >
                    Add to Apple Calendar
                  </button>
                )}
              </div>
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="bg-[#942E2A] text-white px-4 py-2 rounded"
                >
                  Confirm RSVP
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
