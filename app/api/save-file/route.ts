import { type NextRequest, NextResponse } from "next/server"
import * as fs from "fs"
import * as path from "path"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { content, filePath } = data

    if (!content || !filePath) {
      return NextResponse.json({ error: "Missing content or filePath" }, { status: 400 })
    }

    // For security, restrict to only writing .svelte or .js files
    const ext = path.extname(filePath)
    if (ext !== ".svelte" && ext !== ".js") {
      return NextResponse.json({ error: "Invalid file extension" }, { status: 400 })
    }

    // Write the file
    fs.writeFileSync(filePath, content)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving file:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

