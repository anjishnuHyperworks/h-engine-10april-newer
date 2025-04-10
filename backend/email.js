require("dotenv").config();

const { EmailClient } = require("@azure/communication-email");

async function send_mail(UUID, email, type) {
    const { EMAIL_SENDER_DOMAIN, EMAIL_SENDER_CONNECTION_STRING, CLIENT_URL, KOLOMA_WORDMARK_LOGO } = process.env;

    if (!EMAIL_SENDER_DOMAIN || !EMAIL_SENDER_CONNECTION_STRING) {
        console.error("Missing Azure email credentials in .env");
        return;
    }

    let mail = {};

    const emailConfig = {
        "forgot-password": {
            subject: "Reset Password",
            heading: "Reset Password",
            message: `Click <a href="${CLIENT_URL}/reset-password" style="color:#007BFF; text-decoration:none;">${CLIENT_URL}/reset-password</a> to reset your password.`
        },
        "complete-signup": {
            subject: "Complete Signup",
            heading: "Verify Your Email",
            message: `Click <a href="${CLIENT_URL}/complete-signup?for=${UUID}" style="color:#007BFF; text-decoration:none;">${CLIENT_URL}/complete-signup?for=${UUID}</a> to verify your email.`
        }
    };
    
    if (!emailConfig[type]) {
        console.error("Invalid email type");
        return;
    }
    
    const { subject, heading, message } = emailConfig[type];
    
    mail = {
        to: email,
        subject,
        html: `
            <div>
                <h1 style="color:#333;">${heading}</h1>
                <p>${message}</p>
            </div>`
    };

    try {
        const emailClient = new EmailClient(EMAIL_SENDER_CONNECTION_STRING);

        const message = {
            senderAddress: EMAIL_SENDER_DOMAIN,
            recipients: {
                to: [{ address: mail.to }]
            },
            content: {
                subject: mail.subject,
                html: mail.html,
            }
        };

        const poller = await emailClient.beginSend(message);
        const result = await poller.pollUntilDone();

        console.log("Email sent successfully:", result);
        return result;
    } catch (error) {
        console.error("Failed to send email:", error);
        throw new Error("Email sending failed");
    }
}

async function send_otp(email) {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const mail = {
        to: email,
        subject: "OTP for Email Verification",
        html: `<h1>OTP for Email Verification</h1>
                <p>Your OTP is: ${otp}</p>`
    };

    try {
        const emailClient = new EmailClient(process.env.EMAIL_SENDER_CONNECTION_STRING);

        const message = {
            senderAddress: process.env.EMAIL_SENDER_DOMAIN,
            recipients: {
                to: [{ address: mail.to }]
            },
            content: {
                subject: mail.subject,
                html: mail.html,
            }
        };

        const poller = await emailClient.beginSend(message);
        const result = await poller.pollUntilDone();

        console.log("Email with OTP sent successfully:", result);
        return otp;
    } catch (error) {
        console.error("Failed to send email:", error);
        throw new Error("Email sending failed");
    }
}

module.exports = { send_mail, send_otp };

// send_mail('heyy', "venupulagam1234@gmail.com", "complete-signup")
//     .then(response => console.log("Email Response:", response))
//     .catch(error => console.error("Error:", error));