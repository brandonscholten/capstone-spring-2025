import React, { useState } from "react";
import RSVPModal from "./RSVPModal";
import CreateEventModal from "./CreateEventModal"; // Ensure this modal supports edit mode via props

// Helper function to parse a date string in "YYYYMMDDTHHmmssZ" format.
function parseEventDate(dateStr) {
  const formatted = dateStr.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
    "$1-$2-$3T$4:$5:$6Z"
  );
  return new Date(formatted);
}

// Helper function to add ordinal suffix to a day (1st, 2nd, 3rd, etc.)
function addOrdinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Formats the event start and end times into displayable date and time strings.
function formatEventDateTime(startTimeStr, endTimeStr) {
  const startDate = parseEventDate(startTimeStr);
  const endDate = parseEventDate(endTimeStr);

  // Format the date using short month and numeric day.
  const dateOptions = { month: "short", day: "numeric" };
  const startDateFormatted = startDate.toLocaleDateString("en-US", dateOptions);
  const endDateFormatted = endDate.toLocaleDateString("en-US", dateOptions);

  // If the dates are the same, use the start date only.
  // Otherwise, if within the same month, display like "Jan 16th-17th".
  // If in different months, show both full dates.
  let dateDisplay = startDateFormatted;
  if (startDateFormatted !== endDateFormatted) {
    if (startDate.getMonth() === endDate.getMonth()) {
      const monthStr = startDate.toLocaleString("en-US", { month: "short" });
      const startDay = startDate.getDate();
      const endDay = endDate.getDate();
      dateDisplay = `${monthStr} ${addOrdinalSuffix(startDay)}-${addOrdinalSuffix(endDay)}`;
    } else {
      dateDisplay = `${startDateFormatted} - ${endDateFormatted}`;
    }
  }

  // Format the time into something like "6pm - 9pm"
  const timeOptions = { hour: "numeric", minute: "numeric", hour12: true };
  let startTimeFormatted = startDate.toLocaleTimeString("en-US", timeOptions);
  let endTimeFormatted = endDate.toLocaleTimeString("en-US", timeOptions);

  // Remove the minutes if they are :00 and convert to lowercase.
  startTimeFormatted = startTimeFormatted.replace(":00", "").toLowerCase();
  endTimeFormatted = endTimeFormatted.replace(":00", "").toLowerCase();
  const timeDisplay = `${startTimeFormatted} - ${endTimeFormatted}`;

  return { dateDisplay, timeDisplay };
}

export default function EventCard({ event, isValid, resetEvents }) {
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [isRSVPModalOpen, setRSVPModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const handleMouseEnter = (eventId) => {
    const timeout = setTimeout(() => {
      setHoveredEvent(eventId);
    }, 250);
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout);
    setHoveredEvent(null);
  };

  // Get the formatted date and time for display.
  const { dateDisplay, timeDisplay } = formatEventDateTime(event.startTime, event.endTime);

  return (
    <>
      <div
        key={event.id}
        onMouseEnter={() => handleMouseEnter(event.id)}
        onMouseLeave={handleMouseLeave}
        className={`mx-auto relative transition-all duration-300 rounded-lg shadow-lg p-4 flex flex-col items-center overflow-hidden border border-gray-200 
          ${hoveredEvent === event.id ? "scale-105 transform" : "scale-95"}
          w-full sm:w-[80%] md:w-[60%] lg:w-[13vw]
        `}
      >
        {/* Edit icon (only if token is valid) */}
        {isValid && (
          <button
            className="absolute top-2 right-2 text-gray-600 hover:text-black"
            onClick={() => setEditModalOpen(true)}
            title="Edit Event"
          >
            ✏️
          </button>
        )}
        <img
          src={event.image}
          alt={event.title}
          className={`w-full object-contain rounded-lg transition-all duration-300 
            ${hoveredEvent === event.id ? "h-48" : "h-40"}
          `}
        />
        <div className="mt-4 text-center w-full">
          <h2 className="text-xl font-bold mb-2">{event.title}</h2>
          <p className="text-gray-700 font-semibold">Game: {event.game}</p>
          <p className="text-gray-700 font-semibold">Date: {dateDisplay}</p>
          <p className="text-gray-700 font-semibold">Time: {timeDisplay}</p>
          <p className="text-gray-700 font-semibold">Price: {event.price}</p>
          <p className="text-gray-500 text-sm mt-2">
            {hoveredEvent === event.id
              ? event.description
              : event.description.substring(0, 50) + "..."
            }
          </p>
          <button
            className="mt-4 px-4 py-2 bg-[#942E2A] text-white rounded hover:scale-105 transition-all"
            onClick={() => setRSVPModalOpen(true)}
          >
            RSVP
          </button>
        </div>
      </div>
      {isRSVPModalOpen && (
        <RSVPModal
          isOpen={isRSVPModalOpen}
          onClose={() => setRSVPModalOpen(false)}
          eventData={event}
          type={"event"}
          refresh={resetEvents}
        />
      )}
      {isEditModalOpen && (
        <CreateEventModal
          setIsModalOpen={setEditModalOpen}
          onClose={() => setEditModalOpen(false)}
          initialData={event}
          onSubmit={(updatedData) => {
                fetch(`http://localhost:5000/events/${updatedData.id}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedData),
                })
                .then((res) => res.json())
                .then(() => { resetEvents(); })
                .catch((error) => console.error("Error updating event:", error));
              setEditModalOpen(false);
              }}
              //FIX THIS IT"S INSECURE, ANYONE CAN HIT THE API WITHOUT NEEDING THE PASSWORD.
              onDelete={(eventId) => {
              fetch(`http://localhost:5000/events`, {
                method: "DELETE",
                headers: {
                "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: eventId }),
              })
                .then((res) => res.json())
                .then(() => { resetEvents(); })
                .catch((error) => console.error("Error deleting event:", error));
            setEditModalOpen(false);
          }}
        />
      )}
    </>
  );
}
