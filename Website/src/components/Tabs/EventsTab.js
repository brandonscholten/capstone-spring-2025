import EventCard from "../EventCard";

export default function BoardGamesTab({ events, isTokenValid, fetchEvents }) {
return (
    <div className="w-full max-w-6xl bg-white shadow-md rounded-lg p-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {events.map((event) => (
        <EventCard event={event} key={event.id} isValid={isTokenValid} resetEvents={fetchEvents}/>
        ))}
    </div>
    </div>
);
}