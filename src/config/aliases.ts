// Every value is passed through normalizeString() before comparison (in
// useGameStore), which lowercases, strips accents, and drops '.', ',', '-'
// - so "República Dominicana" and "republica dominicana" are the same
// match. Write these in natural spelling; don't pre-strip accents.
export const ALIASES: Record<string, string[]> = {
  // Region Aliases
  "washington dc": ["dc", "district of columbia"],
  "czechia": [
    "czech republic",
    "republica checa", "republique tcheque", "repubblica ceca",
    "tschechien", "tschechische republik", "チェコ", "チェコ共和国",
    "чехия", "чешская республика", "捷克", "捷克共和国",
  ],
  "united kingdom": [
    "uk", "great britain",
    "reino unido", "gran bretana", "royaume uni", "grande bretagne",
    "regno unito", "gran bretagna", "gra-bretanha",
    "vereinigtes konigreich", "grossbritannien",
    "イギリス", "英国", "連合王国",
    "соединенное королевство", "великобритания", "联合王国",
  ],
  // Capital Aliases
  "saint paul": ["st paul"],
  "kyiv": ["kiev"],
  "djibouti city": ["djibouti"],
  "mbabane": ["lobamba"],
  "pretoria": ["cape town", "bloemfontein"],
  "dodoma": ["dar es salaam"],
  "laayoune": ["el aaiun"],
  "colombo": ["sri jayawardenepura kotte", "kotte"],
  "naypyidaw": ["yangon", "rangoon"],
  "sanaa": ["aden", "sana'a"],
  "kuwait city": ["kuwait"],
  // World country aliases: the map topology uses an abbreviated or
  // alternate English name for these, so both the natural short and full
  // forms need accepting - and in every supported language, not just
  // English, so a guess like "RDC" or "República Dominicana" works too.
  "antigua and barb": ["antigua and barbuda"],
  "bosnia and herz": ["bosnia and herzegovina"],
  "central african rep": [
    "central african republic",
    "republica centroafricana", "republique centrafricaine", "centrafrique",
    "repubblica centrafricana", "republica centro-africana",
    "zentralafrikanische republik",
    "中央アフリカ共和国", "центральноафриканская республика", "цар",
    "中非共和国",
  ],
  "cote d'ivoire": [
    "ivory coast",
    "costa de marfil", "costa d'avorio", "costa do marfim",
    "elfenbeinkuste", "コートジボワール",
    "кот-д'ивуар", "берег слоновой кости",
    "科特迪瓦", "象牙海岸",
  ],
  "dem rep congo": [
    "democratic republic of the congo", "dr congo", "drc", "congo kinshasa",
    "republica democratica del congo", "rd congo",
    "republique democratique du congo", "rdc",
    "repubblica democratica del congo", "republica democratica do congo",
    "demokratische republik kongo", "kongo kinshasa",
    "コンゴ民主共和国",
    "демократическая республика конго", "дрк",
    "刚果民主共和国", "刚果金",
  ],
  "congo": [
    "republic of the congo", "congo brazzaville",
    "republica del congo", "republique du congo", "repubblica del congo",
    "republica do congo", "republik kongo", "kongo brazzaville",
    "コンゴ共和国", "республика конго", "刚果共和国", "刚果布",
  ],
  "dominican rep": [
    "dominican republic",
    "republica dominicana", "republique dominicaine", "repubblica dominicana",
    "dominikanische republik", "ドミニカ共和国",
    "доминиканская республика", "多米尼加共和国",
  ],
  "eq guinea": ["equatorial guinea"],
  "eswatini": [
    "swaziland", "suazilandia", "swasiland", "スワジランド", "свазиленд",
    "斯威士兰",
  ],
  "macedonia": [
    "north macedonia",
    "macedonia del norte", "macedoine du nord", "macedonia del nord",
    "macedonia do norte", "nordmazedonien", "北マケドニア",
    "северная македония", "北马其顿",
  ],
  "marshall is": ["marshall islands"],
  "s sudan": ["south sudan"],
  "solomon is": ["solomon islands"],
  "st kitts and nevis": ["saint kitts and nevis"],
  "st vin and gren": ["saint vincent and the grenadines", "st vincent and the grenadines"],
  "united states of america": [
    "united states", "usa", "us", "america",
    "estados unidos", "eeuu", "eua", "etats unis", "stati uniti",
    "vereinigte staaten",
    "アメリカ", "アメリカ合衆国", "米国",
    "соединенные штаты", "сша",
    "美国", "美利坚合众国",
  ],
  "w sahara": ["western sahara"],
  "timorleste": ["timor leste", "east timor"],
  "guineabissau": ["guinea bissau"],
  "myanmar": [
    "burma", "birmania", "birmanie", "birma", "ビルマ", "бирма",
  ],
  "russia": [
    "russian federation",
    "federacion rusa", "federation de russie", "federazione russa",
    "federacao russa", "russische foderation",
    "ロシア連邦", "российская федерация", "俄罗斯联邦",
  ],
  "vatican": ["vatican city"],
  "micronesia": ["federated states of micronesia", "fsm"],
  "cabo verde": ["cape verde"],
  "bahamas": ["the bahamas"],
  "gambia": ["the gambia"],
  "netherlands": [
    "holland",
    "paises bajos", "pays bas", "paesi bassi", "paises baixos",
    "niederlande", "オランダ", "нидерланды", "荷兰",
  ],
  "palestine": ["state of palestine", "palestinian territories"],
  "turkey": [
    "turkiye", "turquia", "turquie", "turchia", "turkei", "トルコ",
    "турция", "土耳其",
  ],
  "sao tome and principe": ["sao tome"],
};
