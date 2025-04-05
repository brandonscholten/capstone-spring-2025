import { useState, useEffect } from "react";
import api from "../api/axiosClient";

// Helper function to parse a date string in "YYYYMMDDTHHmmssZ" format.
function parseEventDate(dateStr) {
  const formatted = dateStr.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
    "$1-$2-$3T$4:$5:$6Z"
  );
  return new Date(formatted);
}

// Helper to convert 24h time ("HH:MM") to 12h time (e.g. "4:00 PM").
function convertTo12Hour(time24) {
  const [hourStr, minute] = time24.split(":");
  let hours = parseInt(hourStr, 10);
  const period = hours >= 12 ? "PM" : "AM";
  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }
  return `${hours}:${minute} ${period}`;
}

// Helper to convert 12h time (e.g. "4:00 PM") to 24h time ("HH:MM").
function convertTo24Hour(time12) {
  const [time, modifier] = time12.split(" ");
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours, 10);
  if (modifier === "PM" && hours !== 12) {
    hours += 12;
  }
  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

// Helper to convert a time string ("HH:MM") to total minutes.
function timeToMinutes(time24) {
  const [hours, minutes] = time24.split(":").map(Number);
  return hours * 60 + minutes;
}

// Helper to combine a date (YYYY-MM-DD) and time (HH:MM) into "YYYYMMDDTHHmmssZ" format.
function combineDateTime(date, time) {
  const datePart = date.replace(/-/g, "");
  const timePart = time.replace(":", "") + "00";
  return `${datePart}T${timePart}Z`;
}

// Helper to generate allowed times (15min intervals) based on selected date, formatted in 12h style.
function getAllowedTimes(dateStr) {
  if (!dateStr) return [];
  const dateObj = new Date(dateStr);
  const day = dateObj.getDay(); // Sunday = 0, Monday = 1, etc.
  let startHour;
  // Wed (3), Thu (4), Fri (5): start at 16:00; Sat (6): start at 12:00.
  if (day === 3 || day === 4 || day === 5) {
    startHour = 16;
  } else if (day === 6) {
    startHour = 12;
  } else {
    return []; // not an allowed day
  }
  const times = [];
  for (let hour = startHour; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hour12 = hour % 12 === 0 ? 12 : hour % 12;
      const period = hour >= 12 ? "PM" : "AM";
      const mm = minute.toString().padStart(2, "0");
      times.push(`${hour12}:${mm} ${period}`);
    }
  }
  return times;
}

export default function CreateGameModal({ setIsModalOpen, initialData, onSubmit, onDelete }) {
  const initialStartDate = initialData?.startTime 
    ? parseEventDate(initialData.startTime).toISOString().slice(0, 10) 
    : "";
  const initialStartTime24 = initialData?.startTime 
    ? parseEventDate(initialData.startTime).toISOString().slice(11, 16) 
    : "";
  const initialStartTime = initialStartTime24 ? convertTo12Hour(initialStartTime24) : "";
  const initialEndTime24 = initialData?.endTime 
    ? parseEventDate(initialData.endTime).toISOString().slice(11, 16) 
    : "";
  const initialEndTime = initialEndTime24 ? convertTo12Hour(initialEndTime24) : "";

  const [gameName, setGameName] = useState(initialData?.title || "");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [numPlayers, setNumPlayers] = useState(initialData?.players || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [gameImage, setGameImage] = useState(initialData?.image || "");
  const [organizer, setOrganizer] = useState(initialData?.organizer || "");
  const [password, setPassword] = useState('');
  
  // For "Game" auto-suggest.
  const [gameQuery, setGameQuery] = useState("");
  const [selectedGameId, setSelectedGameId] = useState(initialData?.game || null);
  const [catalogueItems, setCatalogueItems] = useState([]);
  const [gameSuggestions, setGameSuggestions] = useState([]);
  const [dateError, setDateError] = useState(null);
  const [timeError, setTimeError] = useState(null);

  // New state for room booking popup.
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingOption, setBookingOption] = useState(""); // "half" or "full"
  const [pendingGameData, setPendingGameData] = useState(null);

  useEffect(() => {
    api.get("/catalogue/titles")
      .then((response) => setCatalogueItems(response.data))
      .catch((error) => console.error("Error fetching catalogue:", error));
  }, []);
  
  useEffect(() => {
    if (gameQuery.trim() === "") {
      setGameSuggestions([]);
    } else {
      const suggestions = catalogueItems.filter((item) =>
        item.title.toLowerCase().includes(gameQuery.toLowerCase())
      );
      setGameSuggestions(suggestions);
    }
  }, [gameQuery, catalogueItems]);

  useEffect(() => {
    if (initialData) {
      setGameName(initialData.title || "");
      const parsedStart = initialData.startTime ? parseEventDate(initialData.startTime) : null;
      if (parsedStart) {
        const isoDate = parsedStart.toISOString();
        setStartDate(isoDate.slice(0, 10));
        setStartTime(convertTo12Hour(isoDate.slice(11, 16)));
      }
      if (initialData.endTime) {
        const parsedEnd = parseEventDate(initialData.endTime);
        setEndTime(convertTo12Hour(parsedEnd.toISOString().slice(11, 16)));
      }
      setNumPlayers(initialData.players || "");
      setDescription(initialData.description || "");
      setGameImage(initialData.image || "");
      setOrganizer(initialData.organizer || "");
      setSelectedGameId(initialData.game || null);
    }
  }, [initialData]);

  // Update allowed times based on the selected date.
  const allowedTimes = getAllowedTimes(startDate);

  // Validate the selected times: end time must be after start time.
  useEffect(() => {
    if (startTime && endTime) {
      const start24 = convertTo24Hour(startTime);
      const end24 = convertTo24Hour(endTime);
      const startMinutes = timeToMinutes(start24);
      const endMinutes = timeToMinutes(end24);
      if (endMinutes <= startMinutes) {
        setTimeError("End time must be after the start time.");
      } else {
        setTimeError(null);
      }
    }
  }, [startTime, endTime]);

  const handleStartDateChange = (e) => {
    const date = e.target.value;
    const d = new Date(date);
    const day = d.getDay();
    // Allow only Wed (3), Thu (4), Fri (5), or Sat (6).
    if (day === 3 || day === 4 || day === 5 || day === 6) {
      setStartDate(date);
      setDateError(null);
      const newAllowed = getAllowedTimes(date);
      if (!newAllowed.includes(startTime)) {
        setStartTime(newAllowed[0] || "");
      }
      if (!newAllowed.includes(endTime)) {
        setEndTime(newAllowed[0] || "");
      }
    } else {
      setDateError("Selected day is not available. Please select a Wednesday, Thursday, Friday, or Saturday.");
    }
  };

  const handleSubmit = () => {
    if (dateError || timeError) return; // Prevent submission if there is an error.

    // Convert the 12h time values back to 24h for the API.
    const updatedStartTime = combineDateTime(startDate, convertTo24Hour(startTime));
    const updatedEndTime = combineDateTime(startDate, convertTo24Hour(endTime));

    const updatedGame = {
      ...initialData,
      title: gameName,
      startTime: updatedStartTime,
      endTime: updatedEndTime,
      organizer: organizer,
      players: numPlayers,
      description: description,
      password: password,
      catalogue: selectedGameId,
    };

    // If 10 or more players, show the booking popup instead of normal submission.
    if (Number(numPlayers) >= 10) {
      setPendingGameData(updatedGame);
      setShowBookingPopup(true);
      return;
    } else {
      // Otherwise, call the normal onSubmit route.
      if (onSubmit) {
        onSubmit(updatedGame);
      }
      setIsModalOpen(false);
    }
  };

  // Handle booking confirmation by sending data to a different API route.
  const handleBookingConfirm = async () => {
    if (!bookingEmail || !bookingOption) {
      alert("Please select a room type and enter your email address.");
      return;
    }
    
    const gameWithBooking = {
      ...pendingGameData,
      halfPrivateRoom: bookingOption, // "half" or "full"
      email: bookingEmail,
      firstLastName: organizer, // Assuming organizer is the name of the person booking
      };

    try {
      // Send to a different API route for games requiring room booking.
      await api.post("/games_with_room", gameWithBooking);
      // Optionally, you can show a success message here.
    } catch (error) {
      console.error("Error creating game with booking", error);
    }
    setShowBookingPopup(false);
    setIsModalOpen(false);
  };

  return (
    <div className="relative">
      <div
        className="fixed inset-0 flex justify-center items-center z-50"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
        onClick={() => setIsModalOpen(false)}
      >
        <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-2 right-2 text-gray-600 hover:text-black"
          >
            ✕
          </button>
          <h2 className="text-2xl font-bold text-center mb-4">
            {initialData ? "Edit Game" : "Create Game"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mt-2 mb-1 font-semibold">
                Game (from Catalogue)
              </label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Type to search game..."
                value={gameQuery}
                onChange={(e) => {
                  setGameQuery(e.target.value);
                  setSelectedGameId(null);
                }}
              />
              {gameSuggestions.length > 0 && (
                <ul className="border border-gray-300 mt-1 max-h-32 overflow-y-auto">
                  {gameSuggestions.map((item) => (
                    <li
                      key={item.id}
                      className="p-2 hover:bg-gray-200 cursor-pointer"
                      onClick={() => {
                        setGameQuery(item.title);
                        setSelectedGameId(item.id);
                        setTimeout(() => setGameSuggestions([]), 100);
                      }}
                    >
                      {item.title}
                    </li>
                  ))}
                </ul>
              )}
              <label className="block mt-2 mb-1 font-semibold">
                Organizer
              </label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
              />
              <label className="block mt-2 mb-1 font-semibold">
                Date (Weds, Thurs, Fri, or Sat)
              </label>
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={startDate}
                onChange={handleStartDateChange}
              />
              {dateError && (
                <p className="text-red-500 text-sm">{dateError}</p>
              )}
              <label className="block mt-2 mb-1 font-semibold">
                Start Time
              </label>
              {allowedTimes.length > 0 ? (
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  {allowedTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-500">
                  Select a valid date to choose times.
                </p>
              )}
              <label className="block mt-2 mb-1 font-semibold">
                End Time
              </label>
              {allowedTimes.length > 0 ? (
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  {allowedTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-500">
                  Select a valid date to choose times.
                </p>
              )}
              {timeError && (
                <p className="text-red-500 text-sm mt-1">{timeError}</p>
              )}
            </div>
            <div>
              <label className="block mb-1 font-semibold">
                Number of Players
              </label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={numPlayers}
                onChange={(e) => setNumPlayers(e.target.value)}
              />
              {Number(numPlayers) >= 10 && (
                <p className="text-sm text-blue-600 mt-1">
                  Note: Parties over 10 players require booking a room.
                </p>
              )}
              <label className="block mb-1 font-semibold">
                Game Description
              </label>
              <textarea
                className="w-full border p-2 rounded h-32"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
              <label className="block mb-1 font-semibold">
                Game Password
              </label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Optional password for editing"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="text-right mt-4 flex justify-end gap-2">
            {initialData && (
              <button
                onClick={() => onDelete(initialData.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg"
              >
                Delete Game
              </button>
            )}
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#3C574D] text-white rounded-lg"
            >
              Save Game
            </button>
          </div>
        </div>
      </div>

      {/* Booking Popup Modal for Parties of 10 or More */}
      {showBookingPopup && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
          onClick={() => setShowBookingPopup(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-[400px] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Room Booking Required</h3>
            <p className="mb-2">
              Parties with 10 or more players require booking a room. Please choose whether you'd like to book a half room or a full room. Once you confirm, a request will be sent and you'll receive an email with booking details and confirmation.
            </p>
            <div className="mb-4">
              <label className="mr-4">
                <input
                  type="radio"
                  name="roomType"
                  value="half"
                  checked={bookingOption === "half"}
                  onChange={(e) => setBookingOption(e.target.value)}
                />{" "}
                Half Room
              </label>
              <label>
                <input
                  type="radio"
                  name="roomType"
                  value="full"
                  checked={bookingOption === "full"}
                  onChange={(e) => setBookingOption(e.target.value)}
                />{" "}
                Full Room
              </label>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold">Email Address</label>
              <input
                type="email"
                className="w-full border p-2 rounded"
                placeholder="Enter your email"
                value={bookingEmail}
                onChange={(e) => setBookingEmail(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBookingPopup(false)}
                className="px-4 py-2 bg-gray-300 text-black rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBookingConfirm}
                className="px-4 py-2 bg-[#3C574D] text-white rounded-lg"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
