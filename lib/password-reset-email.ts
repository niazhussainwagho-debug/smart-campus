import nodemailer from "nodemailer";

type SmtpConfiguration = {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
};

function getSmtpConfiguration(): SmtpConfiguration {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  const port = Number(SMTP_PORT);

  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !SMTP_FROM
  ) {
    throw new Error(
      "SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM must be configured.",
    );
  }

  return {
    host: SMTP_HOST,
    port,
    user: SMTP_USER,
    password: SMTP_PASS,
    from: SMTP_FROM,
  };
}

export function isPasswordResetEmailConfigured(): boolean {
  try {
    getSmtpConfiguration();
    const appUrl = process.env.APP_URL;
    if (!appUrl) {
      return false;
    }

    const url = new URL(appUrl);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.host)
    );
  } catch {
    return false;
  }
}

function createTransporter() {
  const smtp = getSmtpConfiguration();
  return {
    smtp,
    transporter: nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: {
        user: smtp.user,
        pass: smtp.password,
      },
    }),
  };
}

export async function sendCampusEmail(
  recipient: string,
  subject: string,
  text: string,
): Promise<void> {
  const { smtp, transporter } = createTransporter();
  await transporter.sendMail({
    from: smtp.from,
    to: recipient,
    subject,
    text,
  });
}

export async function sendCampusBulkEmail(
  recipients: string[],
  subject: string,
  text: string,
): Promise<number> {
  const uniqueRecipients = [...new Set(recipients.map((email) => email.trim()).filter(Boolean))];
  if (!uniqueRecipients.length) return 0;

  const { smtp, transporter } = createTransporter();
  for (let index = 0; index < uniqueRecipients.length; index += 50) {
    const batch = uniqueRecipients.slice(index, index + 50);
    await transporter.sendMail({
      from: smtp.from,
      to: smtp.from,
      bcc: batch,
      subject,
      text,
    });
  }
  return uniqueRecipients.length;
}

export async function sendPasswordResetEmail(
  recipient: string,
  resetUrl: string,
): Promise<void> {
  const { smtp, transporter } = createTransporter();
  await transporter.sendMail({
    from: smtp.from,
    to: recipient,
    subject: "Reset your Smart Campus password",
    text: `Use this one-time link to reset your Smart Campus password. It expires in 30 minutes:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Use this one-time link to reset your Smart Campus password. It expires in 30 minutes:</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
}

export function getPasswordResetUrl(token: string): string {
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    throw new Error("APP_URL must be configured.");
  }

  const url = new URL("/reset-password", appUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("APP_URL must use HTTP or HTTPS.");
  }

  url.searchParams.set("token", token);
  return url.toString();
}
