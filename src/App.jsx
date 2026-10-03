// useState = memory for the component, useEffect = run code when the page loads
import { useEffect, useState } from 'react'
// our database connection from the file we made earlier
import { supabase } from './supabaseClient'

// A component is just a function that returns what to show on the screen
function App() {
  // notes: the list from the database (starts empty)
  const [notes, setNotes] = useState([])
  // which subject chip is selected right now (starts as 'All')
  const [selectedSubject, setSelectedSubject] = useState('All')
  // true while we are waiting for the database to reply
  const [loading, setLoading] = useState(true)

  // runs once when the page opens (because of the empty [] at the end)
  useEffect(() => {
    // async lets us "await" (wait for) the database reply
    async function loadNotes() {
      const { data, error } = await supabase
        .from('notes')                              // look in the "notes" table
        .select('*')                                // take all columns
        .order('upvotes', { ascending: true })     // most helpful notes first
      if (error) console.log(error)                 // show the error in the console
      else setNotes(data)                           // save rows -> screen updates
      setLoading(false)                             // we are done waiting
    }
    loadNotes() // call the function we just defined
  }, [])

  // Make the chip list: 'All' + each different subject (Set removes duplicates)
  const subjects = ['All', ...new Set(notes.map((note) => note.subject))]

  // Keep only the notes of the selected subject (or all of them)
  const visibleNotes =
    selectedSubject === 'All'
      ? notes
      : notes.filter((note) => note.subject === selectedSubject)

  return (
    <div className="app">
      <h1>Notes Hub</h1>
      <p>Find the one note that matters.</p>

      {/* One button (chip) for each subject */}
      <div className="chips">
        {subjects.map((subject) => (
          <button
            key={subject}                                 // React needs a unique key in lists
            className={subject === selectedSubject ? 'chip active' : 'chip'}
            onClick={() => setSelectedSubject(subject)}   // clicking changes the state
          >
            {subject}
          </button>
        ))}
      </div>

      {/* Show a message while loading */}
      {loading && <p>Loading notes...</p>}

      {/* Show one card for each visible note */}
      {visibleNotes.map((note) => (
        <div className="card" key={note.id}>
          <h3>{note.title}</h3>
          <p>{note.subject} {note.unit && `• ${note.unit}`}</p>
          <a href={note.link} target="_blank" rel="noreferrer">Open note</a>
          <p>👍 {note.upvotes}</p>
        </div>
      ))}
    </div>
  )
}

// lets other files (main.jsx) import App
export default App