import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType, label } = await req.json()
    const ext = mimeType.includes('gif') ? 'gif' : 'jpg'
    const folder = label.includes('로고') ? 'logos' : 'stamps'
    const path = `${folder}/${Date.now()}.${ext}`
    const buffer = Buffer.from(base64, 'base64')

    const { error } = await supabaseAdmin.storage
      .from('org-assets')
      .upload(path, buffer, { contentType: mimeType, upsert: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const { data } = supabaseAdmin.storage.from('org-assets').getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
