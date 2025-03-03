import { useState, useEffect } from "react";

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
  // Remove dashes from the date and colon from the time, then append "00" for seconds.
  const datePart = date.replace(/-/g, ""); // e.g., "20250303"
  const timePart = time.replace(":", "") + "00"; // e.g., "190000"
  return `${datePart}T${timePart}Z`;
}

export default function CreateGameModal({ setIsModalOpen, initialData, onSubmit, onDelete }) {
  // Convert ISO strings (if available) to date and time parts for the inputs.
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

  // Controlled state for each field.
  const [gameName, setGameName] = useState(initialData?.title || "");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [numPlayers, setNumPlayers] = useState(initialData?.players || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [gameImage, setGameImage] = useState(initialData?.image || "");

  // Update state if initialData changes.
  useEffect(() => {
    if (initialData) {
      const initStartDate = initialData.startTime
        ? parseEventDate(initialData.startTime).toISOString().slice(0, 10)
        : "";
      const initStartTime = initialData.startTime
        ? parseEventDate(initialData.startTime).toISOString().slice(11, 16)
        : "";
      const initEndDate = initialData.endTime
        ? parseEventDate(initialData.endTime).toISOString().slice(0, 10)
        : "";
      const initEndTime = initialData.endTime
        ? parseEventDate(initialData.endTime).toISOString().slice(11, 16)
        : "";
      setGameName(initialData.title || "");
      setStartDate(initStartDate);
      setEndDate(initEndDate);
      setStartTime(initStartTime);
      setEndTime(initEndTime);
      setNumPlayers(initialData.players || "");
      setDescription(initialData.description || "");
      setGameImage(initialData.image || "");
    }
  }, [initialData]);

  const handleSubmit = () => {
    // Combine date and time fields into ISO format.
    const updatedStartTime = combineDateTime(startDate, startTime);
    const updatedEndTime = combineDateTime(endDate, endTime);

    // Build the updated game object.
    const updatedGame = {
      ...initialData, // Preserve properties like id in edit mode.
      title: gameName,
      startTime: updatedStartTime,
      endTime: updatedEndTime,
      players: numPlayers,
      description,
      image: gameImage,
    };

    // Call the onSubmit callback if provided.
    if (onSubmit) {
      onSubmit(updatedGame);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this game? This action cannot be undone.")) {
      if (onDelete) {
        onDelete(initialData);
      } else {
        console.log("Deleting game:", initialData);
      }
      setIsModalOpen(false);
    }
  };

  return (
    <div className="relative">
      <div
        className="fixed inset-0 flex justify-center items-center z-50"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
      >
        <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] relative">
          {/* Close Button */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-2 right-2 text-gray-600 hover:text-black"
          >
            ✕
          </button>

          {/* Modal Content */}
          <h2 className="text-2xl font-bold text-center mb-4">
            {initialData ? "Edit Game" : "Create Game"}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Left Side Inputs */}
            <div>
              <label className="block mb-1 font-semibold">Game Name</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
              />

              <label className="block mt-2 mb-1 font-semibold">Start Date</label>
              <div className="flex items-center border p-2 rounded">
                <input
                  type="date"
                  className="w-full outline-none"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <label className="block mt-2 mb-1 font-semibold">End Date</label>
              <div className="flex items-center border p-2 rounded">
                <input
                  type="date"
                  className="w-full outline-none"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

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

              <label className="block mt-2 mb-1 font-semibold">Number of Players</label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={numPlayers}
                onChange={(e) => setNumPlayers(e.target.value)}
              />
            </div>

            {/* Right Side */}
            <div className="flex flex-col">
              <label className="block mb-1 font-semibold">Game Description</label>
              <textarea
                className="w-full border p-2 rounded h-32"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>

              <label className="block mt-2 mb-1 font-semibold">Game Image</label>
              <div
                className="w-full h-32 border flex justify-center items-center cursor-pointer"
              >
                <span className="text-gray-500">
                  {gameImage ? "Change Image" : "Add Image"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-right mt-4 flex justify-end gap-2">
            {initialData && (
              <button
                onClick={handleDelete}
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
    </div>
  );
}
