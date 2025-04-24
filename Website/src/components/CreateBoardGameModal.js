import React, { useState } from "react";

export default function CreateBoardGameModal({ setIsModalOpen, onAddBoardGame, fetchBoardGames }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publisher, setPublisher] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [image, setImage] = useState("");
  const [players, setPlayers] = useState("");
  const [difficulty, setDifficulty] = useState(""); // This will hold the average weight
  const [duration, setDuration] = useState("");

  const [suggestions, setSuggestions] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Fetch suggestions using the BGG search API
  const fetchSuggestions = async (query) => {
    try {
      const response = await fetch(`http://localhost:5000/bgg/search?search=${encodeURIComponent(query)}`);
      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const boardgameNodes = xmlDoc.getElementsByTagName("boardgame");
      const newSuggestions = [];
      for (let i = 0; i < boardgameNodes.length; i++) {
        const node = boardgameNodes[i];
        const id = node.getAttribute("objectid") || node.getAttribute("id");
        const nameNode = node.getElementsByTagName("name")[0];
        const name = nameNode ? nameNode.textContent : "";
        newSuggestions.push({ id, name });
      }
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  // Handle changes in the title input with debounce
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    if (searchTimeout) clearTimeout(searchTimeout);
    if (newTitle.trim() === "") {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(() => {
      fetchSuggestions(newTitle);
    }, 500); // Delay of 500ms
    setSearchTimeout(timeout);
  };

  // Fetch detailed game info when a suggestion is clicked
  const fetchGameDetails = async (gameId) => {
    try {
      const response = await fetch(`http://localhost:5000/bgg/boardgame/${gameId}?stats=1`);
      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const boardgameNode = xmlDoc.getElementsByTagName("boardgame")[0];
      if (boardgameNode) {
        const nameNodes = boardgameNode.getElementsByTagName("name");
        let newTitle = "";
        
        for (let i = 0; i < nameNodes.length; i++) {
            if (nameNodes[i].getAttribute("primary") === "true") {
                newTitle = nameNodes[i].textContent;
                break; // Stop looping once found
            }
        }
        // If no primary name is found, fallback to the first name
        if (!newTitle && nameNodes.length > 0) {
            newTitle = nameNodes[0].textContent;
        }
        // Publisher(s)
        const publisherNodes = boardgameNode.getElementsByTagName("boardgamepublisher");
        const newPublisher = publisherNodes.length > 0 ? publisherNodes[0].textContent : "";
        // Description
        const descNode = boardgameNode.getElementsByTagName("description")[0];
        const newDescription = descNode ? descNode.textContent : "";
        
        // Release Year
        const yearNode = boardgameNode.getElementsByTagName("yearpublished")[0];
        const newReleaseYear = yearNode ? yearNode.textContent : "";
        
        // Thumbnail Image
        const thumbnailNode = boardgameNode.getElementsByTagName("thumbnail")[0];
        const newImage = thumbnailNode ? thumbnailNode.textContent : "";
        
        // Players: If min and max are the same, just return one number; otherwise, use a range
        const minPlayersNode = boardgameNode.getElementsByTagName("minplayers")[0];
        const maxPlayersNode = boardgameNode.getElementsByTagName("maxplayers")[0];
        const newPlayers = minPlayersNode && maxPlayersNode 
          ? (minPlayersNode.textContent === maxPlayersNode.textContent
              ? minPlayersNode.textContent
              : `${minPlayersNode.textContent}-${maxPlayersNode.textContent}`)
          : "";
        
        // Duration: Build from <minplaytime> and <maxplaytime>
        const minPlaytimeNode = boardgameNode.getElementsByTagName("minplaytime")[0];
        const maxPlaytimeNode = boardgameNode.getElementsByTagName("maxplaytime")[0];
        const newDuration = (minPlaytimeNode && maxPlaytimeNode)
          ? (minPlaytimeNode.textContent === maxPlaytimeNode.textContent
              ? (minPlaytimeNode.textContent === "0" ? "Unknown" : minPlaytimeNode.textContent)
              : `${minPlaytimeNode.textContent === "0" ? "Unknown" : minPlaytimeNode.textContent}-${maxPlaytimeNode.textContent === "0" ? "Unknown" : maxPlaytimeNode.textContent}`)
          : "Unknown";
        
        // Difficulty: Extract the average weight from the statistics block
        const statisticsNode = boardgameNode.getElementsByTagName("statistics")[0];
        let newDifficulty = "";
        if (statisticsNode) {
          const ratingsNode = statisticsNode.getElementsByTagName("ratings")[0];
          if (ratingsNode) {
            const averageWeightNode = ratingsNode.getElementsByTagName("averageweight")[0];
            newDifficulty = averageWeightNode ? averageWeightNode.textContent : "";
          }
        }
        // Update state with fetched values
        setTitle(newTitle);
        setPublisher(newPublisher);
        setDescription(newDescription);
        setReleaseYear(newReleaseYear);
        setImage(newImage);
        setPlayers(newPlayers);
        setDuration(newDuration);
        setDifficulty(newDifficulty); // Using the average weight for difficulty
  
        // Clear suggestions after selection
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching game details:", error);
    }
  };
  

  // When a suggestion is selected
  const handleSuggestionClick = (suggestion) => {
    setTitle(suggestion.name);
    fetchGameDetails(suggestion.id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newBoardGame = {
      title:title,
      description:description,
      publisher:publisher,
      yearpublished:releaseYear,
      image: image || "https://picsum.photos/200/300",
      players:players,
      difficulty:difficulty,
      duration:duration,
    };
    onAddBoardGame(newBoardGame)
    setIsModalOpen(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{backgroundColor: "rgba(0, 0, 0, 0.85)"}} onClick={() => setIsModalOpen(false)} >
      <div className="bg-white p-6 rounded-lg shadow-lg w-120 h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">Create Board Game</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 relative">
            <label className="block text-sm font-medium">Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={handleTitleChange}
              className="w-full p-2 border rounded"
              required
            />
            {suggestions.length > 0 && (
              <ul className="absolute bg-white border border-gray-300 w-full z-10 max-h-48 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <li 
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-2 hover:bg-gray-200 cursor-pointer"
                  >
                    {suggestion.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Description</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded"
              required
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Publisher</label>
            <input 
              type="text" 
              value={publisher} 
              onChange={(e) => setPublisher(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Release Year</label>
            <input 
              type="number" 
              value={releaseYear} 
              onChange={(e) => setReleaseYear(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Image URL</label>
            <input 
              type="text" 
              value={image} 
              onChange={(e) => setImage(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Players</label>
            <input 
              type="text" 
              value={players} 
              onChange={(e) => setPlayers(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g., 2 or 2-4"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Difficulty (Weight)</label>
            <input 
              type="text" 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Auto-filled from BGG API"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Time to Play (mins)</label>
            <input 
              type="text" 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g., 60-90"
              required
            />
          </div>
          <div className="flex justify-end">
			<button 
				type="button" 
				onClick={() => setIsModalOpen(false)}
				className="px-4 py-2 mr-2 border rounded"
			>
				Cancel
			</button>
			<button 
				type="submit" 
				className="px-4 py-2 bg-[#942E2A] text-white rounded hover:scale-105 transition-all group relative"
			>
				<span className="relative z-10">Add Board Game</span>
				<span className="absolute inset-0 bg-[#942E2A] rounded"></span>
				<span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#576b1e] via-[#8ea37e] via-[#bdcc7a] via-[#c4cad5] via-[#d7c2cb] to-[#f8aa68] bg-[length:200%_100%] group-hover:animate-gradient rounded"></span>
			</button>
			</div>
        </form>
      </div>
    </div>
  );
}
