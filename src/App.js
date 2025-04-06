import './App.css';
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
import { useEffect } from 'react';

function App() {
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date());
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");

  const [events, setEvents] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const session = useSession();
  const supabase = useSupabaseClient();
  const { isLoading } = useSessionContext();

  const [attendeeEmails, setAttendeeEmails] = useState(""); 

  const [isUserCreated, setIsUserCreated] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      if (session) {
        const response1 = await fetch(`http://127.0.0.1:5000/get_user_id?email=${session.user.email}`);
        const user = await response1.json();
  
        const response = await fetch(`http://127.0.0.1:5000/events/${user.id}`);
        const data = await response.json();
        setEvents(data);
      }
    };
    fetchEvents();
  }, [session]);
  
  const sortEvents = (sortBy) => {
    const sortedEvents = [...events].sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      if (sortBy === 'date') return new Date(a.start_time) - new Date(b.start_time);
      return 0;
    });
    setEvents(sortedEvents);
  };

  useEffect(() => {
    const createUserIfNeeded = async () => {
      if (session && !isUserCreated) {
        const response = await fetch('http://127.0.0.1:5000/create_user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: session.user.email }),
        });

        const data = await response.json();

        if (response.ok && data.message === 'User created successfully!') {
          setIsUserCreated(true);
        } else if (data.message === 'User already exists') {
          console.log('User already exists!');
        } else {
          console.error('User creation failed', data);
        }
      }
    };

    createUserIfNeeded();
  }, [session, isUserCreated]);

  if (isLoading) return <></>;

  return (
    <div className="App">
      {session ? (
        <>
          <h2>{session.user.email}</h2>
            <div className="events-section">
              <h3>Upcoming Events</h3>
              <div className="events-buttons">
                <button onClick={() => sortEvents('name')}>Sort by Name</button>
                <button onClick={() => sortEvents('date')}>Sort by Date</button>
                <button>Create Event</button>

              </div>
              <div className="event-list">
                {events.map(event => (
                  <div key={event.id} className="event-card">
                    <h4>{event.name}</h4>
                    <p>{event.description}</p>
                    <p>{new Date(event.start_time).toLocaleString()} - {new Date(event.end_time).toLocaleString()}</p>
                    <button>Edit</button>
                    <button>Delete</button>
                  </div>
                ))}
              </div>
            </div>
            {isCreating && (
              <div className="create-event-form">
                <h3>{editingEvent ? "Edit Event" : "Create Event"}</h3>
                <p>Start of your event</p>
                <DateTimePicker onChange={setStart} value={start} />
                <p>End of your event</p>
                <DateTimePicker onChange={setEnd} value={end} />
                <p>Event name</p>
                <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} />
                <p>Event Description</p>
                <input type="text" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} />
                <p>Attendees (separate emails with commas)</p>
                <input 
                  type="text" 
                  value={attendeeEmails} 
                  onChange={(e) => setAttendeeEmails(e.target.value)} 
                />
                <p></p>
                {/* <button onClick={editingEvent ? updateEvent : createEvent}>
                  {editingEvent ? "Update" : "Create"}
                </button>
                <button onClick={() => setIsCreating(false)}>Cancel</button> */}
              </div>
            )}
            <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <>
          <h2>Welcome!</h2>
          <p>Please sign in with Google</p>
          <button onClick={googleSignIn}>Sign In with Google</button>
        </>
      )}
    </div>
  );

  async function googleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { scopes: 'https://www.googleapis.com/auth/calendar' },
    });
    if (error) alert('Error logging into Google');
  }

  async function signOut() {
    await supabase.auth.signOut();
  }
}

export default App;
