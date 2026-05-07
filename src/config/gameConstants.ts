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
