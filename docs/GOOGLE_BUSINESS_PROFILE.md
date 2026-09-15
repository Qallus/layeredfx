# Google Business Profile setup

Everything needed to create, verify and maintain the LayeredFX listing. The dashboard page **Marketing › Google Business** shows the same details with copy buttons.

## 1. Listing details (use exactly)

Google compares the listing with the website. These values live in `lib/business/profile.ts`; change them there first so the website, its structured data and the dashboard page stay identical.

| Field | Value |
|---|---|
| Business name | LayeredFX |
| Address (shown to customers) | 7314 E Osborn Dr Ste A, Scottsdale, AZ 85251 |
| Service area | Greater Phoenix: Scottsdale, Phoenix, Tempe, Mesa, Chandler, Gilbert, Paradise Valley (Maricopa County) |
| Primary phone | (602) 777-3303 |
| Text line | (480) 999-9906 |
| Email | hello@layeredfx.com |
| Website | `https://layeredfx.com/?utm_source=google&utm_medium=organic&utm_campaign=gbp` |
| Appointment link | `https://layeredfx.com/book?utm_source=google&utm_medium=organic&utm_campaign=gbp` |
| Hours | Monday–Friday 9:00 AM–5:00 PM. Saturday closed in regular hours (appointments only). Sunday closed. |

**Business name:** use the real name only. Adding keywords or city names to the name breaks Google's guidelines and can get the listing suspended.

**Saturday appointments:** keep Saturday closed in regular hours so customers don't arrive without an appointment, and mention Saturday appointments in the description.

## 2. Categories

Pick from Google's category list; the primary category matters most. Search for these and choose the closest real matches:

- Painter
- Window tinting service
- Wallpaper installer
- Interior construction contractor
- Countertop contractor

These are search suggestions, not confirmed Google category names.

## 3. Description (up to 750 characters)

> LayeredFX brings together architectural wraps, decorative finishes, window film and paint for residential and commercial spaces in Scottsdale and the Greater Phoenix area. Services include wall, cabinet, countertop and appliance wraps, wallpaper, Roman clay, faux concrete overlays, epoxy, window tint and film, and interior and exterior painting. Start with a consultation to review your surfaces, compare samples and plan the right finish for your space.

Plain description only. Google doesn't allow links, promotions or unverifiable claims (for example "best", "#1" or awards) in the description.

## 4. Services

Add each as a service: Wall wraps, Cabinet wraps, Countertop wraps, Appliance wraps, Wallpaper, Roman clay, Faux concrete overlays, Epoxy, Window tint & film, Interior painting, Exterior painting.

## 5. Photos

- **Logo:** `public/icons/icon-512.png` (square, 512 × 512).
- **Cover:** `public/images/social-card.png` (1200 × 630).
- **Office:** real photos of the Osborn Dr entrance and interior.
- **Team and work:** real team photos, and finished-project photos only with the client's approval. Never upload concept renders as completed work.

## 6. Setup steps

1. Go to https://business.google.com/create and sign in with the Google account LayeredFX will keep long term. Add a second owner or manager so access isn't tied to one person.
2. Enter the business name and primary category.
3. Add the address, then choose that you also serve customers at their locations and add the Greater Phoenix service area.
4. Enter the primary phone and the tagged website link.
5. Request verification using whichever method Google offers (postcard, phone, email or video). It can take several days.
6. After verification, add hours, description, services, photos and additional categories.
7. Ask real customers for reviews after completed jobs using the review link Google provides. Don't offer incentives for reviews.

## 7. Website side (done in code)

- `lib/business/profile.ts`: single source for name, address, phones, email, hours and service area.
- Business structured data (schema.org `HomeAndConstructionBusiness`) on every page, built from that file.
- `app/sitemap.ts`: public marketing and service pages.
- Contact page, footer and support panel use the same phone numbers, email and hours.
- A test fails if a public page shows a phone number that isn't in the business profile.

**Required before Google can crawl the site:** set `ALLOW_INDEXING=true` in the Coolify environment and redeploy. Until then `robots.txt` blocks all crawlers, and the sitemap isn't advertised.

## 8. After the listing is live

- Add the Google review link to the dashboard and the post-appointment email.
- Connect the Google Business Profile API for reviews, posts and insights (planned; needs the verified listing and Google API access).
- Update `lib/business/profile.ts` and the listing together whenever phone, hours or address change.
