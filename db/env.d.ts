declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    RESEND_API_KEY?: string;
    CONTACT_FROM_EMAIL?: string;
    SPONSOR_RECIPIENT_EMAIL?: string;
    GOOGLE_LOGIN_SHEETS_WEBHOOK_URL?: string;
    GOOGLE_LOGIN_SHEETS_WEBHOOK_SECRET?: string;
    GOOGLE_SPONSOR_SHEETS_WEBHOOK_URL?: string;
    GOOGLE_SPONSOR_SHEETS_WEBHOOK_SECRET?: string;
    GOOGLE_SHEETS_WEBHOOK_URL?: string;
    GOOGLE_SHEETS_WEBHOOK_SECRET?: string;
  }
}
