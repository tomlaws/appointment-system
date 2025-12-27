import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail(to: string, subject: string, html: string) {
    // Don't send email if in development mode
    if (process.env.NODE_ENV === 'development') {
        return;
    }
    const { data, error } = await resend.emails.send({
        from: 'Booking System <no-reply@tomlaw.dev>',
        to: [to],
        subject: subject,
        html: html,
    });
    if (error) {
        console.error('Error sending email:', error);
    }
    return data;
}

