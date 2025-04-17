import EventCard from "../EventCard";

export default function EventsTab({ events, isAdmin, fetchEvents }) {
	return (
		<div className="w-full max-w-6xl gradient-bg rounded-lg p-2">
		  <div className="w-full bg-white shadow-md rounded-lg p-6">
			<h2 className="sr-only">List of Events</h2>
			<div 
			  style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))', 
				gap: '20px'
			  }}
			  role="list"
			  aria-label="Events"
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