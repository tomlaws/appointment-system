import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail(to: string, subject: string, html: string) {
    // Don't send email if in development mode
    if (process.env.NODE_ENV === 'development') {
        console.log(`Email to: ${to}\nSubject: ${subject}\nHTML: ${html}`);
        return;
    }
    await resend.emails.send({
        from: 'Appointment System <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html,
    });
}

