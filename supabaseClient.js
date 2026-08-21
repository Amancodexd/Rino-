// Shared Supabase connection for the RONIN site.
// Loads the official supabase-js client (handles sessions, token refresh, etc.)
const SUPABASE_URL = "https://jdceqhqlsbeitmvjpixj.supabase.co";
const SUPABASE_KEY = "sb_publishable_k5nXrXKzdZkdvbJ0XSNkuA_ubUxdoDr";

// supabase-js is loaded via a <script> tag before this file on every page
// (see the CDN <script> include in each .html file's <head>).
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- Catalog ----------

// Fetches every row from `shows` and normalizes it into the shape the
// front-end pages already expect (t, tag, genre, glyph, a, b, desc, eps, rating).
async function fetchShows(){
  const { data, error } = await sb
    .from('shows')
    .select('*')
    .order('created_at', { ascending: true });
  if(error) throw error;
  return data.map(r => ({
    t: r.title,
    tag: r.genre,   // DB "genre" holds the descriptive label shown under the title
    genre: r.tag,   // DB "tag" holds the short category used for search filter chips
    glyph: r.glyph,
    a: r.color_a,
    b: r.color_b,
    desc: r.description,
    eps: r.episodes,
    ep: `${r.episodes} EP${r.episodes === 1 ? '' : 'S'}`,
    rating: r.rating
  }));
}

// Inserts a new show into the shared catalog. Requires an authenticated admin
// session — enforced by the database's row-level security policy, not just
// this check, so this call will fail safely for non-admins even if called directly.
async function insertShow(show){
  const { data, error } = await sb.from('shows').insert({
    title: show.title,
    tag: show.tag,
    genre: show.genre,
    description: show.description,
    episodes: show.episodes,
    rating: show.rating,
    glyph: show.glyph,
    color_a: show.color_a,
    color_b: show.color_b
  }).select();
  if(error) throw error;
  return data;
}

// ---------- Auth ----------

// Creates a new account. `name` is stored in the user's metadata and copied
// into the profiles table automatically by a database trigger.
async function signUpUser(email, password, name){
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });
  if(error) throw error;
  return data;
}

async function signInUser(email, password){
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if(error) throw error;
  return data;
}

async function signOutUser(){
  await sb.auth.signOut();
}

// Returns the current session (or null if signed out).
async function getCurrentSession(){
  const { data } = await sb.auth.getSession();
  return data.session;
}

// Returns { id, email, name, is_admin } for the signed-in user, or null.
async function getCurrentProfile(){
  const session = await getCurrentSession();
  if(!session) return null;
  const { data, error } = await sb
    .from('profiles')
    .select('id, email, name, is_admin')
    .eq('id', session.user.id)
    .single();
  if(error) return null;
  return data;
}
