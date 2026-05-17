export type RelationshipType =
  | "Classmate / Peer"
  | "Alumni / Industry Mentor"
  | "Recruiter / Interviewer"
  | "Founder / Investor"
  | "Faculty / GSB Staff"
  | "Guest Speaker"

export interface Contact {
  name: string
  email: string
  summary: string
  relationshipType: RelationshipType
  firstInteractionDate: string
  lastInteractionDate: string
}

const RELATIONSHIP_KEYWORDS: Record<RelationshipType, string[]> = {
  "Recruiter / Interviewer": [
    "interview", "recruiting", "recruiter", "position", "role at",
    "opportunity at", "job offer", "application", "hiring", "onsite",
    "phone screen", "offer letter", "compensation", "salary",
  ],
  "Founder / Investor": [
    "founder", "investor", "vc ", "venture", "startup", "pitch",
    "investment", "fundraising", "seed round", "series a", "angel",
    "portfolio", "term sheet", "cap table",
  ],
  "Faculty / GSB Staff": [
    "professor", "prof.", "lecturer", "gsb staff", "academic advisor",
    "dean", "faculty", "course", "office hours", "grade", "syllabus",
    "recommendation letter", "academic",
  ],
  "Guest Speaker": [
    "thank you for speaking", "great talk", "panel", "your talk",
    "fireside chat", "speaker", "presentation you gave",
  ],
  "Alumni / Industry Mentor": [
    "alum", "alumni", "informational", "career advice", "mentor",
    "mentorship", "coffee chat", "industry", "advice on", "career path",
  ],
  "Classmate / Peer": [
    "section", "cohort", "classmate", "gsb", "stanford", "class of",
    "study group", "club", "catch up", "catch-up", "coffee", "lunch",
    "happy hour", "social", "group project",
  ],
}

export function classifyRelationship(
  subject: string,
  snippet: string
): RelationshipType {
  const text = `${subject} ${snippet}`.toLowerCase()

  for (const [type, keywords] of Object.entries(RELATIONSHIP_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) {
      return type as RelationshipType
    }
  }

  return "Classmate / Peer"
}

function cleanSubject(subject: string): string {
  return subject
    .replace(/^(Re:|Fwd:|FW:|RE:|FWD:)\s*/gi, "")
    .replace(/\[.*?\]/g, "")
    .trim()
}

function toNaturalPhrase(subject: string): string {
  const cleaned = cleanSubject(subject)
  if (!cleaned) return "a conversation"
  const lower = cleaned.toLowerCase()
  if (lower.startsWith("re:") || lower.startsWith("fwd:")) {
    return cleanSubject(cleaned)
  }
  return cleaned
}

export function generateSummary(
  contactName: string,
  subject: string,
  userInitiated: boolean
): string {
  const phrase = toNaturalPhrase(subject)
  const firstName = contactName.split(" ")[0]

  if (userInitiated) {
    return `You reached out to ${firstName} about ${phrase}.`
  } else {
    return `${firstName} reached out to you about ${phrase}.`
  }
}

export function parseEmailAddress(raw: string): { name: string; email: string } {
  const match = raw.match(/^"?([^"<]+?)"?\s*<([^>]+)>$/)
  if (match) {
    return { name: match[1].trim(), email: match[2].trim().toLowerCase() }
  }
  const emailMatch = raw.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/)
  if (emailMatch) {
    return { name: "", email: emailMatch[1].toLowerCase() }
  }
  return { name: "", email: raw.trim().toLowerCase() }
}
