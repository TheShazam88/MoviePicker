# Movie Night

A quiet, private picker that learns what your household actually likes.
Everything lives on your phone. No account, no ads, no data leaves the device.

---

## Install it on your Android phone

The app has to be served over **https** — Chrome will not install a PWA, or run
it offline, from a plain `http://` address or a LAN IP like `192.168.1.5`. So
step one is putting these files on any static host. Two reliable free routes:

### Route A — GitHub Pages (permanent, ~5 minutes)

1. Unzip this folder on your computer.
2. Create a new GitHub repo, e.g. `movie-night`. It can be private or public.
3. Upload **the contents** of the unzipped folder — `index.html`, `app.js`,
   `sw.js`, `manifest.webmanifest` and the icons — into the repo root.
   `index.html` must sit at the top level, not inside a subfolder.
4. In the repo: **Settings → Pages → Source: Deploy from a branch**, pick
   `main` and `/ (root)`, then **Save**.
5. Wait a minute, then open the URL it gives you
   (`https://<your-username>.github.io/movie-night/`) in **Chrome on your phone**.
6. Tap **⋮** (top right) → **Add to Home screen** → **Install**.
7. Launch it from the home screen. Full screen, no browser bar, works offline.

### Route B — your own server

Copy the folder to any https path you already serve and open that URL on your
phone, then follow steps 6–7 above. Nothing needs to be configured: no build
step, no backend, no database.

### If "Add to Home screen" does not appear

- Check the address really starts with `https://`.
- Make sure `manifest.webmanifest` and the icon files uploaded correctly —
  open `https://your-url/manifest.webmanifest` directly; it should show JSON.
- Reload the page once. Chrome needs the service worker registered before it
  offers to install.
- Use Chrome. Samsung Internet and Firefox handle install differently.

Once installed it behaves like any other app: it appears in your app drawer,
launches full screen, and its data is kept by the phone.

---

## First run

The first screen creates your **household** — your name, a symbol, and a
content level. After that the app opens to **Who's watching?** each time.

### Adding your family

**You → Add someone to the household.** Give each person a name, a symbol, and
their own content level. Everyone gets a completely separate taste model,
watchlist and history — your ratings never skew your kids' recommendations, or
theirs yours.

**Content level is a ceiling, not a preference.** Somebody set to *6+* will
never be shown a 9+, 12+ or adult title anywhere in the app — not in
recommendations, not in search, not in the watchlist.

### Watching together

Once there are two or more people, a **Watching** row appears at the top of
Discover. Tap anyone to add or remove them from the session:

- **One person selected** — their taste, their age ceiling, their history.
- **Several selected** — picks are scored for the group. Everyone's taste is
  weighted **equally**, so somebody with 200 ratings cannot drown out somebody
  with 20. The **strictest** age ceiling in the group applies, TV series only
  appear if everyone has them switched on, and anything *any* member has
  already rated drops out.

Rating something while several people are selected records it for all of them,
so a shared film night teaches everybody's model at once.

Optionally lock the whole household with a **4-digit PIN** — useful if the phone
gets handed around.

---

## What's in the catalog

**7,284 titles**, nearly all from 2000 onwards, from Belgium, France, the UK,
Japan, South Korea and the US. Around 2,300 are comedies, and **4,781 carry a
streaming tag**: Netflix 4,228, Disney+ 436, Prime Video 117.

A note on those tags. They mark titles **produced or distributed by** each
platform, which is durable — a Netflix original stays on Netflix. They are not
live availability: no free source for that exists, and licensed catalogues
rotate monthly, so anything hardcoded would be wrong within weeks. Use the
"where to watch" link on any title for what is actually streaming today.

Selection balances two things. A **quality** path takes well-reviewed titles,
with a lower bar for smaller industries so they are not buried under Hollywood,
and a much lower vote threshold for recent releases, which have had less time to
accumulate votes than a film from 2005. A **notability** path admits anything
widely seen regardless of score — you cannot mark a film as watched if it is not
in the catalog, and popularity is what makes it likely you have seen it.

Rating bars are also adjusted per genre. Audiences score comedy and horror far
lower than drama for the same level of affection, so a single bar would exclude
most of the mainstream comedy canon.

Age bands on the imported titles are estimated from genre and deliberately
err strict: anything with crime, thriller, war or horror is adults-only, and
only animation or explicitly family-tagged titles reach the children's bands.
Much of that expansion is adult arthouse and prestige drama, so it will mostly
surface on adult profiles.

## The five tabs

**Discover** — eight picks, chosen for whoever is selected in the Watching row. Each one says why
it was suggested. Set one as **tonight's pick** to pin it to the top with a
link to find where it's streaming. The **Discovery slider** controls how
adventurous the suggestions are: slide left for reliable comfort picks, right to
push into genres you have not explored. **Surprise me** just decides for you.

**Rate** — this is what makes the app work, and it is built for volume: the more
of the catalog you mark, the less chance a suggestion is something you have
already seen. Three buttons per title: **Loved**, **Seen**, **Not for me**.

- **Search** any title in the catalog.
- **Filter** by genre, decade, films or series, and **Unrated only** so you are
  always working on new ground.
- **Sort** by most popular, newest, best rated or A–Z.
- A **progress bar** shows how much of your catalog you have marked.
- Results page in 60 at a time — the whole catalog is reachable, not just the
  popular head.

Critic scores appear on each row so you can recognise a title you half-remember.
There is also a **Watchlist** for things you want to keep but have not watched,
and a one-tap button to mark the whole all-ages and 6+ family canon as seen.

**Insights** — a live picture of what the selected person (or group) actually watches:

- how many titles rated, how many loved, your love rate
- films vs series, and roughly how many hours logged
- a **variety score** (0–100) — how spread out your watching is across genres
- **your taste**: signed affinity per genre, green to the right for what you
  like, red to the left for what you do not
- **what you watch most**, ranked
- **your gaps**: the genres you have barely touched
- **by decade**, and your **top studios**

**You** — the household list, PIN, dark mode, catalog updates, backup, sign out.

---

## Critic scores

**Scores ship with the app.** No key, no setup, no network — they work on first
launch and offline:

| Figure | Whose opinion | Coverage |
|---|---|---|
| **IMDb** | the audience | all 7,284 titles |
| **TOMATO** — Rotten Tomatoes Tomatometer | film critics | 4,244 titles |
| **META** — Metacritic Metascore | film critics | 3,649 titles |

IMDb figures come from IMDb's official public dataset. The Tomatometer and
Metascore come from Wikidata, filtered by scoring method so the Tomatometer is
never confused with Rotten Tomatoes' separate /10 review average.

**A note on the two Rotten Tomatoes scores.** Rotten Tomatoes publishes a
critics' Tomatometer *and* an audience score (the Popcornmeter). Only the
critics' score is obtainable: the audience score appears on fewer than ten
records in the whole of Wikidata, OMDb does not return it, and Rotten Tomatoes'
own API is enterprise-only through Fandango. So the app shows the critics'
figure, labelled **TOMATO**, and does not invent an audience number. IMDb is
the closest audience measure available, which is why both are shown side by
side.

**A free OMDb key is optional** — it fills the remaining gaps and refreshes
figures as they drift. Get one at `omdbapi.com/apikey.aspx`, then
**You → Critic scores**, paste it, and tap **Add Rotten Tomatoes for what you
have watched**. There is also a **Fetch the whole catalog** button. Fetched data
lays on top of the built-ins — it adds Rotten Tomatoes and Metacritic, and
refreshes the IMDb figure as it drifts. A lookup that finds nothing never wipes
a good built-in rating.

Notes worth knowing:

- The free tier allows **1,000 lookups a day**, and the catalog is 7,284 titles.
  You almost certainly do not need a full pass — nearly everything is built in.
- Scores are stored on the device and reused. Nothing is re-fetched, including
  titles that came back with no data.
- **Coverage is imperfect.** Rotten Tomatoes is frequently missing for older
  films, anime, and non-US releases. IMDb coverage is much better.
- TMDB's own audience score is captured free during a catalog sync and is used
  as a fallback for titles you have added yourself, which have no built-in rating.

### Using scores in the recommendations

Off by default. Turn it on per person: **You → tap their name → Use critic
scores**. It is per-member deliberately, so you can have scores steer your own
picks while a child's stay driven purely by their own taste.

When it is on, critic scores feed the **main ranking** — not the wildcard slot.
And they are weighted by how much that person has *historically* agreed with
critics, learned from what they have already rated:

- If your loves are consistently the well-reviewed titles, scores get a strong
  positive weight.
- If you reliably enjoy things critics panned, the weight goes **negative** —
  a high Rotten Tomatoes score then counts slightly against a suggestion.
- Until there are about five rated titles with scores, it falls back to a mild
  positive assumption rather than guessing from thin evidence.

You can see the current reading on the Watched tab under **Critic alignment**.

## Keeping the catalog current

7,284 titles are built in. Three ways to add more, all under **You**:

**1. Update from TMDB (easiest).** Get a free API key at
themoviedb.org → Settings → API, paste it in once, and tap **Update catalog
now**. It pulls what is popular, in cinemas, and upcoming — films and series —
and merges anything new. Your key is stored on the device and is never included
in a backup.

> Age ratings from TMDB are estimated, and estimated **conservatively**: horror
> is treated as adult, anything unknown lands at 12+, and adult-flagged results
> are discarded outright. Check anything new before showing it to young children.

**2. Import a pack.** No key needed. Open **Import a pack**, copy the prompt,
paste it into any AI assistant, ask for what you want ("notable releases from
2026 so far"), save the reply as a `.json` file, and upload it. Malformed
entries are skipped individually rather than failing the whole file, and
anything already in your catalog is ignored.

**3. Add a title by hand.** One film or series at a time.

---

## Moving to a new phone

**You → Backup & restore → Copy backup** writes a `.json` file (and copies it to
your clipboard) containing every household member, every rating, watchlists,
watch history, and any titles you added. On the new phone, install the app and paste
it into **Restore**. Your TMDB key is deliberately excluded.

Because this is a PWA, clearing your browser's site data for this address will
also clear the app's data. Take a backup before doing that.

---

## What's in the box

```
index.html               the shell, and the on-device storage bridge
app.js                   the whole app, compiled
sw.js                    service worker (offline cache)
manifest.webmanifest     name, icons, standalone display
icon-*.png               home screen icons, including maskable
movie-pack-example.json  a valid pack you can open to see the format
```

## Updating the app later

When I send you a new `app.js` (or you change anything else), the update flow is:

```bash
# in your local clone of the repo
cp /path/to/new/app.js app.js

# bump the cache version so phones fetch the new files
# sw.js line 5:  const CACHE = "mnp-v17";  ->  "mnp-v18"

git add -A
git commit -m "Update Movie Night"
git push
```

Bumping `CACHE` in `sw.js` is the part that matters. The service worker only
reinstalls when its own bytes change, and that is what forces phones to pull the
new `app.js` instead of serving the cached one.

GitHub Pages takes 1–2 minutes to publish, and its CDN can hold the old files
for a few more.

### What happens on your phone

Roughly a minute after the deploy, the app will notice on its own:

- If the app is **closed**, the next launch (while online) fetches the new
  version and just runs it.
- If the app is **open**, a small **"A new version is ready — Reload"** bar
  appears at the bottom. Tap Reload.
- Bringing the app back to the foreground also triggers a check.

There is nothing to reinstall, and the home screen icon does not change. To
confirm which version you are on: **You → the bottom line shows the version
number.**

### Your data is not affected

**Everything you have entered stays.** Profiles, household members, PINs,
ratings, watchlists, watch history, imported titles, critic scores and settings
live in the phone's own storage for that address — a code update never touches
it, and every version reads data written by older versions.

Three things *would* lose it, so avoid them:

1. **Changing the URL.** Storage is tied to the exact origin. Moving from
   `you.github.io/movie-night/` to a different address starts empty. If you ever
   need to move, take a backup first (**You → Backup & restore**) and restore it
   on the new address.
2. **Clearing site data** for that address in Chrome settings.
3. **Uninstalling** the app and clearing its storage.

Taking an occasional backup is cheap insurance regardless.

## Privacy

The app makes no network requests on its own. The only outbound traffic is:

- **TMDB**, when you tap *Update catalog now* — an anonymous "what's popular"
  query. Nothing about you, your profiles, or your ratings is sent.
- **JustWatch**, when you tap a *where to watch* link — a normal link you chose
  to follow.
- **OMDb**, when you ask for critic scores — it sends only a title and year.
- **Google Fonts**, to load the two typefaces. Cached after first load; the app
  falls back to system fonts offline.

There is no analytics SDK, no crash reporter, and no account system.
