declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    RESEND_API_KEY?: string;
    CONTACT_FROM_EMAIL?: string;
    SPONSOR_RECIPIENT_EMAIL?: string;
  }
}
