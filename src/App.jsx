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
  const [showForm, setShowForm] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newLink, setNewLink] = useState('')
    // list of note ids this phone has already upvoted; starts from what the browser saved
  const [votedIds, setVotedIds] = useState(
    () => JSON.parse(localStorage.getItem('votedIds') || '[]')
  )
    // the PDF the user picked (null = nothing picked)
  const [newFile, setNewFile] = useState(null)
  // true while the file is uploading, so we can disable the Save button
  const [uploading, setUploading] = useState(false)
    // secret codes for the notes this phone added, like { 12: 'abc-123' }
  const [myTokens, setMyTokens] = useState(
    () => JSON.parse(localStorage.getItem('myTokens') || '{}')
  )


  // runs once when the page opens (because of the empty [] at the end)
  async function loadNotes() {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('upvotes', { ascending: false })
    if (error) console.log(error)
    else setNotes(data)
    setLoading(false)
  }

  // run it once when the page opens
  useEffect(() => {
    loadNotes()
  }, [])

  // runs when the user submits the form
    async function addNote(e) {
    e.preventDefault() // stop the page from refreshing

    // start with the link typed by the user (may be empty if they picked a PDF)
    let finalLink = newLink.trim()

    // if a PDF was chosen, upload it first
    if (newFile) {
      setUploading(true) // show "Uploading..." on the button

      // make a safe, unique file name: time + original name without odd characters
      const fileName = `${Date.now()}-${newFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`

      // send the file to the "notes-pdfs" bucket in Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('notes-pdfs')
        .upload(fileName, newFile)

      // if the upload failed, tell the user and stop
      if (uploadError) {
        console.log(uploadError)
        alert('Could not upload the PDF. Is it under 10 MB?')
        setUploading(false)
        return
      }

      // ask Supabase for the public link of the file we just uploaded
      const { data } = supabase.storage.from('notes-pdfs').getPublicUrl(fileName)
      finalLink = data.publicUrl // this link is what we save in the table
      setUploading(false)
    }

    // save the note row, using finalLink (PDF link or typed link)
        // make a random secret code for this note
    const token = crypto.randomUUID()

    // save the note along with its code; .select('id').single() gives back the new note's id
    const { data: created, error } = await supabase
      .from('notes')
      .insert({
        subject: newSubject.trim(),
        title: newTitle.trim(),
        unit: newUnit.trim() || null,
        link: finalLink,
        delete_token: token,
      })
      .select('id')
      .single()

    if (error) {
      console.log(error)
      alert('Could not add the note. Please try again.')
      return
    }
        // remember the code on this phone, matched to the note's id
    const updatedTokens = { ...myTokens, [created.id]: token }
    setMyTokens(updatedTokens)
    localStorage.setItem('myTokens', JSON.stringify(updatedTokens))

    // success: clear everything, close the panel, reload the list
    setNewSubject('')
    setNewTitle('')
    setNewUnit('')
    setNewLink('')
    setNewFile(null)
    setShowForm(false)
    loadNotes()
  }

    // runs when someone taps Delete
  async function deleteNote(id) {
    // ask first, so an accidental tap doesn't delete a note
    if (!window.confirm('Delete this note?')) return

    // ask the database to delete it, sending this phone's secret code
    const { data: ok, error } = await supabase.rpc('delete_note', {
      note_id: id,
      token: myTokens[id],
    })

    // false or an error means the code didn't match or something failed
    if (error || !ok) {
      alert('Could not delete this note.')
      return
    }

    // forget the code, then reload the list
    const rest = { ...myTokens }
    delete rest[id]
    setMyTokens(rest)
    localStorage.setItem('myTokens', JSON.stringify(rest))
    loadNotes()
  }

    // runs when someone taps "This helped"
  async function upvote(id) {
    // already voted on this note? do nothing
    if (votedIds.includes(id)) return

    // ask the database to run our function for this note
    const { error } = await supabase.rpc('increment_upvotes', { note_id: id })

    // if it failed, show the error and stop
    if (error) {
      console.log(error)
      return
    }

    // remember this vote in the browser (add the id to the list)
    const updated = [...votedIds, id]
    setVotedIds(updated)
    localStorage.setItem('votedIds', JSON.stringify(updated))

    // reload the list so the new count and the new order appear
    loadNotes()
  }

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
                    <button
            className={votedIds.includes(note.id) ? 'vote voted' : 'vote'}
            onClick={() => upvote(note.id)}
          >
            👍 {note.upvotes} {votedIds.includes(note.id) ? 'Helped' : 'This helped'}
          </button>

          {/* NEW: the delete button goes here, after the vote button */}
          {myTokens[note.id] && (
            <button className="delete" onClick={() => deleteNote(note.id)}>
              Delete my note
            </button>
          )}
        </div>
      )

      )}
      {/* floating button, always at the bottom right */}
      <button className="fab" onClick={() => setShowForm(true)}>
        + Add note
      </button>

      {/* the form panel, shown only when showForm is true */}
      {showForm && (
        <div className="sheet">
          <form onSubmit={addNote}>
            <h2>Add a note</h2>

            {/* typing here suggests existing subjects from the list below */}
            <input
              list="subject-options"
              placeholder="Subject (e.g. Maths)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              required
            />
            <datalist id="subject-options">
              {subjects
                .filter((s) => s !== 'All')
                .map((s) => (
                  <option key={s} value={s} />
                ))}
            </datalist>

            <input
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <input
              placeholder="Unit (optional)"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
            />
                        <input
              type="url"
              placeholder="Paste a link (or choose a PDF below)"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              required={!newFile}
            />

            {/* file picker: only PDFs; takes the first chosen file */}
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setNewFile(e.target.files[0] || null)}
            />

            <div className="sheet-buttons">
              <button type="button" className="cancel" onClick={() => setShowForm(false)}>
                Cancel
              </button>
                <button type="submit" className="save" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}

// lets other files (main.jsx) import App
export default App