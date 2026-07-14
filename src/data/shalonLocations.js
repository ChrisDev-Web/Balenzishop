export const LIMA_CITY = 'Lima'
export const PROVINCE_CITIES = ['Arequipa', 'Trujillo', 'Piura', 'Cusco']
export const cities = [LIMA_CITY, ...PROVINCE_CITIES]

export function getCitiesForScope(scope) {
  return scope === 'lima' ? [LIMA_CITY] : PROVINCE_CITIES
}
