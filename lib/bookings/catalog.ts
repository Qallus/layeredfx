// Appointment types offered on /book. Shared by the public picker, server validation, the portal and /admin/bookings.
export type LocationType = 'phone_call' | 'video_meeting' | 'in_person' | 'onsite_installation' | 'custom_location';
export type AppointmentOption = {slug: string; name: string; minutes: number; color: string; description: string; location: string; locationType: LocationType};
export const BOOKING_TIMEZONE = 'America/Phoenix';
export const appointments: AppointmentOption[] = [
  {slug: 'surface-consultation', name: 'Surface consultation', minutes: 30, color: '#a7ea31', description: 'Explore your walls, cabinets, countertops and surface transformation options.', location: 'Phone call', locationType: 'phone_call'},
  {slug: 'design-consultation', name: 'Design consultation', minutes: 45, color: '#38bdf8', description: 'Materials, colors, custom graphics, wallpaper and finish selections.', location: 'Video or phone', locationType: 'video_meeting'},
  {slug: 'architectural-wrap-consultation', name: 'Architectural wrap consultation', minutes: 60, color: '#e9a42a', description: 'Cabinets, doors, counters and commercial surfaces, measurements and preparation.', location: 'Project consultation', locationType: 'in_person'},
  {slug: 'window-film-consultation', name: 'Window tint / film consultation', minutes: 60, color: '#39bd72', description: 'Privacy, solar control and decorative film for residential and commercial glass.', location: 'Project consultation', locationType: 'in_person'},
  {slug: 'installation-consultation', name: 'Installation consultation', minutes: 90, color: '#f17f22', description: 'Site access, preparation, measurements, scope and installation planning.', location: 'Site details confirmed by team', locationType: 'onsite_installation'},
  {slug: 'decorative-finish-consultation', name: 'Roman clay / decorative finish', minutes: 45, color: '#bb977c', description: 'Texture, colors, substrate condition and decorative finish options.', location: 'Project consultation', locationType: 'in_person'},
  {slug: 'artwork-proof-review', name: 'Artwork / proof review', minutes: 30, color: '#b18cf4', description: 'Review graphics, artwork dimensions, proofs and production requirements.', location: 'Video or phone', locationType: 'video_meeting'},
];
export const appointmentBySlug = (slug: string) => appointments.find(item => item.slug === slug);
export const appointmentByName = (name: string) => appointments.find(item => item.name === name);
