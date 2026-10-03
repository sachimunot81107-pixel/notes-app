# Notes Hub

A small web app where students find the **one useful note** for each subject, without digging through WhatsApp chats and Google Classroom.

- **Live app:** https://notes-app-p6tv.vercel.app/
- **Built with:** React (Vite), Supabase (database + file storage), Vercel (hosting)

---

## 1. The annoyance

- My classmates and I get notes in many places: WhatsApp groups, and faculty uploads on Google Classroom.
- The notes pile up in chats and nobody can tell which note is the important one. Before exams we scroll through hundreds of messages to find it.
- **Who it annoys:** students in my class (including me).
- **How I know:** this is exactly how my classmates and I share notes. We get them in WhatsApp groups and on Google Classroom, and it is hard to find the one note that is really important.

## 2. My constraint: #1 "One thumb"

My PRN ends in 1, so the app has to be fully usable with one thumb on a phone. This is how it changed what I built:

- The **+ Add note** button floats at the **bottom right**, where the thumb rests.
- The add-note form opens as a **panel at the bottom** of the screen, not at the top.
- The **"This helped"** button is **full width** on every card, so it is easy to hit.
- Subject chips are big, round and tappable.
- Typing is reduced: subjects are suggested from existing ones, and notes can be added by **choosing a PDF** instead of pasting a link.
- There is **no login or sign-up**, so there are no long forms to fill on a phone.

## 3. The great part: "This helped" votes

I picked the upvote feature because the real problem is not *storing* notes, it is *finding the best one*. Anyone can tap "This helped", and notes with more votes move to the top of their subject. Over time the best note rises by itself.

I also made the database safe: the public can only **read** notes, **add** notes, add **+1** to a vote count, and **delete a note they added** (using a secret code saved on their phone). They cannot edit or delete other people's notes.

## 4. The two testers

I showed the app to two people who had never seen it, and did not explain anything.

| Tester | Where they got stuck | What I changed |
|---|---|---|
| Tester 1 | There was no way to delete a note, so a wrong or test note stayed there forever | Added a "Delete my note" button, so people can remove the notes they added |
| Tester 2 | The "Open note" link text looked strange and unclear, and they wanted to be able to comment on notes | Turned the link into a clear "See notes" button and added comments on notes |

## 5. AI

- **What I used AI for:** guidance on how to structure the app, explanations of React and Supabase ideas, and help writing the database functions and security rules. I typed and tested the code myself and made sure I understood each part.
- **One thing it got wrong that I had to fix:** after I made the database hide the secret delete code from the public, the notes list stopped loading. The query still asked for every column, and the database refused it. I found the permission error in the browser console and fixed it by listing only the public columns in the query.

## 6. Not done / half-working

- **Voting is limited per browser, not per person.** There is no login (to keep it one-thumb), so someone who clears their browser data could vote again.
- **Delete works only on the phone that added the note.** If browser data is cleared, the secret code is lost and the note cannot be deleted by the student.
- The subject chips at the top need a stretch to reach and scroll sideways, which is not ideal for one thumb.
- Comments are anonymous, with no editing, deleting or moderation yet.
- No search box yet.
- No moderation: anyone can add any link or PDF (PDFs are limited to 10 MB).
- Notes do not have separate pages or shareable links yet.

## 7. Run it locally

Needs Node.js.

```
git clone <this repo's URL>
cd notes-app
npm install
npm run dev
```

Create a file named `.env` in the project folder with these **variable names** (add your own values from your Supabase project; never commit this file):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Your own Supabase project needs:

- a table `notes` (id, subject, unit, title, link, upvotes, created_at, delete_token) with Row Level Security turned on
- a table `comments` (id, note_id, body, created_at) with Row Level Security turned on
- a public storage bucket `notes-pdfs` (PDF files only, 10 MB limit)
- two database functions: `increment_upvotes` and `delete_note`
