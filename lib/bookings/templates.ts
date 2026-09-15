// Default booking email templates. They live in the shared email template store (Dashboard > Communications >
// Templates), where staff can edit or duplicate them. Only templates marked Active are sent.
import type {ContentItem} from '@/ctrlp/lib/admin/types';

export type BookingEmailEvent = 'booked' | 'rescheduled' | 'canceled';
export type BookingNotificationType = 'confirmation' | 'updated' | 'cancelled' | 'team_alert';
export const BOOKING_TEMPLATE_SLUGS = {booked: 'booking-confirmation', rescheduled: 'booking-updated', canceled: 'booking-cancelled', team: 'booking-team-alert'} as const;
/** Merge tags filled for every booking email; see bookingVariables in ./model. */
export const BOOKING_MERGE_TAGS = ['first_name', 'last_name', 'full_name', 'email', 'phone', 'company', 'notes', 'appointment_type', 'date', 'time', 'end_time', 'duration', 'location', 'timezone', 'status', 'reference', 'manage_url', 'book_url', 'admin_url', 'event'] as const;

const created = '2026-09-15T00:00:00.000Z';
function template(id: string, slug: string, title: string, subject: string, preheader: string, content: string): ContentItem {
  return {
    id, author_id: null, content_type: 'email_template', source_id: null, title, slug, subject, preheader, content,
    excerpt: 'Sent automatically for bookings. Keep merge tags such as {{date}} and {{manage_url}}. Set to Draft or Archived to stop sending.',
    featured_image_url: null, gallery: [], video_url: null, image_url: null, hashtags: [], tags: ['bookings'], categories: ['Transactional'],
    status: 'published', published_at: null, meta_title: null, meta_description: null, created_at: created, updated_at: created,
  };
}
const details = '<ul><li><strong>Appointment:</strong> {{appointment_type}}</li><li><strong>Date:</strong> {{date}}</li><li><strong>Time:</strong> {{time}} – {{end_time}} ({{timezone}})</li><li><strong>Duration:</strong> {{duration}}</li><li><strong>Location:</strong> {{location}}</li><li><strong>Reference:</strong> {{reference}}</li></ul>';

export const bookingTemplates: ContentItem[] = [
  template('b0a6c1e2-7c1f-4f5a-9d3e-000000000001', BOOKING_TEMPLATE_SLUGS.booked, 'Booking: Confirmation',
    'Your {{appointment_type}} is booked for {{date}}', '{{date}} at {{time}} Arizona time. Your appointment details are inside.',
    `<h1>You’re booked, {{first_name}}.</h1><p>Thank you for scheduling time with LayeredFX. Here are the details for your appointment.</p>${details}<p><a href="{{manage_url}}">View or change your appointment</a></p><p>To change or cancel online, sign in or create an account with {{email}}. Questions? Just reply to this email.</p>`),
  template('b0a6c1e2-7c1f-4f5a-9d3e-000000000002', BOOKING_TEMPLATE_SLUGS.rescheduled, 'Booking: Updated',
    'Your appointment was updated: {{date}} at {{time}}', 'Here are your new appointment details.',
    `<h1>Your appointment has been updated.</h1><p>Hi {{first_name}}, here are your updated appointment details.</p>${details}<p><a href="{{manage_url}}">View your appointment</a></p><p>If you did not make this change, reply to this email and we will help.</p>`),
  template('b0a6c1e2-7c1f-4f5a-9d3e-000000000003', BOOKING_TEMPLATE_SLUGS.canceled, 'Booking: Canceled',
    'Your {{appointment_type}} on {{date}} was canceled', 'We are here whenever you are ready to book again.',
    '<h1>Your appointment has been canceled.</h1><p>Hi {{first_name}}, the appointment below has been canceled.</p><ul><li><strong>Appointment:</strong> {{appointment_type}}</li><li><strong>Date:</strong> {{date}}</li><li><strong>Time:</strong> {{time}} ({{timezone}})</li><li><strong>Reference:</strong> {{reference}}</li></ul><p><a href="{{book_url}}">Book a new time</a></p><p>If you did not cancel this appointment, reply to this email and we will help.</p>'),
  template('b0a6c1e2-7c1f-4f5a-9d3e-000000000004', BOOKING_TEMPLATE_SLUGS.team, 'Booking: Team alert',
    '{{event}}: {{appointment_type}} with {{full_name}}', '{{date}} at {{time}} Arizona time.',
    `<h1>{{event}}</h1><p>{{full_name}} · {{email}} · {{phone}}</p>${details}<p><strong>Company:</strong> {{company}}</p><p><strong>Customer notes:</strong> {{notes}}</p><p><strong>Status:</strong> {{status}}</p><p><a href="{{admin_url}}">Open bookings dashboard</a></p>`),
];

/** Adds any default booking template missing from a stored template list (matched by id or slug). */
export function withBookingTemplates<T extends {items: ContentItem[]}>(state: T): T {
  const missing = bookingTemplates.filter(item => !state.items.some(existing => existing.id === item.id || existing.slug === item.slug));
  return missing.length ? {...state, items: [...state.items, ...missing]} : state;
}
