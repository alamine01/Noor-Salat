/**
 * Pays et villes proposés dans Réglages › Lieu, avec la méthode de calcul usuelle de chaque pays
 * (identifiants de l'API Aladhan) et l'école pour l'Asr (0 = standard / malikite-chafiite, 1 = hanafite).
 * Coordonnées arrondies au centième (≈ 1 km) : largement assez précis pour les heures de prière.
 */

export const METHOD_NAMES: Record<number, string> = {
  1: 'Université des sciences islamiques de Karachi',
  2: 'ISNA (Amérique du Nord)',
  3: 'Ligue islamique mondiale',
  4: 'Umm al-Qura (La Mecque)',
  5: 'Autorité égyptienne',
  8: 'Région du Golfe',
  9: 'Koweït',
  10: 'Qatar',
  12: 'UOIF (France)',
  13: 'Diyanet (Turquie)',
  15: 'Moonsighting Committee',
  16: 'Dubaï',
  18: 'Tunisie',
  19: 'Algérie',
  21: 'Maroc',
};

export type City = { key: string; name: string; lat: number; lng: number; tz: string };
export type Country = { code: string; name: string; flag: string; method: number; school: 0 | 1; cities: City[] };

type Raw = [key: string, name: string, lat: number, lng: number, tz?: string];
function country(code: string, name: string, flag: string, tz: string, method: number, school: 0 | 1, raw: Raw[]): Country {
  return { code, name, flag, method, school, cities: raw.map(([key, n, lat, lng, t]) => ({ key, name: n, lat, lng, tz: t ?? tz })) };
}

export const COUNTRIES: Country[] = [
  country('sn', 'Sénégal', '🇸🇳', 'Africa/Dakar', 3, 0, [
    ['dakar', 'Dakar', 14.69, -17.45], ['pikine', 'Pikine', 14.75, -17.39], ['rufisque', 'Rufisque', 14.72, -17.27],
    ['touba', 'Touba', 14.85, -15.88], ['thies', 'Thiès', 14.79, -16.93], ['tivaouane', 'Tivaouane', 14.95, -16.82],
    ['mbour', 'Mbour', 14.42, -16.96], ['saint-louis', 'Saint-Louis', 16.02, -16.49], ['louga', 'Louga', 15.62, -16.23],
    ['kaolack', 'Kaolack', 14.17, -16.07], ['fatick', 'Fatick', 14.34, -16.41], ['kaffrine', 'Kaffrine', 14.11, -15.55],
    ['diourbel', 'Diourbel', 14.66, -16.23], ['ziguinchor', 'Ziguinchor', 12.58, -16.27], ['kolda', 'Kolda', 12.89, -14.94],
    ['sedhiou', 'Sédhiou', 12.71, -15.56], ['tambacounda', 'Tambacounda', 13.77, -13.67], ['kedougou', 'Kédougou', 12.56, -12.18],
    ['matam', 'Matam', 15.66, -13.26], ['richard-toll', 'Richard-Toll', 16.46, -15.70], ['podor', 'Podor', 16.65, -14.96],
  ]),
  country('ml', 'Mali', '🇲🇱', 'Africa/Bamako', 3, 0, [
    ['bamako', 'Bamako', 12.64, -8.0], ['sikasso', 'Sikasso', 11.32, -5.67], ['segou', 'Ségou', 13.43, -6.26],
    ['mopti', 'Mopti', 14.49, -4.2], ['kayes', 'Kayes', 14.45, -11.44], ['tombouctou', 'Tombouctou', 16.77, -3.01], ['gao', 'Gao', 16.27, -0.04],
  ]),
  country('mr', 'Mauritanie', '🇲🇷', 'Africa/Nouakchott', 3, 0, [
    ['nouakchott', 'Nouakchott', 18.08, -15.98], ['nouadhibou', 'Nouadhibou', 20.94, -17.04], ['rosso', 'Rosso', 16.51, -15.81],
    ['kaedi', 'Kaédi', 16.15, -13.5], ['kiffa', 'Kiffa', 16.62, -11.4],
  ]),
  country('gm', 'Gambie', '🇬🇲', 'Africa/Banjul', 3, 0, [
    ['banjul', 'Banjul', 13.45, -16.58], ['serekunda', 'Serekunda', 13.44, -16.68], ['brikama', 'Brikama', 13.27, -16.65],
  ]),
  country('gw', 'Guinée-Bissau', '🇬🇼', 'Africa/Bissau', 3, 0, [
    ['bissau', 'Bissau', 11.86, -15.6], ['bafata', 'Bafatá', 12.17, -14.66], ['gabu', 'Gabú', 12.28, -14.22],
  ]),
  country('gn', 'Guinée', '🇬🇳', 'Africa/Conakry', 3, 0, [
    ['conakry', 'Conakry', 9.64, -13.58], ['kankan', 'Kankan', 10.39, -9.31], ['labe', 'Labé', 11.32, -12.28],
    ['kindia', 'Kindia', 10.06, -12.86], ['nzerekore', 'Nzérékoré', 7.75, -8.82],
  ]),
  country('ci', 'Côte d’Ivoire', '🇨🇮', 'Africa/Abidjan', 3, 0, [
    ['abidjan', 'Abidjan', 5.36, -4.01], ['bouake', 'Bouaké', 7.69, -5.03], ['yamoussoukro', 'Yamoussoukro', 6.82, -5.28],
    ['korhogo', 'Korhogo', 9.46, -5.63], ['daloa', 'Daloa', 6.88, -6.45], ['san-pedro', 'San-Pédro', 4.75, -6.64],
  ]),
  country('bf', 'Burkina Faso', '🇧🇫', 'Africa/Ouagadougou', 3, 0, [
    ['ouagadougou', 'Ouagadougou', 12.37, -1.52], ['bobo-dioulasso', 'Bobo-Dioulasso', 11.18, -4.3], ['koudougou', 'Koudougou', 12.25, -2.36],
  ]),
  country('ne', 'Niger', '🇳🇪', 'Africa/Niamey', 3, 0, [
    ['niamey', 'Niamey', 13.51, 2.11], ['zinder', 'Zinder', 13.8, 8.99], ['maradi', 'Maradi', 13.5, 7.1], ['agadez', 'Agadez', 16.97, 7.99],
  ]),
  country('ng', 'Nigeria', '🇳🇬', 'Africa/Lagos', 3, 0, [
    ['lagos', 'Lagos', 6.52, 3.38], ['abuja', 'Abuja', 9.08, 7.4], ['kano', 'Kano', 12.0, 8.52], ['sokoto', 'Sokoto', 13.06, 5.24], ['kaduna', 'Kaduna', 10.52, 7.44],
  ]),
  country('cm', 'Cameroun', '🇨🇲', 'Africa/Douala', 3, 0, [
    ['yaounde', 'Yaoundé', 3.85, 11.5], ['douala', 'Douala', 4.05, 9.77], ['garoua', 'Garoua', 9.3, 13.4],
    ['maroua', 'Maroua', 10.59, 14.32], ['ngaoundere', 'Ngaoundéré', 7.32, 13.58],
  ]),
  country('td', 'Tchad', '🇹🇩', 'Africa/Ndjamena', 3, 0, [
    ['ndjamena', 'N’Djamena', 12.13, 15.06], ['moundou', 'Moundou', 8.57, 16.08], ['abeche', 'Abéché', 13.83, 20.83],
  ]),
  country('km', 'Comores', '🇰🇲', 'Indian/Comoro', 3, 0, [['moroni', 'Moroni', -11.7, 43.26], ['mutsamudu', 'Mutsamudu', -12.17, 44.4]]),
  country('dj', 'Djibouti', '🇩🇯', 'Africa/Djibouti', 3, 0, [['djibouti', 'Djibouti', 11.59, 43.15]]),
  country('ma', 'Maroc', '🇲🇦', 'Africa/Casablanca', 21, 0, [
    ['casablanca', 'Casablanca', 33.57, -7.59], ['rabat', 'Rabat', 34.02, -6.84], ['marrakech', 'Marrakech', 31.63, -8.01],
    ['fes', 'Fès', 34.03, -5.0], ['tanger', 'Tanger', 35.76, -5.83], ['agadir', 'Agadir', 30.43, -9.6], ['oujda', 'Oujda', 34.68, -1.91],
  ]),
  country('dz', 'Algérie', '🇩🇿', 'Africa/Algiers', 19, 0, [
    ['alger', 'Alger', 36.75, 3.06], ['oran', 'Oran', 35.7, -0.63], ['constantine', 'Constantine', 36.37, 6.61],
    ['annaba', 'Annaba', 36.9, 7.77], ['setif', 'Sétif', 36.19, 5.41],
  ]),
  country('tn', 'Tunisie', '🇹🇳', 'Africa/Tunis', 18, 0, [
    ['tunis', 'Tunis', 36.81, 10.18], ['sfax', 'Sfax', 34.74, 10.76], ['sousse', 'Sousse', 35.83, 10.64], ['kairouan', 'Kairouan', 35.68, 10.1],
  ]),
  country('eg', 'Égypte', '🇪🇬', 'Africa/Cairo', 5, 0, [
    ['le-caire', 'Le Caire', 30.04, 31.24], ['alexandrie', 'Alexandrie', 31.2, 29.92], ['gizeh', 'Gizeh', 30.01, 31.21],
  ]),
  country('sa', 'Arabie saoudite', '🇸🇦', 'Asia/Riyadh', 4, 0, [
    ['la-mecque', 'La Mecque', 21.42, 39.83], ['medine', 'Médine', 24.47, 39.61], ['riyad', 'Riyad', 24.71, 46.68], ['djeddah', 'Djeddah', 21.49, 39.19],
  ]),
  country('ae', 'Émirats arabes unis', '🇦🇪', 'Asia/Dubai', 16, 0, [
    ['dubai', 'Dubaï', 25.2, 55.27], ['abou-dabi', 'Abou Dabi', 24.45, 54.38], ['charjah', 'Charjah', 25.35, 55.42],
  ]),
  country('qa', 'Qatar', '🇶🇦', 'Asia/Qatar', 10, 0, [['doha', 'Doha', 25.29, 51.53]]),
  country('kw', 'Koweït', '🇰🇼', 'Asia/Kuwait', 9, 0, [['koweit', 'Koweït', 29.38, 47.99]]),
  country('tr', 'Turquie', '🇹🇷', 'Europe/Istanbul', 13, 1, [
    ['istanbul', 'Istanbul', 41.01, 28.98], ['ankara', 'Ankara', 39.93, 32.86], ['izmir', 'Izmir', 38.42, 27.14], ['bursa', 'Bursa', 40.19, 29.06],
  ]),
  country('fr', 'France', '🇫🇷', 'Europe/Paris', 3, 0, [
    ['paris', 'Paris', 48.86, 2.35], ['marseille', 'Marseille', 43.3, 5.37], ['lyon', 'Lyon', 45.76, 4.84],
    ['toulouse', 'Toulouse', 43.6, 1.44], ['lille', 'Lille', 50.63, 3.06], ['nice', 'Nice', 43.7, 7.27],
    ['bordeaux', 'Bordeaux', 44.84, -0.58], ['strasbourg', 'Strasbourg', 48.57, 7.75], ['nantes', 'Nantes', 47.22, -1.55], ['montpellier', 'Montpellier', 43.61, 3.88],
  ]),
  country('be', 'Belgique', '🇧🇪', 'Europe/Brussels', 3, 0, [
    ['bruxelles', 'Bruxelles', 50.85, 4.35], ['anvers', 'Anvers', 51.22, 4.4], ['liege', 'Liège', 50.63, 5.57], ['charleroi', 'Charleroi', 50.41, 4.44],
  ]),
  country('ch', 'Suisse', '🇨🇭', 'Europe/Zurich', 3, 0, [
    ['geneve', 'Genève', 46.2, 6.14], ['lausanne', 'Lausanne', 46.52, 6.63], ['zurich', 'Zurich', 47.37, 8.54], ['bale', 'Bâle', 47.56, 7.59],
  ]),
  country('es', 'Espagne', '🇪🇸', 'Europe/Madrid', 3, 0, [
    ['madrid', 'Madrid', 40.42, -3.7], ['barcelone', 'Barcelone', 41.39, 2.17], ['valence', 'Valence', 39.47, -0.38], ['seville', 'Séville', 37.39, -5.98],
  ]),
  country('it', 'Italie', '🇮🇹', 'Europe/Rome', 3, 0, [
    ['rome', 'Rome', 41.9, 12.5], ['milan', 'Milan', 45.46, 9.19], ['turin', 'Turin', 45.07, 7.69], ['naples', 'Naples', 40.85, 14.27],
  ]),
  country('de', 'Allemagne', '🇩🇪', 'Europe/Berlin', 3, 0, [
    ['berlin', 'Berlin', 52.52, 13.4], ['hambourg', 'Hambourg', 53.55, 9.99], ['munich', 'Munich', 48.14, 11.58],
    ['cologne', 'Cologne', 50.94, 6.96], ['francfort', 'Francfort', 50.11, 8.68],
  ]),
  country('gb', 'Royaume-Uni', '🇬🇧', 'Europe/London', 3, 0, [
    ['londres', 'Londres', 51.51, -0.13], ['birmingham', 'Birmingham', 52.49, -1.89], ['manchester', 'Manchester', 53.48, -2.24],
  ]),
  country('us', 'États-Unis', '🇺🇸', 'America/New_York', 2, 0, [
    ['new-york', 'New York', 40.71, -74.01], ['washington', 'Washington', 38.91, -77.04], ['atlanta', 'Atlanta', 33.75, -84.39],
    ['chicago', 'Chicago', 41.88, -87.63, 'America/Chicago'], ['houston', 'Houston', 29.76, -95.37, 'America/Chicago'],
    ['los-angeles', 'Los Angeles', 34.05, -118.24, 'America/Los_Angeles'],
  ]),
  country('ca', 'Canada', '🇨🇦', 'America/Toronto', 2, 0, [
    ['montreal', 'Montréal', 45.5, -73.57], ['quebec', 'Québec', 46.81, -71.21], ['ottawa', 'Ottawa', 45.42, -75.7], ['toronto', 'Toronto', 43.65, -79.38],
    ['calgary', 'Calgary', 51.05, -114.07, 'America/Edmonton'], ['vancouver', 'Vancouver', 49.28, -123.12, 'America/Vancouver'],
  ]),
];

/** Le Sénégal d'abord, puis l'ordre alphabétique français. */
export const COUNTRIES_SORTED: Country[] = [
  COUNTRIES[0],
  ...COUNTRIES.slice(1).sort((a, b) => a.name.localeCompare(b.name, 'fr')),
];

export const findCountry = (code?: string | null) => COUNTRIES.find((c) => c.code === code?.toLowerCase());

/** Réglage enregistré : « gps » ou « pays:ville » (ex. « sn:dakar »). */
export function findPlace(v: string | null | undefined): { country: Country; city: City } | null {
  if (!v || v === 'gps') return null;
  const [cc, ck] = v.includes(':') ? v.split(':') : ['sn', v]; // anciennes versions : « dakar » seul
  const country = findCountry(cc);
  const city = country?.cities.find((c) => c.key === ck);
  return country && city ? { country, city } : null;
}

/** Pour le GPS : pays déduit du fuseau horaire du téléphone (quand le géocodage n'est pas disponible). */
export function countryFromTimezone(tz: string): Country | undefined {
  return COUNTRIES.find((c) => c.cities.some((city) => city.tz === tz));
}

/** Recherche sans accents ni majuscules. */
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
