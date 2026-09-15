import {business} from '@/lib/business/profile';
import {servicePages} from '@/lib/layeredfx/service-pages';

/** schema.org LocalBusiness data built only from lib/business/profile.ts, so it always matches the Google listing. */
export function businessJsonLd(origin: string = business.website) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${origin}/#business`,
    name: business.name,
    url: origin,
    logo: `${origin}/icons/icon-512.png`,
    image: `${origin}/images/social-card.png`,
    description: business.description,
    telephone: business.phone.e164,
    email: business.email,
    address: {'@type': 'PostalAddress', streetAddress: business.address.street, addressLocality: business.address.city, addressRegion: business.address.region, postalCode: business.address.postalCode, addressCountry: business.address.country},
    areaServed: [
      ...business.serviceArea.cities.map(city => ({'@type': 'City', name: `${city}, ${business.address.region}`})),
      {'@type': 'AdministrativeArea', name: `${business.serviceArea.county}, ${business.address.region}`},
    ],
    // Saturday appointments are by request only, so they are not published as regular opening hours.
    openingHoursSpecification: [{'@type': 'OpeningHoursSpecification', dayOfWeek: business.hours.weekdays.days, opens: business.hours.weekdays.opens, closes: business.hours.weekdays.closes}],
    contactPoint: [{'@type': 'ContactPoint', contactType: 'customer service', telephone: business.phone.e164, email: business.email, areaServed: 'US-AZ', availableLanguage: 'English'}],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: servicePages.map(service => ({'@type': 'Offer', itemOffered: {'@type': 'Service', name: service.name, url: `${origin}/services/${service.slug}`}})),
    },
  };
}

export function BusinessJsonLd() {
  // Escape "<" so the JSON can never close the script element.
  const json = JSON.stringify(businessJsonLd()).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: json}}/>;
}
