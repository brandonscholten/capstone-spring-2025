import React, { useState } from "react";
import ReactDOM from "react-dom";
import api from "../api/axiosClient";

// Helper to detect Apple devices.
function isAppleDevice() {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export default function RSVPModal({ isOpen, onClose, eventData, type, refresh }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  // Fixed location for all events.
  const LOCATION = "141 E Summit St, Kent, OH 44240";

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (name.trim()) setStep(2);
    } else {
      // step 2 → final submit
      const formData = {
        id: eventData.id,
        type,
        participant: name,
      };
      api.post("/participants/add", formData)
        .then(() => refresh())
        .catch((err) => console.error(err));
      onClose();
    }
  };

  // Google Calendar link builder
  const handleAddToGoogleCalendar = () => {
    const fmt = (t) => {
      const d = new Date(t);
      const p = (n) => (n<10?"0":"") + n;
      return (
        "" +
        d.getUTCFullYear() +
        p(d.getUTCMonth()+1) +
        p(d.getUTCDate()) +
        "T" +
        p(d.getUTCHours()) +
        p(d.getUTCMinutes()) +
        p(d.getUTCSeconds()) +
        "Z"
      );
    };
    const start = fmt(eventData.startTime),
          end   = fmt(eventData.endTime),
          text  = encodeURIComponent(eventData.title),
          desc  = encodeURIComponent(eventData.description||""),
          loc   = encodeURIComponent(LOCATION),
          url   = 
            `https://calendar.google.com/calendar/render` +
            `?action=TEMPLATE&text=${text}` +
            `&dates=${start}/${end}` +
            `&details=${desc}` +
            `&location=${loc}`;
    window.open(url, "_blank");
  };

  // Apple .ics download
  const handleDownloadICS = () => {
    const content = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${eventData.title}`,
      `DESCRIPTION:${eventData.description}`,
      `LOCATION:${LOCATION}`,
      `DTSTART:${eventData.startTime}`,
      `DTEND:${eventData.endTime}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([content], { type: "text/calendar" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "event.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black z-50"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleFormSubmit}>
            {step === 1 && (
              <>
                <h2 className="text-xl font-bold mb-4">
                  RSVP for {eventData?.title || "the event"}
                </h2>
                <label className="block mb-1">Name *</label>
                <input
                  type="text"
                  className="w-full mb-4 border rounded p-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                />
                <label className="block mb-1">Email or Discord (opt.)</label>
                <input
                  type="text"
                  className="w-full mb-4 border rounded p-2"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="example@example.com or Discord#1234"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#942E2A] text-white px-4 py-2 rounded disabled:opacity-50"
                    disabled={!name.trim()}
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-xl font-bold mb-4">Confirm Your RSVP</h2>
                <p className="mb-2">
                  <strong>Event:</strong> {eventData.title}
                </p>
                <p className="mb-2">
                  <strong>Name:</strong> {name}
                </p>
                <p className="mb-2">
                  <strong>Contact:</strong> {contact || "Not provided"}
                </p>

                <div className="flex flex-col gap-2 my-4">
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

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="bg-gray-300 px-4 py-2 rounded"
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
              </>
            )}
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}
