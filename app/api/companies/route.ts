import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const companiesQuery = `
      SELECT id, name, tax_number, city
      FROM companies
      WHERE is_active = true
      ORDER BY name ASC
    `

    const result = await query(companiesQuery)

    return NextResponse.json({
      companies: result.rows
    })

  } catch (error) {
    console.error("Companies fetch error:", error)
    return NextResponse.json(
      { error: "Şirketler yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}