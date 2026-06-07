import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
  try {
    await resend.emails.send({
      from: 'hello@eventsnapshotco.com',
      to: [to],
      subject,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error('[sendEmail] Failed:', err);
    return { ok: false };
  }
}
