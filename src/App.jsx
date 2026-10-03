// useState stores data, useEffect runs code when the page loads
import { useEffect, useState } from 'react'
// Bring in the Supabase connection we made
import { supabase } from './supabaseClient'

function App() {
  // "notes" holds the list from the database; it starts as an empty list
  const [notes, setNotes] = useState([])

  // This runs once, when the page first loads
  useEffect(() => {
    // "async" lets us wait for the database to reply
    async function loadNotes() {
      // Ask Supabase: give me every column of every row in the "notes" table
      const { data, error } = await supabase.from('notes').select('*')
      // If something went wrong, show the error in the browser console
      if (error) console.log(error)
      // Otherwise save the rows into state, so the screen updates
      else setNotes(data)
    }
    loadNotes() // call the function we just defined
  }, []) // the empty [] means "run only once"

  // Show how many notes were found
  return <h1>Notes in database: {notes.length}</h1>
}

export default App