// Common city coordinates for drawing routes (add more as needed)
export const CITY_COORDS = {
  mumbai: [19.076, 72.8777],
  pune: [18.5204, 73.8567],
  nashik: [19.9975, 73.7898],
  nagpur: [21.1458, 79.0882],
  thane: [19.2183, 72.9781],
  surat: [21.1702, 72.8311],
  ahmedabad: [23.0225, 72.5714],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  hyderabad: [17.385, 78.4867],
  delhi: [28.7041, 77.1025],
  jaipur: [26.9124, 75.7873],
  indore: [22.7196, 75.8577],
  bhopal: [23.2599, 77.4126],
  kolhapur: [16.705, 74.2433],
  solapur: [17.6599, 75.9064],
  aurangabad: [19.8762, 75.3433],
};

export function cityCoords(name) {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  return CITY_COORDS[key] || null;
}