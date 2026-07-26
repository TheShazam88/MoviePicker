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
const APP_VERSION = "12";
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
}];

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
    if (n(e.tmdb, 0, 10) !== undefined) o.tmdb = n(e.tmdb, 0, 10);
    if (n(e.votes, 0, 1e9) !== undefined) o.votes = n(e.votes, 0, 1e9);
    if (e.miss) o.miss = 1;
    o.at = Number(e.at) || 0;
    if (o.imdb === undefined && o.rt === undefined && o.mc === undefined && o.tmdb === undefined && !o.miss) return;
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

// Normalized similarity, roughly 0..1.85. Dividing by the geometric mean of
// facet counts stops titles that simply carry more tags from looking similar
// to everything.
function rawSim(a, b) {
  if (!a || !b || a.id === b.id) return 0;
  const ag = a.g || [],
    bg = b.g || [],
    at = a.tg || [],
    bt = b.tg || [];
  let gShared = 0;
  for (let i = 0; i < ag.length; i++) if (bg.indexOf(ag[i]) >= 0) gShared++;
  let s = gShared / Math.sqrt(Math.max(1, ag.length) * Math.max(1, bg.length));
  if (at.length && bt.length) {
    let tShared = 0;
    for (let i = 0; i < at.length; i++) if (bt.indexOf(at[i]) >= 0) tShared++;
    s += tShared / Math.sqrt(at.length * bt.length) * 0.6;
  }
  if (a.s && a.s === b.s && a.s !== "live") s += 0.25;
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
  let taste = 0;
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
      score += (cn - 0.5) * 2 * align * 0.6;
    }
  }
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
    let wild = null,
      wv = -Infinity;
    const horizon = Math.min(scored.length, 400);
    for (let i = 0; i < horizon; i++) {
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
function reasonFor(m, model, rated, wild) {
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
  return "Worth a look";
}

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
const AVATAR_GLYPHS = ["◆", "●", "▲", "■", "★", "✦", "◐", "❋"];
function newMember(name, band, glyph) {
  return {
    id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: String(name || "Me").trim().slice(0, 24) || "Me",
    band: BAND_RANK[band] !== undefined ? band : "r",
    glyph: AVATAR_GLYPHS.indexOf(glyph) >= 0 ? glyph : AVATAR_GLYPHS[0],
    series: band === "r",
    useCritics: false,
    rated: {},
    ratedOrder: [],
    hidden: [],
    watchlist: [],
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
    rated,
    ratedOrder: order,
    hidden: Array.isArray(p.hidden) ? p.hidden.filter(x => typeof x === "string") : [],
    watchlist: Array.isArray(p.watchlist) ? p.watchlist.filter(x => typeof x === "string") : [],
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
      hidden: m.hidden,
      watchlist: m.watchlist,
      watchlog: m.watchlog,
      tonight: m.tonight,
      label: m.name
    };
  }
  const rated = {},
    hidden = [],
    watchlist = [],
    watchlog = [];
  let band = "r",
    series = true,
    tonight = null,
    useCritics = false;
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
    m.watchlog.forEach(h => watchlog.push(h));
    if (BAND_RANK[m.band] < BAND_RANK[band]) band = m.band;
    if (!m.series) series = false;
    if (m.useCritics) useCritics = true;
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
    hidden,
    watchlist,
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
  if (e.rt !== undefined) items.push(["RT", e.rt + "%"]);
  if (e.imdb !== undefined) items.push(["IMDb", e.imdb.toFixed(1)]);
  if (e.mc !== undefined && !compact) items.push(["MC", String(e.mc)]);
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
  compact
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
  }, reason) : null, /*#__PURE__*/React.createElement("div", {
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
    reason: reasonFor(it.m, model, view.rated, it.wild),
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
function RateTab({
  C,
  mv,
  query,
  setQuery,
  results,
  onRate,
  onSave,
  onBulk,
  view,
  setView,
  watchlistTitles
}) {
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
    className: "text-sm px-1 focus:outline-none",
    style: {
      color: C.mut
    }
  }, "✕") : null), !query && /*#__PURE__*/React.createElement("button", {
    onClick: onBulk,
    className: "mt-2 w-full py-2 rounded-lg text-xs font-medium focus:outline-none focus-visible:ring-2",
    style: {
      color: C.ink2,
      border: "1px dashed " + C.faint
    }
  }, "Seen the family classics? Mark every all-ages & 6+ film as seen")), /*#__PURE__*/React.createElement("div", {
    className: "px-4 pt-3 space-y-2.5"
  }, results.map(m => /*#__PURE__*/React.createElement(TitleCard, {
    key: m.id,
    m: m,
    C: C,
    rating: mv.rated[m.id],
    saved: mv.watchlist.indexOf(m.id) >= 0,
    onRate: r => onRate(m.id, r),
    onSave: () => onSave(m.id),
    compact: true
  })), results.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-12 text-sm",
    style: {
      color: C.mut
    }
  }, "No titles match \"", query, "\".") : null)) : /*#__PURE__*/React.createElement("div", {
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
  }, "Tap ＋ on any title to save it for later.")) : watchlistTitles.map(m => /*#__PURE__*/React.createElement(TitleCard, {
    key: m.id,
    m: m,
    C: C,
    rating: mv.rated[m.id],
    saved: true,
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
  onOpenScores
}) {
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
    }, "Everything you rate shows up here with its IMDb, Rotten Tomatoes and Metacritic scores.")));
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
    className: "grid grid-cols-3 gap-2 mb-3"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Titles",
    value: rows.length,
    C: C
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Avg IMDb",
    value: ins.avgImdb === null ? "—" : ins.avgImdb.toFixed(1),
    C: C
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Avg RT",
    value: ins.avgRt === null ? "—" : ins.avgRt + "%",
    C: C
  })), /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_NUM
    }
  }, missing), " watched ", missing === 1 ? "title has" : "titles have", " no scores yet"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-2.5",
    style: {
      color: C.mut
    }
  }, hasKey ? "Fetch them from OMDb — free, and it covers IMDb, Rotten Tomatoes and Metacritic." : "Add a free OMDb key to pull IMDb, Rotten Tomatoes and Metacritic scores."), /*#__PURE__*/React.createElement("button", {
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
    return /*#__PURE__*/React.createElement("div", {
      key: x.id,
      className: "rounded-xl p-2.5 flex gap-2.5 items-center",
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
    }, x.m.y), x.ts ? " · " + fmtDate(x.ts) : ""), x.e ? /*#__PURE__*/React.createElement(ScoreChips, {
      e: x.e,
      C: C
    }) : /*#__PURE__*/React.createElement("span", {
      className: "text-xs",
      style: {
        color: C.faint
      }
    }, "No scores yet")), /*#__PURE__*/React.createElement("span", {
      className: "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm",
      title: meta.label,
      "aria-label": "Your rating: " + meta.label,
      style: {
        color: col,
        background: C.field
      }
    }, meta.glyph));
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
    sub: bandLabel(m.band) + (m.series ? " · series" : "") + (m.useCritics ? " · critics" : "") + " · " + Object.keys(m.rated).length + " rated"
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
  })), /*#__PURE__*/React.createElement("div", {
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
      useCritics
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
  catalogTotal
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
  }, catalogTotal), " titles have scores."), /*#__PURE__*/React.createElement("p", {
    className: "text-sm mb-4",
    style: {
      color: C.mut
    }
  }, "Rotten Tomatoes has no free public API, so scores come from OMDb — one free key that returns IMDb, Rotten Tomatoes and Metacritic together."), /*#__PURE__*/React.createElement("label", {
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
  }, busy ? "Fetching…" : "Get scores for what you have watched"), /*#__PURE__*/React.createElement("button", {
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
  }, "The free tier allows 1,000 lookups a day, so a full catalog pass takes one sitting. Scores are stored on this device and reused; nothing is re-fetched unnecessarily. Coverage is imperfect — Rotten Tomatoes is often missing for older, anime and non-US titles."), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2",
    style: {
      color: C.faint
    }
  }, "Turn scores on per person under Household, so a child's picks stay driven by their own taste if you prefer."));
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
    if (toast) {
      const t = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ---------- Derived ----------
  // `mv` is the household view: one member, or several merged for a shared session.
  const mv = useMemo(() => profile ? memberView(profile) : null, [profile, catalogVersion]);
  const model = useMemo(() => {
    if (!profile || !mv) return null;
    return blendModels(mv.members.map(m => buildModel(m.rated, m.ratedOrder, m.watchlog, scores)));
  }, [mv, scores, catalogVersion]);
  const pool = useMemo(() => {
    if (!mv) return [];
    const rank = BAND_RANK[mv.band];
    const hidden = new Set(mv.hidden);
    return MOVIE_LIST.filter(m => BAND_RANK[m.b] <= rank && (mv.series || m.k !== "s") && mv.rated[m.id] === undefined && !hidden.has(m.id));
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
      scores
    };
    const scored = pool.map(m => ({
      m,
      sc: scoreTitle(m, model, ctx)
    })).sort((a, b) => b.sc - a.sc);
    return assembleBatch(scored, model, ctx);
  }, [pool, model, mood, explore, nonce, scores]);

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
    return computeInsights(mv.rated, order, mv.hidden, mv.watchlog, scores);
  }, [mv, scores, catalogVersion]);
  const results = useMemo(() => {
    if (!mv) return [];
    const q = query.trim().toLowerCase();
    if (q) return MOVIE_LIST.filter(m => m.t.toLowerCase().indexOf(q) >= 0).slice(0, 60);
    const rank = BAND_RANK[mv.band];
    return MOVIE_LIST.filter(m => BAND_RANK[m.b] <= rank && (mv.series || m.k !== "s")).sort((a, b) => b.p - a.p || a.t.localeCompare(b.t)).slice(0, 60);
  }, [query, mv, catalogVersion]);
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
        watchlist: mem.watchlist.filter(x => x !== id)
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
          useCritics: !!form.useCritics
        };
      } else {
        const nm = newMember(form.name, form.band, form.glyph);
        nm.series = form.series;
        nm.useCritics = !!form.useCritics;
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

  // ---------- Critic scores ----------
  const watchedIds = useMemo(() => mv ? Object.keys(mv.rated) : [], [mv]);
  const missingScores = useMemo(() => watchedIds.filter(id => MOVIE_BY_ID[id] && !scores[id]).length, [watchedIds, scores]);
  const scoredCount = useMemo(() => Object.keys(scores).filter(id => scores[id] && !scores[id].miss).length, [scores]);

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
    scores: scores,
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
    }
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
    scoredCount: scoredCount,
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
    catalogTotal: MOVIE_LIST.length
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
