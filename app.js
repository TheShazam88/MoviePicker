const {
  useState,
  useEffect,
  useMemo,
  useRef
} = React;

/* ============================================================
   MOVIE NIGHT — v10 (complete redesign)
   Design language: quiet, professional, monochrome.
   Ink on paper. The only chromatic accents are a single
   dark green (like) and a single dark red (dislike). Numbers
   are set in a monospace face to read like an instrument.
   Features: on-device profiles + PIN login, upgraded
   recommender with an exposed taste vector, a real Insights
   dashboard, watchlist, catalog auto-update, and packs.
   ============================================================ */

// ---------- Theme tokens ----------
const THEMES = {
  light: {
    bg: "#FFFFFF",
    raise: "#FAFAFA",
    card: "#FFFFFF",
    ink: "#0D0D0D",
    ink2: "#3C3C43",
    mut: "#8A8A8F",
    faint: "#B8B8BD",
    line: "#E7E7E9",
    line2: "#EDEDEF",
    field: "#F5F5F6",
    like: "#1B6B4A",
    likeBg: "#EAF3EE",
    dislike: "#9A2E2E",
    dislikeBg: "#F6ECEC",
    star: "#0D0D0D",
    shadow: "0 1px 2px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.06)",
    overlay: "rgba(20,20,22,0.42)"
  },
  dark: {
    bg: "#0B0B0C",
    raise: "#141416",
    card: "#161618",
    ink: "#F2F2F3",
    ink2: "#C9C9CE",
    mut: "#8E8E96",
    faint: "#5A5A62",
    line: "#26262A",
    line2: "#202024",
    field: "#1C1C1F",
    like: "#3FA277",
    likeBg: "#132A20",
    dislike: "#C75B58",
    dislikeBg: "#2A1717",
    star: "#F2F2F3",
    shadow: "0 1px 2px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.5)",
    overlay: "rgba(0,0,0,0.6)"
  }
};
const APP_VERSION = "16";
const FONT_UI = "'Inter', -apple-system, system-ui, sans-serif";
const FONT_NUM = "'IBM Plex Mono', ui-monospace, 'SF Mono', monospace";

// ---------- Age bands ----------
const BANDS = [{
  id: "a",
  label: "All ages"
}, {
  id: "k",
  label: "6+"
}, {
  id: "t",
  label: "9+"
}, {
  id: "x",
  label: "12+"
}, {
  id: "r",
  label: "Adults"
}];
const BAND_RANK = {
  a: 0,
  k: 1,
  t: 2,
  x: 3,
  r: 4
};
const bandLabel = id => (BANDS.find(b => b.id === id) || {}).label || id;

// ---------- Moods (session lens) ----------
const MOODS = [{
  id: "any",
  label: "Any"
}, {
  id: "laughs",
  label: "Funny",
  g: ["comedy"]
}, {
  id: "cozy",
  label: "Feel-good",
  g: ["romance", "musical", "drama"]
}, {
  id: "edge",
  label: "Tense",
  g: ["thriller", "action", "horror", "mystery"]
}, {
  id: "wonder",
  label: "Epic",
  g: ["adventure", "fantasy", "scifi"]
}];

// ---------- Taxonomy ----------
const LABELS = {
  animation: "Animation",
  adventure: "Adventure",
  comedy: "Comedy",
  fantasy: "Fantasy",
  musical: "Musical",
  action: "Action",
  scifi: "Sci-fi",
  drama: "Drama",
  mystery: "Mystery",
  sports: "Sports",
  thriller: "Thriller",
  horror: "Horror",
  romance: "Romance",
  crime: "Crime",
  princess: "Princesses",
  magic: "Magic",
  music: "Music",
  animals: "Animals",
  dragons: "Dragons",
  dinosaurs: "Dinosaurs",
  superhero: "Superheroes",
  robots: "Robots",
  space: "Space",
  ocean: "Ocean",
  cars: "Cars",
  videogames: "Video games",
  monsters: "Monsters",
  spies: "Spies",
  detective: "Detectives",
  school: "School",
  christmas: "Christmas",
  spooky: "Spooky",
  japan: "Japan",
  friendship: "Friendship",
  family: "Family",
  sisters: "Sisters",
  toys: "Toys",
  minions: "Minions",
  feelings: "Feelings",
  cooking: "Cooking",
  survival: "Survival",
  heist: "Heists",
  timetravel: "Time travel",
  anime: "Anime",
  aliens: "Aliens",
  war: "War"
};
const lbl = k => LABELS[k] || k.charAt(0).toUpperCase() + k.slice(1);
const GENRE_OPTIONS = ["comedy", "adventure", "action", "fantasy", "scifi", "drama", "musical", "romance", "mystery", "thriller", "horror", "crime", "sports", "animation"];
const THEME_OPTIONS = ["animals", "magic", "music", "superhero", "space", "ocean", "videogames", "monsters", "detective", "japan", "anime", "family", "christmas", "sports"];
const JP_OPTIONS = [["", "Anywhere"], ["disneyplus", "Disney+"], ["netflix", "Netflix"], ["prime", "Prime"]];

// ---------- Japan streaming ----------
const PLATFORMS = {
  disneyplus: {
    label: "Disney+"
  },
  netflix: {
    label: "Netflix"
  },
  prime: {
    label: "Prime Video"
  },
  rental: {
    label: "Rental only"
  }
};
function jpPlatforms(m) {
  if (m.jp) return m.jp;
  if (m.s === "disney" || m.s === "pixar") return ["disneyplus"];
  if (m.s === "netflix") return ["netflix"];
  if (m.s === "ghibli") return ["rental"];
  return null;
}
const justWatchUrl = m => "https://www.justwatch.com/jp/search?q=" + encodeURIComponent(m.t.replace(" (live action)", ""));
const decadeOf = y => Math.floor(y / 10) * 10;
const MOVIES = [
// ===== Disney animation & Disney live action =====
{
  id: "frozen",
  t: "Frozen",
  y: 2013,
  b: "a",
  s: "disney",
  g: ["musical", "fantasy", "animation"],
  tg: ["princess", "magic", "sisters"],
  p: 10
}, {
  id: "frozen2",
  t: "Frozen II",
  y: 2019,
  b: "a",
  s: "disney",
  g: ["musical", "fantasy", "animation"],
  tg: ["princess", "magic", "sisters"],
  p: 9,
  q: "frozen"
}, {
  id: "moana",
  t: "Moana",
  y: 2016,
  b: "a",
  s: "disney",
  g: ["musical", "adventure", "animation"],
  tg: ["ocean", "princess", "magic"],
  p: 10
}, {
  id: "moana2",
  t: "Moana 2",
  y: 2024,
  b: "a",
  s: "disney",
  g: ["musical", "adventure", "animation"],
  tg: ["ocean", "princess"],
  p: 9,
  q: "moana"
}, {
  id: "encanto",
  t: "Encanto",
  y: 2021,
  b: "a",
  s: "disney",
  g: ["musical", "fantasy", "animation"],
  tg: ["family", "magic", "music"],
  p: 10
}, {
  id: "tangled",
  t: "Tangled",
  y: 2010,
  b: "a",
  s: "disney",
  g: ["musical", "adventure", "animation"],
  tg: ["princess", "magic"],
  p: 9
}, {
  id: "lionking",
  t: "The Lion King",
  y: 1994,
  b: "k",
  s: "disney",
  g: ["musical", "drama", "animation"],
  tg: ["animals", "family"],
  p: 9
}, {
  id: "mufasa",
  t: "Mufasa: The Lion King",
  y: 2024,
  b: "k",
  s: "disney",
  g: ["musical", "adventure", "animation"],
  tg: ["animals", "family"],
  p: 7
}, {
  id: "aladdin",
  t: "Aladdin",
  y: 1992,
  b: "k",
  s: "disney",
  g: ["musical", "adventure", "animation"],
  tg: ["magic", "princess"],
  p: 8
}, {
  id: "mermaid",
  t: "The Little Mermaid",
  y: 1989,
  b: "a",
  s: "disney",
  g: ["musical", "fantasy", "animation"],
  tg: ["ocean", "princess"],
  p: 8
}, {
  id: "beauty",
  t: "Beauty and the Beast",
  y: 1991,
  b: "a",
  s: "disney",
  g: ["musical", "fantasy", "animation"],
  tg: ["princess", "magic"],
  p: 8
}, {
  id: "mulan",
  t: "Mulan",
  y: 1998,
  b: "k",
  s: "disney",
  g: ["musical", "action", "animation"],
  tg: ["princess", "animals"],
  p: 8
}, {
  id: "zootopia",
  t: "Zootopia",
  y: 2016,
  b: "k",
  s: "disney",
  g: ["comedy", "mystery", "animation"],
  tg: ["animals", "detective"],
  p: 9
}, {
  id: "zootopia2",
  t: "Zootopia 2",
  y: 2025,
  b: "k",
  s: "disney",
  g: ["comedy", "mystery", "animation"],
  tg: ["animals", "detective"],
  p: 8,
  q: "zootopia"
}, {
  id: "bighero6",
  t: "Big Hero 6",
  y: 2014,
  b: "t",
  s: "disney",
  g: ["action", "scifi", "animation"],
  tg: ["superhero", "robots"],
  p: 8
}, {
  id: "wreck",
  t: "Wreck-It Ralph",
  y: 2012,
  b: "k",
  s: "disney",
  g: ["comedy", "adventure", "animation"],
  tg: ["videogames", "friendship"],
  p: 8
}, {
  id: "ralph2",
  t: "Ralph Breaks the Internet",
  y: 2018,
  b: "k",
  s: "disney",
  g: ["comedy", "adventure", "animation"],
  tg: ["videogames", "princess"],
  p: 7,
  q: "wreck"
}, {
  id: "raya",
  t: "Raya and the Last Dragon",
  y: 2021,
  b: "k",
  s: "disney",
  g: ["action", "fantasy", "animation"],
  tg: ["dragons", "princess"],
  p: 7
}, {
  id: "lilo",
  t: "Lilo & Stitch",
  y: 2002,
  b: "k",
  s: "disney",
  g: ["comedy", "scifi", "animation"],
  tg: ["space", "family", "ocean"],
  p: 8
}, {
  id: "liloLA",
  t: "Lilo & Stitch (live action)",
  y: 2025,
  b: "k",
  s: "disney",
  g: ["comedy", "scifi"],
  tg: ["space", "family", "ocean"],
  p: 8
}, {
  id: "wish",
  t: "Wish",
  y: 2023,
  b: "a",
  s: "disney",
  g: ["musical", "fantasy", "animation"],
  tg: ["magic", "princess"],
  p: 6
}, {
  id: "pfrog",
  t: "The Princess and the Frog",
  y: 2009,
  b: "a",
  s: "disney",
  g: ["musical", "fantasy", "animation"],
  tg: ["princess", "music", "animals"],
  p: 7
}, {
  id: "junglebook",
  t: "The Jungle Book",
  y: 1967,
  b: "a",
  s: "disney",
  g: ["musical", "adventure", "animation"],
  tg: ["animals"],
  p: 7
}, {
  id: "enchanted",
  t: "Enchanted",
  y: 2007,
  b: "k",
  s: "disney",
  g: ["musical", "comedy", "fantasy"],
  tg: ["princess", "magic"],
  p: 7
}, {
  id: "cind15",
  t: "Cinderella",
  y: 2015,
  b: "k",
  s: "disney",
  g: ["fantasy", "drama"],
  tg: ["princess", "magic"],
  p: 6
}, {
  id: "aladdin19",
  t: "Aladdin (live action)",
  y: 2019,
  b: "k",
  s: "disney",
  g: ["musical", "adventure", "fantasy"],
  tg: ["magic", "princess"],
  p: 7
}, {
  id: "beauty17",
  t: "Beauty and the Beast (live action)",
  y: 2017,
  b: "k",
  s: "disney",
  g: ["musical", "fantasy"],
  tg: ["princess", "magic"],
  p: 7
}, {
  id: "maryp",
  t: "Mary Poppins",
  y: 1964,
  b: "a",
  s: "disney",
  g: ["musical", "fantasy"],
  tg: ["magic", "family"],
  p: 7
}, {
  id: "hocus",
  t: "Hocus Pocus",
  y: 1993,
  b: "t",
  s: "disney",
  g: ["comedy", "fantasy"],
  tg: ["magic", "spooky"],
  p: 7
}, {
  id: "narnia",
  t: "The Chronicles of Narnia",
  y: 2005,
  b: "t",
  s: "disney",
  g: ["fantasy", "adventure"],
  tg: ["magic", "animals", "war"],
  p: 7
}, {
  id: "winnie",
  t: "Winnie the Pooh",
  y: 2011,
  b: "a",
  s: "disney",
  g: ["comedy", "musical", "animation"],
  tg: ["animals", "friendship"],
  p: 6
}, {
  id: "dumbo",
  t: "Dumbo",
  y: 1941,
  b: "a",
  s: "disney",
  g: ["musical", "drama", "animation"],
  tg: ["animals"],
  p: 6
}, {
  id: "pinocchio",
  t: "Pinocchio",
  y: 1940,
  b: "a",
  s: "disney",
  g: ["musical", "fantasy", "animation"],
  tg: ["magic", "toys"],
  p: 6
}, {
  id: "peterpan",
  t: "Peter Pan",
  y: 1953,
  b: "a",
  s: "disney",
  g: ["fantasy", "adventure", "animation"],
  tg: ["magic"],
  p: 6
}, {
  id: "ladytramp",
  t: "Lady and the Tramp",
  y: 1955,
  b: "a",
  s: "disney",
  g: ["romance", "comedy", "animation"],
  tg: ["animals"],
  p: 6
}, {
  id: "aristocats",
  t: "The Aristocats",
  y: 1970,
  b: "a",
  s: "disney",
  g: ["musical", "comedy", "animation"],
  tg: ["animals", "music"],
  p: 6
}, {
  id: "robinhood",
  t: "Robin Hood",
  y: 1973,
  b: "a",
  s: "disney",
  g: ["adventure", "comedy", "animation"],
  tg: ["animals"],
  p: 6
}, {
  id: "hercules",
  t: "Hercules",
  y: 1997,
  b: "k",
  s: "disney",
  g: ["musical", "fantasy", "animation"],
  tg: ["magic", "monsters"],
  p: 7
}, {
  id: "tarzan",
  t: "Tarzan",
  y: 1999,
  b: "k",
  s: "disney",
  g: ["musical", "adventure", "animation"],
  tg: ["animals", "family"],
  p: 7
}, {
  id: "emperor",
  t: "The Emperor's New Groove",
  y: 2000,
  b: "k",
  s: "disney",
  g: ["comedy", "fantasy", "animation"],
  tg: ["animals", "magic"],
  p: 7
}, {
  id: "atlantis",
  t: "Atlantis: The Lost Empire",
  y: 2001,
  b: "k",
  s: "disney",
  g: ["adventure", "scifi", "animation"],
  tg: ["ocean", "magic"],
  p: 6
}, {
  id: "treasureplanet",
  t: "Treasure Planet",
  y: 2002,
  b: "k",
  s: "disney",
  g: ["adventure", "scifi", "animation"],
  tg: ["space", "robots"],
  p: 6
}, {
  id: "bolt",
  t: "Bolt",
  y: 2008,
  b: "a",
  s: "disney",
  g: ["comedy", "adventure", "animation"],
  tg: ["animals"],
  p: 6
}, {
  id: "meetrobinsons",
  t: "Meet the Robinsons",
  y: 2007,
  b: "k",
  s: "disney",
  g: ["scifi", "comedy", "animation"],
  tg: ["timetravel", "robots", "family"],
  p: 6
},
// ===== Pixar =====
{
  id: "toystory",
  t: "Toy Story",
  y: 1995,
  b: "a",
  s: "pixar",
  g: ["comedy", "adventure", "animation"],
  tg: ["toys", "friendship"],
  p: 9
}, {
  id: "toystory3",
  t: "Toy Story 3",
  y: 2010,
  b: "a",
  s: "pixar",
  g: ["comedy", "adventure", "animation"],
  tg: ["toys", "friendship"],
  p: 8,
  q: "toystory"
}, {
  id: "toystory4",
  t: "Toy Story 4",
  y: 2019,
  b: "a",
  s: "pixar",
  g: ["comedy", "adventure", "animation"],
  tg: ["toys"],
  p: 7,
  q: "toystory3"
}, {
  id: "nemo",
  t: "Finding Nemo",
  y: 2003,
  b: "a",
  s: "pixar",
  g: ["comedy", "adventure", "animation"],
  tg: ["ocean", "animals", "family"],
  p: 9
}, {
  id: "dory",
  t: "Finding Dory",
  y: 2016,
  b: "a",
  s: "pixar",
  g: ["comedy", "adventure", "animation"],
  tg: ["ocean", "animals"],
  p: 8,
  q: "nemo"
}, {
  id: "up",
  t: "Up",
  y: 2009,
  b: "k",
  s: "pixar",
  g: ["comedy", "adventure", "animation"],
  tg: ["animals", "family"],
  p: 8
}, {
  id: "insideout",
  t: "Inside Out",
  y: 2015,
  b: "k",
  s: "pixar",
  g: ["comedy", "drama", "animation"],
  tg: ["feelings", "family"],
  p: 8
}, {
  id: "insideout2",
  t: "Inside Out 2",
  y: 2024,
  b: "k",
  s: "pixar",
  g: ["comedy", "drama", "animation"],
  tg: ["feelings", "school"],
  p: 9,
  q: "insideout"
}, {
  id: "coco",
  t: "Coco",
  y: 2017,
  b: "k",
  s: "pixar",
  g: ["musical", "fantasy", "animation"],
  tg: ["music", "family"],
  p: 9
}, {
  id: "luca",
  t: "Luca",
  y: 2021,
  b: "a",
  s: "pixar",
  g: ["comedy", "adventure", "animation"],
  tg: ["ocean", "friendship"],
  p: 8
}, {
  id: "turningred",
  t: "Turning Red",
  y: 2022,
  b: "t",
  s: "pixar",
  g: ["comedy", "fantasy", "animation"],
  tg: ["school", "music", "animals"],
  p: 7
}, {
  id: "soul",
  t: "Soul",
  y: 2020,
  b: "t",
  s: "pixar",
  g: ["drama", "fantasy", "animation"],
  tg: ["music"],
  p: 6
}, {
  id: "onward",
  t: "Onward",
  y: 2020,
  b: "k",
  s: "pixar",
  g: ["adventure", "fantasy", "animation"],
  tg: ["magic", "family"],
  p: 6
}, {
  id: "brave",
  t: "Brave",
  y: 2012,
  b: "k",
  s: "pixar",
  g: ["adventure", "fantasy", "animation"],
  tg: ["princess", "magic"],
  p: 8
}, {
  id: "monstersinc",
  t: "Monsters, Inc.",
  y: 2001,
  b: "a",
  s: "pixar",
  g: ["comedy", "fantasy", "animation"],
  tg: ["monsters", "friendship"],
  p: 9
}, {
  id: "monstersu",
  t: "Monsters University",
  y: 2013,
  b: "a",
  s: "pixar",
  g: ["comedy", "fantasy", "animation"],
  tg: ["monsters", "school"],
  p: 7
}, {
  id: "incredibles",
  t: "The Incredibles",
  y: 2004,
  b: "k",
  s: "pixar",
  g: ["action", "comedy", "animation"],
  tg: ["superhero", "family"],
  p: 9
}, {
  id: "incredibles2",
  t: "Incredibles 2",
  y: 2018,
  b: "k",
  s: "pixar",
  g: ["action", "comedy", "animation"],
  tg: ["superhero", "family"],
  p: 8,
  q: "incredibles"
}, {
  id: "ratatouille",
  t: "Ratatouille",
  y: 2007,
  b: "k",
  s: "pixar",
  g: ["comedy", "drama", "animation"],
  tg: ["animals", "cooking"],
  p: 8
}, {
  id: "walle",
  t: "WALL-E",
  y: 2008,
  b: "a",
  s: "pixar",
  g: ["scifi", "adventure", "animation"],
  tg: ["robots", "space"],
  p: 8
}, {
  id: "cars",
  t: "Cars",
  y: 2006,
  b: "a",
  s: "pixar",
  g: ["comedy", "adventure", "animation"],
  tg: ["cars"],
  p: 8
}, {
  id: "cars3",
  t: "Cars 3",
  y: 2017,
  b: "a",
  s: "pixar",
  g: ["comedy", "adventure", "animation"],
  tg: ["cars", "sports"],
  p: 6,
  q: "cars"
}, {
  id: "elemental",
  t: "Elemental",
  y: 2023,
  b: "k",
  s: "pixar",
  g: ["comedy", "fantasy", "animation"],
  tg: ["friendship", "family"],
  p: 7
}, {
  id: "bugs",
  t: "A Bug's Life",
  y: 1998,
  b: "a",
  s: "pixar",
  g: ["comedy", "adventure", "animation"],
  tg: ["animals"],
  p: 6
}, {
  id: "elio",
  t: "Elio",
  y: 2025,
  b: "k",
  s: "pixar",
  g: ["scifi", "adventure", "animation"],
  tg: ["space", "friendship"],
  p: 6
}, {
  id: "gooddino",
  t: "The Good Dinosaur",
  y: 2015,
  b: "k",
  s: "pixar",
  g: ["adventure", "animation"],
  tg: ["dinosaurs", "friendship"],
  p: 6
}, {
  id: "lightyear",
  t: "Lightyear",
  y: 2022,
  b: "k",
  s: "pixar",
  g: ["scifi", "action", "animation"],
  tg: ["space", "toys"],
  p: 6
},
// ===== DreamWorks =====
{
  id: "shrek",
  t: "Shrek",
  y: 2001,
  b: "k",
  s: "dreamworks",
  g: ["comedy", "fantasy", "animation"],
  tg: ["monsters", "princess"],
  p: 10
}, {
  id: "shrek2",
  t: "Shrek 2",
  y: 2004,
  b: "k",
  s: "dreamworks",
  g: ["comedy", "fantasy", "animation"],
  tg: ["monsters", "princess"],
  p: 9,
  q: "shrek"
}, {
  id: "httyd",
  t: "How to Train Your Dragon",
  y: 2010,
  b: "k",
  s: "dreamworks",
  g: ["adventure", "fantasy", "animation"],
  tg: ["dragons", "friendship"],
  p: 9
}, {
  id: "httyd2",
  t: "How to Train Your Dragon 2",
  y: 2014,
  b: "k",
  s: "dreamworks",
  g: ["adventure", "fantasy", "animation"],
  tg: ["dragons"],
  p: 8,
  q: "httyd"
}, {
  id: "httyd3",
  t: "HTTYD: The Hidden World",
  y: 2019,
  b: "k",
  s: "dreamworks",
  g: ["adventure", "fantasy", "animation"],
  tg: ["dragons"],
  p: 7,
  q: "httyd2"
}, {
  id: "httydLA",
  t: "How to Train Your Dragon (live action)",
  y: 2025,
  b: "t",
  s: "dreamworks",
  g: ["adventure", "fantasy"],
  tg: ["dragons"],
  p: 8
}, {
  id: "kfp",
  t: "Kung Fu Panda",
  y: 2008,
  b: "k",
  s: "dreamworks",
  g: ["action", "comedy", "animation"],
  tg: ["animals"],
  p: 9
}, {
  id: "kfp4",
  t: "Kung Fu Panda 4",
  y: 2024,
  b: "k",
  s: "dreamworks",
  g: ["action", "comedy", "animation"],
  tg: ["animals"],
  p: 7,
  q: "kfp"
}, {
  id: "madagascar",
  t: "Madagascar",
  y: 2005,
  b: "a",
  s: "dreamworks",
  g: ["comedy", "adventure", "animation"],
  tg: ["animals"],
  p: 8
}, {
  id: "trolls",
  t: "Trolls",
  y: 2016,
  b: "a",
  s: "dreamworks",
  g: ["musical", "comedy", "animation"],
  tg: ["music", "friendship"],
  p: 8
}, {
  id: "trolls3",
  t: "Trolls Band Together",
  y: 2023,
  b: "a",
  s: "dreamworks",
  g: ["musical", "comedy", "animation"],
  tg: ["music"],
  p: 7,
  q: "trolls"
}, {
  id: "badguys",
  t: "The Bad Guys",
  y: 2022,
  b: "k",
  s: "dreamworks",
  g: ["comedy", "action", "animation"],
  tg: ["animals", "spies"],
  p: 8
}, {
  id: "badguys2",
  t: "The Bad Guys 2",
  y: 2025,
  b: "k",
  s: "dreamworks",
  g: ["comedy", "action", "animation"],
  tg: ["animals", "spies"],
  p: 7,
  q: "badguys"
}, {
  id: "puss2",
  t: "Puss in Boots: The Last Wish",
  y: 2022,
  b: "k",
  s: "dreamworks",
  g: ["adventure", "comedy", "animation"],
  tg: ["animals", "magic"],
  p: 9
}, {
  id: "bossbaby",
  t: "The Boss Baby",
  y: 2017,
  b: "a",
  s: "dreamworks",
  g: ["comedy", "animation"],
  tg: ["family"],
  p: 7
}, {
  id: "croods",
  t: "The Croods",
  y: 2013,
  b: "k",
  s: "dreamworks",
  g: ["comedy", "adventure", "animation"],
  tg: ["family", "animals"],
  p: 7
}, {
  id: "megamind",
  t: "Megamind",
  y: 2010,
  b: "k",
  s: "dreamworks",
  g: ["comedy", "action", "animation"],
  tg: ["superhero"],
  p: 7
}, {
  id: "wildrobot",
  t: "The Wild Robot",
  y: 2024,
  b: "k",
  s: "dreamworks",
  g: ["drama", "adventure", "animation"],
  tg: ["robots", "animals"],
  p: 9
}, {
  id: "dogman",
  t: "Dog Man",
  y: 2025,
  b: "a",
  s: "dreamworks",
  g: ["comedy", "action", "animation"],
  tg: ["animals", "superhero"],
  p: 7
}, {
  id: "abominable",
  t: "Abominable",
  y: 2019,
  b: "k",
  s: "dreamworks",
  g: ["adventure", "animation"],
  tg: ["monsters", "friendship"],
  p: 6
}, {
  id: "princeegypt",
  t: "The Prince of Egypt",
  y: 1998,
  b: "k",
  s: "dreamworks",
  g: ["musical", "drama", "animation"],
  tg: ["family", "magic"],
  p: 7
}, {
  id: "spirit",
  t: "Spirit: Stallion of the Cimarron",
  y: 2002,
  b: "k",
  s: "dreamworks",
  g: ["adventure", "animation"],
  tg: ["animals"],
  p: 6
}, {
  id: "overhedge",
  t: "Over the Hedge",
  y: 2006,
  b: "a",
  s: "dreamworks",
  g: ["comedy", "animation"],
  tg: ["animals"],
  p: 6
}, {
  id: "gabby",
  t: "Gabby's Dollhouse: The Movie",
  y: 2025,
  b: "a",
  s: "dreamworks",
  g: ["comedy", "adventure", "animation"],
  tg: ["toys", "animals"],
  p: 6
},
// ===== Illumination =====
{
  id: "dm",
  t: "Despicable Me",
  y: 2010,
  b: "a",
  s: "illumination",
  g: ["comedy", "animation"],
  tg: ["minions", "family"],
  p: 9
}, {
  id: "dm4",
  t: "Despicable Me 4",
  y: 2024,
  b: "a",
  s: "illumination",
  g: ["comedy", "animation"],
  tg: ["minions", "family"],
  p: 7,
  q: "dm"
}, {
  id: "minions",
  t: "Minions",
  y: 2015,
  b: "a",
  s: "illumination",
  g: ["comedy", "animation"],
  tg: ["minions"],
  p: 9
}, {
  id: "minions2",
  t: "Minions: The Rise of Gru",
  y: 2022,
  b: "a",
  s: "illumination",
  g: ["comedy", "animation"],
  tg: ["minions"],
  p: 8,
  q: "minions"
}, {
  id: "sing",
  t: "Sing",
  y: 2016,
  b: "a",
  s: "illumination",
  g: ["musical", "comedy", "animation"],
  tg: ["music", "animals"],
  p: 9
}, {
  id: "sing2",
  t: "Sing 2",
  y: 2021,
  b: "a",
  s: "illumination",
  g: ["musical", "comedy", "animation"],
  tg: ["music", "animals"],
  p: 8,
  q: "sing"
}, {
  id: "pets",
  t: "The Secret Life of Pets",
  y: 2016,
  b: "a",
  s: "illumination",
  g: ["comedy", "animation"],
  tg: ["animals"],
  p: 8
}, {
  id: "mario",
  t: "The Super Mario Bros. Movie",
  y: 2023,
  b: "a",
  s: "illumination",
  g: ["adventure", "comedy", "animation"],
  tg: ["videogames"],
  p: 10
}, {
  id: "lorax",
  t: "The Lorax",
  y: 2012,
  b: "a",
  s: "illumination",
  g: ["musical", "comedy", "animation"],
  tg: ["animals"],
  p: 6
}, {
  id: "migration",
  t: "Migration",
  y: 2023,
  b: "a",
  s: "illumination",
  g: ["comedy", "adventure", "animation"],
  tg: ["animals"],
  p: 6
}, {
  id: "grinch",
  t: "The Grinch",
  y: 2018,
  b: "a",
  s: "illumination",
  g: ["comedy", "animation"],
  tg: ["christmas"],
  p: 8
},
// ===== Sony / Netflix / other animation =====
{
  id: "spiderverse",
  t: "Spider-Man: Into the Spider-Verse",
  y: 2018,
  b: "t",
  s: "sony",
  g: ["action", "animation"],
  tg: ["superhero"],
  p: 9
}, {
  id: "acrossverse",
  t: "Spider-Man: Across the Spider-Verse",
  y: 2023,
  b: "t",
  s: "sony",
  g: ["action", "animation"],
  tg: ["superhero"],
  p: 9,
  q: "spiderverse"
}, {
  id: "hotelt",
  t: "Hotel Transylvania",
  y: 2012,
  b: "a",
  s: "sony",
  g: ["comedy", "animation"],
  tg: ["monsters", "spooky", "family"],
  p: 8
}, {
  id: "cloudy",
  t: "Cloudy with a Chance of Meatballs",
  y: 2009,
  b: "a",
  s: "sony",
  g: ["comedy", "scifi", "animation"],
  tg: ["cooking"],
  p: 7
}, {
  id: "mitchells",
  t: "The Mitchells vs. the Machines",
  y: 2021,
  b: "k",
  s: "netflix",
  g: ["comedy", "scifi", "animation"],
  tg: ["robots", "family"],
  p: 8
}, {
  id: "kpop",
  t: "KPop Demon Hunters",
  y: 2025,
  b: "t",
  s: "netflix",
  g: ["musical", "action", "animation"],
  tg: ["music", "monsters"],
  p: 10
}, {
  id: "seabeast",
  t: "The Sea Beast",
  y: 2022,
  b: "k",
  s: "netflix",
  g: ["adventure", "animation"],
  tg: ["ocean", "monsters"],
  p: 7
}, {
  id: "nimona",
  t: "Nimona",
  y: 2023,
  b: "t",
  s: "netflix",
  g: ["action", "fantasy", "animation"],
  tg: ["monsters", "friendship"],
  p: 7
}, {
  id: "klaus",
  t: "Klaus",
  y: 2019,
  b: "a",
  s: "netflix",
  g: ["comedy", "animation"],
  tg: ["christmas", "friendship"],
  p: 8
}, {
  id: "leo",
  t: "Leo",
  y: 2023,
  b: "a",
  s: "netflix",
  g: ["comedy", "animation"],
  tg: ["animals", "school"],
  p: 6
}, {
  id: "lego",
  t: "The Lego Movie",
  y: 2014,
  b: "k",
  s: "wb",
  g: ["comedy", "adventure", "animation"],
  tg: ["toys"],
  p: 8
}, {
  id: "legobatman",
  t: "The Lego Batman Movie",
  y: 2017,
  b: "k",
  s: "wb",
  g: ["comedy", "action", "animation"],
  tg: ["superhero", "toys"],
  p: 7
}, {
  id: "happyfeet",
  t: "Happy Feet",
  y: 2006,
  b: "a",
  s: "wb",
  g: ["musical", "comedy", "animation"],
  tg: ["animals", "music"],
  p: 6
}, {
  id: "irongiant",
  t: "The Iron Giant",
  y: 1999,
  b: "k",
  s: "wb",
  g: ["scifi", "drama", "animation"],
  tg: ["robots", "friendship"],
  p: 7
}, {
  id: "spacejam",
  t: "Space Jam",
  y: 1996,
  b: "k",
  s: "wb",
  g: ["comedy", "sports", "animation"],
  tg: ["sports", "animals"],
  p: 7
}, {
  id: "rio",
  t: "Rio",
  y: 2011,
  b: "a",
  s: "bluesky",
  g: ["musical", "comedy", "animation"],
  tg: ["animals", "music"],
  p: 7
}, {
  id: "iceage",
  t: "Ice Age",
  y: 2002,
  b: "a",
  s: "bluesky",
  g: ["comedy", "adventure", "animation"],
  tg: ["animals", "dinosaurs"],
  p: 8
}, {
  id: "ferdinand",
  t: "Ferdinand",
  y: 2017,
  b: "a",
  s: "bluesky",
  g: ["comedy", "animation"],
  tg: ["animals"],
  p: 6
}, {
  id: "horton",
  t: "Horton Hears a Who!",
  y: 2008,
  b: "a",
  s: "bluesky",
  g: ["comedy", "animation"],
  tg: ["animals"],
  p: 6
}, {
  id: "anastasia",
  t: "Anastasia",
  y: 1997,
  b: "k",
  s: "fox",
  g: ["musical", "fantasy", "animation"],
  tg: ["princess", "magic"],
  p: 7
}, {
  id: "flow",
  t: "Flow",
  y: 2024,
  b: "t",
  s: "indie",
  g: ["drama", "adventure", "animation"],
  tg: ["animals", "survival"],
  p: 6
}, {
  id: "wallace",
  t: "Wallace & Gromit: Vengeance Most Fowl",
  y: 2024,
  b: "a",
  s: "aardman",
  g: ["comedy", "animation"],
  tg: ["animals", "detective"],
  p: 7
}, {
  id: "chickenrun",
  t: "Chicken Run",
  y: 2000,
  b: "k",
  s: "aardman",
  g: ["comedy", "adventure", "animation"],
  tg: ["animals"],
  p: 6
}, {
  id: "shaun",
  t: "Shaun the Sheep Movie",
  y: 2015,
  b: "a",
  s: "aardman",
  g: ["comedy", "animation"],
  tg: ["animals"],
  p: 6
}, {
  id: "spongebob",
  t: "The SpongeBob SquarePants Movie",
  y: 2004,
  b: "a",
  s: "nick",
  g: ["comedy", "animation"],
  tg: ["ocean", "friendship"],
  p: 7
}, {
  id: "pawpatrol",
  t: "PAW Patrol: The Movie",
  y: 2021,
  b: "a",
  s: "nick",
  g: ["adventure", "comedy", "animation"],
  tg: ["animals", "friendship"],
  p: 7
}, {
  id: "smurfs25",
  t: "Smurfs",
  y: 2025,
  b: "a",
  s: "live",
  g: ["musical", "comedy", "animation"],
  tg: ["magic", "music"],
  p: 6
}, {
  id: "pokemon1",
  t: "Pokémon: The First Movie",
  y: 1998,
  b: "k",
  s: "live",
  g: ["adventure", "animation"],
  tg: ["videogames", "monsters", "anime"],
  p: 7
}, {
  id: "doraemon",
  t: "Stand by Me Doraemon",
  y: 2014,
  b: "a",
  s: "live",
  g: ["comedy", "drama", "animation"],
  tg: ["anime", "japan", "robots", "friendship"],
  p: 7
},
// ===== More family: stop-motion & live-action classics =====
{
  id: "coraline",
  t: "Coraline",
  y: 2009,
  b: "t",
  s: "laika",
  g: ["fantasy", "animation"],
  tg: ["magic", "spooky"],
  p: 7
}, {
  id: "kubo",
  t: "Kubo and the Two Strings",
  y: 2016,
  b: "t",
  s: "laika",
  g: ["fantasy", "adventure", "animation"],
  tg: ["magic", "music", "japan"],
  p: 7
}, {
  id: "paranorman",
  t: "ParaNorman",
  y: 2012,
  b: "t",
  s: "laika",
  g: ["comedy", "fantasy", "animation"],
  tg: ["spooky", "monsters"],
  p: 6
}, {
  id: "boxtrolls",
  t: "The Boxtrolls",
  y: 2014,
  b: "k",
  s: "laika",
  g: ["comedy", "fantasy", "animation"],
  tg: ["monsters"],
  p: 6
}, {
  id: "nightmarebc",
  t: "The Nightmare Before Christmas",
  y: 1993,
  b: "t",
  s: "disney",
  g: ["musical", "fantasy", "animation"],
  tg: ["christmas", "spooky"],
  p: 8
}, {
  id: "riseguardians",
  t: "Rise of the Guardians",
  y: 2012,
  b: "k",
  s: "dreamworks",
  g: ["fantasy", "adventure", "animation"],
  tg: ["christmas", "magic"],
  p: 6
}, {
  id: "captainunderpants",
  t: "Captain Underpants: The First Epic Movie",
  y: 2017,
  b: "a",
  s: "dreamworks",
  g: ["comedy", "animation"],
  tg: ["superhero", "school"],
  p: 6
}, {
  id: "luck",
  t: "Luck",
  y: 2022,
  b: "a",
  s: "live",
  g: ["comedy", "fantasy", "animation"],
  tg: ["magic"],
  p: 6
}, {
  id: "babe",
  t: "Babe",
  y: 1995,
  b: "a",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["animals"],
  p: 7
}, {
  id: "freewilly",
  t: "Free Willy",
  y: 1993,
  b: "k",
  s: "live",
  g: ["drama", "adventure"],
  tg: ["ocean", "animals", "friendship"],
  p: 6
}, {
  id: "willywonka71",
  t: "Willy Wonka & the Chocolate Factory",
  y: 1971,
  b: "k",
  s: "live",
  g: ["musical", "fantasy"],
  tg: ["cooking", "magic"],
  p: 7
}, {
  id: "addams",
  t: "The Addams Family",
  y: 1991,
  b: "t",
  s: "live",
  g: ["comedy", "fantasy"],
  tg: ["spooky", "family"],
  p: 7
}, {
  id: "clue",
  t: "Clue",
  y: 1985,
  b: "t",
  s: "live",
  g: ["comedy", "mystery"],
  tg: ["detective"],
  p: 6
}, {
  id: "junglebook16",
  t: "The Jungle Book (live action)",
  y: 2016,
  b: "k",
  s: "disney",
  g: ["adventure", "fantasy"],
  tg: ["animals"],
  p: 7
}, {
  id: "maleficent",
  t: "Maleficent",
  y: 2014,
  b: "t",
  s: "disney",
  g: ["fantasy", "adventure"],
  tg: ["magic", "princess"],
  p: 7
}, {
  id: "cruella",
  t: "Cruella",
  y: 2021,
  b: "x",
  s: "disney",
  g: ["comedy", "crime", "drama"],
  tg: ["animals"],
  p: 7
}, {
  id: "nationaltreasure",
  t: "National Treasure",
  y: 2004,
  b: "t",
  s: "live",
  g: ["adventure", "mystery"],
  tg: ["detective", "heist"],
  p: 7
}, {
  id: "tron",
  t: "TRON: Legacy",
  y: 2010,
  b: "t",
  s: "disney",
  g: ["scifi", "action"],
  tg: ["videogames"],
  p: 6
}, {
  id: "realsteel",
  t: "Real Steel",
  y: 2011,
  b: "t",
  s: "live",
  g: ["action", "drama"],
  tg: ["robots", "sports", "family"],
  p: 7
}, {
  id: "galaxyquest",
  t: "Galaxy Quest",
  y: 1999,
  b: "t",
  s: "live",
  g: ["comedy", "scifi"],
  tg: ["space", "aliens"],
  p: 7
},
// ===== Studio Ghibli =====
{
  id: "totoro",
  t: "My Neighbor Totoro",
  y: 1988,
  b: "a",
  s: "ghibli",
  g: ["fantasy", "animation"],
  tg: ["japan", "animals", "sisters"],
  p: 9
}, {
  id: "kiki",
  t: "Kiki's Delivery Service",
  y: 1989,
  b: "a",
  s: "ghibli",
  g: ["fantasy", "adventure", "animation"],
  tg: ["japan", "magic"],
  p: 8
}, {
  id: "ponyo",
  t: "Ponyo",
  y: 2008,
  b: "a",
  s: "ghibli",
  g: ["fantasy", "animation"],
  tg: ["japan", "ocean"],
  p: 8
}, {
  id: "spirited",
  t: "Spirited Away",
  y: 2001,
  b: "t",
  s: "ghibli",
  g: ["fantasy", "adventure", "animation"],
  tg: ["japan", "magic", "monsters"],
  p: 9
}, {
  id: "howl",
  t: "Howl's Moving Castle",
  y: 2004,
  b: "t",
  s: "ghibli",
  g: ["fantasy", "adventure", "animation"],
  tg: ["japan", "magic"],
  p: 8
}, {
  id: "castlesky",
  t: "Castle in the Sky",
  y: 1986,
  b: "k",
  s: "ghibli",
  g: ["adventure", "fantasy", "animation"],
  tg: ["japan", "robots"],
  p: 7
}, {
  id: "arrietty",
  t: "The Secret World of Arrietty",
  y: 2010,
  b: "a",
  s: "ghibli",
  g: ["fantasy", "animation"],
  tg: ["japan", "friendship"],
  p: 7
}, {
  id: "nausicaa",
  t: "Nausicaä of the Valley of the Wind",
  y: 1984,
  b: "t",
  s: "ghibli",
  g: ["adventure", "fantasy", "animation"],
  tg: ["japan", "monsters", "war"],
  p: 7
}, {
  id: "mononoke",
  t: "Princess Mononoke",
  y: 1997,
  b: "x",
  s: "ghibli",
  g: ["fantasy", "adventure", "animation"],
  tg: ["japan", "magic", "war"],
  p: 8
}, {
  id: "heron",
  t: "The Boy and the Heron",
  y: 2023,
  b: "x",
  s: "ghibli",
  g: ["fantasy", "drama", "animation"],
  tg: ["japan", "magic"],
  p: 6
}, {
  id: "porco",
  t: "Porco Rosso",
  y: 1992,
  b: "k",
  s: "ghibli",
  g: ["adventure", "comedy", "animation"],
  tg: ["japan"],
  p: 6
}, {
  id: "whisper",
  t: "Whisper of the Heart",
  y: 1995,
  b: "t",
  s: "ghibli",
  g: ["romance", "drama", "animation"],
  tg: ["japan", "music", "school"],
  p: 6
}, {
  id: "marnie",
  t: "When Marnie Was There",
  y: 2014,
  b: "t",
  s: "ghibli",
  g: ["drama", "mystery", "animation"],
  tg: ["japan", "friendship"],
  p: 6
},
// ===== Live-action family =====
{
  id: "homealone",
  t: "Home Alone",
  y: 1990,
  b: "k",
  s: "live",
  g: ["comedy"],
  tg: ["christmas", "family"],
  p: 9
}, {
  id: "elf",
  t: "Elf",
  y: 2003,
  b: "a",
  s: "live",
  g: ["comedy", "fantasy"],
  tg: ["christmas"],
  p: 8
}, {
  id: "hp1",
  t: "Harry Potter and the Sorcerer's Stone",
  y: 2001,
  b: "t",
  s: "live",
  g: ["fantasy", "adventure"],
  tg: ["magic", "school"],
  p: 10
}, {
  id: "hp3",
  t: "Harry Potter and the Prisoner of Azkaban",
  y: 2004,
  b: "x",
  s: "live",
  g: ["fantasy", "adventure"],
  tg: ["magic", "school"],
  p: 8,
  q: "hp1"
}, {
  id: "matilda",
  t: "Matilda",
  y: 1996,
  b: "k",
  s: "live",
  g: ["comedy", "fantasy"],
  tg: ["school", "magic"],
  p: 8
}, {
  id: "matildamus",
  t: "Matilda the Musical",
  y: 2022,
  b: "k",
  s: "netflix",
  g: ["musical", "comedy"],
  tg: ["school", "magic"],
  p: 7
}, {
  id: "wizardoz",
  t: "The Wizard of Oz",
  y: 1939,
  b: "a",
  s: "live",
  g: ["musical", "fantasy"],
  tg: ["magic"],
  p: 7
}, {
  id: "et",
  t: "E.T. the Extra-Terrestrial",
  y: 1982,
  b: "k",
  s: "live",
  g: ["scifi", "drama"],
  tg: ["space", "friendship", "aliens"],
  p: 7
}, {
  id: "jumanji",
  t: "Jumanji",
  y: 1995,
  b: "t",
  s: "live",
  g: ["adventure", "fantasy"],
  tg: ["animals", "magic"],
  p: 7
}, {
  id: "jumanji2",
  t: "Jumanji: Welcome to the Jungle",
  y: 2017,
  b: "x",
  s: "live",
  g: ["adventure", "comedy"],
  tg: ["videogames"],
  p: 8
}, {
  id: "natm",
  t: "Night at the Museum",
  y: 2006,
  b: "k",
  s: "live",
  g: ["comedy", "fantasy"],
  tg: ["dinosaurs", "magic"],
  p: 8
}, {
  id: "parenttrap",
  t: "The Parent Trap",
  y: 1998,
  b: "k",
  s: "live",
  g: ["comedy"],
  tg: ["family", "sisters"],
  p: 8
}, {
  id: "freaky",
  t: "Freaky Friday",
  y: 2003,
  b: "t",
  s: "live",
  g: ["comedy", "fantasy"],
  tg: ["family", "music"],
  p: 7
}, {
  id: "princessd",
  t: "The Princess Diaries",
  y: 2001,
  b: "t",
  s: "live",
  g: ["comedy"],
  tg: ["princess", "school"],
  p: 7
}, {
  id: "showman",
  t: "The Greatest Showman",
  y: 2017,
  b: "t",
  s: "live",
  g: ["musical", "drama"],
  tg: ["music"],
  p: 8
}, {
  id: "wonka",
  t: "Wonka",
  y: 2023,
  b: "k",
  s: "live",
  g: ["musical", "fantasy"],
  tg: ["magic", "cooking"],
  p: 8
}, {
  id: "charlie",
  t: "Charlie and the Chocolate Factory",
  y: 2005,
  b: "k",
  s: "live",
  g: ["fantasy", "comedy"],
  tg: ["cooking", "magic"],
  p: 7
}, {
  id: "sonic",
  t: "Sonic the Hedgehog",
  y: 2020,
  b: "k",
  s: "live",
  g: ["action", "comedy"],
  tg: ["videogames"],
  p: 8
}, {
  id: "sonic3",
  t: "Sonic the Hedgehog 3",
  y: 2024,
  b: "k",
  s: "live",
  g: ["action", "comedy"],
  tg: ["videogames"],
  p: 8,
  q: "sonic"
}, {
  id: "pikachu",
  t: "Pokémon Detective Pikachu",
  y: 2019,
  b: "t",
  s: "live",
  g: ["mystery", "adventure"],
  tg: ["videogames", "detective", "animals"],
  p: 7
}, {
  id: "minecraft",
  t: "A Minecraft Movie",
  y: 2025,
  b: "t",
  s: "live",
  g: ["adventure", "comedy"],
  tg: ["videogames"],
  p: 8
}, {
  id: "wicked",
  t: "Wicked",
  y: 2024,
  b: "t",
  s: "live",
  g: ["musical", "fantasy"],
  tg: ["magic", "music"],
  p: 9
}, {
  id: "wicked2",
  t: "Wicked: For Good",
  y: 2025,
  b: "t",
  s: "live",
  g: ["musical", "fantasy"],
  tg: ["magic", "music"],
  p: 8,
  q: "wicked"
}, {
  id: "spykids",
  t: "Spy Kids",
  y: 2001,
  b: "k",
  s: "live",
  g: ["action", "comedy"],
  tg: ["spies", "family"],
  p: 7
}, {
  id: "schoolrock",
  t: "School of Rock",
  y: 2003,
  b: "t",
  s: "live",
  g: ["comedy", "musical"],
  tg: ["music", "school"],
  p: 7
}, {
  id: "coolrun",
  t: "Cool Runnings",
  y: 1993,
  b: "t",
  s: "live",
  g: ["comedy", "sports"],
  tg: ["friendship"],
  p: 6
}, {
  id: "goonies",
  t: "The Goonies",
  y: 1985,
  b: "x",
  s: "live",
  g: ["adventure", "comedy"],
  tg: ["friendship"],
  p: 7
}, {
  id: "holes",
  t: "Holes",
  y: 2003,
  b: "t",
  s: "live",
  g: ["adventure", "mystery"],
  tg: ["friendship", "detective"],
  p: 6
}, {
  id: "wonder",
  t: "Wonder",
  y: 2017,
  b: "t",
  s: "live",
  g: ["drama"],
  tg: ["school", "family", "friendship"],
  p: 7
}, {
  id: "princessbride",
  t: "The Princess Bride",
  y: 1987,
  b: "t",
  s: "live",
  g: ["adventure", "comedy", "fantasy"],
  tg: ["princess", "magic"],
  p: 8
}, {
  id: "soundmusic",
  t: "The Sound of Music",
  y: 1965,
  b: "k",
  s: "live",
  g: ["musical", "drama"],
  tg: ["music", "family"],
  p: 7
}, {
  id: "singinrain",
  t: "Singin' in the Rain",
  y: 1952,
  b: "k",
  s: "live",
  g: ["musical", "comedy", "romance"],
  tg: ["music"],
  p: 7
}, {
  id: "paddington",
  t: "Paddington",
  y: 2014,
  b: "a",
  s: "live",
  g: ["comedy", "adventure"],
  tg: ["animals", "family"],
  p: 9
}, {
  id: "paddington2",
  t: "Paddington 2",
  y: 2017,
  b: "a",
  s: "live",
  g: ["comedy", "adventure"],
  tg: ["animals", "family"],
  p: 9,
  q: "paddington"
}, {
  id: "paddington3",
  t: "Paddington in Peru",
  y: 2024,
  b: "a",
  s: "live",
  g: ["comedy", "adventure"],
  tg: ["animals"],
  p: 7,
  q: "paddington2"
}, {
  id: "mrsdoubtfire",
  t: "Mrs. Doubtfire",
  y: 1993,
  b: "t",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["family"],
  p: 8
}, {
  id: "peterrabbit",
  t: "Peter Rabbit",
  y: 2018,
  b: "a",
  s: "live",
  g: ["comedy", "adventure"],
  tg: ["animals"],
  p: 6
}, {
  id: "stuartlittle",
  t: "Stuart Little",
  y: 1999,
  b: "a",
  s: "live",
  g: ["comedy", "adventure"],
  tg: ["animals", "family"],
  p: 6
}, {
  id: "casper",
  t: "Casper",
  y: 1995,
  b: "k",
  s: "live",
  g: ["comedy", "fantasy"],
  tg: ["spooky", "friendship"],
  p: 6
}, {
  id: "ghostbusters",
  t: "Ghostbusters",
  y: 1984,
  b: "x",
  s: "live",
  g: ["comedy", "fantasy"],
  tg: ["monsters", "spooky"],
  p: 8
}, {
  id: "mib",
  t: "Men in Black",
  y: 1997,
  b: "x",
  s: "live",
  g: ["scifi", "comedy"],
  tg: ["aliens", "detective"],
  p: 8
}, {
  id: "hiddenfigures",
  t: "Hidden Figures",
  y: 2016,
  b: "t",
  s: "live",
  g: ["drama"],
  tg: ["space"],
  p: 7
}, {
  id: "waltermitty",
  t: "The Secret Life of Walter Mitty",
  y: 2013,
  b: "t",
  s: "live",
  g: ["adventure", "comedy", "drama"],
  tg: [],
  p: 7
}, {
  id: "erastour",
  t: "Taylor Swift: The Eras Tour",
  y: 2023,
  b: "t",
  s: "live",
  g: ["musical"],
  tg: ["music"],
  p: 8
},
// ===== Teens (12+) =====
{
  id: "meangirls",
  t: "Mean Girls",
  y: 2004,
  b: "x",
  s: "live",
  g: ["comedy"],
  tg: ["school"],
  p: 8
}, {
  id: "clueless",
  t: "Clueless",
  y: 1995,
  b: "x",
  s: "live",
  g: ["comedy", "romance"],
  tg: ["school"],
  p: 7
}, {
  id: "tenthings",
  t: "10 Things I Hate About You",
  y: 1999,
  b: "x",
  s: "live",
  g: ["comedy", "romance"],
  tg: ["school", "music"],
  p: 7
}, {
  id: "ferris",
  t: "Ferris Bueller's Day Off",
  y: 1986,
  b: "x",
  s: "live",
  g: ["comedy"],
  tg: ["school", "cars"],
  p: 7
}, {
  id: "legallyblonde",
  t: "Legally Blonde",
  y: 2001,
  b: "x",
  s: "live",
  g: ["comedy"],
  tg: ["school"],
  p: 7
}, {
  id: "tatb",
  t: "To All the Boys I've Loved Before",
  y: 2018,
  b: "x",
  s: "netflix",
  g: ["romance", "comedy"],
  tg: ["school"],
  p: 7
}, {
  id: "faultstars",
  t: "The Fault in Our Stars",
  y: 2014,
  b: "x",
  s: "live",
  g: ["romance", "drama"],
  tg: ["school"],
  p: 7
}, {
  id: "singstreet",
  t: "Sing Street",
  y: 2016,
  b: "x",
  s: "live",
  g: ["musical", "comedy", "romance"],
  tg: ["music", "school"],
  p: 6
}, {
  id: "twilight",
  t: "Twilight",
  y: 2008,
  b: "x",
  s: "live",
  g: ["romance", "fantasy"],
  tg: ["monsters", "school"],
  p: 7
}, {
  id: "hunger",
  t: "The Hunger Games",
  y: 2012,
  b: "x",
  s: "live",
  g: ["action", "scifi", "drama"],
  tg: ["survival"],
  p: 8
}, {
  id: "mazerunner",
  t: "The Maze Runner",
  y: 2014,
  b: "x",
  s: "live",
  g: ["scifi", "action"],
  tg: ["survival"],
  p: 6
}, {
  id: "percy",
  t: "Percy Jackson: The Lightning Thief",
  y: 2010,
  b: "x",
  s: "live",
  g: ["fantasy", "adventure"],
  tg: ["magic", "monsters"],
  p: 6
}, {
  id: "barbie",
  t: "Barbie",
  y: 2023,
  b: "x",
  s: "live",
  g: ["comedy", "fantasy"],
  tg: ["toys", "music"],
  p: 8
}, {
  id: "backfuture",
  t: "Back to the Future",
  y: 1985,
  b: "x",
  s: "live",
  g: ["scifi", "comedy", "adventure"],
  tg: ["cars", "school", "timetravel"],
  p: 8
}, {
  id: "jurassic",
  t: "Jurassic Park",
  y: 1993,
  b: "x",
  s: "live",
  g: ["scifi", "adventure"],
  tg: ["dinosaurs"],
  p: 8
}, {
  id: "jworld",
  t: "Jurassic World",
  y: 2015,
  b: "x",
  s: "live",
  g: ["scifi", "action"],
  tg: ["dinosaurs"],
  p: 7,
  q: "jurassic"
}, {
  id: "freeguy",
  t: "Free Guy",
  y: 2021,
  b: "x",
  s: "live",
  g: ["comedy", "scifi", "action"],
  tg: ["videogames"],
  p: 7
}, {
  id: "pitchperfect",
  t: "Pitch Perfect",
  y: 2012,
  b: "x",
  s: "live",
  g: ["comedy", "musical"],
  tg: ["music", "school"],
  p: 7
}, {
  id: "mammamia",
  t: "Mamma Mia!",
  y: 2008,
  b: "x",
  s: "live",
  g: ["musical", "comedy"],
  tg: ["music", "family"],
  p: 7
}, {
  id: "enola",
  t: "Enola Holmes",
  y: 2020,
  b: "x",
  s: "netflix",
  g: ["mystery", "adventure"],
  tg: ["detective"],
  p: 7
}, {
  id: "karatekid",
  t: "The Karate Kid",
  y: 2010,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: ["sports", "school"],
  p: 6
}, {
  id: "nowayhome",
  t: "Spider-Man: No Way Home",
  y: 2021,
  b: "x",
  s: "live",
  g: ["action", "scifi"],
  tg: ["superhero"],
  p: 9,
  q: "farfromhome"
}, {
  id: "homecoming",
  t: "Spider-Man: Homecoming",
  y: 2017,
  b: "x",
  s: "live",
  g: ["action", "comedy"],
  tg: ["superhero", "school"],
  p: 8
}, {
  id: "farfromhome",
  t: "Spider-Man: Far From Home",
  y: 2019,
  b: "x",
  s: "live",
  g: ["action", "comedy"],
  tg: ["superhero", "school"],
  p: 8,
  q: "homecoming"
}, {
  id: "blackpanther",
  t: "Black Panther",
  y: 2018,
  b: "x",
  s: "live",
  g: ["action", "scifi"],
  tg: ["superhero"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "wonderwoman",
  t: "Wonder Woman",
  y: 2017,
  b: "x",
  s: "live",
  g: ["action", "fantasy"],
  tg: ["superhero", "war"],
  p: 7
}, {
  id: "gotg",
  t: "Guardians of the Galaxy",
  y: 2014,
  b: "x",
  s: "live",
  g: ["action", "comedy", "scifi"],
  tg: ["space", "superhero", "music"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "avengers",
  t: "The Avengers",
  y: 2012,
  b: "x",
  s: "live",
  g: ["action", "scifi"],
  tg: ["superhero"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "infinitywar",
  t: "Avengers: Infinity War",
  y: 2018,
  b: "x",
  s: "live",
  g: ["action", "scifi"],
  tg: ["superhero", "space"],
  p: 9,
  jp: ["disneyplus"],
  q: "avengers"
}, {
  id: "endgame",
  t: "Avengers: Endgame",
  y: 2019,
  b: "x",
  s: "live",
  g: ["action", "scifi"],
  tg: ["superhero", "timetravel"],
  p: 9,
  jp: ["disneyplus"],
  q: "infinitywar"
}, {
  id: "ironman",
  t: "Iron Man",
  y: 2008,
  b: "x",
  s: "live",
  g: ["action", "scifi"],
  tg: ["superhero", "robots"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "wintersoldier",
  t: "Captain America: The Winter Soldier",
  y: 2014,
  b: "x",
  s: "live",
  g: ["action", "thriller"],
  tg: ["superhero", "spies"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "thorrag",
  t: "Thor: Ragnarok",
  y: 2017,
  b: "x",
  s: "live",
  g: ["action", "comedy"],
  tg: ["superhero", "space"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "captainmarvel",
  t: "Captain Marvel",
  y: 2019,
  b: "x",
  s: "live",
  g: ["action", "scifi"],
  tg: ["superhero", "space"],
  p: 7,
  jp: ["disneyplus"]
}, {
  id: "shangchi",
  t: "Shang-Chi",
  y: 2021,
  b: "x",
  s: "live",
  g: ["action", "fantasy"],
  tg: ["superhero", "dragons"],
  p: 7,
  jp: ["disneyplus"]
}, {
  id: "superman25",
  t: "Superman",
  y: 2025,
  b: "x",
  s: "live",
  g: ["action", "scifi"],
  tg: ["superhero", "aliens"],
  p: 8
}, {
  id: "aquaman",
  t: "Aquaman",
  y: 2018,
  b: "x",
  s: "live",
  g: ["action", "fantasy"],
  tg: ["superhero", "ocean"],
  p: 7
}, {
  id: "transformers",
  t: "Transformers",
  y: 2007,
  b: "x",
  s: "live",
  g: ["action", "scifi"],
  tg: ["robots", "cars"],
  p: 7
}, {
  id: "pacificrim",
  t: "Pacific Rim",
  y: 2013,
  b: "x",
  s: "live",
  g: ["action", "scifi"],
  tg: ["robots", "monsters"],
  p: 6
}, {
  id: "gxk",
  t: "Godzilla x Kong: The New Empire",
  y: 2024,
  b: "x",
  s: "live",
  g: ["action", "scifi"],
  tg: ["monsters"],
  p: 7
}, {
  id: "readyplayer",
  t: "Ready Player One",
  y: 2018,
  b: "x",
  s: "live",
  g: ["scifi", "adventure"],
  tg: ["videogames"],
  p: 7
}, {
  id: "edgetomorrow",
  t: "Edge of Tomorrow",
  y: 2014,
  b: "x",
  s: "live",
  g: ["scifi", "action"],
  tg: ["aliens", "timetravel", "war"],
  p: 7
}, {
  id: "starwars4",
  t: "Star Wars: A New Hope",
  y: 1977,
  b: "x",
  s: "live",
  g: ["scifi", "adventure"],
  tg: ["space", "aliens"],
  p: 9,
  jp: ["disneyplus"]
}, {
  id: "empire",
  t: "The Empire Strikes Back",
  y: 1980,
  b: "x",
  s: "live",
  g: ["scifi", "adventure"],
  tg: ["space"],
  p: 8,
  jp: ["disneyplus"],
  q: "starwars4"
}, {
  id: "forceawakens",
  t: "Star Wars: The Force Awakens",
  y: 2015,
  b: "x",
  s: "live",
  g: ["scifi", "action"],
  tg: ["space"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "rogueone",
  t: "Rogue One: A Star Wars Story",
  y: 2016,
  b: "x",
  s: "live",
  g: ["scifi", "action"],
  tg: ["space", "war"],
  p: 7,
  jp: ["disneyplus"]
}, {
  id: "lotr1",
  t: "LOTR: The Fellowship of the Ring",
  y: 2001,
  b: "x",
  s: "live",
  g: ["fantasy", "adventure"],
  tg: ["magic", "war"],
  p: 9
}, {
  id: "lotr3",
  t: "LOTR: The Return of the King",
  y: 2003,
  b: "x",
  s: "live",
  g: ["fantasy", "adventure"],
  tg: ["magic", "war"],
  p: 9,
  q: "lotr1"
}, {
  id: "hobbit",
  t: "The Hobbit: An Unexpected Journey",
  y: 2012,
  b: "x",
  s: "live",
  g: ["fantasy", "adventure"],
  tg: ["dragons", "magic"],
  p: 7
}, {
  id: "dune",
  t: "Dune",
  y: 2021,
  b: "x",
  s: "live",
  g: ["scifi", "adventure"],
  tg: ["space", "survival"],
  p: 8
}, {
  id: "dune2",
  t: "Dune: Part Two",
  y: 2024,
  b: "x",
  s: "live",
  g: ["scifi", "action"],
  tg: ["space", "war"],
  p: 9,
  q: "dune"
}, {
  id: "avatar",
  t: "Avatar",
  y: 2009,
  b: "x",
  s: "live",
  g: ["scifi", "adventure"],
  tg: ["aliens", "war"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "avatar2",
  t: "Avatar: The Way of Water",
  y: 2022,
  b: "x",
  s: "live",
  g: ["scifi", "adventure"],
  tg: ["ocean", "aliens"],
  p: 8,
  jp: ["disneyplus"],
  q: "avatar"
}, {
  id: "avatar3",
  t: "Avatar: Fire and Ash",
  y: 2025,
  b: "x",
  s: "live",
  g: ["scifi", "adventure"],
  tg: ["aliens", "war"],
  p: 8,
  jp: ["disneyplus"],
  q: "avatar2"
}, {
  id: "topgun",
  t: "Top Gun: Maverick",
  y: 2022,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: ["war"],
  p: 9
}, {
  id: "f1",
  t: "F1: The Movie",
  y: 2025,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: ["cars", "sports"],
  p: 8
}, {
  id: "rrr",
  t: "RRR",
  y: 2022,
  b: "x",
  s: "netflix",
  g: ["action", "drama", "musical"],
  tg: ["friendship", "war", "music"],
  p: 8
}, {
  id: "godzillaminus",
  t: "Godzilla Minus One",
  y: 2023,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: ["monsters", "japan", "war"],
  p: 8
}, {
  id: "shingodzilla",
  t: "Shin Godzilla",
  y: 2016,
  b: "x",
  s: "live",
  g: ["action", "scifi", "drama"],
  tg: ["monsters", "japan"],
  p: 7
}, {
  id: "yourname",
  t: "Your Name",
  y: 2016,
  b: "x",
  s: "live",
  g: ["romance", "fantasy", "animation"],
  tg: ["anime", "japan", "timetravel"],
  p: 9
}, {
  id: "suzume",
  t: "Suzume",
  y: 2022,
  b: "x",
  s: "live",
  g: ["fantasy", "adventure", "animation"],
  tg: ["anime", "japan"],
  p: 8
}, {
  id: "weathering",
  t: "Weathering with You",
  y: 2019,
  b: "x",
  s: "live",
  g: ["romance", "fantasy", "animation"],
  tg: ["anime", "japan"],
  p: 7
}, {
  id: "silentvoice",
  t: "A Silent Voice",
  y: 2016,
  b: "x",
  s: "live",
  g: ["drama", "animation"],
  tg: ["anime", "japan", "school"],
  p: 8
}, {
  id: "mugentrain",
  t: "Demon Slayer: Mugen Train",
  y: 2020,
  b: "x",
  s: "live",
  g: ["action", "animation"],
  tg: ["anime", "japan", "monsters"],
  p: 9
}, {
  id: "jjk0",
  t: "Jujutsu Kaisen 0",
  y: 2021,
  b: "x",
  s: "live",
  g: ["action", "animation"],
  tg: ["anime", "japan", "monsters"],
  p: 8
}, {
  id: "slamdunk",
  t: "The First Slam Dunk",
  y: 2022,
  b: "x",
  s: "live",
  g: ["sports", "drama", "animation"],
  tg: ["anime", "japan", "sports"],
  p: 8
}, {
  id: "onepiecered",
  t: "One Piece Film: Red",
  y: 2022,
  b: "x",
  s: "live",
  g: ["action", "musical", "animation"],
  tg: ["anime", "japan", "music"],
  p: 7
}, {
  id: "haikyu",
  t: "Haikyu!! The Dumpster Battle",
  y: 2024,
  b: "x",
  s: "live",
  g: ["sports", "animation"],
  tg: ["anime", "japan", "sports", "school"],
  p: 7
}, {
  id: "lookback",
  t: "Look Back",
  y: 2024,
  b: "x",
  s: "live",
  g: ["drama", "animation"],
  tg: ["anime", "japan", "friendship"],
  p: 7
}, {
  id: "summerwars",
  t: "Summer Wars",
  y: 2009,
  b: "x",
  s: "live",
  g: ["scifi", "comedy", "animation"],
  tg: ["anime", "japan", "videogames", "family"],
  p: 7
}, {
  id: "wolfchildren",
  t: "Wolf Children",
  y: 2012,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "animation"],
  tg: ["anime", "japan", "family"],
  p: 7
}, {
  id: "mirai",
  t: "Mirai",
  y: 2018,
  b: "t",
  s: "live",
  g: ["fantasy", "animation"],
  tg: ["anime", "japan", "family", "timetravel"],
  p: 6
}, {
  id: "girlleapt",
  t: "The Girl Who Leapt Through Time",
  y: 2006,
  b: "x",
  s: "live",
  g: ["scifi", "romance", "animation"],
  tg: ["anime", "japan", "timetravel", "school"],
  p: 7
},
// ===== More Japan & anime =====
{
  id: "belle",
  t: "Belle",
  y: 2021,
  b: "t",
  s: "live",
  g: ["scifi", "musical", "animation"],
  tg: ["anime", "japan", "music", "videogames"],
  p: 7
}, {
  id: "fivecm",
  t: "5 Centimeters per Second",
  y: 2007,
  b: "x",
  s: "live",
  g: ["romance", "drama", "animation"],
  tg: ["anime", "japan"],
  p: 6
}, {
  id: "maquia",
  t: "Maquia: When the Promised Flower Blooms",
  y: 2018,
  b: "x",
  s: "live",
  g: ["fantasy", "drama", "animation"],
  tg: ["anime", "japan", "family"],
  p: 6
}, {
  id: "promare",
  t: "Promare",
  y: 2019,
  b: "x",
  s: "live",
  g: ["action", "scifi", "animation"],
  tg: ["anime", "japan"],
  p: 6
}, {
  id: "onlyyesterday",
  t: "Only Yesterday",
  y: 1991,
  b: "t",
  s: "ghibli",
  g: ["drama", "romance", "animation"],
  tg: ["japan"],
  p: 5
}, {
  id: "eva31",
  t: "Evangelion: 3.0+1.0 Thrice Upon a Time",
  y: 2021,
  b: "x",
  s: "live",
  g: ["scifi", "action", "animation"],
  tg: ["anime", "japan", "robots"],
  p: 7
}, {
  id: "perfectblue",
  t: "Perfect Blue",
  y: 1997,
  b: "r",
  s: "live",
  g: ["thriller", "animation"],
  tg: ["anime", "japan", "music"],
  p: 7
}, {
  id: "paprika",
  t: "Paprika",
  y: 2006,
  b: "r",
  s: "live",
  g: ["scifi", "animation"],
  tg: ["anime", "japan"],
  p: 7
},
// ===== More teens & family crossovers =====
{
  id: "hpgoblet",
  t: "Harry Potter and the Goblet of Fire",
  y: 2005,
  b: "x",
  s: "live",
  g: ["fantasy", "adventure"],
  tg: ["magic", "school"],
  p: 8,
  q: "hp3"
}, {
  id: "fantasticbeasts",
  t: "Fantastic Beasts and Where to Find Them",
  y: 2016,
  b: "x",
  s: "live",
  g: ["fantasy", "adventure"],
  tg: ["magic", "monsters"],
  p: 6
}, {
  id: "pirates",
  t: "Pirates of the Caribbean: The Curse of the Black Pearl",
  y: 2003,
  b: "x",
  s: "live",
  g: ["adventure", "fantasy"],
  tg: ["ocean", "monsters"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "stardust",
  t: "Stardust",
  y: 2007,
  b: "x",
  s: "live",
  g: ["fantasy", "adventure", "romance"],
  tg: ["magic"],
  p: 7
}, {
  id: "uncharted",
  t: "Uncharted",
  y: 2022,
  b: "x",
  s: "live",
  g: ["action", "adventure"],
  tg: ["videogames", "heist"],
  p: 6
}, {
  id: "kongskull",
  t: "Kong: Skull Island",
  y: 2017,
  b: "x",
  s: "live",
  g: ["action", "adventure"],
  tg: ["monsters"],
  p: 6
}, {
  id: "meg",
  t: "The Meg",
  y: 2018,
  b: "x",
  s: "live",
  g: ["action", "thriller"],
  tg: ["ocean", "monsters"],
  p: 6
}, {
  id: "twisters",
  t: "Twisters",
  y: 2024,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: ["survival"],
  p: 7
}, {
  id: "titans",
  t: "Remember the Titans",
  y: 2000,
  b: "t",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports", "school", "friendship"],
  p: 7
}, {
  id: "deadpoets",
  t: "Dead Poets Society",
  y: 1989,
  b: "x",
  s: "live",
  g: ["drama"],
  tg: ["school"],
  p: 8
}, {
  id: "fewgoodmen",
  t: "A Few Good Men",
  y: 1992,
  b: "x",
  s: "live",
  g: ["drama", "thriller"],
  tg: ["war", "detective"],
  p: 7
}, {
  id: "air",
  t: "Air",
  y: 2023,
  b: "x",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 6
}, {
  id: "terminal",
  t: "The Terminal",
  y: 2004,
  b: "x",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
},
// ===== Grown-ups =====
{
  id: "shawshank",
  t: "The Shawshank Redemption",
  y: 1994,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["friendship"],
  p: 10
}, {
  id: "godfather",
  t: "The Godfather",
  y: 1972,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["family"],
  p: 9
}, {
  id: "godfather2",
  t: "The Godfather Part II",
  y: 1974,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["family"],
  p: 8,
  q: "godfather"
}, {
  id: "darkknight",
  t: "The Dark Knight",
  y: 2008,
  b: "r",
  s: "live",
  g: ["action", "crime", "thriller"],
  tg: ["superhero"],
  p: 10
}, {
  id: "batmanbegins",
  t: "Batman Begins",
  y: 2005,
  b: "x",
  s: "live",
  g: ["action", "crime"],
  tg: ["superhero"],
  p: 7
}, {
  id: "dkr",
  t: "The Dark Knight Rises",
  y: 2012,
  b: "x",
  s: "live",
  g: ["action", "thriller"],
  tg: ["superhero"],
  p: 8,
  q: "darkknight"
}, {
  id: "thebatman",
  t: "The Batman",
  y: 2022,
  b: "x",
  s: "live",
  g: ["action", "crime", "thriller"],
  tg: ["superhero", "detective"],
  p: 8
}, {
  id: "joker",
  t: "Joker",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "crime", "thriller"],
  tg: ["superhero"],
  p: 8
}, {
  id: "logan",
  t: "Logan",
  y: 2017,
  b: "r",
  s: "live",
  g: ["action", "drama"],
  tg: ["superhero"],
  p: 7,
  jp: ["disneyplus"]
}, {
  id: "deadpool",
  t: "Deadpool",
  y: 2016,
  b: "r",
  s: "live",
  g: ["action", "comedy"],
  tg: ["superhero"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "deadpool3",
  t: "Deadpool & Wolverine",
  y: 2024,
  b: "r",
  s: "live",
  g: ["action", "comedy"],
  tg: ["superhero"],
  p: 8,
  jp: ["disneyplus"],
  q: "deadpool"
}, {
  id: "pulpfiction",
  t: "Pulp Fiction",
  y: 1994,
  b: "r",
  s: "live",
  g: ["crime", "comedy"],
  tg: [],
  p: 9
}, {
  id: "fightclub",
  t: "Fight Club",
  y: 1999,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 8
}, {
  id: "forrest",
  t: "Forrest Gump",
  y: 1994,
  b: "x",
  s: "live",
  g: ["drama", "romance"],
  tg: ["war"],
  p: 9
}, {
  id: "inception",
  t: "Inception",
  y: 2010,
  b: "x",
  s: "live",
  g: ["scifi", "thriller"],
  tg: ["heist"],
  p: 9
}, {
  id: "interstellar",
  t: "Interstellar",
  y: 2014,
  b: "x",
  s: "live",
  g: ["scifi", "drama"],
  tg: ["space", "timetravel", "family"],
  p: 9
}, {
  id: "prestige",
  t: "The Prestige",
  y: 2006,
  b: "x",
  s: "live",
  g: ["thriller", "mystery", "drama"],
  tg: ["magic"],
  p: 8
}, {
  id: "tenet",
  t: "Tenet",
  y: 2020,
  b: "x",
  s: "live",
  g: ["scifi", "action"],
  tg: ["timetravel", "spies"],
  p: 7
}, {
  id: "odyssey",
  t: "The Odyssey",
  y: 2026,
  b: "r",
  s: "live",
  g: ["adventure", "action", "fantasy"],
  tg: ["war", "ocean", "monsters"],
  p: 8
}, {
  id: "matrix",
  t: "The Matrix",
  y: 1999,
  b: "r",
  s: "live",
  g: ["scifi", "action"],
  tg: ["robots"],
  p: 9
}, {
  id: "gladiator",
  t: "Gladiator",
  y: 2000,
  b: "r",
  s: "live",
  g: ["action", "drama"],
  tg: ["war"],
  p: 8
}, {
  id: "gladiator2",
  t: "Gladiator II",
  y: 2024,
  b: "r",
  s: "live",
  g: ["action", "drama"],
  tg: ["war"],
  p: 7,
  q: "gladiator"
}, {
  id: "titanic",
  t: "Titanic",
  y: 1997,
  b: "x",
  s: "live",
  g: ["romance", "drama"],
  tg: ["ocean"],
  p: 9
}, {
  id: "oppenheimer",
  t: "Oppenheimer",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: ["war"],
  p: 8
}, {
  id: "fordferrari",
  t: "Ford v Ferrari",
  y: 2019,
  b: "x",
  s: "live",
  g: ["drama", "sports"],
  tg: ["cars"],
  p: 7
}, {
  id: "johnwick",
  t: "John Wick",
  y: 2014,
  b: "r",
  s: "live",
  g: ["action", "thriller"],
  tg: [],
  p: 8
}, {
  id: "johnwick4",
  t: "John Wick: Chapter 4",
  y: 2023,
  b: "r",
  s: "live",
  g: ["action", "thriller"],
  tg: ["japan"],
  p: 7,
  q: "johnwick"
}, {
  id: "mifallout",
  t: "Mission: Impossible — Fallout",
  y: 2018,
  b: "x",
  s: "live",
  g: ["action", "thriller"],
  tg: ["spies"],
  p: 8
}, {
  id: "kingsman",
  t: "Kingsman: The Secret Service",
  y: 2014,
  b: "r",
  s: "live",
  g: ["action", "comedy"],
  tg: ["spies"],
  p: 8
}, {
  id: "casinoroyale",
  t: "Casino Royale",
  y: 2006,
  b: "x",
  s: "live",
  g: ["action", "thriller"],
  tg: ["spies"],
  p: 8
}, {
  id: "skyfall",
  t: "Skyfall",
  y: 2012,
  b: "x",
  s: "live",
  g: ["action", "thriller"],
  tg: ["spies"],
  p: 8
}, {
  id: "bourne",
  t: "The Bourne Identity",
  y: 2002,
  b: "x",
  s: "live",
  g: ["action", "thriller"],
  tg: ["spies"],
  p: 7
}, {
  id: "knives",
  t: "Knives Out",
  y: 2019,
  b: "x",
  s: "live",
  g: ["mystery", "comedy"],
  tg: ["detective"],
  p: 8
}, {
  id: "glassonion",
  t: "Glass Onion: A Knives Out Mystery",
  y: 2022,
  b: "x",
  s: "netflix",
  g: ["mystery", "comedy"],
  tg: ["detective"],
  p: 7,
  q: "knives"
}, {
  id: "murderorient",
  t: "Murder on the Orient Express",
  y: 2017,
  b: "x",
  s: "live",
  g: ["mystery", "crime"],
  tg: ["detective"],
  p: 6
}, {
  id: "gonegirl",
  t: "Gone Girl",
  y: 2014,
  b: "r",
  s: "live",
  g: ["thriller", "mystery"],
  tg: [],
  p: 8
}, {
  id: "se7en",
  t: "Se7en",
  y: 1995,
  b: "r",
  s: "live",
  g: ["thriller", "crime"],
  tg: ["detective"],
  p: 8
}, {
  id: "silence",
  t: "The Silence of the Lambs",
  y: 1991,
  b: "r",
  s: "live",
  g: ["thriller", "horror", "crime"],
  tg: ["detective"],
  p: 8
}, {
  id: "zodiac",
  t: "Zodiac",
  y: 2007,
  b: "r",
  s: "live",
  g: ["thriller", "crime"],
  tg: ["detective"],
  p: 7
}, {
  id: "prisoners",
  t: "Prisoners",
  y: 2013,
  b: "r",
  s: "live",
  g: ["thriller", "crime"],
  tg: ["detective"],
  p: 7
}, {
  id: "shutter",
  t: "Shutter Island",
  y: 2010,
  b: "r",
  s: "live",
  g: ["thriller", "mystery"],
  tg: ["detective"],
  p: 7
}, {
  id: "memento",
  t: "Memento",
  y: 2000,
  b: "r",
  s: "live",
  g: ["thriller", "mystery"],
  tg: [],
  p: 7
}, {
  id: "nocountry",
  t: "No Country for Old Men",
  y: 2007,
  b: "r",
  s: "live",
  g: ["crime", "thriller", "drama"],
  tg: ["survival"],
  p: 8
}, {
  id: "departed",
  t: "The Departed",
  y: 2006,
  b: "r",
  s: "live",
  g: ["crime", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "goodfellas",
  t: "Goodfellas",
  y: 1990,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: [],
  p: 8
}, {
  id: "catchme",
  t: "Catch Me If You Can",
  y: 2002,
  b: "x",
  s: "live",
  g: ["crime", "comedy", "drama"],
  tg: ["detective"],
  p: 8
}, {
  id: "wolf",
  t: "The Wolf of Wall Street",
  y: 2013,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: [],
  p: 8
}, {
  id: "bigshort",
  t: "The Big Short",
  y: 2015,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 7
}, {
  id: "socialnetwork",
  t: "The Social Network",
  y: 2010,
  b: "x",
  s: "live",
  g: ["drama"],
  tg: ["school"],
  p: 8
}, {
  id: "moneyball",
  t: "Moneyball",
  y: 2011,
  b: "x",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 7
}, {
  id: "beautifulmind",
  t: "A Beautiful Mind",
  y: 2001,
  b: "x",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "whiplash",
  t: "Whiplash",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["music", "school"],
  p: 8
}, {
  id: "lalaland",
  t: "La La Land",
  y: 2016,
  b: "x",
  s: "live",
  g: ["musical", "romance", "drama"],
  tg: ["music"],
  p: 9
}, {
  id: "bohemian",
  t: "Bohemian Rhapsody",
  y: 2018,
  b: "x",
  s: "live",
  g: ["musical", "drama"],
  tg: ["music"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "rocketman",
  t: "Rocketman",
  y: 2019,
  b: "r",
  s: "live",
  g: ["musical", "drama"],
  tg: ["music"],
  p: 7
}, {
  id: "elvis",
  t: "Elvis",
  y: 2022,
  b: "x",
  s: "live",
  g: ["musical", "drama"],
  tg: ["music"],
  p: 7
}, {
  id: "hamilton",
  t: "Hamilton",
  y: 2020,
  b: "x",
  s: "live",
  g: ["musical", "drama"],
  tg: ["music", "war"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "lesmis",
  t: "Les Misérables",
  y: 2012,
  b: "x",
  s: "live",
  g: ["musical", "drama"],
  tg: ["music", "war"],
  p: 7
}, {
  id: "getout",
  t: "Get Out",
  y: 2017,
  b: "r",
  s: "live",
  g: ["horror", "thriller"],
  tg: [],
  p: 8
}, {
  id: "quietplace",
  t: "A Quiet Place",
  y: 2018,
  b: "x",
  s: "live",
  g: ["horror", "thriller"],
  tg: ["aliens", "family", "survival"],
  p: 8
}, {
  id: "conjuring",
  t: "The Conjuring",
  y: 2013,
  b: "r",
  s: "live",
  g: ["horror"],
  tg: ["spooky"],
  p: 7
}, {
  id: "it",
  t: "IT",
  y: 2017,
  b: "r",
  s: "live",
  g: ["horror"],
  tg: ["monsters", "friendship"],
  p: 7
}, {
  id: "m3gan",
  t: "M3GAN",
  y: 2022,
  b: "r",
  s: "live",
  g: ["horror", "scifi"],
  tg: ["robots"],
  p: 6
}, {
  id: "sinners",
  t: "Sinners",
  y: 2025,
  b: "r",
  s: "live",
  g: ["horror", "thriller", "drama"],
  tg: ["music", "monsters"],
  p: 8
}, {
  id: "weapons",
  t: "Weapons",
  y: 2025,
  b: "r",
  s: "live",
  g: ["horror", "mystery"],
  tg: ["school"],
  p: 7
}, {
  id: "traintobusan",
  t: "Train to Busan",
  y: 2016,
  b: "r",
  s: "live",
  g: ["horror", "action", "thriller"],
  tg: ["survival", "family"],
  p: 7
}, {
  id: "sixthsense",
  t: "The Sixth Sense",
  y: 1999,
  b: "x",
  s: "live",
  g: ["thriller", "mystery"],
  tg: ["spooky"],
  p: 8
}, {
  id: "truman",
  t: "The Truman Show",
  y: 1998,
  b: "x",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 8
}, {
  id: "eternalsunshine",
  t: "Eternal Sunshine of the Spotless Mind",
  y: 2004,
  b: "r",
  s: "live",
  g: ["romance", "scifi", "drama"],
  tg: [],
  p: 7
}, {
  id: "her",
  t: "Her",
  y: 2013,
  b: "r",
  s: "live",
  g: ["romance", "scifi", "drama"],
  tg: ["robots"],
  p: 7
}, {
  id: "exmachina",
  t: "Ex Machina",
  y: 2014,
  b: "r",
  s: "live",
  g: ["scifi", "thriller"],
  tg: ["robots"],
  p: 7
}, {
  id: "arrival",
  t: "Arrival",
  y: 2016,
  b: "x",
  s: "live",
  g: ["scifi", "drama"],
  tg: ["aliens"],
  p: 8
}, {
  id: "martian",
  t: "The Martian",
  y: 2015,
  b: "x",
  s: "live",
  g: ["scifi", "adventure"],
  tg: ["space", "survival"],
  p: 8
}, {
  id: "gravity",
  t: "Gravity",
  y: 2013,
  b: "x",
  s: "live",
  g: ["scifi", "thriller"],
  tg: ["space", "survival"],
  p: 7
}, {
  id: "bladerunner",
  t: "Blade Runner 2049",
  y: 2017,
  b: "r",
  s: "live",
  g: ["scifi", "thriller"],
  tg: ["robots", "detective"],
  p: 7
}, {
  id: "alien",
  t: "Alien",
  y: 1979,
  b: "r",
  s: "live",
  g: ["horror", "scifi"],
  tg: ["space", "aliens", "monsters"],
  p: 8
}, {
  id: "aliens",
  t: "Aliens",
  y: 1986,
  b: "r",
  s: "live",
  g: ["action", "scifi"],
  tg: ["space", "aliens", "war"],
  p: 8,
  q: "alien"
}, {
  id: "terminator2",
  t: "Terminator 2: Judgment Day",
  y: 1991,
  b: "r",
  s: "live",
  g: ["action", "scifi"],
  tg: ["robots", "timetravel"],
  p: 8
}, {
  id: "diehard",
  t: "Die Hard",
  y: 1988,
  b: "r",
  s: "live",
  g: ["action", "thriller"],
  tg: ["christmas", "heist"],
  p: 8
}, {
  id: "madmax",
  t: "Mad Max: Fury Road",
  y: 2015,
  b: "r",
  s: "live",
  g: ["action", "scifi"],
  tg: ["cars", "survival"],
  p: 8
}, {
  id: "furiosa",
  t: "Furiosa: A Mad Max Saga",
  y: 2024,
  b: "r",
  s: "live",
  g: ["action", "scifi"],
  tg: ["cars", "survival"],
  p: 6,
  q: "madmax"
}, {
  id: "django",
  t: "Django Unchained",
  y: 2012,
  b: "r",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 8
}, {
  id: "inglourious",
  t: "Inglourious Basterds",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama", "thriller", "comedy"],
  tg: ["war"],
  p: 8
}, {
  id: "indiana",
  t: "Raiders of the Lost Ark",
  y: 1981,
  b: "x",
  s: "live",
  g: ["adventure", "action"],
  tg: ["magic"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "jaws",
  t: "Jaws",
  y: 1975,
  b: "x",
  s: "live",
  g: ["thriller", "adventure"],
  tg: ["ocean", "monsters"],
  p: 8
}, {
  id: "rocky",
  t: "Rocky",
  y: 1976,
  b: "x",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 8
}, {
  id: "creed",
  t: "Creed",
  y: 2015,
  b: "x",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 7,
  q: "rocky"
}, {
  id: "challengers",
  t: "Challengers",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama", "sports", "romance"],
  tg: ["sports"],
  p: 7
}, {
  id: "oceans",
  t: "Ocean's Eleven",
  y: 2001,
  b: "x",
  s: "live",
  g: ["crime", "comedy"],
  tg: ["heist"],
  p: 8
}, {
  id: "italianjob",
  t: "The Italian Job",
  y: 2003,
  b: "x",
  s: "live",
  g: ["action", "crime"],
  tg: ["heist", "cars"],
  p: 7
}, {
  id: "babydriver",
  t: "Baby Driver",
  y: 2017,
  b: "r",
  s: "live",
  g: ["action", "crime"],
  tg: ["heist", "cars", "music"],
  p: 7
}, {
  id: "notebook",
  t: "The Notebook",
  y: 2004,
  b: "x",
  s: "live",
  g: ["romance", "drama"],
  tg: [],
  p: 7
}, {
  id: "prideprej",
  t: "Pride & Prejudice",
  y: 2005,
  b: "x",
  s: "live",
  g: ["romance", "drama"],
  tg: ["family"],
  p: 8
}, {
  id: "crazyrich",
  t: "Crazy Rich Asians",
  y: 2018,
  b: "x",
  s: "live",
  g: ["romance", "comedy"],
  tg: ["family"],
  p: 7
}, {
  id: "abouttime",
  t: "About Time",
  y: 2013,
  b: "r",
  s: "live",
  g: ["romance", "comedy", "drama"],
  tg: ["timetravel", "family"],
  p: 8
}, {
  id: "loveactually",
  t: "Love Actually",
  y: 2003,
  b: "r",
  s: "live",
  g: ["romance", "comedy"],
  tg: ["christmas"],
  p: 8
}, {
  id: "nottinghill",
  t: "Notting Hill",
  y: 1999,
  b: "x",
  s: "live",
  g: ["romance", "comedy"],
  tg: [],
  p: 7
}, {
  id: "proposal",
  t: "The Proposal",
  y: 2009,
  b: "x",
  s: "live",
  g: ["romance", "comedy"],
  tg: ["family"],
  p: 7
}, {
  id: "hitch",
  t: "Hitch",
  y: 2005,
  b: "x",
  s: "live",
  g: ["romance", "comedy"],
  tg: [],
  p: 6
}, {
  id: "howtolose",
  t: "How to Lose a Guy in 10 Days",
  y: 2003,
  b: "x",
  s: "live",
  g: ["romance", "comedy"],
  tg: [],
  p: 6
}, {
  id: "pastlives",
  t: "Past Lives",
  y: 2023,
  b: "x",
  s: "live",
  g: ["romance", "drama"],
  tg: [],
  p: 7
}, {
  id: "devilprada",
  t: "The Devil Wears Prada",
  y: 2006,
  b: "x",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 8
}, {
  id: "intern",
  t: "The Intern",
  y: 2015,
  b: "x",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "days500",
  t: "(500) Days of Summer",
  y: 2009,
  b: "x",
  s: "live",
  g: ["romance", "comedy", "drama"],
  tg: ["music"],
  p: 7
}, {
  id: "crazystupid",
  t: "Crazy, Stupid, Love",
  y: 2011,
  b: "x",
  s: "live",
  g: ["romance", "comedy"],
  tg: ["family"],
  p: 7
}, {
  id: "hangover",
  t: "The Hangover",
  y: 2009,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 8
}, {
  id: "superbad",
  t: "Superbad",
  y: 2007,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: ["school"],
  p: 7
}, {
  id: "bridesmaids",
  t: "Bridesmaids",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 7
}, {
  id: "anchorman",
  t: "Anchorman",
  y: 2004,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 7
}, {
  id: "stepbrothers",
  t: "Step Brothers",
  y: 2008,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: ["family"],
  p: 7
}, {
  id: "littlemiss",
  t: "Little Miss Sunshine",
  y: 2006,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["family"],
  p: 7
}, {
  id: "juno",
  t: "Juno",
  y: 2007,
  b: "x",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["school", "family"],
  p: 7
}, {
  id: "ladybird",
  t: "Lady Bird",
  y: 2017,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["school", "family"],
  p: 7
}, {
  id: "grandbudapest",
  t: "The Grand Budapest Hotel",
  y: 2014,
  b: "r",
  s: "live",
  g: ["comedy", "crime"],
  tg: ["heist"],
  p: 7
}, {
  id: "amelie",
  t: "Amélie",
  y: 2001,
  b: "r",
  s: "live",
  g: ["romance", "comedy"],
  tg: [],
  p: 7
}, {
  id: "intouchables",
  t: "The Intouchables",
  y: 2011,
  b: "x",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["friendship", "music"],
  p: 8
}, {
  id: "lifeisbeautiful",
  t: "Life Is Beautiful",
  y: 1997,
  b: "x",
  s: "live",
  g: ["drama", "comedy"],
  tg: ["war", "family"],
  p: 7
}, {
  id: "parasite",
  t: "Parasite",
  y: 2019,
  b: "r",
  s: "live",
  g: ["thriller", "comedy", "drama"],
  tg: ["family"],
  p: 9
}, {
  id: "eeaao",
  t: "Everything Everywhere All at Once",
  y: 2022,
  b: "r",
  s: "live",
  g: ["scifi", "comedy", "drama"],
  tg: ["timetravel", "family"],
  p: 8
}, {
  id: "anora",
  t: "Anora",
  y: 2024,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 7
}, {
  id: "conclave",
  t: "Conclave",
  y: 2024,
  b: "r",
  s: "live",
  g: ["thriller", "drama", "mystery"],
  tg: [],
  p: 7
}, {
  id: "greenbook",
  t: "Green Book",
  y: 2018,
  b: "x",
  s: "live",
  g: ["drama", "comedy"],
  tg: ["music", "friendship"],
  p: 7
}, {
  id: "coda",
  t: "CODA",
  y: 2021,
  b: "x",
  s: "live",
  g: ["drama", "comedy"],
  tg: ["music", "family"],
  p: 7
}, {
  id: "12angry",
  t: "12 Angry Men",
  y: 1957,
  b: "x",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 7
}, {
  id: "w1917",
  t: "1917",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: ["war", "survival"],
  p: 7
}, {
  id: "dunkirk",
  t: "Dunkirk",
  y: 2017,
  b: "x",
  s: "live",
  g: ["thriller", "drama"],
  tg: ["war", "survival", "ocean"],
  p: 7
}, {
  id: "savingryan",
  t: "Saving Private Ryan",
  y: 1998,
  b: "r",
  s: "live",
  g: ["drama", "action"],
  tg: ["war"],
  p: 8
}, {
  id: "schindler",
  t: "Schindler's List",
  y: 1993,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 8
}, {
  id: "slumdog",
  t: "Slumdog Millionaire",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "casablanca",
  t: "Casablanca",
  y: 1942,
  b: "x",
  s: "live",
  g: ["romance", "drama"],
  tg: ["war"],
  p: 7
}, {
  id: "shoplifters",
  t: "Shoplifters",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan", "family"],
  p: 7
}, {
  id: "drivemycar",
  t: "Drive My Car",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan", "cars"],
  p: 6
}, {
  id: "perfectdays",
  t: "Perfect Days",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan", "music"],
  p: 7
}, {
  id: "bullettrain",
  t: "Bullet Train",
  y: 2022,
  b: "r",
  s: "live",
  g: ["action", "comedy"],
  tg: ["japan"],
  p: 7
}, {
  id: "akira",
  t: "Akira",
  y: 1988,
  b: "r",
  s: "live",
  g: ["scifi", "action", "animation"],
  tg: ["anime", "japan"],
  p: 7
}, {
  id: "gits",
  t: "Ghost in the Shell",
  y: 1995,
  b: "r",
  s: "live",
  g: ["scifi", "animation"],
  tg: ["anime", "japan", "robots"],
  p: 7
},
// ===== More grown-ups =====
{
  id: "heat",
  t: "Heat",
  y: 1995,
  b: "r",
  s: "live",
  g: ["crime", "action", "thriller"],
  tg: ["heist", "detective"],
  p: 8
}, {
  id: "usualsuspects",
  t: "The Usual Suspects",
  y: 1995,
  b: "r",
  s: "live",
  g: ["crime", "mystery", "thriller"],
  tg: ["detective", "heist"],
  p: 7
}, {
  id: "killbill",
  t: "Kill Bill: Vol. 1",
  y: 2003,
  b: "r",
  s: "live",
  g: ["action", "thriller"],
  tg: ["japan"],
  p: 8
}, {
  id: "oldboy",
  t: "Oldboy",
  y: 2003,
  b: "r",
  s: "live",
  g: ["thriller", "mystery", "action"],
  tg: [],
  p: 7
}, {
  id: "handmaiden",
  t: "The Handmaiden",
  y: 2016,
  b: "r",
  s: "live",
  g: ["thriller", "romance", "drama"],
  tg: ["heist"],
  p: 7
}, {
  id: "goodwill",
  t: "Good Will Hunting",
  y: 1997,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["school", "friendship"],
  p: 8
}, {
  id: "spotlight",
  t: "Spotlight",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 7
}, {
  id: "flowermoon",
  t: "Killers of the Flower Moon",
  y: 2023,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 7
}, {
  id: "hereditary",
  t: "Hereditary",
  y: 2018,
  b: "r",
  s: "live",
  g: ["horror"],
  tg: ["family"],
  p: 7
}, {
  id: "nosferatu",
  t: "Nosferatu",
  y: 2024,
  b: "r",
  s: "live",
  g: ["horror"],
  tg: ["monsters", "spooky"],
  p: 7
}, {
  id: "substance",
  t: "The Substance",
  y: 2024,
  b: "r",
  s: "live",
  g: ["horror", "scifi"],
  tg: [],
  p: 7
}, {
  id: "onebattle",
  t: "One Battle After Another",
  y: 2025,
  b: "r",
  s: "live",
  g: ["action", "drama", "thriller"],
  tg: [],
  p: 8
}, {
  id: "brutalist",
  t: "The Brutalist",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "rashomon",
  t: "Rashomon",
  y: 1950,
  b: "x",
  s: "live",
  g: ["drama", "mystery", "crime"],
  tg: ["japan", "detective"],
  p: 6
}, {
  id: "sevensamurai",
  t: "Seven Samurai",
  y: 1954,
  b: "x",
  s: "live",
  g: ["action", "drama", "adventure"],
  tg: ["japan", "war"],
  p: 8
}, {
  id: "ikiru",
  t: "Ikiru",
  y: 1952,
  b: "x",
  s: "live",
  g: ["drama"],
  tg: ["japan"],
  p: 6
}, {
  id: "tokyostory",
  t: "Tokyo Story",
  y: 1953,
  b: "x",
  s: "live",
  g: ["drama"],
  tg: ["japan", "family"],
  p: 6
}, {
  id: "highandlow",
  t: "High and Low",
  y: 1963,
  b: "x",
  s: "live",
  g: ["crime", "thriller", "drama"],
  tg: ["japan", "detective"],
  p: 7
}, {
  id: "tampopo",
  t: "Tampopo",
  y: 1985,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: ["japan", "cooking"],
  p: 6
}, {
  id: "departures",
  t: "Departures",
  y: 2008,
  b: "x",
  s: "live",
  g: ["drama"],
  tg: ["japan", "music", "family"],
  p: 7
},
// ===== TV SERIES (adults toggle) =====
{
  id: "strangerthings",
  t: "Stranger Things",
  y: 2016,
  b: "x",
  k: "s",
  s: "netflix",
  g: ["scifi", "mystery", "thriller"],
  tg: ["monsters", "school", "friendship"],
  p: 10
}, {
  id: "wednesday",
  t: "Wednesday",
  y: 2022,
  b: "x",
  k: "s",
  s: "netflix",
  g: ["comedy", "mystery"],
  tg: ["spooky", "school", "detective"],
  p: 9
}, {
  id: "onepiecelive",
  t: "One Piece (live action)",
  y: 2023,
  b: "x",
  k: "s",
  s: "netflix",
  g: ["adventure", "fantasy"],
  tg: ["ocean"],
  p: 7
}, {
  id: "atla",
  t: "Avatar: The Last Airbender",
  y: 2005,
  b: "t",
  k: "s",
  s: "nick",
  g: ["adventure", "fantasy", "animation"],
  tg: ["magic", "war", "friendship"],
  p: 8
}, {
  id: "mandalorian",
  t: "The Mandalorian",
  y: 2019,
  b: "x",
  k: "s",
  s: "live",
  g: ["scifi", "adventure"],
  tg: ["space", "aliens"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "loki",
  t: "Loki",
  y: 2021,
  b: "x",
  k: "s",
  s: "live",
  g: ["scifi", "fantasy"],
  tg: ["superhero", "timetravel"],
  p: 7,
  jp: ["disneyplus"]
}, {
  id: "andor",
  t: "Andor",
  y: 2022,
  b: "x",
  k: "s",
  s: "live",
  g: ["scifi", "thriller"],
  tg: ["space", "spies"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "sherlock",
  t: "Sherlock",
  y: 2010,
  b: "x",
  k: "s",
  s: "live",
  g: ["mystery", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "brooklyn99",
  t: "Brooklyn Nine-Nine",
  y: 2013,
  b: "x",
  k: "s",
  s: "live",
  g: ["comedy"],
  tg: ["detective"],
  p: 8
}, {
  id: "office",
  t: "The Office",
  y: 2005,
  b: "x",
  k: "s",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 9
}, {
  id: "parks",
  t: "Parks and Recreation",
  y: 2009,
  b: "x",
  k: "s",
  s: "live",
  g: ["comedy"],
  tg: ["friendship"],
  p: 8
}, {
  id: "friends",
  t: "Friends",
  y: 1994,
  b: "x",
  k: "s",
  s: "live",
  g: ["comedy", "romance"],
  tg: ["friendship"],
  p: 9
}, {
  id: "modernfamily",
  t: "Modern Family",
  y: 2009,
  b: "x",
  k: "s",
  s: "live",
  g: ["comedy"],
  tg: ["family"],
  p: 8
}, {
  id: "tedlasso",
  t: "Ted Lasso",
  y: 2020,
  b: "x",
  k: "s",
  s: "live",
  g: ["comedy", "sports"],
  tg: ["sports", "friendship"],
  p: 8
}, {
  id: "abbott",
  t: "Abbott Elementary",
  y: 2021,
  b: "x",
  k: "s",
  s: "live",
  g: ["comedy"],
  tg: ["school"],
  p: 7
}, {
  id: "goodplace",
  t: "The Good Place",
  y: 2016,
  b: "x",
  k: "s",
  s: "netflix",
  g: ["comedy", "fantasy"],
  tg: [],
  p: 8
}, {
  id: "schitt",
  t: "Schitt's Creek",
  y: 2015,
  b: "x",
  k: "s",
  s: "netflix",
  g: ["comedy"],
  tg: ["family"],
  p: 8
}, {
  id: "gilmore",
  t: "Gilmore Girls",
  y: 2000,
  b: "x",
  k: "s",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: ["family", "school"],
  p: 7
}, {
  id: "onlymurders",
  t: "Only Murders in the Building",
  y: 2021,
  b: "x",
  k: "s",
  s: "live",
  g: ["comedy", "mystery"],
  tg: ["detective"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "queensgambit",
  t: "The Queen's Gambit",
  y: 2020,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "breakingbad",
  t: "Breaking Bad",
  y: 2008,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["crime", "drama", "thriller"],
  tg: ["family"],
  p: 10
}, {
  id: "bettercall",
  t: "Better Call Saul",
  y: 2015,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["crime", "drama"],
  tg: [],
  p: 8
}, {
  id: "got",
  t: "Game of Thrones",
  y: 2011,
  b: "r",
  k: "s",
  s: "live",
  g: ["fantasy", "drama", "action"],
  tg: ["dragons", "war", "magic"],
  p: 9
}, {
  id: "hotd",
  t: "House of the Dragon",
  y: 2022,
  b: "r",
  k: "s",
  s: "live",
  g: ["fantasy", "drama"],
  tg: ["dragons", "war"],
  p: 8,
  q: "got"
}, {
  id: "succession",
  t: "Succession",
  y: 2018,
  b: "r",
  k: "s",
  s: "live",
  g: ["drama", "comedy"],
  tg: ["family"],
  p: 8
}, {
  id: "whitelotus",
  t: "The White Lotus",
  y: 2021,
  b: "r",
  k: "s",
  s: "live",
  g: ["drama", "comedy", "mystery"],
  tg: [],
  p: 8
}, {
  id: "lastofus",
  t: "The Last of Us",
  y: 2023,
  b: "r",
  k: "s",
  s: "live",
  g: ["drama", "horror", "action"],
  tg: ["survival", "monsters", "videogames"],
  p: 8
}, {
  id: "chernobyl",
  t: "Chernobyl",
  y: 2019,
  b: "r",
  k: "s",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 8
}, {
  id: "truedetective",
  t: "True Detective",
  y: 2014,
  b: "r",
  k: "s",
  s: "live",
  g: ["crime", "mystery", "thriller"],
  tg: ["detective"],
  p: 7
}, {
  id: "peakyblinders",
  t: "Peaky Blinders",
  y: 2013,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["crime", "drama"],
  tg: ["war"],
  p: 8
}, {
  id: "narcos",
  t: "Narcos",
  y: 2015,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["crime", "drama"],
  tg: [],
  p: 7
}, {
  id: "ozark",
  t: "Ozark",
  y: 2017,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["crime", "drama", "thriller"],
  tg: ["family"],
  p: 7
}, {
  id: "moneyheist",
  t: "Money Heist",
  y: 2017,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["crime", "thriller"],
  tg: ["heist"],
  p: 8
}, {
  id: "squidgame",
  t: "Squid Game",
  y: 2021,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["thriller", "drama"],
  tg: ["survival", "videogames"],
  p: 9
}, {
  id: "adolescence",
  t: "Adolescence",
  y: 2025,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["drama", "crime"],
  tg: ["school", "family"],
  p: 8
}, {
  id: "3body",
  t: "3 Body Problem",
  y: 2024,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["scifi", "mystery", "drama"],
  tg: ["aliens"],
  p: 7
}, {
  id: "crown",
  t: "The Crown",
  y: 2016,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["drama"],
  tg: ["family"],
  p: 7
}, {
  id: "blackmirror",
  t: "Black Mirror",
  y: 2011,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["scifi", "thriller", "drama"],
  tg: ["robots"],
  p: 8
}, {
  id: "darkseries",
  t: "Dark",
  y: 2017,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["scifi", "mystery", "thriller"],
  tg: ["timetravel", "family"],
  p: 7
}, {
  id: "severance",
  t: "Severance",
  y: 2022,
  b: "r",
  k: "s",
  s: "live",
  g: ["scifi", "thriller", "mystery"],
  tg: [],
  p: 8
}, {
  id: "pluribus",
  t: "Pluribus",
  y: 2025,
  b: "r",
  k: "s",
  s: "live",
  g: ["scifi", "drama", "mystery"],
  tg: ["aliens"],
  p: 7
}, {
  id: "slowhorses",
  t: "Slow Horses",
  y: 2022,
  b: "r",
  k: "s",
  s: "live",
  g: ["thriller", "comedy"],
  tg: ["spies"],
  p: 7
}, {
  id: "thebear",
  t: "The Bear",
  y: 2022,
  b: "r",
  k: "s",
  s: "live",
  g: ["drama", "comedy"],
  tg: ["cooking", "family"],
  p: 8,
  jp: ["disneyplus"]
}, {
  id: "shogun",
  t: "Shōgun",
  y: 2024,
  b: "r",
  k: "s",
  s: "live",
  g: ["drama", "action"],
  tg: ["japan", "war"],
  p: 9,
  jp: ["disneyplus"]
}, {
  id: "fargo",
  t: "Fargo",
  y: 2014,
  b: "r",
  k: "s",
  s: "live",
  g: ["crime", "drama", "comedy"],
  tg: ["detective"],
  p: 7
}, {
  id: "mindhunter",
  t: "Mindhunter",
  y: 2017,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["crime", "thriller", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "boys",
  t: "The Boys",
  y: 2019,
  b: "r",
  k: "s",
  s: "live",
  g: ["action", "comedy", "thriller"],
  tg: ["superhero"],
  p: 8,
  jp: ["prime"]
}, {
  id: "fallout",
  t: "Fallout",
  y: 2024,
  b: "r",
  k: "s",
  s: "live",
  g: ["scifi", "action", "drama"],
  tg: ["survival", "videogames"],
  p: 8,
  jp: ["prime"]
}, {
  id: "reacher",
  t: "Reacher",
  y: 2022,
  b: "r",
  k: "s",
  s: "live",
  g: ["action", "crime", "thriller"],
  tg: ["detective"],
  p: 7,
  jp: ["prime"]
}, {
  id: "aliceborderland",
  t: "Alice in Borderland",
  y: 2020,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["scifi", "thriller", "action"],
  tg: ["survival", "japan", "videogames"],
  p: 8
}, {
  id: "firstlove",
  t: "First Love (Hatsukoi)",
  y: 2022,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["romance", "drama"],
  tg: ["japan", "music"],
  p: 6
}, {
  id: "kimetsu",
  t: "Demon Slayer (series)",
  y: 2019,
  b: "x",
  k: "s",
  s: "live",
  g: ["action", "animation"],
  tg: ["anime", "japan", "monsters"],
  p: 9
}, {
  id: "jjkseries",
  t: "Jujutsu Kaisen (series)",
  y: 2020,
  b: "x",
  k: "s",
  s: "live",
  g: ["action", "animation"],
  tg: ["anime", "japan", "monsters"],
  p: 8
}, {
  id: "spyfamily",
  t: "Spy x Family",
  y: 2022,
  b: "x",
  k: "s",
  s: "live",
  g: ["comedy", "action", "animation"],
  tg: ["anime", "japan", "spies", "family"],
  p: 9
}, {
  id: "frieren",
  t: "Frieren: Beyond Journey's End",
  y: 2023,
  b: "x",
  k: "s",
  s: "live",
  g: ["fantasy", "adventure", "animation"],
  tg: ["anime", "japan", "magic"],
  p: 8
}, {
  id: "aot",
  t: "Attack on Titan",
  y: 2013,
  b: "r",
  k: "s",
  s: "live",
  g: ["action", "drama", "animation"],
  tg: ["anime", "japan", "monsters", "war"],
  p: 9
}, {
  id: "suits",
  t: "Suits",
  y: 2011,
  b: "x",
  k: "s",
  s: "live",
  g: ["drama", "comedy"],
  tg: [],
  p: 7,
  jp: ["netflix"]
}, {
  id: "silo",
  t: "Silo",
  y: 2023,
  b: "r",
  k: "s",
  s: "live",
  g: ["scifi", "drama", "mystery"],
  tg: ["survival"],
  p: 7
}, {
  id: "shrinking",
  t: "Shrinking",
  y: 2023,
  b: "r",
  k: "s",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["family"],
  p: 7
}, {
  id: "bridgerton",
  t: "Bridgerton",
  y: 2020,
  b: "r",
  k: "s",
  s: "netflix",
  g: ["romance", "drama"],
  tg: ["family", "music"],
  p: 8
}, {
  id: "lastdance",
  t: "The Last Dance",
  y: 2020,
  b: "x",
  k: "s",
  s: "netflix",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 7
}, {
  id: "planetearth",
  t: "Planet Earth II",
  y: 2016,
  b: "a",
  k: "s",
  s: "live",
  g: ["adventure", "drama"],
  tg: ["animals", "ocean"],
  p: 8
}, {
  id: "bluey",
  t: "Bluey",
  y: 2018,
  b: "a",
  k: "s",
  s: "live",
  g: ["comedy", "animation"],
  tg: ["animals", "family"],
  p: 9,
  jp: ["disneyplus"]
}, {
  id: "sakamoto",
  t: "Sakamoto Days",
  y: 2025,
  b: "x",
  k: "s",
  s: "netflix",
  g: ["action", "comedy", "animation"],
  tg: ["anime", "japan"],
  p: 7
}, {
  id: "dandadan",
  t: "Dan Da Dan",
  y: 2024,
  b: "x",
  k: "s",
  s: "live",
  g: ["action", "comedy", "animation"],
  tg: ["anime", "japan", "monsters"],
  p: 8
}, {
  id: "mha",
  t: "My Hero Academia",
  y: 2016,
  b: "x",
  k: "s",
  s: "live",
  g: ["action", "animation"],
  tg: ["anime", "japan", "superhero", "school"],
  p: 8
}, {
  id: "sololeveling",
  t: "Solo Leveling",
  y: 2024,
  b: "x",
  k: "s",
  s: "live",
  g: ["action", "fantasy", "animation"],
  tg: ["anime", "monsters", "videogames"],
  p: 8
}, {
  id: "pachinko",
  t: "Pachinko",
  y: 2022,
  b: "r",
  k: "s",
  s: "live",
  g: ["drama"],
  tg: ["japan", "family"],
  p: 7
},
// ===== Belgium, 2011 onwards =====
{
  id: "the-artist-2011",
  t: "The Artist",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 8
}, {
  id: "the-danish-girl-2015",
  t: "The Danish Girl",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "blue-is-the-warmest-colour-2013",
  t: "Blue Is the Warmest Colour",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "elle-2016",
  t: "Elle",
  y: 2016,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "filth-2013",
  t: "Filth",
  y: 2013,
  b: "r",
  s: "live",
  g: ["action", "comedy", "crime"],
  tg: ["detective"],
  p: 7
}, {
  id: "i-daniel-blake-2016",
  t: "I, Daniel Blake",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "rust-and-bone-2012",
  t: "Rust and Bone",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "song-of-the-sea-2014",
  t: "Song of the Sea",
  y: 2014,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "drama"],
  tg: [],
  p: 7
}, {
  id: "the-devil-s-double-2011",
  t: "The Devil's Double",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 7
}, {
  id: "brimstone-2016",
  t: "Brimstone",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "thriller", "adventure"],
  tg: [],
  p: 6
}, {
  id: "bullhead-2011",
  t: "Bullhead",
  y: 2011,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 6
}, {
  id: "close-2022",
  t: "Close",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "ernest-celestine-2012",
  t: "Ernest & Celestine",
  y: 2012,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 6
}, {
  id: "girl-2018",
  t: "Girl",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "io-capitano-2023",
  t: "Io Capitano",
  y: 2023,
  b: "x",
  s: "live",
  g: ["adventure", "drama"],
  tg: [],
  p: 6
}, {
  id: "loveless-2017",
  t: "Loveless",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "mrs-harris-goes-to-paris-2022",
  t: "Mrs. Harris Goes to Paris",
  y: 2022,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "suite-fran-aise-2014",
  t: "Suite Fran\u00e7aise",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "the-angels-share-2012",
  t: "The Angels' Share",
  y: 2012,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 6
}, {
  id: "the-book-of-vision-2020",
  t: "The Book of Vision",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama", "mystery"],
  tg: ["detective"],
  p: 6
}, {
  id: "the-brand-new-testament-2015",
  t: "The Brand New Testament",
  y: 2015,
  b: "x",
  s: "live",
  g: ["comedy", "drama", "fantasy"],
  tg: [],
  p: 6
}, {
  id: "the-broken-circle-breakdown-2012",
  t: "The Broken Circle Breakdown",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama", "musical", "romance"],
  tg: ["music"],
  p: 6
}, {
  id: "the-eight-mountains-2022",
  t: "The Eight Mountains",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "the-kid-with-a-bike-2011",
  t: "The Kid with a Bike",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "the-missing-2014",
  t: "The Missing",
  y: 2014,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 6,
  k: "s"
}, {
  id: "the-red-turtle-2016",
  t: "The Red Turtle",
  y: 2016,
  b: "k",
  s: "live",
  g: ["animation", "drama"],
  tg: ["family"],
  p: 6
}, {
  id: "two-days-one-night-2014",
  t: "Two Days, One Night",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "what-s-in-a-name-2012",
  t: "What's in a Name?",
  y: 2012,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "april-and-the-extraordinary-world-2015",
  t: "April and the Extraordinary World",
  y: 2015,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 5
}, {
  id: "beating-hearts-2024",
  t: "Beating Hearts",
  y: 2024,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "beyond-the-hills-2012",
  t: "Beyond the Hills",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "by-the-grace-of-god-2018",
  t: "By the Grace of God",
  y: 2018,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "chicken-with-plums-2011",
  t: "Chicken with Plums",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "come-as-you-are-2011",
  t: "Come As You Are",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "delicious-2021",
  t: "Delicious",
  y: 2021,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "ennio-2021",
  t: "Ennio",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "graduation-2016",
  t: "Graduation",
  y: 2016,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "heavy-trip-2018",
  t: "Heavy Trip",
  y: 2018,
  b: "r",
  s: "live",
  g: ["comedy", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "last-breath-2019",
  t: "Last Breath",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "little-am-lie-or-the-character-of--2025",
  t: "Little Am\u00e9lie or the Character of Rain",
  y: 2025,
  b: "k",
  s: "live",
  g: ["animation", "drama"],
  tg: ["family"],
  p: 5
}, {
  id: "minuscule-valley-of-the-lost-ants-2013",
  t: "Minuscule: Valley of the Lost Ants",
  y: 2013,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: [],
  p: 5
}, {
  id: "north-sea-texas-2011",
  t: "North Sea Texas",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "r-m-n-2022",
  t: "R.M.N.",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "riphagen-2016",
  t: "Riphagen",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 5,
  k: "s"
}, {
  id: "the-african-doctor-2016",
  t: "The African Doctor",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "comedy"],
  tg: [],
  p: 5
}, {
  id: "the-blue-caftan-2022",
  t: "The Blue Caftan",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "the-connection-2014",
  t: "The Connection",
  y: 2014,
  b: "r",
  s: "live",
  g: ["action", "crime", "thriller"],
  tg: ["detective"],
  p: 5
}, {
  id: "the-innocents-2016",
  t: "The Innocents",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "the-night-of-the-12th-2022",
  t: "The Night of the 12th",
  y: 2022,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 5
}, {
  id: "the-old-oak-2023",
  t: "The Old Oak",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "the-stranger-2025",
  t: "The Stranger",
  y: 2025,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "the-treatment-2014",
  t: "The Treatment",
  y: 2014,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 5
}, {
  id: "vortex-2021",
  t: "Vortex",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "young-hearts-2024",
  t: "Young Hearts",
  y: 2024,
  b: "k",
  s: "live",
  g: ["drama", "romance"],
  tg: ["family"],
  p: 5
}, {
  id: "another-day-of-life-2018",
  t: "Another Day of Life",
  y: 2018,
  b: "t",
  s: "live",
  g: ["animation", "drama"],
  tg: [],
  p: 4
}, {
  id: "black-2015",
  t: "Black",
  y: 2015,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 4
}, {
  id: "cold-case-hammarskj-ld-2019",
  t: "Cold Case Hammarskj\u00f6ld",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "colours-of-time-2025",
  t: "Colours of Time",
  y: 2025,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "farewell-mr-haffmann-2021",
  t: "Farewell, Mr. Haffmann",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "het-vonnis-2013",
  t: "Het vonnis",
  y: 2013,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 4
}, {
  id: "hotel-beau-s-jour-2016",
  t: "Hotel Beau S\u00e9jour",
  y: 2016,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 4,
  k: "s"
}, {
  id: "i-m-not-a-robot-2023",
  t: "I'm Not a Robot",
  y: 2023,
  b: "x",
  s: "live",
  g: ["comedy", "drama", "fantasy"],
  tg: [],
  p: 4
}, {
  id: "in-safe-hands-2018",
  t: "In Safe Hands",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "in-syria-2017",
  t: "In Syria",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 4
}, {
  id: "marina-2013",
  t: "Marina",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 4
}, {
  id: "no-man-s-land-2020",
  t: "No Man's Land",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: ["war"],
  p: 4,
  k: "s"
}, {
  id: "onoda-10-000-nights-in-the-jungle-2021",
  t: "Onoda: 10,000 Nights in the Jungle",
  y: 2021,
  b: "x",
  s: "live",
  g: ["adventure", "drama"],
  tg: [],
  p: 4
}, {
  id: "papicha-2019",
  t: "Papicha",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "playground-2021",
  t: "Playground",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "promise-at-dawn-2017",
  t: "Promise at Dawn",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "rebel-2022",
  t: "Rebel",
  y: 2022,
  b: "r",
  s: "live",
  g: ["action", "drama", "thriller"],
  tg: [],
  p: 4
}, {
  id: "rise-2022",
  t: "Rise",
  y: 2022,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "soundtrack-to-a-coup-d-etat-2024",
  t: "Soundtrack to a Coup d'Etat",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 4
}, {
  id: "the-attack-2012",
  t: "The Attack",
  y: 2012,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 4
}, {
  id: "the-big-bad-fox-and-other-tales-2017",
  t: "The Big Bad Fox and Other Tales",
  y: 2017,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 4
}, {
  id: "the-braid-2023",
  t: "The Braid",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "the-conductor-2018",
  t: "The Conductor",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "the-painting-2011",
  t: "The Painting",
  y: 2011,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "drama"],
  tg: [],
  p: 4
}, {
  id: "the-source-2011",
  t: "The Source",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "tori-and-lokita-2022",
  t: "Tori and Lokita",
  y: 2022,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 4
}, {
  id: "two-of-us-2019",
  t: "Two of Us",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "when-pigs-have-wings-2011",
  t: "When Pigs Have Wings",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 4
}, {
  id: "zillion-2022",
  t: "Zillion",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 4
},
// ===== France, 2011 onwards =====
{
  id: "now-you-see-me-2013",
  t: "Now You See Me",
  y: 2013,
  b: "r",
  s: "live",
  g: ["crime", "mystery", "thriller"],
  tg: ["detective"],
  p: 9
}, {
  id: "source-code-2011",
  t: "Source Code",
  y: 2011,
  b: "x",
  s: "live",
  g: ["action", "drama", "mystery"],
  tg: ["detective"],
  p: 9
}, {
  id: "anatomy-of-a-fall-2023",
  t: "Anatomy of a Fall",
  y: 2023,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 8
}, {
  id: "call-me-by-your-name-2017",
  t: "Call Me by Your Name",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 8
}, {
  id: "i-tonya-2017",
  t: "I, Tonya",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama", "comedy"],
  tg: [],
  p: 8
}, {
  id: "melancholia-2011",
  t: "Melancholia",
  y: 2011,
  b: "x",
  s: "live",
  g: ["drama", "scifi"],
  tg: [],
  p: 8
}, {
  id: "snowpiercer-2013",
  t: "Snowpiercer",
  y: 2013,
  b: "x",
  s: "live",
  g: ["action", "drama", "scifi"],
  tg: [],
  p: 8
}, {
  id: "the-adventures-of-tintin-2011",
  t: "The Adventures of Tintin",
  y: 2011,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: [],
  p: 8
}, {
  id: "the-father-2020",
  t: "The Father",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama", "mystery"],
  tg: ["detective"],
  p: 8
}, {
  id: "the-lobster-2015",
  t: "The Lobster",
  y: 2015,
  b: "x",
  s: "live",
  g: ["drama", "romance", "scifi"],
  tg: [],
  p: 8
}, {
  id: "triangle-of-sadness-2022",
  t: "Triangle of Sadness",
  y: 2022,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 8
}, {
  id: "amour-2012",
  t: "Amour",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "anthropoid-2016",
  t: "Anthropoid",
  y: 2016,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 7
}, {
  id: "carnage-2011",
  t: "Carnage",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 7
}, {
  id: "cold-war-2018",
  t: "Cold War",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "musical", "romance"],
  tg: ["music"],
  p: 7
}, {
  id: "force-majeure-2014",
  t: "Force Majeure",
  y: 2014,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 7
}, {
  id: "guillermo-del-toro-s-pinocchio-2022",
  t: "Guillermo del Toro's Pinocchio",
  y: 2022,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "drama"],
  tg: [],
  p: 7
}, {
  id: "i-m-still-here-2024",
  t: "I'm Still Here",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "ida-2013",
  t: "Ida",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "inside-llewyn-davis-2013",
  t: "Inside Llewyn Davis",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 7
}, {
  id: "miss-sloane-2016",
  t: "Miss Sloane",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "only-lovers-left-alive-2013",
  t: "Only Lovers Left Alive",
  y: 2013,
  b: "x",
  s: "live",
  g: ["comedy", "drama", "fantasy"],
  tg: [],
  p: 7
}, {
  id: "pain-and-glory-2019",
  t: "Pain and Glory",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "philomena-2013",
  t: "Philomena",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama", "comedy"],
  tg: [],
  p: 7
}, {
  id: "portrait-of-a-lady-on-fire-2019",
  t: "Portrait of a Lady on Fire",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "pride-2014",
  t: "Pride",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama", "comedy"],
  tg: [],
  p: 7
}, {
  id: "sentimental-value-2025",
  t: "Sentimental Value",
  y: 2025,
  b: "k",
  s: "live",
  g: ["drama"],
  tg: ["family"],
  p: 7
}, {
  id: "snowden-2016",
  t: "Snowden",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 7
}, {
  id: "still-alice-2014",
  t: "Still Alice",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "the-death-of-stalin-2017",
  t: "The Death of Stalin",
  y: 2017,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 7
}, {
  id: "the-great-beauty-2013",
  t: "The Great Beauty",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "the-guernsey-literary-and-potato-p-2018",
  t: "The Guernsey Literary and Potato Peel Pie Society",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: ["war"],
  p: 7
}, {
  id: "the-little-prince-2015",
  t: "The Little Prince",
  y: 2015,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 7
}, {
  id: "the-lunchbox-2013",
  t: "The Lunchbox",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "the-salesman-2016",
  t: "The Salesman",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 7
}, {
  id: "the-secret-agent-2025",
  t: "The Secret Agent",
  y: 2025,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-square-2017",
  t: "The Square",
  y: 2017,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 7
}, {
  id: "the-worst-person-in-the-world-2021",
  t: "The Worst Person in the World",
  y: 2021,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "winter-sleep-2014",
  t: "Winter Sleep",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "youth-2015",
  t: "Youth",
  y: 2015,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 7
}, {
  id: "a-hero-2021",
  t: "A Hero",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "about-dry-grasses-2023",
  t: "About Dry Grasses",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "an-officer-and-a-spy-2019",
  t: "An Officer and a Spy",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 6
}, {
  id: "bacurau-2019",
  t: "Bacurau",
  y: 2019,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 6
}, {
  id: "black-box-2021",
  t: "Black Box",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "thriller"],
  tg: ["detective"],
  p: 6
}, {
  id: "corpus-christi-2019",
  t: "Corpus Christi",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "dheepan-2015",
  t: "Dheepan",
  y: 2015,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 6
}, {
  id: "dogman-2018",
  t: "Dogman",
  y: 2018,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 6
}, {
  id: "flee-2021",
  t: "Flee",
  y: 2021,
  b: "t",
  s: "live",
  g: ["animation", "drama"],
  tg: [],
  p: 6
}, {
  id: "frantz-2016",
  t: "Frantz",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "happy-as-lazzaro-2018",
  t: "Happy as Lazzaro",
  y: 2018,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "mystery"],
  tg: ["detective"],
  p: 6
}, {
  id: "holy-spider-2022",
  t: "Holy Spider",
  y: 2022,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 6
}, {
  id: "i-am-not-your-negro-2016",
  t: "I Am Not Your Negro",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "i-lost-my-body-2019",
  t: "I Lost My Body",
  y: 2019,
  b: "t",
  s: "live",
  g: ["animation", "drama", "fantasy"],
  tg: [],
  p: 6
}, {
  id: "in-the-fade-2017",
  t: "In the Fade",
  y: 2017,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 6
}, {
  id: "in-the-house-2012",
  t: "In the House",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "thriller"],
  tg: ["detective"],
  p: 6
}, {
  id: "it-was-just-an-accident-2025",
  t: "It Was Just an Accident",
  y: 2025,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 6
}, {
  id: "jodorowsky-s-dune-2013",
  t: "Jodorowsky's Dune",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "la-chimera-2023",
  t: "La Chimera",
  y: 2023,
  b: "x",
  s: "live",
  g: ["adventure", "comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "la-belle-poque-2019",
  t: "La belle \u00e9poque",
  y: 2019,
  b: "x",
  s: "live",
  g: ["comedy", "drama", "fantasy"],
  tg: [],
  p: 6
}, {
  id: "laurence-anyways-2012",
  t: "Laurence Anyways",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "le-havre-2011",
  t: "Le Havre",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "les-mis-rables-2019",
  t: "Les Mis\u00e9rables",
  y: 2019,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 6
}, {
  id: "masaan-2015",
  t: "Masaan",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "mustang-2015",
  t: "Mustang",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "my-life-as-a-zucchini-2016",
  t: "My Life as a Zucchini",
  y: 2016,
  b: "t",
  s: "live",
  g: ["animation", "comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "no-2012",
  t: "No",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "petite-maman-2021",
  t: "Petite Maman",
  y: 2021,
  b: "x",
  s: "live",
  g: ["drama", "fantasy"],
  tg: [],
  p: 6
}, {
  id: "quo-vadis-aida-2020",
  t: "Quo Vadis, Aida?",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 6
}, {
  id: "race-2016",
  t: "Race",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 6
}, {
  id: "robot-dreams-2023",
  t: "Robot Dreams",
  y: 2023,
  b: "t",
  s: "live",
  g: ["animation", "comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "sorry-we-missed-you-2019",
  t: "Sorry We Missed You",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "sorry-baby-2025",
  t: "Sorry, Baby",
  y: 2025,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "the-beasts-2022",
  t: "The Beasts",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 6
}, {
  id: "the-b-lier-family-2014",
  t: "The B\u00e9lier Family",
  y: 2014,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 6
}, {
  id: "the-captain-2017",
  t: "The Captain",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 6
}, {
  id: "the-count-of-monte-cristo-2024",
  t: "The Count of Monte Cristo",
  y: 2024,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 6
}, {
  id: "the-insult-2017",
  t: "The Insult",
  y: 2017,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 6
}, {
  id: "the-past-2013",
  t: "The Past",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama", "mystery"],
  tg: ["detective"],
  p: 6
}, {
  id: "the-salt-of-the-earth-2014",
  t: "The Salt of the Earth",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "the-seed-of-the-sacred-fig-2024",
  t: "The Seed of the Sacred Fig",
  y: 2024,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 6
}, {
  id: "the-taste-of-things-2023",
  t: "The Taste of Things",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "the-turin-horse-2011",
  t: "The Turin Horse",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "the-voice-of-hind-rajab-2025",
  t: "The Voice of Hind Rajab",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 6
}, {
  id: "the-wild-pear-tree-2018",
  t: "The Wild Pear Tree",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "the-young-pope-2016",
  t: "The Young Pope",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "timbuktu-2014",
  t: "Timbuktu",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 6
}, {
  id: "tomboy-2011",
  t: "Tomboy",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "two-is-a-family-2016",
  t: "Two Is a Family",
  y: 2016,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "venus-in-fur-2013",
  t: "Venus in Fur",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "wolfwalkers-2020",
  t: "Wolfwalkers",
  y: 2020,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: [],
  p: 6
}, {
  id: "120-bpm-beats-per-minute-2017",
  t: "120 BPM (Beats Per Minute)",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "5-broken-cameras-2011",
  t: "5 Broken Cameras",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 5
}, {
  id: "a-bag-of-marbles-2017",
  t: "A Bag of Marbles",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "a-twelve-year-night-2018",
  t: "A Twelve-Year Night",
  y: 2018,
  b: "r",
  s: "live",
  g: ["adventure", "drama", "crime"],
  tg: ["detective"],
  p: 5
}, {
  id: "aferim-2015",
  t: "Aferim!",
  y: 2015,
  b: "x",
  s: "live",
  g: ["adventure", "comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "after-lucia-2012",
  t: "After Lucia",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "arco-2025",
  t: "Arco",
  y: 2025,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "fantasy"],
  tg: [],
  p: 5
}, {
  id: "asako-i-ii-2018",
  t: "Asako I & II",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "bad-seeds-2018",
  t: "Bad Seeds",
  y: 2018,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 5
}, {
  id: "being-17-2016",
  t: "Being 17",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "burning-days-2022",
  t: "Burning Days",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 5
}, {
  id: "caf-de-flore-2011",
  t: "Caf\u00e9 de Flore",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "clash-2016",
  t: "Clash",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: ["war"],
  p: 5
}, {
  id: "crossing-2024",
  t: "Crossing",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "crossing-lines-2013",
  t: "Crossing Lines",
  y: 2013,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 5,
  k: "s"
}, {
  id: "custody-2017",
  t: "Custody",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 5
}, {
  id: "devils-2020",
  t: "Devils",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "diplomacy-2014",
  t: "Diplomacy",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 5
}, {
  id: "divines-2016",
  t: "Divines",
  y: 2016,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "do-not-expect-too-much-from-the-en-2023",
  t: "Do Not Expect Too Much from the End of the World",
  y: 2023,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "endless-poetry-2016",
  t: "Endless Poetry",
  y: 2016,
  b: "x",
  s: "live",
  g: ["drama", "fantasy"],
  tg: [],
  p: 5
}, {
  id: "faces-places-2017",
  t: "Faces Places",
  y: 2017,
  b: "x",
  s: "live",
  g: ["adventure", "drama"],
  tg: [],
  p: 5
}, {
  id: "family-business-2019",
  t: "Family Business",
  y: 2019,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "far-from-men-2014",
  t: "Far from Men",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 5
}, {
  id: "full-time-2021",
  t: "Full Time",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 5
}, {
  id: "gett-2014",
  t: "Gett",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "godland-2022",
  t: "Godland",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "hannah-arendt-2012",
  t: "Hannah Arendt",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "happening-2021",
  t: "Happening",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "hidden-kisses-2016",
  t: "Hidden Kisses",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "hitchcock-truffaut-2015",
  t: "Hitchcock/Truffaut",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "human-2015",
  t: "Human",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "human-capital-2013",
  t: "Human Capital",
  y: 2013,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "in-bloom-2013",
  t: "In Bloom",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "la-mante-2017",
  t: "La Mante",
  y: 2017,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 5,
  k: "s"
}, {
  id: "left-handed-girl-2025",
  t: "Left-Handed Girl",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "like-crazy-2016",
  t: "Like Crazy",
  y: 2016,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "long-day-s-journey-into-night-2018",
  t: "Long Day's Journey Into Night",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "romance"],
  tg: ["detective"],
  p: 5
}, {
  id: "lost-illusions-2021",
  t: "Lost Illusions",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "magical-girl-2014",
  t: "Magical Girl",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 5
}, {
  id: "mars-express-2023",
  t: "Mars Express",
  y: 2023,
  b: "t",
  s: "live",
  g: ["action", "animation", "mystery"],
  tg: ["detective"],
  p: 5
}, {
  id: "midnight-sun-2016",
  t: "Midnight Sun",
  y: 2016,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 5,
  k: "s"
}, {
  id: "mr-mme-adelman-2017",
  t: "Mr & Mme Adelman",
  y: 2017,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "mune-guardian-of-the-moon-2014",
  t: "Mune: Guardian of the Moon",
  y: 2014,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 5
}, {
  id: "my-favourite-cake-2024",
  t: "My Favourite Cake",
  y: 2024,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "my-king-2015",
  t: "My King",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "nouvelle-vague-2025",
  t: "Nouvelle Vague",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama", "comedy"],
  tg: [],
  p: 5
}, {
  id: "only-the-animals-2019",
  t: "Only the Animals",
  y: 2019,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 5
}, {
  id: "palestine-36-2025",
  t: "Palestine 36",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 5
}, {
  id: "pina-2011",
  t: "Pina",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "play-2011",
  t: "Play",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "polisse-2011",
  t: "Polisse",
  y: 2011,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "pressure-2026",
  t: "Pressure",
  y: 2026,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 5
}, {
  id: "sauvage-wild-2018",
  t: "Sauvage/Wild",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "see-you-up-there-2017",
  t: "See You Up There",
  y: 2017,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "sieranevada-2016",
  t: "Sieranevada",
  y: 2016,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "sir-2018",
  t: "Sir",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "snow-white-2012",
  t: "Snow White",
  y: 2012,
  b: "x",
  s: "live",
  g: ["drama", "fantasy"],
  tg: [],
  p: 5
}, {
  id: "something-useful-2017",
  t: "Something Useful",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "souleymane-s-story-2024",
  t: "Souleymane's Story",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "sweet-bean-2015",
  t: "Sweet Bean",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "tabu-2012",
  t: "Tabu",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "the-dance-of-reality-2013",
  t: "The Dance of Reality",
  y: 2013,
  b: "x",
  s: "live",
  g: ["drama", "fantasy"],
  tg: [],
  p: 5
}, {
  id: "the-endless-trench-2019",
  t: "The Endless Trench",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "the-gatekeepers-2012",
  t: "The Gatekeepers",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 5
}, {
  id: "the-gilded-cage-2013",
  t: "The Gilded Cage",
  y: 2013,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "the-hookup-plan-2018",
  t: "The Hookup Plan",
  y: 2018,
  b: "r",
  s: "live",
  g: ["comedy", "romance"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "the-look-of-silence-2014",
  t: "The Look of Silence",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "the-marching-band-2024",
  t: "The Marching Band",
  y: 2024,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "the-patience-stone-2012",
  t: "The Patience Stone",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 5
}, {
  id: "the-specials-2019",
  t: "The Specials",
  y: 2019,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "the-summit-of-the-gods-2021",
  t: "The Summit of the Gods",
  y: 2021,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "drama"],
  tg: [],
  p: 5
}, {
  id: "the-traitor-2019",
  t: "The Traitor",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 5
}, {
  id: "what-will-people-say-2017",
  t: "What Will People Say",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "where-do-we-go-now-2011",
  t: "Where Do We Go Now?",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "woman-at-war-2018",
  t: "Woman at War",
  y: 2018,
  b: "x",
  s: "live",
  g: ["adventure", "comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "a-very-secret-service-2015",
  t: "A Very Secret Service",
  y: 2015,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "after-love-2020",
  t: "After Love",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "all-your-faces-2023",
  t: "All Your Faces",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "apocalypse-la-1-re-guerre-mondiale-2014",
  t: "Apocalypse la 1\u00e8re Guerre mondiale",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 4,
  k: "s"
}, {
  id: "circles-2013",
  t: "Circles",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "corn-island-2014",
  t: "Corn Island",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 4
}, {
  id: "crist-bal-balenciaga-2024",
  t: "Crist\u00f3bal Balenciaga",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "cyrano-my-love-2018",
  t: "Cyrano, My Love",
  y: 2018,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "diaz-don-t-clean-up-this-blood-2012",
  t: "Diaz - Don't Clean Up This Blood",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "dior-and-i-2014",
  t: "Dior and I",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "driving-madeleine-2022",
  t: "Driving Madeleine",
  y: 2022,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "four-daughters-2023",
  t: "Four Daughters",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "frenzy-2015",
  t: "Frenzy",
  y: 2015,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 4
}, {
  id: "girl-you-know-it-s-true-2023",
  t: "Girl You Know It's True",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 4
}, {
  id: "inhuman-resources-2020",
  t: "Inhuman Resources",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "kahlil-gibran-s-the-prophet-2014",
  t: "Kahlil Gibran's The Prophet",
  y: 2014,
  b: "t",
  s: "live",
  g: ["animation", "drama"],
  tg: [],
  p: 4
}, {
  id: "li-l-quinquin-2014",
  t: "Li'l Quinquin",
  y: 2014,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "mystery"],
  tg: ["detective"],
  p: 4,
  k: "s"
}, {
  id: "long-way-north-2015",
  t: "Long Way North",
  y: 2015,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "drama"],
  tg: [],
  p: 4
}, {
  id: "monsieur-aznavour-2024",
  t: "Monsieur Aznavour",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 4
}, {
  id: "my-happy-family-2017",
  t: "My Happy Family",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "pamfir-2022",
  t: "Pamfir",
  y: 2022,
  b: "r",
  s: "live",
  g: ["action", "drama", "thriller"],
  tg: [],
  p: 4
}, {
  id: "stations-of-the-cross-2014",
  t: "Stations of the Cross",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "the-collapse-2019",
  t: "The Collapse",
  y: 2019,
  b: "x",
  s: "live",
  g: ["adventure"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "the-snows-of-kilimanjaro-2011",
  t: "The Snows of Kilimanjaro",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "what-the-day-owes-the-night-2012",
  t: "What the Day Owes the Night",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
},
// ===== United Kingdom, 2011 onwards =====
{
  id: "darkest-hour-2017",
  t: "Darkest Hour",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "sex-education-2019",
  t: "Sex Education",
  y: 2019,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 8,
  k: "s"
}, {
  id: "shame-2011",
  t: "Shame",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "the-king-2019",
  t: "The King",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "71-2014",
  t: "'71",
  y: 2014,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "all-of-us-strangers-2023",
  t: "All of Us Strangers",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "amy-2015",
  t: "Amy",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 7
}, {
  id: "belfast-2021",
  t: "Belfast",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "boiling-point-2021",
  t: "Boiling Point",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 7
}, {
  id: "brooklyn-2015",
  t: "Brooklyn",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "calvary-2014",
  t: "Calvary",
  y: 2014,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 7
}, {
  id: "downton-abbey-2019",
  t: "Downton Abbey",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "eye-in-the-sky-2015",
  t: "Eye in the Sky",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: ["war"],
  p: 7
}, {
  id: "searching-for-sugar-man-2012",
  t: "Searching for Sugar Man",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 7
}, {
  id: "taboo-2017",
  t: "Taboo",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "thriller"],
  tg: ["detective"],
  p: 7,
  k: "s"
}, {
  id: "the-best-exotic-marigold-hotel-2011",
  t: "The Best Exotic Marigold Hotel",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "the-courier-2020",
  t: "The Courier",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama", "mystery"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-guard-2011",
  t: "The Guard",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "thriller"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-man-who-knew-infinity-2015",
  t: "The Man Who Knew Infinity",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "the-stranger-2020",
  t: "The Stranger",
  y: 2020,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 7,
  k: "s"
}, {
  id: "a-street-cat-named-bob-2016",
  t: "A Street Cat Named Bob",
  y: 2016,
  b: "k",
  s: "live",
  g: ["drama"],
  tg: ["family"],
  p: 6
}, {
  id: "a-very-english-scandal-2018",
  t: "A Very English Scandal",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "comedy", "crime"],
  tg: ["detective"],
  p: 6,
  k: "s"
}, {
  id: "belle-2013",
  t: "Belle",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "breathe-2017",
  t: "Breathe",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "c-b-strike-2017",
  t: "C.B. Strike",
  y: 2017,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 6,
  k: "s"
}, {
  id: "david-attenborough-a-life-on-our-p-2020",
  t: "David Attenborough: A Life on Our Planet",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "diego-maradona-2019",
  t: "Diego Maradona",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 6
}, {
  id: "god-s-own-country-2017",
  t: "God's Own Country",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "good-luck-to-you-leo-grande-2022",
  t: "Good Luck to You, Leo Grande",
  y: 2022,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "i-swear-2025",
  t: "I Swear",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "kneecap-2024",
  t: "Kneecap",
  y: 2024,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 6
}, {
  id: "living-2022",
  t: "Living",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "one-life-2023",
  t: "One Life",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "ricky-gervais-humanity-2018",
  t: "Ricky Gervais: Humanity",
  y: 2018,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "ricky-gervais-supernature-2022",
  t: "Ricky Gervais: SuperNature",
  y: 2022,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 6
}, {
  id: "rivals-2024",
  t: "Rivals",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "stan-ollie-2018",
  t: "Stan & Ollie",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "comedy"],
  tg: [],
  p: 6
}, {
  id: "starred-up-2013",
  t: "Starred Up",
  y: 2013,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 6
}, {
  id: "tell-me-who-i-am-2019",
  t: "Tell Me Who I Am",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "mystery"],
  tg: ["detective"],
  p: 6
}, {
  id: "testament-of-youth-2014",
  t: "Testament of Youth",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "the-act-of-killing-2012",
  t: "The Act of Killing",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 6
}, {
  id: "the-ballad-of-wallis-island-2025",
  t: "The Ballad of Wallis Island",
  y: 2025,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 6
}, {
  id: "the-boy-who-harnessed-the-wind-2019",
  t: "The Boy Who Harnessed the Wind",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "the-english-game-2020",
  t: "The English Game",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 6,
  k: "s"
}, {
  id: "the-musketeers-2014",
  t: "The Musketeers",
  y: 2014,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "they-shall-not-grow-old-2018",
  t: "They Shall Not Grow Old",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 6
}, {
  id: "tyrannosaur-2011",
  t: "Tyrannosaur",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "war-peace-2016",
  t: "War & Peace",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "weekend-2011",
  t: "Weekend",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "20-000-days-on-earth-2014",
  t: "20,000 Days on Earth",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "baptiste-2019",
  t: "Baptiste",
  y: 2019,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 5,
  k: "s"
}, {
  id: "birdsong-2012",
  t: "Birdsong",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: ["war"],
  p: 5,
  k: "s"
}, {
  id: "broken-2012",
  t: "Broken",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "cunk-on-life-2024",
  t: "Cunk on Life",
  y: 2024,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 5
}, {
  id: "for-sama-2019",
  t: "For Sama",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 5
}, {
  id: "great-expectations-2011",
  t: "Great Expectations",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "informer-2018",
  t: "Informer",
  y: 2018,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 5,
  k: "s"
}, {
  id: "mrs-wilson-2018",
  t: "Mrs. Wilson",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "mystery"],
  tg: ["detective"],
  p: 5,
  k: "s"
}, {
  id: "oasis-supersonic-2016",
  t: "Oasis: Supersonic",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "ordeal-by-innocence-2018",
  t: "Ordeal by Innocence",
  y: 2018,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 5,
  k: "s"
}, {
  id: "rye-lane-2023",
  t: "Rye Lane",
  y: 2023,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "staged-2020",
  t: "Staged",
  y: 2020,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "the-bastard-son-the-devil-himself-2022",
  t: "The Bastard Son & The Devil Himself",
  y: 2022,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "the-paradise-2012",
  t: "The Paradise",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "the-phantom-of-the-opera-at-the-ro-2011",
  t: "The Phantom of the Opera at the Royal Albert Hall",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama", "musical", "romance"],
  tg: [],
  p: 5
}, {
  id: "the-salisbury-poisonings-2020",
  t: "The Salisbury Poisonings",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "the-selfish-giant-2013",
  t: "The Selfish Giant",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "this-is-england-88-2011",
  t: "This Is England '88",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 5,
  k: "s"
}, {
  id: "this-is-england-90-2015",
  t: "This Is England '90",
  y: 2015,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 5,
  k: "s"
}, {
  id: "virunga-2014",
  t: "Virunga",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 5
}, {
  id: "we-are-lady-parts-2021",
  t: "We Are Lady Parts",
  y: 2021,
  b: "r",
  s: "live",
  g: ["comedy", "musical"],
  tg: ["music"],
  p: 5,
  k: "s"
}, {
  id: "wham-2023",
  t: "Wham!",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "wild-bill-2011",
  t: "Wild Bill",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 5
},
// ===== Japan, 2011 onwards =====
{
  id: "the-theory-of-everything-2014",
  t: "The Theory of Everything",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 8
}, {
  id: "burning-2018",
  t: "Burning",
  y: 2018,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["japan", "detective"],
  p: 7
}, {
  id: "cyberpunk-edgerunners-2022",
  t: "Cyberpunk: Edgerunners",
  y: 2022,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: [],
  p: 7,
  k: "s"
}, {
  id: "rental-family-2025",
  t: "Rental Family",
  y: 2025,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 7
}, {
  id: "silence-2016",
  t: "Silence",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "the-final-chapters-special-2-2023",
  t: "The Final Chapters: Special 2",
  y: 2023,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: [],
  p: 7
}, {
  id: "the-tale-of-the-princess-kaguya-2013",
  t: "The Tale of The Princess Kaguya",
  y: 2013,
  b: "k",
  s: "live",
  g: ["animation", "drama"],
  tg: ["family", "japan", "anime"],
  p: 7
}, {
  id: "attack-on-titan-the-last-attack-2024",
  t: "Attack on Titan: The Last Attack",
  y: 2024,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: ["japan", "anime"],
  p: 6
}, {
  id: "demon-slayer-kimetsu-no-yaiba-mt-n-2020",
  t: "Demon Slayer: Kimetsu no Yaiba - Mt. Natagumo Arc",
  y: 2020,
  b: "t",
  s: "live",
  g: ["action", "animation", "fantasy"],
  tg: ["japan", "anime"],
  p: 6
}, {
  id: "like-father-like-son-2013",
  t: "Like Father, Like Son",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan"],
  p: 6
}, {
  id: "monster-2023",
  t: "Monster",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "thriller"],
  tg: ["japan", "detective"],
  p: 6
}, {
  id: "one-cut-of-the-dead-2017",
  t: "One Cut of the Dead",
  y: 2017,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "horror"],
  tg: ["japan"],
  p: 6
}, {
  id: "our-little-sister-2015",
  t: "Our Little Sister",
  y: 2015,
  b: "k",
  s: "live",
  g: ["drama"],
  tg: ["family", "japan"],
  p: 6
}, {
  id: "rurouni-kenshin-part-i-origins-2012",
  t: "Rurouni Kenshin Part I: Origins",
  y: 2012,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: ["japan"],
  p: 6
}, {
  id: "rurouni-kenshin-part-ii-kyoto-infe-2014",
  t: "Rurouni Kenshin Part II: Kyoto Inferno",
  y: 2014,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: ["japan"],
  p: 6
}, {
  id: "the-last-naruto-the-movie-2014",
  t: "The Last: Naruto the Movie",
  y: 2014,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: ["japan", "anime"],
  p: 6
}, {
  id: "after-the-storm-2016",
  t: "After the Storm",
  y: 2016,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["japan"],
  p: 5
}, {
  id: "attack-on-titan-the-roar-of-awaken-2018",
  t: "Attack on Titan: The Roar of Awakening",
  y: 2018,
  b: "t",
  s: "live",
  g: ["action", "animation", "fantasy"],
  tg: ["japan", "anime"],
  p: 5
}, {
  id: "beastars-2019",
  t: "Beastars",
  y: 2019,
  b: "r",
  s: "live",
  g: ["animation", "crime", "drama"],
  tg: ["detective"],
  p: 5,
  k: "s"
}, {
  id: "beyond-the-infinite-two-minutes-2020",
  t: "Beyond the Infinite Two Minutes",
  y: 2020,
  b: "x",
  s: "live",
  g: ["comedy", "scifi"],
  tg: ["japan"],
  p: 5
}, {
  id: "demon-slayer-kimetsu-no-yaiba-to-t-2023",
  t: "Demon Slayer: Kimetsu No Yaiba - To the Swordsmith Village",
  y: 2023,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: ["japan", "anime"],
  p: 5
}, {
  id: "hara-kiri-death-of-a-samurai-2011",
  t: "Hara-Kiri: Death of a Samurai",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan"],
  p: 5
}, {
  id: "i-wish-2011",
  t: "I Wish",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan"],
  p: 5
}, {
  id: "kabaneri-of-the-iron-fortress-2016",
  t: "Kabaneri of the Iron Fortress",
  y: 2016,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: ["japan", "anime"],
  p: 5,
  k: "s"
}, {
  id: "kokuho-2025",
  t: "Kokuho",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan"],
  p: 5
}, {
  id: "my-tomorrow-your-yesterday-2016",
  t: "My Tomorrow, Your Yesterday",
  y: 2016,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "romance"],
  tg: ["japan"],
  p: 5
}, {
  id: "road-to-ninja-naruto-the-movie-2012",
  t: "Road to Ninja - Naruto the Movie",
  y: 2012,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: ["japan", "anime"],
  p: 5
}, {
  id: "rurouni-kenshin-final-chapter-part-2021",
  t: "Rurouni Kenshin: Final Chapter Part I - The Final",
  y: 2021,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: ["japan"],
  p: 5
}, {
  id: "rurouni-kenshin-final-chapter-part-2021-2",
  t: "Rurouni Kenshin: Final Chapter Part II - The Beginning",
  y: 2021,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: ["japan"],
  p: 5
}, {
  id: "rurouni-kenshin-the-legend-ends-2014",
  t: "Rurouni Kenshin: The Legend Ends",
  y: 2014,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: ["japan"],
  p: 5
}, {
  id: "the-anthem-of-the-heart-2015",
  t: "The Anthem of the Heart",
  y: 2015,
  b: "t",
  s: "live",
  g: ["animation", "drama", "fantasy"],
  tg: ["japan", "anime"],
  p: 5
}, {
  id: "the-kingdom-of-dreams-and-madness-2013",
  t: "The Kingdom of Dreams and Madness",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan"],
  p: 5
}, {
  id: "the-naked-director-2019",
  t: "The Naked Director",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan"],
  p: 5,
  k: "s"
}, {
  id: "the-night-is-short-walk-on-girl-2017",
  t: "The Night Is Short, Walk on Girl",
  y: 2017,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: ["japan", "anime"],
  p: 5
}, {
  id: "wheel-of-fortune-and-fantasy-2021",
  t: "Wheel of Fortune and Fantasy",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: ["japan"],
  p: 5
}, {
  id: "black-box-diaries-2024",
  t: "Black Box Diaries",
  y: 2024,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["japan", "detective"],
  p: 4
}, {
  id: "cherry-magic-thirty-years-of-virgi-2020",
  t: "Cherry Magic! Thirty Years of Virginity Can Make You a Wizard?!",
  y: 2020,
  b: "x",
  s: "live",
  g: ["comedy", "fantasy", "romance"],
  tg: ["japan"],
  p: 4,
  k: "s"
}, {
  id: "demon-slayer-kimetsu-no-yaiba-asak-2021",
  t: "Demon Slayer: Kimetsu no Yaiba - Asakusa Arc",
  y: 2021,
  b: "t",
  s: "live",
  g: ["action", "animation", "fantasy"],
  tg: ["japan", "anime"],
  p: 4
}, {
  id: "drawing-closer-2024",
  t: "Drawing Closer",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: ["japan"],
  p: 4
}, {
  id: "flying-colors-2015",
  t: "Flying Colors",
  y: 2015,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["japan"],
  p: 4
}, {
  id: "kizumonogatari-part-2-nekketsu-2016",
  t: "Kizumonogatari Part 2: Nekketsu",
  y: 2016,
  b: "t",
  s: "live",
  g: ["action", "animation", "drama"],
  tg: ["japan", "anime"],
  p: 4
}, {
  id: "kizumonogatari-part-3-reiketsu-2017",
  t: "Kizumonogatari Part 3: Reiketsu",
  y: 2017,
  b: "t",
  s: "live",
  g: ["action", "animation", "drama"],
  tg: ["japan", "anime"],
  p: 4
}, {
  id: "supernatural-the-animation-2011",
  t: "Supernatural: The Animation",
  y: 2011,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "drama"],
  tg: ["japan", "anime"],
  p: 4,
  k: "s"
}, {
  id: "tsuredure-children-2017",
  t: "Tsuredure Children",
  y: 2017,
  b: "t",
  s: "live",
  g: ["animation", "comedy", "romance"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "we-made-a-beautiful-bouquet-2021",
  t: "We Made a Beautiful Bouquet",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: ["japan"],
  p: 4
}, {
  id: "wood-job-2014",
  t: "Wood Job!",
  y: 2014,
  b: "x",
  s: "live",
  g: ["adventure", "comedy"],
  tg: ["japan"],
  p: 4
},
// ===== South Korea, 2011 onwards =====
{
  id: "decision-to-leave-2022",
  t: "Decision to Leave",
  y: 2022,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 7
}, {
  id: "forgotten-2017",
  t: "Forgotten",
  y: 2017,
  b: "r",
  s: "live",
  g: ["crime", "mystery", "thriller"],
  tg: ["detective"],
  p: 7
}, {
  id: "no-other-choice-2025",
  t: "No Other Choice",
  y: 2025,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-wailing-2016",
  t: "The Wailing",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "horror"],
  tg: [],
  p: 7
}, {
  id: "a-hard-day-2014",
  t: "A Hard Day",
  y: 2014,
  b: "r",
  s: "live",
  g: ["action", "crime", "thriller"],
  tg: ["detective"],
  p: 6
}, {
  id: "a-taxi-driver-2017",
  t: "A Taxi Driver",
  y: 2017,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 6
}, {
  id: "along-with-the-gods-the-two-worlds-2017",
  t: "Along With the Gods: The Two Worlds",
  y: 2017,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 6
}, {
  id: "miracle-in-cell-no-7-2013",
  t: "Miracle in Cell No. 7",
  y: 2013,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "new-world-2013",
  t: "New World",
  y: 2013,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 6
}, {
  id: "silenced-2011",
  t: "Silenced",
  y: 2011,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 6
}, {
  id: "the-glory-2022",
  t: "The Glory",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "thriller"],
  tg: ["detective"],
  p: 6,
  k: "s"
}, {
  id: "the-witch-part-1-the-subversion-2018",
  t: "The Witch: Part 1 - The Subversion",
  y: 2018,
  b: "x",
  s: "live",
  g: ["action", "mystery", "scifi"],
  tg: ["detective"],
  p: 6
}, {
  id: "1987-when-the-day-comes-2017",
  t: "1987: When the Day Comes",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 5
}, {
  id: "20th-century-girl-2022",
  t: "20th Century Girl",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "a-korean-odyssey-2017",
  t: "A Korean Odyssey",
  y: 2017,
  b: "r",
  s: "live",
  g: ["comedy", "fantasy", "horror"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "a-werewolf-boy-2012",
  t: "A Werewolf Boy",
  y: 2012,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "romance"],
  tg: [],
  p: 5
}, {
  id: "always-2011",
  t: "Always",
  y: 2011,
  b: "x",
  s: "live",
  g: ["action", "drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "assassination-2015",
  t: "Assassination",
  y: 2015,
  b: "r",
  s: "live",
  g: ["action", "drama", "thriller"],
  tg: [],
  p: 5
}, {
  id: "be-with-you-2018",
  t: "Be with You",
  y: 2018,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "romance"],
  tg: [],
  p: 5
}, {
  id: "hope-2013",
  t: "Hope",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "jung-kook-i-am-still-2024",
  t: "Jung Kook: I Am Still",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "masquerade-2012",
  t: "Masquerade",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "memoir-of-a-murderer-2017",
  t: "Memoir of a Murderer",
  y: 2017,
  b: "r",
  s: "live",
  g: ["action", "crime", "mystery"],
  tg: ["detective"],
  p: 5
}, {
  id: "memories-of-the-alhambra-2018",
  t: "Memories of the Alhambra",
  y: 2018,
  b: "x",
  s: "live",
  g: ["drama", "romance", "scifi"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "midnight-runners-2017",
  t: "Midnight Runners",
  y: 2017,
  b: "x",
  s: "live",
  g: ["action", "comedy"],
  tg: [],
  p: 5
}, {
  id: "montage-2013",
  t: "Montage",
  y: 2013,
  b: "r",
  s: "live",
  g: ["crime", "mystery", "thriller"],
  tg: ["detective"],
  p: 5
}, {
  id: "my-way-2011",
  t: "My Way",
  y: 2011,
  b: "r",
  s: "live",
  g: ["action", "drama"],
  tg: ["war"],
  p: 5
}, {
  id: "ode-to-my-father-2014",
  t: "Ode to My Father",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 5
}, {
  id: "sunny-2011",
  t: "Sunny",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "the-attorney-2013",
  t: "The Attorney",
  y: 2013,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "the-beauty-inside-2015",
  t: "The Beauty Inside",
  y: 2015,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "romance"],
  tg: [],
  p: 5
}, {
  id: "the-front-line-2011",
  t: "The Front Line",
  y: 2011,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 5
}, {
  id: "the-outlaws-2017",
  t: "The Outlaws",
  y: 2017,
  b: "r",
  s: "live",
  g: ["action", "crime", "thriller"],
  tg: ["detective"],
  p: 5
}, {
  id: "the-spy-gone-north-2018",
  t: "The Spy Gone North",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 5
}, {
  id: "the-tiger-2015",
  t: "The Tiger",
  y: 2015,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 5
}, {
  id: "tune-in-for-love-2019",
  t: "Tune in for Love",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "12-12-the-day-2023",
  t: "12.12: The Day",
  y: 2023,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 4
}, {
  id: "architecture-101-2012",
  t: "Architecture 101",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "burn-the-stage-the-movie-2018",
  t: "Burn the Stage: The Movie",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 4
}, {
  id: "doctor-stranger-2014",
  t: "Doctor Stranger",
  y: 2014,
  b: "x",
  s: "live",
  g: ["action", "drama", "romance"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "doctors-2016",
  t: "Doctors",
  y: 2016,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "house-of-hummingbird-2018",
  t: "House of Hummingbird",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "kim-ji-young-born-1982-2019",
  t: "Kim Ji-young: Born 1982",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "lawless-lawyer-2018",
  t: "Lawless Lawyer",
  y: 2018,
  b: "r",
  s: "live",
  g: ["action", "drama", "thriller"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "little-forest-2018",
  t: "Little Forest",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "miss-granny-2014",
  t: "Miss Granny",
  y: 2014,
  b: "x",
  s: "live",
  g: ["comedy", "drama", "fantasy"],
  tg: [],
  p: 4
}, {
  id: "my-annoying-brother-2016",
  t: "My Annoying Brother",
  y: 2016,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "sports"],
  tg: ["sports"],
  p: 4
}, {
  id: "my-first-first-love-2019",
  t: "My First First Love",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "my-holo-love-2020",
  t: "My Holo Love",
  y: 2020,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "my-lovely-liar-2023",
  t: "My Lovely Liar",
  y: 2023,
  b: "x",
  s: "live",
  g: ["comedy", "fantasy", "mystery"],
  tg: ["detective"],
  p: 4,
  k: "s"
}, {
  id: "one-ordinary-day-2021",
  t: "One Ordinary Day",
  y: 2021,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 4,
  k: "s"
}, {
  id: "school-2017-2017",
  t: "School 2017",
  y: 2017,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "mystery"],
  tg: ["detective"],
  p: 4,
  k: "s"
}, {
  id: "the-net-2016",
  t: "The Net",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "the-secret-life-of-my-secretary-2019",
  t: "The Secret Life of My Secretary",
  y: 2019,
  b: "r",
  s: "live",
  g: ["comedy", "romance"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "who-are-you-school-2015-2015",
  t: "Who Are You: School 2015",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "romance"],
  tg: ["detective"],
  p: 4,
  k: "s"
},
// ===== United States, 2011 onwards =====
{
  id: "12-years-a-slave-2013",
  t: "12 Years a Slave",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 9
}, {
  id: "argo-2012",
  t: "Argo",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 9
}, {
  id: "birdman-or-the-unexpected-virtue-o-2014",
  t: "Birdman or (The Unexpected Virtue of Ignorance)",
  y: 2014,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 9
}, {
  id: "captain-america-civil-war-2016",
  t: "Captain America: Civil War",
  y: 2016,
  b: "x",
  s: "live",
  g: ["action", "scifi"],
  tg: [],
  p: 9
}, {
  id: "deadpool-2-2018",
  t: "Deadpool 2",
  y: 2018,
  b: "x",
  s: "live",
  g: ["action", "adventure", "comedy"],
  tg: [],
  p: 9
}, {
  id: "drive-2011",
  t: "Drive",
  y: 2011,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 9
}, {
  id: "dune-part-one-2021",
  t: "Dune: Part One",
  y: 2021,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 9
}, {
  id: "fury-2014",
  t: "Fury",
  y: 2014,
  b: "r",
  s: "live",
  g: ["action", "drama"],
  tg: ["war"],
  p: 9
}, {
  id: "guardians-of-the-galaxy-vol-2-2017",
  t: "Guardians of the Galaxy: Vol. 2",
  y: 2017,
  b: "x",
  s: "live",
  g: ["action", "adventure", "comedy"],
  tg: [],
  p: 9
}, {
  id: "hacksaw-ridge-2016",
  t: "Hacksaw Ridge",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 9
}, {
  id: "harry-potter-and-the-deathly-hallo-2011",
  t: "Harry Potter and the Deathly Hallows: Part 2",
  y: 2011,
  b: "k",
  s: "live",
  g: ["adventure", "fantasy"],
  tg: ["family"],
  p: 9
}, {
  id: "life-of-pi-2012",
  t: "Life of Pi",
  y: 2012,
  b: "x",
  s: "live",
  g: ["adventure", "drama", "fantasy"],
  tg: [],
  p: 9
}, {
  id: "nightcrawler-2014",
  t: "Nightcrawler",
  y: 2014,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 9
}, {
  id: "once-upon-a-time-in-hollywood-2019",
  t: "Once Upon a Time in... Hollywood",
  y: 2019,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 9
}, {
  id: "rise-of-the-planet-of-the-apes-2011",
  t: "Rise of the Planet of the Apes",
  y: 2011,
  b: "x",
  s: "live",
  g: ["action", "drama", "scifi"],
  tg: [],
  p: 9
}, {
  id: "rush-2013",
  t: "Rush",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 9
}, {
  id: "silver-linings-playbook-2012",
  t: "Silver Linings Playbook",
  y: 2012,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 9
}, {
  id: "star-wars-episode-vii-the-force-aw-2015",
  t: "Star Wars: Episode VII - The Force Awakens",
  y: 2015,
  b: "x",
  s: "live",
  g: ["action", "adventure", "scifi"],
  tg: [],
  p: 9
}, {
  id: "the-hateful-eight-2015",
  t: "The Hateful Eight",
  y: 2015,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 9
}, {
  id: "the-hobbit-the-desolation-of-smaug-2013",
  t: "The Hobbit: The Desolation of Smaug",
  y: 2013,
  b: "x",
  s: "live",
  g: ["adventure", "fantasy"],
  tg: [],
  p: 9
}, {
  id: "the-imitation-game-2014",
  t: "The Imitation Game",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 9
}, {
  id: "the-perks-of-being-a-wallflower-2012",
  t: "The Perks of Being a Wallflower",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 9
}, {
  id: "the-revenant-2015",
  t: "The Revenant",
  y: 2015,
  b: "x",
  s: "live",
  g: ["action", "drama", "adventure"],
  tg: [],
  p: 9
}, {
  id: "three-billboards-outside-ebbing-mi-2017",
  t: "Three Billboards Outside Ebbing, Missouri",
  y: 2017,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 9
}, {
  id: "x-men-days-of-future-past-2014",
  t: "X-Men: Days of Future Past",
  y: 2014,
  b: "x",
  s: "live",
  g: ["action", "adventure", "scifi"],
  tg: [],
  p: 9
}, {
  id: "x-men-first-class-2011",
  t: "X-Men: First Class",
  y: 2011,
  b: "x",
  s: "live",
  g: ["action", "scifi"],
  tg: [],
  p: 9
}, {
  id: "50-50-2011",
  t: "50/50",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 8
}, {
  id: "a-star-is-born-2018",
  t: "A Star Is Born",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "musical", "romance"],
  tg: ["music"],
  p: 8
}, {
  id: "all-quiet-on-the-western-front-2022",
  t: "All Quiet on the Western Front",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 8
}, {
  id: "before-midnight-2013",
  t: "Before Midnight",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 8
}, {
  id: "boyhood-2014",
  t: "Boyhood",
  y: 2014,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 8
}, {
  id: "bridge-of-spies-2015",
  t: "Bridge of Spies",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 8
}, {
  id: "captain-fantastic-2016",
  t: "Captain Fantastic",
  y: 2016,
  b: "x",
  s: "live",
  g: ["adventure", "comedy", "drama"],
  tg: [],
  p: 8
}, {
  id: "captain-phillips-2013",
  t: "Captain Phillips",
  y: 2013,
  b: "r",
  s: "live",
  g: ["action", "drama", "crime"],
  tg: ["detective"],
  p: 8
}, {
  id: "dallas-buyers-club-2013",
  t: "Dallas Buyers Club",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "dawn-of-the-planet-of-the-apes-2014",
  t: "Dawn of the Planet of the Apes",
  y: 2014,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 8
}, {
  id: "end-of-watch-2012",
  t: "End of Watch",
  y: 2012,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 8
}, {
  id: "euphoria-2019",
  t: "Euphoria",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8,
  k: "s"
}, {
  id: "gotham-2014",
  t: "Gotham",
  y: 2014,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 8,
  k: "s"
}, {
  id: "guardians-of-the-galaxy-vol-3-2023",
  t: "Guardians of the Galaxy Vol. 3",
  y: 2023,
  b: "x",
  s: "live",
  g: ["action", "adventure", "comedy"],
  tg: [],
  p: 8
}, {
  id: "hell-or-high-water-2016",
  t: "Hell or High Water",
  y: 2016,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "isle-of-dogs-2018",
  t: "Isle of Dogs",
  y: 2018,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 8
}, {
  id: "jojo-rabbit-2019",
  t: "Jojo Rabbit",
  y: 2019,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["war"],
  p: 8
}, {
  id: "lion-2016",
  t: "Lion",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "little-women-2019",
  t: "Little Women",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 8
}, {
  id: "manchester-by-the-sea-2016",
  t: "Manchester by the Sea",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "marriage-story-2019",
  t: "Marriage Story",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 8
}, {
  id: "marty-supreme-2025",
  t: "Marty Supreme",
  y: 2025,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "sports"],
  tg: ["sports"],
  p: 8
}, {
  id: "midnight-in-paris-2011",
  t: "Midnight in Paris",
  y: 2011,
  b: "x",
  s: "live",
  g: ["comedy", "fantasy", "romance"],
  tg: [],
  p: 8
}, {
  id: "mission-impossible-dead-reckoning--2023",
  t: "Mission: Impossible - Dead Reckoning Part One",
  y: 2023,
  b: "r",
  s: "live",
  g: ["action", "adventure", "thriller"],
  tg: [],
  p: 8
}, {
  id: "moonrise-kingdom-2012",
  t: "Moonrise Kingdom",
  y: 2012,
  b: "x",
  s: "live",
  g: ["adventure", "comedy", "drama"],
  tg: [],
  p: 8
}, {
  id: "obsession-2025",
  t: "Obsession",
  y: 2025,
  b: "r",
  s: "live",
  g: ["horror", "romance", "thriller"],
  tg: [],
  p: 8
}, {
  id: "poor-things-2023",
  t: "Poor Things",
  y: 2023,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 8
}, {
  id: "project-hail-mary-2026",
  t: "Project Hail Mary",
  y: 2026,
  b: "x",
  s: "live",
  g: ["adventure", "comedy", "drama"],
  tg: [],
  p: 8
}, {
  id: "roma-2018",
  t: "Roma",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "room-2015",
  t: "Room",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 8
}, {
  id: "searching-2018",
  t: "Searching",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "sicario-2015",
  t: "Sicario",
  y: 2015,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 8
}, {
  id: "sound-of-metal-2019",
  t: "Sound of Metal",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 8
}, {
  id: "star-trek-into-darkness-2013",
  t: "Star Trek Into Darkness",
  y: 2013,
  b: "x",
  s: "live",
  g: ["action", "adventure", "scifi"],
  tg: [],
  p: 8
}, {
  id: "straight-outta-compton-2015",
  t: "Straight Outta Compton",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "the-banshees-of-inisherin-2022",
  t: "The Banshees of Inisherin",
  y: 2022,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 8
}, {
  id: "the-gentlemen-2019",
  t: "The Gentlemen",
  y: 2019,
  b: "r",
  s: "live",
  g: ["action", "comedy", "crime"],
  tg: ["detective"],
  p: 8
}, {
  id: "the-girl-with-the-dragon-tattoo-2011",
  t: "The Girl with the Dragon Tattoo",
  y: 2011,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 8
}, {
  id: "the-help-2011",
  t: "The Help",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "the-holdovers-2023",
  t: "The Holdovers",
  y: 2023,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 8
}, {
  id: "the-irishman-2019",
  t: "The Irishman",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 8
}, {
  id: "the-trial-of-the-chicago-7-2020",
  t: "The Trial of the Chicago 7",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 8
}, {
  id: "the-whale-2022",
  t: "The Whale",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "warrior-2011",
  t: "Warrior",
  y: 2011,
  b: "x",
  s: "live",
  g: ["action", "drama", "sports"],
  tg: ["sports"],
  p: 8
}, {
  id: "wind-river-2017",
  t: "Wind River",
  y: 2017,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 8
}, {
  id: "zack-snyder-s-justice-league-2021",
  t: "Zack Snyder's Justice League",
  y: 2021,
  b: "x",
  s: "live",
  g: ["adventure", "fantasy", "scifi"],
  tg: [],
  p: 8
}, {
  id: "20-days-in-mariupol-2023",
  t: "20 Days in Mariupol",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 7
}, {
  id: "a-series-of-unfortunate-events-2017",
  t: "A Series of Unfortunate Events",
  y: 2017,
  b: "x",
  s: "live",
  g: ["adventure", "comedy", "drama"],
  tg: [],
  p: 7,
  k: "s"
}, {
  id: "aftersun-2022",
  t: "Aftersun",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "bates-motel-2013",
  t: "Bates Motel",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama", "horror", "mystery"],
  tg: ["detective"],
  p: 7,
  k: "s"
}, {
  id: "batman-the-dark-knight-returns-par-2012",
  t: "Batman: The Dark Knight Returns, Part 1",
  y: 2012,
  b: "r",
  s: "live",
  g: ["action", "animation", "crime"],
  tg: ["detective"],
  p: 7
}, {
  id: "batman-the-dark-knight-returns-par-2013",
  t: "Batman: The Dark Knight Returns, Part 2",
  y: 2013,
  b: "r",
  s: "live",
  g: ["action", "animation", "crime"],
  tg: ["detective"],
  p: 7
}, {
  id: "beasts-of-no-nation-2015",
  t: "Beasts of No Nation",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 7
}, {
  id: "blackfish-2013",
  t: "Blackfish",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 7
}, {
  id: "bo-burnham-inside-2021",
  t: "Bo Burnham: Inside",
  y: 2021,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 7
}, {
  id: "citizenfour-2014",
  t: "Citizenfour",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "cosmos-a-spacetime-odyssey-2014",
  t: "Cosmos: A Spacetime Odyssey",
  y: 2014,
  b: "k",
  s: "live",
  g: ["drama"],
  tg: ["family"],
  p: 7,
  k: "s"
}, {
  id: "dark-waters-2019",
  t: "Dark Waters",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "detachment-2011",
  t: "Detachment",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "devs-2020",
  t: "Devs",
  y: 2020,
  b: "x",
  s: "live",
  g: ["drama", "mystery", "scifi"],
  tg: ["detective"],
  p: 7,
  k: "s"
}, {
  id: "elementary-2012",
  t: "Elementary",
  y: 2012,
  b: "r",
  s: "live",
  g: ["action", "adventure", "crime"],
  tg: ["detective"],
  p: 7,
  k: "s"
}, {
  id: "free-solo-2018",
  t: "Free Solo",
  y: 2018,
  b: "x",
  s: "live",
  g: ["adventure", "drama", "sports"],
  tg: ["sports"],
  p: 7
}, {
  id: "gifted-2017",
  t: "Gifted",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "hamnet-2025",
  t: "Hamnet",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "hotel-mumbai-2018",
  t: "Hotel Mumbai",
  y: 2018,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 7
}, {
  id: "how-to-train-your-dragon-2025",
  t: "How to Train Your Dragon",
  y: 2025,
  b: "x",
  s: "live",
  g: ["action", "adventure", "comedy"],
  tg: [],
  p: 7
}, {
  id: "icarus-2017",
  t: "Icarus",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 7
}, {
  id: "just-mercy-2019",
  t: "Just Mercy",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 7
}, {
  id: "justice-league-the-flashpoint-para-2013",
  t: "Justice League: The Flashpoint Paradox",
  y: 2013,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: [],
  p: 7
}, {
  id: "killing-eve-2018",
  t: "Killing Eve",
  y: 2018,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 7,
  k: "s"
}, {
  id: "limitless-2015",
  t: "Limitless",
  y: 2015,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 7,
  k: "s"
}, {
  id: "loving-vincent-2017",
  t: "Loving Vincent",
  y: 2017,
  b: "t",
  s: "live",
  g: ["animation", "drama", "mystery"],
  tg: ["detective"],
  p: 7
}, {
  id: "me-and-earl-and-the-dying-girl-2015",
  t: "Me and Earl and the Dying Girl",
  y: 2015,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 7
}, {
  id: "narcos-mexico-2018",
  t: "Narcos: Mexico",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 7,
  k: "s"
}, {
  id: "navalny-2022",
  t: "Navalny",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "nebraska-2013",
  t: "Nebraska",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "only-the-brave-2017",
  t: "Only the Brave",
  y: 2017,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 7
}, {
  id: "over-the-garden-wall-2014",
  t: "Over the Garden Wall",
  y: 2014,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 7,
  k: "s"
}, {
  id: "queen-charlotte-a-bridgerton-story-2023",
  t: "Queen Charlotte: A Bridgerton Story",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 7,
  k: "s"
}, {
  id: "scandal-2012",
  t: "Scandal",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 7,
  k: "s"
}, {
  id: "short-term-12-2013",
  t: "Short Term 12",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "society-of-the-snow-2023",
  t: "Society of the Snow",
  y: 2023,
  b: "x",
  s: "live",
  g: ["adventure", "drama"],
  tg: [],
  p: 7
}, {
  id: "sound-of-freedom-2023",
  t: "Sound of Freedom",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-americans-2013",
  t: "The Americans",
  y: 2013,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 7,
  k: "s"
}, {
  id: "the-florida-project-2017",
  t: "The Florida Project",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "the-jinx-the-life-and-deaths-of-ro-2015",
  t: "The Jinx: The Life and Deaths of Robert Durst",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 7,
  k: "s"
}, {
  id: "the-peanut-butter-falcon-2019",
  t: "The Peanut Butter Falcon",
  y: 2019,
  b: "x",
  s: "live",
  g: ["adventure", "comedy", "drama"],
  tg: [],
  p: 7
}, {
  id: "the-social-dilemma-2020",
  t: "The Social Dilemma",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "the-two-popes-2019",
  t: "The Two Popes",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "thirteen-lives-2022",
  t: "Thirteen Lives",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 7
}, {
  id: "togo-2019",
  t: "Togo",
  y: 2019,
  b: "x",
  s: "live",
  g: ["adventure", "drama"],
  tg: [],
  p: 7
}, {
  id: "transformers-one-2024",
  t: "Transformers One",
  y: 2024,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: [],
  p: 7
}, {
  id: "unorthodox-2020",
  t: "Unorthodox",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7,
  k: "s"
}, {
  id: "13th-2016",
  t: "13th",
  y: 2016,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 6
}, {
  id: "14-peaks-nothing-is-impossible-2021",
  t: "14 Peaks: Nothing Is Impossible",
  y: 2021,
  b: "x",
  s: "live",
  g: ["adventure", "drama", "sports"],
  tg: ["sports"],
  p: 6
}, {
  id: "a-league-of-their-own-2022",
  t: "A League of Their Own",
  y: 2022,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "sports"],
  tg: ["sports"],
  p: 6,
  k: "s"
}, {
  id: "fellow-travelers-2023",
  t: "Fellow Travelers",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "fleishman-is-in-trouble-2022",
  t: "Fleishman Is in Trouble",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "going-clear-scientology-the-prison-2015",
  t: "Going Clear: Scientology & the Prison of Belief",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "hatfields-mccoys-2012",
  t: "Hatfields & McCoys",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "high-fidelity-2020",
  t: "High Fidelity",
  y: 2020,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 6,
  k: "s"
}, {
  id: "jiro-dreams-of-sushi-2011",
  t: "Jiro Dreams of Sushi",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "justice-league-dark-apokolips-war-2020",
  t: "Justice League Dark: Apokolips War",
  y: 2020,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: [],
  p: 6
}, {
  id: "kingdom-2014",
  t: "Kingdom",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 6,
  k: "s"
}, {
  id: "love-victor-2020",
  t: "Love, Victor",
  y: 2020,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "marcel-the-shell-with-shoes-on-2021",
  t: "Marcel the Shell with Shoes On",
  y: 2021,
  b: "t",
  s: "live",
  g: ["animation", "comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "masters-of-sex-2013",
  t: "Masters of Sex",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "messiah-2020",
  t: "Messiah",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "thriller"],
  tg: ["detective"],
  p: 6,
  k: "s"
}, {
  id: "mildred-pierce-2011",
  t: "Mildred Pierce",
  y: 2011,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 6,
  k: "s"
}, {
  id: "mr-church-2016",
  t: "Mr. Church",
  y: 2016,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "my-brilliant-friend-2018",
  t: "My Brilliant Friend",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "olive-kitteridge-2014",
  t: "Olive Kitteridge",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "one-day-at-a-time-2017",
  t: "One Day at a Time",
  y: 2017,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "paperman-2012",
  t: "Paperman",
  y: 2012,
  b: "k",
  s: "live",
  g: ["animation", "comedy"],
  tg: ["family"],
  p: 6
}, {
  id: "rectify-2013",
  t: "Rectify",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "remarkably-bright-creatures-2026",
  t: "Remarkably Bright Creatures",
  y: 2026,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "samsara-2011",
  t: "Samsara",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 6
}, {
  id: "scenes-from-a-marriage-2021",
  t: "Scenes from a Marriage",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "seaspiracy-2021",
  t: "Seaspiracy",
  y: 2021,
  b: "x",
  s: "live",
  g: ["adventure", "drama"],
  tg: [],
  p: 6
}, {
  id: "sing-sing-2023",
  t: "Sing Sing",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "the-act-2019",
  t: "The Act",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 6,
  k: "s"
}, {
  id: "the-art-of-racing-in-the-rain-2019",
  t: "The Art of Racing in the Rain",
  y: 2019,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "the-beatles-get-back-2021",
  t: "The Beatles: Get Back",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "the-dissident-2020",
  t: "The Dissident",
  y: 2020,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 6
}, {
  id: "three-identical-strangers-2018",
  t: "Three Identical Strangers",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "waco-2018",
  t: "Waco",
  y: 2018,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 6,
  k: "s"
}, {
  id: "welcome-to-wrexham-2022",
  t: "Welcome to Wrexham",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 6,
  k: "s"
}, {
  id: "what-is-a-woman-2022",
  t: "What Is a Woman?",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
},
// ===== Belgium, 2000 onwards =====
{
  id: "jim-queen-2026",
  t: "Jim Queen",
  y: 2026,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 3
}, {
  id: "truly-naked-2026",
  t: "Truly Naked",
  y: 2026,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 2
}, {
  id: "cologne-75-2025",
  t: "Cologne 75",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 4
}, {
  id: "calle-m-laga-2025",
  t: "Calle M\u00e1laga",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "young-mothers-2025",
  t: "Young Mothers",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "we-believe-you-2025",
  t: "We Believe You",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 2
}, {
  id: "de-big-fuck-up-2025",
  t: "De Big Fuck-up",
  y: 2025,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 2,
  k: "s"
}, {
  id: "vermiglio-2024",
  t: "Vermiglio",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "the-most-precious-of-cargoes-2024",
  t: "The Most Precious of Cargoes",
  y: 2024,
  b: "t",
  s: "live",
  g: ["animation", "drama"],
  tg: [],
  p: 4
}, {
  id: "memory-lane-2024",
  t: "Memory Lane",
  y: 2024,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "the-ties-that-bind-us-2024",
  t: "The Ties That Bind Us",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "the-great-ambition-2024",
  t: "The Great Ambition",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "nemesis-2024",
  t: "Nemesis",
  y: 2024,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 3,
  k: "s"
}, {
  id: "skunk-2023",
  t: "Skunk",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "bye-bye-tiberias-2023",
  t: "Bye Bye Tiberias",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "when-it-melts-2023",
  t: "When It Melts",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "amal-2023",
  t: "Amal",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "het-verhaal-van-vlaanderen-2023",
  t: "Het verhaal van Vlaanderen",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 2,
  k: "s"
}, {
  id: "return-to-seoul-2022",
  t: "Return to Seoul",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "love-according-to-dalva-2022",
  t: "Love According to Dalva",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "my-sailor-my-love-2022",
  t: "My Sailor, My Love",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "la-civil-2021",
  t: "La civil",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "the-man-who-sold-his-skin-2020",
  t: "The Man Who Sold His Skin",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "josep-2020",
  t: "Josep",
  y: 2020,
  b: "t",
  s: "live",
  g: ["animation", "drama"],
  tg: [],
  p: 4
}, {
  id: "parlement-2020",
  t: "Parlement",
  y: 2020,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 3,
  k: "s"
}, {
  id: "love-at-second-sight-2019",
  t: "Love at Second Sight",
  y: 2019,
  b: "x",
  s: "live",
  g: ["comedy", "drama", "fantasy"],
  tg: [],
  p: 5
}, {
  id: "adam-2019",
  t: "Adam",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "climax-2018",
  t: "Climax",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "horror", "musical"],
  tg: ["music"],
  p: 7
}, {
  id: "niet-schieten-2018",
  t: "Niet schieten",
  y: 2018,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 4
}, {
  id: "raw-2016",
  t: "Raw",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "horror"],
  tg: [],
  p: 7
}, {
  id: "marguerite-2015",
  t: "Marguerite",
  y: 2015,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "reality-2014",
  t: "Reality",
  y: 2014,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 5
}, {
  id: "ast-rix-the-mansions-of-the-gods-2014",
  t: "Ast\u00e9rix: The Mansions of the Gods",
  y: 2014,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 5
}, {
  id: "nymphomaniac-vol-i-2013",
  t: "Nymphomaniac: Vol. I",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "jack-and-the-cuckoo-clock-heart-2013",
  t: "Jack and the Cuckoo-Clock Heart",
  y: 2013,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "drama"],
  tg: [],
  p: 5
}, {
  id: "les-lyonnais-2011",
  t: "Les Lyonnais",
  y: 2011,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "certified-copy-2010",
  t: "Certified Copy",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "a-cat-in-paris-2010",
  t: "A Cat in Paris",
  y: 2010,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 5
}, {
  id: "romantics-anonymous-2010",
  t: "Romantics Anonymous",
  y: 2010,
  b: "r",
  s: "live",
  g: ["comedy", "romance"],
  tg: [],
  p: 5
}, {
  id: "mr-nobody-2009",
  t: "Mr. Nobody",
  y: 2009,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "romance"],
  tg: [],
  p: 8
}, {
  id: "the-secret-of-kells-2009",
  t: "The Secret of Kells",
  y: 2009,
  b: "k",
  s: "live",
  g: ["adventure", "animation"],
  tg: ["family"],
  p: 6
}, {
  id: "the-concert-2009",
  t: "The Concert",
  y: 2009,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 6
}, {
  id: "looking-for-eric-2009",
  t: "Looking for Eric",
  y: 2009,
  b: "x",
  s: "live",
  g: ["comedy", "drama", "fantasy"],
  tg: [],
  p: 6
}, {
  id: "a-town-called-panic-2009",
  t: "A Town Called Panic",
  y: 2009,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 5
}, {
  id: "the-misfortunates-2009",
  t: "The Misfortunates",
  y: 2009,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "loft-2008",
  t: "Loft",
  y: 2008,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 6
}, {
  id: "jcvd-2008",
  t: "JCVD",
  y: 2008,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 6
}, {
  id: "lorna-s-silence-2008",
  t: "Lorna's Silence",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "seraphine-2008",
  t: "Seraphine",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "julia-2008",
  t: "Julia",
  y: 2008,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 5
}, {
  id: "home-2008",
  t: "Home",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "moscow-belgium-2008",
  t: "Moscow, Belgium",
  y: 2008,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "ben-x-2007",
  t: "Ben X",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 6
}, {
  id: "goodbye-bafana-2007",
  t: "Goodbye Bafana",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "irina-palm-2007",
  t: "Irina Palm",
  y: 2007,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "ex-drummer-2007",
  t: "Ex Drummer",
  y: 2007,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "with-friends-like-these-2007",
  t: "With Friends Like These",
  y: 2007,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "black-book-2006",
  t: "Black Book",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: ["war"],
  p: 7
}, {
  id: "the-painted-veil-2006",
  t: "The Painted Veil",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "the-wind-that-shakes-the-barley-2006",
  t: "The Wind That Shakes the Barley",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 7
}, {
  id: "days-of-glory-2006",
  t: "Days of Glory",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 5
}, {
  id: "azur-asmar-the-princes-quest-2006",
  t: "Azur & Asmar: The Princes' Quest",
  y: 2006,
  b: "k",
  s: "live",
  g: ["adventure", "animation"],
  tg: ["family"],
  p: 4
}, {
  id: "waiter-2006",
  t: "Waiter",
  y: 2006,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "joyeux-noel-2005",
  t: "Joyeux Noel",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 6
}, {
  id: "the-child-2005",
  t: "The Child",
  y: 2005,
  b: "r",
  s: "live",
  g: ["crime", "drama", "romance"],
  tg: ["detective"],
  p: 6
}, {
  id: "live-and-become-2005",
  t: "Live and Become",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "the-ax-2005",
  t: "The Ax",
  y: 2005,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "darwin-s-nightmare-2004",
  t: "Darwin's Nightmare",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "aaltra-2004",
  t: "Aaltra",
  y: 2004,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "love-me-if-you-dare-2003",
  t: "Love Me If You Dare",
  y: 2003,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "the-triplets-of-belleville-2003",
  t: "The Triplets of Belleville",
  y: 2003,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 7
}, {
  id: "the-memory-of-a-killer-2003",
  t: "The Memory of a Killer",
  y: 2003,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "the-five-obstructions-2003",
  t: "The Five Obstructions",
  y: 2003,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "any-way-the-wind-blows-2003",
  t: "Any Way the Wind Blows",
  y: 2003,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "since-otar-left-2003",
  t: "Since Otar Left",
  y: 2003,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "the-son-2002",
  t: "The Son",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama", "mystery"],
  tg: ["detective"],
  p: 5
}, {
  id: "no-man-s-land-2001",
  t: "No Man's Land",
  y: 2001,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["war"],
  p: 6
}, {
  id: "everybody-s-famous-2000",
  t: "Everybody's Famous!",
  y: 2000,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 4
}, {
  id: "the-king-is-dancing-2000",
  t: "The King Is Dancing",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 4
}, {
  id: "ali-zaoua-prince-of-the-streets-2000",
  t: "Ali Zaoua: Prince of the Streets",
  y: 2000,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 4
},
// ===== France, 2000 onwards =====
{
  id: "de-gaulle-r-sistance-2026",
  t: "De Gaulle: R\u00e9sistance",
  y: 2026,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "the-beloved-2026",
  t: "The Beloved",
  y: 2026,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "the-rays-and-shadows-2026",
  t: "The Rays and Shadows",
  y: 2026,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "yellow-letters-2026",
  t: "Yellow Letters",
  y: 2026,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "fatherland-2026",
  t: "Fatherland",
  y: 2026,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "the-american-dream-2026",
  t: "The American Dream",
  y: 2026,
  b: "r",
  s: "live",
  g: ["drama", "comedy", "romance"],
  tg: [],
  p: 3
}, {
  id: "fjord-2026",
  t: "Fjord",
  y: 2026,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 3
}, {
  id: "just-an-illusion-2026",
  t: "Just an Illusion",
  y: 2026,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 3
}, {
  id: "salvation-2026",
  t: "Salvation",
  y: 2026,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "the-bus-a-french-football-mutiny-2026",
  t: "The Bus: A French Football Mutiny",
  y: 2026,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 3
}, {
  id: "sirat-2025",
  t: "Sirat",
  y: 2025,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 6
}, {
  id: "silent-friend-2025",
  t: "Silent Friend",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "case-137-2025",
  t: "Case 137",
  y: 2025,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 4
}, {
  id: "two-prosecutors-2025",
  t: "Two Prosecutors",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 4
}, {
  id: "primavera-2025",
  t: "Primavera",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "put-your-soul-on-your-hand-and-wal-2025",
  t: "Put Your Soul on Your Hand and Walk",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 3
}, {
  id: "hearts-on-fire-2025",
  t: "Hearts on Fire",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "the-money-maker-2025",
  t: "The Money Maker",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 3
}, {
  id: "whispers-in-the-woods-2025",
  t: "Whispers in the Woods",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "bird-2024",
  t: "Bird",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "girls-will-be-girls-2024",
  t: "Girls Will Be Girls",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "santosh-2024",
  t: "Santosh",
  y: 2024,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 4
}, {
  id: "afternoons-of-solitude-2024",
  t: "Afternoons of Solitude",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "holy-cow-2024",
  t: "Holy Cow",
  y: 2024,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "the-kingdom-2024",
  t: "The Kingdom",
  y: 2024,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 4
}, {
  id: "the-man-who-could-not-remain-silen-2024",
  t: "The Man Who Could Not Remain Silent",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "two-people-exchanging-saliva-2024",
  t: "Two People Exchanging Saliva",
  y: 2024,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "scifi"],
  tg: [],
  p: 4
}, {
  id: "baby-2024",
  t: "Baby",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "yannick-2023",
  t: "Yannick",
  y: 2023,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "the-great-escaper-2023",
  t: "The Great Escaper",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "comedy"],
  tg: [],
  p: 5
}, {
  id: "kidnapped-the-abduction-of-edgardo-2023",
  t: "Kidnapped: The Abduction of Edgardo Mortara",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "totem-2023",
  t: "Totem",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "junkyard-dog-2023",
  t: "Junkyard Dog",
  y: 2023,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "chicken-for-linda-2023",
  t: "Chicken for Linda!",
  y: 2023,
  b: "t",
  s: "live",
  g: ["animation", "comedy", "musical"],
  tg: [],
  p: 3
}, {
  id: "falcon-lake-2022",
  t: "Falcon Lake",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "romance"],
  tg: ["detective"],
  p: 4
}, {
  id: "utama-2022",
  t: "Utama",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "the-kings-of-the-world-2022",
  t: "The Kings of the World",
  y: 2022,
  b: "x",
  s: "live",
  g: ["adventure", "drama"],
  tg: [],
  p: 4
}, {
  id: "no-dogs-or-italians-allowed-2022",
  t: "No Dogs or Italians Allowed",
  y: 2022,
  b: "k",
  s: "live",
  g: ["animation", "drama"],
  tg: ["family"],
  p: 4
}, {
  id: "lie-with-me-2022",
  t: "Lie with Me",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "exterior-night-2022",
  t: "Exterior Night",
  y: 2022,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 4,
  k: "s"
}, {
  id: "blind-willow-sleeping-woman-2022",
  t: "Blind Willow, Sleeping Woman",
  y: 2022,
  b: "t",
  s: "live",
  g: ["animation", "drama", "scifi"],
  tg: [],
  p: 3
}, {
  id: "the-innocents-2021",
  t: "The Innocents",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama", "fantasy", "horror"],
  tg: [],
  p: 6
}, {
  id: "paris-13th-district-2021",
  t: "Paris, 13th District",
  y: 2021,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "the-accusation-2021",
  t: "The Accusation",
  y: 2021,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 4
}, {
  id: "captain-volkonogov-escaped-2021",
  t: "Captain Volkonogov Escaped",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 4
}, {
  id: "another-world-2021",
  t: "Another World",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "the-lost-leonardo-2021",
  t: "The Lost Leonardo",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama", "mystery"],
  tg: ["detective"],
  p: 4
}, {
  id: "the-velvet-queen-2021",
  t: "The Velvet Queen",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "between-two-dawns-2021",
  t: "Between Two Dawns",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "ufos-2021",
  t: "UFOs",
  y: 2021,
  b: "x",
  s: "live",
  g: ["comedy", "scifi"],
  tg: [],
  p: 3,
  k: "s"
}, {
  id: "digger-2020",
  t: "Digger",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "all-hands-on-deck-2020",
  t: "All Hands on Deck",
  y: 2020,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "ballad-of-a-white-cow-2020",
  t: "Ballad of a White Cow",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "kubrick-by-kubrick-2020",
  t: "Kubrick by Kubrick",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "the-big-hit-2020",
  t: "The Big Hit",
  y: 2020,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "martin-eden-2019",
  t: "Martin Eden",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "spread-your-wings-2019",
  t: "Spread Your Wings",
  y: 2019,
  b: "k",
  s: "live",
  g: ["adventure", "drama"],
  tg: ["family"],
  p: 4
}, {
  id: "capital-in-the-twenty-first-centur-2019",
  t: "Capital in the Twenty-First Century",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "ash-is-purest-white-2018",
  t: "Ash Is Purest White",
  y: 2018,
  b: "r",
  s: "live",
  g: ["crime", "drama", "romance"],
  tg: ["detective"],
  p: 5
}, {
  id: "i-am-jonas-2018",
  t: "I Am Jonas",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "romance"],
  tg: ["detective"],
  p: 5
}, {
  id: "remi-nobody-s-boy-2018",
  t: "Remi, Nobody's Boy",
  y: 2018,
  b: "k",
  s: "live",
  g: ["adventure", "drama"],
  tg: ["family"],
  p: 4
}, {
  id: "amanda-2018",
  t: "Amanda",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "chocolat-2016",
  t: "Chocolat",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "esteros-2016",
  t: "Esteros",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "kalinka-2016",
  t: "Kalinka",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 4
}, {
  id: "paris-05-59-th-o-hugo-2016",
  t: "Paris 05:59: Th\u00e9o & Hugo",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "dogs-2016",
  t: "Dogs",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 4
}, {
  id: "in-between-2016",
  t: "In Between",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "lastman-2016",
  t: "Lastman",
  y: 2016,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "colonia-2015",
  t: "Colonia",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "ixcanul-2015",
  t: "Ixcanul",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "macadam-stories-2015",
  t: "Macadam Stories",
  y: 2015,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "daft-punk-unchained-2015",
  t: "Daft Punk Unchained",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 4
}, {
  id: "tomorrow-2015",
  t: "Tomorrow",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "birdboy-the-forgotten-children-2015",
  t: "Birdboy: The Forgotten Children",
  y: 2015,
  b: "r",
  s: "live",
  g: ["animation", "drama", "horror"],
  tg: [],
  p: 4
}, {
  id: "serial-bad-weddings-2014",
  t: "Serial Bad Weddings",
  y: 2014,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 6
}, {
  id: "breathe-2014",
  t: "Breathe",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "the-young-and-prodigious-t-s-spive-2013",
  t: "The Young and Prodigious T.S. Spivet",
  y: 2013,
  b: "x",
  s: "live",
  g: ["adventure", "comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "holy-motors-2012",
  t: "Holy Motors",
  y: 2012,
  b: "x",
  s: "live",
  g: ["drama", "fantasy"],
  tg: [],
  p: 6
}, {
  id: "sister-2012",
  t: "Sister",
  y: 2012,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "paradise-love-2012",
  t: "Paradise: Love",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "like-someone-in-love-2012",
  t: "Like Someone in Love",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "titanic-blood-and-steel-2012",
  t: "Titanic: Blood and Steel",
  y: 2012,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "tinker-tailor-soldier-spy-2011",
  t: "Tinker Tailor Soldier Spy",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "the-lady-2011",
  t: "The Lady",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "declaration-of-war-2011",
  t: "Declaration of War",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "the-well-digger-s-daughter-2011",
  t: "The Well-Digger's Daughter",
  y: 2011,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "incendies-2010",
  t: "Incendies",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama", "mystery"],
  tg: ["war", "detective"],
  p: 8
}, {
  id: "the-ghost-writer-2010",
  t: "The Ghost Writer",
  y: 2010,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-kids-are-all-right-2010",
  t: "The Kids Are All Right",
  y: 2010,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "cave-of-forgotten-dreams-2010",
  t: "Cave of Forgotten Dreams",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "little-white-lies-2010",
  t: "Little White Lies",
  y: 2010,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "king-of-devil-s-island-2010",
  t: "King of Devil's Island",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "sarah-s-key-2010",
  t: "Sarah's Key",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 6
}, {
  id: "the-illusionist-2010",
  t: "The Illusionist",
  y: 2010,
  b: "t",
  s: "live",
  g: ["animation", "drama"],
  tg: [],
  p: 6
}, {
  id: "even-the-rain-2010",
  t: "Even the Rain",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "the-round-up-2010",
  t: "The Round Up",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 5
}, {
  id: "the-names-of-love-2010",
  t: "The Names of Love",
  y: 2010,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "my-afternoons-with-margueritte-2010",
  t: "My Afternoons with Margueritte",
  y: 2010,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "babies-2010",
  t: "Babies",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "honey-2010",
  t: "Honey",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "of-gods-and-men-2010",
  t: "Of Gods and Men",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "dog-pound-2010",
  t: "Dog Pound",
  y: 2010,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "nostalgia-for-the-light-2010",
  t: "Nostalgia for the Light",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "sound-of-noise-2010",
  t: "Sound of Noise",
  y: 2010,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "musical"],
  tg: ["music", "detective"],
  p: 5
}, {
  id: "the-women-on-the-6th-floor-2010",
  t: "The Women on the 6th Floor",
  y: 2010,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 5
}, {
  id: "orphan-2009",
  t: "Orphan",
  y: 2009,
  b: "r",
  s: "live",
  g: ["horror", "mystery", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "the-white-ribbon-2009",
  t: "The White Ribbon",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "thriller"],
  tg: ["detective"],
  p: 7
}, {
  id: "a-serious-man-2009",
  t: "A Serious Man",
  y: 2009,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 7
}, {
  id: "state-of-play-2009",
  t: "State of Play",
  y: 2009,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 7
}, {
  id: "pirate-radio-2009",
  t: "Pirate Radio",
  y: 2009,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 7
}, {
  id: "cell-211-2009",
  t: "Cell 211",
  y: 2009,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "a-prophet-2009",
  t: "A Prophet",
  y: 2009,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "enter-the-void-2009",
  t: "Enter the Void",
  y: 2009,
  b: "x",
  s: "live",
  g: ["drama", "fantasy"],
  tg: [],
  p: 7
}, {
  id: "soul-kitchen-2009",
  t: "Soul Kitchen",
  y: 2009,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "home-2009",
  t: "Home",
  y: 2009,
  b: "k",
  s: "live",
  g: ["drama"],
  tg: ["family"],
  p: 6
}, {
  id: "micmacs-2009",
  t: "Micmacs",
  y: 2009,
  b: "r",
  s: "live",
  g: ["action", "comedy", "crime"],
  tg: ["detective"],
  p: 6
}, {
  id: "apocalypse-the-second-world-war-2009",
  t: "Apocalypse: The Second World War",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 6,
  k: "s"
}, {
  id: "little-nicholas-2009",
  t: "Little Nicholas",
  y: 2009,
  b: "k",
  s: "live",
  g: ["comedy"],
  tg: ["family"],
  p: 5
}, {
  id: "john-rabe-2009",
  t: "John Rabe",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "desert-flower-2009",
  t: "Desert Flower",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "the-hedgehog-2009",
  t: "The Hedgehog",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "eyes-wide-open-2009",
  t: "Eyes Wide Open",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "welcome-2009",
  t: "Welcome",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "undertow-2009",
  t: "Undertow",
  y: 2009,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "romance"],
  tg: [],
  p: 5
}, {
  id: "the-yes-men-fix-the-world-2009",
  t: "The Yes Men Fix the World",
  y: 2009,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "taken-2008",
  t: "Taken",
  y: 2008,
  b: "r",
  s: "live",
  g: ["action", "crime", "thriller"],
  tg: ["detective"],
  p: 9
}, {
  id: "the-wrestler-2008",
  t: "The Wrestler",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 8
}, {
  id: "burn-after-reading-2008",
  t: "Burn After Reading",
  y: 2008,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 8
}, {
  id: "rocknrolla-2008",
  t: "RocknRolla",
  y: 2008,
  b: "r",
  s: "live",
  g: ["action", "crime", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "definitely-maybe-2008",
  t: "Definitely, Maybe",
  y: 2008,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 8
}, {
  id: "waltz-with-bashir-2008",
  t: "Waltz with Bashir",
  y: 2008,
  b: "t",
  s: "live",
  g: ["animation", "drama"],
  tg: [],
  p: 7
}, {
  id: "martyrs-2008",
  t: "Martyrs",
  y: 2008,
  b: "r",
  s: "live",
  g: ["horror"],
  tg: [],
  p: 7
}, {
  id: "frost-nixon-2008",
  t: "Frost/Nixon",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "three-monkeys-2008",
  t: "Three Monkeys",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "il-divo-2008",
  t: "Il Divo",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "the-baader-meinhof-complex-2008",
  t: "The Baader Meinhof Complex",
  y: 2008,
  b: "r",
  s: "live",
  g: ["action", "drama", "crime"],
  tg: ["detective"],
  p: 6
}, {
  id: "flame-citron-2008",
  t: "Flame & Citron",
  y: 2008,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 6
}, {
  id: "che-part-one-2008",
  t: "Che: Part One",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "the-class-2008",
  t: "The Class",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "welcome-to-the-sticks-2008",
  t: "Welcome to the Sticks",
  y: 2008,
  b: "r",
  s: "live",
  g: ["comedy", "romance"],
  tg: [],
  p: 6
}, {
  id: "i-ve-loved-you-so-long-2008",
  t: "I've Loved You So Long",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "mesrine-killer-instinct-2008",
  t: "Mesrine: Killer Instinct",
  y: 2008,
  b: "r",
  s: "live",
  g: ["action", "drama", "crime"],
  tg: ["detective"],
  p: 6
}, {
  id: "mesrine-public-enemy-no-1-2008",
  t: "Mesrine: Public Enemy No. 1",
  y: 2008,
  b: "r",
  s: "live",
  g: ["action", "drama", "crime"],
  tg: ["detective"],
  p: 6
}, {
  id: "last-stop-174-2008",
  t: "Last Stop 174",
  y: 2008,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 5
}, {
  id: "tokyo-2008",
  t: "Tokyo!",
  y: 2008,
  b: "x",
  s: "live",
  g: ["comedy", "drama", "fantasy"],
  tg: [],
  p: 5
}, {
  id: "the-first-day-of-the-rest-of-your--2008",
  t: "The First Day of the Rest of Your Life",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "oceans-2008",
  t: "Oceans",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "anything-for-her-2008",
  t: "Anything for Her",
  y: 2008,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 5
}, {
  id: "lemon-tree-2008",
  t: "Lemon Tree",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 5
}, {
  id: "silent-wedding-2008",
  t: "Silent Wedding",
  y: 2008,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "35-shots-of-rum-2008",
  t: "35 Shots of Rum",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "summer-hours-2008",
  t: "Summer Hours",
  y: 2008,
  b: "k",
  s: "live",
  g: ["drama"],
  tg: ["family"],
  p: 5
}, {
  id: "the-beaches-of-agn-s-2008",
  t: "The Beaches of Agn\u00e8s",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "hot-fuzz-2007",
  t: "Hot Fuzz",
  y: 2007,
  b: "x",
  s: "live",
  g: ["action", "comedy", "mystery"],
  tg: ["detective"],
  p: 9
}, {
  id: "atonement-2007",
  t: "Atonement",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "romance"],
  tg: ["detective"],
  p: 8
}, {
  id: "la-vie-en-rose-2007",
  t: "La Vie En Rose",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 7
}, {
  id: "the-diving-bell-and-the-butterfly-2007",
  t: "The Diving Bell and the Butterfly",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "persepolis-2007",
  t: "Persepolis",
  y: 2007,
  b: "t",
  s: "live",
  g: ["animation", "drama"],
  tg: [],
  p: 7
}, {
  id: "99-francs-2007",
  t: "99 Francs",
  y: 2007,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "son-of-rambow-2007",
  t: "Son of Rambow",
  y: 2007,
  b: "x",
  s: "live",
  g: ["action", "adventure", "comedy"],
  tg: [],
  p: 6
}, {
  id: "import-export-2007",
  t: "Import Export",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "you-the-living-2007",
  t: "You, the Living",
  y: 2007,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "the-secret-of-the-grain-2007",
  t: "The Secret of the Grain",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "silent-light-2007",
  t: "Silent Light",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "caramel-2007",
  t: "Caramel",
  y: 2007,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "xxy-2007",
  t: "XXY",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "my-brother-is-an-only-child-2007",
  t: "My Brother Is an Only Child",
  y: 2007,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "love-songs-2007",
  t: "Love Songs",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama", "musical", "romance"],
  tg: [],
  p: 5
}, {
  id: "the-band-s-visit-2007",
  t: "The Band's Visit",
  y: 2007,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "moli-re-2007",
  t: "Moli\u00e8re",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama", "comedy"],
  tg: [],
  p: 5
}, {
  id: "the-man-from-london-2007",
  t: "The Man from London",
  y: 2007,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 4
}, {
  id: "conversations-with-my-gardener-2007",
  t: "Conversations with My Gardener",
  y: 2007,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "wakfu-2007",
  t: "Wakfu",
  y: 2007,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "perfume-the-story-of-a-murderer-2006",
  t: "Perfume: The Story of a Murderer",
  y: 2006,
  b: "r",
  s: "live",
  g: ["crime", "drama", "fantasy"],
  tg: ["detective"],
  p: 8
}, {
  id: "babel-2006",
  t: "Babel",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "tell-no-one-2006",
  t: "Tell No One",
  y: 2006,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-science-of-sleep-2006",
  t: "The Science of Sleep",
  y: 2006,
  b: "x",
  s: "live",
  g: ["comedy", "drama", "fantasy"],
  tg: [],
  p: 7
}, {
  id: "the-queen-2006",
  t: "The Queen",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "united-93-2006",
  t: "United 93",
  y: 2006,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 7
}, {
  id: "paris-je-t-aime-2006",
  t: "Paris, Je T'aime",
  y: 2006,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "oss-117-cairo-nest-of-spies-2006",
  t: "OSS 117: Cairo, Nest of Spies",
  y: 2006,
  b: "x",
  s: "live",
  g: ["action", "adventure", "comedy"],
  tg: [],
  p: 6
}, {
  id: "priceless-2006",
  t: "Priceless",
  y: 2006,
  b: "r",
  s: "live",
  g: ["comedy", "romance"],
  tg: [],
  p: 6
}, {
  id: "the-unknown-woman-2006",
  t: "The Unknown Woman",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "thriller"],
  tg: ["detective"],
  p: 5
}, {
  id: "the-page-turner-2006",
  t: "The Page Turner",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama", "musical", "thriller"],
  tg: ["music"],
  p: 5
}, {
  id: "don-t-worry-i-m-fine-2006",
  t: "Don't Worry, I'm Fine",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "climates-2006",
  t: "Climates",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "blame-it-on-fidel-2006",
  t: "Blame it on Fidel",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "syndromes-and-a-century-2006",
  t: "Syndromes and a Century",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "munich-2005",
  t: "Munich",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 8
}, {
  id: "good-night-and-good-luck-2005",
  t: "Good Night, and Good Luck.",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "unleashed-2005",
  t: "Unleashed",
  y: 2005,
  b: "r",
  s: "live",
  g: ["action", "crime", "thriller"],
  tg: ["detective"],
  p: 7
}, {
  id: "march-of-the-penguins-2005",
  t: "March of the Penguins",
  y: 2005,
  b: "k",
  s: "live",
  g: ["drama"],
  tg: ["family"],
  p: 7
}, {
  id: "broken-flowers-2005",
  t: "Broken Flowers",
  y: 2005,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "mystery"],
  tg: ["detective"],
  p: 7
}, {
  id: "cach-2005",
  t: "Cach\u00e9",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "thriller"],
  tg: ["detective"],
  p: 7
}, {
  id: "paradise-now-2005",
  t: "Paradise Now",
  y: 2005,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 6
}, {
  id: "13-tzameti-2005",
  t: "13 Tzameti",
  y: 2005,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 6
}, {
  id: "angel-a-2005",
  t: "Angel-A",
  y: 2005,
  b: "x",
  s: "live",
  g: ["comedy", "drama", "fantasy"],
  tg: [],
  p: 6
}, {
  id: "the-beat-that-my-heart-skipped-2005",
  t: "The Beat That My Heart Skipped",
  y: 2005,
  b: "r",
  s: "live",
  g: ["crime", "drama", "musical"],
  tg: ["music", "detective"],
  p: 6
}, {
  id: "the-three-burials-of-melquiades-es-2005",
  t: "The Three Burials of Melquiades Estrada",
  y: 2005,
  b: "r",
  s: "live",
  g: ["adventure", "crime", "drama"],
  tg: ["detective"],
  p: 6
}, {
  id: "manderlay-2005",
  t: "Manderlay",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "time-to-leave-2005",
  t: "Time to Leave",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "why-we-fight-2005",
  t: "Why We Fight",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 5
}, {
  id: "all-the-invisible-children-2005",
  t: "All the Invisible Children",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "bab-aziz-the-prince-that-contempla-2005",
  t: "Bab'Aziz: The Prince That Contemplated His Soul",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "shaun-of-the-dead-2004",
  t: "Shaun of the Dead",
  y: 2004,
  b: "r",
  s: "live",
  g: ["comedy", "horror"],
  tg: [],
  p: 9
}, {
  id: "the-machinist-2004",
  t: "The Machinist",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 8
}, {
  id: "district-b13-2004",
  t: "District B13",
  y: 2004,
  b: "r",
  s: "live",
  g: ["action", "crime", "scifi"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-motorcycle-diaries-2004",
  t: "The Motorcycle Diaries",
  y: 2004,
  b: "x",
  s: "live",
  g: ["adventure", "drama"],
  tg: [],
  p: 7
}, {
  id: "2046-2004",
  t: "2046",
  y: 2004,
  b: "x",
  s: "live",
  g: ["drama", "romance", "scifi"],
  tg: [],
  p: 7
}, {
  id: "the-chorus-2004",
  t: "The Chorus",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 7
}, {
  id: "a-very-long-engagement-2004",
  t: "A Very Long Engagement",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "romance"],
  tg: ["detective"],
  p: 7
}, {
  id: "36th-precinct-2004",
  t: "36th Precinct",
  y: 2004,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 6
}, {
  id: "vera-drake-2004",
  t: "Vera Drake",
  y: 2004,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 6
}, {
  id: "turtles-can-fly-2004",
  t: "Turtles Can Fly",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 6
}, {
  id: "the-staircase-2004",
  t: "The Staircase",
  y: 2004,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 6,
  k: "s"
}, {
  id: "machuca-2004",
  t: "Machuca",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "two-brothers-2004",
  t: "Two Brothers",
  y: 2004,
  b: "k",
  s: "live",
  g: ["adventure", "drama"],
  tg: ["family"],
  p: 5
}, {
  id: "life-is-a-miracle-2004",
  t: "Life Is a Miracle",
  y: 2004,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "tropical-malady-2004",
  t: "Tropical Malady",
  y: 2004,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "romance"],
  tg: [],
  p: 5
}, {
  id: "rory-o-shea-was-here-2004",
  t: "Rory O'Shea Was Here",
  y: 2004,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "modigliani-2004",
  t: "Modigliani",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "trilogy-the-weeping-meadow-2004",
  t: "Trilogy: The Weeping Meadow",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "kings-and-queen-2004",
  t: "Kings and Queen",
  y: 2004,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "riding-giants-2004",
  t: "Riding Giants",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "dogville-2003",
  t: "Dogville",
  y: 2003,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-dreamers-2003",
  t: "The Dreamers",
  y: 2003,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "interstella-5555-the-5tory-of-the--2003",
  t: "Interstella 5555: The 5tory of the 5ecret 5tar 5ystem",
  y: 2003,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "musical"],
  tg: ["music"],
  p: 6
}, {
  id: "the-barbarian-invasions-2003",
  t: "The Barbarian Invasions",
  y: 2003,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 6
}, {
  id: "ruby-quentin-2003",
  t: "Ruby & Quentin",
  y: 2003,
  b: "r",
  s: "live",
  g: ["comedy", "crime"],
  tg: ["detective"],
  p: 6
}, {
  id: "monsieur-ibrahim-2003",
  t: "Monsieur Ibrahim",
  y: 2003,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "code-lyoko-2003",
  t: "Code Lyoko",
  y: 2003,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "moolaad-2003",
  t: "Moolaad\u00e9",
  y: 2003,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "fear-and-trembling-2003",
  t: "Fear and Trembling",
  y: 2003,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "city-of-god-2002",
  t: "City of God",
  y: 2002,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 9
}, {
  id: "the-pianist-2002",
  t: "The Pianist",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 9
}, {
  id: "about-a-boy-2002",
  t: "About a Boy",
  y: 2002,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 8
}, {
  id: "irreversible-2002",
  t: "Irreversible",
  y: 2002,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 7
}, {
  id: "russian-ark-2002",
  t: "Russian Ark",
  y: 2002,
  b: "x",
  s: "live",
  g: ["drama", "fantasy"],
  tg: [],
  p: 6
}, {
  id: "he-loves-me-he-loves-me-not-2002",
  t: "He Loves Me, He Loves Me Not",
  y: 2002,
  b: "r",
  s: "live",
  g: ["romance", "thriller"],
  tg: [],
  p: 6
}, {
  id: "8-women-2002",
  t: "8 Women",
  y: 2002,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "musical"],
  tg: ["detective"],
  p: 6
}, {
  id: "the-quiet-american-2002",
  t: "The Quiet American",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama", "romance", "thriller"],
  tg: [],
  p: 6
}, {
  id: "the-magdalene-sisters-2002",
  t: "The Magdalene Sisters",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "the-man-without-a-past-2002",
  t: "The Man Without a Past",
  y: 2002,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "the-spanish-apartment-2002",
  t: "The Spanish Apartment",
  y: 2002,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "to-be-and-to-have-2002",
  t: "To Be and to Have",
  y: 2002,
  b: "k",
  s: "live",
  g: ["drama"],
  tg: ["family"],
  p: 5
}, {
  id: "amen-2002",
  t: "Amen.",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 5
}, {
  id: "ten-2002",
  t: "Ten",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "all-or-nothing-2002",
  t: "All or Nothing",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "man-on-the-train-2002",
  t: "Man on the Train",
  y: 2002,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 5
}, {
  id: "mondays-in-the-sun-2002",
  t: "Mondays in the Sun",
  y: 2002,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "philanthropy-2002",
  t: "Philanthropy",
  y: 2002,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "valentin-2002",
  t: "Valentin",
  y: 2002,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "blue-gate-crossing-2002",
  t: "Blue Gate Crossing",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "respiro-2002",
  t: "Respiro",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "balzac-and-the-little-chinese-seam-2002",
  t: "Balzac and the Little Chinese Seamstress",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "the-clay-bird-2002",
  t: "The Clay Bird",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "napol-on-2002",
  t: "Napol\u00e9on",
  y: 2002,
  b: "x",
  s: "live",
  g: ["adventure", "drama"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "the-others-2001",
  t: "The Others",
  y: 2001,
  b: "r",
  s: "live",
  g: ["horror", "mystery", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "enemy-at-the-gates-2001",
  t: "Enemy at the Gates",
  y: 2001,
  b: "r",
  s: "live",
  g: ["action", "drama"],
  tg: ["war"],
  p: 8
}, {
  id: "the-piano-teacher-2001",
  t: "The Piano Teacher",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama", "musical", "romance"],
  tg: ["music"],
  p: 7
}, {
  id: "brotherhood-of-the-wolf-2001",
  t: "Brotherhood of the Wolf",
  y: 2001,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 7
}, {
  id: "the-son-s-room-2001",
  t: "The Son's Room",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "monsoon-wedding-2001",
  t: "Monsoon Wedding",
  y: 2001,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "the-closet-2001",
  t: "The Closet",
  y: 2001,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 6
}, {
  id: "sex-and-luc-a-2001",
  t: "Sex and Luc\u00eda",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "samsara-2001",
  t: "Samsara",
  y: 2001,
  b: "x",
  s: "live",
  g: ["adventure", "drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "behind-the-sun-2001",
  t: "Behind the Sun",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "the-ignorant-fairies-2001",
  t: "The Ignorant Fairies",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "winged-migration-2001",
  t: "Winged Migration",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "what-time-is-it-there-2001",
  t: "What Time Is It There?",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "read-my-lips-2001",
  t: "Read My Lips",
  y: 2001,
  b: "r",
  s: "live",
  g: ["crime", "drama", "romance"],
  tg: ["detective"],
  p: 5
}, {
  id: "the-swamp-2001",
  t: "The Swamp",
  y: 2001,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 5
}, {
  id: "time-out-2001",
  t: "Time Out",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "taking-sides-2001",
  t: "Taking Sides",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 4
}, {
  id: "beijing-bicycle-2001",
  t: "Beijing Bicycle",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "murder-on-a-sunday-morning-2001",
  t: "Murder on a Sunday Morning",
  y: 2001,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 4
}, {
  id: "o-brother-where-art-thou-2000",
  t: "O Brother, Where Art Thou?",
  y: 2000,
  b: "r",
  s: "live",
  g: ["adventure", "comedy", "crime"],
  tg: ["detective"],
  p: 8
}, {
  id: "in-the-mood-for-love-2000",
  t: "In the Mood for Love",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 8
}, {
  id: "dancer-in-the-dark-2000",
  t: "Dancer in the Dark",
  y: 2000,
  b: "r",
  s: "live",
  g: ["crime", "drama", "musical"],
  tg: ["detective"],
  p: 7
}, {
  id: "werckmeister-harmonies-2000",
  t: "Werckmeister Harmonies",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama", "mystery"],
  tg: ["detective"],
  p: 6
}, {
  id: "songs-from-the-second-floor-2000",
  t: "Songs from the Second Floor",
  y: 2000,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "the-house-of-mirth-2000",
  t: "The House of Mirth",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "the-taste-of-others-2000",
  t: "The Taste of Others",
  y: 2000,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "bread-and-roses-2000",
  t: "Bread and Roses",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "code-unknown-2000",
  t: "Code Unknown",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "widow-of-st-pierre-2000",
  t: "Widow of St. Pierre",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "suzhou-river-2000",
  t: "Suzhou River",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "with-a-friend-like-harry-2000",
  t: "With a Friend Like Harry...",
  y: 2000,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "mystery"],
  tg: ["detective"],
  p: 5
}, {
  id: "under-the-sand-2000",
  t: "Under the Sand",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama", "mystery"],
  tg: ["detective"],
  p: 5
}, {
  id: "burnt-money-2000",
  t: "Burnt Money",
  y: 2000,
  b: "r",
  s: "live",
  g: ["crime", "drama", "romance"],
  tg: ["detective"],
  p: 5
}, {
  id: "harrison-s-flowers-2000",
  t: "Harrison's Flowers",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: ["war"],
  p: 5
}, {
  id: "the-gleaners-i-2000",
  t: "The Gleaners & I",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "eureka-2000",
  t: "Eureka",
  y: 2000,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 4
}, {
  id: "the-vertical-ray-of-the-sun-2000",
  t: "The Vertical Ray of the Sun",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "les-mis-rables-2000",
  t: "Les mis\u00e9rables",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4,
  k: "s"
},
// ===== United Kingdom, 2000 onwards =====
{
  id: "wasteman-2025",
  t: "Wasteman",
  y: 2025,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 5
}, {
  id: "my-father-s-shadow-2025",
  t: "My Father's Shadow",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "ocean-with-david-attenborough-2025",
  t: "Ocean with David Attenborough",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "louis-theroux-the-settlers-2025",
  t: "Louis Theroux: The Settlers",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "grenfell-uncovered-2025",
  t: "Grenfell: Uncovered",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "a-friend-of-dorothy-2025",
  t: "A Friend of Dorothy",
  y: 2025,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 4
}, {
  id: "federer-twelve-final-days-2024",
  t: "Federer: Twelve Final Days",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 4
}, {
  id: "femme-2023",
  t: "Femme",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 5
}, {
  id: "the-walk-in-2022",
  t: "The Walk-In",
  y: 2022,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 5,
  k: "s"
}, {
  id: "sir-alex-ferguson-never-give-in-2021",
  t: "Sir Alex Ferguson: Never Give In",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 5
}, {
  id: "nowhere-special-2020",
  t: "Nowhere Special",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "secrets-of-the-saqqara-tomb-2020",
  t: "Secrets of the Saqqara Tomb",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "night-on-earth-2020",
  t: "Night on Earth",
  y: 2020,
  b: "k",
  s: "live",
  g: ["drama"],
  tg: ["family"],
  p: 4,
  k: "s"
}, {
  id: "oasis-2017",
  t: "Oasis",
  y: 2017,
  b: "x",
  s: "live",
  g: ["drama", "scifi"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "the-king-s-speech-2010",
  t: "The King's Speech",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 9
}, {
  id: "four-lions-2010",
  t: "Four Lions",
  y: 2010,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "senna-2010",
  t: "Senna",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 7
}, {
  id: "another-year-2010",
  t: "Another Year",
  y: 2010,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "an-education-2009",
  t: "An Education",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "harry-brown-2009",
  t: "Harry Brown",
  y: 2009,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "fish-tank-2009",
  t: "Fish Tank",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "in-the-loop-2009",
  t: "In the Loop",
  y: 2009,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 7
}, {
  id: "the-damned-united-2009",
  t: "The Damned United",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 6
}, {
  id: "emma-2009",
  t: "Emma",
  y: 2009,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "alice-2009",
  t: "Alice",
  y: 2009,
  b: "x",
  s: "live",
  g: ["adventure", "drama", "fantasy"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "wuthering-heights-2009",
  t: "Wuthering Heights",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "the-take-2009",
  t: "The Take",
  y: 2009,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 5,
  k: "s"
}, {
  id: "horrible-histories-2009",
  t: "Horrible Histories",
  y: 2009,
  b: "k",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["family"],
  p: 5,
  k: "s"
}, {
  id: "the-bank-job-2008",
  t: "The Bank Job",
  y: 2008,
  b: "r",
  s: "live",
  g: ["crime", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "hunger-2008",
  t: "Hunger",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 7
}, {
  id: "sense-sensibility-2008",
  t: "Sense & Sensibility",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "lost-in-austen-2008",
  t: "Lost in Austen",
  y: 2008,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "romance"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "boy-a-2007",
  t: "Boy A",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "shaun-the-sheep-2007",
  t: "Shaun the Sheep",
  y: 2007,
  b: "k",
  s: "live",
  g: ["animation", "comedy"],
  tg: ["family"],
  p: 6,
  k: "s"
}, {
  id: "the-last-king-of-scotland-2006",
  t: "The Last King of Scotland",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "this-is-england-2006",
  t: "This Is England",
  y: 2006,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "notes-on-a-scandal-2006",
  t: "Notes on a Scandal",
  y: 2006,
  b: "r",
  s: "live",
  g: ["crime", "drama", "romance"],
  tg: ["detective"],
  p: 7
}, {
  id: "after-the-wedding-2006",
  t: "After the Wedding",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "jane-eyre-2006",
  t: "Jane Eyre",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "snow-cake-2006",
  t: "Snow Cake",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "the-descent-2005",
  t: "The Descent",
  y: 2005,
  b: "r",
  s: "live",
  g: ["adventure", "horror", "thriller"],
  tg: [],
  p: 8
}, {
  id: "the-proposition-2005",
  t: "The Proposition",
  y: 2005,
  b: "r",
  s: "live",
  g: ["crime", "drama", "adventure"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-constant-gardener-2005",
  t: "The Constant Gardener",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "romance"],
  tg: ["detective"],
  p: 7
}, {
  id: "tsotsi-2005",
  t: "Tsotsi",
  y: 2005,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 6
}, {
  id: "breakfast-on-pluto-2005",
  t: "Breakfast on Pluto",
  y: 2005,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "shooting-dogs-2005",
  t: "Shooting Dogs",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 5
}, {
  id: "fingersmith-2005",
  t: "Fingersmith",
  y: 2005,
  b: "r",
  s: "live",
  g: ["crime", "drama", "romance"],
  tg: ["detective"],
  p: 5,
  k: "s"
}, {
  id: "layer-cake-2004",
  t: "Layer Cake",
  y: 2004,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "dead-man-s-shoes-2004",
  t: "Dead Man's Shoes",
  y: 2004,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 7
}, {
  id: "dear-frankie-2004",
  t: "Dear Frankie",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "north-south-2004",
  t: "North & South",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "brothers-2004",
  t: "Brothers",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 5
}, {
  id: "i-m-not-scared-2003",
  t: "I'm Not Scared",
  y: 2003,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 6
}, {
  id: "touching-the-void-2003",
  t: "Touching the Void",
  y: 2003,
  b: "x",
  s: "live",
  g: ["adventure", "drama"],
  tg: [],
  p: 6
}, {
  id: "facing-windows-2003",
  t: "Facing Windows",
  y: 2003,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "28-days-later-2002",
  t: "28 Days Later",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama", "horror", "scifi"],
  tg: [],
  p: 8
}, {
  id: "24-hour-party-people-2002",
  t: "24 Hour Party People",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama", "comedy"],
  tg: [],
  p: 6
}, {
  id: "dirty-pretty-things-2002",
  t: "Dirty Pretty Things",
  y: 2002,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 6
}, {
  id: "bloody-sunday-2002",
  t: "Bloody Sunday",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 6
}, {
  id: "sweet-sixteen-2002",
  t: "Sweet Sixteen",
  y: 2002,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "the-century-of-the-self-2002",
  t: "The Century of the Self",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "tipping-the-velvet-2002",
  t: "Tipping the Velvet",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "still-game-2002",
  t: "Still Game",
  y: 2002,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "phoenix-nights-2001",
  t: "Phoenix Nights",
  y: 2001,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "billy-elliot-2000",
  t: "Billy Elliot",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 7
}, {
  id: "sexy-beast-2000",
  t: "Sexy Beast",
  y: 2000,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-10th-kingdom-2000",
  t: "The 10th Kingdom",
  y: 2000,
  b: "k",
  s: "live",
  g: ["adventure", "comedy"],
  tg: ["family"],
  p: 6,
  k: "s"
},
// ===== Japan, 2000 onwards =====
{
  id: "tokyo-taxi-2025",
  t: "Tokyo Taxi",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "18-2-beyond-youthful-days-2024",
  t: "18\u00d72 Beyond Youthful Days",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: ["japan"],
  p: 4
}, {
  id: "kingdom-4-return-of-the-great-gene-2024",
  t: "Kingdom 4: Return of the Great General",
  y: 2024,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: ["japan"],
  p: 4
}, {
  id: "magic-candies-2024",
  t: "Magic Candies",
  y: 2024,
  b: "k",
  s: "live",
  g: ["animation", "fantasy"],
  tg: ["family"],
  p: 3
}, {
  id: "gran-turismo-2023",
  t: "Gran Turismo",
  y: 2023,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 7
}, {
  id: "blue-giant-2023",
  t: "Blue Giant",
  y: 2023,
  b: "t",
  s: "live",
  g: ["animation", "drama", "musical"],
  tg: ["music"],
  p: 4
}, {
  id: "rascal-does-not-dream-of-a-knapsac-2023",
  t: "Rascal Does Not Dream of a Knapsack Kid",
  y: 2023,
  b: "t",
  s: "live",
  g: ["animation", "drama", "fantasy"],
  tg: ["japan", "anime"],
  p: 4
}, {
  id: "old-fox-2023",
  t: "Old Fox",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan"],
  p: 3
}, {
  id: "dragon-ball-super-super-hero-2022",
  t: "Dragon Ball Super: Super Hero",
  y: 2022,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: ["japan", "anime"],
  p: 6
}, {
  id: "the-last-10-years-2022",
  t: "The Last 10 Years",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "your-eyes-tell-2020",
  t: "Your Eyes Tell",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: ["japan"],
  p: 4
}, {
  id: "yakuza-and-the-family-2020",
  t: "Yakuza and the Family",
  y: 2020,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["japan", "detective"],
  p: 4
}, {
  id: "under-the-open-sky-2020",
  t: "Under the Open Sky",
  y: 2020,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["japan", "detective"],
  p: 4
}, {
  id: "37-seconds-2019",
  t: "37 Seconds",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "kakegurui-2017",
  t: "Kakegurui",
  y: 2017,
  b: "t",
  s: "live",
  g: ["animation", "drama", "mystery"],
  tg: ["detective"],
  p: 5,
  k: "s"
}, {
  id: "let-me-eat-your-pancreas-2017",
  t: "Let Me Eat Your Pancreas",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: ["japan"],
  p: 4
}, {
  id: "junk-head-2017",
  t: "Junk Head",
  y: 2017,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: [],
  p: 4
}, {
  id: "gantz-o-2016",
  t: "Gantz: O",
  y: 2016,
  b: "t",
  s: "live",
  g: ["action", "animation", "drama"],
  tg: [],
  p: 6
}, {
  id: "survival-family-2016",
  t: "Survival Family",
  y: 2016,
  b: "k",
  s: "live",
  g: ["adventure", "comedy"],
  tg: ["family", "japan"],
  p: 4
}, {
  id: "dragon-ball-z-resurrection-f-2015",
  t: "Dragon Ball Z: Resurrection 'F'",
  y: 2015,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: ["japan", "anime"],
  p: 6
}, {
  id: "happy-hour-2015",
  t: "Happy Hour",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan"],
  p: 4
}, {
  id: "why-don-t-you-play-in-hell-2013",
  t: "Why Don't You Play in Hell?",
  y: 2013,
  b: "r",
  s: "live",
  g: ["action", "comedy", "horror"],
  tg: ["japan"],
  p: 5
}, {
  id: "a-touch-of-sin-2013",
  t: "A Touch of Sin",
  y: 2013,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["japan", "detective"],
  p: 5
}, {
  id: "naruto-shippuden-the-movie-blood-p-2011",
  t: "Naruto Shippuden the Movie: Blood Prison",
  y: 2011,
  b: "t",
  s: "live",
  g: ["action", "animation", "mystery"],
  tg: ["japan", "anime", "detective"],
  p: 5
}, {
  id: "himizu-2011",
  t: "Himizu",
  y: 2011,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 4
}, {
  id: "scott-pilgrim-vs-the-world-2010",
  t: "Scott Pilgrim vs. the World",
  y: 2010,
  b: "x",
  s: "live",
  g: ["action", "comedy", "fantasy"],
  tg: [],
  p: 8
}, {
  id: "13-assassins-2010",
  t: "13 Assassins",
  y: 2010,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: ["japan"],
  p: 7
}, {
  id: "confessions-2010",
  t: "Confessions",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: ["japan"],
  p: 6
}, {
  id: "cold-fish-2010",
  t: "Cold Fish",
  y: 2010,
  b: "r",
  s: "live",
  g: ["crime", "drama", "horror"],
  tg: ["japan", "detective"],
  p: 5
}, {
  id: "colorful-2010",
  t: "Colorful",
  y: 2010,
  b: "t",
  s: "live",
  g: ["animation", "drama", "fantasy"],
  tg: ["japan", "anime"],
  p: 5
}, {
  id: "time-of-eve-2010",
  t: "Time of Eve",
  y: 2010,
  b: "t",
  s: "live",
  g: ["animation", "drama", "romance"],
  tg: ["japan", "anime"],
  p: 4
}, {
  id: "crows-zero-ii-2009",
  t: "Crows Zero II",
  y: 2009,
  b: "r",
  s: "live",
  g: ["action", "comedy", "crime"],
  tg: ["japan", "detective"],
  p: 5
}, {
  id: "midnight-diner-2009",
  t: "Midnight Diner",
  y: 2009,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["japan"],
  p: 4,
  k: "s"
}, {
  id: "still-walking-2008",
  t: "Still Walking",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan"],
  p: 6
}, {
  id: "love-exposure-2008",
  t: "Love Exposure",
  y: 2008,
  b: "x",
  s: "live",
  g: ["action", "comedy", "drama"],
  tg: ["japan"],
  p: 6
}, {
  id: "tokyo-sonata-2008",
  t: "Tokyo Sonata",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "achilles-and-the-tortoise-2008",
  t: "Achilles and the Tortoise",
  y: 2008,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["japan"],
  p: 4
}, {
  id: "suspect-x-2008",
  t: "Suspect X",
  y: 2008,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["japan", "detective"],
  p: 4
}, {
  id: "control-2007",
  t: "Control",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 7
}, {
  id: "for-you-in-full-blossom-ikemen-par-2007",
  t: "For You in Full Blossom: Ikemen Paradise",
  y: 2007,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["japan"],
  p: 4,
  k: "s"
}, {
  id: "children-of-men-2006",
  t: "Children of Men",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama", "scifi", "thriller"],
  tg: [],
  p: 9
}, {
  id: "death-note-2006",
  t: "Death Note",
  y: 2006,
  b: "r",
  s: "live",
  g: ["crime", "drama", "fantasy"],
  tg: ["japan", "detective"],
  p: 6
}, {
  id: "death-note-the-last-name-2006",
  t: "Death Note: The Last Name",
  y: 2006,
  b: "r",
  s: "live",
  g: ["adventure", "crime", "drama"],
  tg: ["japan", "detective"],
  p: 6
}, {
  id: "time-2006",
  t: "Time",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "romance"],
  tg: ["japan", "detective"],
  p: 5
}, {
  id: "memories-of-matsuko-2006",
  t: "Memories of Matsuko",
  y: 2006,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["japan"],
  p: 5
}, {
  id: "love-and-honor-2006",
  t: "Love and Honor",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: ["japan"],
  p: 4
}, {
  id: "the-bow-2005",
  t: "The Bow",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: ["japan"],
  p: 5
}, {
  id: "linda-linda-linda-2005",
  t: "Linda Linda Linda",
  y: 2005,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "riding-alone-for-thousands-of-mile-2005",
  t: "Riding Alone for Thousands of Miles",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan"],
  p: 5
}, {
  id: "3-iron-2004",
  t: "3-Iron",
  y: 2004,
  b: "r",
  s: "live",
  g: ["crime", "drama", "romance"],
  tg: ["japan", "detective"],
  p: 7
}, {
  id: "nobody-knows-2004",
  t: "Nobody Knows",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan"],
  p: 6
}, {
  id: "the-taste-of-tea-2004",
  t: "The Taste of Tea",
  y: 2004,
  b: "x",
  s: "live",
  g: ["comedy", "fantasy"],
  tg: ["japan"],
  p: 5
}, {
  id: "the-hidden-blade-2004",
  t: "The Hidden Blade",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: ["japan"],
  p: 5
}, {
  id: "swing-girls-2004",
  t: "Swing Girls",
  y: 2004,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music", "japan"],
  p: 5
}, {
  id: "kamikaze-girls-2004",
  t: "Kamikaze Girls",
  y: 2004,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: ["japan"],
  p: 5
}, {
  id: "survive-style-5-2004",
  t: "Survive Style 5+",
  y: 2004,
  b: "r",
  s: "live",
  g: ["comedy", "fantasy", "horror"],
  tg: [],
  p: 5
}, {
  id: "be-with-you-2004",
  t: "Be with You",
  y: 2004,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "romance"],
  tg: ["japan"],
  p: 4
}, {
  id: "hana-alice-2004",
  t: "Hana & Alice",
  y: 2004,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: ["japan"],
  p: 4
}, {
  id: "tony-takitani-2004",
  t: "Tony Takitani",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan"],
  p: 4
}, {
  id: "crying-out-love-in-the-center-of-t-2004",
  t: "Crying Out Love in the Center of the World",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: ["japan"],
  p: 4
}, {
  id: "lost-in-translation-2003",
  t: "Lost in Translation",
  y: 2003,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 8
}, {
  id: "the-last-samurai-2003",
  t: "The Last Samurai",
  y: 2003,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 8
}, {
  id: "the-animatrix-2003",
  t: "The Animatrix",
  y: 2003,
  b: "t",
  s: "live",
  g: ["action", "animation", "scifi"],
  tg: [],
  p: 7
}, {
  id: "the-blind-swordsman-zatoichi-2003",
  t: "The Blind Swordsman: Zatoichi",
  y: 2003,
  b: "r",
  s: "live",
  g: ["action", "comedy", "crime"],
  tg: ["japan", "detective"],
  p: 6
}, {
  id: "osama-2003",
  t: "Osama",
  y: 2003,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "last-life-in-the-universe-2003",
  t: "Last Life in the Universe",
  y: 2003,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: ["japan"],
  p: 5
}, {
  id: "dolls-2002",
  t: "Dolls",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: ["japan"],
  p: 6
}, {
  id: "the-twilight-samurai-2002",
  t: "The Twilight Samurai",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: ["japan"],
  p: 6
}, {
  id: "ghost-in-the-shell-stand-alone-com-2002",
  t: "Ghost in the Shell: Stand Alone Complex",
  y: 2002,
  b: "r",
  s: "live",
  g: ["action", "animation", "crime"],
  tg: ["japan", "anime", "detective"],
  p: 6,
  k: "s"
}, {
  id: "when-the-last-sword-is-drawn-2002",
  t: "When the Last Sword Is Drawn",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan"],
  p: 4
}, {
  id: "saint-seiya-the-hades-chapter-2002",
  t: "Saint Seiya: The Hades Chapter",
  y: 2002,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: ["japan", "anime"],
  p: 4,
  k: "s"
}, {
  id: "all-about-lily-chou-chou-2001",
  t: "All About Lily Chou-Chou",
  y: 2001,
  b: "r",
  s: "live",
  g: ["crime", "drama", "musical"],
  tg: ["music", "japan", "detective"],
  p: 5
}, {
  id: "blue-spring-2001",
  t: "Blue Spring",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan"],
  p: 4
}, {
  id: "battle-royale-2000",
  t: "Battle Royale",
  y: 2000,
  b: "r",
  s: "live",
  g: ["action", "drama", "thriller"],
  tg: ["japan"],
  p: 8
}, {
  id: "wonder-boys-2000",
  t: "Wonder Boys",
  y: 2000,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 7
}, {
  id: "yi-yi-2000",
  t: "Yi Yi",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["japan"],
  p: 6
}, {
  id: "brother-2000",
  t: "Brother",
  y: 2000,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 6
}, {
  id: "little-otik-2000",
  t: "Little Otik",
  y: 2000,
  b: "t",
  s: "live",
  g: ["animation", "comedy", "drama"],
  tg: ["japan", "anime"],
  p: 5
},
// ===== South Korea, 2000 onwards =====
{
  id: "the-king-s-warden-2026",
  t: "The King\u2019s Warden",
  y: 2026,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "the-prosecutor-s-proposal-2026",
  t: "The Prosecutor's Proposal",
  y: 2026,
  b: "r",
  s: "live",
  g: ["mystery", "romance"],
  tg: ["detective"],
  p: 2,
  k: "s"
}, {
  id: "love-untangled-2025",
  t: "Love Untangled",
  y: 2025,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "even-if-this-love-disappears-from--2025",
  t: "Even If This Love Disappears from the World Tonight",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "the-world-of-love-2025",
  t: "The World of Love",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 3
}, {
  id: "love-in-the-big-city-2024",
  t: "Love in the Big City",
  y: 2024,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "hear-me-our-summer-2024",
  t: "Hear Me: Our Summer",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 3
}, {
  id: "soulmate-2023",
  t: "Soulmate",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "a-normal-family-2023",
  t: "A Normal Family",
  y: 2023,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 4
}, {
  id: "bts-yet-to-come-in-cinemas-2023",
  t: "BTS: Yet to Come in Cinemas",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 4
}, {
  id: "j-hope-in-the-box-2023",
  t: "j-hope IN THE BOX",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 4
}, {
  id: "the-eighth-sense-2023",
  t: "The Eighth Sense",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "suga-road-to-d-day-2023",
  t: "Suga: Road to D-Day",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 3
}, {
  id: "broker-2022",
  t: "Broker",
  y: 2022,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 6
}, {
  id: "next-sohee-2022",
  t: "Next Sohee",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 4
}, {
  id: "hello-me-2021",
  t: "Hello, Me!",
  y: 2021,
  b: "x",
  s: "live",
  g: ["comedy", "drama", "fantasy"],
  tg: [],
  p: 3,
  k: "s"
}, {
  id: "the-call-2020",
  t: "The Call",
  y: 2020,
  b: "r",
  s: "live",
  g: ["crime", "horror", "mystery"],
  tg: ["detective"],
  p: 6
}, {
  id: "pawn-2020",
  t: "Pawn",
  y: 2020,
  b: "k",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["family"],
  p: 4
}, {
  id: "break-the-silence-the-movie-2020",
  t: "Break the Silence: The Movie",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 4
}, {
  id: "extreme-job-2019",
  t: "Extreme Job",
  y: 2019,
  b: "r",
  s: "live",
  g: ["action", "comedy", "crime"],
  tg: ["detective"],
  p: 5
}, {
  id: "innocent-witness-2019",
  t: "Innocent Witness",
  y: 2019,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 4
}, {
  id: "along-with-the-gods-the-last-49-da-2018",
  t: "Along With the Gods: The Last 49 Days",
  y: 2018,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 5
}, {
  id: "on-your-wedding-day-2018",
  t: "On Your Wedding Day",
  y: 2018,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "swing-kids-2018",
  t: "Swing Kids",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["war"],
  p: 4
}, {
  id: "the-battleship-island-2017",
  t: "The Battleship Island",
  y: 2017,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 5
}, {
  id: "steel-rain-2017",
  t: "Steel Rain",
  y: 2017,
  b: "r",
  s: "live",
  g: ["action", "drama", "thriller"],
  tg: [],
  p: 5
}, {
  id: "microhabitat-2017",
  t: "Microhabitat",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "don-t-dare-to-dream-2016",
  t: "Don't Dare to Dream",
  y: 2016,
  b: "r",
  s: "live",
  g: ["comedy", "romance"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "shopping-king-louie-2016",
  t: "Shopping King Louie",
  y: 2016,
  b: "r",
  s: "live",
  g: ["comedy", "romance"],
  tg: [],
  p: 4,
  k: "s"
}, {
  id: "the-throne-2015",
  t: "The Throne",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 4
}, {
  id: "right-now-wrong-then-2015",
  t: "Right Now, Wrong Then",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "hello-monster-2015",
  t: "Hello Monster",
  y: 2015,
  b: "r",
  s: "live",
  g: ["action", "crime", "mystery"],
  tg: ["detective"],
  p: 4,
  k: "s"
}, {
  id: "the-admiral-roaring-currents-2014",
  t: "The Admiral: Roaring Currents",
  y: 2014,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 5
}, {
  id: "cold-eyes-2013",
  t: "Cold Eyes",
  y: 2013,
  b: "r",
  s: "live",
  g: ["action", "crime", "thriller"],
  tg: ["detective"],
  p: 5
}, {
  id: "the-terror-live-2013",
  t: "The Terror Live",
  y: 2013,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "pieta-2012",
  t: "Pieta",
  y: 2012,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 5
}, {
  id: "war-of-the-arrows-2011",
  t: "War of the Arrows",
  y: 2011,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 5
}, {
  id: "heartstrings-2011",
  t: "Heartstrings",
  y: 2011,
  b: "r",
  s: "live",
  g: ["drama", "musical", "romance"],
  tg: ["music"],
  p: 4,
  k: "s"
}, {
  id: "the-man-from-nowhere-2010",
  t: "The Man from Nowhere",
  y: 2010,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "i-saw-the-devil-2010",
  t: "I Saw the Devil",
  y: 2010,
  b: "r",
  s: "live",
  g: ["action", "thriller"],
  tg: [],
  p: 7
}, {
  id: "the-yellow-sea-2010",
  t: "The Yellow Sea",
  y: 2010,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 6
}, {
  id: "bedevilled-2010",
  t: "Bedevilled",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama", "horror", "thriller"],
  tg: [],
  p: 6
}, {
  id: "poetry-2010",
  t: "Poetry",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "71-into-the-fire-2010",
  t: "71: Into the Fire",
  y: 2010,
  b: "r",
  s: "live",
  g: ["action", "drama"],
  tg: ["war"],
  p: 5
}, {
  id: "no-mercy-2010",
  t: "No Mercy",
  y: 2010,
  b: "r",
  s: "live",
  g: ["action", "crime", "thriller"],
  tg: ["detective"],
  p: 5
}, {
  id: "hello-ghost-2010",
  t: "Hello Ghost",
  y: 2010,
  b: "k",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["family"],
  p: 4
}, {
  id: "mother-2009",
  t: "Mother",
  y: 2009,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 7
}, {
  id: "castaway-on-the-moon-2009",
  t: "Castaway on the Moon",
  y: 2009,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "thirst-2009",
  t: "Thirst",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama", "fantasy", "horror"],
  tg: [],
  p: 6
}, {
  id: "red-cliff-ii-2009",
  t: "Red Cliff II",
  y: 2009,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 6
}, {
  id: "the-chaser-2008",
  t: "The Chaser",
  y: 2008,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-good-the-bad-the-weird-2008",
  t: "The Good, the Bad, the Weird",
  y: 2008,
  b: "x",
  s: "live",
  g: ["action", "adventure", "comedy"],
  tg: [],
  p: 6
}, {
  id: "red-cliff-2008",
  t: "Red Cliff",
  y: 2008,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 6
}, {
  id: "breathless-2008",
  t: "Breathless",
  y: 2008,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "a-frozen-flower-2008",
  t: "A Frozen Flower",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "scandal-makers-2008",
  t: "Scandal Makers",
  y: 2008,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 4
}, {
  id: "secret-sunshine-2007",
  t: "Secret Sunshine",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "assembly-2007",
  t: "Assembly",
  y: 2007,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 5
}, {
  id: "the-host-2006",
  t: "The Host",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama", "horror", "scifi"],
  tg: [],
  p: 7
}, {
  id: "a-dirty-carnival-2006",
  t: "A Dirty Carnival",
  y: 2006,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "daisy-2006",
  t: "Daisy",
  y: 2006,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 5
}, {
  id: "a-millionaire-s-first-love-2006",
  t: "A Millionaire's First Love",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 4
}, {
  id: "sympathy-for-lady-vengeance-2005",
  t: "Sympathy for Lady Vengeance",
  y: 2005,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 7
}, {
  id: "a-bittersweet-life-2005",
  t: "A Bittersweet Life",
  y: 2005,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 6
}, {
  id: "the-king-and-the-clown-2005",
  t: "The King and the Clown",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "welcome-to-dongmakgol-2005",
  t: "Welcome to Dongmakgol",
  y: 2005,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["war"],
  p: 5
}, {
  id: "tae-guk-gi-the-brotherhood-of-war-2004",
  t: "Tae Guk Gi: The Brotherhood of War",
  y: 2004,
  b: "r",
  s: "live",
  g: ["action", "drama"],
  tg: ["war"],
  p: 6
}, {
  id: "a-moment-to-remember-2004",
  t: "A Moment to Remember",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "windstruck-2004",
  t: "Windstruck",
  y: 2004,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "memories-of-murder-2003",
  t: "Memories of Murder",
  y: 2003,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 8
}, {
  id: "spring-summer-fall-winter-and-spri-2003",
  t: "Spring, Summer, Fall, Winter... and Spring",
  y: 2003,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "a-tale-of-two-sisters-2003",
  t: "A Tale of Two Sisters",
  y: 2003,
  b: "r",
  s: "live",
  g: ["drama", "horror", "mystery"],
  tg: ["detective"],
  p: 7
}, {
  id: "save-the-green-planet-2003",
  t: "Save the Green Planet!",
  y: 2003,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 5
}, {
  id: "the-classic-2003",
  t: "The Classic",
  y: 2003,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "sympathy-for-mr-vengeance-2002",
  t: "Sympathy for Mr. Vengeance",
  y: 2002,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-way-home-2002",
  t: "The Way Home",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "oasis-2002",
  t: "Oasis",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "my-sassy-girl-2001",
  t: "My Sassy Girl",
  y: 2001,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "failan-2001",
  t: "Failan",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "the-warrior-2001",
  t: "The Warrior",
  y: 2001,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 5
}, {
  id: "address-unknown-2001",
  t: "Address Unknown",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 4
}, {
  id: "friend-2001",
  t: "Friend",
  y: 2001,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 4
}, {
  id: "joint-security-area-2000",
  t: "Joint Security Area",
  y: 2000,
  b: "r",
  s: "live",
  g: ["action", "drama", "thriller"],
  tg: [],
  p: 6
}, {
  id: "il-mare-2000",
  t: "Il Mare",
  y: 2000,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "romance"],
  tg: [],
  p: 5
},
// ===== United States, 2000 onwards =====
{
  id: "toy-story-5-2026",
  t: "Toy Story 5",
  y: 2026,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 6
}, {
  id: "the-invite-2026",
  t: "The Invite",
  y: 2026,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 5
}, {
  id: "young-washington-2026",
  t: "Young Washington",
  y: 2026,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 5
}, {
  id: "train-dreams-2025",
  t: "Train Dreams",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "becoming-led-zeppelin-2025",
  t: "Becoming Led Zeppelin",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "the-alabama-solution-2025",
  t: "The Alabama Solution",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "epic-elvis-presley-in-concert-2025",
  t: "Epic: Elvis Presley in Concert",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "john-candy-i-like-me-2025",
  t: "John Candy: I Like Me",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama", "comedy"],
  tg: [],
  p: 5
}, {
  id: "aka-charlie-sheen-2025",
  t: "Aka Charlie Sheen",
  y: 2025,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "my-mom-jayne-2025",
  t: "My Mom Jayne",
  y: 2025,
  b: "k",
  s: "live",
  g: ["drama"],
  tg: ["family"],
  p: 4
}, {
  id: "better-man-2024",
  t: "Better Man",
  y: 2024,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "musical"],
  tg: ["music"],
  p: 6
}, {
  id: "young-woman-and-the-sea-2024",
  t: "Young Woman and the Sea",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "the-greatest-night-in-pop-2024",
  t: "The Greatest Night in Pop",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "super-man-the-christopher-reeve-st-2024",
  t: "Super/Man: The Christopher Reeve Story",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "we-will-dance-again-2024",
  t: "We Will Dance Again",
  y: 2024,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "the-covenant-2023",
  t: "The Covenant",
  y: 2023,
  b: "r",
  s: "live",
  g: ["action", "drama", "thriller"],
  tg: [],
  p: 8
}, {
  id: "the-iron-claw-2023",
  t: "The Iron Claw",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 7
}, {
  id: "american-fiction-2023",
  t: "American Fiction",
  y: 2023,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 7
}, {
  id: "still-a-michael-j-fox-movie-2023",
  t: "Still: A Michael J. Fox Movie",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "take-care-of-maya-2023",
  t: "Take Care of Maya",
  y: 2023,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "a-man-called-otto-2022",
  t: "A Man Called Otto",
  y: 2022,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 8
}, {
  id: "the-fabelmans-2022",
  t: "The Fabelmans",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "the-boy-the-mole-the-fox-and-the-h-2022",
  t: "The Boy, the Mole, the Fox and the Horse",
  y: 2022,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 6
}, {
  id: "fire-of-love-2022",
  t: "Fire of Love",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5
}, {
  id: "moonage-daydream-2022",
  t: "Moonage Daydream",
  y: 2022,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "hundreds-of-beavers-2022",
  t: "Hundreds of Beavers",
  y: 2022,
  b: "x",
  s: "live",
  g: ["action", "adventure", "comedy"],
  tg: [],
  p: 5
}, {
  id: "king-richard-2021",
  t: "King Richard",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 8
}, {
  id: "tick-tick-boom-2021",
  t: "tick, tick... BOOM!",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama", "comedy"],
  tg: [],
  p: 7
}, {
  id: "the-mauritanian-2021",
  t: "The Mauritanian",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 7
}, {
  id: "mass-2021",
  t: "Mass",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "the-rescue-2021",
  t: "The Rescue",
  y: 2021,
  b: "x",
  s: "live",
  g: ["action", "drama", "mystery"],
  tg: ["detective"],
  p: 6
}, {
  id: "station-eleven-2021",
  t: "Station Eleven",
  y: 2021,
  b: "x",
  s: "live",
  g: ["adventure", "drama", "fantasy"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "the-alpinist-2021",
  t: "The Alpinist",
  y: 2021,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 5
}, {
  id: "promising-young-woman-2020",
  t: "Promising Young Woman",
  y: 2020,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 8
}, {
  id: "tiger-king-2020",
  t: "Tiger King",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 7,
  k: "s"
}, {
  id: "spinning-out-2020",
  t: "Spinning Out",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 6,
  k: "s"
}, {
  id: "dinner-in-america-2020",
  t: "Dinner in America",
  y: 2020,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "mrs-america-2020",
  t: "Mrs. America",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "the-comey-rule-2020",
  t: "The Comey Rule",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "for-life-2020",
  t: "For Life",
  y: 2020,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 5,
  k: "s"
}, {
  id: "the-farewell-2019",
  t: "The Farewell",
  y: 2019,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 7
}, {
  id: "richard-jewell-2019",
  t: "Richard Jewell",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 7
}, {
  id: "waves-2019",
  t: "Waves",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "romance", "sports"],
  tg: ["sports"],
  p: 6
}, {
  id: "apollo-11-2019",
  t: "Apollo 11",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "a-dog-s-journey-2019",
  t: "A Dog's Journey",
  y: 2019,
  b: "x",
  s: "live",
  g: ["adventure", "comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "looking-for-alaska-2019",
  t: "Looking for Alaska",
  y: 2019,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "the-favourite-2018",
  t: "The Favourite",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "comedy"],
  tg: [],
  p: 8
}, {
  id: "blackkklansman-2018",
  t: "BlacKkKlansman",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama", "comedy", "crime"],
  tg: ["detective"],
  p: 8
}, {
  id: "love-simon-2018",
  t: "Love, Simon",
  y: 2018,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "the-hate-u-give-2018",
  t: "The Hate U Give",
  y: 2018,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 6
}, {
  id: "won-t-you-be-my-neighbor-2018",
  t: "Won't You Be My Neighbor?",
  y: 2018,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "the-big-sick-2017",
  t: "The Big Sick",
  y: 2017,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "jim-andy-the-great-beyond-2017",
  t: "Jim & Andy: The Great Beyond",
  y: 2017,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "doctor-strange-2016",
  t: "Doctor Strange",
  y: 2016,
  b: "x",
  s: "live",
  g: ["action", "adventure", "fantasy"],
  tg: [],
  p: 9
}, {
  id: "o-j-made-in-america-2016",
  t: "O.J.: Made in America",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 6
}, {
  id: "before-the-flood-2016",
  t: "Before the Flood",
  y: 2016,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "cobain-montage-of-heck-2015",
  t: "Cobain: Montage of Heck",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 6
}, {
  id: "where-to-invade-next-2015",
  t: "Where to Invade Next",
  y: 2015,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "unreal-2015",
  t: "UnREAL",
  y: 2015,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "the-flash-2014",
  t: "The Flash",
  y: 2014,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 8,
  k: "s"
}, {
  id: "selma-2014",
  t: "Selma",
  y: 2014,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "the-hunger-games-catching-fire-2013",
  t: "The Hunger Games: Catching Fire",
  y: 2013,
  b: "x",
  s: "live",
  g: ["action", "adventure", "romance"],
  tg: [],
  p: 9
}, {
  id: "lone-survivor-2013",
  t: "Lone Survivor",
  y: 2013,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 8
}, {
  id: "saving-mr-banks-2013",
  t: "Saving Mr. Banks",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama", "comedy"],
  tg: [],
  p: 7
}, {
  id: "42-2013",
  t: "42",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 7
}, {
  id: "fruitvale-station-2013",
  t: "Fruitvale Station",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-book-thief-2013",
  t: "The Book Thief",
  y: 2013,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 7
}, {
  id: "disconnect-2012",
  t: "Disconnect",
  y: 2012,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 7
}, {
  id: "hugo-2011",
  t: "Hugo",
  y: 2011,
  b: "k",
  s: "live",
  g: ["adventure", "drama"],
  tg: ["family"],
  p: 8
}, {
  id: "black-swan-2010",
  t: "Black Swan",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: [],
  p: 9
}, {
  id: "kick-ass-2010",
  t: "Kick-Ass",
  y: 2010,
  b: "r",
  s: "live",
  g: ["action", "comedy", "crime"],
  tg: ["detective"],
  p: 9
}, {
  id: "harry-potter-and-the-deathly-hallo-2010",
  t: "Harry Potter and the Deathly Hallows: Part 1",
  y: 2010,
  b: "k",
  s: "live",
  g: ["adventure", "fantasy"],
  tg: ["family"],
  p: 9
}, {
  id: "true-grit-2010",
  t: "True Grit",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama", "adventure"],
  tg: [],
  p: 8
}, {
  id: "the-fighter-2010",
  t: "The Fighter",
  y: 2010,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 8
}, {
  id: "tucker-and-dale-vs-evil-2010",
  t: "Tucker and Dale vs Evil",
  y: 2010,
  b: "r",
  s: "live",
  g: ["comedy", "horror"],
  tg: [],
  p: 8
}, {
  id: "127-hours-2010",
  t: "127 Hours",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "the-town-2010",
  t: "The Town",
  y: 2010,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "exit-through-the-gift-shop-2010",
  t: "Exit Through the Gift Shop",
  y: 2010,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "my-name-is-khan-2010",
  t: "My Name Is Khan",
  y: 2010,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "inside-job-2010",
  t: "Inside Job",
  y: 2010,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "flipped-2010",
  t: "Flipped",
  y: 2010,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "batman-under-the-red-hood-2010",
  t: "Batman: Under the Red Hood",
  y: 2010,
  b: "r",
  s: "live",
  g: ["action", "animation", "crime"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-avengers-earth-s-mightiest-her-2010",
  t: "The Avengers: Earth's Mightiest Heroes",
  y: 2010,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "harry-potter-and-the-half-blood-pr-2009",
  t: "Harry Potter and the Half-Blood Prince",
  y: 2009,
  b: "k",
  s: "live",
  g: ["adventure", "fantasy"],
  tg: ["family"],
  p: 9
}, {
  id: "watchmen-2009",
  t: "Watchmen",
  y: 2009,
  b: "x",
  s: "live",
  g: ["action", "drama", "mystery"],
  tg: ["detective"],
  p: 9
}, {
  id: "sherlock-holmes-2009",
  t: "Sherlock Holmes",
  y: 2009,
  b: "x",
  s: "live",
  g: ["action", "adventure", "mystery"],
  tg: ["detective"],
  p: 9
}, {
  id: "district-9-2009",
  t: "District 9",
  y: 2009,
  b: "r",
  s: "live",
  g: ["action", "scifi", "thriller"],
  tg: [],
  p: 9
}, {
  id: "star-trek-2009",
  t: "Star Trek",
  y: 2009,
  b: "x",
  s: "live",
  g: ["action", "adventure", "scifi"],
  tg: [],
  p: 9
}, {
  id: "zombieland-2009",
  t: "Zombieland",
  y: 2009,
  b: "r",
  s: "live",
  g: ["action", "comedy", "horror"],
  tg: [],
  p: 9
}, {
  id: "moon-2009",
  t: "Moon",
  y: 2009,
  b: "x",
  s: "live",
  g: ["drama", "mystery", "scifi"],
  tg: ["detective"],
  p: 8
}, {
  id: "hachi-a-dog-s-tale-2009",
  t: "Hachi: A Dog's Tale",
  y: 2009,
  b: "k",
  s: "live",
  g: ["drama"],
  tg: ["family"],
  p: 8
}, {
  id: "the-blind-side-2009",
  t: "The Blind Side",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 8
}, {
  id: "fantastic-mr-fox-2009",
  t: "Fantastic Mr. Fox",
  y: 2009,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 8
}, {
  id: "a-single-man-2009",
  t: "A Single Man",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama", "romance", "thriller"],
  tg: [],
  p: 7
}, {
  id: "the-cove-2009",
  t: "The Cove",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 6
}, {
  id: "sin-nombre-2009",
  t: "Sin Nombre",
  y: 2009,
  b: "r",
  s: "live",
  g: ["adventure", "crime", "drama"],
  tg: ["detective"],
  p: 6
}, {
  id: "when-you-re-strange-2009",
  t: "When You're Strange",
  y: 2009,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 5
}, {
  id: "gran-torino-2008",
  t: "Gran Torino",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 9
}, {
  id: "the-curious-case-of-benjamin-butto-2008",
  t: "The Curious Case of Benjamin Button",
  y: 2008,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "romance"],
  tg: [],
  p: 9
}, {
  id: "the-reader-2008",
  t: "The Reader",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "romance"],
  tg: ["detective"],
  p: 8
}, {
  id: "the-boy-in-the-striped-pajamas-2008",
  t: "The Boy in the Striped Pajamas",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 8
}, {
  id: "the-hurt-locker-2008",
  t: "The Hurt Locker",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama", "thriller"],
  tg: ["war"],
  p: 8
}, {
  id: "milk-2008",
  t: "Milk",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "in-bruges-2008",
  t: "In Bruges",
  y: 2008,
  b: "r",
  s: "live",
  g: ["comedy", "crime", "drama"],
  tg: ["detective"],
  p: 8
}, {
  id: "changeling-2008",
  t: "Changeling",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 8
}, {
  id: "seven-pounds-2008",
  t: "Seven Pounds",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "religulous-2008",
  t: "Religulous",
  y: 2008,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["war"],
  p: 7
}, {
  id: "doubt-2008",
  t: "Doubt",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama", "mystery"],
  tg: ["detective"],
  p: 7
}, {
  id: "synecdoche-new-york-2008",
  t: "Synecdoche, New York",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "man-on-wire-2008",
  t: "Man on Wire",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 7
}, {
  id: "generation-kill-2008",
  t: "Generation Kill",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 7,
  k: "s"
}, {
  id: "food-inc-2008",
  t: "Food, Inc.",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "dear-zachary-a-letter-to-a-son-abo-2008",
  t: "Dear Zachary: A Letter to a Son About His Father",
  y: 2008,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 6
}, {
  id: "harry-potter-and-the-order-of-the--2007",
  t: "Harry Potter and the Order of the Phoenix",
  y: 2007,
  b: "k",
  s: "live",
  g: ["adventure", "fantasy"],
  tg: ["family"],
  p: 9
}, {
  id: "the-bourne-ultimatum-2007",
  t: "The Bourne Ultimatum",
  y: 2007,
  b: "r",
  s: "live",
  g: ["action", "mystery", "thriller"],
  tg: ["detective"],
  p: 9
}, {
  id: "there-will-be-blood-2007",
  t: "There Will Be Blood",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 9
}, {
  id: "into-the-wild-2007",
  t: "Into the Wild",
  y: 2007,
  b: "x",
  s: "live",
  g: ["adventure", "drama"],
  tg: [],
  p: 9
}, {
  id: "the-man-from-earth-2007",
  t: "The Man from Earth",
  y: 2007,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "mystery"],
  tg: ["detective"],
  p: 8
}, {
  id: "gone-baby-gone-2007",
  t: "Gone Baby Gone",
  y: 2007,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 8
}, {
  id: "american-gangster-2007",
  t: "American Gangster",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 8
}, {
  id: "the-assassination-of-jesse-james-b-2007",
  t: "The Assassination of Jesse James by the Coward Robert Ford",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 8
}, {
  id: "eastern-promises-2007",
  t: "Eastern Promises",
  y: 2007,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "3-10-to-yuma-2007",
  t: "3:10 to Yuma",
  y: 2007,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 8
}, {
  id: "freedom-writers-2007",
  t: "Freedom Writers",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 7
}, {
  id: "sicko-2007",
  t: "Sicko",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "the-kite-runner-2007",
  t: "The Kite Runner",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "the-great-debaters-2007",
  t: "The Great Debaters",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "zeitgeist-2007",
  t: "Zeitgeist",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "lust-caution-2007",
  t: "Lust, Caution",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 6
}, {
  id: "futurama-bender-s-big-score-2007",
  t: "Futurama: Bender's Big Score",
  y: 2007,
  b: "t",
  s: "live",
  g: ["animation", "comedy", "musical"],
  tg: [],
  p: 6
}, {
  id: "the-visitor-2007",
  t: "The Visitor",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "the-king-of-kong-a-fistful-of-quar-2007",
  t: "The King of Kong: A Fistful of Quarters",
  y: 2007,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 6
}, {
  id: "blood-diamond-2006",
  t: "Blood Diamond",
  y: 2006,
  b: "r",
  s: "live",
  g: ["adventure", "drama", "thriller"],
  tg: [],
  p: 9
}, {
  id: "300-2006",
  t: "300",
  y: 2006,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 9
}, {
  id: "the-pursuit-of-happyness-2006",
  t: "The Pursuit of Happyness",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 9
}, {
  id: "dexter-2006",
  t: "Dexter",
  y: 2006,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 9,
  k: "s"
}, {
  id: "inside-man-2006",
  t: "Inside Man",
  y: 2006,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 8
}, {
  id: "stranger-than-fiction-2006",
  t: "Stranger Than Fiction",
  y: 2006,
  b: "x",
  s: "live",
  g: ["comedy", "drama", "fantasy"],
  tg: [],
  p: 8
}, {
  id: "apocalypto-2006",
  t: "Apocalypto",
  y: 2006,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 8
}, {
  id: "the-illusionist-2006",
  t: "The Illusionist",
  y: 2006,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "mystery"],
  tg: ["detective"],
  p: 8
}, {
  id: "lucky-number-slevin-2006",
  t: "Lucky Number Slevin",
  y: 2006,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "letters-from-iwo-jima-2006",
  t: "Letters from Iwo Jima",
  y: 2006,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 7
}, {
  id: "the-fall-2006",
  t: "The Fall",
  y: 2006,
  b: "x",
  s: "live",
  g: ["adventure", "drama", "fantasy"],
  tg: [],
  p: 7
}, {
  id: "little-children-2006",
  t: "Little Children",
  y: 2006,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "star-wars-episode-iii-revenge-of-t-2005",
  t: "Star Wars: Episode III - Revenge of the Sith",
  y: 2005,
  b: "x",
  s: "live",
  g: ["action", "adventure", "fantasy"],
  tg: [],
  p: 9
}, {
  id: "v-for-vendetta-2005",
  t: "V for Vendetta",
  y: 2005,
  b: "x",
  s: "live",
  g: ["action", "drama", "scifi"],
  tg: [],
  p: 9
}, {
  id: "sin-city-2005",
  t: "Sin City",
  y: 2005,
  b: "r",
  s: "live",
  g: ["crime", "thriller"],
  tg: ["detective"],
  p: 9
}, {
  id: "brokeback-mountain-2005",
  t: "Brokeback Mountain",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 8
}, {
  id: "walk-the-line-2005",
  t: "Walk the Line",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 8
}, {
  id: "lord-of-war-2005",
  t: "Lord of War",
  y: 2005,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 8
}, {
  id: "cinderella-man-2005",
  t: "Cinderella Man",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 8
}, {
  id: "serenity-2005",
  t: "Serenity",
  y: 2005,
  b: "x",
  s: "live",
  g: ["action", "adventure", "scifi"],
  tg: [],
  p: 8
}, {
  id: "match-point-2005",
  t: "Match Point",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama", "romance", "thriller"],
  tg: [],
  p: 8
}, {
  id: "thank-you-for-smoking-2005",
  t: "Thank You for Smoking",
  y: 2005,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 8
}, {
  id: "the-world-s-fastest-indian-2005",
  t: "The World's Fastest Indian",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 7
}, {
  id: "wallace-gromit-the-curse-of-the-we-2005",
  t: "Wallace & Gromit: The Curse of the Were-Rabbit",
  y: 2005,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 7
}, {
  id: "grizzly-man-2005",
  t: "Grizzly Man",
  y: 2005,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "stewie-griffin-the-untold-story-2005",
  t: "Stewie Griffin: The Untold Story",
  y: 2005,
  b: "t",
  s: "live",
  g: ["adventure", "animation", "comedy"],
  tg: [],
  p: 6
}, {
  id: "million-dollar-baby-2004",
  t: "Million Dollar Baby",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama", "sports"],
  tg: ["sports"],
  p: 9
}, {
  id: "spider-man-2-2004",
  t: "Spider-Man 2",
  y: 2004,
  b: "x",
  s: "live",
  g: ["action", "adventure", "scifi"],
  tg: [],
  p: 9
}, {
  id: "kill-bill-vol-2-2004",
  t: "Kill Bill: Vol. 2",
  y: 2004,
  b: "r",
  s: "live",
  g: ["action", "crime", "thriller"],
  tg: ["detective"],
  p: 9
}, {
  id: "collateral-2004",
  t: "Collateral",
  y: 2004,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 8
}, {
  id: "the-bourne-supremacy-2004",
  t: "The Bourne Supremacy",
  y: 2004,
  b: "r",
  s: "live",
  g: ["action", "mystery", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "crash-2004",
  t: "Crash",
  y: 2004,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "finding-neverland-2004",
  t: "Finding Neverland",
  y: 2004,
  b: "k",
  s: "live",
  g: ["drama"],
  tg: ["family"],
  p: 8
}, {
  id: "the-aviator-2004",
  t: "The Aviator",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "the-butterfly-effect-2004",
  t: "The Butterfly Effect",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama", "scifi", "thriller"],
  tg: [],
  p: 8
}, {
  id: "hotel-rwanda-2004",
  t: "Hotel Rwanda",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "man-on-fire-2004",
  t: "Man on Fire",
  y: 2004,
  b: "r",
  s: "live",
  g: ["action", "crime", "drama"],
  tg: ["detective"],
  p: 8
}, {
  id: "saw-2004",
  t: "Saw",
  y: 2004,
  b: "r",
  s: "live",
  g: ["horror", "mystery", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "sideways-2004",
  t: "Sideways",
  y: 2004,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "romance"],
  tg: [],
  p: 8
}, {
  id: "before-sunset-2004",
  t: "Before Sunset",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 8
}, {
  id: "fahrenheit-9-11-2004",
  t: "Fahrenheit 9/11",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: ["war"],
  p: 7
}, {
  id: "ray-2004",
  t: "Ray",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama", "musical"],
  tg: ["music"],
  p: 7
}, {
  id: "miracle-2004",
  t: "Miracle",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "mysterious-skin-2004",
  t: "Mysterious Skin",
  y: 2004,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "kill-bill-the-whole-bloody-affair-2004",
  t: "Kill Bill: The Whole Bloody Affair",
  y: 2004,
  b: "r",
  s: "live",
  g: ["action", "crime", "thriller"],
  tg: ["detective"],
  p: 6
}, {
  id: "farscape-the-peacekeeper-wars-2004",
  t: "Farscape: The Peacekeeper Wars",
  y: 2004,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 5,
  k: "s"
}, {
  id: "the-lord-of-the-rings-the-return-o-2003",
  t: "The Lord of the Rings: The Return of the King",
  y: 2003,
  b: "x",
  s: "live",
  g: ["adventure", "drama", "fantasy"],
  tg: [],
  p: 10
}, {
  id: "21-grams-2003",
  t: "21 Grams",
  y: 2003,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "mystic-river-2003",
  t: "Mystic River",
  y: 2003,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 8
}, {
  id: "big-fish-2003",
  t: "Big Fish",
  y: 2003,
  b: "x",
  s: "live",
  g: ["adventure", "drama", "fantasy"],
  tg: [],
  p: 8
}, {
  id: "master-and-commander-the-far-side--2003",
  t: "Master and Commander: The Far Side of the World",
  y: 2003,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 8
}, {
  id: "house-of-sand-and-fog-2003",
  t: "House of Sand and Fog",
  y: 2003,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-life-of-david-gale-2003",
  t: "The Life of David Gale",
  y: 2003,
  b: "r",
  s: "live",
  g: ["crime", "drama", "mystery"],
  tg: ["detective"],
  p: 7
}, {
  id: "secondhand-lions-2003",
  t: "Secondhand Lions",
  y: 2003,
  b: "k",
  s: "live",
  g: ["comedy", "drama"],
  tg: ["family"],
  p: 7
}, {
  id: "the-station-agent-2003",
  t: "The Station Agent",
  y: 2003,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 7
}, {
  id: "angels-in-america-2003",
  t: "Angels in America",
  y: 2003,
  b: "x",
  s: "live",
  g: ["drama", "fantasy", "romance"],
  tg: [],
  p: 6,
  k: "s"
}, {
  id: "the-lord-of-the-rings-the-two-towe-2002",
  t: "The Lord of the Rings: The Two Towers",
  y: 2002,
  b: "x",
  s: "live",
  g: ["adventure", "drama", "fantasy"],
  tg: [],
  p: 10
}, {
  id: "harry-potter-and-the-chamber-of-se-2002",
  t: "Harry Potter and the Chamber of Secrets",
  y: 2002,
  b: "k",
  s: "live",
  g: ["adventure", "fantasy"],
  tg: ["family"],
  p: 9
}, {
  id: "minority-report-2002",
  t: "Minority Report",
  y: 2002,
  b: "r",
  s: "live",
  g: ["action", "crime", "mystery"],
  tg: ["detective"],
  p: 9
}, {
  id: "gangs-of-new-york-2002",
  t: "Gangs of New York",
  y: 2002,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 8
}, {
  id: "25th-hour-2002",
  t: "25th Hour",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "adaptation-2002",
  t: "Adaptation.",
  y: 2002,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 8
}, {
  id: "road-to-perdition-2002",
  t: "Road to Perdition",
  y: 2002,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "bowling-for-columbine-2002",
  t: "Bowling for Columbine",
  y: 2002,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "the-hours-2002",
  t: "The Hours",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama", "romance"],
  tg: [],
  p: 7
}, {
  id: "the-count-of-monte-cristo-2002",
  t: "The Count of Monte Cristo",
  y: 2002,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 7
}, {
  id: "in-america-2002",
  t: "In America",
  y: 2002,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}, {
  id: "interstate-60-2002",
  t: "Interstate 60",
  y: 2002,
  b: "x",
  s: "live",
  g: ["adventure", "comedy", "drama"],
  tg: [],
  p: 6
}, {
  id: "the-lord-of-the-rings-the-fellowsh-2001",
  t: "The Lord of the Rings: The Fellowship of the Ring",
  y: 2001,
  b: "x",
  s: "live",
  g: ["adventure", "drama", "fantasy"],
  tg: [],
  p: 10
}, {
  id: "donnie-darko-2001",
  t: "Donnie Darko",
  y: 2001,
  b: "x",
  s: "live",
  g: ["drama", "mystery", "scifi"],
  tg: ["detective"],
  p: 9
}, {
  id: "moulin-rouge-2001",
  t: "Moulin Rouge!",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama", "musical", "romance"],
  tg: [],
  p: 8
}, {
  id: "black-hawk-down-2001",
  t: "Black Hawk Down",
  y: 2001,
  b: "x",
  s: "live",
  g: ["action", "drama"],
  tg: [],
  p: 8
}, {
  id: "mulholland-drive-2001",
  t: "Mulholland Drive",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama", "mystery", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "training-day-2001",
  t: "Training Day",
  y: 2001,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "blow-2001",
  t: "Blow",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama", "crime"],
  tg: ["detective"],
  p: 8
}, {
  id: "the-royal-tenenbaums-2001",
  t: "The Royal Tenenbaums",
  y: 2001,
  b: "r",
  s: "live",
  g: ["comedy", "drama"],
  tg: [],
  p: 8
}, {
  id: "waking-life-2001",
  t: "Waking Life",
  y: 2001,
  b: "t",
  s: "live",
  g: ["animation", "drama", "fantasy"],
  tg: [],
  p: 7
}, {
  id: "i-am-sam-2001",
  t: "I Am Sam",
  y: 2001,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 7
}, {
  id: "the-man-who-wasn-t-there-2001",
  t: "The Man Who Wasn't There",
  y: 2001,
  b: "r",
  s: "live",
  g: ["crime", "drama"],
  tg: ["detective"],
  p: 7
}, {
  id: "samurai-jack-2001",
  t: "Samurai Jack",
  y: 2001,
  b: "t",
  s: "live",
  g: ["action", "adventure", "animation"],
  tg: [],
  p: 7,
  k: "s"
}, {
  id: "hedwig-and-the-angry-inch-2001",
  t: "Hedwig and the Angry Inch",
  y: 2001,
  b: "r",
  s: "live",
  g: ["comedy", "drama", "musical"],
  tg: ["music"],
  p: 6
}, {
  id: "cast-away-2000",
  t: "Cast Away",
  y: 2000,
  b: "x",
  s: "live",
  g: ["adventure", "drama", "romance"],
  tg: [],
  p: 9
}, {
  id: "snatch-2000",
  t: "Snatch",
  y: 2000,
  b: "r",
  s: "live",
  g: ["comedy", "crime"],
  tg: ["detective"],
  p: 9
}, {
  id: "requiem-for-a-dream-2000",
  t: "Requiem for a Dream",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 9
}, {
  id: "american-psycho-2000",
  t: "American Psycho",
  y: 2000,
  b: "r",
  s: "live",
  g: ["crime", "drama", "horror"],
  tg: ["detective"],
  p: 9
}, {
  id: "traffic-2000",
  t: "Traffic",
  y: 2000,
  b: "r",
  s: "live",
  g: ["crime", "drama", "thriller"],
  tg: ["detective"],
  p: 8
}, {
  id: "erin-brockovich-2000",
  t: "Erin Brockovich",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 8
}, {
  id: "crouching-tiger-hidden-dragon-2000",
  t: "Crouching Tiger, Hidden Dragon",
  y: 2000,
  b: "x",
  s: "live",
  g: ["action", "adventure", "drama"],
  tg: [],
  p: 8
}, {
  id: "almost-famous-2000",
  t: "Almost Famous",
  y: 2000,
  b: "x",
  s: "live",
  g: ["adventure", "comedy", "drama"],
  tg: [],
  p: 8
}, {
  id: "best-in-show-2000",
  t: "Best in Show",
  y: 2000,
  b: "r",
  s: "live",
  g: ["comedy"],
  tg: [],
  p: 7
}, {
  id: "batman-beyond-return-of-the-joker-2000",
  t: "Batman Beyond: Return of the Joker",
  y: 2000,
  b: "r",
  s: "live",
  g: ["action", "animation", "crime"],
  tg: ["detective"],
  p: 6
}, {
  id: "you-can-count-on-me-2000",
  t: "You Can Count on Me",
  y: 2000,
  b: "r",
  s: "live",
  g: ["drama"],
  tg: [],
  p: 6
}];

// ---------- Built-in critic scores ----------
// Real figures for every title, so the app is useful with no API key at all.
// IMDb user ratings come from IMDb's official public dataset
// (datasets.imdbws.com). The Rotten Tomatoes figure is the CRITICS'
// Tomatometer and the Metacritic figure is the critics' Metascore, both from
// Wikidata, filtered by determination method so neither is confused with
// Rotten Tomatoes' /10 review average. Rotten Tomatoes' audience score
// (Popcornmeter) has no free bulk source anywhere and is not included.
// Format: [imdb, votes in thousands, tomatometer, metascore], trailing
// values omitted when unknown.
const BUILTIN_SCORES_DATE = "2026-07-30";
const BUILTIN_SCORES = {
  "12-12-the-day-2023": [7.5, 5],
  "12-years-a-slave-2013": [8.1, 791, 95, 96],
  "120-bpm-beats-per-minute-2017": [7.4, 18, 99, 84],
  "127-hours-2010": [7.5, 426, 93, 82],
  "12angry": [9.0, 993, 100, 97],
  "13-assassins-2010": [7.5, 72, 95, 84],
  "13-tzameti-2005": [7.3, 19, 84, 61],
  "13th-2016": [8.2, 39, 97, 81],
  "14-peaks-nothing-is-impossible-2021": [7.7, 34],
  "18-2-beyond-youthful-days-2024": [7.5, 3],
  "1987-when-the-day-comes-2017": [7.7, 8, 82],
  "20-000-days-on-earth-2014": [7.4, 12, 95, 83],
  "20-days-in-mariupol-2023": [8.6, 65, 100, 83],
  "2046-2004": [7.4, 65, 87, 78],
  "20th-century-girl-2022": [7.4, 16],
  "21-grams-2003": [7.6, 253, 80, 70],
  "24-hour-party-people-2002": [7.3, 41, 86, 85],
  "25th-hour-2002": [7.6, 191, 79, 69],
  "28-days-later-2002": [7.5, 552, 87, 73],
  "3-10-to-yuma-2007": [7.6, 352, 89, 76],
  "3-iron-2004": [7.9, 62, 87, 72],
  "300-2006": [7.6, 917, 61, 52],
  "35-shots-of-rum-2008": [7.1, 6, 97, 92],
  "36th-precinct-2004": [7.1, 20, 100],
  "37-seconds-2019": [7.4, 4, 88],
  "3body": [7.5, 183],
  "42-2013": [7.5, 109, 81, 62],
  "5-broken-cameras-2011": [7.9, 7, 96, 78],
  "50-50-2011": [7.6, 355, 93, 72],
  "71-2014": [7.2, 65, 96, 83],
  "71-into-the-fire-2010": [7.3, 6],
  "8-women-2002": [7.0, 35, 79, 64],
  "99-francs-2007": [7.1, 22],
  "a-bag-of-marbles-2017": [7.3, 7, 83],
  "a-bittersweet-life-2005": [7.5, 48, 100],
  "a-cat-in-paris-2010": [6.9, 13, 83],
  "a-dirty-carnival-2006": [7.3, 10],
  "a-dog-s-journey-2019": [7.5, 33, 51, 43],
  "a-friend-of-dorothy-2025": [7.2, 3],
  "a-frozen-flower-2008": [7.1, 6],
  "a-hard-day-2014": [7.2, 19],
  "a-hero-2021": [7.5, 33, 97, 82],
  "a-korean-odyssey-2017": [7.9, 7],
  "a-league-of-their-own-2022": [7.6, 26],
  "a-man-called-otto-2022": [7.5, 214, 70, 51],
  "a-millionaire-s-first-love-2006": [7.2, 6],
  "a-moment-to-remember-2004": [8.1, 27],
  "a-normal-family-2023": [7.1, 3],
  "a-prophet-2009": [7.8, 108, 96, 90],
  "a-series-of-unfortunate-events-2017": [7.7, 73],
  "a-serious-man-2009": [7.0, 159, 89, 88],
  "a-single-man-2009": [7.5, 122, 86, 77],
  "a-star-is-born-2018": [7.6, 451, 90, 88],
  "a-street-cat-named-bob-2016": [7.3, 37, 77, 54],
  "a-tale-of-two-sisters-2003": [7.1, 75, 85, 65],
  "a-taxi-driver-2017": [7.9, 39, 97, 69],
  "a-touch-of-sin-2013": [7.1, 14, 94],
  "a-town-called-panic-2009": [7.4, 9, 81],
  "a-twelve-year-night-2018": [7.5, 12, 80],
  "a-very-english-scandal-2018": [7.6, 18],
  "a-very-long-engagement-2004": [7.6, 78, 79, 76],
  "a-very-secret-service-2015": [7.7, 4],
  "a-werewolf-boy-2012": [7.2, 10, 100],
  "aaltra-2004": [6.9, 3],
  "abbott": [8.2, 54],
  "abominable": [7.0, 47, 83, 61],
  "about-a-boy-2002": [7.1, 199, 93, 75],
  "about-dry-grasses-2023": [7.7, 20, 92, 88],
  "abouttime": [7.8, 438, 71, 55],
  "achilles-and-the-tortoise-2008": [7.3, 4],
  "acrossverse": [8.5, 537, 95, 86],
  "adam-2019": [7.2, 2, 87],
  "adaptation-2002": [7.6, 214, 90, 83],
  "addams": [7.0, 202, 67, 57],
  "address-unknown-2001": [7.2, 4],
  "adolescence": [8.1, 311],
  "aferim-2015": [7.6, 9, 98, 84],
  "after-love-2020": [7.3, 5, 97, 81],
  "after-lucia-2012": [7.1, 7, 86],
  "after-the-storm-2016": [7.4, 14, 96, 84],
  "after-the-wedding-2006": [7.6, 39, 88, 78],
  "afternoons-of-solitude-2024": [7.1, 2],
  "aftersun-2022": [7.6, 131, 96, 95],
  "air": [7.4, 197, 92, 73],
  "aka-charlie-sheen-2025": [7.5, 13],
  "akira": [8.0, 229, 91, 68],
  "aladdin": [8.0, 503, 96, 86],
  "aladdin19": [6.9, 317, 57, 53],
  "ali-zaoua-prince-of-the-streets-2000": [7.3, 3, 73],
  "alice-2009": [7.2, 10],
  "aliceborderland": [7.8, 150],
  "alien": [8.4, 1070, 93, 89],
  "aliens": [8.4, 844, 93, 84],
  "all-about-lily-chou-chou-2001": [7.5, 14],
  "all-hands-on-deck-2020": [7.0, 3],
  "all-of-us-strangers-2023": [7.6, 80, 96, 90],
  "all-or-nothing-2002": [7.5, 12, 82, 72],
  "all-quiet-on-the-western-front-2022": [7.8, 342, 90, 76],
  "all-the-invisible-children-2005": [7.4, 4],
  "all-your-faces-2023": [7.5, 5, 100],
  "almost-famous-2000": [7.9, 316, 91, 90],
  "along-with-the-gods-the-last-49-da-2018": [7.1, 11, 44],
  "along-with-the-gods-the-two-worlds-2017": [7.2, 22, 67],
  "always-2011": [7.7, 13],
  "amal-2023": [7.4, 1],
  "amanda-2018": [7.0, 4, 96],
  "amelie": [8.2, 843, 90, 70],
  "amen-2002": [7.2, 16, 67, 57],
  "american-fiction-2023": [7.5, 156, 94, 81],
  "american-gangster-2007": [7.8, 490, 81, 76],
  "american-psycho-2000": [7.6, 847, 68, 64],
  "amour-2012": [7.9, 111, 93, 95],
  "amy-2015": [7.8, 58, 95, 85],
  "an-education-2009": [7.2, 141, 93, 85],
  "an-officer-and-a-spy-2019": [7.2, 23, 76, 59],
  "anastasia": [7.2, 148, 83, 61],
  "anatomy-of-a-fall-2023": [7.6, 235, 96, 86],
  "anchorman": [7.1, 403, 66, 63],
  "andor": [8.6, 282, 96, 84],
  "angel-a-2005": [7.1, 37, 45, 48],
  "angels-in-america-2003": [8.1, 32],
  "anora": [7.4, 300, 93, 91],
  "another-day-of-life-2018": [7.3, 3, 89],
  "another-world-2021": [7.0, 3, 100, 79],
  "another-year-2010": [7.4, 32, 93, 81],
  "anthropoid-2016": [7.2, 60, 66, 59],
  "any-way-the-wind-blows-2003": [7.1, 3],
  "anything-for-her-2008": [7.1, 10, 81],
  "aot": [9.1, 733],
  "apocalypse-la-1-re-guerre-mondiale-2014": [8.8, 3],
  "apocalypse-the-second-world-war-2009": [9.0, 21],
  "apocalypto-2006": [7.9, 362, 65, 68],
  "apollo-11-2019": [8.1, 29, 99, 88],
  "april-and-the-extraordinary-world-2015": [7.3, 9, 97],
  "aquaman": [6.8, 556, 65, 55],
  "architecture-101-2012": [7.2, 5],
  "arco-2025": [7.3, 8],
  "argo-2012": [7.7, 670, 96, 86],
  "aristocats": [7.1, 126, 64, 66],
  "arrietty": [7.6, 118, 94, 80],
  "arrival": [7.9, 872, 94, 81],
  "asako-i-ii-2018": [7.1, 6, 78],
  "ash-is-purest-white-2018": [7.0, 12, 99, 85],
  "assassination-2015": [7.2, 9, 83, 64],
  "assembly-2007": [7.3, 8],
  "ast-rix-the-mansions-of-the-gods-2014": [6.9, 17, 71],
  "atla": [9.3, 449],
  "atlantis": [6.9, 149, 48, 52],
  "atonement-2007": [7.8, 331, 83, 85],
  "attack-on-titan-the-last-attack-2024": [9.0, 33],
  "attack-on-titan-the-roar-of-awaken-2018": [8.3, 7],
  "avatar": [7.9, 1508, 81, 83],
  "avatar2": [7.5, 641, 76, 67],
  "avatar3": [7.2, 195, 68, 61],
  "avengers": [8.0, 1568, 91, 69],
  "azur-asmar-the-princes-quest-2006": [7.3, 4, 81],
  "bab-aziz-the-prince-that-contempla-2005": [7.5, 4, 58],
  "babe": [6.9, 143, 98, 83],
  "babel-2006": [7.4, 330, 69, 69],
  "babies-2010": [7.0, 8, 68, 63],
  "baby-2024": [7.1, 1],
  "babydriver": [7.5, 690, 0, 86],
  "backfuture": [8.5, 1464, 92, 88],
  "bacurau-2019": [7.3, 35, 93, 82],
  "bad-seeds-2018": [7.2, 7],
  "badguys": [6.9, 82, 87, 64],
  "badguys2": [7.0, 30, 88, 64],
  "ballad-of-a-white-cow-2020": [7.1, 3, 89],
  "balzac-and-the-little-chinese-seam-2002": [7.2, 5, 77],
  "baptiste-2019": [7.3, 11],
  "barbie": [6.8, 698, 88, 80],
  "bates-motel-2013": [8.1, 126],
  "batman-beyond-return-of-the-joker-2000": [7.7, 32, 100],
  "batman-the-dark-knight-returns-par-2012": [7.9, 68, 100],
  "batman-the-dark-knight-returns-par-2013": [8.3, 62],
  "batman-under-the-red-hood-2010": [8.0, 75, 100],
  "batmanbegins": [8.2, 1729, 85, 70],
  "battle-royale-2000": [7.5, 208, 90, 81],
  "be-with-you-2004": [7.8, 5],
  "be-with-you-2018": [7.7, 8],
  "beastars-2019": [7.6, 16],
  "beasts-of-no-nation-2015": [7.7, 92, 92, 79],
  "beating-hearts-2024": [7.0, 9, 32, 50],
  "beautifulmind": [8.2, 1059, 74, 72],
  "beauty": [8.0, 508, 95, 95],
  "beauty17": [7.1, 361, 71, 65],
  "becoming-led-zeppelin-2025": [7.5, 9],
  "bedevilled-2010": [7.2, 20],
  "before-midnight-2013": [7.9, 187, 98, 94],
  "before-sunset-2004": [8.1, 318, 94, 91],
  "before-the-flood-2016": [8.2, 30, 75, 63],
  "behind-the-sun-2001": [7.6, 8, 74, 73],
  "beijing-bicycle-2001": [7.2, 5, 62, 61],
  "being-17-2016": [7.2, 8, 95, 83],
  "belfast-2021": [7.2, 139, 86, 75],
  "belle": [7.0, 21, 95, 83],
  "belle-2013": [7.3, 35, 84, 64],
  "ben-x-2007": [7.3, 20, 69],
  "best-in-show-2000": [7.5, 76, 93, 78],
  "better-man-2024": [7.5, 47, 89, 77],
  "bettercall": [9.0, 850],
  "between-two-dawns-2021": [7.0, 2],
  "beyond-the-hills-2012": [7.5, 14, 91, 79],
  "beyond-the-infinite-two-minutes-2020": [7.2, 11],
  "big-fish-2003": [7.9, 479, 75, 58],
  "bighero6": [7.8, 558, 90, 74],
  "bigshort": [7.8, 544, 89, 81],
  "billy-elliot-2000": [7.7, 153, 85, 74],
  "bird-2024": [7.0, 13, 86],
  "birdboy-the-forgotten-children-2015": [7.2, 4, 94],
  "birdman-or-the-unexpected-virtue-o-2014": [7.7, 701, 91, 87],
  "birdsong-2012": [7.3, 7],
  "black-2015": [7.0, 5, 60],
  "black-book-2006": [7.7, 84, 77, 71],
  "black-box-2021": [7.2, 20, 94],
  "black-box-diaries-2024": [7.5, 5, 98, 82],
  "black-hawk-down-2001": [7.7, 457, 76, 74],
  "black-swan-2010": [8.0, 893, 85, 79],
  "blackfish-2013": [8.1, 77, 98, 83],
  "blackkklansman-2018": [7.5, 316, 96, 83],
  "blackmirror": [8.7, 743],
  "blackpanther": [7.3, 916, 96, 88],
  "bladerunner": [8.0, 761, 88, 81],
  "blame-it-on-fidel-2006": [7.5, 5, 93],
  "blind-willow-sleeping-woman-2022": [7.1, 1],
  "blood-diamond-2006": [8.0, 628, 64, 64],
  "bloody-sunday-2002": [7.6, 27, 92, 90],
  "blow-2001": [7.5, 288, 56, 52],
  "blue-gate-crossing-2002": [7.4, 5],
  "blue-giant-2023": [7.8, 4],
  "blue-is-the-warmest-colour-2013": [7.6, 174, 88, 90],
  "blue-spring-2001": [7.2, 5],
  "bluey": [9.3, 49],
  "bo-burnham-inside-2021": [8.6, 60, 93],
  "bohemian": [7.9, 651, 60, 49],
  "boiling-point-2021": [7.5, 57, 99, 73],
  "bolt": [6.8, 250, 90, 67],
  "bossbaby": [6.3, 160, 53, 50],
  "bourne": [7.8, 617, 84, 68],
  "bowling-for-columbine-2002": [7.9, 152, 95, 72],
  "boxtrolls": [6.8, 65, 78, 61],
  "boy-a-2007": [7.5, 40, 88, 75],
  "boyhood-2014": [7.9, 383, 97, 100],
  "boys": [8.5, 1011],
  "brave": [7.1, 483, 79, 69],
  "bread-and-roses-2000": [7.0, 6, 67, 57],
  "break-the-silence-the-movie-2020": [8.2, 3],
  "breakfast-on-pluto-2005": [7.2, 27, 57, 59],
  "breakingbad": [9.5, 2648],
  "breathe-2014": [7.0, 8, 92],
  "breathe-2017": [7.2, 27, 68, 51],
  "breathless-2008": [7.5, 6, 85],
  "bridesmaids": [6.8, 327, 90, 75],
  "bridge-of-spies-2015": [7.6, 346, 91, 81],
  "bridgerton": [7.5, 231],
  "brimstone-2016": [7.0, 50, 43, 45],
  "brokeback-mountain-2005": [7.7, 420, 88, 87],
  "broken-2012": [7.2, 16, 63, 53],
  "broken-flowers-2005": [7.1, 111, 87, 79],
  "broker-2022": [7.1, 21, 94, 77],
  "brooklyn-2015": [7.5, 159, 97, 88],
  "brooklyn99": [8.4, 420],
  "brother-2000": [7.1, 26, 47, 47],
  "brotherhood-of-the-wolf-2001": [7.0, 77, 73, 57],
  "brothers-2004": [7.5, 12, 0, 76],
  "brutalist": [7.2, 161, 93, 90],
  "bts-yet-to-come-in-cinemas-2023": [8.5, 2],
  "bugs": [7.2, 339, 92, 78],
  "bullettrain": [7.3, 542, 53, 49],
  "bullhead-2011": [7.3, 25, 87, 68],
  "burn-after-reading-2008": [7.0, 378, 78, 63],
  "burn-the-stage-the-movie-2018": [8.5, 5],
  "burning-2018": [7.4, 87, 95, 91],
  "burning-days-2022": [7.4, 15],
  "burnt-money-2000": [7.0, 7, 77],
  "by-the-grace-of-god-2018": [7.2, 9, 96, 75],
  "bye-bye-tiberias-2023": [7.4, 1, 100],
  "c-b-strike-2017": [7.9, 33],
  "cach-2005": [7.3, 91, 89, 87],
  "caf-de-flore-2011": [7.3, 17, 64],
  "call-me-by-your-name-2017": [7.8, 362, 94, 94],
  "calle-m-laga-2025": [7.1, 2],
  "calvary-2014": [7.4, 68, 89, 77],
  "capital-in-the-twenty-first-centur-2019": [7.3, 3, 93],
  "captain-america-civil-war-2016": [7.8, 936, 90, 75],
  "captain-fantastic-2016": [7.8, 252, 82, 72],
  "captain-phillips-2013": [7.8, 521, 93, 82],
  "captain-volkonogov-escaped-2021": [7.3, 3],
  "captainmarvel": [6.7, 664, 79, 64],
  "captainunderpants": [6.2, 37, 87, 69],
  "caramel-2007": [7.1, 15, 93, 70],
  "carnage-2011": [7.1, 139, 70, 61],
  "cars": [7.3, 543, 75, 73],
  "cars3": [6.7, 155, 70, 59],
  "casablanca": [8.5, 658, 99, 100],
  "case-137-2025": [7.2, 3, 0, 73],
  "casinoroyale": [8.0, 750, 94, 80],
  "casper": [6.2, 160, 59, 49],
  "cast-away-2000": [7.8, 693, 89, 74],
  "castaway-on-the-moon-2009": [7.9, 21],
  "castlesky": [8.0, 200, 96, 78],
  "catchme": [8.1, 1253, 96, 75],
  "cave-of-forgotten-dreams-2010": [7.4, 19, 96, 86],
  "cell-211-2009": [7.6, 74, 98],
  "certified-copy-2010": [7.2, 29, 89, 82],
  "challengers": [7.0, 182, 88, 82],
  "changeling-2008": [7.7, 276, 62, 63],
  "charlie": [6.7, 575, 83, 72],
  "che-part-one-2008": [7.1, 50, 68],
  "chernobyl": [9.3, 1052, 95, 82],
  "cherry-magic-thirty-years-of-virgi-2020": [8.2, 4],
  "chicken-for-linda-2023": [7.0, 1],
  "chicken-with-plums-2011": [7.0, 10, 74, 69],
  "chickenrun": [7.1, 226, 97, 88],
  "children-of-men-2006": [7.9, 569, 92, 84],
  "chocolat-2016": [7.0, 9, 100],
  "cind15": [6.9, 206, 84, 67],
  "cinderella-man-2005": [8.0, 210, 80, 69],
  "circles-2013": [7.7, 5],
  "citizenfour-2014": [8.0, 60, 96, 88],
  "city-of-god-2002": [8.6, 876, 91, 79],
  "clash-2016": [7.4, 7, 93],
  "climates-2006": [7.1, 15, 73, 72],
  "climax-2018": [6.9, 91, 68, 69],
  "close-2022": [7.8, 49, 91, 81],
  "cloudy": [6.9, 288, 86, 66],
  "clue": [7.3, 124, 66, 41],
  "clueless": [6.9, 280, 81, 73],
  "cobain-montage-of-heck-2015": [7.5, 33, 97, 83],
  "coco": [8.4, 718, 97, 81],
  "coda": [8.0, 231, 94, 72],
  "code-lyoko-2003": [7.3, 6],
  "code-unknown-2000": [7.1, 17, 75, 74],
  "cold-case-hammarskj-ld-2019": [7.5, 3],
  "cold-eyes-2013": [7.1, 9],
  "cold-fish-2010": [7.1, 16, 74],
  "cold-war-2018": [7.5, 66, 92, 90],
  "collateral-2004": [7.5, 471, 86, 71],
  "cologne-75-2025": [7.1, 2],
  "colonia-2015": [7.0, 60, 29, 33],
  "colorful-2010": [7.3, 8],
  "colours-of-time-2025": [7.2, 4],
  "come-as-you-are-2011": [7.3, 8],
  "conclave": [7.4, 284, 93, 79],
  "confessions-2010": [7.6, 45, 81],
  "conjuring": [7.5, 628, 86, 68],
  "control-2007": [7.6, 72, 88, 78],
  "conversations-with-my-gardener-2007": [7.1, 4, 100],
  "coolrun": [7.0, 124, 76, 60],
  "coraline": [7.8, 303, 91, 80],
  "corn-island-2014": [7.4, 5, 80],
  "corpus-christi-2019": [7.7, 24, 98],
  "cosmos-a-spacetime-odyssey-2014": [9.2, 141],
  "crash-2004": [7.7, 463, 74, 66],
  "crazyrich": [6.9, 210, 91, 74],
  "crazystupid": [7.4, 625, 79, 68],
  "creed": [7.6, 337, 95, 82],
  "crist-bal-balenciaga-2024": [7.4, 2],
  "croods": [7.1, 253, 71, 55],
  "crossing-2024": [7.4, 7, 97, 82],
  "crossing-lines-2013": [7.3, 14],
  "crouching-tiger-hidden-dragon-2000": [7.8, 296, 97, 94],
  "crown": [8.6, 283],
  "crows-zero-ii-2009": [7.2, 6],
  "cruella": [7.3, 299, 75, 59],
  "crying-out-love-in-the-center-of-t-2004": [7.2, 4],
  "cunk-on-life-2024": [7.3, 12],
  "custody-2017": [7.5, 11, 96],
  "cyberpunk-edgerunners-2022": [8.3, 131, 100],
  "cyrano-my-love-2018": [7.3, 4, 0, 61],
  "daft-punk-unchained-2015": [7.3, 4],
  "daisy-2006": [7.4, 7],
  "dallas-buyers-club-2013": [7.9, 551, 92, 77],
  "dancer-in-the-dark-2000": [7.9, 125, 70, 63],
  "dandadan": [8.3, 57],
  "dark-waters-2019": [7.6, 123, 89, 73],
  "darkest-hour-2017": [7.4, 245, 84, 75],
  "darkknight": [9.1, 3196, 94, 85],
  "darkseries": [8.7, 554, 95, 72],
  "darwin-s-nightmare-2004": [7.4, 6, 90, 84],
  "david-attenborough-a-life-on-our-p-2020": [8.9, 36, 95],
  "dawn-of-the-planet-of-the-apes-2014": [7.6, 513, 91, 79],
  "days-of-glory-2006": [7.0, 16, 83, 82],
  "days500": [7.6, 623, 85, 76],
  "de-big-fuck-up-2025": [7.5, 0],
  "de-gaulle-r-sistance-2026": [7.7, 2],
  "dead-man-s-shoes-2004": [7.5, 64, 57, 52],
  "deadpoets": [8.1, 661, 84, 79],
  "deadpool": [8.0, 1262, 85, 65],
  "deadpool-2-2018": [7.6, 750, 83, 66],
  "deadpool3": [7.5, 579, 78, 56],
  "dear-frankie-2004": [7.6, 23, 81, 63],
  "dear-zachary-a-letter-to-a-son-abo-2008": [8.5, 46, 94],
  "death-note-2006": [7.5, 33, 78],
  "death-note-the-last-name-2006": [7.1, 19, 80],
  "decision-to-leave-2022": [7.3, 70, 94, 85],
  "declaration-of-war-2011": [7.0, 5, 86, 73],
  "definitely-maybe-2008": [7.1, 182, 71, 59],
  "delicious-2021": [7.0, 7, 100],
  "demon-slayer-kimetsu-no-yaiba-asak-2021": [8.4, 6],
  "demon-slayer-kimetsu-no-yaiba-mt-n-2020": [8.7, 19],
  "demon-slayer-kimetsu-no-yaiba-to-t-2023": [7.7, 18],
  "departed": [8.5, 1565, 91, 85],
  "departures": [8.0, 58, 80, 68],
  "desert-flower-2009": [7.3, 16, 50, 54],
  "detachment-2011": [7.7, 113, 57, 52],
  "devilprada": [7.0, 562, 75, 62],
  "devils-2020": [7.2, 6],
  "devs-2020": [7.6, 58],
  "dexter-2006": [8.6, 946],
  "dheepan-2015": [7.2, 18, 87, 76],
  "diaz-don-t-clean-up-this-blood-2012": [7.3, 4, 40],
  "diego-maradona-2019": [7.7, 19, 90, 78],
  "diehard": [8.2, 1034, 94, 72],
  "digger-2020": [7.3, 3],
  "dinner-in-america-2020": [7.5, 17, 94],
  "dior-and-i-2014": [7.2, 4, 84, 70],
  "diplomacy-2014": [7.1, 6, 94, 72],
  "dirty-pretty-things-2002": [7.2, 46, 94, 78],
  "disconnect-2012": [7.5, 80, 70, 64],
  "district-9-2009": [7.9, 755, 90, 81],
  "district-b13-2004": [7.1, 78, 82, 70],
  "divines-2016": [7.3, 11, 84, 71],
  "django": [8.5, 1898, 87, 81],
  "dkr": [8.4, 2010, 87, 78],
  "dm": [7.6, 637, 80, 72],
  "dm4": [6.2, 83, 56, 52],
  "do-not-expect-too-much-from-the-en-2023": [7.3, 6, 97, 95],
  "doctor-strange-2016": [7.5, 887, 89, 72],
  "doctor-stranger-2014": [7.5, 4],
  "doctors-2016": [7.6, 4],
  "dog-pound-2010": [7.0, 15, 63, 57],
  "dogman": [6.3, 14, 82, 66],
  "dogman-2018": [7.2, 32, 84, 71],
  "dogs-2016": [7.0, 3, 67],
  "dogville-2003": [8.0, 168, 70, 61],
  "dolls-2002": [7.5, 18, 73, 71],
  "don-t-dare-to-dream-2016": [7.7, 2],
  "don-t-worry-i-m-fine-2006": [7.3, 12],
  "donnie-darko-2001": [8.0, 916, 87, 71],
  "doraemon": [7.4, 11],
  "dory": [7.2, 337, 94, 77],
  "doubt-2008": [7.5, 148, 79, 68],
  "downton-abbey-2019": [7.4, 72, 84, 64],
  "dragon-ball-super-super-hero-2022": [7.1, 19],
  "dragon-ball-z-resurrection-f-2015": [7.1, 26, 83],
  "drawing-closer-2024": [7.7, 4],
  "drive-2011": [7.8, 768, 93, 79],
  "drivemycar": [7.5, 77, 97, 91],
  "driving-madeleine-2022": [7.2, 4, 100, 64],
  "dumbo": [7.2, 151, 95, 96],
  "dune": [8.0, 1077, 83, 74],
  "dune-part-one-2021": [8.0, 1077, 83, 74],
  "dune2": [8.4, 777, 92, 79],
  "dunkirk": [7.8, 816, 92, 94],
  "eastern-promises-2007": [7.6, 279, 89, 83],
  "edgetomorrow": [7.9, 810, 91, 71],
  "eeaao": [7.7, 656, 93, 81],
  "elemental": [7.0, 167, 73, 58],
  "elementary-2012": [7.9, 127],
  "elf": [7.1, 348, 86, 66],
  "elio": [6.6, 47, 83, 66],
  "elle-2016": [7.1, 75, 91, 89],
  "elvis": [7.3, 263, 77, 64],
  "emma-2009": [8.1, 19],
  "emperor": [7.4, 251, 86, 70],
  "empire": [8.7, 1514, 93, 82],
  "encanto": [7.2, 299, 92, 75],
  "enchanted": [7.1, 226, 93, 75],
  "end-of-watch-2012": [7.6, 294, 85, 68],
  "endgame": [8.4, 1463, 94, 78],
  "endless-poetry-2016": [7.5, 7, 93, 78],
  "enemy-at-the-gates-2001": [7.5, 295, 54, 53],
  "ennio-2021": [8.2, 8],
  "enola": [6.7, 252, 91, 68],
  "enter-the-void-2009": [7.2, 95, 73, 69],
  "epic-elvis-presley-in-concert-2025": [8.1, 6],
  "erastour": [8.0, 26, 99, 82],
  "erin-brockovich-2000": [7.5, 248, 85, 73],
  "ernest-celestine-2012": [7.8, 25, 98, 86],
  "esteros-2016": [7.0, 6, 100],
  "et": [7.9, 474, 99, 92],
  "eternalsunshine": [8.3, 1189, 93, 89],
  "euphoria-2019": [8.1, 319, 87, 70],
  "eureka-2000": [7.7, 5, 91, 79],
  "eva31": [8.0, 19, 100, 85],
  "even-if-this-love-disappears-from--2025": [7.5, 4],
  "even-the-rain-2010": [7.4, 16, 87, 69],
  "everybody-s-famous-2000": [6.9, 3, 55, 60],
  "ex-drummer-2007": [6.9, 12, 44, 36],
  "exit-through-the-gift-shop-2010": [7.9, 70, 96, 85],
  "exmachina": [7.7, 643, 92, 78],
  "exterior-night-2022": [7.7, 2],
  "extreme-job-2019": [7.1, 16, 83],
  "eye-in-the-sky-2015": [7.3, 96, 95, 73],
  "eyes-wide-open-2009": [7.3, 7, 86, 70],
  "f1": [7.6, 378, 82, 68],
  "faces-places-2017": [7.8, 14, 99, 94],
  "facing-windows-2003": [7.2, 12],
  "fahrenheit-9-11-2004": [7.5, 135, 82, 67],
  "failan-2001": [7.5, 7],
  "falcon-lake-2022": [7.0, 4],
  "fallout": [8.3, 399],
  "family-business-2019": [7.4, 6],
  "fantastic-mr-fox-2009": [7.9, 308, 93, 83],
  "fantasticbeasts": [7.2, 543, 74, 66],
  "far-from-men-2014": [7.2, 10, 84],
  "farewell-mr-haffmann-2021": [7.1, 4],
  "farfromhome": [7.3, 649, 91, 69],
  "fargo": [8.8, 472],
  "farscape-the-peacekeeper-wars-2004": [8.2, 18, 60],
  "fatherland-2026": [7.1, 1],
  "faultstars": [7.6, 426, 81, 69],
  "fear-and-trembling-2003": [7.0, 5, 91],
  "federer-twelve-final-days-2024": [7.3, 5],
  "fellow-travelers-2023": [8.2, 19],
  "femme-2023": [7.3, 9],
  "ferdinand": [6.7, 72, 70, 58],
  "ferris": [7.8, 419, 83, 61],
  "fewgoodmen": [7.8, 319, 84, 62],
  "fightclub": [8.8, 2635, 81, 67],
  "filth-2013": [7.0, 123, 66, 56],
  "finding-neverland-2004": [7.6, 218, 83, 67],
  "fingersmith-2005": [7.8, 10],
  "fire-of-love-2022": [7.6, 17, 99, 83],
  "firstlove": [8.4, 7],
  "fish-tank-2009": [7.3, 69, 91, 81],
  "fivecm": [7.4, 72],
  "fjord-2026": [8.3, 1],
  "flame-citron-2008": [7.2, 21, 86, 74],
  "flee-2021": [7.9, 21, 98, 91],
  "fleishman-is-in-trouble-2022": [7.7, 20, 87, 79],
  "flipped-2010": [7.6, 109, 54, 45],
  "flow": [7.8, 151, 97, 87],
  "flowermoon": [7.5, 310, 93, 89],
  "flying-colors-2015": [7.3, 5],
  "food-inc-2008": [7.8, 53, 95, 80],
  "for-life-2020": [7.6, 10],
  "for-sama-2019": [8.5, 14, 98, 89],
  "for-you-in-full-blossom-ikemen-par-2007": [7.9, 2],
  "force-majeure-2014": [7.2, 73, 94, 87],
  "forceawakens": [7.7, 1031, 93, 80],
  "fordferrari": [8.1, 579, 92, 81],
  "forgotten-2017": [7.4, 63],
  "forrest": [8.8, 2514, 75, 82],
  "four-daughters-2023": [7.4, 5, 96, 80],
  "four-lions-2010": [7.3, 92, 84, 68],
  "frantz-2016": [7.5, 19, 91, 73],
  "freaky": [6.4, 179, 88, 70],
  "free-solo-2018": [8.1, 88, 97],
  "freedom-writers-2007": [7.6, 93, 69, 64],
  "freeguy": [7.1, 493, 80, 62],
  "freewilly": [6.1, 90, 71, 79],
  "frenzy-2015": [7.1, 5],
  "friend-2001": [7.2, 6],
  "friends": [8.8, 1200],
  "frieren": [8.9, 81],
  "frost-nixon-2008": [7.6, 116, 93, 80],
  "frozen": [7.4, 718, 89, 75],
  "frozen2": [6.8, 221, 77, 64],
  "fruitvale-station-2013": [7.5, 93, 94, 85],
  "full-time-2021": [7.4, 7, 98, 83],
  "furiosa": [7.4, 324, 90, 79],
  "fury-2014": [7.6, 614, 76, 64],
  "futurama-bender-s-big-score-2007": [7.6, 36, 100],
  "gabby": [5.4, 3, 85, 46],
  "galaxyquest": [7.4, 193, 90, 70],
  "gangs-of-new-york-2002": [7.5, 508, 72, 72],
  "gantz-o-2016": [7.1, 18],
  "generation-kill-2008": [8.4, 65],
  "getout": [7.8, 828, 98, 85],
  "gett-2014": [7.7, 7, 100, 90],
  "ghost-in-the-shell-stand-alone-com-2002": [8.5, 23],
  "ghostbusters": [7.8, 488, 95, 71],
  "gifted-2017": [7.6, 161, 73, 60],
  "gilmore": [8.2, 175],
  "girl-2018": [7.2, 18, 83, 73],
  "girl-you-know-it-s-true-2023": [7.1, 5, 85],
  "girlleapt": [7.6, 76, 84],
  "girls-will-be-girls-2024": [7.0, 4, 100, 80],
  "gits": [7.9, 175, 95, 76],
  "gladiator": [8.5, 1865, 80, 67],
  "gladiator2": [6.4, 306, 70, 64],
  "glassonion": [7.1, 529, 92, 81],
  "god-s-own-country-2017": [7.6, 42, 98, 85],
  "godfather": [9.2, 2240, 97, 100],
  "godfather2": [9.0, 1503, 96, 90],
  "godland-2022": [7.1, 10, 91, 81],
  "godzillaminus": [7.6, 228, 98, 81],
  "going-clear-scientology-the-prison-2015": [8.0, 43, 95, 80],
  "gone-baby-gone-2007": [7.6, 312, 94, 72],
  "gonegirl": [8.1, 1179, 88, 79],
  "good-luck-to-you-leo-grande-2022": [7.2, 45, 93, 78],
  "good-night-and-good-luck-2005": [7.4, 105, 93, 80],
  "goodbye-bafana-2007": [7.1, 13, 44],
  "gooddino": [6.7, 141, 76, 66],
  "goodfellas": [8.7, 1402, 93, 92],
  "goodplace": [8.2, 223],
  "goodwill": [8.4, 1229, 97, 71],
  "goonies": [7.7, 329, 76, 62],
  "got": [9.2, 2639],
  "gotg": [8.0, 1372, 91, 76],
  "gotham-2014": [7.8, 252],
  "graduation-2016": [7.3, 16, 95],
  "gran-torino-2008": [8.1, 866, 81, 73],
  "gran-turismo-2023": [7.1, 137, 65, 48],
  "grandbudapest": [8.1, 979, 92, 88],
  "gravity": [7.7, 903, 96, 96],
  "great-expectations-2011": [7.5, 9],
  "greenbook": [8.2, 695, 77, 69],
  "grenfell-uncovered-2025": [7.4, 3],
  "grinch": [6.4, 115, 59, 51],
  "grizzly-man-2005": [7.7, 68, 92, 87],
  "guardians-of-the-galaxy-vol-2-2017": [7.6, 836, 85, 67],
  "guardians-of-the-galaxy-vol-3-2023": [7.9, 478, 82, 64],
  "guillermo-del-toro-s-pinocchio-2022": [7.6, 166, 96, 79],
  "gxk": [6.0, 137, 54, 47],
  "hachi-a-dog-s-tale-2009": [8.1, 346, 64],
  "hacksaw-ridge-2016": [8.1, 689, 84, 71],
  "haikyu": [7.8, 8],
  "hamilton": [8.3, 141, 98, 88],
  "hamnet-2025": [7.8, 126, 86],
  "hana-alice-2004": [7.2, 5],
  "handmaiden": [8.1, 206, 96, 85],
  "hangover": [7.7, 937, 79, 73],
  "hannah-arendt-2012": [7.1, 13, 88, 69],
  "happening-2021": [7.4, 14, 99, 86],
  "happy-as-lazzaro-2018": [7.5, 23, 91],
  "happy-hour-2015": [7.6, 3],
  "happyfeet": [6.4, 215, 76, 77],
  "hara-kiri-death-of-a-samurai-2011": [7.3, 10, 76],
  "harrison-s-flowers-2000": [7.0, 7, 49],
  "harry-brown-2009": [7.2, 95, 63, 55],
  "harry-potter-and-the-chamber-of-se-2002": [7.5, 771, 82, 63],
  "harry-potter-and-the-deathly-hallo-2010": [7.7, 670, 77, 65],
  "harry-potter-and-the-deathly-hallo-2011": [8.1, 1054, 96, 85],
  "harry-potter-and-the-half-blood-pr-2009": [7.6, 665, 83, 78],
  "harry-potter-and-the-order-of-the--2007": [7.5, 706, 78, 71],
  "hatfields-mccoys-2012": [7.9, 31],
  "he-loves-me-he-loves-me-not-2002": [7.1, 20, 71, 63],
  "hear-me-our-summer-2024": [7.5, 2],
  "hearts-on-fire-2025": [7.2, 1],
  "heartstrings-2011": [7.1, 2],
  "heat": [8.3, 812, 84, 76],
  "heavy-trip-2018": [7.0, 13, 94, 72],
  "hedwig-and-the-angry-inch-2001": [7.7, 38, 92, 85],
  "hell-or-high-water-2016": [7.6, 280, 97, 88],
  "hello-ghost-2010": [7.5, 5],
  "hello-me-2021": [7.2, 1],
  "hello-monster-2015": [7.6, 2],
  "her": [8.0, 730, 94, 91],
  "hercules": [7.3, 282, 83, 74],
  "hereditary": [7.3, 464, 90, 87],
  "heron": [7.3, 150, 97, 91],
  "het-verhaal-van-vlaanderen-2023": [7.8, 0],
  "het-vonnis-2013": [7.1, 3],
  "hidden-kisses-2016": [7.3, 6],
  "hiddenfigures": [7.8, 292, 93, 74],
  "high-fidelity-2020": [7.7, 18],
  "highandlow": [8.4, 73, 97, 90],
  "himizu-2011": [7.1, 5, 95],
  "hitch": [6.6, 351, 69, 58],
  "hitchcock-truffaut-2015": [7.3, 8, 96],
  "hobbit": [7.8, 932, 64, 58],
  "hocus": [6.9, 173, 41, 43],
  "holes": [7.0, 111, 78, 71],
  "holy-cow-2024": [7.0, 5, 97, 83],
  "holy-motors-2012": [7.0, 52, 92, 85],
  "holy-spider-2022": [7.3, 32, 83, 66],
  "home-2008": [6.9, 5, 0, 67],
  "home-2009": [8.5, 23, 17, 47],
  "homealone": [7.8, 750, 67, 63],
  "homecoming": [7.4, 808, 92, 73],
  "honey-2010": [7.1, 8, 85, 70],
  "hope-2013": [8.2, 12],
  "horrible-histories-2009": [8.7, 7],
  "horton": [6.8, 159, 79, 71],
  "hot-fuzz-2007": [7.8, 570, 91, 81],
  "hotd": [8.3, 550],
  "hotel-beau-s-jour-2016": [7.6, 5],
  "hotel-mumbai-2018": [7.6, 80, 76, 62],
  "hotel-rwanda-2004": [8.1, 393, 91, 79],
  "hotelt": [7.1, 317, 45, 47],
  "house-of-hummingbird-2018": [7.4, 4, 100, 82],
  "house-of-sand-and-fog-2003": [7.5, 76, 74, 71],
  "how-to-train-your-dragon-2025": [7.7, 138, 78, 61],
  "howl": [8.2, 517, 88, 82],
  "howtolose": [6.6, 326, 42, 45],
  "hp1": [7.7, 958, 80, 65],
  "hp3": [7.9, 773, 91, 82],
  "hpgoblet": [7.7, 759, 88, 81],
  "httyd": [8.1, 902, 99, 75],
  "httyd2": [7.8, 405, 92, 77],
  "httyd3": [7.4, 181, 90, 71],
  "httydLA": [7.7, 138, 78, 61],
  "hugo-2011": [7.5, 350, 93, 83],
  "human-2015": [8.6, 9],
  "human-capital-2013": [7.2, 14, 81, 63],
  "hundreds-of-beavers-2022": [7.6, 17, 97, 82],
  "hunger": [7.2, 1088, 84, 68],
  "hunger-2008": [7.5, 77, 90, 82],
  "i-am-jonas-2018": [7.0, 7, 100],
  "i-am-not-your-negro-2016": [7.9, 25, 99, 95],
  "i-am-sam-2001": [7.6, 163, 36, 28],
  "i-daniel-blake-2016": [7.8, 69, 92, 78],
  "i-lost-my-body-2019": [7.5, 39, 96, 81],
  "i-m-not-a-robot-2023": [7.1, 4],
  "i-m-not-scared-2003": [7.4, 18, 90, 73],
  "i-m-still-here-2024": [8.1, 170, 97, 85],
  "i-saw-the-devil-2010": [7.8, 167, 81, 67],
  "i-swear-2025": [8.4, 54],
  "i-tonya-2017": [7.5, 263, 90, 77],
  "i-ve-loved-you-so-long-2008": [7.6, 21, 88, 79],
  "i-wish-2011": [7.4, 9, 94, 80],
  "icarus-2017": [7.9, 58, 92],
  "iceage": [7.5, 569, 77, 61],
  "ida-2013": [7.4, 63, 95, 91],
  "ikiru": [8.3, 103, 98, 92],
  "il-divo-2008": [7.2, 21, 92, 81],
  "il-mare-2000": [7.5, 10],
  "import-export-2007": [7.0, 7],
  "in-america-2002": [7.6, 44, 89, 76],
  "in-between-2016": [7.3, 3, 98],
  "in-bloom-2013": [7.3, 7, 90, 72],
  "in-bruges-2008": [7.9, 496, 84, 67],
  "in-safe-hands-2018": [7.2, 3, 85],
  "in-syria-2017": [7.1, 3, 89],
  "in-the-fade-2017": [7.1, 38, 75, 65],
  "in-the-house-2012": [7.3, 36, 88, 72],
  "in-the-loop-2009": [7.4, 64, 94, 83],
  "in-the-mood-for-love-2000": [8.0, 190, 92, 87],
  "incendies-2010": [8.3, 255, 91, 80],
  "inception": [8.8, 2841, 87, 74],
  "incredibles": [8.0, 909, 97, 90],
  "incredibles2": [7.5, 374, 93, 80],
  "indiana": [8.4, 1115, 94, 86],
  "infinitywar": [8.4, 1388, 85, 68],
  "informer-2018": [7.8, 7],
  "inglourious": [8.4, 1802, 89, 69],
  "inhuman-resources-2020": [7.2, 5],
  "innocent-witness-2019": [7.4, 3],
  "inside-job-2010": [8.2, 83, 98, 88],
  "inside-llewyn-davis-2013": [7.4, 173, 92, 93],
  "inside-man-2006": [7.6, 427, 86, 76],
  "insideout": [8.1, 925, 98, 94],
  "insideout2": [7.5, 256, 90, 73],
  "intern": [7.1, 312, 59, 51],
  "interstate-60-2002": [7.5, 41],
  "interstella-5555-the-5tory-of-the--2003": [7.8, 18, 80],
  "interstellar": [8.7, 2568, 73, 74],
  "into-the-wild-2007": [8.0, 698, 83, 73],
  "intouchables": [8.5, 1035, 76, 57],
  "io-capitano-2023": [7.6, 18, 96, 79],
  "irina-palm-2007": [7.2, 8, 67, 55],
  "irongiant": [8.1, 263, 96, 85],
  "ironman": [7.9, 1234, 94, 79],
  "irreversible-2002": [7.3, 164, 59, 51],
  "isle-of-dogs-2018": [7.8, 213, 90, 82],
  "it": [7.3, 703, 85, 69],
  "it-was-just-an-accident-2025": [7.4, 38, 98, 92],
  "italianjob": [7.0, 409, 72, 68],
  "ixcanul-2015": [7.1, 3, 97, 83],
  "j-hope-in-the-box-2023": [8.4, 3],
  "jack-and-the-cuckoo-clock-heart-2013": [6.9, 8, 83],
  "jane-eyre-2006": [8.3, 24],
  "jaws": [8.1, 744, 97, 87],
  "jcvd-2008": [7.0, 41, 84, 64],
  "jim-andy-the-great-beyond-2017": [7.6, 29, 92],
  "jim-queen-2026": [7.6, 1],
  "jiro-dreams-of-sushi-2011": [7.8, 40, 99, 77],
  "jjk0": [7.8, 65],
  "jjkseries": [8.5, 215],
  "jodorowsky-s-dune-2013": [8.0, 29, 98, 79],
  "john-candy-i-like-me-2025": [8.0, 12],
  "john-rabe-2009": [7.2, 7, 74, 57],
  "johnwick": [7.5, 834, 86, 68],
  "johnwick4": [7.6, 416, 94, 78],
  "joint-security-area-2000": [7.7, 39, 88, 58],
  "jojo-rabbit-2019": [7.9, 491, 80, 58],
  "joker": [8.3, 1709, 68, 59],
  "josep-2020": [7.3, 2, 100],
  "joyeux-noel-2005": [7.6, 34, 74, 70],
  "julia-2008": [7.0, 7, 73, 62],
  "jumanji": [7.1, 416, 55, 39],
  "jumanji2": [6.9, 507, 77, 58],
  "jung-kook-i-am-still-2024": [8.2, 8],
  "junglebook": [7.6, 215, 86, 65],
  "junglebook16": [7.3, 307, 94, 77],
  "junk-head-2017": [7.3, 2],
  "junkyard-dog-2023": [7.0, 4],
  "juno": [7.4, 574, 93, 81],
  "jurassic": [8.2, 1189, 92, 68],
  "just-an-illusion-2026": [7.4, 1],
  "just-mercy-2019": [7.6, 85, 85],
  "justice-league-dark-apokolips-war-2020": [7.7, 30, 100],
  "justice-league-the-flashpoint-para-2013": [8.1, 66, 100],
  "jworld": [6.9, 734, 72, 59],
  "kabaneri-of-the-iron-fortress-2016": [7.2, 8],
  "kahlil-gibran-s-the-prophet-2014": [7.1, 5, 66],
  "kakegurui-2017": [7.1, 18],
  "kalinka-2016": [7.1, 4],
  "kamikaze-girls-2004": [7.2, 9, 0, 56],
  "karatekid": [6.3, 229, 66, 61],
  "kfp": [7.6, 586, 87, 74],
  "kfp4": [6.3, 84, 71, 54],
  "kick-ass-2010": [7.6, 623, 77, 66],
  "kidnapped-the-abduction-of-edgardo-2023": [7.0, 5, 86, 75],
  "kiki": [7.8, 190, 98, 85],
  "kill-bill-the-whole-bloody-affair-2004": [8.7, 50],
  "kill-bill-vol-2-2004": [8.0, 875, 84, 83],
  "killbill": [8.2, 1316, 85, 69],
  "killing-eve-2018": [8.0, 155],
  "kim-ji-young-born-1982-2019": [7.3, 5],
  "kimetsu": [8.5, 232],
  "king-of-devil-s-island-2010": [7.4, 21, 94],
  "king-richard-2021": [7.5, 193, 90, 76],
  "kingdom-2014": [8.5, 21],
  "kingdom-4-return-of-the-great-gene-2024": [7.2, 2],
  "kings-and-queen-2004": [7.0, 4, 87, 85],
  "kingsman": [7.7, 781, 75, 60],
  "kizumonogatari-part-2-nekketsu-2016": [7.6, 4],
  "kizumonogatari-part-3-reiketsu-2017": [7.9, 5],
  "klaus": [8.2, 240, 95, 65],
  "kneecap-2024": [7.6, 26, 96, 76],
  "knives": [7.9, 884, 97, 82],
  "kokuho-2025": [7.5, 6],
  "kongskull": [6.7, 377, 75, 62],
  "kpop": [7.4, 139, 92, 77],
  "kubo": [7.7, 148, 97, 84],
  "kubrick-by-kubrick-2020": [7.1, 3, 82],
  "la-belle-poque-2019": [7.4, 22, 90, 75],
  "la-chimera-2023": [7.3, 23, 94, 91],
  "la-civil-2021": [7.2, 2],
  "la-mante-2017": [7.4, 15],
  "la-vie-en-rose-2007": [7.5, 94, 74, 66],
  "ladybird": [7.4, 366, 99, 93],
  "ladytramp": [7.3, 163, 93, 78],
  "lalaland": [8.0, 770, 91, 94],
  "last-breath-2019": [7.6, 9, 93],
  "last-life-in-the-universe-2003": [7.4, 12, 90, 73],
  "last-stop-174-2008": [7.1, 6],
  "lastdance": [9.0, 182],
  "lastman-2016": [8.4, 2],
  "lastofus": [8.4, 744, 96, 84],
  "laurence-anyways-2012": [7.6, 23, 84, 73],
  "lawless-lawyer-2018": [7.6, 3],
  "layer-cake-2004": [7.2, 209, 80, 73],
  "le-havre-2011": [7.2, 25, 99, 82],
  "left-handed-girl-2025": [7.3, 9],
  "legallyblonde": [6.5, 290, 72, 59],
  "lego": [7.7, 419, 96, 83],
  "legobatman": [7.3, 196, 89, 75],
  "lemon-tree-2008": [7.3, 7, 91, 74],
  "leo": [7.2, 74],
  "les-lyonnais-2011": [6.9, 9, 50],
  "les-mis-rables-2000": [7.6, 5],
  "les-mis-rables-2019": [7.6, 31, 88, 78],
  "lesmis": [7.5, 364, 70, 63],
  "let-me-eat-your-pancreas-2017": [7.1, 4],
  "letters-from-iwo-jima-2006": [7.8, 178, 91, 89],
  "li-l-quinquin-2014": [7.3, 3, 100],
  "lie-with-me-2022": [7.5, 4],
  "life-is-a-miracle-2004": [7.5, 14, 60],
  "life-of-pi-2012": [7.9, 703, 86, 79],
  "lifeisbeautiful": [8.6, 817, 81, 58],
  "lightyear": [6.1, 138, 74, 60],
  "like-crazy-2016": [7.1, 11, 84],
  "like-father-like-son-2013": [7.8, 31, 87, 73],
  "like-someone-in-love-2012": [7.0, 14, 83],
  "lilo": [7.4, 246, 87, 74],
  "liloLA": [6.7, 97, 72, 53],
  "limitless-2015": [7.6, 75],
  "linda-linda-linda-2005": [7.5, 6, 86],
  "lion-2016": [8.0, 268, 85, 69],
  "lionking": [8.5, 1268, 92, 88],
  "little-am-lie-or-the-character-of--2025": [7.6, 6],
  "little-children-2006": [7.5, 122, 81, 75],
  "little-forest-2018": [7.3, 5],
  "little-nicholas-2009": [7.1, 15, 60],
  "little-otik-2000": [7.3, 7, 84],
  "little-white-lies-2010": [7.1, 28, 42, 50],
  "little-women-2019": [7.7, 286, 95, 91],
  "littlemiss": [7.8, 562, 91, 80],
  "live-and-become-2005": [7.8, 7, 88],
  "living-2022": [7.2, 40, 94, 81],
  "loft-2008": [7.2, 26],
  "logan": [8.1, 933, 93, 77],
  "loki": [8.2, 477],
  "lone-survivor-2013": [7.5, 325, 75, 60],
  "long-day-s-journey-into-night-2018": [7.1, 11, 93],
  "long-way-north-2015": [7.2, 4, 98],
  "lookback": [7.8, 23],
  "looking-for-alaska-2019": [8.0, 17],
  "looking-for-eric-2009": [7.1, 19, 85, 66],
  "lorax": [6.4, 145, 53, 46],
  "lord-of-war-2005": [7.6, 361, 62, 62],
  "lorna-s-silence-2008": [7.1, 9, 85, 80],
  "lost-illusions-2021": [7.4, 8, 93, 81],
  "lost-in-austen-2008": [7.3, 12],
  "lost-in-translation-2003": [7.7, 532, 95, 91],
  "lotr1": [8.9, 2221, 91, 92],
  "lotr3": [9.0, 2178, 94, 94],
  "louis-theroux-the-settlers-2025": [8.2, 3],
  "love-according-to-dalva-2022": [7.3, 2],
  "love-and-honor-2006": [7.7, 5, 81],
  "love-at-second-sight-2019": [6.9, 7, 50],
  "love-exposure-2008": [8.0, 18, 90, 78],
  "love-in-the-big-city-2024": [7.4, 3],
  "love-me-if-you-dare-2003": [7.5, 74, 44, 45],
  "love-simon-2018": [7.5, 135, 92, 72],
  "love-songs-2007": [7.0, 11, 61, 70],
  "love-untangled-2025": [7.1, 5],
  "love-victor-2020": [7.9, 25],
  "loveactually": [7.5, 582, 64, 55],
  "loveless-2017": [7.6, 38, 94, 86],
  "loving-vincent-2017": [7.8, 69, 84, 62],
  "luca": [7.4, 226, 91, 71],
  "luck": [6.5, 36, 49, 48],
  "lucky-number-slevin-2006": [7.7, 340, 52, 53],
  "lust-caution-2007": [7.5, 48, 73, 61],
  "m3gan": [6.3, 183, 93, 72],
  "macadam-stories-2015": [7.0, 4],
  "machuca-2004": [7.7, 13, 87, 76],
  "madagascar": [7.0, 484, 55, 57],
  "madmax": [8.1, 1213, 97, 90],
  "magic-candies-2024": [7.1, 1],
  "magical-girl-2014": [7.2, 8, 100],
  "maleficent": [6.9, 426, 54, 56],
  "mammamia": [6.5, 309, 55, 51],
  "man-on-fire-2004": [7.7, 424, 39, 47],
  "man-on-the-train-2002": [7.1, 8, 92, 75],
  "man-on-wire-2008": [7.7, 61, 100, 89],
  "manchester-by-the-sea-2016": [7.8, 360, 96, 96],
  "mandalorian": [8.6, 661, 90, 71],
  "manderlay-2005": [7.2, 27, 50, 46],
  "maquia": [7.4, 11, 100, 72],
  "marcel-the-shell-with-shoes-on-2021": [7.6, 34, 98, 80],
  "march-of-the-penguins-2005": [7.5, 62, 94, 79],
  "marguerite-2015": [6.9, 6, 95, 76],
  "marina-2013": [7.2, 4],
  "mario": [7.0, 299, 59, 46],
  "marnie": [7.6, 56, 92, 72],
  "marriage-story-2019": [7.9, 374, 95, 94],
  "mars-express-2023": [7.5, 15, 100, 76],
  "martian": [8.0, 1021, 91, 80],
  "martin-eden-2019": [7.0, 9, 87, 75],
  "marty-supreme-2025": [7.6, 203, 94],
  "martyrs-2008": [7.0, 122, 64],
  "maryp": [7.8, 200, 97, 88],
  "masaan-2015": [8.1, 36, 92],
  "masquerade-2012": [7.8, 8, 100],
  "mass-2021": [7.5, 20, 95, 81],
  "master-and-commander-the-far-side--2003": [7.5, 258, 85, 81],
  "masters-of-sex-2013": [7.9, 40],
  "match-point-2005": [7.6, 240, 76, 72],
  "matilda": [7.0, 197, 92, 72],
  "matildamus": [7.0, 34, 92],
  "matrix": [8.7, 2262, 83, 73],
  "mazerunner": [6.8, 567, 65, 57],
  "me-and-earl-and-the-dying-girl-2015": [7.7, 145, 81, 74],
  "meangirls": [7.1, 489, 84, 66],
  "meetrobinsons": [6.8, 123, 68, 61],
  "meg": [5.7, 230, 47, 46],
  "megamind": [7.3, 328, 73, 63],
  "melancholia-2011": [7.1, 209, 80, 81],
  "memento": [8.4, 1446, 94, 83],
  "memoir-of-a-murderer-2017": [7.2, 15],
  "memories-of-matsuko-2006": [7.8, 10],
  "memories-of-murder-2003": [8.1, 271, 95, 82],
  "memories-of-the-alhambra-2018": [7.7, 8],
  "memory-lane-2024": [7.4, 2],
  "mermaid": [7.6, 314, 92, 88],
  "mesrine-killer-instinct-2008": [7.5, 37, 82, 71],
  "mesrine-public-enemy-no-1-2008": [7.4, 33, 81, 72],
  "messiah-2020": [7.6, 50],
  "mha": [8.2, 124],
  "mib": [7.3, 668, 91, 72],
  "micmacs-2009": [7.1, 32, 72, 62],
  "microhabitat-2017": [7.4, 4],
  "midnight-diner-2009": [8.6, 4],
  "midnight-in-paris-2011": [7.6, 473, 93, 81],
  "midnight-runners-2017": [7.3, 12],
  "midnight-sun-2016": [7.4, 6],
  "mifallout": [7.7, 422, 97, 87],
  "migration": [6.6, 48, 73, 56],
  "mildred-pierce-2011": [7.6, 26],
  "milk-2008": [7.5, 187, 93, 83],
  "million-dollar-baby-2004": [8.1, 770, 90, 86],
  "mindhunter": [8.6, 401],
  "minecraft": [5.6, 164, 47, 45],
  "minions": [6.4, 288, 55, 56],
  "minions2": [6.5, 108, 70, 56],
  "minority-report-2002": [7.6, 624, 89, 80],
  "minuscule-valley-of-the-lost-ants-2013": [7.1, 10, 90],
  "miracle-2004": [7.5, 64, 81, 68],
  "miracle-in-cell-no-7-2013": [8.1, 26],
  "mirai": [7.0, 20, 91, 81],
  "miss-granny-2014": [7.2, 5],
  "miss-sloane-2016": [7.5, 89, 76, 64],
  "mission-impossible-dead-reckoning--2023": [7.6, 330, 96, 81],
  "mitchells": [7.6, 144, 97, 81],
  "moana": [7.6, 447, 95, 81],
  "moana2": [6.3, 128, 61, 58],
  "modernfamily": [8.5, 544],
  "modigliani-2004": [7.2, 13, 4],
  "moli-re-2007": [7.1, 7, 69, 59],
  "mondays-in-the-sun-2002": [7.5, 17, 80, 64],
  "moneyball": [7.6, 513, 94, 87],
  "moneyheist": [8.2, 614, 92],
  "mononoke": [8.3, 487, 93, 76],
  "monsieur-aznavour-2024": [7.2, 5],
  "monsieur-ibrahim-2003": [7.3, 12, 85, 69],
  "monsoon-wedding-2001": [7.3, 27, 95, 77],
  "monster-2023": [7.8, 43, 96, 79],
  "monstersinc": [8.1, 1083, 96, 79],
  "monstersu": [7.2, 428, 80, 65],
  "montage-2013": [7.4, 9],
  "moolaad-2003": [7.6, 4, 99],
  "moon-2009": [7.8, 397, 90, 67],
  "moonage-daydream-2022": [7.6, 17],
  "moonrise-kingdom-2012": [7.7, 384, 93, 84],
  "moscow-belgium-2008": [7.2, 4, 93],
  "mother-2009": [7.7, 81, 96, 79],
  "moulin-rouge-2001": [7.5, 316, 75, 66],
  "mr-church-2016": [7.6, 34, 24, 37],
  "mr-mme-adelman-2017": [7.3, 6],
  "mr-nobody-2009": [7.7, 259, 67, 63],
  "mrs-america-2020": [7.8, 15],
  "mrs-harris-goes-to-paris-2022": [7.1, 38, 94, 70],
  "mrs-wilson-2018": [7.4, 10],
  "mrsdoubtfire": [7.1, 318, 70, 54],
  "mufasa": [6.6, 84, 56, 56],
  "mugentrain": [8.2, 102, 98, 72],
  "mulan": [7.7, 349, 91, 72],
  "mulholland-drive-2001": [7.9, 431, 84, 87],
  "mune-guardian-of-the-moon-2014": [7.1, 9, 80],
  "munich-2005": [7.5, 255, 78, 74],
  "murder-on-a-sunday-morning-2001": [7.9, 5],
  "murderorient": [6.5, 323, 60, 52],
  "mustang-2015": [7.6, 43, 97, 83],
  "my-afternoons-with-margueritte-2010": [7.2, 8, 85, 59],
  "my-annoying-brother-2016": [7.3, 5],
  "my-brilliant-friend-2018": [8.6, 23],
  "my-brother-is-an-only-child-2007": [7.0, 7, 84, 71],
  "my-father-s-shadow-2025": [7.3, 2],
  "my-favourite-cake-2024": [7.4, 10, 100],
  "my-first-first-love-2019": [7.4, 4],
  "my-happy-family-2017": [7.4, 5, 100],
  "my-holo-love-2020": [7.6, 5],
  "my-king-2015": [7.1, 15, 0, 68],
  "my-life-as-a-zucchini-2016": [7.8, 33, 99, 85],
  "my-lovely-liar-2023": [7.3, 4],
  "my-mom-jayne-2025": [8.3, 5],
  "my-name-is-khan-2010": [7.9, 124, 83, 50],
  "my-sailor-my-love-2022": [7.1, 2],
  "my-sassy-girl-2001": [7.9, 53],
  "my-tomorrow-your-yesterday-2016": [7.4, 6],
  "my-way-2011": [7.6, 14, 21, 30],
  "mysterious-skin-2004": [7.6, 86, 85, 74],
  "mystic-river-2003": [7.9, 526, 89, 84],
  "napol-on-2002": [7.3, 6],
  "narcos": [8.7, 532],
  "narcos-mexico-2018": [8.3, 102],
  "narnia": [6.9, 460, 75, 75],
  "naruto-shippuden-the-movie-blood-p-2011": [7.1, 7],
  "nationaltreasure": [6.9, 380, 46, 40],
  "natm": [6.5, 413, 42, 48],
  "nausicaa": [8.0, 198, 91, 86],
  "navalny-2022": [7.8, 69, 99, 82],
  "nebraska-2013": [7.7, 129, 90, 86],
  "nemesis-2024": [7.1, 1],
  "nemo": [8.2, 1217, 99, 90],
  "new-world-2013": [7.5, 29, 0, 58],
  "next-sohee-2022": [7.2, 2],
  "niet-schieten-2018": [7.6, 2],
  "night-on-earth-2020": [8.1, 5],
  "nightcrawler-2014": [7.8, 675, 95, 76],
  "nightmarebc": [7.9, 413, 95, 82],
  "nimona": [7.5, 63, 92, 75],
  "no-2012": [7.4, 27, 93, 81],
  "no-dogs-or-italians-allowed-2022": [7.3, 3],
  "no-man-s-land-2001": [7.9, 51, 93, 84],
  "no-man-s-land-2020": [7.8, 5],
  "no-mercy-2010": [7.4, 11],
  "no-other-choice-2025": [7.5, 70, 100],
  "nobody-knows-2004": [8.0, 36, 93, 88],
  "nocountry": [8.2, 1202, 93, 92],
  "north-sea-texas-2011": [7.1, 11, 83, 63],
  "north-south-2004": [8.5, 38],
  "nosferatu": [7.1, 271, 84, 78],
  "nostalgia-for-the-light-2010": [7.6, 7, 100],
  "notebook": [7.8, 696, 54, 53],
  "notes-on-a-scandal-2006": [7.4, 90, 87, 73],
  "nottinghill": [7.2, 388, 84, 68],
  "nouvelle-vague-2025": [7.3, 12, 91, 71],
  "now-you-see-me-2013": [7.2, 775, 50, 50],
  "nowayhome": [8.1, 1037, 93, 71],
  "nowhere-special-2020": [7.4, 10, 100],
  "nymphomaniac-vol-i-2013": [6.9, 139, 76],
  "o-brother-where-art-thou-2000": [7.7, 354, 78, 69],
  "o-j-made-in-america-2016": [8.9, 24, 100, 96],
  "oasis-2002": [7.8, 12, 90, 79],
  "oasis-2017": [7.9, 6],
  "oasis-supersonic-2016": [7.8, 14, 84],
  "obsession-2025": [7.9, 264],
  "ocean-with-david-attenborough-2025": [8.4, 6],
  "oceans": [7.7, 678, 83, 74],
  "oceans-2008": [7.7, 10, 80, 75],
  "ode-to-my-father-2014": [7.8, 7, 75],
  "odyssey": [8.5, 233, 94, 89],
  "of-gods-and-men-2010": [7.2, 17, 92, 86],
  "office": [9.0, 841],
  "old-fox-2023": [7.2, 1],
  "oldboy": [8.3, 726, 82, 78],
  "olive-kitteridge-2014": [8.3, 30],
  "on-your-wedding-day-2018": [7.1, 5],
  "once-upon-a-time-in-hollywood-2019": [7.6, 970, 85, 84],
  "one-cut-of-the-dead-2017": [7.6, 36, 100, 86],
  "one-day-at-a-time-2017": [8.1, 20],
  "one-life-2023": [7.5, 41, 90, 69],
  "one-ordinary-day-2021": [8.0, 4],
  "onebattle": [7.6, 429, 94, 95],
  "onepiecelive": [8.3, 209],
  "onepiecered": [6.7, 27],
  "only-lovers-left-alive-2013": [7.2, 116, 86, 79],
  "only-the-animals-2019": [7.1, 9, 93, 69],
  "only-the-brave-2017": [7.6, 93, 87, 72],
  "onlymurders": [8.0, 205],
  "onlyyesterday": [7.6, 43, 100, 90],
  "onoda-10-000-nights-in-the-jungle-2021": [7.2, 3, 97, 78],
  "onward": [7.4, 188, 88, 61],
  "oppenheimer": [8.2, 1071, 93, 90],
  "ordeal-by-innocence-2018": [7.2, 13],
  "orphan-2009": [7.0, 279, 59, 42],
  "osama-2003": [7.3, 10, 96, 83],
  "oss-117-cairo-nest-of-spies-2006": [7.0, 25, 77, 62],
  "our-little-sister-2015": [7.6, 19, 94, 75],
  "over-the-garden-wall-2014": [8.7, 91],
  "overhedge": [6.7, 205, 75],
  "ozark": [8.4, 396],
  "pachinko": [8.4, 18],
  "pacificrim": [6.9, 562, 72, 65],
  "paddington": [7.3, 158, 97, 77],
  "paddington2": [7.8, 115, 99, 88],
  "paddington3": [6.6, 36, 93, 65],
  "pain-and-glory-2019": [7.5, 67, 96, 87],
  "palestine-36-2025": [7.5, 7],
  "pamfir-2022": [7.4, 4],
  "paperman-2012": [8.2, 37],
  "papicha-2019": [7.1, 4, 87],
  "paprika": [7.7, 115, 87, 81],
  "paradise-love-2012": [7.0, 11, 78, 65],
  "paradise-now-2005": [7.4, 25, 89, 71],
  "paranorman": [7.0, 118, 89, 72],
  "parasite": [8.5, 1180, 99, 97],
  "parenttrap": [6.7, 175, 87, 63],
  "paris-05-59-th-o-hugo-2016": [7.0, 5, 92, 74],
  "paris-13th-district-2021": [7.0, 12, 83, 76],
  "paris-je-t-aime-2006": [7.2, 77, 86, 66],
  "parks": [8.6, 317],
  "parlement-2020": [7.7, 1],
  "pastlives": [7.8, 176, 95, 94],
  "pawn-2020": [7.7, 2],
  "pawpatrol": [6.1, 10, 80, 50],
  "peakyblinders": [8.7, 785],
  "percy": [5.9, 217, 49, 47],
  "perfectblue": [8.0, 125, 80, 67],
  "perfectdays": [7.9, 109, 96, 80],
  "perfume-the-story-of-a-murderer-2006": [7.5, 280, 59, 56],
  "persepolis-2007": [8.0, 107, 96, 90],
  "peterpan": [7.2, 167, 78, 76],
  "peterrabbit": [6.6, 54, 64, 51],
  "petite-maman-2021": [7.3, 21, 97, 93],
  "pets": [6.5, 238, 71, 61],
  "pfrog": [7.2, 189, 86, 73],
  "philanthropy-2002": [8.4, 15],
  "philomena-2013": [7.6, 108, 91, 77],
  "phoenix-nights-2001": [8.6, 8],
  "pieta-2012": [7.1, 17, 73, 72],
  "pikachu": [6.5, 198, 68, 53],
  "pina-2011": [7.6, 17, 95, 83],
  "pinocchio": [7.4, 174, 100, 99],
  "pirate-radio-2009": [7.3, 121, 59, 58],
  "pirates": [8.1, 1335, 79, 63],
  "pitchperfect": [7.1, 353, 81, 66],
  "planetearth": [9.4, 176],
  "play-2011": [7.1, 7, 81, 81],
  "playground-2021": [7.3, 5, 100, 86],
  "pluribus": [7.9, 166],
  "poetry-2010": [7.8, 15, 100],
  "pokemon1": [6.4, 50, 16, 35],
  "polisse-2011": [7.3, 16, 87, 74],
  "ponyo": [7.6, 187, 91, 86],
  "poor-things-2023": [7.7, 419, 92, 88],
  "porco": [7.7, 118, 96, 83],
  "portrait-of-a-lady-on-fire-2019": [8.0, 129, 97, 95],
  "pressure-2026": [7.3, 17],
  "prestige": [8.5, 1605, 77, 66],
  "priceless-2006": [7.0, 34, 82, 72],
  "pride-2014": [7.8, 65, 92, 79],
  "prideprej": [7.8, 380, 87, 82],
  "primavera-2025": [7.1, 1],
  "princeegypt": [7.2, 164, 79, 64],
  "princessbride": [8.0, 489, 96, 78],
  "princessd": [6.4, 184, 49, 52],
  "prisoners": [8.2, 947, 81, 70],
  "project-hail-mary-2026": [8.2, 457],
  "promare": [7.0, 6, 97],
  "promise-at-dawn-2017": [7.1, 4],
  "promising-young-woman-2020": [7.5, 257, 90, 72],
  "proposal": [6.8, 401, 45, 48],
  "pulpfiction": [8.8, 2451, 92, 95],
  "puss2": [7.9, 228, 95, 73],
  "put-your-soul-on-your-hand-and-wal-2025": [7.5, 1, 98],
  "queen-charlotte-a-bridgerton-story-2023": [7.6, 79],
  "queensgambit": [8.5, 671],
  "quietplace": [7.5, 664, 96, 82],
  "quo-vadis-aida-2020": [8.0, 42, 100, 97],
  "r-m-n-2022": [7.2, 7, 96, 81],
  "race-2016": [7.1, 44, 63, 56],
  "ralph2": [7.0, 208, 88, 71],
  "rascal-does-not-dream-of-a-knapsac-2023": [7.8, 3],
  "rashomon": [8.1, 198, 98, 98],
  "ratatouille": [8.1, 955, 96, 96],
  "raw-2016": [6.9, 97, 92, 81],
  "ray-2004": [7.7, 167, 79, 73],
  "raya": [7.3, 189, 93, 74],
  "reacher": [8.0, 298],
  "read-my-lips-2001": [7.3, 16, 97, 82],
  "readyplayer": [7.4, 547, 72, 64],
  "reality-2014": [6.9, 8, 64],
  "realsteel": [7.1, 383, 60, 56],
  "rebel-2022": [7.3, 3, 90],
  "rectify-2013": [8.3, 29],
  "red-cliff-2008": [7.3, 51, 91, 73],
  "red-cliff-ii-2009": [7.5, 27],
  "religulous-2008": [7.6, 61, 69, 56],
  "remarkably-bright-creatures-2026": [7.7, 43, 83, 55],
  "remi-nobody-s-boy-2018": [7.1, 4],
  "rental-family-2025": [7.6, 62, 88],
  "requiem-for-a-dream-2000": [8.3, 979, 80, 71],
  "respiro-2002": [7.0, 5, 76],
  "return-to-seoul-2022": [6.9, 11, 97],
  "richard-jewell-2019": [7.5, 108, 77, 68],
  "ricky-gervais-humanity-2018": [8.0, 25],
  "ricky-gervais-supernature-2022": [7.6, 25],
  "riding-alone-for-thousands-of-mile-2005": [7.3, 6, 80, 73],
  "riding-giants-2004": [7.8, 5, 93, 80],
  "right-now-wrong-then-2015": [7.1, 6, 92, 81],
  "rio": [6.9, 276, 72, 63],
  "riphagen-2016": [7.1, 9],
  "rise-2022": [7.0, 4],
  "rise-of-the-planet-of-the-apes-2011": [7.6, 608, 82, 68],
  "riseguardians": [7.2, 211, 75, 58],
  "rivals-2024": [7.9, 20],
  "road-to-ninja-naruto-the-movie-2012": [7.6, 10],
  "road-to-perdition-2002": [7.6, 302, 81, 72],
  "robinhood": [7.5, 151, 58, 57],
  "robot-dreams-2023": [7.6, 25, 98, 87],
  "rocketman": [7.3, 211, 89, 69],
  "rocknrolla-2008": [7.2, 276, 60, 53],
  "rocky": [8.1, 695, 91, 70],
  "rogueone": [7.8, 761, 84, 65],
  "roma-2018": [7.6, 179, 96, 96],
  "romantics-anonymous-2010": [6.9, 13, 86, 69],
  "room-2015": [8.1, 482, 93, 86],
  "rory-o-shea-was-here-2004": [7.7, 17, 49, 59],
  "rrr": [7.8, 226, 93, 83],
  "ruby-quentin-2003": [7.1, 33],
  "rurouni-kenshin-final-chapter-part-2021": [7.4, 13],
  "rurouni-kenshin-part-i-origins-2012": [7.4, 32],
  "rurouni-kenshin-part-ii-kyoto-infe-2014": [7.5, 20],
  "rurouni-kenshin-the-legend-ends-2014": [7.5, 16],
  "rush-2013": [8.1, 563, 89, 74],
  "russian-ark-2002": [7.2, 23, 89, 87],
  "rust-and-bone-2012": [7.4, 73, 82, 73],
  "rye-lane-2023": [7.2, 16, 98, 83],
  "saint-seiya-the-hades-chapter-2002": [8.5, 4],
  "sakamoto": [7.5, 17],
  "salvation-2026": [7.0, 1],
  "samsara-2001": [7.7, 9, 100],
  "samsara-2011": [8.4, 40, 76, 65],
  "samurai-jack-2001": [8.5, 67],
  "santosh-2024": [7.1, 4, 100, 75],
  "sarah-s-key-2010": [7.5, 19, 72, 59],
  "sauvage-wild-2018": [7.1, 6, 93, 75],
  "save-the-green-planet-2003": [7.1, 12, 90, 70],
  "saving-mr-banks-2013": [7.5, 176, 79, 65],
  "savingryan": [8.6, 1651, 94, 91],
  "saw-2004": [7.6, 514, 49, 46],
  "scandal-2012": [7.7, 85],
  "scandal-makers-2008": [7.2, 5],
  "scenes-from-a-marriage-2021": [8.0, 34],
  "schindler": [9.0, 1594, 98, 95],
  "schitt": [8.5, 175],
  "school-2017-2017": [7.5, 3],
  "schoolrock": [7.2, 360, 92, 82],
  "scott-pilgrim-vs-the-world-2010": [7.5, 499, 83, 69],
  "se7en": [8.6, 2040, 84, 65],
  "seabeast": [7.0, 66, 94, 74],
  "searching-2018": [7.6, 194, 92, 71],
  "searching-for-sugar-man-2012": [8.2, 77, 95, 79],
  "seaspiracy-2021": [8.1, 36, 75],
  "secondhand-lions-2003": [7.5, 66, 60, 52],
  "secret-sunshine-2007": [7.5, 11, 94, 84],
  "secrets-of-the-saqqara-tomb-2020": [7.2, 8],
  "see-you-up-there-2017": [7.4, 12, 94],
  "selma-2014": [7.5, 99, 99, 79],
  "senna-2010": [8.4, 84, 93, 79],
  "sense-sensibility-2008": [8.0, 15],
  "sentimental-value-2025": [7.7, 85, 97, 86],
  "seraphine-2008": [7.4, 7, 88, 84],
  "serenity-2005": [7.8, 316, 82, 74],
  "serial-bad-weddings-2014": [7.0, 49],
  "seven-pounds-2008": [7.6, 327, 27, 36],
  "sevensamurai": [8.6, 404, 100, 98],
  "severance": [8.6, 398],
  "sex-and-luc-a-2001": [7.0, 41, 71, 65],
  "sex-education-2019": [8.2, 401],
  "sexy-beast-2000": [7.3, 76, 87, 79],
  "shame-2011": [7.2, 218, 79, 72],
  "shangchi": [7.3, 493, 92, 71],
  "shaun": [7.3, 47, 99],
  "shaun-of-the-dead-2004": [7.8, 642, 92, 76],
  "shaun-the-sheep-2007": [8.1, 20],
  "shawshank": [9.3, 3213, 89, 82],
  "sherlock": [9.0, 1094],
  "sherlock-holmes-2009": [7.5, 709, 69, 57],
  "shingodzilla": [6.9, 46, 86, 67],
  "shogun": [8.6, 249],
  "shooting-dogs-2005": [7.6, 12, 84, 71],
  "shoplifters": [7.9, 96, 99, 93],
  "shopping-king-louie-2016": [7.6, 2],
  "short-term-12-2013": [7.9, 96, 98],
  "showman": [7.5, 350, 57, 48],
  "shrek": [7.9, 816, 88, 84],
  "shrek2": [7.4, 560, 89, 75],
  "shrinking": [8.2, 128],
  "shutter": [8.2, 1666, 68, 63],
  "sicario-2015": [7.7, 544, 92, 82],
  "sicko-2007": [8.0, 78, 91, 74],
  "sideways-2004": [7.5, 218, 97, 94],
  "sieranevada-2016": [7.3, 6, 92],
  "silence": [8.6, 1736, 95, 86],
  "silence-2016": [7.2, 135, 83, 79],
  "silenced-2011": [8.0, 28],
  "silent-friend-2025": [7.3, 3, 100],
  "silent-light-2007": [7.2, 7, 85, 79],
  "silent-wedding-2008": [7.8, 7],
  "silentvoice": [8.2, 146, 94, 78],
  "silo": [8.1, 222],
  "silver-linings-playbook-2012": [7.7, 776, 92, 81],
  "sin-city-2005": [8.0, 822, 76, 74],
  "sin-nombre-2009": [7.5, 35, 88, 77],
  "since-otar-left-2003": [7.5, 3],
  "sing": [7.1, 215, 71, 59],
  "sing-sing-2023": [7.6, 30, 98, 84],
  "sing2": [7.3, 102, 72, 49],
  "singinrain": [8.3, 284, 100, 99],
  "singstreet": [7.9, 108, 95, 79],
  "sinners": [7.5, 506, 97, 84],
  "sir-2018": [7.7, 10],
  "sir-alex-ferguson-never-give-in-2021": [8.1, 7],
  "sirat-2025": [7.0, 36, 93, 82],
  "sister-2012": [7.0, 8, 96, 81],
  "sixthsense": [8.2, 1152, 86, 64],
  "skunk-2023": [7.3, 2],
  "skyfall": [7.8, 777, 92, 81],
  "slamdunk": [8.0, 13],
  "slowhorses": [8.3, 151],
  "slumdog": [8.0, 913, 92, 84],
  "smurfs25": [4.3, 8, 20, 31],
  "snatch-2000": [8.2, 981, 74, 55],
  "snow-cake-2006": [7.4, 14, 64, 54],
  "snow-white-2012": [7.5, 12, 95, 82],
  "snowden-2016": [7.3, 174, 61, 58],
  "snowpiercer-2013": [7.1, 423, 94, 84],
  "socialnetwork": [7.8, 824, 96, 95],
  "society-of-the-snow-2023": [7.8, 176, 90, 72],
  "sololeveling": [8.5, 117],
  "something-useful-2017": [7.6, 6],
  "son-of-rambow-2007": [7.0, 34, 73, 66],
  "song-of-the-sea-2014": [8.0, 69, 99, 85],
  "songs-from-the-second-floor-2000": [7.5, 22, 89, 77],
  "sonic": [6.5, 195, 64, 47],
  "sonic3": [6.9, 83, 85, 56],
  "sorry-baby-2025": [7.1, 25, 97, 88],
  "sorry-we-missed-you-2019": [7.6, 28, 88, 82],
  "soul": [8.0, 454, 95, 83],
  "soul-kitchen-2009": [7.2, 43, 73, 76],
  "souleymane-s-story-2024": [7.6, 7, 100, 81],
  "soulmate-2023": [7.5, 3],
  "sound-of-freedom-2023": [7.6, 139, 57, 36],
  "sound-of-metal-2019": [7.7, 188, 97, 82],
  "sound-of-noise-2010": [7.1, 10, 96, 72],
  "soundmusic": [8.1, 293, 83, 63],
  "soundtrack-to-a-coup-d-etat-2024": [7.8, 4, 0, 91],
  "source-code-2011": [7.5, 585, 92, 74],
  "spacejam": [6.5, 230, 44, 57],
  "spider-man-2-2004": [7.5, 792, 93, 83],
  "spiderverse": [8.4, 801, 97, 87],
  "spinning-out-2020": [7.5, 20],
  "spirit": [7.2, 95, 69, 52],
  "spirited": [8.6, 976, 96, 96],
  "spongebob": [7.2, 112, 68, 67],
  "spotlight": [8.1, 538, 97, 93],
  "spread-your-wings-2019": [7.3, 3, 67],
  "spring-summer-fall-winter-and-spri-2003": [8.0, 91, 94, 85],
  "spyfamily": [8.2, 64],
  "spykids": [5.7, 137, 92, 71],
  "squidgame": [7.9, 769],
  "staged-2020": [8.5, 12],
  "stan-ollie-2018": [7.2, 42, 92, 75],
  "star-trek-2009": [7.9, 640, 94, 82],
  "star-trek-into-darkness-2013": [7.7, 511, 84, 72],
  "star-wars-episode-iii-revenge-of-t-2005": [7.7, 929, 79, 68],
  "star-wars-episode-vii-the-force-aw-2015": [7.7, 1031, 93, 80],
  "stardust": [7.6, 300, 77, 66],
  "starred-up-2013": [7.3, 52, 99, 81],
  "starwars4": [8.6, 1579, 94, 90],
  "state-of-play-2009": [7.1, 167, 84, 64],
  "station-eleven-2021": [7.5, 43],
  "stations-of-the-cross-2014": [7.4, 5, 93, 68],
  "steel-rain-2017": [7.1, 7],
  "stepbrothers": [6.9, 343, 55, 51],
  "stewie-griffin-the-untold-story-2005": [7.5, 34],
  "still-a-michael-j-fox-movie-2023": [8.1, 18, 99, 78],
  "still-alice-2014": [7.5, 151, 85, 72],
  "still-game-2002": [8.9, 11],
  "still-walking-2008": [7.9, 21, 100, 89],
  "straight-outta-compton-2015": [7.8, 235, 89, 72],
  "stranger-than-fiction-2006": [7.5, 246, 73, 67],
  "strangerthings": [8.6, 1721],
  "stuartlittle": [6.0, 161, 67, 61],
  "substance": [7.2, 453, 89, 78],
  "succession": [8.8, 362],
  "suga-road-to-d-day-2023": [8.4, 2],
  "suite-fran-aise-2014": [7.0, 31, 76, 63],
  "suits": [8.4, 545],
  "summer-hours-2008": [7.1, 9, 94],
  "summerwars": [7.4, 34, 79, 63],
  "sunny-2011": [7.7, 7],
  "super-man-the-christopher-reeve-st-2024": [8.0, 12, 98, 76],
  "superbad": [7.6, 699, 88, 76],
  "superman25": [7.0, 432, 83, 68],
  "supernatural-the-animation-2011": [7.3, 3],
  "survival-family-2016": [7.2, 3],
  "survive-style-5-2004": [7.4, 11],
  "suspect-x-2008": [7.4, 4],
  "suzhou-river-2000": [7.4, 9, 90, 76],
  "suzume": [7.6, 65, 96, 77],
  "sweet-bean-2015": [7.4, 14, 85, 60],
  "sweet-sixteen-2002": [7.4, 15, 97, 86],
  "swing-girls-2004": [7.6, 6],
  "swing-kids-2018": [7.5, 3, 63],
  "sympathy-for-lady-vengeance-2005": [7.5, 94, 76, 75],
  "sympathy-for-mr-vengeance-2002": [7.5, 82, 54, 59],
  "syndromes-and-a-century-2006": [7.3, 5, 89],
  "synecdoche-new-york-2008": [7.5, 105, 69, 67],
  "taboo-2017": [8.3, 164],
  "tabu-2012": [7.3, 8, 88, 79],
  "tae-guk-gi-the-brotherhood-of-war-2004": [8.0, 42, 80, 64],
  "take-care-of-maya-2023": [7.7, 12, 92, 64],
  "taken-2008": [7.7, 675, 60, 51],
  "taking-sides-2001": [7.0, 4, 73, 61],
  "tampopo": [7.9, 27, 100, 87],
  "tangled": [7.7, 550, 89, 71],
  "tarzan": [7.3, 271, 90, 80],
  "tatb": [7.0, 142, 96, 64],
  "tedlasso": [8.7, 451],
  "tell-me-who-i-am-2019": [7.6, 20, 97],
  "tell-no-one-2006": [7.5, 62, 93, 82],
  "ten-2002": [7.4, 9, 85],
  "tenet": [7.3, 696, 69, 69],
  "tenthings": [7.4, 456, 71, 70],
  "terminal": [7.4, 539, 61, 55],
  "terminator2": [8.6, 1291, 90, 75],
  "testament-of-youth-2014": [7.2, 32, 84, 76],
  "thank-you-for-smoking-2005": [7.5, 236, 86, 71],
  "the-10th-kingdom-2000": [8.2, 22],
  "the-accusation-2021": [7.0, 2, 88],
  "the-act-2019": [7.8, 43],
  "the-act-of-killing-2012": [8.2, 45, 95, 92],
  "the-admiral-roaring-currents-2014": [7.1, 14, 88],
  "the-adventures-of-tintin-2011": [7.3, 256, 75, 68],
  "the-african-doctor-2016": [7.0, 12],
  "the-alabama-solution-2025": [7.8, 6],
  "the-alpinist-2021": [7.9, 17, 93, 67],
  "the-american-dream-2026": [7.4, 1],
  "the-americans-2013": [8.4, 125],
  "the-angels-share-2012": [7.0, 28, 89, 66],
  "the-animatrix-2003": [7.3, 91, 89],
  "the-anthem-of-the-heart-2015": [7.3, 7],
  "the-art-of-racing-in-the-rain-2019": [7.6, 49, 44, 43],
  "the-artist-2011": [7.8, 256, 95, 89],
  "the-assassination-of-jesse-james-b-2007": [7.5, 205, 76, 68],
  "the-attack-2012": [7.1, 5, 87],
  "the-attorney-2013": [7.7, 9, 77],
  "the-avengers-earth-s-mightiest-her-2010": [8.3, 18],
  "the-aviator-2004": [7.5, 411, 86, 77],
  "the-ax-2005": [7.3, 9, 80],
  "the-b-lier-family-2014": [7.3, 31, 83],
  "the-baader-meinhof-complex-2008": [7.3, 42, 85, 76],
  "the-ballad-of-wallis-island-2025": [7.4, 25, 96, 78],
  "the-band-s-visit-2007": [7.5, 15, 98, 80],
  "the-bank-job-2008": [7.2, 198, 80, 69],
  "the-banshees-of-inisherin-2022": [7.6, 298, 96, 87],
  "the-barbarian-invasions-2003": [7.5, 31, 81, 70],
  "the-bastard-son-the-devil-himself-2022": [7.5, 17],
  "the-battleship-island-2017": [7.1, 10, 67],
  "the-beaches-of-agn-s-2008": [8.0, 5, 96, 86],
  "the-beasts-2022": [7.5, 26, 97, 85],
  "the-beat-that-my-heart-skipped-2005": [7.2, 22, 86, 75],
  "the-beatles-get-back-2021": [8.9, 37, 0, 85],
  "the-beauty-inside-2015": [7.3, 9, 70],
  "the-beloved-2026": [7.1, 1],
  "the-best-exotic-marigold-hotel-2011": [7.2, 104, 77, 62],
  "the-big-bad-fox-and-other-tales-2017": [7.4, 5, 97],
  "the-big-hit-2020": [7.0, 4, 64],
  "the-big-sick-2017": [7.5, 151, 98, 86],
  "the-blind-side-2009": [7.6, 390, 66, 53],
  "the-blind-swordsman-zatoichi-2003": [7.4, 53, 87, 75],
  "the-blue-caftan-2022": [7.5, 8, 96],
  "the-book-of-vision-2020": [7.1, 18],
  "the-book-thief-2013": [7.5, 148, 50, 53],
  "the-bourne-supremacy-2004": [7.7, 516, 82, 73],
  "the-bourne-ultimatum-2007": [8.0, 686, 92, 85],
  "the-bow-2005": [7.1, 12, 86],
  "the-boy-in-the-striped-pajamas-2008": [7.7, 276, 65, 55],
  "the-boy-the-mole-the-fox-and-the-h-2022": [7.8, 23],
  "the-boy-who-harnessed-the-wind-2019": [7.6, 53, 86, 68],
  "the-braid-2023": [7.2, 3],
  "the-brand-new-testament-2015": [7.1, 37, 82, 70],
  "the-broken-circle-breakdown-2012": [7.7, 45, 83, 70],
  "the-bus-a-french-football-mutiny-2026": [7.0, 2],
  "the-butterfly-effect-2004": [7.6, 558, 34, 30],
  "the-call-2020": [7.1, 54, 100],
  "the-captain-2017": [7.3, 24, 83],
  "the-century-of-the-self-2002": [8.7, 7],
  "the-chaser-2008": [7.8, 82, 82, 64],
  "the-child-2005": [7.4, 20, 84, 87],
  "the-chorus-2004": [7.9, 72, 68, 56],
  "the-class-2008": [7.5, 38, 95, 92],
  "the-classic-2003": [7.7, 11],
  "the-clay-bird-2002": [8.3, 4, 89],
  "the-closet-2001": [7.0, 19, 85, 72],
  "the-collapse-2019": [7.7, 3],
  "the-comey-rule-2020": [7.5, 11],
  "the-concert-2009": [7.5, 19, 0, 60],
  "the-conductor-2018": [7.3, 5],
  "the-connection-2014": [7.1, 14, 77, 67],
  "the-constant-gardener-2005": [7.3, 156, 83, 82],
  "the-count-of-monte-cristo-2002": [7.7, 161, 74, 61],
  "the-count-of-monte-cristo-2024": [7.6, 49, 96, 75],
  "the-courier-2020": [7.2, 82, 85, 65],
  "the-cove-2009": [8.4, 53, 95, 84],
  "the-covenant-2023": [7.5, 213, 83, 63],
  "the-curious-case-of-benjamin-butto-2008": [7.8, 750, 71, 70],
  "the-damned-united-2009": [7.5, 49, 92, 81],
  "the-dance-of-reality-2013": [7.4, 10, 94, 76],
  "the-danish-girl-2015": [7.1, 207, 66, 66],
  "the-death-of-stalin-2017": [7.3, 128, 95, 88],
  "the-descent-2005": [7.2, 275, 87, 71],
  "the-devil-s-double-2011": [7.0, 66, 54, 52],
  "the-dissident-2020": [7.8, 31, 96],
  "the-diving-bell-and-the-butterfly-2007": [8.0, 113, 94, 92],
  "the-dreamers-2003": [7.1, 142, 0, 63],
  "the-eight-mountains-2022": [7.7, 20, 90, 78],
  "the-eighth-sense-2023": [8.6, 2],
  "the-endless-trench-2019": [7.2, 8, 92],
  "the-english-game-2020": [7.6, 19],
  "the-fabelmans-2022": [7.5, 136, 92, 85],
  "the-fall-2006": [7.8, 130, 64, 64],
  "the-farewell-2019": [7.5, 76, 97, 89],
  "the-father-2020": [8.2, 247, 98, 88],
  "the-favourite-2018": [7.5, 260, 93, 91],
  "the-fighter-2010": [7.8, 410, 91, 79],
  "the-final-chapters-special-2-2023": [9.0, 92],
  "the-first-day-of-the-rest-of-your--2008": [7.5, 10, 81],
  "the-five-obstructions-2003": [7.4, 10, 89, 79],
  "the-flash-2014": [7.5, 387],
  "the-florida-project-2017": [7.6, 148, 96, 92],
  "the-front-line-2011": [7.3, 8, 69, 59],
  "the-gatekeepers-2012": [7.6, 6, 94, 91],
  "the-gentlemen-2019": [7.8, 461, 75, 51],
  "the-ghost-writer-2010": [7.2, 177, 84, 77],
  "the-gilded-cage-2013": [7.1, 11],
  "the-girl-with-the-dragon-tattoo-2011": [7.8, 531, 86, 71],
  "the-gleaners-i-2000": [7.7, 10, 93, 86],
  "the-glory-2022": [8.2, 46],
  "the-good-the-bad-the-weird-2008": [7.2, 40, 82, 69],
  "the-great-ambition-2024": [7.0, 2],
  "the-great-beauty-2013": [7.7, 107, 91, 86],
  "the-great-debaters-2007": [7.5, 67, 80, 65],
  "the-great-escaper-2023": [7.0, 10, 90, 71],
  "the-greatest-night-in-pop-2024": [7.9, 17, 98],
  "the-guard-2011": [7.3, 102, 94, 78],
  "the-guernsey-literary-and-potato-p-2018": [7.3, 58, 81, 65],
  "the-hate-u-give-2018": [7.5, 44, 97, 81],
  "the-hateful-eight-2015": [7.8, 727, 74, 68],
  "the-hedgehog-2009": [7.3, 10, 87, 64],
  "the-help-2011": [8.1, 531, 76, 62],
  "the-hidden-blade-2004": [7.6, 8, 84, 76],
  "the-hobbit-the-desolation-of-smaug-2013": [7.8, 757, 74, 66],
  "the-holdovers-2023": [7.9, 272, 97, 82],
  "the-hookup-plan-2018": [7.1, 6],
  "the-host-2006": [7.1, 144, 93, 85],
  "the-hours-2002": [7.5, 148, 79, 80],
  "the-house-of-mirth-2000": [7.0, 9, 82, 78],
  "the-hunger-games-catching-fire-2013": [7.5, 778, 90, 76],
  "the-hurt-locker-2008": [7.5, 498, 97, 95],
  "the-ignorant-fairies-2001": [7.3, 11, 74, 69],
  "the-illusionist-2006": [7.5, 406, 73, 68],
  "the-illusionist-2010": [7.4, 38, 90, 82],
  "the-imitation-game-2014": [8.0, 882, 90, 71],
  "the-innocents-2016": [7.3, 12, 95, 78],
  "the-innocents-2021": [7.0, 30, 96, 79],
  "the-insult-2017": [7.6, 19, 86, 72],
  "the-invite-2026": [7.9, 18],
  "the-irishman-2019": [7.8, 476, 95, 94],
  "the-iron-claw-2023": [7.5, 121, 89, 73],
  "the-jinx-the-life-and-deaths-of-ro-2015": [8.6, 59],
  "the-kid-with-a-bike-2011": [7.4, 30, 96, 87],
  "the-kids-are-all-right-2010": [7.0, 138, 93, 86],
  "the-king-2019": [7.3, 181, 71, 62],
  "the-king-and-the-clown-2005": [7.3, 6],
  "the-king-is-dancing-2000": [6.9, 3],
  "the-king-of-kong-a-fistful-of-quar-2007": [8.0, 39, 97, 83],
  "the-king-s-speech-2010": [8.0, 735, 94, 88],
  "the-king-s-warden-2026": [7.1, 1],
  "the-kingdom-2024": [7.0, 2],
  "the-kingdom-of-dreams-and-madness-2013": [7.7, 6, 92],
  "the-kings-of-the-world-2022": [7.0, 3],
  "the-kite-runner-2007": [7.5, 85, 65, 61],
  "the-lady-2011": [7.0, 12, 36, 43],
  "the-last-10-years-2022": [7.1, 3],
  "the-last-king-of-scotland-2006": [7.6, 207, 87, 74],
  "the-last-naruto-the-movie-2014": [7.6, 21],
  "the-last-samurai-2003": [7.8, 507, 65, 55],
  "the-life-of-david-gale-2003": [7.5, 133, 19, 31],
  "the-little-prince-2015": [7.6, 72, 92, 70],
  "the-lobster-2015": [7.1, 336, 87, 82],
  "the-look-of-silence-2014": [8.2, 15, 96, 92],
  "the-lord-of-the-rings-the-fellowsh-2001": [8.9, 2221, 91, 92],
  "the-lord-of-the-rings-the-return-o-2003": [9.0, 2178, 94, 94],
  "the-lord-of-the-rings-the-two-towe-2002": [8.8, 1970, 95, 87],
  "the-lost-leonardo-2021": [7.5, 3, 98, 79],
  "the-lunchbox-2013": [7.8, 69, 97, 76],
  "the-machinist-2004": [7.6, 444, 77, 61],
  "the-magdalene-sisters-2002": [7.7, 30, 91, 83],
  "the-man-from-earth-2007": [7.8, 220, 100],
  "the-man-from-london-2007": [7.0, 5, 67],
  "the-man-from-nowhere-2010": [7.7, 81, 100],
  "the-man-who-could-not-remain-silen-2024": [7.3, 3],
  "the-man-who-knew-infinity-2015": [7.2, 67, 63, 56],
  "the-man-who-sold-his-skin-2020": [6.9, 8, 88, 64],
  "the-man-who-wasn-t-there-2001": [7.5, 121, 81, 73],
  "the-man-without-a-past-2002": [7.6, 29, 98, 84],
  "the-marching-band-2024": [7.4, 7],
  "the-mauritanian-2021": [7.5, 72, 75, 53],
  "the-memory-of-a-killer-2003": [7.2, 11, 84, 73],
  "the-misfortunates-2009": [7.3, 12, 68, 54],
  "the-missing-2014": [8.1, 33],
  "the-money-maker-2025": [7.0, 1],
  "the-most-precious-of-cargoes-2024": [7.1, 2, 77, 57],
  "the-motorcycle-diaries-2004": [7.7, 109, 83, 75],
  "the-musketeers-2014": [7.8, 25],
  "the-naked-director-2019": [7.6, 8],
  "the-names-of-love-2010": [7.1, 8, 72, 62],
  "the-net-2016": [7.4, 5, 83],
  "the-night-is-short-walk-on-girl-2017": [7.5, 7, 90],
  "the-night-of-the-12th-2022": [7.0, 13, 94],
  "the-old-oak-2023": [7.1, 15, 83, 69],
  "the-others-2001": [7.6, 429, 84, 74],
  "the-outlaws-2017": [7.2, 17, 91],
  "the-page-turner-2006": [7.0, 8, 77, 67],
  "the-painted-veil-2006": [7.4, 100, 74, 69],
  "the-painting-2011": [7.3, 5, 82],
  "the-paradise-2012": [7.7, 14],
  "the-past-2013": [7.7, 53, 92, 85],
  "the-patience-stone-2012": [7.1, 6, 84],
  "the-peanut-butter-falcon-2019": [7.6, 120, 95, 70],
  "the-perks-of-being-a-wallflower-2012": [7.9, 602, 85, 67],
  "the-pianist-2002": [8.5, 1018, 95, 85],
  "the-piano-teacher-2001": [7.5, 82, 74, 79],
  "the-proposition-2005": [7.3, 58, 85, 73],
  "the-prosecutor-s-proposal-2026": [8.2, 0],
  "the-pursuit-of-happyness-2006": [8.0, 626, 67, 64],
  "the-queen-2006": [7.3, 120, 97, 90],
  "the-quiet-american-2002": [7.0, 31, 87, 84],
  "the-rays-and-shadows-2026": [7.5, 1],
  "the-reader-2008": [7.6, 275, 63, 58],
  "the-red-turtle-2016": [7.5, 42, 93, 86],
  "the-rescue-2021": [8.3, 24],
  "the-revenant-2015": [8.0, 956, 78, 76],
  "the-round-up-2010": [7.1, 10, 56, 49],
  "the-royal-tenenbaums-2001": [7.6, 337, 81, 76],
  "the-salesman-2016": [7.7, 69, 96, 85],
  "the-salisbury-poisonings-2020": [7.2, 8],
  "the-salt-of-the-earth-2014": [8.4, 25, 95, 83],
  "the-science-of-sleep-2006": [7.2, 72, 70, 70],
  "the-secret-agent-2025": [7.2, 60, 99],
  "the-secret-life-of-my-secretary-2019": [7.3, 3],
  "the-secret-of-kells-2009": [7.5, 41, 90, 81],
  "the-secret-of-the-grain-2007": [7.4, 8, 93, 83],
  "the-seed-of-the-sacred-fig-2024": [7.5, 21, 97, 84],
  "the-selfish-giant-2013": [7.3, 13, 98, 83],
  "the-snows-of-kilimanjaro-2011": [7.2, 4, 100],
  "the-social-dilemma-2020": [7.6, 95, 85, 78],
  "the-son-2002": [7.5, 11, 88, 86],
  "the-son-s-room-2001": [7.3, 21, 85, 73],
  "the-source-2011": [7.2, 4, 70],
  "the-spanish-apartment-2002": [7.3, 44, 76, 65],
  "the-specials-2019": [7.4, 12, 82],
  "the-spy-gone-north-2018": [7.4, 7, 100],
  "the-square-2017": [7.1, 83, 85, 73],
  "the-staircase-2004": [7.8, 30],
  "the-station-agent-2003": [7.6, 81, 94, 81],
  "the-stranger-2020": [7.2, 70],
  "the-stranger-2025": [7.1, 6, 100],
  "the-summit-of-the-gods-2021": [7.5, 11, 100],
  "the-swamp-2001": [7.0, 10, 88, 78],
  "the-take-2009": [7.7, 10],
  "the-tale-of-the-princess-kaguya-2013": [8.0, 63, 100, 89],
  "the-taste-of-others-2000": [7.2, 11, 100, 78],
  "the-taste-of-tea-2004": [7.6, 8, 100, 77],
  "the-taste-of-things-2023": [7.4, 21, 97, 85],
  "the-terror-live-2013": [7.1, 9],
  "the-theory-of-everything-2014": [7.7, 509, 80, 71],
  "the-three-burials-of-melquiades-es-2005": [7.3, 43, 85, 77],
  "the-throne-2015": [7.1, 4],
  "the-ties-that-bind-us-2024": [7.2, 2],
  "the-tiger-2015": [7.2, 8, 100],
  "the-town-2010": [7.5, 451, 92, 74],
  "the-traitor-2019": [7.1, 15, 85, 64],
  "the-treatment-2014": [7.1, 11, 93],
  "the-trial-of-the-chicago-7-2020": [7.7, 206, 89, 76],
  "the-triplets-of-belleville-2003": [7.7, 58, 94, 91],
  "the-turin-horse-2011": [7.7, 22, 89, 80],
  "the-twilight-samurai-2002": [8.0, 27, 99, 82],
  "the-two-popes-2019": [7.6, 147, 88, 75],
  "the-unknown-woman-2006": [7.4, 17, 68, 56],
  "the-velvet-queen-2021": [7.8, 4, 100, 78],
  "the-vertical-ray-of-the-sun-2000": [7.2, 4, 81],
  "the-visitor-2007": [7.6, 46, 90, 79],
  "the-voice-of-hind-rajab-2025": [8.2, 20, 98, 85],
  "the-wailing-2016": [7.4, 101, 99, 81],
  "the-walk-in-2022": [7.3, 6],
  "the-warrior-2001": [7.1, 12],
  "the-way-home-2002": [7.7, 6],
  "the-well-digger-s-daughter-2011": [7.0, 4, 88],
  "the-whale-2022": [7.6, 307, 64, 60],
  "the-white-ribbon-2009": [7.8, 82, 85, 84],
  "the-wild-pear-tree-2018": [8.0, 31, 94, 86],
  "the-wind-that-shakes-the-barley-2006": [7.5, 59, 90, 82],
  "the-witch-part-1-the-subversion-2018": [7.2, 23, 89],
  "the-women-on-the-6th-floor-2010": [7.1, 11, 67, 52],
  "the-world-of-love-2025": [7.5, 1],
  "the-world-s-fastest-indian-2005": [7.7, 64, 82, 68],
  "the-worst-person-in-the-world-2021": [7.7, 130, 96, 91],
  "the-wrestler-2008": [7.9, 332, 98, 80],
  "the-yellow-sea-2010": [7.3, 25, 88],
  "the-yes-men-fix-the-world-2009": [7.5, 5, 75],
  "the-young-and-prodigious-t-s-spive-2013": [7.0, 22, 78, 53],
  "the-young-pope-2016": [8.3, 52],
  "thebatman": [7.8, 938, 85, 72],
  "thebear": [8.5, 318],
  "there-will-be-blood-2007": [8.2, 714, 91, 93],
  "they-shall-not-grow-old-2018": [8.2, 41, 99, 91],
  "thirst-2009": [7.1, 55, 80, 73],
  "thirteen-lives-2022": [7.8, 80, 86, 66],
  "this-is-england-2006": [7.7, 136, 93, 86],
  "this-is-england-88-2011": [8.3, 13],
  "this-is-england-90-2015": [8.4, 11],
  "thorrag": [7.9, 902, 93, 74],
  "three-billboards-outside-ebbing-mi-2017": [8.1, 612, 90, 88],
  "three-identical-strangers-2018": [7.6, 45, 96, 81],
  "three-monkeys-2008": [7.3, 24, 77, 73],
  "tick-tick-boom-2021": [7.5, 129, 88, 74],
  "tiger-king-2020": [7.5, 91],
  "timbuktu-2014": [7.1, 19, 98, 92],
  "time-2006": [7.1, 13, 76, 73],
  "time-of-eve-2010": [7.2, 4],
  "time-out-2001": [7.3, 5, 95, 88],
  "time-to-leave-2005": [7.1, 10, 75, 67],
  "tinker-tailor-soldier-spy-2011": [7.0, 227, 84, 85],
  "tipping-the-velvet-2002": [7.7, 9],
  "titanic": [8.0, 1403, 88, 75],
  "titanic-blood-and-steel-2012": [7.2, 2],
  "titans": [7.8, 251, 71, 48],
  "to-be-and-to-have-2002": [7.8, 9, 97, 87],
  "togo-2019": [7.9, 63, 92],
  "tokyo-2008": [7.0, 13, 76],
  "tokyo-sonata-2008": [7.6, 14],
  "tokyo-taxi-2025": [7.2, 1],
  "tokyostory": [8.1, 78, 100, 100],
  "tomboy-2011": [7.4, 23, 96, 74],
  "tomorrow-2015": [7.9, 4, 93, 71],
  "tony-takitani-2004": [7.2, 5, 89, 80],
  "topgun": [8.2, 894, 96, 78],
  "tori-and-lokita-2022": [7.1, 4, 88, 78],
  "totem-2023": [7.0, 4, 94, 85],
  "totoro": [8.1, 436, 93, 87],
  "touching-the-void-2003": [7.9, 40, 94, 82],
  "toy-story-5-2026": [7.5, 55, 92, 73],
  "toystory": [8.3, 1189, 100, 96],
  "toystory3": [8.3, 982, 98, 92],
  "toystory4": [7.6, 325, 97, 84],
  "traffic-2000": [7.5, 231, 93, 86],
  "train-dreams-2025": [7.5, 112, 95],
  "training-day-2001": [7.8, 521, 74, 71],
  "traintobusan": [7.6, 311, 95, 73],
  "transformers": [7.1, 723, 57, 61],
  "transformers-one-2024": [7.6, 68, 89, 64],
  "treasureplanet": [7.2, 149, 69, 60],
  "triangle-of-sadness-2022": [7.2, 218, 72, 63],
  "trilogy-the-weeping-meadow-2004": [7.8, 6, 67],
  "trolls": [6.4, 102, 76, 55],
  "trolls3": [6.0, 20, 64],
  "tron": [6.8, 388, 51, 49],
  "tropical-malady-2004": [7.1, 7, 78, 81],
  "true-grit-2010": [7.6, 378, 95, 80],
  "truedetective": [8.8, 762],
  "truly-naked-2026": [7.0, 1],
  "truman": [8.2, 1390, 94, 90],
  "tsotsi-2005": [7.2, 32, 82, 70],
  "tsuredure-children-2017": [7.2, 3],
  "tucker-and-dale-vs-evil-2010": [7.5, 210, 85, 65],
  "tune-in-for-love-2019": [7.2, 8],
  "turningred": [6.9, 176, 95, 83],
  "turtles-can-fly-2004": [8.0, 23, 88, 85],
  "twilight": [5.4, 530, 49, 56],
  "twisters": [6.5, 198, 75, 65],
  "two-brothers-2004": [7.0, 17, 78, 63],
  "two-days-one-night-2014": [7.3, 52, 96, 89],
  "two-is-a-family-2016": [7.3, 30, 43],
  "two-of-us-2019": [7.2, 4, 98],
  "two-people-exchanging-saliva-2024": [7.3, 3],
  "two-prosecutors-2025": [7.1, 3, 94, 85],
  "tyrannosaur-2011": [7.5, 36, 83, 65],
  "ufos-2021": [7.7, 1],
  "uncharted": [6.3, 304, 41, 45],
  "under-the-open-sky-2020": [7.2, 2],
  "under-the-sand-2000": [7.0, 11, 93, 86],
  "undertow-2009": [7.7, 8, 88],
  "united-93-2006": [7.6, 116, 90, 90],
  "unleashed-2005": [7.0, 112, 66, 58],
  "unorthodox-2020": [8.0, 99],
  "unreal-2015": [7.7, 17],
  "up": [8.3, 1246, 98, 88],
  "usualsuspects": [8.5, 1246, 87, 76],
  "utama-2022": [7.1, 2, 96, 74],
  "v-for-vendetta-2005": [8.1, 1251, 73, 62],
  "valentin-2002": [7.5, 5, 61],
  "venus-in-fur-2013": [7.1, 22, 88, 69],
  "vera-drake-2004": [7.6, 29, 92, 83],
  "vermiglio-2024": [6.9, 7, 93, 85],
  "virunga-2014": [8.1, 13, 100, 95],
  "vortex-2021": [7.4, 11],
  "w1917": [8.2, 779, 88, 78],
  "waco-2018": [7.8, 29],
  "waiter-2006": [6.9, 3],
  "wakfu-2007": [8.2, 3],
  "waking-life-2001": [7.6, 70, 81, 85],
  "walk-the-line-2005": [7.8, 282, 82, 72],
  "wallace": [7.5, 42, 100, 83],
  "wallace-gromit-the-curse-of-the-we-2005": [7.5, 158, 95, 87],
  "walle": [8.4, 1332, 95, 95],
  "waltermitty": [7.3, 375, 53, 54],
  "waltz-with-bashir-2008": [8.0, 63, 97, 91],
  "war-of-the-arrows-2011": [7.1, 13],
  "war-peace-2016": [8.1, 30],
  "warrior-2011": [8.1, 531, 84, 71],
  "wasteman-2025": [7.2, 7],
  "watchmen-2009": [7.6, 614, 65, 56],
  "waves-2019": [7.5, 39, 84, 80],
  "we-are-lady-parts-2021": [8.3, 8],
  "we-believe-you-2025": [7.2, 1],
  "we-made-a-beautiful-bouquet-2021": [7.5, 5],
  "we-will-dance-again-2024": [7.6, 12],
  "weapons": [7.4, 383, 93, 81],
  "weathering": [7.5, 71, 93],
  "wednesday": [8.0, 504],
  "weekend-2011": [7.6, 35, 95, 81],
  "welcome-2009": [7.5, 8, 87, 61],
  "welcome-to-dongmakgol-2005": [7.6, 8, 88],
  "welcome-to-the-sticks-2008": [7.1, 48, 67],
  "welcome-to-wrexham-2022": [8.3, 26],
  "werckmeister-harmonies-2000": [7.9, 18, 98, 92],
  "wham-2023": [7.5, 10],
  "what-is-a-woman-2022": [8.1, 48, 75],
  "what-s-in-a-name-2012": [7.3, 20, 71, 66],
  "what-the-day-owes-the-night-2012": [7.8, 5],
  "what-time-is-it-there-2001": [7.3, 6, 85],
  "what-will-people-say-2017": [7.4, 6, 78],
  "wheel-of-fortune-and-fantasy-2021": [7.5, 11, 99, 86],
  "when-it-melts-2023": [7.2, 2],
  "when-pigs-have-wings-2011": [7.0, 4],
  "when-the-last-sword-is-drawn-2002": [7.4, 6],
  "when-you-re-strange-2009": [7.6, 11, 60, 55],
  "where-do-we-go-now-2011": [7.4, 14, 53, 60],
  "where-to-invade-next-2015": [7.5, 27, 79, 64],
  "whiplash": [8.5, 1168, 94, 89],
  "whisper": [7.8, 84, 95, 75],
  "whispers-in-the-woods-2025": [7.8, 1],
  "whitelotus": [8.0, 330],
  "who-are-you-school-2015-2015": [7.6, 4],
  "why-don-t-you-play-in-hell-2013": [7.1, 10, 80],
  "why-we-fight-2005": [8.0, 11, 0, 68],
  "wicked": [7.3, 254, 88, 73],
  "wicked2": [6.6, 71, 67, 58],
  "widow-of-st-pierre-2000": [7.1, 6, 91, 73],
  "wild-bill-2011": [7.2, 15, 100],
  "wildrobot": [8.2, 232, 97, 85],
  "willywonka71": [7.8, 246, 92, 67],
  "wind-river-2017": [7.7, 318, 87, 73],
  "windstruck-2004": [7.1, 8],
  "winged-migration-2001": [7.9, 13, 95, 82],
  "winnie": [7.1, 31, 90, 74],
  "winter-sleep-2014": [8.0, 59, 87, 88],
  "wintersoldier": [7.7, 979, 90, 70],
  "wish": [5.5, 51, 48, 47],
  "with-a-friend-like-harry-2000": [7.1, 11, 96, 75],
  "with-friends-like-these-2007": [7.1, 3],
  "wizardoz": [8.1, 470, 98, 92],
  "wolf": [8.2, 1807, 80, 75],
  "wolfchildren": [8.1, 55, 95, 76],
  "wolfwalkers-2020": [8.0, 46, 99, 87],
  "woman-at-war-2018": [7.4, 12, 97, 81],
  "won-t-you-be-my-neighbor-2018": [8.3, 28, 97, 85],
  "wonder": [7.9, 198, 86, 66],
  "wonder-boys-2000": [7.2, 69, 81, 74],
  "wonderwoman": [7.3, 738, 93, 76],
  "wonka": [6.9, 195, 82, 66],
  "wood-job-2014": [7.5, 4],
  "wreck": [7.7, 502, 87, 72],
  "wuthering-heights-2009": [7.5, 11],
  "x-men-days-of-future-past-2014": [7.9, 791, 90, 75],
  "x-men-first-class-2011": [7.7, 767, 86, 65],
  "xxy-2007": [7.0, 16, 86, 67],
  "yakuza-and-the-family-2020": [7.1, 4],
  "yannick-2023": [7.0, 8, 94, 73],
  "yellow-letters-2026": [7.2, 2],
  "yi-yi-2000": [8.1, 35, 97, 94],
  "you-can-count-on-me-2000": [7.5, 34, 95, 85],
  "you-the-living-2007": [7.4, 17, 98, 81],
  "young-hearts-2024": [7.9, 9, 90, 69],
  "young-mothers-2025": [7.0, 2, 97, 80],
  "young-washington-2026": [7.5, 9],
  "young-woman-and-the-sea-2024": [7.5, 20, 88, 62],
  "your-eyes-tell-2020": [7.4, 3],
  "yourname": [8.4, 399, 98, 81],
  "youth-2015": [7.3, 89, 72, 64],
  "zack-snyder-s-justice-league-2021": [7.9, 477, 71, 54],
  "zeitgeist-2007": [8.1, 51],
  "zillion-2022": [7.2, 4],
  "zodiac": [7.7, 680, 90, 79],
  "zombieland-2009": [7.5, 671, 89, 73],
  "zootopia": [8.0, 644, 98, 78],
  "zootopia2": [7.3, 147, 90, 73]
};

// Built-ins underneath, anything fetched laid on top. A lookup that came back
// empty must never wipe a good built-in rating.
function mergeScores(fetched) {
  const out = {};
  Object.keys(BUILTIN_SCORES).forEach(function (id) {
    const b = BUILTIN_SCORES[id];
    const e = {
      imdb: b[0],
      votes: b[1] * 1000,
      src: "b"
    };
    if (b[2]) e.rt = b[2];
    if (b[3]) e.mc = b[3];
    out[id] = e;
  });
  Object.keys(fetched || {}).forEach(function (id) {
    const f = fetched[id];
    if (!f) return;
    if (f.miss) {
      if (!out[id]) out[id] = f;
      return;
    }
    out[id] = Object.assign({}, out[id] || {}, f);
  });
  return out;
}

// ---------- Live registry (built-ins + packs + manual additions) ----------
const BUILTIN_MOVIES = MOVIES;
let MOVIE_LIST = BUILTIN_MOVIES.slice();
let MOVIE_BY_ID = Object.fromEntries(BUILTIN_MOVIES.map(m => [m.id, m]));
function sanitizeEntry(e) {
  if (!e || typeof e !== "object") return null;
  const id = typeof e.id === "string" ? e.id.trim().slice(0, 40) : "";
  const t = typeof e.t === "string" ? e.t.trim().slice(0, 90) : "";
  const y = Math.round(Number(e.y));
  if (!id || !/^[a-z0-9:_\-]+$/i.test(id) || !t || !(y >= 1900 && y <= 2035)) return null;
  if (BAND_RANK[e.b] === undefined) return null;
  const g = Array.isArray(e.g) ? e.g.filter(x => typeof x === "string").map(x => x.toLowerCase()).slice(0, 4) : [];
  if (g.length === 0) return null;
  const tg = Array.isArray(e.tg) ? e.tg.filter(x => typeof x === "string").map(x => x.toLowerCase()).slice(0, 6) : [];
  const p = Math.min(10, Math.max(1, Math.round(Number(e.p)) || 6));
  const out = {
    id,
    t,
    y,
    b: e.b,
    s: typeof e.s === "string" ? e.s : "live",
    g,
    tg,
    p
  };
  if (e.k === "s") out.k = "s";
  if (Array.isArray(e.jp)) {
    const jp = e.jp.filter(x => PLATFORMS[x]);
    if (jp.length) out.jp = jp;
  }
  if (typeof e.q === "string" && e.q) out.q = e.q;
  return out;
}
function sanitizeLibrary(lib) {
  const out = {
    packs: {},
    custom: {}
  };
  if (lib && typeof lib === "object") {
    ["packs", "custom"].forEach(kk => {
      const src = lib[kk];
      if (src && typeof src === "object") {
        Object.keys(src).forEach(id => {
          const e = sanitizeEntry(src[id]);
          if (e) out[kk][e.id] = e;
        });
      }
    });
  }
  return out;
}
function applyLibrary(lib) {
  const map = {};
  BUILTIN_MOVIES.forEach(m => {
    map[m.id] = m;
  });
  Object.values(lib.packs).forEach(m => {
    map[m.id] = m;
  });
  Object.values(lib.custom).forEach(m => {
    map[m.id] = m;
  });
  Object.keys(map).forEach(id => {
    const m = map[id];
    if (m.q && !map[m.q]) map[id] = {
      ...m,
      q: undefined
    };
  });
  MOVIE_BY_ID = map;
  MOVIE_LIST = Object.values(map);
  buildIdf();
  return MOVIE_LIST.length;
}
const slugId = (t, y) => "c-" + t.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) + "-" + y;
const dedupeKey = (t, y) => t.toLowerCase().replace(/[^a-z0-9]/g, "") + ":" + y;

// ---------- TMDB auto-update ----------
const TMDB_MOVIE_G = {
  28: ["action"],
  12: ["adventure"],
  16: ["animation"],
  35: ["comedy"],
  80: ["crime"],
  99: ["drama"],
  18: ["drama"],
  14: ["fantasy"],
  36: ["drama"],
  27: ["horror"],
  10402: ["musical"],
  9648: ["mystery"],
  10749: ["romance"],
  878: ["scifi"],
  53: ["thriller"],
  37: ["adventure"]
};
const TMDB_TV_G = {
  10759: ["action", "adventure"],
  16: ["animation"],
  35: ["comedy"],
  80: ["crime"],
  99: ["drama"],
  18: ["drama"],
  9648: ["mystery"],
  10765: ["scifi", "fantasy"],
  10766: ["drama"],
  10768: ["drama"],
  37: ["adventure"]
};
const TMDB_FAMILY = 10751,
  TMDB_KIDS = 10762,
  TMDB_WAR_M = 10752,
  TMDB_WAR_TV = 10768,
  TMDB_HORROR = 27,
  TMDB_ANIM = 16;
function mapTmdbItem(item, isTv) {
  if (!item || item.adult) return null;
  const t = isTv ? item.name : item.title;
  const date = isTv ? item.first_air_date : item.release_date;
  if (!t || !date) return null;
  const y = parseInt(String(date).slice(0, 4), 10);
  if (!(y >= 1900 && y <= 2035)) return null;
  const ids = Array.isArray(item.genre_ids) ? item.genre_ids : [];
  const gmap = isTv ? TMDB_TV_G : TMDB_MOVIE_G;
  const g = [];
  ids.forEach(id => (gmap[id] || []).forEach(x => {
    if (!g.includes(x)) g.push(x);
  }));
  const anim = ids.includes(TMDB_ANIM);
  const familyish = ids.includes(TMDB_FAMILY);
  const kidsish = ids.includes(TMDB_KIDS);
  const horror = ids.includes(TMDB_HORROR);
  const tg = [];
  if (familyish || kidsish) tg.push("family");
  if (ids.includes(TMDB_WAR_M) || ids.includes(TMDB_WAR_TV)) tg.push("war");
  if (item.original_language === "ja") {
    tg.push("japan");
    if (anim) tg.push("anime");
  }
  if (g.length === 0) {
    if (anim) g.push("animation");else return null;
  }
  let b;
  if (horror) b = "r";else if (kidsish) b = "a";else if (familyish) b = "k";else if (anim) b = "t";else b = "x";
  const va = Number(item.vote_average) || 0;
  const p = Math.max(5, Math.min(9, Math.round(va || 7)));
  return {
    id: (isTv ? "tmdb-s-" : "tmdb-m-") + item.id,
    t,
    y,
    b,
    s: "live",
    g: g.slice(0, 4),
    tg: tg.slice(0, 6),
    p,
    k: isTv ? "s" : undefined
  };
}

// ---------- Pack authoring aids ----------
const PACK_PROMPT = `You generate a "catalog pack" as JSON for an app. Output ONE valid JSON object and NOTHING ELSE: no explanation, no markdown, no code fences. Start with { and end with }.

The object has one key, "titles", an array of objects. Each object:

- "id": unique slug, lowercase letters/numbers/hyphens only, e.g. "dune-part-two-2024".
- "t": the title as commonly written.
- "y": release year, whole number 1900 to 2035.
- "b": age band. EXACTLY one of:
    "a" = all ages, "k" = 6+, "t" = 9+, "x" = 12+, "r" = adults.
  If unsure, choose the more restrictive (higher) band.
- "g": array of 1 to 4 genres, ONLY from:
    comedy, adventure, action, fantasy, scifi, drama, musical, romance, mystery, thriller, horror, crime, sports, animation
- "tg": array of 0 to 4 themes, ONLY from (use [] if none):
    princess, magic, music, animals, dragons, dinosaurs, superhero, robots, space, ocean, cars, videogames, monsters, spies, detective, school, christmas, spooky, japan, friendship, family, sisters, toys, minions, feelings, cooking, survival, heist, timetravel, anime, aliens, war
- "p": popularity, whole number 1 to 10.
- "k": include "k": "s" ONLY for a TV series. OMIT for movies.
- "jp": OPTIONAL Japan streaming, only from: "disneyplus", "netflix", "prime". OMIT if unknown.
- "q": OPTIONAL id of the title to watch first, for sequels. OMIT otherwise.

Rules: output ONLY the JSON. Never use null (omit unknown keys). Use real titles and years. Check the JSON is valid.

Example:
{"titles":[
  {"id":"example-one-2026","t":"Example One","y":2026,"b":"a","g":["comedy","animation"],"tg":["animals","family"],"p":8},
  {"id":"example-series-2026","t":"Example Series","y":2026,"b":"r","g":["drama","mystery"],"tg":["detective"],"p":8,"k":"s","jp":["netflix"]}
]}

Now generate the pack for:
DESCRIBE WHAT YOU WANT HERE — for example: notable movies and TV series released between January and June 2026.`;
const PACK_EXAMPLE = {
  _about: "Movie Night catalog pack. Import under Settings -> Catalog. Only the 'titles' array is read; underscore keys are documentation.",
  _bands: "a=all ages, k=6+, t=9+, x=12+, r=adults",
  titles: [{
    id: "example-family-2026",
    t: "An Example Family Movie",
    y: 2026,
    b: "a",
    g: ["comedy", "adventure", "animation"],
    tg: ["animals", "family"],
    p: 8
  }, {
    id: "example-sequel-2026",
    t: "An Example Movie 2",
    y: 2026,
    b: "k",
    g: ["adventure", "fantasy", "animation"],
    tg: ["dragons"],
    p: 7,
    q: "example-family-2026"
  }, {
    id: "example-epic-2026",
    t: "An Example Blockbuster",
    y: 2026,
    b: "x",
    g: ["action", "scifi"],
    tg: ["space", "aliens"],
    p: 9,
    jp: ["disneyplus"]
  }, {
    id: "example-series-2026",
    t: "An Example Drama Series",
    y: 2026,
    b: "r",
    g: ["drama", "thriller", "mystery"],
    tg: ["detective"],
    p: 8,
    k: "s",
    jp: ["netflix"]
  }]
};
const PACK_EXAMPLE_STR = JSON.stringify(PACK_EXAMPLE, null, 2);
function downloadText(filename, text, mime) {
  try {
    const blob = new Blob([text], {
      type: mime || "text/plain"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch (e) {
    return false;
  }
}

// ---------- Critic scores ----------
// Rotten Tomatoes has no free public API (enterprise only, via Fandango) and
// blocks browser scraping. OMDb is the practical source: one free key, and each
// lookup returns IMDb, Rotten Tomatoes and Metacritic together. TMDB's own user
// score arrives free with a catalog sync and needs no extra key.
const OMDB_BASE = "https://www.omdbapi.com/";
function cleanTitleForLookup(t) {
  return String(t || "").replace(/\s*\(live action\)\s*/i, "").trim();
}
function parseOmdb(j) {
  if (!j || j.Response === "False") return null;
  const out = {};
  const imdb = parseFloat(j.imdbRating);
  if (isFinite(imdb) && imdb > 0) out.imdb = Math.round(imdb * 10) / 10;
  const mc = parseInt(j.Metascore, 10);
  if (isFinite(mc) && mc > 0) out.mc = mc;
  if (Array.isArray(j.Ratings)) {
    j.Ratings.forEach(r => {
      if (!r || !r.Source) return;
      if (r.Source.indexOf("Rotten") >= 0) {
        const v = parseInt(String(r.Value), 10);
        if (isFinite(v)) out.rt = v;
      } else if (r.Source.indexOf("Metacritic") >= 0 && out.mc === undefined) {
        const v = parseInt(String(r.Value), 10);
        if (isFinite(v)) out.mc = v;
      }
    });
  }
  const votes = parseInt(String(j.imdbVotes || "").replace(/,/g, ""), 10);
  if (isFinite(votes)) out.votes = votes;
  if (out.imdb === undefined && out.rt === undefined && out.mc === undefined) return null;
  out.at = Date.now();
  return out;
}
async function fetchScore(key, m) {
  const url = OMDB_BASE + "?apikey=" + encodeURIComponent(key) + "&t=" + encodeURIComponent(cleanTitleForLookup(m.t)) + "&y=" + encodeURIComponent(m.y) + "&type=" + (m.k === "s" ? "series" : "movie");
  const res = await fetch(url);
  if (res.status === 401) return {
    auth: false
  };
  const j = await res.json();
  if (j && j.Response === "False" && /invalid api key/i.test(j.Error || "")) return {
    auth: false
  };
  return {
    score: parseOmdb(j)
  };
}
function sanitizeScores(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  Object.keys(raw).forEach(id => {
    const e = raw[id];
    if (!e || typeof e !== "object") return;
    const o = {};
    const n = (v, lo, hi) => {
      const x = Number(v);
      return isFinite(x) && x >= lo && x <= hi ? x : undefined;
    };
    if (n(e.imdb, 0, 10) !== undefined) o.imdb = n(e.imdb, 0, 10);
    if (n(e.rt, 0, 100) !== undefined) o.rt = n(e.rt, 0, 100);
    if (n(e.mc, 0, 100) !== undefined) o.mc = n(e.mc, 0, 100);
    if (n(e.ra, 0, 100) !== undefined) o.ra = n(e.ra, 0, 100);
    if (n(e.tmdb, 0, 10) !== undefined) o.tmdb = n(e.tmdb, 0, 10);
    if (n(e.votes, 0, 1e9) !== undefined) o.votes = n(e.votes, 0, 1e9);
    if (e.miss) o.miss = 1;
    o.at = Number(e.at) || 0;
    if (o.imdb === undefined && o.rt === undefined && o.mc === undefined && o.ra === undefined && o.tmdb === undefined && !o.miss) return;
    out[id] = o;
  });
  return out;
}

// A single 0..1 critic figure. Rotten Tomatoes and IMDb lead; Metacritic and
// the TMDB crowd score fill in when the others are missing.
function criticNorm(e) {
  if (!e) return null;
  const parts = [],
    w = [];
  if (e.rt !== undefined) {
    parts.push(e.rt / 100);
    w.push(1.0);
  }
  if (e.ra !== undefined) {
    parts.push(e.ra / 100);
    w.push(0.8);
  }
  if (e.imdb !== undefined) {
    parts.push(e.imdb / 10);
    w.push(1.0);
  }
  if (e.mc !== undefined) {
    parts.push(e.mc / 100);
    w.push(0.7);
  }
  if (e.tmdb !== undefined) {
    parts.push(e.tmdb / 10);
    w.push(0.5);
  }
  if (!parts.length) return null;
  let s = 0,
    tw = 0;
  for (let i = 0; i < parts.length; i++) {
    s += parts[i] * w[i];
    tw += w[i];
  }
  return tw > 0 ? Math.min(1, Math.max(0, s / tw)) : null;
}
const hasScore = e => criticNorm(e) !== null;

// ---------- Recommendation engine (v11 — hardened) ----------
const BATCH_SIZE = 8;
const SIM_POOL_CAP = 60; // bounds scoring cost on very large histories
const NEG_POOL_CAP = 30;
const RATING_META = {
  2: {
    key: "love",
    glyph: "♥",
    label: "Loved",
    tone: "like"
  },
  1: {
    key: "ok",
    glyph: "✓",
    label: "Seen",
    tone: "neutral"
  },
  "-1": {
    glyph: "✕",
    label: "Not for me",
    tone: "dislike"
  }
};
function hash01(str) {
  let h = 2166136261;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % 1000 / 1000;
}
const num = (v, d) => typeof v === "number" && isFinite(v) ? v : d;

// Facet informativeness. "Drama" covers well over half the catalog, so two
// titles sharing it tells us almost nothing; sharing "musical" or "dinosaurs"
// tells us a great deal. Inverse document frequency turns that intuition into
// a weight, recomputed whenever the catalog changes.
let IDF = {
  g: {},
  tg: {},
  s: {},
  ready: false
};
function buildIdf() {
  const N = MOVIE_LIST.length || 1;
  const dfG = {},
    dfT = {},
    dfS = {};
  MOVIE_LIST.forEach(m => {
    (m.g || []).forEach(k => {
      dfG[k] = (dfG[k] || 0) + 1;
    });
    (m.tg || []).forEach(k => {
      dfT[k] = (dfT[k] || 0) + 1;
    });
    if (m.s) dfS[m.s] = (dfS[m.s] || 0) + 1;
  });
  const w = df => {
    const out = {};
    Object.keys(df).forEach(k => {
      // log-scaled, then clamped so nothing is silenced or allowed to dominate
      out[k] = Math.max(0.7, Math.min(1.5, Math.log(N / (1 + df[k])) / Math.log(12)));
    });
    return out;
  };
  IDF = {
    g: w(dfG),
    tg: w(dfT),
    s: w(dfS),
    ready: true
  };
  return IDF;
}
const idfG = k => IDF.ready ? num(IDF.g[k], 1) : 1;
const idfT = k => IDF.ready ? num(IDF.tg[k], 1) : 1;

// Normalized similarity, roughly 0..1.85. Dividing by the geometric mean of
// facet counts stops titles that simply carry more tags from looking similar
// to everything.
function rawSim(a, b) {
  if (!a || !b || a.id === b.id) return 0;
  const ag = a.g || [],
    bg = b.g || [],
    at = a.tg || [],
    bt = b.tg || [];
  let shared = 0,
    norm = 0;
  for (let i = 0; i < ag.length; i++) {
    const w = idfG(ag[i]);
    norm += w;
    if (bg.indexOf(ag[i]) >= 0) shared += w;
  }
  let bnorm = 0;
  for (let i = 0; i < bg.length; i++) bnorm += idfG(bg[i]);
  let s = shared / Math.sqrt(Math.max(0.5, norm) * Math.max(0.5, bnorm));
  if (at.length && bt.length) {
    let ts = 0,
      tn = 0,
      tb = 0;
    for (let i = 0; i < at.length; i++) {
      const w = idfT(at[i]);
      tn += w;
      if (bt.indexOf(at[i]) >= 0) ts += w;
    }
    for (let i = 0; i < bt.length; i++) tb += idfT(bt[i]);
    s += ts / Math.sqrt(Math.max(0.5, tn) * Math.max(0.5, tb)) * 0.6;
  }
  if (a.s && a.s === b.s && a.s !== "live") s += 0.25;
  // Titles from a similar era feel more alike than their tags suggest.
  s += 0.12 * Math.max(0, 1 - Math.abs(num(a.y, 2000) - num(b.y, 2000)) / 25);
  return s;
}

// Recency-decayed rating list; newest ratings weigh most (half-life ~23 ratings).
function decayedList(rated, order) {
  if (!rated || typeof rated !== "object") return [];
  const seen = {};
  const ids = [];
  (Array.isArray(order) ? order : []).forEach(id => {
    if (rated[id] !== undefined && !seen[id]) {
      seen[id] = 1;
      ids.push(id);
    }
  });
  Object.keys(rated).forEach(id => {
    if (!seen[id]) {
      seen[id] = 1;
      ids.push(id);
    }
  });
  const n = ids.length;
  return ids.map((id, i) => ({
    id,
    r: rated[id],
    w: Math.pow(0.97, n - 1 - i)
  }));
}

// Signed, exposure-aware affinity with Bayesian shrinkage toward zero.
function facetAffinity(list, facetOf) {
  const pos = {},
    neg = {},
    exp = {};
  list.forEach(e => {
    const m = MOVIE_BY_ID[e.id];
    if (!m) return;
    (facetOf(m) || []).forEach(k => {
      if (!k) return;
      exp[k] = (exp[k] || 0) + e.w;
      if (e.r > 0) pos[k] = (pos[k] || 0) + e.r * e.w;else neg[k] = (neg[k] || 0) + -e.r * e.w;
    });
  });
  const affinity = {};
  const K = 1.5;
  Object.keys(exp).forEach(k => {
    const p = pos[k] || 0,
      ng = neg[k] || 0;
    affinity[k] = (p - ng) / (p + ng + K);
  });
  return {
    affinity,
    exposure: exp
  };
}
const genresOf = m => m.g;
const themesOf = m => m.tg;
const studioOf = m => [m.s];

// Genres watched in the last fortnight — avoids serving the same thing twice running.
function recentGenreSet(watchlog) {
  const out = {};
  if (!Array.isArray(watchlog)) return out;
  const cutoff = Date.now() - 14 * 86400000;
  watchlog.slice(-2).forEach(h => {
    if (!h || num(h.ts, 0) < cutoff) return;
    const m = MOVIE_BY_ID[h.id];
    if (m) (m.g || []).forEach(g => {
      out[g] = 1;
    });
  });
  return out;
}

// How closely does this person actually agree with critics? Compare the critic
// score of what they liked against the critic score of everything they rated.
// Positive means their loves are the better-reviewed ones; negative means they
// reliably enjoy things critics did not. Shrinks toward a mild positive prior
// until there is enough evidence to trust the signal.
function criticAlignment(rated, scores) {
  if (!scores) return {
    a: 0,
    n: 0,
    meanPos: null,
    meanAll: null
  };
  let posSum = 0,
    posN = 0,
    allSum = 0,
    allN = 0;
  Object.keys(rated || {}).forEach(id => {
    const cn = criticNorm(scores[id]);
    if (cn === null) return;
    allSum += cn;
    allN++;
    if (rated[id] > 0) {
      posSum += cn;
      posN++;
    }
  });
  if (allN === 0) return {
    a: 0,
    n: 0,
    meanPos: null,
    meanAll: null
  };
  const meanAll = allSum / allN;
  const meanPos = posN ? posSum / posN : null;
  if (posN === 0) return {
    a: 0,
    n: allN,
    meanPos: null,
    meanAll
  };
  const scaled = Math.max(-1, Math.min(1, (meanPos - meanAll) * 5));
  const conf = allN / (allN + 8);
  return {
    a: scaled * conf + 0.3 * (1 - conf),
    n: allN,
    meanPos,
    meanAll
  };
}
function buildModel(rated, order, watchlog, scores) {
  const list = decayedList(rated, order);
  const gA = facetAffinity(list, genresOf);
  const tA = facetAffinity(list, themesOf);
  const sA = facetAffinity(list, studioOf);
  const positives = [],
    negatives = [];
  list.forEach(e => {
    const m = MOVIE_BY_ID[e.id];
    if (!m) return;
    if (e.r > 0) positives.push({
      m,
      r: e.r,
      w: e.w,
      s: e.r * e.w
    });else if (e.r < 0) negatives.push({
      m,
      r: e.r,
      w: e.w,
      s: e.w
    });
  });
  // Bound similarity work on long histories by keeping the strongest signals.
  const simPool = positives.slice().sort((a, b) => b.s - a.s).slice(0, SIM_POOL_CAP);
  const negPool = negatives.slice().sort((a, b) => b.s - a.s).slice(0, NEG_POOL_CAP);
  return {
    nPos: positives.length,
    nNeg: negatives.length,
    genre: gA.affinity,
    genreExp: gA.exposure,
    theme: tA.affinity,
    themeExp: tA.exposure,
    studio: sA.affinity,
    simPool,
    negPool,
    lovedYears: positives.filter(p => p.r === 2).map(p => p.m.y),
    posYears: positives.map(p => p.m.y),
    recentGenres: recentGenreSet(watchlog),
    critic: criticAlignment(rated, scores)
  };
}

// Blend household members into one model. Affinities are averaged with EQUAL
// weight per member, so somebody with 200 ratings cannot drown out somebody
// with 20 — that fairness is the whole point of watching together.
function blendModels(models) {
  const ms = (models || []).filter(Boolean);
  if (ms.length === 0) return buildModel({}, [], []);
  if (ms.length === 1) return ms[0];
  const avg = key => {
    const seen = {},
      out = {};
    ms.forEach(mo => Object.keys(mo[key] || {}).forEach(k => {
      seen[k] = 1;
    }));
    Object.keys(seen).forEach(k => {
      let sum = 0;
      ms.forEach(mo => {
        sum += num((mo[key] || {})[k], 0);
      });
      out[k] = sum / ms.length;
    });
    return out;
  };
  const genreExp = {},
    recentGenres = {};
  const simPool = [],
    negPool = [],
    lovedYears = [],
    posYears = [];
  let nPos = 0;
  ms.forEach(mo => {
    Object.keys(mo.genreExp || {}).forEach(k => {
      genreExp[k] = (genreExp[k] || 0) + num(mo.genreExp[k], 0);
    });
    (mo.simPool || []).forEach(p => simPool.push(p));
    (mo.negPool || []).forEach(p => negPool.push(p));
    (mo.lovedYears || []).forEach(y => lovedYears.push(y));
    (mo.posYears || []).forEach(y => posYears.push(y));
    Object.keys(mo.recentGenres || {}).forEach(g => {
      recentGenres[g] = 1;
    });
    nPos += mo.nPos;
  });
  simPool.sort((a, b) => b.s - a.s);
  negPool.sort((a, b) => b.s - a.s);
  return {
    nPos: Math.round(nPos / ms.length),
    nNeg: 0,
    genre: avg("genre"),
    genreExp,
    theme: avg("theme"),
    themeExp: avg("themeExp"),
    studio: avg("studio"),
    simPool: simPool.slice(0, SIM_POOL_CAP),
    negPool: negPool.slice(0, NEG_POOL_CAP),
    lovedYears,
    posYears,
    recentGenres,
    blended: ms.length,
    critic: function () {
      let a = 0,
        n = 0;
      ms.forEach(mo => {
        a += num(mo.critic && mo.critic.a, 0);
        n += num(mo.critic && mo.critic.n, 0);
      });
      return {
        a: a / ms.length,
        n,
        meanPos: null,
        meanAll: null
      };
    }()
  };
}

// A stated preference for newer releases, separate from the taste-derived era
// affinity below. Monotonic: every year further back scores lower, with the
// curve pivoting at 2011 so anything from the last decade and a half sits
// clearly above the rest and the 1930s sit firmly at the bottom.
const RECENCY_PIVOT = 2011;
function recencyBonus(y) {
  const now = new Date().getFullYear();
  const year = num(y, RECENCY_PIVOT);
  if (year >= RECENCY_PIVOT) {
    const span = Math.max(1, now - RECENCY_PIVOT);
    return 0.55 + 0.45 * Math.min(1, (year - RECENCY_PIVOT) / span);
  }
  return 0.55 - (RECENCY_PIVOT - year) * 0.0155;
}
function eraBonus(m, lovedYears, posYears) {
  const ys = lovedYears.length >= 2 ? lovedYears : posYears.length >= 3 ? posYears : null;
  if (!ys || !ys.length) return 0;
  let avg = 0;
  ys.forEach(y => avg += y);
  avg /= ys.length;
  const d = Math.min(Math.abs(m.y - avg), 30);
  return 0.22 * (1 - d / 30);
}
function seqAdjust(m, rated) {
  if (!m.q) return 0;
  const r = rated ? rated[m.q] : undefined;
  if (r === undefined) return -0.85;
  return r > 0 ? 0.2 : -0.5;
}

// Mean of the top-k similarities against a bounded pool, allocation-free.
function poolSim(m, pool, k) {
  if (!pool || !pool.length) return 0;
  let a = 0,
    b = 0,
    c = 0;
  for (let i = 0; i < pool.length; i++) {
    const v = rawSim(m, pool[i].m) * (pool[i].r === 2 ? 1.2 : 1);
    if (v > a) {
      c = b;
      b = a;
      a = v;
    } else if (v > b) {
      c = b;
      b = v;
    } else if (v > c) {
      c = v;
    }
  }
  if (k <= 1) return a;
  if (k === 2) return (a + b) / 2;
  return (a + b + c) / 3;
}
const topSims = (m, pool, k) => poolSim(m, pool, k);
function scoreTitle(m, model, ctx) {
  if (!m || !m.g || !m.g.length) return -Infinity;
  const explore = Math.min(1, Math.max(0, num(ctx.explore, 0.35)));
  const tw = Math.min(1, model.nPos / 8); // taste confidence

  // Popularity carries cold start then recedes. Jitter shrinks as confidence
  // grows, so a well-trained model is not shaken around by randomness.
  let score = num(m.p, 5) * (0.05 + 0.06 * (1 - tw)) + hash01(m.id + ":" + ctx.nonce) * (0.5 - 0.25 * tw);

  // Quality prior. Independent of the personalised critic term below: with real
  // ratings for nearly every title, a well-reviewed film is simply a better
  // blind bet than a poorly-reviewed one. Matters most before taste is known.
  const qs = ctx.scores && ctx.scores[m.id];
  if (qs && qs.imdb !== undefined && tw < 1) {
    // Fades to nothing once taste is known: a prior should yield to evidence.
    score += (Math.min(9.5, Math.max(4.5, qs.imdb)) - 6.9) * 0.38 * (1 - tw);
  }
  let taste = 0;
  // Note: no IDF here. Affinity is already a calibrated -1..1 preference; if
  // you reliably love a common genre that IS a strong signal, and discounting
  // it for being common measurably degrades recommendations. IDF belongs in
  // similarity, where matching on a rare tag really does mean more.
  (m.g || []).forEach(k => {
    taste += num(model.genre[k], 0);
  });
  (m.tg || []).forEach(k => {
    taste += num(model.theme[k], 0) * 0.6;
  });
  taste += num(model.studio[m.s], 0) * 0.45;
  taste += poolSim(m, model.simPool, 3) * 0.55;
  taste += eraBonus(m, model.lovedYears, model.posYears);
  score += taste * tw;

  // Steer away from what looks like what was rejected.
  if (model.negPool && model.negPool.length) score -= poolSim(m, model.negPool, 2) * 0.5;
  if (model.nPos >= 3) {
    let novel = 0,
      considered = 0;
    (m.g || []).forEach(k => {
      considered++;
      if (num(model.genreExp[k], 0) < 0.5) novel++;
    });
    const novelty = considered ? novel / considered : 0;
    // Exploration is scaled by confidence so a thin model isn't run by novelty alone.
    score += novelty * (0.2 + explore * 1.1) * Math.max(0.45, tw);
    let comfort = 0;
    (m.g || []).forEach(k => {
      comfort = Math.max(comfort, num(model.genre[k], 0));
    });
    score += comfort * (1 - explore) * 0.5;
  }

  // Critic scores, only when this member asked for them. Applied in the main
  // ranking rather than shoved into the wildcard slot, and scaled by how much
  // this person has historically agreed with critics.
  if (ctx.useCritics && ctx.scores) {
    const cn = criticNorm(ctx.scores[m.id]);
    if (cn !== null) {
      const align = num(model.critic && model.critic.a, 0.3);
      score += (cn - 0.5) * 2 * align * 0.9;
    }
  }

  // Stated preference for newer releases, scaled by how strongly this member
  // asked for it. Ranks older titles down rather than hiding them.
  const rec = Math.min(1, Math.max(0, num(ctx.recency, 0.5)));
  if (rec > 0) score += recencyBonus(m.y) * rec * 1.2;
  if (model.recentGenres) {
    let repeat = false;
    (m.g || []).forEach(k => {
      if (model.recentGenres[k]) repeat = true;
    });
    if (repeat) score -= 0.3;
  }
  if (ctx.moodGenres) {
    let hit = false;
    (m.g || []).forEach(x => {
      if (ctx.moodGenres.indexOf(x) >= 0) hit = true;
    });
    if (hit) score += 0.85;
  }
  if (ctx.recent && ctx.recent.has(m.id)) score -= 0.9;
  score -= Math.min(num((ctx.imp || {})[m.id], 0) * 0.12, 0.5);
  score += seqAdjust(m, ctx.rated);
  return isFinite(score) ? score : -Infinity;
}

// Greedy re-rank balancing relevance against variety: a pairwise similarity
// penalty plus a per-genre quota, so one dominant taste cannot fill the batch.
// The wildcard is drawn from the whole pool rather than the taste-ranked head,
// which is the only way it can land genuinely outside the current lane.
function assembleBatch(scored, model, ctx) {
  if (!scored || !scored.length) return [];
  const cand = scored.slice(0, 60);
  const chosen = [];
  const usedIds = {};
  const genreUse = {};
  const take = (item, asWild) => {
    usedIds[item.m.id] = 1;
    (item.m.g || []).forEach(g => {
      genreUse[g] = (genreUse[g] || 0) + 1;
    });
    chosen.push(asWild ? {
      m: item.m,
      sc: item.sc,
      wild: true
    } : item);
  };
  const bestNext = () => {
    let best = null,
      bv = -Infinity;
    for (let i = 0; i < cand.length; i++) {
      const it = cand[i];
      if (usedIds[it.m.id]) continue;
      let pen = 0;
      for (let j = 0; j < chosen.length; j++) {
        const s = rawSim(it.m, chosen[j].m);
        if (s > pen) pen = s;
      }
      let quota = 0;
      (it.m.g || []).forEach(g => {
        quota += Math.max(0, (genreUse[g] || 0) - 1) * 0.5;
      });
      const v = it.sc - pen * 1.05 - quota;
      if (v > bv) {
        bv = v;
        best = it;
      }
    }
    return best;
  };
  const wantWild = model.nPos >= 5;
  const slots = wantWild ? BATCH_SIZE - 1 : BATCH_SIZE;
  while (chosen.length < slots) {
    const nx = bestNext();
    if (!nx) break;
    take(nx);
  }
  if (wantWild) {
    // Search the WHOLE pool, not the taste-ranked head. The head is by
    // definition the most similar, so a bounded horizon finds nothing off-lane
    // once the catalog is large.
    let wild = null,
      wv = -Infinity;
    for (let i = 0; i < scored.length; i++) {
      const it = scored[i];
      if (usedIds[it.m.id]) continue;
      if (poolSim(it.m, model.simPool, 3) >= 0.35) continue;
      if (it.m.q && ctx.rated && ctx.rated[it.m.q] === undefined) continue;
      const v = num(it.m.p, 5) * 0.1 + hash01(it.m.id + ":w:" + ctx.nonce) * 0.7;
      if (v > wv) {
        wv = v;
        wild = it;
      }
    }
    if (wild) take(wild, true);
  }

  // Guarantee a full batch whenever the pool can supply one.
  for (let i = 0; i < scored.length && chosen.length < BATCH_SIZE; i++) {
    if (!usedIds[scored[i].m.id]) take(scored[i]);
  }
  return chosen;
}
function reasonFor(m, model, rated, wild, rewatching) {
  if (rewatching) {
    const r = rated ? rated[m.id] : undefined;
    return r === 2 ? "You loved this — worth another watch" : "Back in the mix for a rewatch";
  }
  if (wild) return "A change of pace";
  if (m.q && rated && rated[m.q] > 0) {
    const b = MOVIE_BY_ID[m.q];
    if (b) return "Next after " + b.t;
  }
  if (!model || model.nPos === 0) return "Popular right now";
  let best = null,
    bv = 0,
    bestR = 1;
  (model.simPool || []).forEach(p => {
    const v = rawSim(m, p.m) * (p.r === 2 ? 1.2 : 1);
    if (v > bv) {
      bv = v;
      best = p.m;
      bestR = p.r;
    }
  });
  const who = model.blended ? "Because the group loved " : "Because you loved ";
  if (best && bv >= 0.8) return (bestR === 2 ? who : "Like ") + best.t;
  const hits = [];
  (m.g || []).forEach(k => {
    const a = num(model.genre[k], 0);
    if (a > 0.05) hits.push({
      k,
      a
    });
  });
  (m.tg || []).forEach(k => {
    const a = num(model.theme[k], 0) * 0.8;
    if (a > 0.05) hits.push({
      k,
      a
    });
  });
  hits.sort((a, b) => b.a - a.a);
  if (hits.length) {
    return (model.blended ? "Works for everyone: " : "Matches your taste for ") + hits.slice(0, 2).map(h => lbl(h.k)).join(" & ");
  }
  let gap = null;
  (m.g || []).forEach(k => {
    if (num(model.genreExp[k], 0) < 0.5 && !gap) gap = k;
  });
  if (gap) return "Something new: " + lbl(gap);
  if (m.y >= new Date().getFullYear() - 1) return "Just out";
  return "Worth a look";
}

// Weights are needed from the very first render, not only after a catalog import.
buildIdf();

// ---------- Insights analytics ----------
const NOMINAL_MIN = {
  movie: 112,
  series: 380
};
function computeInsights(rated, order, hidden, watchlog, scores) {
  const model = buildModel(rated, order, watchlog, scores);
  const ids = Object.keys(rated || {});
  const counts = {
    love: 0,
    ok: 0,
    no: 0
  };
  ids.forEach(id => {
    const r = rated[id];
    if (r === 2) counts.love++;else if (r === 1) counts.ok++;else if (r === -1) counts.no++;
  });
  const totalRated = ids.length;
  const lovedRate = totalRated ? Math.round(counts.love / totalRated * 100) : 0;
  const genreCount = {},
    themeCount = {},
    decadeCount = {},
    studioCount = {};
  let movies = 0,
    series = 0;
  ids.forEach(id => {
    const m = MOVIE_BY_ID[id];
    if (!m) return;
    if (m.k === "s") series++;else movies++;
    (m.g || []).forEach(g => genreCount[g] = (genreCount[g] || 0) + 1);
    (m.tg || []).forEach(t => themeCount[t] = (themeCount[t] || 0) + 1);
    decadeCount[decadeOf(m.y)] = (decadeCount[decadeOf(m.y)] || 0) + 1;
    if (m.s && m.s !== "live") studioCount[m.s] = (studioCount[m.s] || 0) + 1;
  });
  const gVals = Object.values(genreCount);
  const gTot = gVals.reduce((a, b) => a + b, 0);
  let entropy = 0;
  if (gTot > 0) {
    gVals.forEach(c => {
      const p = c / gTot;
      entropy -= p * Math.log(p);
    });
    const maxE = Math.log(GENRE_OPTIONS.length);
    entropy = maxE > 0 ? Math.round(entropy / maxE * 100) : 0;
  }
  const gaps = GENRE_OPTIONS.map(g => ({
    g,
    c: genreCount[g] || 0
  })).sort((a, b) => a.c - b.c).slice(0, 4);
  const affRows = Object.keys(model.genre).map(g => ({
    g,
    a: model.genre[g],
    exp: model.genreExp[g] || 0
  })).filter(r => r.exp >= 0.4).sort((a, b) => b.a - a.a);
  const logs = Array.isArray(watchlog) ? watchlog : [];
  const monthAgo = Date.now() - 30 * 86400000;
  let estMin = 0;
  logs.forEach(h => {
    const m = MOVIE_BY_ID[h && h.id];
    if (m) estMin += m.k === "s" ? NOMINAL_MIN.series : NOMINAL_MIN.movie;
  });

  // Critic aggregates across everything rated that has a score.
  let imdbSum = 0,
    imdbN = 0,
    rtSum = 0,
    rtN = 0,
    mcSum = 0,
    mcN = 0,
    scored = 0;
  ids.forEach(id => {
    const e = scores && scores[id];
    if (!e) return;
    if (criticNorm(e) !== null) scored++;
    if (e.imdb !== undefined) {
      imdbSum += e.imdb;
      imdbN++;
    }
    if (e.rt !== undefined) {
      rtSum += e.rt;
      rtN++;
    }
    if (e.mc !== undefined) {
      mcSum += e.mc;
      mcN++;
    }
  });
  return {
    model,
    counts,
    totalRated,
    lovedRate,
    genreCount,
    themeCount,
    decadeCount,
    studioCount,
    movies,
    series,
    entropy,
    gaps,
    affRows,
    critic: model.critic,
    scoredCount: scored,
    avgImdb: imdbN ? Math.round(imdbSum / imdbN * 10) / 10 : null,
    avgRt: rtN ? Math.round(rtSum / rtN) : null,
    avgMc: mcN ? Math.round(mcSum / mcN) : null,
    logCount: logs.length,
    logMonth: logs.filter(h => h && h.ts >= monthAgo).length,
    estHours: Math.round(estMin / 60)
  };
}

// ---------- Persistence ----------
const KEY_APP = "mnp:v10:app"; // { theme, activeProfile, lastTab }
const KEY_PROFILES = "mnp:v10:profiles"; // { order:[id], byId:{ id: profile } }
const KEY_LIB = "mnp:v10:library"; // { packs, custom }
const KEY_TMDB = "mnp:v10:tmdb"; // api key (never exported)
const KEY_OMDB = "mnp:v10:omdb"; // critic-score api key (never exported)
const KEY_SCORES = "mnp:v10:scores"; // { titleId: { imdb, rt, mc, tmdb, votes, at } }
const WATCHLOG_CAP = 300;
const num0 = (v, d) => typeof v === "number" && isFinite(v) ? v : d;
const AVATAR_GLYPHS = ["◆", "●", "▲", "■", "★", "✦", "◐", "❋"];
function newMember(name, band, glyph) {
  return {
    id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: String(name || "Me").trim().slice(0, 24) || "Me",
    band: BAND_RANK[band] !== undefined ? band : "r",
    glyph: AVATAR_GLYPHS.indexOf(glyph) >= 0 ? glyph : AVATAR_GLYPHS[0],
    series: band === "r",
    useCritics: false,
    recency: 0.5,
    rated: {},
    ratedOrder: [],
    hidden: [],
    watchlist: [],
    rewatch: [],
    watchlog: [],
    imp: {},
    tonight: null,
    createdAt: Date.now()
  };
}

// An account holds a household: one or more members, each with their own
// taste, age ceiling and history. `active` is who is watching right now —
// one member, or several for a shared session.
function newProfile(name, band, glyph) {
  const me = newMember(name, band, glyph);
  return {
    id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: me.name,
    glyph: me.glyph,
    pin: "",
    members: {
      order: [me.id],
      byId: {
        [me.id]: me
      }
    },
    active: [me.id],
    createdAt: Date.now()
  };
}
function sanitizeMember(p, fallbackName) {
  if (!p || typeof p !== "object") return null;
  const rated = {};
  if (p.rated && typeof p.rated === "object") {
    Object.keys(p.rated).forEach(id => {
      const v = p.rated[id];
      if (v === 2 || v === 1 || v === -1) rated[id] = v;
    });
  }
  const order = Array.isArray(p.ratedOrder) ? p.ratedOrder.filter(id => rated[id] !== undefined) : [];
  Object.keys(rated).forEach(id => {
    if (order.indexOf(id) < 0) order.push(id);
  });
  const imp = {};
  if (p.imp && typeof p.imp === "object") {
    Object.keys(p.imp).forEach(k => {
      const v = Number(p.imp[k]);
      if (isFinite(v) && v > 0) imp[k] = v;
    });
  }
  return {
    id: typeof p.id === "string" && p.id ? p.id : "m" + Math.random().toString(36).slice(2, 8),
    name: String(typeof p.name === "string" && p.name ? p.name : fallbackName || "Me").slice(0, 24),
    band: BAND_RANK[p.band] !== undefined ? p.band : "r",
    glyph: AVATAR_GLYPHS.indexOf(p.glyph) >= 0 ? p.glyph : AVATAR_GLYPHS[0],
    series: !!p.series,
    useCritics: !!p.useCritics,
    // Absent on profiles written before this existed: default to a mild
    // preference for recent releases rather than none.
    recency: typeof p.recency === "number" && isFinite(p.recency) ? Math.min(1, Math.max(0, p.recency)) : 0.5,
    rated,
    ratedOrder: order,
    hidden: Array.isArray(p.hidden) ? p.hidden.filter(x => typeof x === "string") : [],
    watchlist: Array.isArray(p.watchlist) ? p.watchlist.filter(x => typeof x === "string") : [],
    rewatch: Array.isArray(p.rewatch) ? p.rewatch.filter(x => typeof x === "string") : [],
    watchlog: Array.isArray(p.watchlog) ? p.watchlog.filter(h => h && typeof h.id === "string").slice(-WATCHLOG_CAP) : [],
    imp,
    tonight: typeof p.tonight === "string" ? p.tonight : null,
    createdAt: p.createdAt || Date.now()
  };
}
function sanitizeProfile(p) {
  if (!p || typeof p !== "object") return null;
  const id = typeof p.id === "string" && p.id ? p.id : "p" + Math.random().toString(36).slice(2, 8);
  const name = String(typeof p.name === "string" && p.name ? p.name : "Me").slice(0, 24);
  const glyph = AVATAR_GLYPHS.indexOf(p.glyph) >= 0 ? p.glyph : AVATAR_GLYPHS[0];
  const pin = typeof p.pin === "string" && /^\d{4}$/.test(p.pin) ? p.pin : "";
  const byId = {},
    order = [];
  const src = p.members && typeof p.members === "object" ? p.members : null;
  if (src && Array.isArray(src.order)) {
    src.order.forEach(mid => {
      const sm = sanitizeMember(src.byId && src.byId[mid], name);
      if (sm) {
        byId[sm.id] = sm;
        order.push(sm.id);
      }
    });
  }
  // Migrate a pre-household profile: its own taste becomes the first member.
  if (order.length === 0) {
    const sm = sanitizeMember(p, name);
    if (sm) {
      sm.name = name;
      sm.glyph = glyph;
      byId[sm.id] = sm;
      order.push(sm.id);
    }
  }
  if (order.length === 0) {
    const me = newMember(name, "r", glyph);
    byId[me.id] = me;
    order.push(me.id);
  }
  let active = Array.isArray(p.active) ? p.active.filter(x => byId[x]) : [];
  if (active.length === 0) active = [order[0]];
  return {
    id,
    name,
    glyph,
    pin,
    members: {
      order,
      byId
    },
    active,
    createdAt: p.createdAt || Date.now()
  };
}

// The view for whoever is watching right now. One member reads through
// directly; several are merged — anything ANY of them has rated drops out of
// the pool, and the age ceiling is the strictest one present.
function memberView(profile) {
  const chosen = {};
  (profile.active || []).forEach(id => {
    if (profile.members.byId[id]) chosen[id] = 1;
  });
  // Always read in household order so labels and blending are stable no matter
  // what order the selection was made in.
  let ids = profile.members.order.filter(id => chosen[id]);
  if (ids.length === 0) ids = [profile.members.order[0]];
  const list = ids.map(id => profile.members.byId[id]);
  if (list.length === 1) {
    const m = list[0];
    return {
      solo: true,
      members: list,
      rated: m.rated,
      band: m.band,
      series: m.series,
      useCritics: !!m.useCritics,
      recency: num0(m.recency, 0.5),
      hidden: m.hidden,
      watchlist: m.watchlist,
      rewatch: m.rewatch || [],
      watchlog: m.watchlog,
      tonight: m.tonight,
      label: m.name
    };
  }
  const rated = {},
    hidden = [],
    watchlist = [],
    rewatch = [],
    watchlog = [];
  let band = "r",
    series = true,
    tonight = null,
    useCritics = false,
    recencySum = 0;
  list.forEach(m => {
    Object.keys(m.rated).forEach(id => {
      const v = m.rated[id];
      rated[id] = rated[id] === undefined ? v : Math.max(rated[id], v);
    });
    m.hidden.forEach(h => {
      if (hidden.indexOf(h) < 0) hidden.push(h);
    });
    m.watchlist.forEach(h => {
      if (watchlist.indexOf(h) < 0) watchlist.push(h);
    });
    (m.rewatch || []).forEach(h => {
      if (rewatch.indexOf(h) < 0) rewatch.push(h);
    });
    m.watchlog.forEach(h => watchlog.push(h));
    if (BAND_RANK[m.band] < BAND_RANK[band]) band = m.band;
    if (!m.series) series = false;
    if (m.useCritics) useCritics = true;
    recencySum += num0(m.recency, 0.5);
    if (m.tonight) tonight = m.tonight;
  });
  watchlog.sort((a, b) => (a.ts || 0) - (b.ts || 0));
  return {
    solo: false,
    members: list,
    rated,
    band,
    series,
    useCritics,
    recency: recencySum / list.length,
    hidden,
    watchlist,
    rewatch,
    watchlog: watchlog.slice(-WATCHLOG_CAP),
    tonight,
    label: list.map(m => m.name).join(" + ")
  };
}
async function sGet(key) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const r = await window.storage.get(key);
      return r && r.value ? r.value : null;
    }
  } catch (e) {}
  return null;
}
async function sSet(key, val) {
  try {
    if (typeof window !== "undefined" && window.storage) await window.storage.set(key, val);
  } catch (e) {}
}
function fmtDate(ts) {
  const d = new Date(ts),
    n = new Date();
  const day = 86400000,
    diff = Math.floor((n.setHours(0, 0, 0, 0) - new Date(ts).setHours(0, 0, 0, 0)) / day);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return diff + " days ago";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

// ---------- UI atoms ----------
function Poster({
  m,
  C,
  size
}) {
  // Monochrome typographic "poster": initials on a tonal card. Calm, no emoji.
  const initials = m.t.replace(/^(The|A|An) /, "").split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const tone = 6 + (hash01(m.id) * 6 | 0); // subtle tonal step
  const bg = C.name === "dark" ? "#1B1B1E" : "#F0F0F1";
  const fg = C.name === "dark" ? "#5C5C64" : "#C7C7CC";
  return /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center rounded-lg overflow-hidden shrink-0",
    style: {
      width: size,
      height: size,
      background: bg
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM,
      color: fg,
      fontSize: size * 0.34,
      fontWeight: 600,
      letterSpacing: "-0.02em"
    }
  }, initials));
}
function Bar({
  value,
  max,
  C,
  tone,
  height
}) {
  const pct = max > 0 ? Math.max(2, Math.round(value / max * 100)) : 0;
  const col = tone === "like" ? C.like : tone === "dislike" ? C.dislike : C.ink2;
  return /*#__PURE__*/React.createElement("div", {
    className: "w-full rounded-full overflow-hidden",
    style: {
      height: height || 6,
      background: C.line
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + "%",
      height: "100%",
      background: col,
      borderRadius: 999
    }
  }));
}

// Signed affinity bar: center baseline, green right / red left.
function SignedBar({
  value,
  C
}) {
  const pct = Math.round(Math.abs(value) * 100);
  const pos = value >= 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "relative w-full rounded-full",
    style: {
      height: 6,
      background: C.line
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 bottom-0",
    style: {
      left: "50%",
      width: "1px",
      background: C.faint
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 bottom-0 rounded-full",
    style: {
      background: pos ? C.like : C.dislike,
      width: pct / 2 + "%",
      left: pos ? "50%" : "auto",
      right: pos ? "auto" : "50%"
    }
  }));
}
function StatCard({
  label,
  value,
  sub,
  C
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-xl px-3.5 py-3",
    style: {
      background: C.card,
      border: "1px solid " + C.line
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: FONT_NUM,
      fontSize: 24,
      fontWeight: 600,
      color: C.ink,
      lineHeight: 1.1,
      letterSpacing: "-0.02em"
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    className: "mt-1 text-xs font-medium",
    style: {
      color: C.mut
    }
  }, label), sub ? /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: C.faint
    }
  }, sub) : null);
}
function Avatar({
  profile,
  C,
  size,
  active
}) {
  const s = size || 40;
  return /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center rounded-full shrink-0",
    style: {
      width: s,
      height: s,
      background: active ? C.ink : C.field,
      color: active ? C.bg : C.ink2,
      border: "1px solid " + (active ? C.ink : C.line),
      fontFamily: FONT_UI,
      fontWeight: 600,
      fontSize: s * 0.4
    }
  }, profile.glyph);
}
function Chip({
  label,
  on,
  onClick,
  C,
  tone
}) {
  const activeBg = tone === "like" ? C.like : C.ink;
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    className: "px-3 py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2",
    style: on ? {
      background: activeBg,
      color: C.bg,
      border: "1px solid " + activeBg
    } : {
      background: "transparent",
      color: C.ink2,
      border: "1px solid " + C.line
    }
  }, label);
}
function Segmented({
  options,
  value,
  onChange,
  C
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1 p-1 rounded-lg",
    style: {
      background: C.field
    }
  }, options.map(([id, label]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => onChange(id),
    className: "flex-1 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2",
    style: value === id ? {
      background: C.card,
      color: C.ink,
      boxShadow: C.shadow,
      border: "1px solid " + C.line
    } : {
      background: "transparent",
      color: C.mut,
      border: "1px solid transparent"
    }
  }, label)));
}
function Sheet({
  open,
  onClose,
  C,
  title,
  children
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-40",
    role: "dialog",
    "aria-label": title || "Sheet"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0",
    style: {
      background: C.overlay
    },
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-0 left-0 right-0 rounded-t-2xl flex flex-col",
    style: {
      maxHeight: "88vh",
      background: C.bg,
      borderTop: "1px solid " + C.line
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-1 rounded-full mx-auto mt-3 mb-1",
    style: {
      background: C.line
    }
  }), title ? /*#__PURE__*/React.createElement("div", {
    className: "px-5 py-2 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-semibold",
    style: {
      color: C.ink
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    className: "text-sm font-medium px-2 py-1 rounded-md focus:outline-none focus-visible:ring-2",
    style: {
      color: C.mut
    }
  }, "Done")) : null, /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-y-auto px-5 pb-8 pt-1"
  }, children)));
}
function Toast({
  toast,
  C
}) {
  if (!toast) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed left-0 right-0 z-50 flex justify-center px-4",
    style: {
      bottom: 88
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 rounded-full pl-4 pr-2 py-2",
    style: {
      background: C.ink,
      color: C.bg,
      boxShadow: C.shadow,
      maxWidth: 480
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-medium"
  }, toast.msg), toast.undo ? /*#__PURE__*/React.createElement("button", {
    onClick: toast.undo,
    className: "text-sm font-semibold px-3 py-1 rounded-full focus:outline-none",
    style: {
      background: C.bg,
      color: C.ink
    }
  }, "Undo") : null));
}

// Critic score chips. Colour is reserved for like/dislike everywhere else in
// this app, so these stay monochrome and lean on the mono face for the figures.
function ScoreChips({
  e,
  C,
  compact
}) {
  if (!e) return null;
  const items = [];
  // "Tomatometer" is the critics' score. Rotten Tomatoes also publishes a
  // separate audience score, which no free source carries, so it is labelled
  // rather than left ambiguous.
  if (e.rt !== undefined) items.push(["TOMATO", e.rt + "%"]);
  if (e.ra !== undefined) items.push(["AUDIENCE", e.ra + "%"]);
  if (e.imdb !== undefined) items.push(["IMDb", e.imdb.toFixed(1)]);
  if (e.mc !== undefined && !compact) items.push(["META", String(e.mc)]);
  if (!items.length && e.tmdb !== undefined) items.push(["TMDB", e.tmdb.toFixed(1)]);
  if (!items.length) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1.5"
  }, items.map(it => /*#__PURE__*/React.createElement("span", {
    key: it[0],
    className: "inline-flex items-baseline gap-1 px-1.5 py-0.5 rounded",
    style: {
      background: C.field,
      border: "1px solid " + C.line
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: C.mut,
      fontSize: 10,
      letterSpacing: "0.03em"
    }
  }, it[0]), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM,
      fontSize: 11,
      fontWeight: 600,
      color: C.ink
    }
  }, it[1]))));
}
function Select({
  value,
  onChange,
  options,
  C,
  label
}) {
  return /*#__PURE__*/React.createElement("select", {
    value: value,
    onChange: e => onChange(e.target.value),
    "aria-label": label,
    className: "rounded-lg text-xs font-medium focus:outline-none focus-visible:ring-2",
    style: {
      background: C.field,
      color: C.ink,
      border: "1px solid " + C.line,
      padding: "7px 8px",
      maxWidth: 150
    }
  }, options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o[0],
    value: o[0]
  }, o[1])));
}

// ---------- Brand mark ----------
function Logo({
  C,
  size
}) {
  const s = size || 30;
  return /*#__PURE__*/React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 32 32",
    fill: "none",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "1",
    y: "1",
    width: "30",
    height: "30",
    rx: "8",
    fill: C.ink
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13 11.2 L21.5 16 L13 20.8 Z",
    fill: C.bg
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "11.4",
    cy: "24.2",
    r: "1.5",
    fill: C.like
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "20.6",
    cy: "24.2",
    r: "1.5",
    fill: C.dislike
  }));
}

// ---------- Login / profile chooser ----------
function ProfileGate({
  profiles,
  C,
  onEnter,
  onCreate,
  onDelete
}) {
  const [pinFor, setPinFor] = useState(null);
  const [manage, setManage] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const order = profiles.order;
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen flex flex-col items-center justify-center px-6",
    style: {
      background: C.bg
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-center mb-10"
  }, /*#__PURE__*/React.createElement(Logo, {
    C: C,
    size: 44
  }), /*#__PURE__*/React.createElement("h1", {
    className: "mt-4 text-2xl font-semibold tracking-tight",
    style: {
      color: C.ink,
      fontFamily: FONT_UI
    }
  }, "Movie Night"), /*#__PURE__*/React.createElement("p", {
    className: "mt-1 text-sm",
    style: {
      color: C.mut
    }
  }, "Who's watching?")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-4"
  }, order.map(id => {
    const p = profiles.byId[id];
    const confirming = confirmId === id;
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      onClick: () => {
        if (!manage) {
          p.pin ? setPinFor(p) : onEnter(id);
          return;
        }
        if (confirming) {
          onDelete(id);
          setConfirmId(null);
        } else setConfirmId(id);
      },
      className: "flex flex-col items-center gap-2 focus:outline-none group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "relative transition-transform group-active:scale-95"
    }, /*#__PURE__*/React.createElement(Avatar, {
      profile: p,
      C: C,
      size: 62
    }), manage ? /*#__PURE__*/React.createElement("span", {
      className: "absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
      style: {
        background: C.dislike,
        color: "#fff",
        border: "2px solid " + C.bg
      }
    }, "✕") : null), /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-medium truncate max-w-full",
      style: {
        color: confirming ? C.dislike : C.ink2
      }
    }, confirming ? "Tap to delete" : p.name), p.pin && !manage ? /*#__PURE__*/React.createElement("span", {
      className: "text-xs",
      style: {
        color: C.faint
      }
    }, "Locked") : null);
  }), order.length < 8 && /*#__PURE__*/React.createElement("button", {
    onClick: onCreate,
    className: "flex flex-col items-center gap-2 focus:outline-none group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center rounded-full transition-transform group-active:scale-95",
    style: {
      width: 62,
      height: 62,
      border: "1px dashed " + C.faint,
      color: C.mut
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 28,
      fontWeight: 300
    }
  }, "+")), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-medium",
    style: {
      color: C.mut
    }
  }, "Add"))), order.length > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setManage(!manage);
      setConfirmId(null);
    },
    className: "mt-10 w-full text-center text-sm font-medium focus:outline-none",
    style: {
      color: manage ? C.ink : C.mut
    }
  }, manage ? "Done" : "Manage profiles")), pinFor && /*#__PURE__*/React.createElement(PinPad, {
    C: C,
    title: "Enter " + pinFor.name + "'s PIN",
    onCancel: () => setPinFor(null),
    onSubmit: code => {
      if (code === pinFor.pin) {
        setPinFor(null);
        onEnter(pinFor.id);
        return true;
      }
      return false;
    }
  }));
}

// ---------- PIN entry ----------
function PinPad({
  C,
  title,
  onSubmit,
  onCancel,
  subtitle
}) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const press = d => {
    if (code.length >= 4) return;
    const next = code + d;
    setCode(next);
    setErr(false);
    if (next.length === 4) {
      setTimeout(() => {
        const ok = onSubmit(next);
        if (!ok) {
          setErr(true);
          setCode("");
        }
      }, 120);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 flex flex-col items-center justify-center px-6",
    style: {
      background: C.bg
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onCancel,
    className: "absolute top-5 right-5 text-sm font-medium focus:outline-none",
    style: {
      color: C.mut
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-semibold mb-1",
    style: {
      color: C.ink
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    className: "text-sm mb-6",
    style: {
      color: err ? C.dislike : C.mut
    }
  }, err ? "Incorrect PIN. Try again." : subtitle || "4-digit PIN"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3 mb-8"
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "rounded-full",
    style: {
      width: 14,
      height: 14,
      background: i < code.length ? C.ink : "transparent",
      border: "1.5px solid " + (i < code.length ? C.ink : C.faint)
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3",
    style: {
      width: 240
    }
  }, [1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => /*#__PURE__*/React.createElement("button", {
    key: d,
    onClick: () => press(String(d)),
    className: "h-16 rounded-full text-xl font-medium focus:outline-none focus-visible:ring-2 active:scale-95 transition-transform",
    style: {
      color: C.ink,
      background: C.field
    }
  }, d)), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("button", {
    onClick: () => press("0"),
    className: "h-16 rounded-full text-xl font-medium focus:outline-none focus-visible:ring-2 active:scale-95 transition-transform",
    style: {
      color: C.ink,
      background: C.field
    }
  }, "0"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCode(code.slice(0, -1)),
    className: "h-16 rounded-full text-base font-medium focus:outline-none",
    style: {
      color: C.mut
    }
  }, "⌫")));
}

// ---------- Create profile ----------
function CreateProfile({
  C,
  onDone,
  onCancel,
  canCancel
}) {
  const [name, setName] = useState("");
  const [band, setBand] = useState("r");
  const [glyph, setGlyph] = useState(AVATAR_GLYPHS[0]);
  const [wantPin, setWantPin] = useState(false);
  const [pin, setPin] = useState("");
  const valid = name.trim().length > 0 && (!wantPin || /^\d{4}$/.test(pin));
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen flex flex-col px-6 py-8",
    style: {
      background: C.bg
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-sm mx-auto flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-8"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "text-xl font-semibold tracking-tight",
    style: {
      color: C.ink
    }
  }, "Create profile"), canCancel ? /*#__PURE__*/React.createElement("button", {
    onClick: onCancel,
    className: "text-sm font-medium focus:outline-none",
    style: {
      color: C.mut
    }
  }, "Cancel") : null), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-center mb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center rounded-full",
    style: {
      width: 72,
      height: 72,
      background: C.ink,
      color: C.bg,
      fontSize: 30,
      fontWeight: 600
    }
  }, glyph)), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap justify-center gap-2 mb-7"
  }, AVATAR_GLYPHS.map(g => /*#__PURE__*/React.createElement("button", {
    key: g,
    onClick: () => setGlyph(g),
    className: "w-10 h-10 rounded-full text-base focus:outline-none focus-visible:ring-2",
    style: glyph === g ? {
      background: C.ink,
      color: C.bg
    } : {
      background: C.field,
      color: C.ink2,
      border: "1px solid " + C.line
    }
  }, g))), /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-medium mb-1.5",
    style: {
      color: C.mut
    }
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "Your name",
    autoFocus: true,
    className: "w-full px-3.5 py-2.5 rounded-lg text-sm mb-5 focus:outline-none focus-visible:ring-2",
    style: {
      background: C.field,
      color: C.ink,
      border: "1px solid " + C.line,
      fontFamily: FONT_UI
    }
  }), /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-medium mb-1.5",
    style: {
      color: C.mut
    }
  }, "Content level"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-2",
    style: {
      color: C.faint
    }
  }, "Only titles at or below this rating are shown to you."), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2 mb-5"
  }, BANDS.map(b => /*#__PURE__*/React.createElement(Chip, {
    key: b.id,
    label: b.label,
    on: band === b.id,
    onClick: () => setBand(b.id),
    C: C
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setWantPin(!wantPin),
    className: "flex items-center justify-between w-full py-2 focus:outline-none"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-left"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-medium",
    style: {
      color: C.ink
    }
  }, "Lock with a PIN"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: C.mut
    }
  }, "Ask for a 4-digit code to open this profile")), /*#__PURE__*/React.createElement("div", {
    className: "rounded-full transition-colors",
    style: {
      width: 44,
      height: 26,
      background: wantPin ? C.ink : C.line,
      padding: 3
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "rounded-full transition-transform",
    style: {
      width: 20,
      height: 20,
      background: C.bg,
      transform: wantPin ? "translateX(18px)" : "translateX(0)"
    }
  }))), wantPin && /*#__PURE__*/React.createElement("input", {
    value: pin,
    onChange: e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4)),
    placeholder: "0000",
    inputMode: "numeric",
    className: "w-full mt-2 px-3.5 py-2.5 rounded-lg text-sm tracking-[0.5em] text-center focus:outline-none focus-visible:ring-2",
    style: {
      background: C.field,
      color: C.ink,
      border: "1px solid " + C.line,
      fontFamily: FONT_NUM
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-sm mx-auto"
  }, /*#__PURE__*/React.createElement("button", {
    disabled: !valid,
    onClick: () => onDone(newProfile(name, band, glyph), wantPin ? pin : ""),
    className: "w-full py-3 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2 transition-opacity",
    style: {
      background: C.ink,
      color: C.bg,
      opacity: valid ? 1 : 0.4
    }
  }, "Create profile")));
}

// ---------- Title card (Discover + Rate) ----------
function TitleCard({
  m,
  C,
  reason,
  rating,
  saved,
  onRate,
  onSave,
  compact,
  entry
}) {
  const plats = jpPlatforms(m);
  const sz = compact ? 46 : 64;
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-xl p-3 flex gap-3",
    style: {
      background: C.card,
      border: "1px solid " + C.line
    }
  }, /*#__PURE__*/React.createElement(Poster, {
    m: m,
    C: C,
    size: sz
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-semibold truncate",
    style: {
      color: C.ink
    }
  }, m.t), /*#__PURE__*/React.createElement("div", {
    className: "text-xs mt-0.5",
    style: {
      color: C.mut
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM
    }
  }, m.y), " · ", bandLabel(m.b), m.k === "s" ? " · Series" : "", " · ", lbl(m.g[0]))), /*#__PURE__*/React.createElement("button", {
    onClick: onSave,
    "aria-label": saved ? "Remove from watchlist" : "Save to watchlist",
    className: "shrink-0 w-8 h-8 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2",
    style: {
      background: saved ? C.field : "transparent"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: saved ? C.ink : "none",
    stroke: saved ? C.ink : C.faint,
    strokeWidth: "1.8",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 4h12v17l-6-4.2L6 21z"
  })))), reason ? /*#__PURE__*/React.createElement("div", {
    className: "text-xs mt-1.5 truncate",
    style: {
      color: C.ink2
    }
  }, reason) : null, entry ? /*#__PURE__*/React.createElement("div", {
    className: "mt-1.5"
  }, /*#__PURE__*/React.createElement(ScoreChips, {
    e: entry,
    C: C,
    compact: true
  })) : null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 mt-2.5"
  }, [2, 1, -1].map(r => {
    const meta = RATING_META[String(r)];
    const on = rating === r;
    const col = meta.tone === "like" ? C.like : meta.tone === "dislike" ? C.dislike : C.ink;
    const bg = meta.tone === "like" ? C.likeBg : meta.tone === "dislike" ? C.dislikeBg : C.field;
    return /*#__PURE__*/React.createElement("button", {
      key: r,
      onClick: () => onRate(r),
      "aria-label": meta.label + ": " + m.t,
      className: "flex items-center gap-1 px-2.5 h-8 rounded-full text-xs font-semibold focus:outline-none focus-visible:ring-2 transition-colors",
      style: on ? {
        background: col,
        color: "#fff"
      } : {
        background: bg,
        color: col,
        border: "1px solid " + (meta.tone === "neutral" ? C.line : "transparent")
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13
      }
    }, meta.glyph), /*#__PURE__*/React.createElement("span", {
      className: "hidden xs:inline"
    }, meta.label));
  }), plats ? /*#__PURE__*/React.createElement("a", {
    href: justWatchUrl(m),
    target: "_blank",
    rel: "noopener noreferrer",
    className: "ml-auto text-xs font-medium px-2 h-8 flex items-center rounded-full focus:outline-none",
    style: {
      color: C.mut
    }
  }, plats[0] === "rental" ? "Rent" : PLATFORMS[plats[0]] ? PLATFORMS[plats[0]].label : "Where", " ↗") : /*#__PURE__*/React.createElement("a", {
    href: justWatchUrl(m),
    target: "_blank",
    rel: "noopener noreferrer",
    className: "ml-auto text-xs font-medium px-2 h-8 flex items-center rounded-full focus:outline-none",
    style: {
      color: C.mut
    }
  }, "Where ↗"))));
}

// ---------- Bottom navigation ----------
function BottomNav({
  tab,
  onTab,
  C
}) {
  const items = [["discover", "Discover", "M4 6h16M4 12h16M4 18h10"], ["rate", "Rate", "M5 5h14v14H5z M9 9h6v6H9z"], ["watched", "Watched", "M12 5c-5 0-8.5 4.2-9.5 7 1 2.8 4.5 7 9.5 7s8.5-4.2 9.5-7c-1-2.8-4.5-7-9.5-7z M12 15a3 3 0 100-6 3 3 0 000 6z"], ["insights", "Insights", "M4 20V10 M10 20V4 M16 20v-7 M22 20v-3"], ["profile", "You", "M12 12a4 4 0 100-8 4 4 0 000 8z M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"]];
  return /*#__PURE__*/React.createElement("nav", {
    className: "fixed bottom-0 left-0 right-0 z-30",
    style: {
      background: C.bg,
      borderTop: "1px solid " + C.line
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-xl mx-auto flex",
    style: {
      paddingBottom: "env(safe-area-inset-bottom)"
    }
  }, items.map(([id, label, d]) => {
    const on = tab === id;
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      onClick: () => onTab(id),
      className: "flex-1 flex flex-col items-center gap-1 py-2.5 focus:outline-none",
      "aria-label": label,
      "aria-current": on
    }, /*#__PURE__*/React.createElement("svg", {
      width: "22",
      height: "22",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: on ? C.ink : C.faint,
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: d
    })), /*#__PURE__*/React.createElement("span", {
      className: "font-medium",
      style: {
        fontSize: 10,
        color: on ? C.ink : C.faint
      }
    }, label));
  })));
}
function TopBar({
  C,
  profile,
  onSwitch,
  right,
  title
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "sticky top-0 z-20 px-4 py-3 flex items-center justify-between",
    style: {
      background: C.bg,
      borderBottom: "1px solid " + C.line
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5 min-w-0"
  }, /*#__PURE__*/React.createElement(Logo, {
    C: C,
    size: 26
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-base font-semibold tracking-tight truncate",
    style: {
      color: C.ink
    }
  }, title || "Movie Night")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, right, /*#__PURE__*/React.createElement("button", {
    onClick: onSwitch,
    className: "focus:outline-none focus-visible:ring-2 rounded-full",
    "aria-label": "Switch profile"
  }, /*#__PURE__*/React.createElement(Avatar, {
    profile: profile,
    C: C,
    size: 32,
    active: true
  }))));
}

// Who is watching right now. Tap to toggle; pick more than one and the picks
// are scored for the group, with the strictest age ceiling applied.
function MemberBar({
  C,
  profile,
  view,
  onToggle,
  onManage
}) {
  const order = profile.members.order;
  if (order.length === 1) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-medium",
    style: {
      color: C.mut
    }
  }, "Watching"), !view.solo ? /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: C.faint
    }
  }, "Together · ", bandLabel(view.band), " and below") : null), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 overflow-x-auto -mx-4 px-4 pb-1",
    style: {
      scrollbarWidth: "none"
    }
  }, order.map(id => {
    const m = profile.members.byId[id];
    const on = profile.active.indexOf(id) >= 0;
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      onClick: () => onToggle(id),
      "aria-pressed": on,
      "aria-label": "Watching: " + m.name,
      className: "shrink-0 flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full focus:outline-none focus-visible:ring-2 transition-colors",
      style: on ? {
        background: C.ink,
        color: C.bg,
        border: "1px solid " + C.ink
      } : {
        background: "transparent",
        color: C.ink2,
        border: "1px solid " + C.line
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "flex items-center justify-center rounded-full",
      style: {
        width: 22,
        height: 22,
        fontSize: 11,
        background: on ? C.bg : C.field,
        color: on ? C.ink : C.ink2
      }
    }, m.glyph), /*#__PURE__*/React.createElement("span", {
      className: "text-sm font-medium"
    }, m.name));
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onManage,
    "aria-label": "Manage household",
    className: "shrink-0 px-3 py-1 rounded-full text-sm font-medium focus:outline-none focus-visible:ring-2",
    style: {
      color: C.mut,
      border: "1px dashed " + C.faint
    }
  }, "Edit")));
}

// ---------- Discover ----------
function DiscoverTab({
  C,
  profile,
  view,
  recs,
  tonight,
  model,
  mood,
  setMood,
  explore,
  setExplore,
  onRate,
  onSave,
  onSetTonight,
  onShuffle,
  onSurprise,
  onToggleMember,
  onManageHousehold,
  poolSize
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "pb-24"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-4 pt-4"
  }, /*#__PURE__*/React.createElement(MemberBar, {
    C: C,
    profile: profile,
    view: view,
    onToggle: onToggleMember,
    onManage: onManageHousehold
  }), tonight && MOVIE_BY_ID[tonight] ? /*#__PURE__*/React.createElement("div", {
    className: "rounded-xl p-4 mb-4",
    style: {
      background: C.ink
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-medium mb-2",
    style: {
      color: C.bg,
      opacity: 0.6
    }
  }, "TONIGHT'S PICK"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3"
  }, /*#__PURE__*/React.createElement(Poster, {
    m: MOVIE_BY_ID[tonight],
    C: {
      ...C,
      name: "dark"
    },
    size: 56
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-base font-semibold truncate",
    style: {
      color: C.bg
    }
  }, MOVIE_BY_ID[tonight].t), /*#__PURE__*/React.createElement("div", {
    className: "text-xs mt-0.5",
    style: {
      color: C.bg,
      opacity: 0.7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM
    }
  }, MOVIE_BY_ID[tonight].y), " · ", bandLabel(MOVIE_BY_ID[tonight].b), " · ", lbl(MOVIE_BY_ID[tonight].g[0])), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mt-3"
  }, /*#__PURE__*/React.createElement("a", {
    href: justWatchUrl(MOVIE_BY_ID[tonight]),
    target: "_blank",
    rel: "noopener noreferrer",
    className: "text-xs font-semibold px-3 py-1.5 rounded-full focus:outline-none",
    style: {
      background: C.bg,
      color: C.ink
    }
  }, "Find where to watch ↗"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onSetTonight(null),
    className: "text-xs font-medium px-3 py-1.5 rounded-full focus:outline-none",
    style: {
      color: C.bg,
      opacity: 0.7
    }
  }, "Clear"))))) : null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-2"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-semibold tracking-tight truncate",
    style: {
      color: C.ink
    }
  }, "For ", view.label), /*#__PURE__*/React.createElement("button", {
    onClick: onSurprise,
    className: "text-sm font-medium focus:outline-none",
    style: {
      color: C.ink2
    }
  }, "Surprise me")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 overflow-x-auto pb-2 -mx-4 px-4",
    style: {
      scrollbarWidth: "none"
    }
  }, MOODS.map(mo => /*#__PURE__*/React.createElement("div", {
    key: mo.id,
    className: "shrink-0"
  }, /*#__PURE__*/React.createElement(Chip, {
    label: mo.label,
    on: mood === mo.id,
    onClick: () => setMood(mo.id),
    C: C
  })))), /*#__PURE__*/React.createElement("div", {
    className: "rounded-xl px-3.5 py-3 mb-4 mt-1",
    style: {
      background: C.card,
      border: "1px solid " + C.line
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-medium",
    style: {
      color: C.mut
    }
  }, "Discovery"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: C.faint
    }
  }, explore < 0.33 ? "Comfort picks" : explore > 0.66 ? "Adventurous" : "Balanced")), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0",
    max: "100",
    value: Math.round(explore * 100),
    onChange: e => setExplore(Number(e.target.value) / 100),
    className: "w-full",
    style: {
      accentColor: C.ink
    },
    "aria-label": "Discovery: comfort to adventurous"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "px-4 space-y-2.5"
  }, recs.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-16 px-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-medium",
    style: {
      color: C.ink
    }
  }, "Nothing left to suggest here"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-1",
    style: {
      color: C.mut
    }
  }, "You've rated most of what fits. Widen the content level in your profile, or add new titles under Rate.")) : recs.map(it => /*#__PURE__*/React.createElement(TitleCard, {
    key: it.m.id,
    m: it.m,
    C: C,
    reason: reasonFor(it.m, model, view.rated, it.wild, view.rewatch.indexOf(it.m.id) >= 0),
    rating: view.rated[it.m.id],
    saved: view.watchlist.indexOf(it.m.id) >= 0,
    onRate: r => onRate(it.m.id, r),
    onSave: () => onSave(it.m.id)
  }))), recs.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "px-4 mt-4 flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onShuffle,
    className: "flex-1 py-2.5 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2",
    style: {
      background: C.field,
      color: C.ink,
      border: "1px solid " + C.line
    }
  }, "Refresh picks"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onSetTonight(recs[0].m.id),
    className: "flex-1 py-2.5 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2",
    style: {
      background: C.ink,
      color: C.bg
    }
  }, "Set top as tonight's")), /*#__PURE__*/React.createElement("div", {
    className: "text-center mt-4 text-xs",
    style: {
      color: C.faint,
      fontFamily: FONT_NUM
    }
  }, poolSize, " titles in your pool"));
}

// ---------- Rate ----------
// The point of this screen is volume: the more of the catalog you mark, the
// less chance the recommender offers something already seen. So it has to be
// possible to work through two thousand titles, not just the popular sixty.
function RateTab({
  C,
  mv,
  query,
  setQuery,
  results,
  total,
  shown,
  setShown,
  onRate,
  onSave,
  onBulk,
  view,
  setView,
  watchlistTitles,
  filters,
  setFilters,
  scores,
  ratedCount
}) {
  const set = (k, v) => setFilters(Object.assign({}, filters, {
    [k]: v
  }));
  const pct = total > 0 ? Math.round(ratedCount / total * 100) : 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "pb-24"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-4 pt-4"
  }, /*#__PURE__*/React.createElement(Segmented, {
    options: [["browse", "Browse"], ["watchlist", "Watchlist"]],
    value: view,
    onChange: setView,
    C: C
  })), view === "browse" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "px-4 pt-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 px-3 rounded-lg",
    style: {
      background: C.field,
      border: "1px solid " + C.line
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: C.mut,
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 21l-4-4",
    strokeLinecap: "round"
  })), /*#__PURE__*/React.createElement("input", {
    value: query,
    onChange: e => setQuery(e.target.value),
    placeholder: "Search titles",
    className: "flex-1 py-2.5 text-sm bg-transparent focus:outline-none",
    style: {
      color: C.ink
    }
  }), query ? /*#__PURE__*/React.createElement("button", {
    onClick: () => setQuery(""),
    "aria-label": "Clear search",
    className: "text-sm px-1 focus:outline-none",
    style: {
      color: C.mut
    }
  }, "✕") : null), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mt-2.5 mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: C.mut
    }
  }, "Rated ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM,
      color: C.ink
    }
  }, ratedCount), " of", " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM
    }
  }, total)), /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      fontFamily: FONT_NUM,
      color: C.faint
    }
  }, pct, "%")), /*#__PURE__*/React.createElement(Bar, {
    value: ratedCount,
    max: Math.max(1, total),
    C: C,
    height: 4
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 overflow-x-auto pb-2 pt-3 -mx-4 px-4",
    style: {
      scrollbarWidth: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "shrink-0"
  }, /*#__PURE__*/React.createElement(Chip, {
    label: "Unrated only",
    on: filters.unrated,
    onClick: () => set("unrated", !filters.unrated),
    C: C
  })), /*#__PURE__*/React.createElement("div", {
    className: "shrink-0"
  }, /*#__PURE__*/React.createElement(Chip, {
    label: "Films",
    on: filters.kind === "m",
    onClick: () => set("kind", filters.kind === "m" ? "all" : "m"),
    C: C
  })), /*#__PURE__*/React.createElement("div", {
    className: "shrink-0"
  }, /*#__PURE__*/React.createElement(Chip, {
    label: "Series",
    on: filters.kind === "s",
    onClick: () => set("kind", filters.kind === "s" ? "all" : "s"),
    C: C
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 flex-wrap"
  }, /*#__PURE__*/React.createElement(Select, {
    C: C,
    label: "Genre",
    value: filters.genre,
    onChange: v => set("genre", v),
    options: [["", "All genres"]].concat(GENRE_OPTIONS.map(g => [g, lbl(g)]))
  }), /*#__PURE__*/React.createElement(Select, {
    C: C,
    label: "Decade",
    value: filters.decade,
    onChange: v => set("decade", v),
    options: [["", "Any decade"], ["2020", "2020s"], ["2010", "2010s"], ["2000", "2000s"], ["1990", "1990s"], ["1980", "1980s"], ["older", "Older"]]
  }), /*#__PURE__*/React.createElement(Select, {
    C: C,
    label: "Sort by",
    value: filters.sort,
    onChange: v => set("sort", v),
    options: [["popular", "Most popular"], ["year", "Newest first"], ["imdb", "Best rated"], ["title", "A to Z"]]
  })), !query && !filters.unrated && /*#__PURE__*/React.createElement("button", {
    onClick: onBulk,
    className: "mt-3 w-full py-2 rounded-lg text-xs font-medium focus:outline-none focus-visible:ring-2",
    style: {
      color: C.ink2,
      border: "1px dashed " + C.faint
    }
  }, "Seen the family classics? Mark every all-ages & 6+ film as seen")), /*#__PURE__*/React.createElement("div", {
    className: "px-4 pt-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs mb-2",
    style: {
      color: C.faint
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM
    }
  }, results.length), results.length === 1 ? " title matches" : " titles match"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2.5"
  }, results.slice(0, shown).map(m => /*#__PURE__*/React.createElement(TitleCard, {
    key: m.id,
    m: m,
    C: C,
    rating: mv.rated[m.id],
    saved: mv.watchlist.indexOf(m.id) >= 0,
    entry: scores[m.id],
    onRate: r => onRate(m.id, r),
    onSave: () => onSave(m.id),
    compact: true
  }))), results.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-12"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-medium",
    style: {
      color: C.ink
    }
  }, "Nothing matches"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-1",
    style: {
      color: C.mut
    }
  }, "Try clearing the filters or searching a different title.")) : null, results.length > shown ? /*#__PURE__*/React.createElement("button", {
    onClick: () => setShown(shown + 60),
    className: "w-full mt-3 py-2.5 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2",
    style: {
      background: C.field,
      color: C.ink,
      border: "1px solid " + C.line
    }
  }, "Show 60 more") : null)) : /*#__PURE__*/React.createElement("div", {
    className: "px-4 pt-3 space-y-2.5"
  }, watchlistTitles.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-16 px-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-medium",
    style: {
      color: C.ink
    }
  }, "Your watchlist is empty"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-1",
    style: {
      color: C.mut
    }
  }, "Tap the bookmark on any title to save it for later.")) : watchlistTitles.map(m => /*#__PURE__*/React.createElement(TitleCard, {
    key: m.id,
    m: m,
    C: C,
    rating: mv.rated[m.id],
    saved: true,
    entry: scores[m.id],
    onRate: r => onRate(m.id, r),
    onSave: () => onSave(m.id),
    compact: true
  }))));
}

// ---------- Watched ----------
// Everything this person (or group) has rated, with critic scores alongside
// their own verdict — the one place the two sit side by side.
function WatchedTab({
  C,
  view,
  ins,
  scores,
  sort,
  setSort,
  onFetchScores,
  fetching,
  fetchMsg,
  missing,
  hasKey,
  onOpenScores,
  onEdit
}) {
  const rewatch = view.rewatch || [];
  const rows = useMemo(() => {
    const seenAt = {};
    (view.watchlog || []).forEach(h => {
      if (h && h.id) seenAt[h.id] = Math.max(seenAt[h.id] || 0, h.ts || 0);
    });
    const list = Object.keys(view.rated).map(id => ({
      id,
      m: MOVIE_BY_ID[id],
      r: view.rated[id],
      e: scores[id],
      ts: seenAt[id] || 0
    })).filter(x => x.m);
    const cn = x => {
      const v = criticNorm(x.e);
      return v === null ? -1 : v;
    };
    if (sort === "critic") list.sort((a, b) => cn(b) - cn(a) || a.m.t.localeCompare(b.m.t));else if (sort === "mine") list.sort((a, b) => b.r - a.r || cn(b) - cn(a));else if (sort === "title") list.sort((a, b) => a.m.t.localeCompare(b.m.t));else list.sort((a, b) => b.ts - a.ts || a.m.t.localeCompare(b.m.t));
    return list;
  }, [view.rated, view.watchlog, scores, sort]);
  if (rows.length === 0) {
    return /*#__PURE__*/React.createElement("div", {
      className: "pb-24 px-4 pt-4"
    }, /*#__PURE__*/React.createElement("h2", {
      className: "text-lg font-semibold tracking-tight mb-1",
      style: {
        color: C.ink
      }
    }, "Watched"), /*#__PURE__*/React.createElement("div", {
      className: "text-center py-16 px-6"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-sm font-medium",
      style: {
        color: C.ink
      }
    }, "Nothing rated yet"), /*#__PURE__*/React.createElement("p", {
      className: "text-xs mt-1",
      style: {
        color: C.mut
      }
    }, "Everything you rate shows up here with its IMDb score built in. Tap any title later to change your verdict or put it back in the mix.")));
  }
  const align = ins.critic || {
    a: 0,
    n: 0
  };
  const alignText = align.n < 5 ? "Rate a few more scored titles to see how your taste lines up with critics." : align.a > 0.25 ? "You tend to agree with critics." : align.a < -0.1 ? "You often like what critics do not." : "Your taste runs largely independent of the critics.";
  return /*#__PURE__*/React.createElement("div", {
    className: "pb-24 px-4 pt-4"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-semibold tracking-tight mb-3",
    style: {
      color: C.ink
    }
  }, "Watched by ", view.label), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-2 mb-2"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Titles",
    value: rows.length,
    C: C
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Avg IMDb",
    value: ins.avgImdb === null ? "—" : ins.avgImdb.toFixed(1),
    sub: "users",
    C: C
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Avg Tomato",
    value: ins.avgRt === null ? "—" : ins.avgRt + "%",
    sub: "critics",
    C: C
  })), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-4",
    style: {
      color: C.faint
    }
  }, "TOMATO is the critics' Tomatometer and META is Metacritic's Metascore. IMDb is the audience."), /*#__PURE__*/React.createElement("div", {
    className: "rounded-xl px-3.5 py-3 mb-4",
    style: {
      background: C.card,
      border: "1px solid " + C.line
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-medium mb-1",
    style: {
      color: C.mut
    }
  }, "Critic alignment"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm",
    style: {
      color: C.ink
    }
  }, alignText), align.n >= 5 ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 mt-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement(SignedBar, {
    value: Math.max(-1, Math.min(1, align.a)),
    C: C
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-xs shrink-0",
    style: {
      fontFamily: FONT_NUM,
      color: align.a >= 0 ? C.like : C.dislike
    }
  }, align.a >= 0 ? "+" : "", Math.round(align.a * 100))) : null, view.useCritics ? /*#__PURE__*/React.createElement("div", {
    className: "text-xs mt-2",
    style: {
      color: C.faint
    }
  }, "This is being used to rank your suggestions.") : /*#__PURE__*/React.createElement("div", {
    className: "text-xs mt-2",
    style: {
      color: C.faint
    }
  }, "Turn on \"Use critic scores\" in your household settings to factor this into suggestions.")), missing > 0 ? /*#__PURE__*/React.createElement("div", {
    className: "rounded-xl px-3.5 py-3 mb-4",
    style: {
      background: C.card,
      border: "1px solid " + C.line
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-medium mb-0.5",
    style: {
      color: C.ink
    }
  }, "Add Rotten Tomatoes for ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM
    }
  }, missing), " ", missing === 1 ? "title" : "titles"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-2.5",
    style: {
      color: C.mut
    }
  }, "Most titles already have all three built in. A free OMDb key fills the remaining gaps and keeps them current."), /*#__PURE__*/React.createElement("button", {
    onClick: hasKey ? onFetchScores : onOpenScores,
    disabled: fetching,
    className: "w-full py-2.5 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2",
    style: {
      background: fetching ? C.field : C.ink,
      color: fetching ? C.mut : C.bg
    }
  }, fetching ? "Fetching…" : hasKey ? "Get scores for these" : "Set up scores"), fetchMsg ? /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2 font-medium",
    style: {
      color: C.ink2
    }
  }, fetchMsg) : null) : null, /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement(Segmented, {
    C: C,
    value: sort,
    onChange: setSort,
    options: [["recent", "Recent"], ["critic", "Top rated"], ["mine", "Your picks"], ["title", "A–Z"]]
  })), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, rows.map(x => {
    const meta = RATING_META[String(x.r)];
    const col = meta.tone === "like" ? C.like : meta.tone === "dislike" ? C.dislike : C.ink2;
    const again = rewatch.indexOf(x.id) >= 0;
    return /*#__PURE__*/React.createElement("button", {
      key: x.id,
      onClick: () => onEdit(x.id),
      "aria-label": "Edit " + x.m.t,
      className: "w-full text-left rounded-xl p-2.5 flex gap-2.5 items-center focus:outline-none focus-visible:ring-2",
      style: {
        background: C.card,
        border: "1px solid " + C.line
      }
    }, /*#__PURE__*/React.createElement(Poster, {
      m: x.m,
      C: C,
      size: 40
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 min-w-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-sm font-medium truncate",
      style: {
        color: C.ink
      }
    }, x.m.t), /*#__PURE__*/React.createElement("div", {
      className: "text-xs mt-0.5 mb-1",
      style: {
        color: C.mut
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: FONT_NUM
      }
    }, x.m.y), x.ts ? " · " + fmtDate(x.ts) : "", again ? " · in the mix again" : ""), x.e ? /*#__PURE__*/React.createElement(ScoreChips, {
      e: x.e,
      C: C
    }) : /*#__PURE__*/React.createElement("span", {
      className: "text-xs",
      style: {
        color: C.faint
      }
    }, "No scores yet")), /*#__PURE__*/React.createElement("span", {
      className: "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm",
      "aria-label": "Your rating: " + meta.label,
      style: {
        color: col,
        background: C.field
      }
    }, meta.glyph), /*#__PURE__*/React.createElement("span", {
      className: "shrink-0 text-sm",
      style: {
        color: C.faint
      }
    }, "›"));
  })));
}

// ---------- Insights ----------
function InsightsTab({
  C,
  view,
  ins
}) {
  const maxGenre = Math.max(1, ...Object.values(ins.genreCount));
  const decades = Object.keys(ins.decadeCount).map(Number).sort((a, b) => a - b);
  const maxDec = Math.max(1, ...Object.values(ins.decadeCount));
  const topStudios = Object.entries(ins.studioCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topGenres = Object.entries(ins.genreCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (ins.totalRated < 3) {
    return /*#__PURE__*/React.createElement("div", {
      className: "pb-24 px-4 pt-4"
    }, /*#__PURE__*/React.createElement("h2", {
      className: "text-lg font-semibold tracking-tight mb-1",
      style: {
        color: C.ink
      }
    }, "Insights for ", view.label), /*#__PURE__*/React.createElement("div", {
      className: "text-center py-16 px-6"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-sm font-medium",
      style: {
        color: C.ink
      }
    }, "Rate a few titles to see your taste"), /*#__PURE__*/React.createElement("p", {
      className: "text-xs mt-1",
      style: {
        color: C.mut
      }
    }, "Once you've rated 3 or more, this becomes a live picture of what you watch, what you love, and where your gaps are.")));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "pb-24 px-4 pt-4"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-semibold tracking-tight mb-3",
    style: {
      color: C.ink
    }
  }, "Insights for ", view.label), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-2 mb-3"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Rated",
    value: ins.totalRated,
    C: C
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Loved",
    value: ins.counts.love,
    sub: ins.lovedRate + "% love rate",
    C: C
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Watched",
    value: ins.logCount,
    sub: "~" + ins.estHours + "h",
    C: C
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-2 mb-5"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Films",
    value: ins.movies,
    C: C
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Series",
    value: ins.series,
    C: C
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Variety",
    value: ins.entropy,
    sub: "of 100",
    C: C
  })), ins.affRows.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "mb-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-2.5"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-semibold",
    style: {
      color: C.ink
    }
  }, "Your taste"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: C.faint
    }
  }, "← dislike · like →")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2.5"
  }, ins.affRows.slice(0, 8).map(r => /*#__PURE__*/React.createElement("div", {
    key: r.g,
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs w-20 shrink-0 truncate",
    style: {
      color: C.ink2
    }
  }, lbl(r.g)), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement(SignedBar, {
    value: r.a,
    C: C
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-xs w-9 text-right shrink-0",
    style: {
      fontFamily: FONT_NUM,
      color: r.a >= 0 ? C.like : C.dislike
    }
  }, r.a >= 0 ? "+" : "", Math.round(r.a * 100)))))), /*#__PURE__*/React.createElement("section", {
    className: "mb-5"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-semibold mb-2.5",
    style: {
      color: C.ink
    }
  }, "What you watch most"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, topGenres.map(([g, c]) => /*#__PURE__*/React.createElement("div", {
    key: g,
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs w-20 shrink-0 truncate",
    style: {
      color: C.ink2
    }
  }, lbl(g)), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement(Bar, {
    value: c,
    max: maxGenre,
    C: C
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-xs w-6 text-right shrink-0",
    style: {
      fontFamily: FONT_NUM,
      color: C.mut
    }
  }, c))))), /*#__PURE__*/React.createElement("section", {
    className: "mb-5"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-semibold mb-1",
    style: {
      color: C.ink
    }
  }, "Your gaps"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-2.5",
    style: {
      color: C.mut
    }
  }, "Genres you've barely explored. Nudge the Discovery slider up to see more of these."), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, ins.gaps.map(x => /*#__PURE__*/React.createElement("span", {
    key: x.g,
    className: "text-xs font-medium px-2.5 py-1.5 rounded-full",
    style: {
      color: C.ink2,
      background: C.field,
      border: "1px solid " + C.line
    }
  }, lbl(x.g), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM,
      color: C.faint
    }
  }, x.c))))), decades.length > 1 && /*#__PURE__*/React.createElement("section", {
    className: "mb-5"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-semibold mb-2.5",
    style: {
      color: C.ink
    }
  }, "By decade"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-end gap-1.5",
    style: {
      height: 90
    }
  }, decades.map(d => {
    const c = ins.decadeCount[d];
    return /*#__PURE__*/React.createElement("div", {
      key: d,
      className: "flex-1 flex flex-col items-center justify-end gap-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-full rounded-t",
      style: {
        height: Math.max(4, c / maxDec * 70),
        background: C.ink2
      }
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-xs",
      style: {
        fontFamily: FONT_NUM,
        color: C.faint,
        fontSize: 9
      }
    }, String(d).slice(2), "s"));
  }))), /*#__PURE__*/React.createElement("section", {
    className: "mb-5"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-semibold mb-2.5",
    style: {
      color: C.ink
    }
  }, "Ratings"), /*#__PURE__*/React.createElement("div", {
    className: "flex rounded-lg overflow-hidden",
    style: {
      height: 34,
      border: "1px solid " + C.line
    }
  }, [["love", ins.counts.love, C.like], ["ok", ins.counts.ok, C.ink2], ["no", ins.counts.no, C.dislike]].map(([k, v, col]) => v > 0 ? /*#__PURE__*/React.createElement("div", {
    key: k,
    className: "flex items-center justify-center",
    style: {
      width: v / ins.totalRated * 100 + "%",
      background: col
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold",
    style: {
      color: "#fff",
      fontFamily: FONT_NUM
    }
  }, v)) : null)), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-4 mt-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: C.mut
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.like
    }
  }, "♥"), " Loved ", ins.counts.love), /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: C.mut
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.ink2
    }
  }, "✓"), " Seen ", ins.counts.ok), /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: C.mut
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.dislike
    }
  }, "✕"), " Not for me ", ins.counts.no))), topStudios.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "mb-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-semibold mb-2.5",
    style: {
      color: C.ink
    }
  }, "Top studios"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, topStudios.map(([s, c]) => /*#__PURE__*/React.createElement("span", {
    key: s,
    className: "text-xs font-medium px-2.5 py-1.5 rounded-full capitalize",
    style: {
      color: C.ink2,
      background: C.field,
      border: "1px solid " + C.line
    }
  }, s, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM,
      color: C.faint
    }
  }, c))))));
}
function Row({
  label,
  sub,
  right,
  onClick,
  C,
  danger
}) {
  const Comp = onClick ? "button" : "div";
  return /*#__PURE__*/React.createElement(Comp, {
    onClick: onClick,
    className: "w-full flex items-center justify-between gap-3 px-4 py-3 text-left focus:outline-none",
    style: {
      background: "transparent"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-medium",
    style: {
      color: danger ? C.dislike : C.ink
    }
  }, label), sub ? /*#__PURE__*/React.createElement("div", {
    className: "text-xs mt-0.5",
    style: {
      color: C.mut
    }
  }, sub) : null), right !== undefined ? right : onClick ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.faint
    }
  }, "›") : null);
}
function Toggle({
  on,
  onClick,
  C,
  label
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    className: "rounded-full transition-colors focus:outline-none focus-visible:ring-2 shrink-0",
    style: {
      width: 44,
      height: 26,
      background: on ? C.ink : C.line,
      padding: 3
    },
    "aria-pressed": on,
    "aria-label": label
  }, /*#__PURE__*/React.createElement("div", {
    className: "rounded-full transition-transform",
    style: {
      width: 20,
      height: 20,
      background: C.bg,
      transform: on ? "translateX(18px)" : "translateX(0)"
    }
  }));
}
function Group({
  title,
  C,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "mb-5"
  }, title ? /*#__PURE__*/React.createElement("div", {
    className: "px-4 mb-1.5 text-xs font-semibold uppercase",
    style: {
      color: C.mut,
      letterSpacing: "0.06em"
    }
  }, title) : null, /*#__PURE__*/React.createElement("div", {
    className: "rounded-xl overflow-hidden divide-y",
    style: {
      background: C.card,
      border: "1px solid " + C.line,
      borderColor: C.line
    }
  }, children));
}
function ProfileTab({
  C,
  profile,
  profiles,
  activeMember,
  theme,
  onTheme,
  onSwitch,
  onEditMember,
  onOpenHousehold,
  onTogglePin,
  onOpenCatalog,
  onOpenPacks,
  onOpenBackup,
  onOpenAdd,
  onOpenScores,
  onSignOut,
  onDeleteProfile,
  addedCount,
  catalogTotal,
  scoredCount
}) {
  const divStyle = {
    borderColor: C.line
  };
  const members = profile.members.order.map(id => profile.members.byId[id]);
  return /*#__PURE__*/React.createElement("div", {
    className: "pb-24 px-4 pt-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 mb-6 px-1"
  }, /*#__PURE__*/React.createElement(Avatar, {
    profile: profile,
    C: C,
    size: 52,
    active: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-lg font-semibold truncate",
    style: {
      color: C.ink
    }
  }, profile.name), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: C.mut
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM
    }
  }, members.length), members.length === 1 ? " person" : " people", " in this household"))), /*#__PURE__*/React.createElement(Group, {
    title: "Household",
    C: C
  }, members.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: m.id,
    style: i < members.length - 1 ? divStyle : null
  }, /*#__PURE__*/React.createElement(Row, {
    C: C,
    onClick: () => onEditMember(m.id),
    label: m.glyph + "  " + m.name,
    sub: bandLabel(m.band) + (m.series ? " · series" : "") + (m.useCritics ? " · critics" : "") + (m.recency >= 0.99 ? " · new only" : m.recency <= 0.01 ? " · any era" : "") + " · " + Object.keys(m.rated).length + " rated"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "-mt-3 mb-5"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onOpenHousehold,
    className: "w-full py-2.5 rounded-xl text-sm font-medium focus:outline-none focus-visible:ring-2",
    style: {
      color: C.ink2,
      border: "1px dashed " + C.faint
    }
  }, "Add someone to the household"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2 px-1",
    style: {
      color: C.faint
    }
  }, "Everyone gets their own taste, age limit and history. Pick who is watching on the Discover tab.")), /*#__PURE__*/React.createElement(Group, {
    title: "Account",
    C: C
  }, /*#__PURE__*/React.createElement("div", {
    style: divStyle
  }, /*#__PURE__*/React.createElement(Row, {
    label: "Lock with PIN",
    sub: profile.pin ? "This household is locked" : "Ask for a code to open",
    C: C,
    right: /*#__PURE__*/React.createElement(Toggle, {
      on: !!profile.pin,
      onClick: onTogglePin,
      C: C,
      label: "Lock with PIN"
    })
  })), /*#__PURE__*/React.createElement(Row, {
    label: "Dark mode",
    C: C,
    right: /*#__PURE__*/React.createElement(Toggle, {
      on: theme === "dark",
      onClick: () => onTheme(theme === "dark" ? "light" : "dark"),
      C: C,
      label: "Dark mode"
    })
  })), /*#__PURE__*/React.createElement(Group, {
    title: "Catalog",
    C: C
  }, /*#__PURE__*/React.createElement("div", {
    style: divStyle
  }, /*#__PURE__*/React.createElement(Row, {
    label: "Update from TMDB",
    sub: catalogTotal + " titles · " + addedCount + " added",
    onClick: onOpenCatalog,
    C: C
  })), /*#__PURE__*/React.createElement("div", {
    style: divStyle
  }, /*#__PURE__*/React.createElement(Row, {
    label: "Import a pack",
    sub: "Add new releases from a .json file",
    onClick: onOpenPacks,
    C: C
  })), /*#__PURE__*/React.createElement("div", {
    style: divStyle
  }, /*#__PURE__*/React.createElement(Row, {
    label: "Add a title",
    sub: "Enter one film or series by hand",
    onClick: onOpenAdd,
    C: C
  })), /*#__PURE__*/React.createElement(Row, {
    label: "Critic scores",
    sub: scoredCount + " of " + catalogTotal + " titles scored",
    onClick: onOpenScores,
    C: C
  })), /*#__PURE__*/React.createElement(Group, {
    title: "Data",
    C: C
  }, /*#__PURE__*/React.createElement("div", {
    style: divStyle
  }, /*#__PURE__*/React.createElement(Row, {
    label: "Backup & restore",
    sub: "Move everything to another device",
    onClick: onOpenBackup,
    C: C
  })), /*#__PURE__*/React.createElement(Row, {
    label: "Switch household",
    onClick: onSwitch,
    C: C
  })), /*#__PURE__*/React.createElement(Group, {
    C: C
  }, profiles.order.length > 1 ? /*#__PURE__*/React.createElement("div", {
    style: divStyle
  }, /*#__PURE__*/React.createElement(Row, {
    label: "Delete this household",
    sub: "Removes every member and their ratings from this device",
    onClick: onDeleteProfile,
    C: C,
    danger: true
  })) : null, /*#__PURE__*/React.createElement(Row, {
    label: "Sign out",
    onClick: onSignOut,
    C: C
  })), /*#__PURE__*/React.createElement("div", {
    className: "text-center text-xs mt-2",
    style: {
      color: C.faint
    }
  }, "Movie Night · version ", APP_VERSION, " · on-device · no account, no ads"));
}

// ---------- Add / edit a household member ----------
function MemberSheet({
  open,
  onClose,
  C,
  member,
  onSave,
  onDelete,
  canDelete
}) {
  const [name, setName] = useState("");
  const [band, setBand] = useState("a");
  const [glyph, setGlyph] = useState(AVATAR_GLYPHS[0]);
  const [series, setSeries] = useState(false);
  const [useCritics, setUseCritics] = useState(false);
  const [recency, setRecency] = useState(0.5);
  const [confirmDel, setConfirmDel] = useState(false);
  const [loaded, setLoaded] = useState(null);
  const key = member ? member.id : "new";
  if (loaded !== key) {
    setLoaded(key);
    setName(member ? member.name : "");
    setBand(member ? member.band : "a");
    setGlyph(member ? member.glyph : AVATAR_GLYPHS[0]);
    setSeries(member ? member.series : false);
    setUseCritics(member ? !!member.useCritics : false);
    setRecency(member && typeof member.recency === "number" ? member.recency : 0.5);
    setConfirmDel(false);
  }
  const valid = name.trim().length > 0;
  return /*#__PURE__*/React.createElement(Sheet, {
    open: open,
    onClose: onClose,
    C: C,
    title: member ? "Edit " + member.name : "Add someone"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-center mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center rounded-full",
    style: {
      width: 64,
      height: 64,
      background: C.ink,
      color: C.bg,
      fontSize: 26,
      fontWeight: 600
    }
  }, glyph)), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap justify-center gap-2 mb-5"
  }, AVATAR_GLYPHS.map(g => /*#__PURE__*/React.createElement("button", {
    key: g,
    onClick: () => setGlyph(g),
    "aria-label": "Symbol " + g,
    className: "w-9 h-9 rounded-full text-sm focus:outline-none focus-visible:ring-2",
    style: glyph === g ? {
      background: C.ink,
      color: C.bg
    } : {
      background: C.field,
      color: C.ink2,
      border: "1px solid " + C.line
    }
  }, g))), /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-medium mb-1.5",
    style: {
      color: C.mut
    }
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "Their name",
    className: "w-full px-3.5 py-2.5 rounded-lg text-sm mb-4 focus:outline-none focus-visible:ring-2",
    style: {
      background: C.field,
      color: C.ink,
      border: "1px solid " + C.line
    }
  }), /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-medium mb-1.5",
    style: {
      color: C.mut
    }
  }, "Content level"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-2",
    style: {
      color: C.faint
    }
  }, "They will never be shown anything above this, and neither will the group when they are watching."), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2 mb-4"
  }, BANDS.map(b => /*#__PURE__*/React.createElement(Chip, {
    key: b.id,
    label: b.label,
    on: band === b.id,
    onClick: () => setBand(b.id),
    C: C
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between py-2 mb-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-medium",
    style: {
      color: C.ink
    }
  }, "Include TV series"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: C.mut
    }
  }, "Mix series into their recommendations")), /*#__PURE__*/React.createElement(Toggle, {
    on: series,
    onClick: () => setSeries(!series),
    C: C,
    label: "Include TV series"
  })), /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-medium mb-1.5",
    style: {
      color: C.mut
    }
  }, "Release year"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-2",
    style: {
      color: C.faint
    }
  }, "How much newer releases are favoured. Older titles are ranked lower, never hidden — worth leaving on Any era for younger members, since most children's films are older."), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2 mb-5"
  }, [[0, "Any era"], [0.5, "Lean recent"], [1, "Strongly recent"]].map(o => /*#__PURE__*/React.createElement(Chip, {
    key: o[0],
    label: o[1],
    on: Math.abs(recency - o[0]) < 0.01,
    onClick: () => setRecency(o[0]),
    C: C
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between py-2 mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pr-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-medium",
    style: {
      color: C.ink
    }
  }, "Use critic scores"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: C.mut
    }
  }, "Factor IMDb, Rotten Tomatoes and Metacritic into their suggestions, weighted by how much they have historically agreed with critics")), /*#__PURE__*/React.createElement(Toggle, {
    on: useCritics,
    onClick: () => setUseCritics(!useCritics),
    C: C,
    label: "Use critic scores"
  })), /*#__PURE__*/React.createElement("button", {
    disabled: !valid,
    onClick: () => onSave({
      name,
      band,
      glyph,
      series,
      useCritics,
      recency
    }),
    className: "w-full py-2.5 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2",
    style: {
      background: C.ink,
      color: C.bg,
      opacity: valid ? 1 : 0.4
    }
  }, member ? "Save changes" : "Add to household"), member && canDelete ? /*#__PURE__*/React.createElement("button", {
    onClick: () => confirmDel ? onDelete(member.id) : setConfirmDel(true),
    className: "w-full mt-2 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2",
    style: {
      color: C.dislike,
      border: "1px solid " + C.line
    }
  }, confirmDel ? "Tap again to remove " + member.name : "Remove from household") : null);
}

// ---------- Catalog / TMDB sheet ----------
function CatalogSheet({
  open,
  onClose,
  C,
  tmdbKey,
  setTmdbKey,
  onSync,
  busy,
  msg,
  builtinCount,
  addedCount,
  added,
  onRemoveAdded,
  onClearAdded
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  return /*#__PURE__*/React.createElement(Sheet, {
    open: open,
    onClose: onClose,
    C: C,
    title: "Update catalog"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm mb-4",
    style: {
      color: C.mut
    }
  }, builtinCount, " built-in · ", addedCount, " added. Pull the latest releases from TMDB — free, and nothing about you is sent."), /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-medium mb-1.5",
    style: {
      color: C.mut
    }
  }, "TMDB API key"), /*#__PURE__*/React.createElement("input", {
    value: tmdbKey,
    onChange: e => setTmdbKey(e.target.value),
    placeholder: "Paste your key",
    autoComplete: "off",
    autoCapitalize: "none",
    spellCheck: false,
    className: "w-full px-3.5 py-2.5 rounded-lg text-sm mb-2 focus:outline-none focus-visible:ring-2",
    style: {
      background: C.field,
      color: C.ink,
      border: "1px solid " + C.line,
      fontFamily: FONT_NUM
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onSync,
    disabled: busy,
    className: "w-full py-2.5 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2",
    style: {
      background: busy ? C.field : C.ink,
      color: busy ? C.mut : C.bg
    }
  }, busy ? "Updating…" : "Update catalog now"), msg ? /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2 font-medium",
    style: {
      color: C.ink2
    }
  }, msg) : null, /*#__PURE__*/React.createElement("a", {
    href: "https://www.themoviedb.org/settings/api",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "inline-block text-xs mt-2 font-medium focus:outline-none",
    style: {
      color: C.mut
    }
  }, "Get a free key ↗"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-3",
    style: {
      color: C.faint
    }
  }, "Age ratings from TMDB are estimated conservatively — check before showing young children."), addedCount > 0 && /*#__PURE__*/React.createElement("div", {
    className: "mt-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold uppercase",
    style: {
      color: C.mut,
      letterSpacing: "0.06em"
    }
  }, "Added titles"), /*#__PURE__*/React.createElement("button", {
    onClick: () => confirmClear ? (onClearAdded(), setConfirmClear(false)) : setConfirmClear(true),
    className: "text-xs font-medium focus:outline-none",
    style: {
      color: C.dislike
    }
  }, confirmClear ? "Tap to confirm" : "Clear all")), /*#__PURE__*/React.createElement("div", {
    className: "rounded-xl overflow-hidden",
    style: {
      border: "1px solid " + C.line
    }
  }, added.slice(0, 40).map(m => /*#__PURE__*/React.createElement("div", {
    key: m.id,
    className: "flex items-center justify-between gap-2 px-3 py-2",
    style: {
      borderBottom: "1px solid " + C.line
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs truncate",
    style: {
      color: C.ink2
    }
  }, m.t, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM,
      color: C.faint
    }
  }, m.y)), /*#__PURE__*/React.createElement("button", {
    onClick: () => onRemoveAdded(m.id),
    "aria-label": "Remove " + m.t,
    className: "text-xs px-2 focus:outline-none",
    style: {
      color: C.dislike
    }
  }, "✕"))))));
}

// ---------- Packs sheet ----------
function PacksSheet({
  open,
  onClose,
  C,
  packFileRef,
  onPackFile,
  onPastePack,
  packMsg,
  onCopyPrompt,
  onCopyExample,
  onDownloadExample,
  copyMsg
}) {
  const [paste, setPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  return /*#__PURE__*/React.createElement(Sheet, {
    open: open,
    onClose: onClose,
    C: C,
    title: "Catalog packs"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm mb-4",
    style: {
      color: C.mut
    }
  }, "Ask any AI for a pack of new releases, then bring it in here. No key needed."), /*#__PURE__*/React.createElement("input", {
    ref: packFileRef,
    type: "file",
    accept: "application/json,.json",
    onChange: onPackFile,
    style: {
      display: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mb-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => packFileRef.current && packFileRef.current.click(),
    className: "flex-1 py-2.5 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2",
    style: {
      background: C.ink,
      color: C.bg
    }
  }, "Upload .json file"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowPaste(!showPaste),
    className: "flex-1 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2",
    style: {
      color: C.ink,
      border: "1px solid " + C.line
    }
  }, showPaste ? "Hide paste" : "Paste instead")), showPaste && /*#__PURE__*/React.createElement("div", {
    className: "mb-2"
  }, /*#__PURE__*/React.createElement("textarea", {
    value: paste,
    onChange: e => setPaste(e.target.value),
    rows: 3,
    placeholder: "{\"titles\":[ … ]}",
    className: "w-full rounded-lg p-2.5 text-xs focus:outline-none focus-visible:ring-2",
    style: {
      background: C.field,
      color: C.ink,
      border: "1px solid " + C.line,
      fontFamily: FONT_NUM
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      onPastePack(paste);
      setPaste("");
    },
    className: "mt-1.5 w-full py-2 rounded-lg text-xs font-semibold focus:outline-none",
    style: {
      background: C.field,
      color: C.ink,
      border: "1px solid " + C.line
    }
  }, "Import pasted pack")), packMsg ? /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-2 font-medium",
    style: {
      color: C.ink2
    }
  }, packMsg) : null, /*#__PURE__*/React.createElement("div", {
    className: "mt-5 mb-2 text-xs font-semibold uppercase",
    style: {
      color: C.mut,
      letterSpacing: "0.06em"
    }
  }, "The prompt"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm mb-2",
    style: {
      color: C.mut
    }
  }, "Copy this into any AI, replace the last line with what you want, then upload the reply."), /*#__PURE__*/React.createElement("button", {
    onClick: onCopyPrompt,
    className: "w-full py-2.5 rounded-lg text-sm font-semibold mb-2 focus:outline-none focus-visible:ring-2",
    style: {
      background: C.ink,
      color: C.bg
    }
  }, "Copy prompt"), /*#__PURE__*/React.createElement("textarea", {
    readOnly: true,
    value: PACK_PROMPT,
    rows: 9,
    onFocus: e => e.target.select(),
    className: "w-full rounded-lg p-2.5 text-xs focus:outline-none",
    style: {
      background: C.field,
      color: C.ink2,
      border: "1px solid " + C.line,
      fontFamily: FONT_NUM
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "mt-5 mb-2 text-xs font-semibold uppercase",
    style: {
      color: C.mut,
      letterSpacing: "0.06em"
    }
  }, "Example file"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onDownloadExample,
    className: "flex-1 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2",
    style: {
      color: C.ink,
      border: "1px solid " + C.line
    }
  }, "Download example"), /*#__PURE__*/React.createElement("button", {
    onClick: onCopyExample,
    className: "flex-1 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2",
    style: {
      color: C.ink,
      border: "1px solid " + C.line
    }
  }, "Copy example")), copyMsg ? /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2 font-medium",
    style: {
      color: C.ink2
    }
  }, copyMsg) : null);
}

// ---------- Backup sheet ----------
function BackupSheet({
  open,
  onClose,
  C,
  onExport,
  onImport,
  backupMsg
}) {
  const [paste, setPaste] = useState("");
  const [show, setShow] = useState(false);
  return /*#__PURE__*/React.createElement(Sheet, {
    open: open,
    onClose: onClose,
    C: C,
    title: "Backup & restore"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm mb-4",
    style: {
      color: C.mut
    }
  }, "Copy everything on this device — all profiles, ratings, watchlists, and added titles — then restore it elsewhere. Your TMDB key is never included."), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mb-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onExport,
    className: "flex-1 py-2.5 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2",
    style: {
      background: C.ink,
      color: C.bg
    }
  }, "Copy backup"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShow(!show),
    className: "flex-1 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2",
    style: {
      color: C.ink,
      border: "1px solid " + C.line
    }
  }, show ? "Hide" : "Restore…")), show && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("textarea", {
    value: paste,
    onChange: e => setPaste(e.target.value),
    rows: 3,
    placeholder: "Paste a backup here",
    className: "w-full rounded-lg p-2.5 text-xs focus:outline-none focus-visible:ring-2",
    style: {
      background: C.field,
      color: C.ink,
      border: "1px solid " + C.line,
      fontFamily: FONT_NUM
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      onImport(paste);
      setPaste("");
    },
    className: "mt-1.5 w-full py-2 rounded-lg text-xs font-semibold focus:outline-none",
    style: {
      background: C.field,
      color: C.ink,
      border: "1px solid " + C.line
    }
  }, "Restore this backup"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2",
    style: {
      color: C.faint
    }
  }, "Restoring replaces everything currently on this device.")), backupMsg ? /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2 font-medium",
    style: {
      color: C.ink2
    }
  }, backupMsg) : null);
}

// ---------- Add title sheet ----------
function AddTitleSheet({
  open,
  onClose,
  C,
  onAdd
}) {
  const [f, setF] = useState({
    t: "",
    y: "",
    kind: "m",
    band: "a",
    g: [],
    tg: [],
    jp: ""
  });
  const reset = () => setF({
    t: "",
    y: "",
    kind: "m",
    band: "a",
    g: [],
    tg: [],
    jp: ""
  });
  const toggle = (key, val, max) => setF(s => ({
    ...s,
    [key]: s[key].includes(val) ? s[key].filter(x => x !== val) : s[key].length < max ? [...s[key], val] : s[key]
  }));
  return /*#__PURE__*/React.createElement(Sheet, {
    open: open,
    onClose: () => {
      onClose();
    },
    C: C,
    title: "Add a title"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mb-3"
  }, /*#__PURE__*/React.createElement("input", {
    value: f.t,
    onChange: e => setF({
      ...f,
      t: e.target.value
    }),
    placeholder: "Title",
    className: "flex-1 px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus-visible:ring-2",
    style: {
      background: C.field,
      color: C.ink,
      border: "1px solid " + C.line
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: f.y,
    onChange: e => setF({
      ...f,
      y: e.target.value
    }),
    placeholder: "Year",
    inputMode: "numeric",
    className: "w-20 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus-visible:ring-2",
    style: {
      background: C.field,
      color: C.ink,
      border: "1px solid " + C.line,
      fontFamily: FONT_NUM
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2 mb-3"
  }, [["m", "Movie"], ["s", "Series"]].map(([v, L]) => /*#__PURE__*/React.createElement(Chip, {
    key: v,
    label: L,
    on: f.kind === v,
    onClick: () => setF({
      ...f,
      kind: v
    }),
    C: C
  })), BANDS.map(b => /*#__PURE__*/React.createElement(Chip, {
    key: b.id,
    label: b.label,
    on: f.band === b.id,
    onClick: () => setF({
      ...f,
      band: b.id
    }),
    C: C
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-medium mb-1.5",
    style: {
      color: C.mut
    }
  }, "Genres (up to 3)"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2 mb-3"
  }, GENRE_OPTIONS.map(g => /*#__PURE__*/React.createElement(Chip, {
    key: g,
    label: lbl(g),
    on: f.g.includes(g),
    onClick: () => toggle("g", g, 3),
    C: C
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-medium mb-1.5",
    style: {
      color: C.mut
    }
  }, "Themes (optional)"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2 mb-4"
  }, THEME_OPTIONS.map(g => /*#__PURE__*/React.createElement(Chip, {
    key: g,
    label: lbl(g),
    on: f.tg.includes(g),
    onClick: () => toggle("tg", g, 3),
    C: C
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const ok = onAdd(f);
      if (ok) reset();
    },
    className: "w-full py-2.5 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2",
    style: {
      background: C.ink,
      color: C.bg
    }
  }, "Add to library"));
}

// ---------- Critic scores sheet ----------
function ScoresSheet({
  open,
  onClose,
  C,
  omdbKey,
  setOmdbKey,
  onFetchWatched,
  onFetchAll,
  busy,
  msg,
  progress,
  scoredCount,
  rtCount,
  catalogTotal,
  builtDate
}) {
  return /*#__PURE__*/React.createElement(Sheet, {
    open: open,
    onClose: onClose,
    C: C,
    title: "Critic scores"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm mb-1",
    style: {
      color: C.mut
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM,
      color: C.ink
    }
  }, scoredCount), " of", " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM,
      color: C.ink
    }
  }, catalogTotal), " titles have an IMDb rating built in — no key needed. ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM,
      color: C.ink
    }
  }, rtCount), " also have Rotten Tomatoes."), /*#__PURE__*/React.createElement("p", {
    className: "text-sm mb-4",
    style: {
      color: C.mut
    }
  }, "Built in and taken on ", builtDate, ": IMDb user ratings from IMDb's official public dataset, plus the critics' Tomatometer and Metacritic Metascore from Wikidata. Rotten Tomatoes' separate audience score has no free source anywhere, so it is not shown rather than guessed at. A free OMDb key fills remaining gaps and refreshes figures as they drift."), /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-medium mb-1.5",
    style: {
      color: C.mut
    }
  }, "OMDb API key"), /*#__PURE__*/React.createElement("input", {
    value: omdbKey,
    onChange: e => setOmdbKey(e.target.value),
    placeholder: "Paste your key",
    autoComplete: "off",
    autoCapitalize: "none",
    spellCheck: false,
    className: "w-full px-3.5 py-2.5 rounded-lg text-sm mb-2 focus:outline-none focus-visible:ring-2",
    style: {
      background: C.field,
      color: C.ink,
      border: "1px solid " + C.line,
      fontFamily: FONT_NUM
    }
  }), /*#__PURE__*/React.createElement("a", {
    href: "https://www.omdbapi.com/apikey.aspx",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "inline-block text-xs mb-4 font-medium focus:outline-none",
    style: {
      color: C.mut
    }
  }, "Get a free key ↗"), /*#__PURE__*/React.createElement("button", {
    onClick: onFetchWatched,
    disabled: busy,
    className: "w-full py-2.5 rounded-lg text-sm font-semibold mb-2 focus:outline-none focus-visible:ring-2",
    style: {
      background: busy ? C.field : C.ink,
      color: busy ? C.mut : C.bg
    }
  }, busy ? "Fetching…" : "Add Rotten Tomatoes for what you have watched"), /*#__PURE__*/React.createElement("button", {
    onClick: onFetchAll,
    disabled: busy,
    className: "w-full py-2.5 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2",
    style: {
      color: C.ink,
      border: "1px solid " + C.line
    }
  }, "Fetch the whole catalog"), busy && progress ? /*#__PURE__*/React.createElement("div", {
    className: "mt-3"
  }, /*#__PURE__*/React.createElement(Bar, {
    value: progress.done,
    max: progress.total,
    C: C
  }), /*#__PURE__*/React.createElement("div", {
    className: "text-xs mt-1.5",
    style: {
      color: C.mut,
      fontFamily: FONT_NUM
    }
  }, progress.done, " / ", progress.total)) : null, msg ? /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2 font-medium",
    style: {
      color: C.ink2
    }
  }, msg) : null, /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-4",
    style: {
      color: C.faint
    }
  }, "The free tier allows 1,000 lookups a day, so a full catalog pass takes one sitting. Anything fetched is stored on this device and never re-fetched. Coverage is imperfect — Rotten Tomatoes is often missing for older, anime and non-US titles, in which case the built-in IMDb rating simply stays."), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2",
    style: {
      color: C.faint
    }
  }, "Turn scores on per person under Household, so a child's picks stay driven by their own taste if you prefer."));
}

// ---------- Change your verdict on something already watched ----------
function WatchedEditSheet({
  open,
  onClose,
  C,
  m,
  entry,
  rating,
  again,
  onRate,
  onToggleAgain,
  onClear
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [loaded, setLoaded] = useState(null);
  const key = m ? m.id : "none";
  if (loaded !== key) {
    setLoaded(key);
    setConfirmClear(false);
  }
  if (!m) return null;
  return /*#__PURE__*/React.createElement(Sheet, {
    open: open,
    onClose: onClose,
    C: C,
    title: m.t
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3 mb-5"
  }, /*#__PURE__*/React.createElement(Poster, {
    m: m,
    C: C,
    size: 56
  }), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0 flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm mb-1.5",
    style: {
      color: C.mut
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM
    }
  }, m.y), " · ", bandLabel(m.b), m.k === "s" ? " · Series" : "", " · ", lbl(m.g[0])), entry ? /*#__PURE__*/React.createElement(ScoreChips, {
    e: entry,
    C: C
  }) : /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: C.faint
    }
  }, "No critic scores yet"))), /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-medium mb-1.5",
    style: {
      color: C.mut
    }
  }, "Your verdict"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-2.5",
    style: {
      color: C.faint
    }
  }, "Changed your mind after a rewatch? Set it here and the recommendations adjust."), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mb-5"
  }, [2, 1, -1].map(r => {
    const meta = RATING_META[String(r)];
    const on = rating === r;
    const col = meta.tone === "like" ? C.like : meta.tone === "dislike" ? C.dislike : C.ink;
    const bg = meta.tone === "like" ? C.likeBg : meta.tone === "dislike" ? C.dislikeBg : C.field;
    return /*#__PURE__*/React.createElement("button", {
      key: r,
      onClick: () => onRate(r),
      "aria-label": "Set to " + meta.label,
      className: "flex-1 flex items-center justify-center gap-1.5 h-11 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2",
      style: on ? {
        background: col,
        color: "#fff"
      } : {
        background: bg,
        color: col,
        border: "1px solid " + (meta.tone === "neutral" ? C.line : "transparent")
      }
    }, /*#__PURE__*/React.createElement("span", null, meta.glyph), /*#__PURE__*/React.createElement("span", null, meta.label));
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between py-2 mb-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pr-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-medium",
    style: {
      color: C.ink
    }
  }, "Suggest this again"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: C.mut
    }
  }, "Put it back among your picks so you can rewatch it, without losing your rating")), /*#__PURE__*/React.createElement(Toggle, {
    on: again,
    onClick: onToggleAgain,
    C: C,
    label: "Suggest this again"
  })), /*#__PURE__*/React.createElement("a", {
    href: justWatchUrl(m),
    target: "_blank",
    rel: "noopener noreferrer",
    className: "block w-full mt-3 py-2.5 rounded-lg text-sm font-medium text-center focus:outline-none",
    style: {
      color: C.ink,
      border: "1px solid " + C.line
    }
  }, "Find where to watch ↗"), /*#__PURE__*/React.createElement("button", {
    onClick: () => confirmClear ? onClear() : setConfirmClear(true),
    className: "w-full mt-2 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2",
    style: {
      color: C.dislike,
      border: "1px solid " + C.line
    }
  }, confirmClear ? "Tap again to remove your rating" : "Remove from watched"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2",
    style: {
      color: C.faint
    }
  }, "Removing clears your rating entirely and returns it to the suggestion pool as if unseen."));
}

// ============================================================
//  Root
// ============================================================
function App() {
  const [booted, setBooted] = useState(false);
  const [theme, setTheme] = useState("light");
  const [profiles, setProfiles] = useState({
    order: [],
    byId: {}
  });
  const [activeId, setActiveId] = useState(null);
  const [screen, setScreen] = useState("gate"); // gate | create | app
  const [tab, setTab] = useState("discover");
  const [mood, setMood] = useState("any");
  const [explore, setExplore] = useState(0.35);
  const [nonce, setNonce] = useState(1);
  const [query, setQuery] = useState("");
  const [rateView, setRateView] = useState("browse");
  const [rateFilters, setRateFilters] = useState({
    unrated: false,
    kind: "all",
    genre: "",
    decade: "",
    sort: "popular"
  });
  const [rateShown, setRateShown] = useState(60);
  const [library, setLibrary] = useState({
    packs: {},
    custom: {}
  });
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [packsOpen, setPacksOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [tmdbKey, setTmdbKey] = useState("");
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [packMsg, setPackMsg] = useState("");
  const [copyMsg, setCopyMsg] = useState("");
  const [backupMsg, setBackupMsg] = useState("");
  const [toast, setToast] = useState(null);
  const [pinSetup, setPinSetup] = useState(false);
  const [memberSheet, setMemberSheet] = useState(null); // null | "new" | memberId
  const [scores, setScores] = useState({});
  const [omdbKey, setOmdbKey] = useState("");
  const [scoresOpen, setScoresOpen] = useState(false);
  const [scoreBusy, setScoreBusy] = useState(false);
  const [scoreMsg, setScoreMsg] = useState("");
  const [scoreProgress, setScoreProgress] = useState(null);
  const [watchedSort, setWatchedSort] = useState("recent");
  const [editId, setEditId] = useState(null);
  const packFileRef = useRef(null);
  const impRef = useRef({});
  const recentRef = useRef(new Set());
  const C = useMemo(() => ({
    ...THEMES[theme],
    name: theme
  }), [theme]);
  const profile = activeId ? profiles.byId[activeId] : null;

  // ---------- Boot: load everything from the device ----------
  useEffect(() => {
    let alive = true;
    (async () => {
      let lib = {
        packs: {},
        custom: {}
      };
      const rawLib = await sGet(KEY_LIB);
      if (rawLib) {
        try {
          lib = sanitizeLibrary(JSON.parse(rawLib));
        } catch (e) {}
      }
      applyLibrary(lib);
      let ps = {
        order: [],
        byId: {}
      };
      const rawP = await sGet(KEY_PROFILES);
      if (rawP) {
        try {
          const j = JSON.parse(rawP);
          const byId = {},
            order = [];
          (Array.isArray(j.order) ? j.order : []).forEach(id => {
            const sp = sanitizeProfile(j.byId && j.byId[id]);
            if (sp) {
              byId[sp.id] = sp;
              order.push(sp.id);
            }
          });
          ps = {
            order,
            byId
          };
        } catch (e) {}
      }
      let appS = {};
      const rawApp = await sGet(KEY_APP);
      if (rawApp) {
        try {
          appS = JSON.parse(rawApp) || {};
        } catch (e) {}
      }
      const k = await sGet(KEY_TMDB);
      const ok2 = await sGet(KEY_OMDB);
      let sc = {};
      const rawSc = await sGet(KEY_SCORES);
      if (rawSc) {
        try {
          sc = sanitizeScores(JSON.parse(rawSc));
        } catch (e) {}
      }
      if (!alive) return;
      setLibrary(lib);
      setProfiles(ps);
      if (appS.theme === "dark" || appS.theme === "light") setTheme(appS.theme);
      if (typeof appS.explore === "number") setExplore(Math.min(1, Math.max(0, appS.explore)));
      if (k) setTmdbKey(k);
      if (ok2) setOmdbKey(ok2);
      setScores(sc);
      setScreen(ps.order.length === 0 ? "create" : "gate");
      setCatalogVersion(v => v + 1);
      setBooted(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ---------- Persist ----------
  useEffect(() => {
    if (!booted) return;
    const payload = {
      order: profiles.order,
      byId: {}
    };
    profiles.order.forEach(id => {
      const p = profiles.byId[id];
      if (!p) return;
      if (id === activeId && p.members) {
        const mid = p.active && p.active[0] || p.members.order[0];
        const byId = {
          ...p.members.byId
        };
        if (byId[mid]) byId[mid] = {
          ...byId[mid],
          imp: impRef.current
        };
        payload.byId[id] = {
          ...p,
          members: {
            order: p.members.order,
            byId
          }
        };
      } else {
        payload.byId[id] = p;
      }
    });
    sSet(KEY_PROFILES, JSON.stringify(payload));
  }, [profiles, activeId, booted]);
  useEffect(() => {
    if (booted) sSet(KEY_APP, JSON.stringify({
      theme,
      explore,
      lastTab: tab
    }));
  }, [theme, explore, tab, booted]);
  useEffect(() => {
    if (booted) sSet(KEY_LIB, JSON.stringify(library));
  }, [library, booted]);
  useEffect(() => {
    if (booted) sSet(KEY_SCORES, JSON.stringify(scores));
  }, [scores, booted]);
  useEffect(() => {
    setRateShown(60);
  }, [query, rateFilters, activeId]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ---------- Derived ----------
  // Built-in IMDb ratings ship with the app; anything fetched lays over them.
  const allScores = useMemo(() => mergeScores(scores), [scores]);
  // `mv` is the household view: one member, or several merged for a shared session.
  const mv = useMemo(() => profile ? memberView(profile) : null, [profile, catalogVersion]);
  const model = useMemo(() => {
    if (!profile || !mv) return null;
    return blendModels(mv.members.map(m => buildModel(m.rated, m.ratedOrder, m.watchlog, allScores)));
  }, [mv, allScores, catalogVersion]);
  const pool = useMemo(() => {
    if (!mv) return [];
    const rank = BAND_RANK[mv.band];
    const hidden = new Set(mv.hidden);
    return MOVIE_LIST.filter(m => BAND_RANK[m.b] <= rank && (mv.series || m.k !== "s") && (mv.rated[m.id] === undefined || mv.rewatch.indexOf(m.id) >= 0) && !hidden.has(m.id));
  }, [mv, catalogVersion]);
  const recs = useMemo(() => {
    if (!mv || !model) return [];
    const mo = MOODS.find(x => x.id === mood);
    const ctx = {
      explore,
      moodGenres: mo && mo.g ? mo.g : null,
      recent: recentRef.current,
      imp: impRef.current,
      nonce,
      rated: mv.rated,
      useCritics: mv.useCritics,
      scores: allScores,
      recency: mv.recency
    };
    const scored = pool.map(m => ({
      m,
      sc: scoreTitle(m, model, ctx)
    })).sort((a, b) => b.sc - a.sc);
    return assembleBatch(scored, model, ctx);
  }, [pool, model, mood, explore, nonce, allScores, mv]);

  // Impressions and "recently shown" are recorded when the user explicitly asks
  // for different picks — not on every re-render. Otherwise rating one card
  // would silently replace the whole batch underneath the user.
  const rotate = () => {
    recs.forEach(it => {
      impRef.current[it.m.id] = (impRef.current[it.m.id] || 0) + 1;
      recentRef.current.add(it.m.id);
    });
    if (recentRef.current.size > 40) recentRef.current = new Set(Array.from(recentRef.current).slice(-24));
    setNonce(n => n + 1);
  };
  const ins = useMemo(() => {
    if (!mv) return null;
    // Merged order for a group view: interleave by keeping each member's sequence.
    const order = [];
    mv.members.forEach(m => m.ratedOrder.forEach(id => {
      if (order.indexOf(id) < 0) order.push(id);
    }));
    return computeInsights(mv.rated, order, mv.hidden, mv.watchlog, allScores);
  }, [mv, allScores, catalogVersion]);

  // The browsable pool. The age ceiling applies to search as well as browsing,
  // so a child's profile can never reach an adult title by typing its name.
  const results = useMemo(() => {
    if (!mv) return [];
    const q = query.trim().toLowerCase();
    const rank = BAND_RANK[mv.band];
    const f = rateFilters;
    const list = MOVIE_LIST.filter(m => {
      if (BAND_RANK[m.b] > rank) return false;
      if (q && m.t.toLowerCase().indexOf(q) < 0) return false;
      if (f.kind === "m" && m.k === "s") return false;
      if (f.kind === "s" && m.k !== "s") return false;
      if (f.unrated && mv.rated[m.id] !== undefined) return false;
      if (f.genre && m.g.indexOf(f.genre) < 0) return false;
      if (f.decade) {
        const dec = Math.floor(m.y / 10) * 10;
        if (f.decade === "older") {
          if (dec >= 1980) return false;
        } else if (dec !== Number(f.decade)) return false;
      }
      return true;
    });
    const im = m => {
      const e = allScores[m.id];
      return e && e.imdb !== undefined ? e.imdb : 0;
    };
    if (f.sort === "year") list.sort((a, b) => b.y - a.y || b.p - a.p);else if (f.sort === "imdb") list.sort((a, b) => im(b) - im(a) || b.p - a.p);else if (f.sort === "title") list.sort((a, b) => a.t.localeCompare(b.t));else list.sort((a, b) => b.p - a.p || a.t.localeCompare(b.t));
    return list;
  }, [query, mv, rateFilters, allScores, catalogVersion]);

  // How much of what this profile could see has been marked.
  const rateTotals = useMemo(() => {
    if (!mv) return {
      total: 0,
      rated: 0
    };
    const rank = BAND_RANK[mv.band];
    let total = 0,
      done = 0;
    MOVIE_LIST.forEach(m => {
      if (BAND_RANK[m.b] > rank) return;
      total++;
      if (mv.rated[m.id] !== undefined) done++;
    });
    return {
      total,
      rated: done
    };
  }, [mv, catalogVersion]);
  const watchlistTitles = useMemo(() => mv ? mv.watchlist.map(id => MOVIE_BY_ID[id]).filter(Boolean) : [], [mv, catalogVersion]);
  const addedList = useMemo(() => Object.values(library.packs).concat(Object.values(library.custom)), [library]);

  // ---------- Household mutation ----------
  // Every write fans out across whoever is currently watching, so a shared
  // session teaches all of their models at once.
  const updateProfile = fn => {
    setProfiles(ps => {
      const p = ps.byId[activeId];
      if (!p) return ps;
      return {
        order: ps.order,
        byId: {
          ...ps.byId,
          [activeId]: fn(p)
        }
      };
    });
  };
  const updateActiveMembers = fn => {
    updateProfile(p => {
      const byId = {
        ...p.members.byId
      };
      (p.active || []).forEach(id => {
        if (byId[id]) byId[id] = fn(byId[id]);
      });
      return {
        ...p,
        members: {
          order: p.members.order,
          byId
        }
      };
    });
  };
  const snapshotUndo = msg => {
    const snap = profiles.byId[activeId];
    setToast({
      msg,
      undo: () => {
        setProfiles(ps => ({
          order: ps.order,
          byId: {
            ...ps.byId,
            [activeId]: snap
          }
        }));
        setToast(null);
      }
    });
  };
  const rate = (id, r) => {
    if (!profile || !mv) return;
    const m = MOVIE_BY_ID[id];
    const removing = mv.rated[id] === r && mv.solo;
    snapshotUndo(removing ? "Rating cleared" : RATING_META[String(r)].label + " · " + (m ? m.t : ""));
    const ts = Date.now();
    updateActiveMembers(mem => {
      const rated = {
        ...mem.rated
      };
      const order = mem.ratedOrder.filter(x => x !== id);
      if (removing) delete rated[id];else {
        rated[id] = r;
        order.push(id);
      }
      const watchlog = removing ? mem.watchlog : [...mem.watchlog, {
        id,
        r,
        ts
      }].slice(-WATCHLOG_CAP);
      return {
        ...mem,
        rated,
        ratedOrder: order,
        watchlog,
        watchlist: mem.watchlist.filter(x => x !== id),
        rewatch: (mem.rewatch || []).filter(x => x !== id)
      };
    });
  };
  const toggleSave = id => {
    if (!mv) return;
    const on = mv.watchlist.indexOf(id) >= 0;
    const m = MOVIE_BY_ID[id];
    updateActiveMembers(mem => ({
      ...mem,
      watchlist: on ? mem.watchlist.filter(x => x !== id) : mem.watchlist.indexOf(id) >= 0 ? mem.watchlist : [...mem.watchlist, id]
    }));
    setToast({
      msg: on ? "Removed from watchlist" : (m ? m.t : "Title") + " saved for later"
    });
  };
  const setTonight = id => {
    updateActiveMembers(mem => ({
      ...mem,
      tonight: id
    }));
    if (id) {
      const m = MOVIE_BY_ID[id];
      setToast({
        msg: "Tonight: " + (m ? m.t : "")
      });
    }
  };
  const surprise = () => {
    if (pool.length === 0) return;
    const top = pool.slice().sort((a, b) => b.p - a.p).slice(0, 60);
    setTonight(top[Math.floor(Math.random() * top.length)].id);
    setTab("discover");
  };
  const bulkMark = () => {
    if (!profile) return;
    snapshotUndo("Marked the family classics as seen");
    updateActiveMembers(mem => {
      const rated = {
        ...mem.rated
      };
      const order = mem.ratedOrder.slice();
      MOVIE_LIST.forEach(m => {
        if ((m.b === "a" || m.b === "k") && m.k !== "s" && rated[m.id] === undefined) {
          rated[m.id] = 1;
          order.push(m.id);
        }
      });
      return {
        ...mem,
        rated,
        ratedOrder: order
      };
    });
  };

  // Toggle who is watching. At least one person always stays selected.
  const toggleMember = id => {
    updateProfile(p => {
      const on = (p.active || []).indexOf(id) >= 0;
      let active = on ? p.active.filter(x => x !== id) : [...(p.active || []), id];
      if (active.length === 0) active = [id];
      // Keep them in household order so the label reads predictably.
      active = p.members.order.filter(x => active.indexOf(x) >= 0);
      return {
        ...p,
        active
      };
    });
    recentRef.current = new Set();
    setNonce(n => n + 1);
  };
  const saveMember = form => {
    const editing = memberSheet && memberSheet !== "new";
    updateProfile(p => {
      const byId = {
        ...p.members.byId
      };
      const order = p.members.order.slice();
      if (editing) {
        const cur = byId[memberSheet];
        if (!cur) return p;
        byId[memberSheet] = {
          ...cur,
          name: form.name.trim().slice(0, 24) || cur.name,
          band: form.band,
          glyph: form.glyph,
          series: form.series,
          useCritics: !!form.useCritics,
          recency: typeof form.recency === "number" ? form.recency : 0.5
        };
      } else {
        const nm = newMember(form.name, form.band, form.glyph);
        nm.series = form.series;
        nm.useCritics = !!form.useCritics;
        nm.recency = typeof form.recency === "number" ? form.recency : 0.5;
        byId[nm.id] = nm;
        order.push(nm.id);
      }
      return {
        ...p,
        members: {
          order,
          byId
        }
      };
    });
    setToast({
      msg: editing ? "Saved" : form.name.trim() + " added to the household"
    });
    setMemberSheet(null);
  };
  const deleteMember = id => {
    if (!profile || profile.members.order.length <= 1) return;
    const gone = profile.members.byId[id];
    updateProfile(p => {
      if (p.members.order.length <= 1) return p;
      const byId = {
        ...p.members.byId
      };
      delete byId[id];
      const order = p.members.order.filter(x => x !== id);
      let active = (p.active || []).filter(x => x !== id);
      if (active.length === 0) active = [order[0]];
      return {
        ...p,
        members: {
          order,
          byId
        },
        active
      };
    });
    setToast({
      msg: (gone ? gone.name : "They") + " removed from the household"
    });
    setMemberSheet(null);
  };

  // ---------- Catalog ----------
  const mergeEntries = (entries, bucket) => {
    const keys = new Set(MOVIE_LIST.map(m => dedupeKey(m.t, m.y)));
    let added = 0,
      skipped = 0;
    const next = {
      ...library[bucket]
    };
    entries.forEach(raw => {
      const e = sanitizeEntry(raw);
      if (!e) {
        skipped++;
        return;
      }
      if (MOVIE_BY_ID[e.id] || keys.has(dedupeKey(e.t, e.y))) {
        skipped++;
        return;
      }
      next[e.id] = e;
      keys.add(dedupeKey(e.t, e.y));
      added++;
    });
    if (added) {
      const lib = {
        ...library,
        [bucket]: next
      };
      setLibrary(lib);
      applyLibrary(lib);
      setCatalogVersion(v => v + 1);
    }
    return {
      added,
      skipped
    };
  };
  const syncTmdb = async () => {
    const key = tmdbKey.trim();
    if (!key) {
      setSyncMsg("Paste your TMDB key first.");
      return;
    }
    setSyncBusy(true);
    setSyncMsg("");
    const base = "https://api.themoviedb.org/3/";
    const reqs = [["movie/popular", 1, false, ""], ["movie/popular", 2, false, ""], ["movie/now_playing", 1, false, "&region=JP"], ["movie/upcoming", 1, false, "&region=JP"], ["tv/popular", 1, true, ""], ["tv/on_the_air", 1, true, ""]];
    let auth = false,
      ok = 0;
    const items = [];
    const tmdbVotes = [];
    await Promise.all(reqs.map(async r => {
      const path = r[0],
        page = r[1],
        isTv = r[2],
        extra = r[3];
      try {
        const res = await fetch(base + path + "?api_key=" + encodeURIComponent(key) + "&language=en-US&page=" + page + extra);
        if (res.status === 401 || res.status === 403) {
          auth = true;
          return;
        }
        if (!res.ok) return;
        const j = await res.json();
        (j.results || []).forEach(it => {
          const mp = mapTmdbItem(it, isTv);
          if (!mp) return;
          items.push(mp);
          const va = Number(it.vote_average);
          if (isFinite(va) && va > 0) tmdbVotes.push({
            id: mp.id,
            tmdb: Math.round(va * 10) / 10
          });
        });
        ok++;
      } catch (e) {}
    }));
    setSyncBusy(false);
    if (auth) {
      setSyncMsg("That key was rejected. Check it and try again.");
      return;
    }
    if (ok === 0) {
      setSyncMsg("Couldn't reach TMDB. Check your connection and try again.");
      return;
    }
    const res = mergeEntries(items, "packs");
    // TMDB's own audience score arrives free with the sync — keep it as a
    // fallback for titles with no OMDb data.
    if (tmdbVotes.length) {
      setScores(prev => {
        const next = {
          ...prev
        };
        tmdbVotes.forEach(v => {
          const cur = next[v.id];
          next[v.id] = {
            ...(cur && !cur.miss ? cur : {}),
            tmdb: v.tmdb,
            at: Date.now()
          };
        });
        return next;
      });
    }
    sSet(KEY_TMDB, key);
    setSyncMsg(res.added ? "Added " + res.added + " new titles." + (res.skipped ? " " + res.skipped + " were already here." : "") : "Your catalog is already up to date.");
  };
  const importPackText = text => {
    if (!text || !text.trim()) {
      setPackMsg("Paste a pack first.");
      return;
    }
    let j;
    try {
      j = JSON.parse(text);
    } catch (e) {
      setPackMsg("That isn't valid JSON. Copy the whole reply, from the first { to the last }.");
      return;
    }
    const arr = Array.isArray(j) ? j : j && Array.isArray(j.titles) ? j.titles : null;
    if (!arr) {
      setPackMsg("No \"titles\" list in that file.");
      return;
    }
    const res = mergeEntries(arr, "packs");
    setPackMsg(res.added ? "Added " + res.added + " titles." + (res.skipped ? " Skipped " + res.skipped + " (already here or incomplete)." : "") : "Nothing new to add — all " + res.skipped + " were already in your catalog or incomplete.");
  };
  const onPackFile = e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => importPackText(String(rd.result || ""));
    rd.onerror = () => setPackMsg("Couldn't read that file.");
    rd.readAsText(file);
    e.target.value = "";
  };
  const removeAdded = id => {
    const lib = {
      packs: {
        ...library.packs
      },
      custom: {
        ...library.custom
      }
    };
    delete lib.packs[id];
    delete lib.custom[id];
    setLibrary(lib);
    applyLibrary(lib);
    setCatalogVersion(v => v + 1);
  };
  const clearAdded = () => {
    const lib = {
      packs: {},
      custom: {}
    };
    setLibrary(lib);
    applyLibrary(lib);
    setCatalogVersion(v => v + 1);
    setSyncMsg("Added titles cleared. The built-in catalog is untouched.");
  };
  const addTitle = f => {
    const y = parseInt(f.y, 10);
    if (!f.t.trim()) {
      setToast({
        msg: "Give it a title first."
      });
      return false;
    }
    if (!(y >= 1900 && y <= 2035)) {
      setToast({
        msg: "Add a year between 1900 and 2035."
      });
      return false;
    }
    if (f.g.length === 0) {
      setToast({
        msg: "Pick at least one genre."
      });
      return false;
    }
    const res = mergeEntries([{
      id: slugId(f.t, y),
      t: f.t.trim(),
      y,
      b: f.band,
      g: f.g,
      tg: f.tg,
      p: 6,
      k: f.kind === "s" ? "s" : undefined
    }], "custom");
    setToast({
      msg: res.added ? f.t.trim() + " added to your catalog" : "That one's already in your catalog"
    });
    return res.added > 0;
  };

  // Put something already rated back into the suggestion pool without
  // discarding the rating that taught the model.
  const toggleRewatch = id => {
    if (!mv) return;
    const on = mv.rewatch.indexOf(id) >= 0;
    const m = MOVIE_BY_ID[id];
    updateActiveMembers(mem => {
      const cur = mem.rewatch || [];
      return {
        ...mem,
        rewatch: on ? cur.filter(x => x !== id) : cur.indexOf(id) >= 0 ? cur : [...cur, id]
      };
    });
    setToast({
      msg: on ? "Removed from your picks" : (m ? m.t : "It") + " is back in your picks"
    });
    recentRef.current = new Set();
    setNonce(n => n + 1);
  };
  const clearRating = id => {
    if (!profile) return;
    const m = MOVIE_BY_ID[id];
    snapshotUndo((m ? m.t : "Title") + " removed from watched");
    updateActiveMembers(mem => {
      const rated = {
        ...mem.rated
      };
      delete rated[id];
      return {
        ...mem,
        rated,
        ratedOrder: mem.ratedOrder.filter(x => x !== id),
        rewatch: (mem.rewatch || []).filter(x => x !== id),
        watchlog: mem.watchlog.filter(h => h.id !== id)
      };
    });
    setEditId(null);
  };

  // ---------- Critic scores ----------
  const watchedIds = useMemo(() => mv ? Object.keys(mv.rated) : [], [mv]);
  const missingScores = useMemo(() => watchedIds.filter(id => MOVIE_BY_ID[id] && !scores[id]).length, [watchedIds, scores]);
  const scoredCount = useMemo(() => Object.keys(allScores).filter(id => allScores[id] && !allScores[id].miss).length, [allScores]);
  const rtCount = useMemo(() => Object.keys(allScores).filter(id => allScores[id] && allScores[id].rt !== undefined).length, [allScores]);

  // Fetch in small concurrent batches so we stay polite to a free-tier key and
  // can report progress. Anything already known (including a recorded miss) is
  // skipped, so re-running only picks up what is genuinely new.
  const fetchScoresFor = async ids => {
    const key = omdbKey.trim();
    if (!key) {
      setScoreMsg("Add your OMDb key first.");
      setScoresOpen(true);
      return;
    }
    const todo = ids.filter(id => MOVIE_BY_ID[id] && !scores[id]);
    if (todo.length === 0) {
      setScoreMsg("Everything here already has scores.");
      return;
    }
    setScoreBusy(true);
    setScoreMsg("");
    setScoreProgress({
      done: 0,
      total: todo.length
    });
    const found = {};
    let done = 0,
      got = 0,
      authFail = false,
      netFail = 0;
    const CHUNK = 5;
    for (let i = 0; i < todo.length && !authFail; i += CHUNK) {
      const slice = todo.slice(i, i + CHUNK);
      await Promise.all(slice.map(async id => {
        try {
          const r = await fetchScore(key, MOVIE_BY_ID[id]);
          if (r.auth === false) {
            authFail = true;
            return;
          }
          if (r.score) {
            found[id] = r.score;
            got++;
          } else found[id] = {
            miss: 1,
            at: Date.now()
          };
        } catch (e) {
          netFail++;
        }
        done++;
      }));
      setScoreProgress({
        done,
        total: todo.length
      });
      if (!authFail) await new Promise(r => setTimeout(r, 120));
    }
    setScoreBusy(false);
    setScoreProgress(null);
    if (authFail) {
      setScoreMsg("That OMDb key was rejected. Check it and try again.");
      return;
    }
    if (Object.keys(found).length) setScores(prev => ({
      ...prev,
      ...found
    }));
    sSet(KEY_OMDB, key);
    const missCount = done - got;
    setScoreMsg(got ? "Added scores for " + got + " title" + (got === 1 ? "" : "s") + "." + (missCount ? " " + missCount + " had none listed." : "") + (netFail ? " " + netFail + " could not be reached." : "") : "No scores found for those titles.");
  };
  const fetchWatchedScores = () => fetchScoresFor(watchedIds);
  const fetchAllScores = () => fetchScoresFor(MOVIE_LIST.map(m => m.id));

  // ---------- Backup ----------
  const exportBackup = () => {
    const payload = {
      v: 12,
      ts: Date.now(),
      profiles: {
        order: profiles.order,
        byId: profiles.byId
      },
      library,
      scores
    };
    const str = JSON.stringify(payload);
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(str);
        copied = true;
      }
    } catch (e) {}
    const saved = downloadText("movie-night-backup.json", str, "application/json");
    setBackupMsg(saved ? copied ? "Backup downloaded and copied to your clipboard." : "Backup downloaded." : copied ? "Backup copied to your clipboard." : "Couldn't create the backup here.");
  };
  const importBackup = text => {
    if (!text || !text.trim()) {
      setBackupMsg("Paste a backup first.");
      return;
    }
    let j;
    try {
      j = JSON.parse(text);
    } catch (e) {
      setBackupMsg("That isn't a valid backup.");
      return;
    }
    const lib = sanitizeLibrary(j.library);
    applyLibrary(lib);
    setLibrary(lib);
    if (j.scores) setScores(sanitizeScores(j.scores));
    const byId = {},
      order = [];
    const src = j.profiles || {};
    (Array.isArray(src.order) ? src.order : []).forEach(id => {
      const sp = sanitizeProfile(src.byId && src.byId[id]);
      if (sp) {
        byId[sp.id] = sp;
        order.push(sp.id);
      }
    });
    if (order.length === 0) {
      setBackupMsg("No profiles found in that backup.");
      return;
    }
    setProfiles({
      order,
      byId
    });
    setActiveId(null);
    setScreen("gate");
    setBackupOpen(false);
    setCatalogVersion(v => v + 1);
    setBackupMsg("");
    setToast({
      msg: "Restored " + order.length + " profile" + (order.length > 1 ? "s" : "")
    });
  };

  // ---------- Profiles ----------
  const enterProfile = id => {
    const p = profiles.byId[id];
    const first = p && p.members.byId[p.active && p.active[0] || p.members.order[0]];
    impRef.current = first && first.imp ? {
      ...first.imp
    } : {};
    recentRef.current = new Set();
    setActiveId(id);
    setScreen("app");
    setTab("discover");
    setNonce(n => n + 1);
  };
  const createProfileDone = (p, pin) => {
    const np = {
      ...p,
      pin: pin || ""
    };
    setProfiles(ps => ({
      order: [...ps.order, np.id],
      byId: {
        ...ps.byId,
        [np.id]: np
      }
    }));
    impRef.current = {};
    recentRef.current = new Set();
    setActiveId(np.id);
    setScreen("app");
    setTab("discover");
  };
  const deleteProfile = id => {
    setProfiles(ps => {
      const byId = {
        ...ps.byId
      };
      delete byId[id];
      return {
        order: ps.order.filter(x => x !== id),
        byId
      };
    });
    if (id === activeId) {
      setActiveId(null);
      setScreen("gate");
    }
  };
  const signOut = () => {
    setActiveId(null);
    setScreen("gate");
    setQuery("");
    setMood("any");
  };
  const togglePin = () => {
    if (!profile) return;
    if (profile.pin) {
      updateProfile(p => ({
        ...p,
        pin: ""
      }));
      setToast({
        msg: "PIN removed"
      });
    } else setPinSetup(true);
  };
  const copy = (text, msg) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        setCopyMsg(msg);
        setTimeout(() => setCopyMsg(""), 2500);
        return;
      }
    } catch (e) {}
    setCopyMsg("Select the text below and copy it.");
    setTimeout(() => setCopyMsg(""), 3000);
  };

  // ---------- Styles ----------
  const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
* { -webkit-tap-highlight-color: transparent; --tw-ring-color: ${C.ink}55; }
*:focus-visible { outline: 2px solid ${C.ink}; outline-offset: 2px; }
input, textarea, button { font-family: ${FONT_UI}; }
input[type=range] { -webkit-appearance: none; appearance: none; height: 22px; background: transparent; }
input[type=range]::-webkit-slider-runnable-track { height: 3px; background: ${C.line}; border-radius: 999px; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: ${C.ink}; margin-top: -7.5px; }
input[type=range]::-moz-range-track { height: 3px; background: ${C.line}; border-radius: 999px; }
input[type=range]::-moz-range-thumb { width: 18px; height: 18px; border: 0; border-radius: 50%; background: ${C.ink}; }
::-webkit-scrollbar { width: 0; height: 0; }
@media (min-width: 380px) { .xs\\:inline { display: inline !important; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
`;
  const shell = children => /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: C.bg,
      fontFamily: FONT_UI,
      color: C.ink
    }
  }, /*#__PURE__*/React.createElement("style", null, css), children);
  if (!booted) return shell(/*#__PURE__*/React.createElement("div", null));
  if (screen === "create") {
    return shell(/*#__PURE__*/React.createElement(CreateProfile, {
      C: C,
      canCancel: profiles.order.length > 0,
      onCancel: () => setScreen("gate"),
      onDone: createProfileDone
    }));
  }
  if (screen === "gate" || !profile) {
    return shell(/*#__PURE__*/React.createElement(ProfileGate, {
      profiles: profiles,
      C: C,
      onEnter: enterProfile,
      onCreate: () => setScreen("create"),
      onDelete: deleteProfile
    }));
  }
  return shell(/*#__PURE__*/React.createElement("div", {
    className: "max-w-xl mx-auto"
  }, /*#__PURE__*/React.createElement(TopBar, {
    C: C,
    profile: profile,
    onSwitch: signOut,
    title: tab === "insights" ? "Insights" : tab === "watched" ? "Watched" : tab === "profile" ? "You" : "Movie Night"
  }), tab === "discover" && /*#__PURE__*/React.createElement(DiscoverTab, {
    C: C,
    profile: profile,
    view: mv,
    recs: recs,
    tonight: mv.tonight,
    model: model,
    mood: mood,
    setMood: setMood,
    explore: explore,
    setExplore: setExplore,
    onRate: rate,
    onSave: toggleSave,
    onSetTonight: setTonight,
    onShuffle: rotate,
    onSurprise: surprise,
    onToggleMember: toggleMember,
    onManageHousehold: () => setTab("profile"),
    poolSize: pool.length
  }), tab === "rate" && /*#__PURE__*/React.createElement(RateTab, {
    C: C,
    mv: mv,
    query: query,
    setQuery: setQuery,
    results: results,
    total: rateTotals.total,
    ratedCount: rateTotals.rated,
    shown: rateShown,
    setShown: setRateShown,
    filters: rateFilters,
    setFilters: setRateFilters,
    scores: allScores,
    onRate: rate,
    onSave: toggleSave,
    onBulk: bulkMark,
    view: rateView,
    setView: setRateView,
    watchlistTitles: watchlistTitles
  }), tab === "watched" && /*#__PURE__*/React.createElement(WatchedTab, {
    C: C,
    view: mv,
    ins: ins,
    scores: allScores,
    sort: watchedSort,
    setSort: setWatchedSort,
    onFetchScores: fetchWatchedScores,
    fetching: scoreBusy,
    fetchMsg: scoreMsg,
    missing: missingScores,
    hasKey: !!omdbKey.trim(),
    onOpenScores: () => {
      setScoreMsg("");
      setScoresOpen(true);
    },
    onEdit: setEditId
  }), tab === "insights" && /*#__PURE__*/React.createElement(InsightsTab, {
    C: C,
    view: mv,
    ins: ins
  }), tab === "profile" && /*#__PURE__*/React.createElement(ProfileTab, {
    C: C,
    profile: profile,
    profiles: profiles,
    theme: theme,
    onTheme: setTheme,
    onSwitch: signOut,
    onEditMember: id => setMemberSheet(id),
    onOpenHousehold: () => setMemberSheet("new"),
    onTogglePin: togglePin,
    onOpenCatalog: () => {
      setSyncMsg("");
      setCatalogOpen(true);
    },
    onOpenPacks: () => {
      setPackMsg("");
      setPacksOpen(true);
    },
    onOpenBackup: () => {
      setBackupMsg("");
      setBackupOpen(true);
    },
    onOpenAdd: () => setAddOpen(true),
    onOpenScores: () => {
      setScoreMsg("");
      setScoresOpen(true);
    },
    scoredCount: rtCount,
    onSignOut: signOut,
    onDeleteProfile: () => deleteProfile(activeId),
    addedCount: addedList.length,
    catalogTotal: MOVIE_LIST.length
  }), /*#__PURE__*/React.createElement(BottomNav, {
    tab: tab,
    onTab: setTab,
    C: C
  }), /*#__PURE__*/React.createElement(CatalogSheet, {
    open: catalogOpen,
    onClose: () => setCatalogOpen(false),
    C: C,
    tmdbKey: tmdbKey,
    setTmdbKey: setTmdbKey,
    onSync: syncTmdb,
    busy: syncBusy,
    msg: syncMsg,
    builtinCount: BUILTIN_MOVIES.length,
    addedCount: addedList.length,
    added: addedList,
    onRemoveAdded: removeAdded,
    onClearAdded: clearAdded
  }), /*#__PURE__*/React.createElement(PacksSheet, {
    open: packsOpen,
    onClose: () => setPacksOpen(false),
    C: C,
    packFileRef: packFileRef,
    onPackFile: onPackFile,
    onPastePack: importPackText,
    packMsg: packMsg,
    onCopyPrompt: () => copy(PACK_PROMPT, "Prompt copied."),
    onCopyExample: () => copy(PACK_EXAMPLE_STR, "Example copied."),
    onDownloadExample: () => {
      downloadText("movie-night-pack-example.json", PACK_EXAMPLE_STR, "application/json");
      setCopyMsg("Example downloaded.");
      setTimeout(() => setCopyMsg(""), 2500);
    },
    copyMsg: copyMsg
  }), /*#__PURE__*/React.createElement(BackupSheet, {
    open: backupOpen,
    onClose: () => setBackupOpen(false),
    C: C,
    onExport: exportBackup,
    onImport: importBackup,
    backupMsg: backupMsg
  }), /*#__PURE__*/React.createElement(AddTitleSheet, {
    open: addOpen,
    onClose: () => setAddOpen(false),
    C: C,
    onAdd: addTitle
  }), /*#__PURE__*/React.createElement(WatchedEditSheet, {
    open: !!editId,
    onClose: () => setEditId(null),
    C: C,
    m: editId ? MOVIE_BY_ID[editId] : null,
    entry: editId ? allScores[editId] : null,
    rating: editId ? mv.rated[editId] : undefined,
    again: editId ? mv.rewatch.indexOf(editId) >= 0 : false,
    onRate: r => {
      if (mv.rated[editId] !== r) rate(editId, r);
      setEditId(null);
    },
    onToggleAgain: () => toggleRewatch(editId),
    onClear: () => clearRating(editId)
  }), /*#__PURE__*/React.createElement(ScoresSheet, {
    open: scoresOpen,
    onClose: () => setScoresOpen(false),
    C: C,
    omdbKey: omdbKey,
    setOmdbKey: setOmdbKey,
    onFetchWatched: fetchWatchedScores,
    onFetchAll: fetchAllScores,
    busy: scoreBusy,
    msg: scoreMsg,
    progress: scoreProgress,
    scoredCount: scoredCount,
    rtCount: rtCount,
    catalogTotal: MOVIE_LIST.length,
    builtDate: BUILTIN_SCORES_DATE
  }), /*#__PURE__*/React.createElement(MemberSheet, {
    open: !!memberSheet,
    onClose: () => setMemberSheet(null),
    C: C,
    member: memberSheet && memberSheet !== "new" ? profile.members.byId[memberSheet] : null,
    onSave: saveMember,
    onDelete: deleteMember,
    canDelete: profile.members.order.length > 1
  }), pinSetup && /*#__PURE__*/React.createElement(PinPad, {
    C: C,
    title: "Set a PIN",
    subtitle: "Choose a 4-digit code",
    onCancel: () => setPinSetup(false),
    onSubmit: code => {
      updateProfile(p => ({
        ...p,
        pin: code
      }));
      setPinSetup(false);
      setToast({
        msg: "PIN set"
      });
      return true;
    }
  }), /*#__PURE__*/React.createElement(Toast, {
    toast: toast,
    C: C
  })));
}
