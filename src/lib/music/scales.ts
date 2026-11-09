import { norm } from "./theory";
import { MORE_SCALES } from "./scales-more";
import { EXTRA_SCALES } from "./scales-extra";
import { DEEP_SCALES } from "./scales-deep";
import { WIDE_SCALES } from "./scales-wide";
import { bandTags } from "./band-index";

export type ScaleCategory = "metal" | "hard" | "stoner" | "mode" | "pent" | "jazz" | "world" | "sym";

export type Scale = {
  id: string;
  name: string;
  categories: ScaleCategory[];
  intervals: number[];
  formula: string;
  /** Semitones that identify the scale, relative to root. */
  color: number[];
  prior: number;
  tags: string[];
  hint: string;
  modeIndex?: number;
};

export const SCALE_CATS: { id: ScaleCategory | "all"; label: string }[] = [
  { id: "metal", label: "Metalli" },
  { id: "hard", label: "Hard rock" },
  { id: "stoner", label: "Stoner" },
  { id: "mode", label: "Moodit" },
  { id: "pent", label: "Pentatoniset" },
  { id: "jazz", label: "Jazz" },
  { id: "world", label: "Maailma" },
  { id: "sym", label: "Symmetriset" },
  { id: "all", label: "Kaikki" },
];

export const SCALES: Scale[] = [
  {
    id: "phrygian",
    name: "Fryyginen",
    categories: ["metal", "mode"],
    intervals: [0, 1, 3, 5, 7, 8, 10],
    formula: "1 b2 b3 4 5 b6 b7",
    color: [1, 3, 8],
    prior: 1,
    modeIndex: 2,
    tags: ["phrygian", "fryyginen", "metalli", "riffi", "metallica", "tool", "gojira", "lamb of god", "megadeth", "slipknot", "rammstein", "djent"],
    hint: "Metalli-riffien perusskaala. b2 tekee soinnista heti pimeän.",
  },
  {
    id: "phrygian-dominant",
    name: "Fryyginen dominantti",
    categories: ["metal"],
    intervals: [0, 1, 4, 5, 7, 8, 10],
    formula: "1 b2 3 4 5 b6 b7",
    color: [1, 4, 8],
    prior: 0.96,
    tags: ["phrygian dominant", "spanish", "hijaz", "fryyginen dominantti", "slayer", "nile", "behemoth", "yngwie", "children of bodom", "bodom", "arch enemy", "itainen"],
    hint: "Slayer- ja neoklassinen sävy. Harmonisen mollin viides moodi.",
  },
  {
    id: "harmonic-minor",
    name: "Harmoninen molli",
    categories: ["metal"],
    intervals: [0, 2, 3, 5, 7, 8, 11],
    formula: "1 2 b3 4 5 b6 7",
    color: [3, 8, 11],
    prior: 0.94,
    tags: ["harmonic minor", "harmoninen", "molli", "yngwie", "neoclassical", "slayer", "iron maiden", "maiden", "children of bodom", "bodom", "arch enemy", "in flames", "nightwish", "opeth"],
    hint: "Nostettu septimi. Neoklassinen metalli ja dramaattinen kadenssi.",
  },
  {
    id: "natural-minor",
    name: "Luonnollinen molli",
    categories: ["metal", "mode"],
    intervals: [0, 2, 3, 5, 7, 8, 10],
    formula: "1 2 b3 4 5 b6 b7",
    color: [3, 8, 10],
    prior: 0.98,
    modeIndex: 5,
    tags: ["aeolian", "aiolinen", "natural minor", "molli", "metallica", "iron maiden", "maiden", "black sabbath", "sabbath", "opeth", "trivium", "apocalyptica", "nightwish", "judas priest"],
    hint: "Aiolinen. Laaja molli ilman harmonisen mollin terävää septimiä.",
  },
  {
    id: "minor-pent",
    name: "Mollipentatoninen",
    categories: ["metal", "pent"],
    intervals: [0, 3, 5, 7, 10],
    formula: "1 b3 4 5 b7",
    color: [3, 10],
    prior: 0.97,
    tags: ["pentatonic", "pentatoninen", "molli", "blues", "sabbath", "black sabbath", "pantera", "metallica", "alice in chains"],
    hint: "Viisi nuottia. Sabbath, Pantera ja klassinen riffimetalli.",
  },
  {
    id: "blues",
    name: "Blues",
    categories: ["metal", "pent"],
    intervals: [0, 3, 5, 6, 7, 10],
    formula: "1 b3 4 b5 5 b7",
    color: [3, 6, 10],
    prior: 0.82,
    tags: ["blues", "pentatoninen", "pantera", "sabbath", "black sabbath"],
    hint: "Mollipentatoninen plus b5. Likainen, bluespohjainen metalli.",
  },
  {
    id: "dorian",
    name: "Doorinen",
    categories: ["metal", "mode"],
    intervals: [0, 2, 3, 5, 7, 9, 10],
    formula: "1 2 b3 4 5 6 b7",
    color: [3, 9],
    prior: 0.86,
    modeIndex: 1,
    tags: ["dorian", "doorinen", "iron maiden", "maiden", "opeth", "tool"],
    hint: "Molli, jossa suuri seksti. Maiden ja Opeth, ei täysin synkkä.",
  },
  {
    id: "locrian",
    name: "Lokrinen",
    categories: ["metal", "mode"],
    intervals: [0, 1, 3, 5, 6, 8, 10],
    formula: "1 b2 b3 4 b5 b6 b7",
    color: [1, 6],
    prior: 0.7,
    modeIndex: 6,
    tags: ["locrian", "lokrinen", "djent", "meshuggah", "periphery", "diminished", "jannite"],
    hint: "b5 vie juuren alta. Djent ja dissonanssi.",
  },
  {
    id: "dim-hw",
    name: "Puoli–kokosävel diminuutio",
    categories: ["metal"],
    intervals: [0, 1, 3, 4, 6, 7, 9, 10],
    formula: "1 b2 b3 3 b5 5 6 b7",
    color: [1, 3, 6],
    prior: 0.72,
    tags: ["diminished", "diminuutio", "half whole", "half-whole", "djent", "meshuggah", "fear factory", "symmetrinen"],
    hint: "Symmetrinen kahdeksansävel. Meshuggah-henkinen jännite.",
  },
  {
    id: "dim-wh",
    name: "Koko–puolisävel diminuutio",
    categories: ["metal"],
    intervals: [0, 2, 3, 5, 6, 8, 9, 11],
    formula: "1 2 b3 4 b5 b6 6 7",
    color: [2, 6, 11],
    prior: 0.58,
    tags: ["diminished", "whole half", "dim7", "diminuutio", "jazz", "metalli"],
    hint: "Dim7 rakentuu tästä. Sama kuvio kolmen nauhan välein.",
  },
  {
    id: "hungarian-minor",
    name: "Unkarilainen molli",
    categories: ["metal"],
    intervals: [0, 2, 3, 6, 7, 8, 11],
    formula: "1 2 b3 b5 5 b6 7",
    color: [3, 6, 11],
    prior: 0.6,
    tags: ["hungarian", "gypsy", "unkari", "mustalainen", "nile", "eksoottinen"],
    hint: "Harmoninen molli, jossa b5. Itäeurooppalainen metalli.",
  },
  {
    id: "double-harmonic",
    name: "Kaksoisharmoninen",
    categories: ["metal"],
    intervals: [0, 1, 4, 5, 7, 8, 11],
    formula: "1 b2 3 4 5 b6 7",
    color: [1, 4, 11],
    prior: 0.64,
    tags: ["byzantine", "double harmonic", "kaksoisharmoninen", "nile", "behemoth", "itainen", "bysantti"],
    hint: "Kaksi ylinousevaa sekuntia. Bysantti, Nile, musta metalli.",
  },
  {
    id: "oriental",
    name: "Itämainen",
    categories: ["metal", "world"],
    intervals: [0, 1, 4, 5, 6, 9, 10],
    formula: "1 b2 3 4 b5 6 b7",
    color: [1, 4, 6],
    prior: 0.48,
    tags: ["oriental", "itainen", "itämainen", "nile", "eksoottinen"],
    hint: "b2, suuri terssi ja b5. Lyhyt itämainen riffi.",
  },
  {
    id: "persian",
    name: "Persialainen",
    categories: ["metal", "world"],
    intervals: [0, 1, 4, 5, 6, 8, 11],
    formula: "1 b2 3 4 b5 b6 7",
    color: [1, 4, 6, 11],
    prior: 0.44,
    tags: ["persian", "persia", "persialainen", "nile", "eksoottinen"],
    hint: "Persialainen tetraordi eksoottiseen teemaan.",
  },
  {
    id: "melodic-minor",
    name: "Melodinen molli",
    categories: ["metal", "jazz"],
    intervals: [0, 2, 3, 5, 7, 9, 11],
    formula: "1 2 b3 4 5 6 7",
    color: [3, 9, 11],
    prior: 0.6,
    tags: ["melodic minor", "melodinen", "jazz", "opeth", "neoclassical"],
    hint: "Suuri seksti ja septimi. Jazzmolli ja progemetalli.",
  },
  {
    id: "ionian",
    name: "Duuri (jooninen)",
    categories: ["mode"],
    intervals: [0, 2, 4, 5, 7, 9, 11],
    formula: "1 2 3 4 5 6 7",
    color: [4, 11],
    prior: 0.74,
    modeIndex: 0,
    tags: ["major", "duuri", "ionian", "jooninen"],
    hint: "Tavallinen duuri. Metallissa useammin kertosäkeen valo.",
  },
  {
    id: "lydian",
    name: "Lyydinen",
    categories: ["mode"],
    intervals: [0, 2, 4, 6, 7, 9, 11],
    formula: "1 2 3 #4 5 6 7",
    color: [6, 4],
    prior: 0.5,
    modeIndex: 3,
    tags: ["lydian", "lyydinen", "dream theater", "vai", "#4"],
    hint: "Duuri, jossa #4. Kelluva ja elokuvamainen.",
  },
  {
    id: "mixolydian",
    name: "Miksolyydinen",
    categories: ["mode"],
    intervals: [0, 2, 4, 5, 7, 9, 10],
    formula: "1 2 3 4 5 6 b7",
    color: [4, 10],
    prior: 0.58,
    modeIndex: 4,
    tags: ["mixolydian", "miksolyydinen", "dominantti", "rock", "ac/dc", "acdc"],
    hint: "Duuri ja b7. Rock-riffi ja dominanttiseiska.",
  },
  {
    id: "major-pent",
    name: "Duuripentatoninen",
    categories: ["pent"],
    intervals: [0, 2, 4, 7, 9],
    formula: "1 2 3 5 6",
    color: [4, 9],
    prior: 0.62,
    tags: ["pentatonic", "pentatoninen", "duuri", "country"],
    hint: "Duuri ilman kvarttia ja septimiä.",
  },
  {
    id: "hirajoshi",
    name: "Hirajoshi",
    categories: ["world"],
    intervals: [0, 2, 3, 7, 8],
    formula: "1 2 b3 5 b6",
    color: [2, 3, 8],
    prior: 0.4,
    tags: ["hirajoshi", "japani", "japan", "koto"],
    hint: "Japanilainen pentatoninen. Lyhyt ja heti tunnistettava.",
  },
  {
    id: "iwato",
    name: "Iwato",
    categories: ["world"],
    intervals: [0, 1, 5, 6, 10],
    formula: "1 b2 4 b5 b7",
    color: [1, 6],
    prior: 0.34,
    tags: ["iwato", "japani", "japan"],
    hint: "Synkkä japanilainen asteikko ilman terssiä ja kvinttiä.",
  },
  {
    id: "harmonic-major",
    name: "Harmoninen duuri",
    categories: ["jazz"],
    intervals: [0, 2, 4, 5, 7, 8, 11],
    formula: "1 2 3 4 5 b6 7",
    color: [4, 8, 11],
    prior: 0.42,
    tags: ["harmonic major", "harmoninen duuri", "jazz"],
    hint: "Duuri, jossa b6. Yllättävä kadenssi.",
  },
  {
    id: "lydian-dominant",
    name: "Lyydinen dominantti",
    categories: ["jazz"],
    intervals: [0, 2, 4, 6, 7, 9, 10],
    formula: "1 2 3 #4 5 6 b7",
    color: [6, 10],
    prior: 0.4,
    tags: ["lydian dominant", "mixolydian #4", "jazz", "melodinen molli"],
    hint: "Melodisen mollin neljäs moodi. #4 ja b7 yhdessä.",
  },
  {
    id: "altered",
    name: "Alteroitu",
    categories: ["jazz"],
    intervals: [0, 1, 3, 4, 6, 8, 10],
    formula: "1 b2 b3 3 b5 b6 b7",
    color: [1, 4, 6],
    prior: 0.36,
    tags: ["altered", "superlocrian", "jazz", "dominantti"],
    hint: "Dominanttiseiskan alteroinnit. Jazzsoolon jännite.",
  },
  ...MORE_SCALES,
  ...EXTRA_SCALES,
  ...DEEP_SCALES,
  ...WIDE_SCALES,
];

const EXTRA: Record<string, { tags: string[]; cats?: ScaleCategory[] }> = {
  phrygian: {
    tags: ["slayer", "metallica", "megadeth", "tool", "gojira", "lamb of god", "slipknot", "rammstein", "trivium", "sepultura", "obituary", "cannibal corpse", "death", "kreator", "testament", "anthrax", "deftones", "system of a down", "soad", "parkway drive", "bring me the horizon", "at the gates", "immortal", "darkthrone", "emperor", "mayhem", "bathory", "behemoth", "dimmu borgir", "cradle of filth", "amon amarth", "machine head", "crowbar", "type o negative", "stam1na", "mokoma", "kotiteollisuus", "psychosocial", "duality", "du hast", "schism", "laid to rest", "holy wars", "south of heaven", "angel of death"],
  },
  "phrygian-dominant": {
    tags: ["slayer", "raining blood", "angel of death", "nile", "behemoth", "yngwie", "malmsteen", "children of bodom", "bodom", "arch enemy", "rainbow", "dio", "holy diver", "van halen", "eruption", "randy rhoads", "crazy train", "mercyful fate", "king diamond", "symphony x", "wintersun", "black dahlia murder", "kashmir", "aerials", "led zeppelin"],
  },
  "harmonic-minor": {
    tags: ["iron maiden", "the trooper", "hallowed be thy name", "yngwie", "malmsteen", "children of bodom", "bodom", "arch enemy", "in flames", "nightwish", "dragonforce", "helloween", "blind guardian", "stratovarius", "sonata arctica", "kalmah", "wintersun", "iced earth", "symphony x", "randy rhoads", "mr crowley", "ozzy", "apocalyptica", "ensiferum", "dimmu borgir", "cradle of filth", "carcass", "at the gates", "slaughter of the soul"],
    cats: ["hard"],
  },
  "natural-minor": {
    tags: ["metallica", "master of puppets", "enter sandman", "fade to black", "one", "iron maiden", "fear of the dark", "run to the hills", "number of the beast", "black sabbath", "megadeth", "ozzy", "dio", "judas priest", "painkiller", "scorpions", "nightwish", "sabaton", "amon amarth", "twilight of the thunder god", "insomnium", "sentenced", "him", "ghost", "avenged sevenfold", "killswitch engage", "opeth", "blackwater park", "katatonia", "paradise lost", "amorphis", "apocalyptica", "helloween", "iced earth"],
    cats: ["hard"],
  },
  "minor-pent": {
    tags: ["black sabbath", "iron man", "paranoid", "war pigs", "sweet leaf", "black sabbath paranoid", "pantera", "walk", "cemetery gates", "dimebag", "zakk wylde", "ozzy", "no more tears", "metallica", "kirk hammett", "alice in chains", "them bones", "man in the box", "ac/dc", "acdc", "back in black", "highway to hell", "thunderstruck", "guns n roses", "gnr", "sweet child", "welcome to the jungle", "led zeppelin", "black dog", "whole lotta love", "aerosmith", "dream on", "zz top", "deep purple", "smoke on the water", "van halen", "panama", "motorhead", "ace of spades", "scorpions", "whitesnake", "kiss", "motley crue", "sleep", "kyuss", "electric wizard", "fu manchu", "clutch", "down", "melvins", "qotsa", "queens of the stone age", "red fang", "the sword", "high on fire", "uncle acid", "tony iommi", "rage against the machine", "killing in the name", "audioslave", "soundgarden", "black hole sun", "pearl jam", "even flow", "stone temple pilots", "plush", "tool", "schism", "mastodon", "blood mountain", "lamb of god", "slipknot", "before i forget", "korn", "deftones", "change", "my own summer", "system of a down", "toxicity", "soad", "in flames", "jester race", "at the gates", "dark tranquillity", "amon amarth", "children of bodom", "arch enemy", "trivium", "machine head", "sepultura", "soulfly", "gojira", "stranded", "opeth", "ghost", "avenged sevenfold", "killswitch engage", "as i lay dying", "parkway drive", "bring me the horizon", "bullet for my valentine", "disturbed", "godsmack", "static x", "white zombie", "rob zombie", "rammstein", "ministry", "fear factory", "meshuggah", "cannibal corpse", "obituary", "death", "morbid angel", "slayer", "megadeth", "symphony of destruction", "holy wars", "anthrax", "testament", "exodus", "kreator", "sodom", "destruction", "venom", "bathory", "celtic frost", "mercyful fate", "king diamond", "iron maiden", "judas priest", "breaking the law", "living after midnight", "dio", "rainbow", "blackmore", "deep purple", "yngwie", "malmsteen", "stoner", "doom", "candlemass", "saint vitus", "pentagram", "witchfinder general", "orange goblin", "monster magnet", "nebula", "colour haze", "elder", "all them witches", "kadavar", "graveyard", "witchcraft", "uncle acid and the deadbeats", "windhand", "conan", "belzebong", "bongzilla", "weedeater", "eyehategod", "crowbar", "acid bath", "corrosion of conformity", "down", "superjoint", "pantera", "hellyeah", "damageplan", "black label society", "pride and glory"],
    cats: ["hard", "stoner"],
  },
  blues: {
    tags: ["black sabbath", "pantera", "zz top", "la grange", "srv", "stevie ray vaughan", "clapton", "jimmy page", "led zeppelin", "aerosmith", "whitesnake", "still of the night", "deep purple", "allman brothers", "lynryd skynyrd", "free", "bad company", "black crowes", "clutch", "down", "acid bath", "corrosion of conformity", "coc", "eyehategod", "ac/dc", "acdc", "guns n roses"],
    cats: ["hard", "stoner"],
  },
  dorian: {
    tags: ["iron maiden", "opeth", "tool", "mastodon", "blood and thunder", "crack the skye", "baroness", "alice in chains", "rooster", "led zeppelin", "black sabbath", "thin lizzy", "whiskey in the jar", "the boys are back in town", "clutch", "type o negative", "black no 1", "amorphis", "alcest", "santana", "pink floyd", "money"],
    cats: ["hard", "stoner"],
  },
  locrian: {
    tags: ["meshuggah", "bleed", "rational gaze", "periphery", "animals as leaders", "djent", "strapping young lad", "devin townsend", "fear factory", "gojira"],
  },
  "dim-hw": {
    tags: ["meshuggah", "fear factory", "dream theater", "death", "chuck schuldiner", "symbolic", "diminished"],
  },
  "double-harmonic": {
    tags: ["nile", "behemoth", "kashmir", "led zeppelin", "system of a down", "soad", "bysantti"],
  },
  "hungarian-minor": {
    tags: ["nile", "behemoth", "eksoottinen", "musta metalli"],
  },
  ionian: {
    tags: ["iron maiden", "helloween", "thin lizzy", "boston", "more than a feeling", "journey", "duuri", "hard rock"],
    cats: ["hard"],
  },
  lydian: {
    tags: ["steve vai", "joe satriani", "dream theater", "petrucci", "animals as leaders", "rush", "alex lifeson", "tom sawyer", "frank zappa", "baroness"],
    cats: ["hard"],
  },
  mixolydian: {
    tags: ["ac/dc", "acdc", "guns n roses", "sweet child o mine", "van halen", "qotsa", "queens of the stone age", "kyuss", "clutch", "foo fighters", "audioslave", "led zeppelin", "deep purple", "thin lizzy", "ghost", "square hammer", "sabaton", "korpiklaani", "the who", "rolling stones", "cream", "sunshine of your love", "jimi hendrix", "fire", "hey joe", "the cult", "wolfmother", "airbourne", "rose tattoo", "accept", "scorpions", "whitesnake", "europe", "ratt", "dokken", "winger", "skid row", "bon jovi", "def leppard"],
    cats: ["hard", "stoner"],
  },
  "major-pent": {
    tags: ["zz top", "ac/dc", "acdc", "allman brothers", "srv", "kiss", "cheap trick", "duuri", "hard rock"],
    cats: ["hard"],
  },
  "melodic-minor": {
    tags: ["opeth", "dream theater", "petrucci", "yngwie", "symphony x", "jazz"],
  },
  oriental: { tags: ["nile", "behemoth", "eksoottinen"] },
  persian: { tags: ["nile", "behemoth", "eksoottinen"] },
  "lydian-dominant": { tags: ["vai", "steve vai", "satriani", "dream theater", "overtone", "acoustic scale"] },
  altered: { tags: ["jazz", "dominatti", "fusion", "holdsworth"] },
};

const BANDS = bandTags();

for (const scale of SCALES) {
  const extra = EXTRA[scale.id];
  if (extra) {
    for (const tag of extra.tags) {
      if (!scale.tags.includes(tag)) scale.tags.push(tag);
    }
    for (const cat of extra.cats ?? []) {
      if (!scale.categories.includes(cat)) scale.categories.push(cat);
    }
  }
  const bands = BANDS.get(scale.id);
  if (!bands) continue;
  for (const tag of bands) {
    if (!scale.tags.includes(tag)) scale.tags.push(tag);
  }
}

export function scaleById(id: string): Scale {
  return SCALES.find((s) => s.id === id) ?? SCALES[0];
}

function haystack(scale: Scale): string {
  return norm([scale.name, scale.formula, scale.hint, ...scale.tags, ...scale.categories].join(" "));
}

export function filterScales(cat: ScaleCategory | "all", query: string): Scale[] {
  const q = norm(query.trim());
  let list = SCALES.filter((s) => {
    if (q) return haystack(s).includes(q);
    return cat === "all" || s.categories.includes(cat);
  });
  if (!q && cat === "mode") list = [...list].sort((a, b) => (a.modeIndex ?? 99) - (b.modeIndex ?? 99));
  return list;
}
