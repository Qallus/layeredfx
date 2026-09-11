// Contacts CRM model — aligned with the CMI web app, retrofitted for Channel Cast.
// A single "contacts" collection holds everyone; `type` moves a record through
// Lead → Prospect → Client, or leaves it as a plain Contact.

export type ContactType = "contact" | "lead" | "prospect" | "client";
export type ContactStatus = "active" | "inactive" | "archived";

export type Contact = {
  id: string;
  // Name: `name` is the display value; first/last are kept for CSV alignment.
  name: string;
  firstName?: string;
  lastName?: string;
  title: string;
  company: string;
  type: ContactType;
  status: ContactStatus;
  email: string;
  phone: string;
  sms?: string;
  website?: string;
  address?: string;
  city: string;
  state: string;
  zip?: string;
  source?: string;
  owner: string;
  tags: string[];
  photoUrl?: string;
  logoUrl?: string;
  notes: string;
  lastContact: string; // ISO date
  createdAt: string;
  // Imported/enriched fields (e.g. from a CSV) shown as accordion categories.
  details?: Record<string, string>;
  // Where this lead sits in the sales workflow (see lib/crm/workflow.ts).
  workflowStage?: string;
};

export const CONTACT_TYPE: Record<ContactType, { label: string; plural: string; tone: string; description: string }> = {
  contact: { label: "Contact", plural: "Contacts", tone: "bg-secondary text-secondary-foreground", description: "Just a contact." },
  lead: { label: "Lead", plural: "Leads", tone: "bg-warning/15 text-warning", description: "A new opportunity, not yet qualified." },
  prospect: { label: "Prospect", plural: "Prospects", tone: "bg-brand/15 text-brand-strong", description: "A qualified lead moving toward a deal." },
  client: { label: "Client", plural: "Clients", tone: "bg-success/15 text-success", description: "Doing business with Channel Cast." },
};
export const CONTACT_TYPE_ORDER: ContactType[] = ["contact", "lead", "prospect", "client"];
// The natural progression used by the "Convert" quick action.
export const CONTACT_TYPE_NEXT: Record<ContactType, ContactType | null> = { lead: "prospect", prospect: "client", client: null, contact: "lead" };

export const CONTACT_STATUS: Record<ContactStatus, { label: string; tone: string }> = {
  active: { label: "Active", tone: "bg-success/15 text-success" },
  inactive: { label: "Inactive", tone: "bg-muted text-muted-foreground" },
  archived: { label: "Archived", tone: "bg-muted text-muted-foreground" },
};
export const CONTACT_STATUS_ORDER: ContactStatus[] = ["active", "inactive", "archived"];

// Profile tags that further define a contact — used for filtering and search.
export const CONTACT_TAGS: string[] = [
  "Radio Station", "Advertiser", "Voice Talent", "Voice Personality", "Reseller", "Affiliate",
  "Partner", "Media", "Property Manager", "Installer", "Electrician", "Marketing", "Advertising",
  "Agency", "Venue", "Vendor", "Sub Contractor", "Designer",
];

// Group an imported detail key into a display category (like CMI's IMPORTED DETAILS).
export const DETAIL_CATEGORIES = ["Person", "Company", "Location", "Industry", "Online Profiles", "More Details"] as const;
export type DetailCategory = (typeof DETAIL_CATEGORIES)[number];

export function categorizeDetail(key: string): DetailCategory {
  const k = key.toLowerCase();
  if (/(country|city|state|zip|postal|address|street|region|location)/.test(k)) return "Location";
  if (/(industry|sub-?industry|sector|naics|sic|vertical)/.test(k)) return "Industry";
  if (/(linkedin|twitter|facebook|instagram|website|url|profile|social|handle)/.test(k)) return "Online Profiles";
  if (/(company|employer|employees|founded|revenue|hq|headquarters|ownership|business model|organization|firm)/.test(k)) return "Company";
  if (/(name|title|department|job|role|manager|management|seniority|education|email|phone|birthday|gender)/.test(k)) return "Person";
  return "More Details";
}

export function contactName(c: Contact): string {
  return c.name?.trim() || [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || c.email || "Unnamed";
}

