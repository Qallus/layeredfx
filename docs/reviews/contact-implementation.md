# Contact intake and preferences

The contact form now saves requests directly; it no longer requires a portal account. Booking remains the existing account-based workflow. Files are bounded (three JPEG/PNG/WebP/PDF files, 2 MB each), signature checked and available only through staff-authorized attachment downloads. No uploads are published under public/.

Development saves to .local-data/contact-submissions. Production uses the isolated LayeredFX service role and the reviewed SQL in docs/migrations/20260912-contact-submissions.sql. Apply and verify on authorized staging before production. No live migration was executed. All authenticated reads require an active member; viewers cannot read submissions or download attachments. No anon/authenticated direct database grants. Public submission accepts only normalized form fields, not an operations command.

Lead conversion goes through applyCommand. Production hydrates the original submission by ID on the server, rather than trusting posted form metadata. Repeat conversion preserves identities and files; regular lead conversion also carries submission data into the opportunity. Existing pipeline stage rules still gate won/job handoff.

SMS/email choices are separate and unchecked by default. The server records flags, consent wording, policy version, timestamp and source form. Opt-out records are retained. No SMS/email sending provider was enabled; a sender must apply the latest channel preference before delivery and integrate provider suppression/STOP webhooks. Website submission is not A2P registration approval. Policy text is prepared for business/legal review and should be checked against actual retention/provider practices before launch.

Sources reviewed:
- https://www.twilio.com/en-us/legal/messaging-policy
- https://www.twilio.com/docs/api/errors/30932
- https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/collect-business-info
- https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- https://supabase.com/docs/guides/database/postgres/row-level-security

Map uses OpenStreetMap at the geocoded office building (33.4870643, -111.9243922), with a pulsing visual pin and a directions link. Reduced-motion disables the pulse. External map availability depends on the provider.
