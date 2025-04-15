import React, { useState, useEffect } from "react";
import api from "../api/axiosClient";

// Helper to combine local date (YYYY-MM-DD) and time (HH:MM) into a UTC ISO string.
function combineDateTime(date, time) {
  // Construct a local Date object from separate date and time fields.
  const localDateTime = new Date(`${date}T${time}:00`);
  // Convert the local Date to a standard ISO string (UTC)
  return localDateTime.toISOString();
}

export default function CreateEventModal({ setIsModalOpen, initialData, onSubmit, onDelete }) {
  // Convert stored UTC times to the user's local date/time strings.
  const initialStartDate = initialData && initialData.startTime 
    ? new Date(initialData.startTime).toLocaleDateString("en-CA")
    : "";
  const initialStartTime = initialData && initialData.startTime 
    ? new Date(initialData.startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";
  const initialEndDate = initialData && initialData.endTime 
    ? new Date(initialData.endTime).toLocaleDateString("en-CA")
    : "";
  const initialEndTime = initialData && initialData.endTime 
    ? new Date(initialData.endTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

  // State for form fields.
  const [eventName, setEventName] = useState(initialData?.title || "");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [description, setDescription] = useState(initialData?.description || "");
  const [price, setPrice] = useState(initialData?.price || "");
  const [image, setImage] = useState(initialData?.image || "");
  const [imageFile, setImageFile] = useState(null);
  
  // Flag for auto-filling the end date if not manually changed.
  const [hasEndDateBeenModified, setHasEndDateBeenModified] = useState(!!initialData?.endTime);
  
  // State for recurring events.
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
  
  // State for game suggestions.
  const [gameQuery, setGameQuery] = useState("");
  const [selectedGameId, setSelectedGameId] = useState(initialData?.game || null);
  const [catalogueItems, setCatalogueItems] = useState([]);
  const [gameSuggestions, setGameSuggestions] = useState([]);

  // Fetch catalogue items on mount.
  useEffect(() => {
    api.get("/catalogue/titles")
      .then((response) => setCatalogueItems(response.data))
      .catch((error) => console.error("Error fetching catalogue:", error));
  }, []);

  // Update game suggestions when gameQuery changes.
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

  // Auto-fill end date if not modified.
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

  // Handle file selection for image uploads.
  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      // Optionally clear existing image URL if a new image is selected.
      setImage("");
    }
  };

  // Convert a file to base64.
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Handle form submission.
  const handleSubmit = async () => {
    // Combine inputs into proper UTC times.
    const updatedStartTime = combineDateTime(startDate, startTime);
    const updatedEndTime = combineDateTime(endDate, endTime);

    let imageData = image;
    if (imageFile) {
      try {
        imageData = await fileToBase64(imageFile);
      } catch (err) {
        console.error("Error converting file to base64:", err);
      }
    }

    // Construct the updated event object.
    const updatedEvent = {
      ...initialData,
      title: eventName,
      startTime: updatedStartTime, // stored as UTC ISO string
      endTime: updatedEndTime,     // stored as UTC ISO string
      description,
      price,
      image: imageData,
      recurring: isRecurring,
      game: selectedGameId,
      isRecurring,
    };

    console.log(updatedEvent);
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

              <label className="block mt-2 mb-1 font-semibold">Upload Event Image</label>
              <input 
                type="file" 
                accept="image/*" 
                className="w-full border p-2 rounded"
                onChange={handleImageUpload}
              />

              {(imageFile || image) && (
                <div className="mt-2">
                  <p className="font-semibold">Image Preview:</p>
                  <img 
                    src={imageFile ? URL.createObjectURL(imageFile) : image} 
                    alt="Event" 
                    className="max-w-full h-auto" 
                  />
                </div>
              )}

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
