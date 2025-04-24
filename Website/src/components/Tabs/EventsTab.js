import React, { useState } from "react";
import EventCard from "../EventCard";
import RSVPModal from "../RSVPModal";

export default function EventsTab({ events, isAdmin, fetchEvents }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);

  const openModal = (event) => {
    setCurrentEvent(event);
    setModalOpen(true);
  };

  return (
    <>
      <div
        className="
          flex-1                /* if parent is flex-col h-screen */
          w-full max-w-6xl
          gradient-bg rounded-lg p-2
          overflow-hidden
        "
      >
        <div className="h-full bg-white shadow-md rounded-lg p-6 flex flex-col">
          {/* grid becomes scrollable */}
          <div
            className="flex-1 overflow-y-auto grid gap-6"
            style={{
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 500px), 1fr))",
            }}
          >
            {events.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                isValid={isAdmin}
                resetEvents={fetchEvents}
                onRSVP={() => openModal(ev)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Portal‐rendered modal at top level */}
      <RSVPModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        eventData={currentEvent}
        type="event"
        refresh={fetchEvents}
      />
    </>
  );
}
