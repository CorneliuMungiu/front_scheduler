import './App.css';
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
import { useEffect } from 'react';

function App() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const { isLoading } = useSessionContext();

  const [isUserCreated, setIsUserCreated] = useState(false);

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
