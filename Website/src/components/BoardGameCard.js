import React, { useState, useRef, useEffect } from "react";
import DOMPurify from "dompurify";

export default function BoardGameCard({ game, alreadyFlipped = false, onFlip }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredGame, setHoveredGame] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const cardRef = useRef(null);

  const handleMouseEnter = (gameId) => {
    const timeout = setTimeout(() => {
      setHoveredGame(gameId);
    }, 250);
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout);
    setHoveredGame(null);
  };

  // Handle already flipped cards
  useEffect(() => {
    if (alreadyFlipped) {
      setIsVisible(true);
      // Small delay to ensure visibility transition completes first
      const timer = setTimeout(() => {
        setIsFlipped(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [alreadyFlipped]);

  // Intersection Observer for card flip effect
  useEffect(() => {
    // Skip if already flipped
    if (alreadyFlipped) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // First, make the card visible
            setIsVisible(true);
            
            // Then schedule the flip with a longer delay
            const timer = setTimeout(() => {
              setIsFlipped(true);
              if (onFlip) onFlip();
            }, 300); // Longer delay to ensure visibility transition completes
            
            return () => clearTimeout(timer);
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
  }, [alreadyFlipped, onFlip]);

  const index = game.id % 10; // Use modulo to limit the range
  const cardStyle = { '--delay': `${index * 0.15}s` };

  return (
    <div
      ref={cardRef}
      key={game.id}
      data-id={game.id}
      onMouseEnter={() => handleMouseEnter(game.id)}
      onMouseLeave={handleMouseLeave}
      className={`container mx-auto relative hover-container ${isVisible ? 'visible' : 'invisible'}`}
      style={cardStyle}
    >
      <div className={`card ${isFlipped ? "flip" : ""}`}>
        {/* Front of card */}
        <div className="front rounded-lg shadow-lg p-4 flex flex-col items-center border border-gray-200 bg-white content-scale">
          <img
            src="/b&b_crest.png"
            alt="Bot N Bevy Crest"
            className="w-full h-full object-contain rounded-lg"
          />
        </div>
        
        {/* Back of card */}
        <div className="back rounded-lg shadow-lg p-4 flex flex-col items-center border border-gray-200 bg-white content-scale">
          {/* Game image */}
          <img 
            src={game.image} 
            alt={game.title} 
            className="w-full h-40 object-contain rounded mb-2" 
          />
          <div className="mt-2 text-center w-full">
            <h3 className="text-lg font-semibold">{game.title}</h3>
            <p className="text-sm text-gray-600">Publisher: {game.publisher}</p>
            <p className="text-sm text-gray-600">Players: {game.players}</p>
            <p className="text-sm text-gray-600">Complexity: {game.difficulty}</p>
            <p className="text-sm text-gray-600">Time: {game.duration} mins</p>
            
            {/* Scrollable description container */}
            <div 
              className="h-24 mt-2 text-sm text-gray-800 overflow-y-auto p-1 border-gray-100 border-t border-b"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(game.description) }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}