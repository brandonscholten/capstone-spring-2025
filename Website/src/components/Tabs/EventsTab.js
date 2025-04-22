import React, { useRef, useState, useEffect } from "react";
import EventCard from "../EventCard";

export default function EventsTab({ events, isAdmin, fetchEvents }) {
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState('calc(100vh - 120px)');
  const [gridHeight, setGridHeight] = useState('calc(100vh - 200px)');

  // Calculate available heights on mount and window resize
  useEffect(() => {
    const calculateHeights = () => {
      // Set overall container height (subtract for header/nav/footer)
      const totalHeight = window.innerHeight - 120; // Adjust based on your layout
      setContainerHeight(`${totalHeight}px`);
      
      // Set grid height (leaving space for any headers, etc.)
      const availableHeight = totalHeight - 80; // Adjust this value as needed
      setGridHeight(`${availableHeight}px`);
    };
    
    calculateHeights();
    window.addEventListener('resize', calculateHeights);
    
    return () => window.removeEventListener('resize', calculateHeights);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full max-w-6xl gradient-bg rounded-lg p-2"
      style={{ height: containerHeight, maxHeight: containerHeight }}
    >
      <div className="w-full bg-white shadow-md rounded-lg p-6 flex flex-col overflow-hidden"
           style={{ height: 'calc(100% - 4px)', maxHeight: 'calc(100% - 4px)' }}>
        <h2 className="sr-only">List of Events</h2>
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', // Changed to show 2 cards per row
            gap: '24px',
            overflow: 'auto',
            height: gridHeight,
            maxHeight: gridHeight
          }}
          role="list"
          aria-label="Events"
          className="flex-grow"
        >
          {events.map((event) => (
            <div key={event.id} role="listitem">
              <EventCard 
                event={event} 
                isValid={isAdmin} 
                resetEvents={fetchEvents}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}