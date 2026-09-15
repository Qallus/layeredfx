// Single source of truth for LayeredFX's public business details. The Google Business Profile, the website's
// structured data and every page that shows a phone, address or hours must match these values exactly (NAP consistency).
export const business = {
  name: 'LayeredFX',
  website: 'https://layeredfx.com',
  email: 'hello@layeredfx.com',
  phone: {display: '(602) 777-3303', e164: '+16027773303', href: 'tel:+16027773303'},
  sms: {display: '(480) 999-9906', e164: '+14809999906', href: 'sms:+14809999906'},
  address: {street: '7314 E Osborn Dr Ste A', city: 'Scottsdale', region: 'AZ', postalCode: '85251', country: 'US'},
  serviceArea: {label: 'Greater Phoenix', county: 'Maricopa County', cities: ['Scottsdale', 'Phoenix', 'Tempe', 'Mesa', 'Chandler', 'Gilbert', 'Paradise Valley']},
  hours: {
    weekdays: {days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '17:00'},
    summary: 'Mon–Fri 9:00 am–5:00 pm',
    saturday: 'Saturdays by appointment only',
  },
  // Google allows up to 750 characters. Plain description of services only: no rankings, awards or unverified claims.
  description: 'LayeredFX brings together architectural wraps, decorative finishes, window film and paint for residential and commercial spaces in Scottsdale and the Greater Phoenix area. Services include wall, cabinet, countertop and appliance wraps, wallpaper, Roman clay, faux concrete overlays, epoxy, window tint and film, and interior and exterior painting. Start with a consultation to review your surfaces, compare samples and plan the right finish for your space.',
} as const;

export const businessAddressLine = `${business.address.street}, ${business.address.city}, ${business.address.region} ${business.address.postalCode}`;
export const businessHoursLine = `${business.hours.summary} · ${business.hours.saturday}`;
