/**
 * Comprehensive Tamil Nadu Districts, Major Towns, Localities, and GPS Coordinates
 * Path: src/data/tamilNaduLocations.js
 * 
 * Covers all 38 districts of Tamil Nadu, India with major hubs, taluks,
 * neighborhoods, and GPS coordinates for distance calculation.
 */

export const TAMIL_NADU_DISTRICTS = [
  {
    id: 'chennai',
    name: 'Chennai',
    region: 'Northern Tamil Nadu',
    coordinates: { lat: 13.0827, lng: 80.2707 },
    places: [
      'T. Nagar',
      'Anna Nagar',
      'Adyar',
      'Velachery',
      'Mylapore',
      'Guindy',
      'Porur',
      'Tambaram',
      'Chromepet',
      'Pallavaram',
      'Alwarpet',
      'Nungambakkam',
      'Kodambakkam',
      'Royapettah',
      'Thiruvanmiyur',
      'Sholinganallur (OMR)',
      'Perambur',
      'Kilpauk',
      'Ambattur',
      'Avadi',
      'Egmore',
      'Vadapalani',
      'Saidapet',
    ],
  },
  {
    id: 'coimbatore',
    name: 'Coimbatore',
    region: 'Western Tamil Nadu (Kongu)',
    coordinates: { lat: 11.0168, lng: 76.9558 },
    places: [
      'Gandhipuram',
      'RS Puram',
      'Peelamedu',
      'Saibaba Colony',
      'Saravanampatti',
      'Singanallur',
      'Ukkadam',
      'Kuniamuthur',
      'Thudiyalur',
      'Ganapathy',
      'Vadavalli',
      'Ramanathapuram',
      'Kovaipudur',
      'Pollachi',
      'Mettupalayam',
      'Sulur',
    ],
  },
  {
    id: 'madurai',
    name: 'Madurai',
    region: 'Southern Tamil Nadu',
    coordinates: { lat: 9.9252, lng: 78.1198 },
    places: [
      'Anna Nagar',
      'KK Nagar',
      'Simmakkal',
      'Goripalayam',
      'Mattuthavani',
      'Tallakulam',
      'Thiruparankundram',
      'Villapuram',
      'Othakadai',
      'Melur',
      'Vadipatti',
      'Usilampatti',
      'Sellur',
      'Arapalayam',
      'Pudur',
    ],
  },
  {
    id: 'tiruchirappalli',
    name: 'Tiruchirappalli (Trichy)',
    region: 'Central Tamil Nadu',
    coordinates: { lat: 10.7905, lng: 78.7047 },
    places: [
      'Thillai Nagar',
      'Srirangam',
      'Cantonment',
      'KK Nagar',
      'Ponmalai (Golden Rock)',
      'Woraiyur',
      'Kattur',
      'Central Bus Stand Area',
      'Tiruverumbur',
      'Lalgudi',
      'Manapparai',
      'Musiri',
      'Thuraiyur',
    ],
  },
  {
    id: 'salem',
    name: 'Salem',
    region: 'Western Tamil Nadu',
    coordinates: { lat: 11.6643, lng: 78.1460 },
    places: [
      'Salem Town',
      'Hasthampatti',
      'Fairlands',
      'Suramangalam',
      'Ammapet',
      'Shevapet',
      'Attur',
      'Mettur',
      'Omalur',
      'Edappadi',
      'Sankari',
      'Junction Area',
    ],
  },
  {
    id: 'tirunelveli',
    name: 'Tirunelveli',
    region: 'Southern Tamil Nadu',
    coordinates: { lat: 8.7139, lng: 77.7567 },
    places: [
      'Tirunelveli Town',
      'Palayamkottai',
      'Melapalayam',
      'Tirunelveli Junction',
      'Vannarpettai',
      'Perumalpuram',
      'Ambasamudram',
      'Cheranmahadevi',
      'Nanguneri',
      'Radhapuram',
    ],
  },
  {
    id: 'tiruppur',
    name: 'Tiruppur',
    region: 'Western Tamil Nadu',
    coordinates: { lat: 11.1085, lng: 77.3411 },
    places: [
      'Tiruppur Town',
      'Avinashi',
      'Palladam',
      'Dharapuram',
      'Kangeyam',
      'Udumalaipettai',
      'Madathukulam',
      'Vellakoil',
      'Mangalam',
    ],
  },
  {
    id: 'erode',
    name: 'Erode',
    region: 'Western Tamil Nadu',
    coordinates: { lat: 11.3410, lng: 77.7172 },
    places: [
      'Erode City',
      'Perundurai',
      'Bhavani',
      'Gobichettipalayam',
      'Sathyamangalam',
      'Anthiyur',
      'Modakkurichi',
      'Chithode',
    ],
  },
  {
    id: 'vellore',
    name: 'Vellore',
    region: 'Northern Tamil Nadu',
    coordinates: { lat: 12.9165, lng: 79.1325 },
    places: [
      'Vellore Fort Area',
      'Katpadi',
      'Sathuvachari',
      'Gudiyatham',
      'Bagayam',
      'Anaicut',
      'Pernambut',
      'Konavattam',
      'Thorapadi',
    ],
  },
  {
    id: 'thanjavur',
    name: 'Thanjavur',
    region: 'Delta Region',
    coordinates: { lat: 10.7870, lng: 79.1378 },
    places: [
      'Thanjavur Town',
      'Medical College Area',
      'Kumbakonam',
      'Pattukkottai',
      'Thiruvaiyaru',
      'Papanasam',
      'Peravurani',
      'Orathanadu',
    ],
  },
  {
    id: 'chengalpattu',
    name: 'Chengalpattu',
    region: 'Northern Tamil Nadu',
    coordinates: { lat: 12.6939, lng: 79.9757 },
    places: [
      'Chengalpattu Town',
      'Tambaram South',
      'Guduvanchery',
      'Maraimalai Nagar',
      'Kelambakkam',
      'Mahabalipuram',
      'Maduranthakam',
      'Singaperumal Koil',
      'Thiruporur',
    ],
  },
  {
    id: 'kanchipuram',
    name: 'Kanchipuram',
    region: 'Northern Tamil Nadu',
    coordinates: { lat: 12.8342, lng: 79.7036 },
    places: [
      'Kanchipuram Town',
      'Sriperumbudur',
      'Walajabad',
      'Uthiramerur',
      'Kundrathur',
      'Sunguvarchatram',
    ],
  },
  {
    id: 'tiruvallur',
    name: 'Tiruvallur',
    region: 'Northern Tamil Nadu',
    coordinates: { lat: 13.1432, lng: 79.9079 },
    places: [
      'Tiruvallur Town',
      'Avadi',
      'Poonamallee',
      'Thiruninravur',
      'Gummidipoondi',
      'Ponneri',
      'Tiruttani',
      'Red Hills',
      'Minjur',
    ],
  },
  {
    id: 'thoothukudi',
    name: 'Thoothukudi (Tuticorin)',
    region: 'Southern Tamil Nadu',
    coordinates: { lat: 8.7642, lng: 78.1348 },
    places: [
      'Thoothukudi Port Area',
      'Millerpuram',
      'Kovilpatti',
      'Tiruchendur',
      'Kayalpattinam',
      'Sathankulam',
      'Vilathikulam',
      'Ettayapuram',
    ],
  },
  {
    id: 'kanyakumari',
    name: 'Kanyakumari',
    region: 'Southernmost Tamil Nadu',
    coordinates: { lat: 8.0883, lng: 77.5385 },
    places: [
      'Nagercoil',
      'Kanyakumari Town',
      'Marthandam',
      'Thuckalay',
      'Colachel',
      'Padmanabhapuram',
      'Karungal',
      'Kuzhithurai',
    ],
  },
  {
    id: 'dindigul',
    name: 'Dindigul',
    region: 'Central-South Tamil Nadu',
    coordinates: { lat: 10.3673, lng: 77.9803 },
    places: [
      'Dindigul Town',
      'Palani',
      'Kodaikanal',
      'Oddanchatram',
      'Natham',
      'Nilakottai',
      'Vedasandur',
      'Batlagundu',
    ],
  },
  {
    id: 'cuddalore',
    name: 'Cuddalore',
    region: 'Coastal Tamil Nadu',
    coordinates: { lat: 11.7480, lng: 79.7714 },
    places: [
      'Cuddalore Town',
      'Chidambaram',
      'Panruti',
      'Vridhachalam',
      'Neyveli Township',
      'Kattumannarkoil',
      'Kurinjipadi',
      'Tittakudi',
    ],
  },
  {
    id: 'krishnagiri',
    name: 'Krishnagiri',
    region: 'North-Western Tamil Nadu',
    coordinates: { lat: 12.5186, lng: 78.2137 },
    places: [
      'Krishnagiri Town',
      'Hosur',
      'Denkanikottai',
      'Pochampalli',
      'Uthangarai',
      'Bargur',
      'Shoolagiri',
      'Kelamangalam',
    ],
  },
  {
    id: 'dharmapuri',
    name: 'Dharmapuri',
    region: 'North-Western Tamil Nadu',
    coordinates: { lat: 12.1211, lng: 78.1582 },
    places: [
      'Dharmapuri Town',
      'Harur',
      'Palacode',
      'Pennagaram',
      'Pappireddipatti',
      'Karimangalam',
      'Morappur',
    ],
  },
  {
    id: 'namakkal',
    name: 'Namakkal',
    region: 'Central-Western Tamil Nadu',
    coordinates: { lat: 11.2189, lng: 78.1674 },
    places: [
      'Namakkal Town',
      'Rasipuram',
      'Tiruchengode',
      'Paramathi Velur',
      'Kolli Hills',
      'Kumarapalayam',
      'Sendamangalam',
    ],
  },
  {
    id: 'karur',
    name: 'Karur',
    region: 'Central Tamil Nadu',
    coordinates: { lat: 10.9601, lng: 78.0766 },
    places: [
      'Karur Town',
      'Kulithalai',
      'Aravakurichi',
      'Krishnarayapuram',
      'Pugalur',
      'Vangal',
      'Thogaimalai',
    ],
  },
  {
    id: 'nagapattinam',
    name: 'Nagapattinam',
    region: 'Coastal Delta Tamil Nadu',
    coordinates: { lat: 10.7672, lng: 79.8449 },
    places: [
      'Nagapattinam Town',
      'Velankanni',
      'Kilvelur',
      'Vedaranyam',
      'Thirukkuvalai',
      'Nagore',
    ],
  },
  {
    id: 'mayiladuthurai',
    name: 'Mayiladuthurai',
    region: 'Delta Tamil Nadu',
    coordinates: { lat: 11.1075, lng: 79.6524 },
    places: [
      'Mayiladuthurai Town',
      'Sirkazhi',
      'Tharangambadi (Tranquebar)',
      'Kuthalam',
      'Sembanarkoil',
      'Poompuhar',
    ],
  },
  {
    id: 'tiruvarur',
    name: 'Tiruvarur',
    region: 'Delta Tamil Nadu',
    coordinates: { lat: 10.7725, lng: 79.6365 },
    places: [
      'Tiruvarur Town',
      'Mannargudi',
      'Thiruthuraipoondi',
      'Nannilam',
      'Kodavasal',
      'Valangaiman',
      'Needamangalam',
    ],
  },
  {
    id: 'tiruvannamalai',
    name: 'Tiruvannamalai',
    region: 'Northern Tamil Nadu',
    coordinates: { lat: 12.2253, lng: 79.0747 },
    places: [
      'Tiruvannamalai Town',
      'Arani',
      'Polur',
      'Cheyyar',
      'Chengam',
      'Vandavasi',
      'Kalasapakkam',
      'Kilpennathur',
    ],
  },
  {
    id: 'viluppuram',
    name: 'Viluppuram',
    region: 'Northern Tamil Nadu',
    coordinates: { lat: 11.9401, lng: 79.4861 },
    places: [
      'Viluppuram Town',
      'Tindivanam',
      'Gingee',
      'Vikravandi',
      'Vanur',
      'Marakkanam',
      'Kandachipuram',
    ],
  },
  {
    id: 'kallakurichi',
    name: 'Kallakurichi',
    region: 'Central-Northern Tamil Nadu',
    coordinates: { lat: 11.7384, lng: 78.9639 },
    places: [
      'Kallakurichi Town',
      'Ulundurpet',
      'Sankarapuram',
      'Tirukoilur',
      'Chinnasalem',
      'Kalvarayan Hills',
    ],
  },
  {
    id: 'ranipet',
    name: 'Ranipet',
    region: 'Northern Tamil Nadu',
    coordinates: { lat: 12.9224, lng: 79.3328 },
    places: [
      'Ranipet Town',
      'Walajah',
      'Arcot',
      'Arakkonam',
      'Sholinghur',
      'Nemili',
      'Panapakkam',
    ],
  },
  {
    id: 'tirupathur',
    name: 'Tirupathur',
    region: 'Northern Tamil Nadu',
    coordinates: { lat: 12.4925, lng: 78.5636 },
    places: [
      'Tirupathur Town',
      'Vaniyambadi',
      'Ambur',
      'Natrampalli',
      'Jolarpettai',
      'Yelagiri Hills',
    ],
  },
  {
    id: 'pudukkottai',
    name: 'Pudukkottai',
    region: 'Central Tamil Nadu',
    coordinates: { lat: 10.3797, lng: 78.8208 },
    places: [
      'Pudukkottai Town',
      'Aranthangi',
      'Alangudi',
      'Gandarvakottai',
      'Viralimalai',
      'Thirumayam',
      'Ponnamaravathi',
      'Avudaiyarkoil',
    ],
  },
  {
    id: 'sivaganga',
    name: 'Sivaganga',
    region: 'Southern Tamil Nadu',
    coordinates: { lat: 9.8433, lng: 78.4809 },
    places: [
      'Sivaganga Town',
      'Karaikudi',
      'Devakottai',
      'Manamadurai',
      'Tiruppattur',
      'Kalayarkoil',
      'Singampunari',
      'Ilayangudi',
    ],
  },
  {
    id: 'ramanathapuram',
    name: 'Ramanathapuram',
    region: 'Coastal Southern Tamil Nadu',
    coordinates: { lat: 9.3639, lng: 78.8395 },
    places: [
      'Ramanathapuram Town',
      'Rameswaram',
      'Paramakudi',
      'Kilakarai',
      'Mudukulathur',
      'Kamuthi',
      'Tiruvadanai',
      'Mandapam',
    ],
  },
  {
    id: 'virudhunagar',
    name: 'Virudhunagar',
    region: 'Southern Tamil Nadu',
    coordinates: { lat: 9.5680, lng: 77.9624 },
    places: [
      'Virudhunagar Town',
      'Sivakasi',
      'Rajapalayam',
      'Srivilliputhur',
      'Aruppukkottai',
      'Sattur',
      'Watrap',
      'Kariapatti',
    ],
  },
  {
    id: 'theni',
    name: 'Theni',
    region: 'Western Ghats Tamil Nadu',
    coordinates: { lat: 10.0104, lng: 77.4768 },
    places: [
      'Theni Town',
      'Periyakulam',
      'Bodinayakanur',
      'Cumbum',
      'Uthamapalayam',
      'Andipatti',
      'Chinnamanur',
      'Megamalai',
    ],
  },
  {
    id: 'tenkasi',
    name: 'Tenkasi',
    region: 'Southern Tamil Nadu',
    coordinates: { lat: 8.9594, lng: 77.3161 },
    places: [
      'Tenkasi Town',
      'Courtallam',
      'Sankarankovil',
      'Kadayanallur',
      'Sengottai',
      'Alangulam',
      'Pavoorchatram',
      'Puliyangudi',
    ],
  },
  {
    id: 'ariyalur',
    name: 'Ariyalur',
    region: 'Central Tamil Nadu',
    coordinates: { lat: 11.1401, lng: 79.0786 },
    places: [
      'Ariyalur Town',
      'Jayankondam',
      'Sendurai',
      'Udayarpalayam',
      'Andimadam',
      'Gangaikonda Cholapuram Area',
    ],
  },
  {
    id: 'perambalur',
    name: 'Perambalur',
    region: 'Central Tamil Nadu',
    coordinates: { lat: 11.2342, lng: 78.8804 },
    places: [
      'Perambalur Town',
      'Veppanthattai',
      'Kunnam',
      'Alathur',
      'Poolambadi',
    ],
  },
  {
    id: 'nilgiris',
    name: 'Nilgiris (Ooty)',
    region: 'Western Ghats Tamil Nadu',
    coordinates: { lat: 11.4102, lng: 76.6950 },
    places: [
      'Udhagamandalam (Ooty)',
      'Coonoor',
      'Kotagiri',
      'Gudalur',
      'Wellington',
      'Kundah',
      'Aruvankadu',
    ],
  },
];

export const DEFAULT_DISTRICT_ID = 'chennai';
export const DEFAULT_PLACE = 'T. Nagar';

/**
 * Calculates straight-line distance in Kilometers between two coordinates using the Haversine formula
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 2.5;
  }
  const R = 6371; // Earth's radius in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

/**
 * Find district by ID
 */
export function getDistrictById(districtId) {
  if (!districtId) return TAMIL_NADU_DISTRICTS[0];
  const found = TAMIL_NADU_DISTRICTS.find(
    (d) => d.id.toLowerCase() === String(districtId).toLowerCase()
  );
  return found || TAMIL_NADU_DISTRICTS[0];
}

/**
 * Find district by Name
 */
export function findDistrictByName(districtName) {
  if (!districtName) return TAMIL_NADU_DISTRICTS[0];
  const query = String(districtName).toLowerCase().trim();
  const found = TAMIL_NADU_DISTRICTS.find(
    (d) => d.name.toLowerCase().includes(query) || query.includes(d.name.toLowerCase())
  );
  return found || TAMIL_NADU_DISTRICTS[0];
}

/**
 * Get all available places/towns for a district
 */
export function getPlacesForDistrict(districtId) {
  const district = getDistrictById(districtId);
  return district ? district.places : [];
}

/**
 * Format full official Tamil Nadu address string
 */
export function formatFullAddress({
  address = '',
  place = '',
  district = '',
  pincode = '',
  state = 'Tamil Nadu',
} = {}) {
  const parts = [];
  if (address && address.trim()) parts.push(address.trim());
  if (place && place.trim()) parts.push(place.trim());
  if (district && district.trim()) parts.push(district.trim());
  if (state && state.trim()) parts.push(state.trim());
  if (pincode && pincode.trim()) parts.push(`PIN: ${pincode.trim()}`);
  return parts.join(', ');
}

export default TAMIL_NADU_DISTRICTS;
