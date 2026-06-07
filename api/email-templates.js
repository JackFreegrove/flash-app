function shell(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F9F7F4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9F7F4;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="padding:0 0 40px 0;">
            <span style="font-family:Georgia,serif;font-size:15px;letter-spacing:0.1em;color:#1A1714;">Snapshot Co</span>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 48px 0;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid #E2DDD8;padding:32px 0 0 0;">
            <p style="margin:0;font-family:monospace,monospace;font-size:11px;color:#8A847D;line-height:1.7;">
              Snapshot Co &mdash; hello@eventsnapshotco.com<br>
              You're receiving this because you booked an event with us.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function h1(text) {
  return `<h1 style="margin:0 0 28px 0;font-family:Georgia,serif;font-size:30px;font-weight:normal;color:#1A1714;line-height:1.25;">${text}</h1>`;
}

function p(text) {
  return `<p style="margin:0 0 18px 0;font-family:monospace,monospace;font-size:13px;color:#1A1714;line-height:1.75;">${text}</p>`;
}

function muted(text) {
  return `<p style="margin:24px 0 0 0;font-family:monospace,monospace;font-size:12px;color:#8A847D;line-height:1.65;">${text}</p>`;
}

function btn(label, url) {
  return `<a href="${url}" style="display:inline-block;background:#2C2C2C;color:#ffffff;font-family:monospace,monospace;font-size:12px;letter-spacing:0.07em;text-decoration:none;padding:13px 30px;margin:8px 0 0 0;">${label}</a>`;
}

export function purchaseConfirmation({ tierLabel, price, photosPerGuest, albumLife }) {
  const body = `
    ${h1('Your booking is confirmed.')}
    ${p(`You've booked the <strong>${tierLabel}</strong> plan &mdash; ${price}.`)}
    ${p(`Each guest gets <strong>${photosPerGuest} photos</strong>. The album is revealed the morning after your event and stays live for <strong>${albumLife}</strong>.`)}
    ${p('Head to your dashboard to create your event and get your QR code &mdash; that\'s all your guests need on the day.')}
    ${btn('Create your event', 'https://flash-app-gamma.vercel.app')}
    ${muted('Questions? Reply to this email and we\'ll get back to you.')}
  `;
  return shell('Booking confirmed — Snapshot Co', body);
}

export function eventCreated({ eventName, eventDate, revealTime, qrUrl }) {
  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('en-IE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : eventDate;
  const formattedReveal = revealTime
    ? new Date(revealTime).toLocaleString('en-IE', { weekday: 'long', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
    : revealTime;
  const body = `
    ${h1(`${eventName} is ready.`)}
    ${p(`<strong>Event date:</strong> ${formattedDate}`)}
    ${p(`<strong>Album reveals:</strong> ${formattedReveal}`)}
    ${p('Share this link with your guests &mdash; or print the QR card from your dashboard and display it on the day:')}
    <p style="margin:0 0 18px 0;padding:16px 20px;background:#EEEAE5;font-family:monospace,monospace;font-size:13px;word-break:break-all;">
      <a href="${qrUrl}" style="color:#1A1714;text-decoration:none;">${qrUrl}</a>
    </p>
    ${p('Guests scan the code, take their photos, and the album reveals together the next morning. No app needed.')}
    ${btn('Open your dashboard', 'https://flash-app-gamma.vercel.app')}
    ${muted('You can download a print-ready QR card from your dashboard at any time.')}
  `;
  return shell(`Your QR code is ready — ${eventName}`, body);
}

export function albumReveal({ eventName, albumUrl }) {
  const body = `
    ${h1('The wait is over.')}
    ${p(`Your <strong>${eventName}</strong> album has just revealed.`)}
    ${p('Every photo, exactly as it was taken &mdash; no filters, no retakes, no second chances. Just the real thing.')}
    ${btn('View your album', albumUrl)}
    ${muted('Share the link with your guests so they can see their shots too.')}
  `;
  return shell(`Your album is ready — ${eventName}`, body);
}

export function merchTeaser({ eventName, albumUrl }) {
  const body = `
    ${h1('Turn your photos into something permanent.')}
    ${p(`The <strong>${eventName}</strong> photos are ready &mdash; and soon you\'ll be able to hold them.`)}
    ${p('Canvas prints, keyrings, and physical photo albums are on the way. You\'ll be among the first to know when they\'re available.')}
    ${btn('Back to your album', albumUrl)}
    ${muted('Nothing to order yet &mdash; this is a preview of what\'s coming.')}
  `;
  return shell('Turn your photos into something permanent', body);
}

export function expiryWarning({ eventName, expiresAt, archiveUrl }) {
  const formatted = expiresAt
    ? new Date(expiresAt).toLocaleString('en-IE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
    : expiresAt;
  const body = `
    ${h1('Your album disappears soon.')}
    ${p(`<strong>${eventName}</strong> expires on <strong>${formatted}</strong>.`)}
    ${p('After that, the photos are gone permanently. Archive your album now to keep it for a year.')}
    ${btn('Archive for €15/year', archiveUrl)}
    ${muted('If you\'ve already purchased the archive add-on, ignore this &mdash; your album is safe.')}
  `;
  return shell(`Your album disappears in 48 hours — ${eventName}`, body);
}

export function archiveUpsell({ eventName, archiveUrl }) {
  const body = `
    ${h1('Keep your album forever.')}
    ${p(`<strong>${eventName}</strong> is expiring soon. For €15/year, archive it and come back to these photos whenever you like.`)}
    ${btn('Archive for €15/year', archiveUrl)}
    ${muted('One year of storage, renews annually. Cancel any time.')}
  `;
  return shell('Keep your album forever — €15/year', body);
}
