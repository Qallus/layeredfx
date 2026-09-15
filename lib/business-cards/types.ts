// Digital business card types — adapted from Channel Cast OS lib/business-cards/types.ts.
// LayeredFX changes: ownership is keyed to an active LayeredFX operations member,
// every card carries a compare-and-swap revision, and lead conversion links to the
// operations lead/contact/opportunity records instead of Channel Cast collections.

export type CardStatus = "draft" | "published" | "unpublished" | "archived";
export type ThemeMode = "light" | "dark" | "both";
export type NfcStatus = "not_ordered" | "ordered" | "assigned" | "active";

export type LinkType =
  | "website" | "social" | "phone" | "email" | "sms" | "map"
  | "booking" | "payment" | "download" | "video" | "review" | "custom";

export type SectionType =
  | "opener" | "profile_header" | "quick_actions" | "links" | "lead_capture"
  | "video" | "qr_code" | "nfc" | "slideshow" | "steps";

export type StepItem = { id: string; title: string; description?: string };
export type SlideshowSlide = { id: string; image_url: string; caption?: string };

export type MediaSettings = {
  profile_shape?: "circle" | "rounded" | "square";
  profile_outline?: boolean;
  profile_outline_color?: string;
  profile_link_url?: string;
  /** When true, the photo uses profile_margin_top/bottom instead of the default spacing. */
  profile_spacing?: boolean;
  profile_margin_top?: number;
  profile_margin_bottom?: number;
  content_align?: "center" | "left";
  use_background_image?: boolean;
  logo_height?: number;
  logo_width?: number;
  logo_margin_top?: number;
  logo_margin_bottom?: number;
  logo_link_url?: string;
};

export type AutomationAction = "notify_owner_email" | "notify_owner_sms" | "autoreply_email";
export type Automation = { id: string; trigger: "lead_submit"; action: AutomationAction; enabled: boolean; message?: string };

export type EventType =
  | "view" | "share" | "like" | "qr_scan" | "nfc_tap"
  | "link_click" | "copy_link" | "save_contact" | "lead_submit";

export type LeadStatus = "new" | "contacted" | "qualified" | "archived";
export type QrSettings = { foreground?: string; background?: string };

export type LeadFormField = { key: "name" | "email" | "phone" | "company" | "message"; label: string; enabled: boolean; required: boolean };
export type LeadFormSettings = { enabled: boolean; title: string; description: string; button_label: string; submit_label: string; fields: LeadFormField[] };

export type BusinessCardLink = {
  id: string; label: string; url: string; link_type: LinkType;
  display_order: number; is_visible: boolean; open_in_new_tab: boolean;
};

export type BusinessCardSection = {
  id: string; section_type: SectionType; label: string; content: Record<string, unknown>;
  display_order: number; is_visible: boolean; margin_top: number; margin_bottom: number;
};

export type BusinessCard = {
  id: string;
  revision: number;
  owner_id: string | null;
  owner_email: string | null;
  owner_name: string | null;
  slug: string;
  card_name: string;
  status: CardStatus;
  display_name: string;
  first_name: string;
  last_name: string;
  job_title: string;
  company_name: string;
  department: string;
  bio: string;
  profile_photo_url: string;
  logo_url: string;
  background_image_url: string;
  background_color: string;
  accent_color: string;
  text_color: string;
  theme_mode: ThemeMode;
  primary_phone: string;
  sms_phone: string;
  primary_email: string;
  website_url: string;
  maps_url: string;
  intro_video_url: string;
  qr_settings: QrSettings;
  lead_form_settings: LeadFormSettings;
  media_settings: MediaSettings;
  automations: Automation[];
  links: BusinessCardLink[];
  sections: BusinessCardSection[];
  nfc_status: NfcStatus;
  // Counters are maintained atomically by event recording, never by card saves.
  view_count: number;
  click_count: number;
  share_count: number;
  save_count: number;
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessCardLead = {
  id: string;
  card_id: string;
  owner_id: string | null;
  card_name: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  source: string;
  status: LeadStatus;
  created_at: string;
  revision: number;
};

export type BusinessCardEvent = {
  id: string; card_id: string; link_id: string | null; event_type: EventType;
  source: string; device_type: string; created_at: string;
};

export type CardStats = {
  cards: number; published: number; views: number; clicks: number; nfcReady: number;
  shares: number; saves: number; leads: number; newLeads: number;
};

export type OwnerOption = { id: string; name: string; email: string | null };

export type CardAnalytics = {
  rangeDays: number;
  totals: Partial<Record<EventType, number>>;
  views: number; clicks: number; shares: number; saves: number; leads: number;
  daily: { date: string; views: number; clicks: number }[];
  topLinks: { label: string; count: number }[];
};
