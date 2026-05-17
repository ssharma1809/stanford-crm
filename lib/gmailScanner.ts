import { google } from "googleapis"
import { shouldExcludeEmail, isRealPerson } from "./emailFilter"
import {
  classifyRelationship,
  generateSummary,
  parseEmailAddress,
  Contact,
} from "./contactExtractor"

function getHeader(headers: { name?: string | null; value?: string | null }[], name: string): string {
  return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ""
}

export async function scanGmail(accessToken: string, userEmail: string): Promise<Contact[]> {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  const gmail = google.gmail({ version: "v1", auth })

  // Search recent emails — inbox + sent, last ~2 years
  const queries = [
    "in:inbox after:2022/01/01",
    "in:sent after:2022/01/01",
  ]

  const messageIds = new Set<string>()

  for (const q of queries) {
    let pageToken: string | undefined
    let fetched = 0
    while (fetched < 500) {
      const res = await gmail.users.messages.list({
        userId: "me",
        q,
        maxResults: 100,
        pageToken,
      })
      const messages = res.data.messages ?? []
      messages.forEach((m) => m.id && messageIds.add(m.id))
      fetched += messages.length
      if (!res.data.nextPageToken || messages.length === 0) break
      pageToken = res.data.nextPageToken
    }
  }

  // Fetch message metadata in batches
  const contactMap = new Map<
    string,
    {
      name: string
      email: string
      subject: string
      snippet: string
      userInitiated: boolean
      firstDate: Date
      lastDate: Date
    }
  >()

  const ids = Array.from(messageIds)

  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50)

    await Promise.all(
      batch.map(async (id) => {
        try {
          const msg = await gmail.users.messages.get({
            userId: "me",
            id,
            format: "metadata",
            metadataHeaders: [
              "From", "To", "Cc", "Subject", "Date",
              "List-Id", "List-Unsubscribe", "Precedence", "X-Mailer",
            ],
          })

          const headers = msg.data.payload?.headers ?? []
          const from = getHeader(headers, "From")
          const to = getHeader(headers, "To")
          const subject = getHeader(headers, "Subject")
          const date = getHeader(headers, "Date")
          const listId = getHeader(headers, "List-Id")
          const listUnsub = getHeader(headers, "List-Unsubscribe")
          const precedence = getHeader(headers, "Precedence")
          const snippet = msg.data.snippet ?? ""

          if (shouldExcludeEmail({ from, to, subject, listId, listUnsubscribe: listUnsub, precedence })) {
            return
          }

          const fromParsed = parseEmailAddress(from)
          const userIsSender = fromParsed.email === userEmail.toLowerCase()

          let contactEmail: string
          let contactName: string
          let userInitiated: boolean

          if (userIsSender) {
            const firstTo = to.split(",")[0].trim()
            const parsed = parseEmailAddress(firstTo)
            contactEmail = parsed.email
            contactName = parsed.name
            userInitiated = true
          } else {
            contactEmail = fromParsed.email
            contactName = fromParsed.name
            userInitiated = false
          }

          if (!contactEmail || contactEmail === userEmail.toLowerCase()) return
          if (!isRealPerson(contactEmail, contactName)) return

          const msgDate = date ? new Date(date) : new Date()
          if (isNaN(msgDate.getTime())) return

          const existing = contactMap.get(contactEmail)
          if (!existing) {
            contactMap.set(contactEmail, {
              name: contactName || contactEmail.split("@")[0],
              email: contactEmail,
              subject,
              snippet,
              userInitiated,
              firstDate: msgDate,
              lastDate: msgDate,
            })
          } else {
            if (msgDate < existing.firstDate) {
              existing.firstDate = msgDate
              existing.subject = subject
              existing.snippet = snippet
              existing.userInitiated = userInitiated
            }
            if (msgDate > existing.lastDate) {
              existing.lastDate = msgDate
            }
          }
        } catch {
          // skip individual failures
        }
      })
    )
  }

  const contacts: Contact[] = []

  for (const data of contactMap.values()) {
    const relationshipType = classifyRelationship(data.subject, data.snippet)
    const summary = generateSummary(data.name, data.subject, data.userInitiated)

    contacts.push({
      name: data.name,
      email: data.email,
      summary,
      relationshipType,
      firstInteractionDate: data.firstDate.toISOString().split("T")[0],
      lastInteractionDate: data.lastDate.toISOString().split("T")[0],
    })
  }

  return contacts.sort((a, b) =>
    new Date(b.lastInteractionDate).getTime() - new Date(a.lastInteractionDate).getTime()
  )
}
