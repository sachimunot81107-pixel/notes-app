// Import the function that creates a connection to Supabase
import { createClient } from '@supabase/supabase-js'

// Read the project URL from the .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

// Read the publishable key from the .env file
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Create the connection once, and export it so any file can use it
export const supabase = createClient(supabaseUrl, supabaseKey)