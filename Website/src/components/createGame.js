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
function combineDateTime(date, time) {
  const datePart = date.replace(/-/g, "");
  const timePart = time.replace(":", "") + "00";
  return `${datePart}T${timePart}Z`;
}

export default function CreateGameModal({ setIsModalOpen, initialData, onSubmit, onDelete }) {
  const initialStartDate = initialData?.startTime ? parseEventDate(initialData.startTime).toISOString().slice(0, 10) : "";
  const initialStartTime = initialData?.startTime ? parseEventDate(initialData.startTime).toISOString().slice(11, 16) : "";
  const initialEndDate = initialData?.endTime ? parseEventDate(initialData.endTime).toISOString().slice(0, 10) : "";
  const initialEndTime = initialData?.endTime ? parseEventDate(initialData.endTime).toISOString().slice(11, 16) : "";

  const [gameName, setGameName] = useState(initialData?.title || "");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [numPlayers, setNumPlayers] = useState(initialData?.players || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [gameImage, setGameImage] = useState(initialData?.image || "");
  const [organizer, setOrganizer] = useState(initialData?.organizer || "");
  const [password, setPassword] = useState('')
  // State for "Game" auto-suggest.
  const [gameQuery, setGameQuery] = useState("");
  const [selectedGameId, setSelectedGameId] = useState(initialData?.game || null);
  const [catalogueItems, setCatalogueItems] = useState([]);
  const [gameSuggestions, setGameSuggestions] = useState([]);

    useEffect(() => {
      fetch("http://localhost:5000/catalogue/titles")
        .then((res) => res.json())
        .then((data) => {
          setCatalogueItems(data);
        })
        .catch((err) => console.error("Error fetching catalogue:", err));
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
      setStartDate(initialData.startTime ? parseEventDate(initialData.startTime).toISOString().slice(0, 10) : "");
      setEndDate(initialData.endTime ? parseEventDate(initialData.endTime).toISOString().slice(0, 10) : "");
      setStartTime(initialData.startTime ? parseEventDate(initialData.startTime).toISOString().slice(11, 16) : "");
      setEndTime(initialData.endTime ? parseEventDate(initialData.endTime).toISOString().slice(11, 16) : "");
      setNumPlayers(initialData.players || "");
      setDescription(initialData.description || "");
      setGameImage(initialData.image || "");
      setOrganizer(initialData.organizer || "");
      setSelectedGameId(initialData.game || null);
    }
  }, [initialData]);

  const handleSubmit = () => {
    const updatedStartTime = combineDateTime(startDate, startTime);
    const updatedEndTime = combineDateTime(endDate, endTime);

    const updatedGame = {
      ...initialData,
      title: gameName,
      startTime: updatedStartTime,
      endTime: updatedEndTime,
      organizer: organizer,
      players: numPlayers,
      description:description,
      password: password,
      image: gameImage,
      catalogue: selectedGameId,
    };

    if (onSubmit) {
      onSubmit(updatedGame);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="relative">
      <div className="fixed inset-0 flex justify-center items-center z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}>
        <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] relative">
          <button onClick={() => setIsModalOpen(false)} className="absolute top-2 right-2 text-gray-600 hover:text-black">✕</button>
          <h2 className="text-2xl font-bold text-center mb-4">{initialData ? "Edit Game" : "Create Game"}</h2>
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
                  // Reset selectedGameId when the query changes.
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
              <input type="text" className="w-full border p-2 rounded" value={organizer} onChange={(e) => setOrganizer(e.target.value)} />
              <label className="block mt-2 mb-1 font-semibold">Start Date</label>
              <input type="date" className="w-full border p-2 rounded" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <label className="block mt-2 mb-1 font-semibold">End Date</label>
              <input type="date" className="w-full border p-2 rounded" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <label className="block mt-2 mb-1 font-semibold">Start Time</label>
              <input type="time" className="w-full border p-2 rounded" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <label className="block mt-2 mb-1 font-semibold">End Time</label>
              <input type="time" className="w-full border p-2 rounded" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Number of Players</label>
              <input type="number" className="w-full border p-2 rounded" value={numPlayers} onChange={(e) => setNumPlayers(e.target.value)} />
              <label className="block mb-1 font-semibold">Game Description</label>
              <textarea className="w-full border p-2 rounded h-32" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
              <label className="block mb-1 font-semibold">Game Image</label>
              <input type="text" className="w-full border p-2 rounded" value={gameImage} onChange={(e) => setGameImage(e.target.value)} />
              <label className="block mb-1 font-semibold">Game Password</label>
              <input type="text" className="w-full border p-2 rounded" placeholder="Optional password for editing" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <div className="text-right mt-4 flex justify-end gap-2">
            {initialData && <button onClick={() => onDelete(initialData.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg">Delete Game</button>}
            <button onClick={handleSubmit} className="px-4 py-2 bg-[#3C574D] text-white rounded-lg">Save Game</button>
          </div>
        </div>
      </div>
    </div>
  );
}