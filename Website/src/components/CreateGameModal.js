import { useState, useEffect } from "react";
import api from "../api/axiosClient";

// Parse a date string in "YYYYMMDDTHHmmssZ" format.
function parseEventDate(dateStr) {
  const formatted = dateStr.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
    "$1-$2-$3T$4:$5:$6Z"
  );
  return new Date(formatted);
}

// Combine a date (YYYY-MM-DD) and time (HH:MM) into "YYYYMMDDTHHmmssZ" format.
function combineDateTime(date, time) {
  const datePart = date.replace(/-/g, "");
  const timePart = time.replace(":", "") + "00";
  return `${datePart}T${timePart}Z`;
}

// Convert time string to total minutes.
function timeToMinutes(time24) {
  const [hours, minutes] = time24.split(":").map(Number);
  return hours * 60 + minutes;
}

export default function CreateGameModal({ setIsModalOpen, initialData, onSubmit, onDelete }) {
  const initialStartDate = initialData?.startTime 
    ? parseEventDate(initialData.startTime).toISOString().slice(0, 10) 
    : "";
  const initialStartTime = initialData?.startTime 
    ? parseEventDate(initialData.startTime).toISOString().slice(11, 16) 
    : "";
  const initialEndTime = initialData?.endTime 
    ? parseEventDate(initialData.endTime).toISOString().slice(11, 16) 
    : "";

  const [gameName, setGameName] = useState(initialData?.title || "");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [numPlayers, setNumPlayers] = useState(initialData?.players || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [organizer, setOrganizer] = useState(initialData?.organizer || "");
  const [password, setPassword] = useState('');
  
  const [gameQuery, setGameQuery] = useState("");
  const [selectedGameId, setSelectedGameId] = useState(initialData?.game || null);
  const [catalogueItems, setCatalogueItems] = useState([]);
  const [gameSuggestions, setGameSuggestions] = useState([]);
  const [dateError, setDateError] = useState(null);
  const [timeError, setTimeError] = useState(null);

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
    if (startTime && endTime) {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
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
    if (day >= 3 && day <= 6) {
      setStartDate(date);
      setDateError(null);
    } else {
      setDateError("Select Wednesday, Thursday, Friday, or Saturday.");
    }
  };

  const handleSubmit = () => {
    if (dateError || timeError) return;

    const updatedStartTime = combineDateTime(startDate, startTime);
    const updatedEndTime = combineDateTime(startDate, endTime);

    const updatedGame = {
      ...initialData,
      title: gameName,
      startTime: updatedStartTime,
      endTime: updatedEndTime,
      organizer,
      players: numPlayers,
      description,
      password,
      catalogue: selectedGameId,
    };

    if (Number(numPlayers) >= 10) {
      setPendingGameData(updatedGame);
      setShowBookingPopup(true);
    } else {
      onSubmit?.(updatedGame);
      setIsModalOpen(false);
    }
  };

  const handleBookingConfirm = async () => {
    if (!bookingEmail || !bookingOption) {
      alert("Please select room type and enter your email.");
      return;
    }

    const gameWithBooking = {
      ...pendingGameData,
      halfPrivateRoom: bookingOption,
      email: bookingEmail,
      firstLastName: organizer,
    };

    try {
      await api.post("/games_with_room", gameWithBooking);
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
              <label className="block mt-2 mb-1 font-semibold">Game (from Catalogue)</label>
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

              <label className="block mt-2 mb-1 font-semibold">Organizer</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
              />

              <label className="block mt-2 mb-1 font-semibold">Date</label>
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={startDate}
                onChange={handleStartDateChange}
              />
              {dateError && <p className="text-red-500 text-sm">{dateError}</p>}

              <label className="block mt-2 mb-1 font-semibold">Start Time</label>
              <input
                type="time"
                className="w-full border p-2 rounded"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />

              <label className="block mt-2 mb-1 font-semibold">End Time</label>
              <input
                type="time"
                className="w-full border p-2 rounded"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
              {timeError && <p className="text-red-500 text-sm">{timeError}</p>}
            </div>

            <div>
              <label className="block mb-1 font-semibold">Number of Players (Max Number)</label>
              <input
                type="number"
                min="1"
                className="w-full border p-2 rounded"
                value={numPlayers}
                onChange={(e) => setNumPlayers(e.target.value)}
              />
              {Number(numPlayers) >= 10 && (
                <p className="text-sm text-blue-600 mt-1">
                  Note: Parties over 10 players require room booking.
                </p>
              )}
              <label className="block mb-1 font-semibold">Game Description</label>
              <textarea
                className="w-full border p-2 rounded h-32"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>

              <label className="block mb-1 font-semibold">Game Password</label>
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
              Parties with 10+ players require booking. Please choose a room and enter your email.
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
