import { useState } from "react";
import CreateGameModal from "./createGame";

const mockEvents = [
  {
    id: 1,
    title: "Board Game Night",
    description: "Join us for an epic board game night! This will be a fun and engaging experience where players can trade, build, and strategize.",
    time: "6:00 PM - 9:00 PM",
    game: "Catan",
    price: "$5",
    people: 8,
    image: "https://picsum.photos/200/300",
  },
  {
    id: 2,
    title: "D&D Campaign",
    description: "A one-shot D&D adventure filled with mystery, action, and adventure! Perfect for beginners and veterans alike.",
    time: "7:30 PM - 11:00 PM",
    game: "Dungeons & Dragons",
    price: "Free",
    people: 5,
    image: "https://picsum.photos/200/300",
  },
  {
    id: 7,
    title: "Trivia Night",
    description: "Test your knowledge across various categories in an exciting trivia competition!",
    time: "7:00 PM - 9:00 PM",
    game: "Trivia",
    price: "Free",
    people: 20,
    image: "https://picsum.photos/200/300",
  },
  {
    id: 8,
    title: "Mafia Game Night",
    description: "Can you survive the night? A thrilling social deduction game where deception is key.",
    time: "8:00 PM - 10:30 PM",
    game: "Mafia",
    price: "$5",
    people: 15,
    image: "https://picsum.photos/200/300",
  },
  {
    id: 9,
    title: "Codenames Tournament",
    description: "Work with your team to find the right words while avoiding the enemy’s traps!",
    time: "6:00 PM - 8:30 PM",
    game: "Codenames",
    price: "$10",
    people: 8,
    image: "https://picsum.photos/200/300",
  },
  {
    id: 10,
    title: "Risk Strategy Night",
    description: "Dominate the world in this intense game of strategy and alliances!",
    time: "5:30 PM - 10:00 PM",
    game: "Risk",
    price: "$7",
    people: 6,
    image: "https://picsum.photos/200/300",
  },
  {
    id: 11,
    title: "Werewolf Night",
    description: "A night of hidden roles, strategy, and intense discussions. Can you uncover the werewolves?",
    time: "9:00 PM - 11:30 PM",
    game: "Werewolf",
    price: "$5",
    people: 12,
    image: "https://picsum.photos/200/300",
  },
  {
    id: 12,
    title: "Jackbox Party Games",
    description: "Join us for a fun and hilarious night of digital party games!",
    time: "7:30 PM - 10:00 PM",
    game: "Jackbox",
    price: "Free",
    people: 10,
    image: "https://picsum.photos/200/300",
  }
];

export default function Home() {
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);

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

  return (
    <div className="flex justify-center min-h-screen bg-gray-100 p-4 relative">
      <div className="w-full max-w-6xl bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-3 gap-6">
          {mockEvents.map((event) => (
            <div
              key={event.id}
              onMouseEnter={() => handleMouseEnter(event.id)}
              onMouseLeave={handleMouseLeave}
              className={`mx-auto relative transition-all duration-300 rounded-lg shadow-lg p-4 flex flex-col items-center overflow-hidden border border-gray-200 
                ${hoveredEvent === event.id ? "w-[375px] scale-105 transform -translate-x-3" : "w-[300px] scale-95"}
              `}
            >
              <img
                src={event.image}
                alt={event.title}
                className={`w-full h-40 object-cover rounded-lg transition-all duration-300 
                  ${hoveredEvent === event.id ? "h-48" : "h-40"}
                `}
              />
              <div className="mt-4 text-center w-full">
                <h2 className="text-xl font-bold mb-2">{event.title}</h2>
                <p className="text-gray-700 font-semibold">Game: {event.game}</p>
                <p className="text-gray-700 font-semibold">Time: {event.time}</p>
                <p className="text-gray-700 font-semibold">Price: {event.price}</p>
                <p className="text-gray-500 text-sm mt-2">
                  {hoveredEvent === event.id
                    ? event.description
                    : event.description.substring(0, 50) + "..."}
                </p>
                <button
                  className="mt-4 px-4 py-2 bg-[#942E2A] text-white rounded hover:scale-105 transition-all"
                >
                  RSVP
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
