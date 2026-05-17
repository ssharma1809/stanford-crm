"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { useState, useCallback } from "react"

interface Contact {
  name: string
  email: string
  summary: string
  relationshipType: string
  firstInteractionDate: string
  lastInteractionDate: string
}

function downloadCSV(contacts: Contact[]) {
  const headers = [
    "Name", "Email", "1 Line Summary", "Relationship Type",
    "First Interaction Date", "Last Interaction Date",
  ]
  const rows = contacts.map((c) => [
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.email}"`,
    `"${c.summary.replace(/"/g, '""')}"`,
    `"${c.relationshipType}"`,
    `"${c.firstInteractionDate}"`,
    `"${c.lastInteractionDate}"`,
  ])
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "stanford-crm-contacts.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export default function Home() {
  const { data: session, status } = useSession()
  const [phase, setPhase] = useState<"consent" | "scanning" | "done">("consent")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [error, setError] = useState("")
  const [progress, setProgress] = useState("")

  const handleScan = useCallback(async () => {
    setPhase("scanning")
    setProgress("Connecting to Gmail...")
    setError("")

    try {
      setProgress("Scanning your inbox for meaningful connections...")
      const res = await fetch("/api/scan")

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Scan failed")
      }

      const data = await res.json()
      setContacts(data.contacts)
      setPhase("done")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setPhase("consent")
    }
  }, [])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#8C1515] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#8C1515] flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Stanford CRM</h1>
            <p className="text-[#f4c97c] text-lg">Preserve your Stanford network before you go</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Export your meaningful connections
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Scan your Gmail to find classmates, mentors, recruiters, and founders
                you connected with at GSB — then download them as a spreadsheet.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                What we access
              </p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>Read-only Gmail access</li>
                <li>Your name and email address</li>
              </ul>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">
                What we never do
              </p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>Send, delete, or modify emails</li>
                <li>Store your email content</li>
                <li>Share your data with anyone</li>
              </ul>
            </div>

            <button
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-xl py-3 px-4 font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-xs text-gray-400 mt-4 text-center">
              You can revoke access anytime in your Google account settings.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (phase === "consent") {
    return (
      <div className="min-h-screen bg-[#8C1515] flex flex-col items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-1">Stanford CRM</h1>
            <p className="text-[#f4c97c]">Logged in as {session.user?.email}</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to scan your inbox
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              We will search your Gmail for meaningful relationships from your Stanford years —
              classmates, mentors, recruiters, founders, and more. This may take up to a minute.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Privacy note:</strong> All processing happens in memory. We never
                store your emails. Only the extracted contact list is returned to you.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleScan}
              className="w-full bg-[#8C1515] text-white rounded-xl py-3 font-semibold hover:bg-[#6d1010] transition-colors"
            >
              Scan my Gmail
            </button>

            <button
              onClick={() => signOut()}
              className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === "scanning") {
    return (
      <div className="min-h-screen bg-[#8C1515] flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl p-10 shadow-xl">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 border-4 border-[#8C1515] border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Scanning your inbox</h2>
            <p className="text-gray-500 text-sm">{progress}</p>
            <p className="text-gray-400 text-xs mt-3">This may take 30-60 seconds...</p>
          </div>
        </div>
      </div>
    )
  }

  // Done phase — show results
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#8C1515] py-8 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Stanford CRM</h1>
            <p className="text-[#f4c97c] text-sm">
              Found {contacts.length} meaningful connections
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => downloadCSV(contacts)}
              className="bg-[#f4c97c] text-[#8C1515] px-5 py-2 rounded-xl font-semibold hover:bg-[#f0bf5c] transition-colors"
            >
              Download CSV
            </button>
            <button
              onClick={() => { setPhase("consent"); setContacts([]) }}
              className="bg-white/10 text-white px-5 py-2 rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              Scan again
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-36">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-48">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Summary</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-40">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-28">First</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-28">Last</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[144px]">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[192px]">{c.email}</td>
                    <td className="px-4 py-3 text-gray-700">{c.summary}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {c.relationshipType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{c.firstInteractionDate}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{c.lastInteractionDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Review your contacts above, then download your CSV.
          You can revoke Gmail access anytime at myaccount.google.com/permissions.
        </p>
      </div>
    </div>
  )
}
