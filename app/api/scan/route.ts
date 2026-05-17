import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { scanGmail } from "@/lib/gmailScanner"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  if (!session.user?.email) {
    return NextResponse.json({ error: "No user email" }, { status: 400 })
  }

  try {
    const contacts = await scanGmail(session.accessToken, session.user.email)
    return NextResponse.json({ contacts, count: contacts.length })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Scan error:", msg)
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    )
  }
}

export const maxDuration = 60
