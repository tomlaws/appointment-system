import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail({to, subject, html}: {to: string, subject: string, html: string}) {
    // Don't send email if in development mode
    if (process.env.NODE_ENV === 'development') {
        // Log the email contents to the console
        console.log('Development mode - email not sent. Email contents:');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('HTML:', html);
        return;
    }
    // don't send email to root admin email
    if (to === process.env.ROOT_ACCOUNT) {
        console.log('Email to root admin not sent.');
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

