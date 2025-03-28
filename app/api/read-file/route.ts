import { type NextRequest, NextResponse } from "next/server"
import * as fs from "fs"
import * as path from "path"

export async function GET(request: NextRequest) {
  try {
    const filePath = request.nextUrl.searchParams.get("path")

    if (!filePath) {
      return NextResponse.json({ error: "Missing file path" }, { status: 400 })
    }

    // For security, restrict to only reading .svelte or .js files
    const ext = path.extname(filePath)
    if (ext !== ".svelte" && ext !== ".js") {
      return NextResponse.json({ error: "Invalid file extension" }, { status: 400 })
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Read the file
    const content = fs.readFileSync(filePath, "utf8")

    return NextResponse.json({ content })
  } catch (error) {
    console.error("Error reading file:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

