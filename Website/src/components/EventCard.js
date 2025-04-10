import React, { useState, useRef, useEffect  } from "react";
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
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef(null);

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

  // Intersection Observer for card flip effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isFlipped) {
            // Add a small delay before flipping for a cascading effect
            setTimeout(() => {
              setIsFlipped(true);
            }, 100);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  // Get the formatted date and time for display.
  const { dateDisplay, timeDisplay } = formatEventDateTime(event.startTime, event.endTime);
  const index = event.id % 10; // Use modulo to limit the range
  const cardStyle = { '--delay': `${index * 0.15}s` };
  
  return (
    <>
			<div
		ref={cardRef}
		key={event.id}
		data-id={event.id}
		onMouseEnter={() => handleMouseEnter(event.id)}
		onMouseLeave={handleMouseLeave}
		className="container mx-auto relative hover-container"
		style={cardStyle}
		>
		<div className={`card ${isFlipped ? "flip" : ""}`}>
			{/* Front of card */}
			<div className="front rounded-lg shadow-lg p-4 flex flex-col items-center border border-gray-200 bg-white content-scale">
			<img
				src="/b&b_crest.png"
				alt="Bot N Bevy Crest"
				className="w-full h-full object-cover rounded-lg"
			/>
    </div>
				
				{/* Back of card */}
				<div className="back rounded-lg shadow-lg p-4 flex flex-col items-center border border-gray-200 bg-white content-scale">
					{/* Edit icon for admins */}
					{isValid && (
					<button
						className="absolute top-2 right-2 text-gray-600 hover:text-black"
						onClick={() => setEditModalOpen(true)}
						title="Edit Event"
					>
						✏️
					</button>
					)}
					{/* Event image */}
					{event.image && (
					<img
					src={event.image}
					alt={event.title}
					className="w-full h-40 object-contain rounded-lg transition-all duration-300"
				  	/>
					)}
					<div className="mt-4 text-center w-full">
					<h2 className="text-xl font-bold mb-2">{event.title}</h2>
					<p className="text-gray-700 font-semibold">Game: {event.game || 'N/A'}</p>
					<p className="text-gray-700 font-semibold">Date: {dateDisplay}</p>
					<p className="text-gray-700 font-semibold">Time: {timeDisplay}</p>
					<p className="text-gray-700 font-semibold">Price: {event.price}</p>
					<p className="text-gray-500 text-sm mt-2 h-16 overflow-y-auto p-1 border-gray-100 border-t border-b">
						{event.description}
					</p>
						<button
							className="mt-3 mb-2 px-4 py-2 bg-[#942E2A] text-white rounded hover:scale-105 transition-all group relative w-auto inline-block"
							onClick={() => setRSVPModalOpen(true)}
							>
							<span className="relative z-10">RSVP</span>
							<span className="absolute inset-0 bg-[#942E2A] rounded"></span>
							<span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#576b1e] via-[#8ea37e] via-[#bdcc7a] via-[#c4cad5] via-[#d7c2cb] to-[#f8aa68] bg-[length:200%_100%] group-hover:animate-gradient rounded"></span>
						</button>
					</div>
				</div>
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
