// Builds the branded Supabase Auth email templates in supabase/templates/ from one shared layout.
// Run: node scripts/build-auth-email-templates.mjs — then paste each file into Supabase (see supabase/templates/README.md).
import {mkdirSync, writeFileSync} from 'node:fs';

const LOGO = 'https://layeredfx.com/brand/lfx_logo_outline_light_mode.png';
const SITE = 'https://layeredfx.com';
const greeting = '{{ if .Data.first_name }}Hi {{ .Data.first_name }},{{ else }}Hi there,{{ end }}';
const securityHelp = '<strong style="color:#19202e">Didn’t make this change?</strong> Reset your password right away using the button above, then contact us at <a href="mailto:hello@layeredfx.com" style="color:#63790d">hello@layeredfx.com</a>.';
const p = (html, style = '') => `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#47536b;${style}">${html}</p>`;

function button(label, href = '{{ .ConfirmationURL }}') {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:10px 0 30px"><tr><td style="border-radius:12px;background:#d6ff41">
          <a href="${href}" style="display:inline-block;padding:15px 30px;border-radius:12px;color:#19202e;font-size:16px;font-weight:600;text-decoration:none">${label} &rarr;</a>
        </td></tr></table>
        <p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:#47536b">Button not working? Copy and paste this link into your browser:</p>
        <p style="margin:0 0 30px;font-size:13px;line-height:1.6;word-break:break-all"><a href="${href}" style="color:#63790d">${href}</a></p>`;
}
function code() {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:10px 0 30px"><tr><td style="padding:18px 28px;border-radius:14px;background:#f5ffcc;border:1px solid #c9ced8">
          <span style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#19202e">{{ .Token }}</span>
        </td></tr></table>`;
}

function layout({title, preheader, kicker, heading, body, note, footerReason}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f7f9fb;font-family:Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fb">
<tr><td align="center" style="padding:36px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
  <tr><td align="center" style="padding:0 0 22px">
    <a href="${SITE}" style="text-decoration:none"><img src="${LOGO}" width="200" height="36" alt="LayeredFX" style="display:block;border:0;width:200px;height:auto"></a>
  </td></tr>
  <tr><td style="background:#ffffff;border-radius:20px;overflow:hidden">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="height:6px;line-height:6px;font-size:0;background:#19202e">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="62%" style="height:6px;background:#19202e;font-size:0;line-height:6px">&nbsp;</td><td width="38%" style="height:6px;background:#d6ff41;font-size:0;line-height:6px">&nbsp;</td></tr></table>
      </td></tr>
      <tr><td style="padding:40px 40px 10px">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#63790d">${kicker}</p>
        <h1 style="margin:0 0 18px;font-size:30px;line-height:1.2;font-weight:500;letter-spacing:-0.5px;color:#19202e">${heading}</h1>
        ${body}
      </td></tr>
      <tr><td style="padding:22px 40px 28px;border-top:1px solid #c9ced8;background:#f7f9fb">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#47536b">${note}</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding:26px 20px 0;font-size:12px;line-height:1.7;color:#47536b">
    <strong style="color:#47536b">LayeredFX</strong> · Beautiful surfaces. Spaces with a little more soul.<br>
    Scottsdale, Arizona · <a href="mailto:hello@layeredfx.com" style="color:#47536b">hello@layeredfx.com</a> · <a href="${SITE}" style="color:#47536b">layeredfx.com</a><br>
    ${footerReason}
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`;
}

// file, Supabase template name, subject, content.
const templates = [
  ['confirm-signup.html', 'Confirm signup', 'Confirm your LayeredFX account', {
    title: 'Confirm your email address', preheader: 'One quick step to finish creating your LayeredFX account.', kicker: 'Welcome to LayeredFX', heading: 'Confirm your email address',
    body: p(greeting, 'margin-bottom:14px') + p('You’re one step away from your LayeredFX account. Confirm this email address to manage appointments, share project photos and message our team.') + button('Confirm email address'),
    note: '<strong style="color:#19202e">What you can do next</strong><br>Book a consultation, preview finishes in Wall Studio, and keep every project detail in one place.',
    footerReason: 'This email was sent to {{ .Email }} because an account was created with it. If that wasn’t you, you can ignore this email.',
  }],
  ['invite-user.html', 'Invite user', 'You’re invited to LayeredFX', {
    title: 'You’ve been invited', preheader: 'Accept your invitation to create a LayeredFX account.', kicker: 'You’re invited', heading: 'You’ve been invited to LayeredFX',
    body: p('Hi there,', 'margin-bottom:14px') + p('The LayeredFX team has invited you to create an account. Accept the invitation to set your password and get started.') + button('Accept invitation'),
    note: '<strong style="color:#19202e">Not expecting this?</strong> You can ignore this email. No account is created unless you accept the invitation.',
    footerReason: 'This invitation was sent to {{ .Email }}.',
  }],
  ['magic-link.html', 'Magic link', 'Your LayeredFX sign-in link', {
    title: 'Your sign-in link', preheader: 'Use this secure link to sign in to LayeredFX.', kicker: 'Secure sign-in', heading: 'Your sign-in link',
    body: p(greeting, 'margin-bottom:14px') + p('Use the button below to sign in to your LayeredFX account. For your security, this link expires shortly and can only be used once.') + button('Sign in to LayeredFX'),
    note: '<strong style="color:#19202e">Didn’t ask for this?</strong> You can ignore this email. Nobody can sign in without this link.',
    footerReason: 'This email was sent to {{ .Email }}.',
  }],
  ['change-email.html', 'Change email address', 'Confirm your new LayeredFX email address', {
    title: 'Confirm your new email address', preheader: 'Confirm the new email address for your LayeredFX account.', kicker: 'Account update', heading: 'Confirm your new email address',
    body: p(greeting, 'margin-bottom:14px') + p('Confirm <strong style="color:#19202e">{{ .NewEmail }}</strong> as the new email address for your LayeredFX account. Your current address, {{ .Email }}, stays active until you confirm.') + button('Confirm new email address'),
    note: '<strong style="color:#19202e">Didn’t request this change?</strong> You can ignore this email and your email address will stay the same. If you’re concerned, reply to this email.',
    footerReason: 'This email was sent because an email address change was requested for your LayeredFX account.',
  }],
  ['reset-password.html', 'Reset password', 'Reset your LayeredFX password', {
    title: 'Reset your password', preheader: 'Choose a new password for your LayeredFX account.', kicker: 'Password help', heading: 'Reset your password',
    body: p(greeting, 'margin-bottom:14px') + p('We received a request to reset the password for your LayeredFX account. Use the button below to choose a new one.') + button('Choose a new password'),
    note: '<strong style="color:#19202e">Didn’t ask for this?</strong> You can ignore this email. Your password will not change unless you use the link above.',
    footerReason: 'This email was sent to {{ .Email }}.',
  }],
  ['reauthentication.html', 'Reauthentication', '{{ .Token }} is your LayeredFX verification code', {
    title: 'Your verification code', preheader: 'Your LayeredFX verification code is inside.', kicker: 'Verify it’s you', heading: 'Your verification code',
    body: p(greeting, 'margin-bottom:14px') + p('Enter this code to confirm it’s you. It expires shortly and can only be used once.') + code(),
    note: '<strong style="color:#19202e">Keep this code private.</strong> LayeredFX will never ask you for it by phone or text. If you didn’t request it, you can ignore this email.',
    footerReason: 'This email was sent to {{ .Email }}.',
  }],
  ['password-changed.html', 'Password changed (security notification)', 'Your LayeredFX password was changed', {
    title: 'Your password was changed', preheader: 'The password for your LayeredFX account was just changed.', kicker: 'Security notice', heading: 'Your password was changed',
    body: p('Hi there,', 'margin-bottom:14px') + p('The password for your LayeredFX account ({{ .Email }}) was recently changed. If you made this change, no action is needed.') + button('Reset your password', `${SITE}/forgot-password`),
    note: '<strong style="color:#19202e">Didn’t make this change?</strong> Reset your password right away using the button above, then contact us at <a href="mailto:hello@layeredfx.com" style="color:#63790d">hello@layeredfx.com</a>.',
    footerReason: 'Security notices are sent for important changes to your account.',
  }],
  ['email-changed.html', 'Email address changed (security notification)', 'Your LayeredFX email address was changed', {
    title: 'Your email address was changed', preheader: 'The email address for your LayeredFX account was just changed.', kicker: 'Security notice', heading: 'Your email address was changed',
    body: p('Hi there,', 'margin-bottom:14px') + p('The email address for your LayeredFX account was changed from <strong style="color:#19202e">{{ .OldEmail }}</strong> to <strong style="color:#19202e">{{ .Email }}</strong>. If you made this change, no action is needed.') + button('Reset your password', `${SITE}/forgot-password`),
    note: securityHelp,
    footerReason: 'Security notices are sent for important changes to your account.',
  }],
  ['phone-changed.html', 'Phone number changed (security notification)', 'Your LayeredFX phone number was changed', {
    title: 'Your phone number was changed', preheader: 'The phone number for your LayeredFX account was just changed.', kicker: 'Security notice', heading: 'Your phone number was changed',
    body: p('Hi there,', 'margin-bottom:14px') + p('The phone number for your LayeredFX account ({{ .Email }}) was changed from <strong style="color:#19202e">{{ .OldPhone }}</strong> to <strong style="color:#19202e">{{ .Phone }}</strong>. If you made this change, no action is needed.') + button('Reset your password', `${SITE}/forgot-password`),
    note: securityHelp,
    footerReason: 'Security notices are sent for important changes to your account.',
  }],
  ['identity-linked.html', 'Sign-in method linked (security notification)', 'A sign-in method was linked to your LayeredFX account', {
    title: 'A sign-in method was linked', preheader: 'A new way to sign in was added to your LayeredFX account.', kicker: 'Security notice', heading: 'A sign-in method was linked',
    body: p('Hi there,', 'margin-bottom:14px') + p('Your <strong style="color:#19202e">{{ .Provider }}</strong> account was linked as a sign-in method for your LayeredFX account ({{ .Email }}). If you made this change, no action is needed.') + button('Reset your password', `${SITE}/forgot-password`),
    note: securityHelp,
    footerReason: 'Security notices are sent for important changes to your account.',
  }],
  ['identity-unlinked.html', 'Sign-in method removed (security notification)', 'A sign-in method was removed from your LayeredFX account', {
    title: 'A sign-in method was removed', preheader: 'A way to sign in was removed from your LayeredFX account.', kicker: 'Security notice', heading: 'A sign-in method was removed',
    body: p('Hi there,', 'margin-bottom:14px') + p('Your <strong style="color:#19202e">{{ .Provider }}</strong> account was removed as a sign-in method for your LayeredFX account ({{ .Email }}). If you made this change, no action is needed.') + button('Reset your password', `${SITE}/forgot-password`),
    note: securityHelp,
    footerReason: 'Security notices are sent for important changes to your account.',
  }],
  ['mfa-added.html', 'MFA method added (security notification)', 'A verification method was added to your LayeredFX account', {
    title: 'A verification method was added', preheader: 'A new sign-in verification method was added to your LayeredFX account.', kicker: 'Security notice', heading: 'A verification method was added',
    body: p('Hi there,', 'margin-bottom:14px') + p('A new sign-in verification method (<strong style="color:#19202e">{{ .FactorType }}</strong>) was added to your LayeredFX account. If you made this change, no action is needed.') + button('Reset your password', `${SITE}/forgot-password`),
    note: securityHelp,
    footerReason: 'Security notices are sent for important changes to your account.',
  }],
  ['mfa-removed.html', 'MFA method removed (security notification)', 'A verification method was removed from your LayeredFX account', {
    title: 'A verification method was removed', preheader: 'A sign-in verification method was removed from your LayeredFX account.', kicker: 'Security notice', heading: 'A verification method was removed',
    body: p('Hi there,', 'margin-bottom:14px') + p('The sign-in verification method <strong style="color:#19202e">{{ .FactorType }}</strong> was removed from your LayeredFX account. Your account is less protected without it. If you made this change, no action is needed.') + button('Reset your password', `${SITE}/forgot-password`),
    note: securityHelp,
    footerReason: 'Security notices are sent for important changes to your account.',
  }],
];

mkdirSync('supabase/templates', {recursive: true});
for (const [file, , , content] of templates) writeFileSync(`supabase/templates/${file}`, layout(content));

const rows = templates.map(([file, name, subject]) => `| ${name} | \`${subject}\` | \`${file}\` |`).join('\n');
writeFileSync('supabase/templates/README.md', `# LayeredFX Supabase Auth email templates

Supabase sends account emails itself, so these templates are applied in the Supabase dashboard, not by the app.
Generated by \`node scripts/build-auth-email-templates.mjs\` (edit the script, not the HTML files).

1. Deploy the site first so \`${LOGO}\` is reachable (the logo in every email).
2. Supabase Dashboard → **Authentication → Emails** for the LayeredFX project (\`tdywcdgbavfcsywejoka\`).
3. For each template below, set the subject and paste the file contents as the message body.

| Supabase template | Subject | Body file |
|---|---|---|
${rows}

Variables used: \`{{ .ConfirmationURL }}\`, \`{{ .Email }}\`, \`{{ .NewEmail }}\`, \`{{ .Token }}\` and \`{{ .Data.first_name }}\` (set at registration; emails fall back to "Hi there" when it is missing). Security notifications use \`{{ .OldEmail }}\` (email changed), \`{{ .OldPhone }}\` / \`{{ .Phone }}\` (phone changed), \`{{ .Provider }}\` (sign-in method linked/removed) and \`{{ .FactorType }}\` (MFA method added/removed), per the Supabase email template docs. Security notifications link to \`/forgot-password\` instead of a Supabase link, and are only sent when enabled under **Authentication → Emails → Security**. Keep the Auth URL configuration and custom SMTP settings described in \`docs/migration/BOOKINGS.md\`.
`);
console.log(`wrote ${templates.length} templates and README.md`);
