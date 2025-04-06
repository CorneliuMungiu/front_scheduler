import './App.css';
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
import DateTimePicker from 'react-datetime-picker';
import { useState, useEffect } from 'react';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';
import 'react-datetime-picker/dist/DateTimePicker.css';

function App() {
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date());
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [google_event_id, setGoogleEventId] = useState(""); 
  const [events, setEvents] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); 
  const [isUserCreated, setIsUserCreated] = useState(false);

  const session = useSession();
  const supabase = useSupabaseClient();
  const { isLoading } = useSessionContext();

  const [attendeeEmails, setAttendeeEmails] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      if (session) {
        const response1 = await fetch(`http://127.0.0.1:5000/get_user_id?email=${session.user.email}`);
        const responseData = await response1.json();
        const response = await fetch(`http://127.0.0.1:5000/events/${responseData.id}`);
        const data = await response.json();
        setEvents(data);
      }
    };

    fetchEvents();
  }, [session]);

  useEffect(() => {
    const createUserIfNeeded = async () => {
      if (session && !isUserCreated) {
        const response = await fetch('http://127.0.0.1:5000/create_user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: session.user.email }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.message === 'User created successfully!') {
            console.log('User created successfully!');
            setIsUserCreated(true);
          } else if (data.message === 'User already exists') {
            console.log('User already exists!');
          }
        } else {
          console.error('Failed to create user on backend', data);
        }
      }
    };

    createUserIfNeeded();
  }, [session, isUserCreated]);


  async function createCalendarEvent() {
  const event = {
    summary: eventName,
    description: eventDescription,
    start: {
      dateTime: start.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };

  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      'Authorization': 'Bearer ' + session.provider_token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event)
  });

  const data = await response.json();

  if (response.ok) {
    console.log(data.id)
    alert("Event created in Google Calendar");
    return data.id;
  } else {
    console.error(data);
    throw new Error("Failed to create Google Calendar event");
  }
}


  const createEvent = async () => {
    const google_event_id = await createCalendarEvent();
    setGoogleEventId(google_event_id);
    console.log(google_event_id) 

    const event = {
      title: eventName,
      description: eventDescription,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      attendees: attendeeEmails.split(',').map(email => email.trim()),
      google_event_id : google_event_id
    };
  
    try {
      const response = await fetch(`http://127.0.0.1:5000/get_user_id?email=${session.user.email}`);
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to fetch organizer ID');
      }
  
      if (responseData.id) {
        event.organizer_id = responseData.id;
      } else {
        throw new Error('User not found');
      }
  
      const createResponse = await fetch('http://127.0.0.1:5000/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
  
      const data = await createResponse.json();
  
      if (createResponse.ok) {
        setEvents([...events, { ...event, id: data.event_id }]);
        setIsCreating(false);
        resetForm();

      } else {
        console.error('Error creating event:', data);
        alert('Error creating event');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating event');
    }
  };
  

  const deleteEvent = async (eventId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/get_user_id?email=${session.user.email}`);
      const data = await response.json();
  
      if (!response.ok || !data.id) {
        throw new Error("Could not fetch user ID");
      }
  
      const deleteResponse = await fetch(`http://127.0.0.1:5000/events/${eventId}?organizer_id=${data.id}`, {
        method: 'DELETE',
      });

  
      if (deleteResponse.ok) {
        const eventToDelete = events.find(event => event.id === eventId);
        deleteCalendarEvent(eventToDelete.google_event_id)

        setEvents(events.filter((event) => event.id !== eventId));
      } else {
        const errorData = await deleteResponse.json();
        alert(`Error deleting event: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete event");
    }
  };


  const editEvent = (event) => {
    setEditingEvent(event);
    setStart(new Date(event.start_time));
    setEnd(new Date(event.end_time));
    setEventName(event.title);
    setEventDescription(event.description);
    setAttendeeEmails(event.attendees ? event.attendees.join(", ") : "");
    setIsCreating(true);
  };
  

  const updateEvent = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/get_user_id?email=${session.user.email}`);
      const userData = await response.json();
  
      if (!response.ok || !userData.id) {
        throw new Error("Could not fetch user ID");
      }
  
      const updatedEvent = {
        organizer_id: userData.id,
        title: eventName,
        description: eventDescription,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        attendees: attendeeEmails.split(',').map(email => email.trim())
      };
  
      const putResponse = await fetch(`http://127.0.0.1:5000/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEvent),
      });
  
      const data = await putResponse.json();
  
      if (putResponse.ok) {
        setEvents(events.map(event =>
          event.id === editingEvent.id ? { ...editingEvent, ...updatedEvent } : event
        ));
        setEditingEvent(null);
        setIsCreating(false);
        resetForm();
      } else {
        alert(`Error updating event: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update event");
    }
  };
  
  async function deleteCalendarEvent(googleEventId) {
    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
        method: "DELETE",
        headers: {
          'Authorization': 'Bearer ' + session.provider_token
        }
      });
  
      if (!response.ok) {
        throw new Error("Failed to delete event from Google Calendar");
      }
    } catch (err) {
      console.error("Google Calendar delete error:", err);
    }
  }

  const sortEvents = (sortBy) => {
    const sortedEvents = [...events].sort((a, b) => {
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'date') {
        return new Date(a.start_time) - new Date(b.start_timea);
      }
      return 0;
    });
    setEvents(sortedEvents);
  };

  const resetForm = () => {
    setStart(new Date());
    setEnd(new Date());
    setEventName('');
    setEventDescription('');
  };

  if (isLoading) {
    return <></>;
  }

  return (
    <div className="App">
      <div className="card">
        {session ? (
          <>
            <h2>{session.user.email}</h2>
            <div className="events-section">
              <h3>Upcoming Events</h3>
              <div className="events-buttons">
                <button onClick={() => sortEvents('name')}>Sort by Name</button>
                <button onClick={() => sortEvents('date')}>Sort by Date</button>
                <button onClick={() => {
                setEditingEvent(null);
                resetForm();
                setIsCreating(true); 
              }}>Create Event</button>

              </div>
              <div className="event-list">
                {events.map(event => (
                  <div key={event.id} className="event-card">
                    <h4>{event.name}</h4>
                    <p>{event.description}</p>
                    <p>{new Date(event.start_time).toLocaleString()} - {new Date(event.end_time).toLocaleString()}</p>
                    <button onClick={() => editEvent(event)}>Edit</button>
                    <button onClick={() => deleteEvent(event.id)}>Delete</button>
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
                <button onClick={editingEvent ? updateEvent : createEvent}>
                  {editingEvent ? "Update" : "Create"}
                </button>
                <button onClick={() => setIsCreating(false)}>Cancel</button>
              </div>
            )}
            <button onClick={signOut}>Sign Out</button>
          </>
        ) : (
          <div>
            <h2>Welcome!</h2>
            <p>Please sign in with Google to continue</p>
            <button onClick={googleSignIn}>Sign In with Google</button>
          </div>
        )}
      </div>
    </div>
  );

  async function googleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar',
      },
    });
  
    if (error) {
      alert('Error logging into Google');
      console.log(error);
    }
  }
  
  async function signOut() {
    await supabase.auth.signOut();
  }

}

export default App;
