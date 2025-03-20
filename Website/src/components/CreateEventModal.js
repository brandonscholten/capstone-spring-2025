import React, { useState, useEffect } from "react";
import api from "../api/axiosClient";
// Helper function to parse a date string in "YYYYMMDDTHHmmssZ" format.
function parseEventDate(dateStr) {
  const formatted = dateStr.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
    "$1-$2-$3T$4:$5:$6Z"
  );
  return new Date(formatted);
}

// Helper to combine a date (YYYY-MM-DD) and time (HH:MM) into "YYYYMMDDTHHmmssZ" format.
// Seconds are defaulted to "00".
function combineDateTime(date, time) {
  // Remove dashes and colon, then append "00" for seconds.
  const datePart = date.replace(/-/g, ""); // e.g., "20250303"
  const timePart = time.replace(":", "") + "00"; // e.g., "190000"
  return `${datePart}T${timePart}Z`;
}

export default function CreateEventModal({ setIsModalOpen, initialData, onSubmit, onDelete }) {
  // Parse initial start and end times if available.
  const initialStartDate = initialData && initialData.startTime 
    ? parseEventDate(initialData.startTime).toISOString().slice(0, 10) 
    : "";
  const initialStartTime = initialData && initialData.startTime 
    ? parseEventDate(initialData.startTime).toISOString().slice(11, 16) 
    : "";
  const initialEndDate = initialData && initialData.endTime 
    ? parseEventDate(initialData.endTime).toISOString().slice(0, 10) 
    : "";
  const initialEndTime = initialData && initialData.endTime 
    ? parseEventDate(initialData.endTime).toISOString().slice(11, 16) 
    : "";

  // Controlled state for form fields.
  const [eventName, setEventName] = useState(initialData?.title || "");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [description, setDescription] = useState(initialData?.description || "");
  const [price, setPrice] = useState(initialData?.price || "");
  const [image, setImage] = useState(initialData?.image || "");
  
  // Flag to track if end date has been manually modified.
  const [hasEndDateBeenModified, setHasEndDateBeenModified] = useState(!!initialData?.endTime);

  // State for recurring event.
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);

  // State for "Game" auto-suggest.
  const [gameQuery, setGameQuery] = useState("");
  const [selectedGameId, setSelectedGameId] = useState(initialData?.game || null);
  const [catalogueItems, setCatalogueItems] = useState([]);
  const [gameSuggestions, setGameSuggestions] = useState([]);

  // Fetch catalogue items once when the modal mounts.
  useEffect(() => {
    api.get("/catalogue/titles")
      .then((response) => setCatalogueItems(response.data))
      .catch((error) => console.error("Error fetching catalogue:", error));
  }, []);
  

  // Update game suggestions whenever gameQuery or catalogueItems change.
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

  // Update state if initialData changes.
  useEffect(() => {
    if (initialData) {
      setEventName(initialData.title || "");
      setStartDate(initialStartDate);
      setEndDate(initialEndDate);
      setStartTime(initialStartTime);
      setEndTime(initialEndTime);
      setDescription(initialData.description || "");
      setPrice(initialData.price || "");
      setImage(initialData.image || "");
      setSelectedGameId(initialData.game || null);
      setIsRecurring(initialData.isRecurring || false);
    }
  }, [initialData, initialStartDate, initialEndDate, initialStartTime, initialEndTime]);

  // When the start date changes, auto-fill the end date if the user hasn't modified it.
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    if (!hasEndDateBeenModified) {
      setEndDate(newStartDate);
    }
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setHasEndDateBeenModified(true);
  };

  // Handle form submission.
  const handleSubmit = () => {
    // Combine the separate date and time inputs back into ISO format.
    const updatedStartTime = combineDateTime(startDate, startTime);
    const updatedEndTime = combineDateTime(endDate, endTime);

    // Construct the updated event object.
    const updatedEvent = {
      ...initialData, // In edit mode, include other fields from initialData if needed.
      title: eventName,
      startTime: updatedStartTime,
      endTime: updatedEndTime,
      description,
      price,
      image,
      recurring: isRecurring,
      game: selectedGameId, // store the selected catalogue id for the game.
      isRecurring, // recurring event flag.
    };

    if (onSubmit) {
      onSubmit(updatedEvent);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      if (onDelete) {
        onDelete(initialData.id);
      } else {
        console.log("Deleting event:", initialData);
      }
      setIsModalOpen(false);
    }
  };

  return (
    <div className="relative">
      <div 
        className="fixed inset-0 flex justify-center items-center z-50" 
        style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
        onClick={() => setIsModalOpen(false)}
      >
        <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] relative" onClick={(e) => e.stopPropagation()}>
          {/* Close Button */}
          <button 
            onClick={() => setIsModalOpen(false)} 
            className="absolute top-2 right-2 text-gray-600 hover:text-black"
          >
            ✕
          </button>

          <h2 className="text-2xl font-bold text-center mb-4">
            {initialData ? "Edit Event" : "Create Event"}
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Left Side Inputs */}
            <div>
              <label className="block mb-1 font-semibold">Event Name</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded" 
                value={eventName} 
                onChange={(e) => setEventName(e.target.value)}
              />

              <label className="block mt-2 mb-1 font-semibold">Start Date</label>
              <input 
                type="date" 
                className="w-full border p-2 rounded" 
                value={startDate} 
                onChange={handleStartDateChange}
              />

              <label className="block mt-2 mb-1 font-semibold">End Date</label>
              <input 
                type="date" 
                className="w-full border p-2 rounded" 
                value={endDate} 
                onChange={handleEndDateChange}
              />

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

              <label className="block mt-2 mb-1 font-semibold">Price</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded" 
                placeholder="Enter price (e.g., $10)" 
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />

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
            </div>

            {/* Right Side Inputs */}
            <div className="flex flex-col">
              <label className="block mb-1 font-semibold">Event Description</label>
              <textarea 
                className="w-full border p-2 rounded h-32" 
                placeholder="Enter event description..."
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>

              <label className="block mt-2 mb-1 font-semibold">Event Image URL</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded" 
                placeholder="Enter image URL"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />

              <label className="block mt-2 mb-1 font-semibold">Recurring Event</label>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={isRecurring} 
                  onChange={(e) => setIsRecurring(e.target.checked)} 
                  className="mr-2"
                />
                <span>Occurs every week</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            {initialData && (
              <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg"
              >
                Delete Event
              </button>
            )}
            <button 
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#3C574D] text-white rounded-lg"
            >
              Save Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
