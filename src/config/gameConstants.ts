export const TIME_PER_STATE_SECONDS = 20;

export const DIFFICULTY_MULTIPLIERS = {
  easy: 1.5,
  medium: 1.0,
  hard: 0.5,
};

export const GAME_DURATIONS: Record<string, number> = {
  US_STATES: 50 * TIME_PER_STATE_SECONDS,
  BRAZIL_STATES: 28 * TIME_PER_STATE_SECONDS,
  ITALY_REGIONS: 28 * TIME_PER_STATE_SECONDS,
  FRANCE_REGIONS: 23 * TIME_PER_STATE_SECONDS,
  CANADA_PROVINCES: 13 * TIME_PER_STATE_SECONDS,
  AUSTRALIA_STATES: 8 * TIME_PER_STATE_SECONDS,
};

export const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
  "Wisconsin", "Wyoming"
];

export const BRAZIL_STATES = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal", "DF",
  "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul", 
  "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí", 
  "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia", 
  "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
];

export const ITALY_REGIONS = [
  "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", 
  "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", 
  "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", 
  "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"
];

export const FRANCE_REGIONS = [
  "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Bretagne", "Brittany", "Centre-Val de Loire", 
  "Corse", "Corsica", "Grand Est", "Hauts-de-France", "Île-de-France", "Normandie", "Normandy", 
  "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur",
  "Guadeloupe", "Guyane", "French Guiana", "La Réunion", "Reunion", "Martinique", "Mayotte"
];

export const CANADA_PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", 
  "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", 
  "Northwest Territories", "Nunavut", "Yukon"
];

export const AUSTRALIA_STATES = [
  "New South Wales", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia", 
  "Australian Capital Territory", "Northern Territory"
];

// --- NEW DATA ADDITIONS ---

export const US_CAPITALS: Record<string, string> = {
  "Alabama": "Montgomery", "Alaska": "Juneau", "Arizona": "Phoenix", "Arkansas": "Little Rock", "California": "Sacramento", "Colorado": "Denver", "Connecticut": "Hartford", "Delaware": "Dover", "Florida": "Tallahassee", "Georgia": "Atlanta", "Hawaii": "Honolulu", "Idaho": "Boise", "Illinois": "Springfield", "Indiana": "Indianapolis", "Iowa": "Des Moines", "Kansas": "Topeka", "Kentucky": "Frankfort", "Louisiana": "Baton Rouge", "Maine": "Augusta", "Maryland": "Annapolis", "Massachusetts": "Boston", "Michigan": "Lansing", "Minnesota": "St. Paul", "Mississippi": "Jackson", "Missouri": "Jefferson City", "Montana": "Helena", "Nebraska": "Lincoln", "Nevada": "Carson City", "New Hampshire": "Concord", "New Jersey": "Trenton", "New Mexico": "Santa Fe", "New York": "Albany", "North Carolina": "Raleigh", "North Dakota": "Bismarck", "Ohio": "Columbus", "Oklahoma": "Oklahoma City", "Oregon": "Salem", "Pennsylvania": "Harrisburg", "Rhode Island": "Providence", "South Carolina": "Columbia", "South Dakota": "Pierre", "Tennessee": "Nashville", "Texas": "Austin", "Utah": "Salt Lake City", "Vermont": "Montpelier", "Virginia": "Richmond", "Washington": "Olympia", "West Virginia": "Charleston", "Wisconsin": "Madison", "Wyoming": "Cheyenne"
};

export const SOUTH_AMERICA_COUNTRIES =[
  "Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Ecuador", "Guyana", "Paraguay", "Peru", "Suriname", "Uruguay", "Venezuela"
];

export const SOUTH_AMERICA_CAPITALS: Record<string, string> = {
  "Argentina": "Buenos Aires", "Bolivia": "Sucre", "Brazil": "Brasilia", "Chile": "Santiago", "Colombia": "Bogota", "Ecuador": "Quito", "Guyana": "Georgetown", "Paraguay": "Asuncion", "Peru": "Lima", "Suriname": "Paramaribo", "Uruguay": "Montevideo", "Venezuela": "Caracas"
};

export const EUROPE_COUNTRIES =[
  "Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Czechia", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kosovo", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco", "Montenegro", "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "Russia", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "Ukraine", "United Kingdom"
];

export const EUROPE_CAPITALS: Record<string, string> = {
  "Albania": "Tirana", "Andorra": "Andorra la Vella", "Austria": "Vienna", "Belarus": "Minsk", "Belgium": "Brussels", "Bosnia and Herzegovina": "Sarajevo", "Bulgaria": "Sofia", "Croatia": "Zagreb", "Czechia": "Prague", "Denmark": "Copenhagen", "Estonia": "Tallinn", "Finland": "Helsinki", "France": "Paris", "Germany": "Berlin", "Greece": "Athens", "Hungary": "Budapest", "Iceland": "Reykjavik", "Ireland": "Dublin", "Italy": "Rome", "Kosovo": "Pristina", "Latvia": "Riga", "Liechtenstein": "Vaduz", "Lithuania": "Vilnius", "Luxembourg": "Luxembourg City", "Malta": "Valletta", "Moldova": "Chisinau", "Monaco": "Monaco", "Montenegro": "Podgorica", "Netherlands": "Amsterdam", "North Macedonia": "Skopje", "Norway": "Oslo", "Poland": "Warsaw", "Portugal": "Lisbon", "Romania": "Bucharest", "Russia": "Moscow", "San Marino": "San Marino", "Serbia": "Belgrade", "Slovakia": "Bratislava", "Slovenia": "Ljubljana", "Spain": "Madrid", "Sweden": "Stockholm", "Switzerland": "Bern", "Ukraine": "Kyiv", "United Kingdom": "London"
};

export const CAPITAL_COORDINATES: Record<string, [number, number]> = {
  // US Capitals
  "Montgomery":[-86.3006, 32.3777], "Juneau":[-134.4197, 58.3019], "Phoenix":[-112.0740, 33.4484], "Little Rock":[-92.2896, 34.7465], "Sacramento":[-121.4944, 38.5816], "Denver":[-104.9903, 39.7392], "Hartford":[-72.6851, 41.7658], "Dover":[-75.5244, 39.1582], "Tallahassee":[-84.2807, 30.4383], "Atlanta": [-84.3880, 33.7490], "Honolulu": [-157.8583, 21.3069], "Boise": [-116.2023, 43.6150], "Springfield": [-89.6501, 39.7817], "Indianapolis":[-86.1581, 39.7684], "Des Moines":[-93.6091, 41.5908], "Topeka":[-95.6890, 39.0473], "Frankfort":[-84.8733, 38.2009], "Baton Rouge":[-91.1403, 30.4515], "Augusta":[-69.7795, 44.3106], "Annapolis":[-76.4922, 38.9784], "Boston":[-71.0589, 42.3601], "Lansing":[-84.5555, 42.7325], "St. Paul":[-93.1015, 44.9537], "Jackson": [-90.1848, 32.2988], "Jefferson City": [-92.1735, 38.5767], "Helena": [-112.0391, 46.5891], "Lincoln":[-96.7026, 40.8136], "Carson City":[-119.7674, 39.1638], "Concord":[-71.5328, 43.2081], "Trenton":[-74.7597, 40.2206], "Santa Fe":[-105.9378, 35.6870], "Albany":[-73.7562, 42.6526], "Raleigh":[-78.6382, 35.7796], "Bismarck":[-100.7837, 46.8083], "Columbus":[-82.9988, 39.9612], "Oklahoma City":[-97.5164, 35.4676], "Salem": [-123.0351, 44.9429], "Harrisburg": [-76.8867, 40.2732], "Providence": [-71.4128, 41.8240], "Columbia":[-81.0274, 34.0007], "Pierre":[-100.3538, 44.3683], "Nashville":[-86.7816, 36.1627], "Austin":[-97.7431, 30.2672], "Salt Lake City":[-111.8910, 40.7608], "Montpelier":[-72.5778, 44.2601], "Richmond":[-77.4360, 37.5407], "Olympia":[-122.9007, 47.0379], "Charleston":[-81.6326, 38.3498], "Madison": [-89.3841, 43.0731], "Cheyenne": [-104.8202, 41.1400],
  
  // South America Capitals
  "Buenos Aires":[-58.3816, -34.6037], "Sucre":[-65.2627, -19.0333], "Brasilia":[-47.9292, -15.7801], "Santiago": [-70.6693, -33.4489], "Bogota": [-74.0721, 4.7110], "Quito":[-78.4678, -0.1807], "Georgetown":[-58.1551, 6.8013], "Asuncion":[-57.5900, -25.2637], "Lima":[-77.0428, -12.0464], "Paramaribo":[-55.2038, 5.8520], "Montevideo":[-56.1645, -34.9011], "Caracas":[-66.9036, 10.4806],
};
