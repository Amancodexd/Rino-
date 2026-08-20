// Shared Supabase connection for the RONIN site.
const SUPABASE_URL = "https://jdceqhqlsbeitmvjpixj.supabase.co";
const SUPABASE_KEY = "sb_publishable_k5nXrXKzdZkdvbJ0XSNkuA_ubUxdoDr";

// Fetches every row from `shows` and normalizes it into the shape the
// front-end pages already expect (t, tag, genre, glyph, a, b, desc, eps, rating).
async function fetchShows(){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/shows?select=*&order=created_at.asc`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  if(!res.ok) throw new Error('Failed to load catalog from Supabase (' + res.status + ')');
  const rows = await res.json();
  return rows.map(r => ({
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

// Inserts a new show into the shared catalog. Used by admin.html.
async function insertShow(show){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/shows`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      title: show.title,
      tag: show.tag,
      genre: show.genre,
      description: show.description,
      episodes: show.episodes,
      rating: show.rating,
      glyph: show.glyph,
      color_a: show.color_a,
      color_b: show.color_b
    })
  });
  if(!res.ok){
    const errText = await res.text();
    throw new Error('Insert failed (' + res.status + '): ' + errText);
  }
  return res.json();
}
