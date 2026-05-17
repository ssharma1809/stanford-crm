const NOISE_KEYWORDS = [
  "newsletter", "digest", "weekly update", "monthly update", "roundup",
  "bulletin", "recap", "announcements", "announcement", "mailchimp",
  "substack", "beehiiv", "constant contact", "campaign", "promo",
  "promotion", "discount", "sale", "deal", "offer", "limited time",
  "webinar", "event invite", "register now", "ticket", "sponsored",
  "unsubscribe", "marketing", "product update", "new feature",
  "demo day announcement",
]

const NOISE_EMAIL_PATTERNS = [
  "list-manage.com", "marketing@", "events@", "newsletter@",
  "updates@", "hello@", "team@", "support@", "info@", "community@",
  "noreply@", "no-reply@", "donotreply@", "do-not-reply@",
  "notifications@", "automated@", "system@",
]

const NOISE_DOMAINS = [
  "mailchimp.com", "sendgrid.net", "mailgun.org", "constantcontact.com",
  "campaignmonitor.com", "klaviyo.com", "hubspot.com", "marketo.com",
  "salesforce.com", "pardot.com", "eloqua.com",
]

export interface EmailHeaders {
  from?: string
  to?: string
  subject?: string
  listId?: string
  listUnsubscribe?: string
  xMailer?: string
  precedence?: string
}

export function shouldExcludeEmail(headers: EmailHeaders): boolean {
  const { from = "", subject = "", listId, listUnsubscribe, precedence } = headers

  if (listId || listUnsubscribe) return true
  if (precedence === "bulk" || precedence === "list") return true

  const fromLower = from.toLowerCase()
  const subjectLower = subject.toLowerCase()

  if (NOISE_EMAIL_PATTERNS.some((p) => fromLower.includes(p))) return true
  if (NOISE_DOMAINS.some((d) => fromLower.includes(d))) return true
  if (NOISE_KEYWORDS.some((k) => subjectLower.includes(k))) return true
  if (NOISE_KEYWORDS.some((k) => fromLower.includes(k))) return true

  return false
}

export function isRealPerson(email: string, name: string): boolean {
  if (!email) return false
  const emailLower = email.toLowerCase()

  const genericPrefixes = [
    "noreply", "no-reply", "donotreply", "admin", "info", "support",
    "help", "contact", "hello", "team", "marketing", "sales", "events",
    "notifications", "alerts", "updates", "news", "feedback", "jobs",
    "careers", "recruiting", "hr", "legal", "billing", "accounts",
    "postmaster", "mailer", "bounce", "blackhole",
  ]

  const prefix = emailLower.split("@")[0]
  if (genericPrefixes.some((p) => prefix.includes(p))) return false

  if (!name || name.trim().length < 2) return false
  if (/^\d+$/.test(name)) return false

  return true
}
