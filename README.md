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

## The four tabs

**Discover** — eight picks, chosen for whoever is selected in the Watching row. Each one says why
it was suggested. Set one as **tonight's pick** to pin it to the top with a
link to find where it's streaming. The **Discovery slider** controls how
adventurous the suggestions are: slide left for reliable comfort picks, right to
push into genres you have not explored. **Surprise me** just decides for you.

**Rate** — this is what makes the app work. The more you rate, the better it
gets. Three buttons: **Loved**, **Seen**, **Not for me**. There is also a
**Watchlist** for things you want to keep but have not watched yet. If you have
seen the family canon already, the one-tap button marks every all-ages and 6+
film as seen so you are not starting from zero.

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

## Keeping the catalog current

530 titles are built in. Three ways to add more, all under **You**:

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

Replace `app.js` and bump the version in `sw.js` (`mnp-v7` → `mnp-v8`), then
redeploy. Your data is untouched — it lives in the device's own storage, which
app updates never clear.

## Privacy

The app makes no network requests on its own. The only outbound traffic is:

- **TMDB**, when you tap *Update catalog now* — an anonymous "what's popular"
  query. Nothing about you, your profiles, or your ratings is sent.
- **JustWatch**, when you tap a *where to watch* link — a normal link you chose
  to follow.
- **Google Fonts**, to load the two typefaces. Cached after first load; the app
  falls back to system fonts offline.

There is no analytics SDK, no crash reporter, and no account system.
