import { NextResponse } from 'next/server';
import { getAllBrandProfiles, createBrandProfile } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const profiles = getAllBrandProfiles();
    return NextResponse.json({ success: true, data: profiles });
  } catch (error) {
    console.error('Brand Profiles GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const id = uuidv4();

    if (!body.brand_name || !body.visual_signature) {
      return NextResponse.json({ success: false, error: 'Brand Name dan Visual Signature wajib diisi.' }, { status: 400 });
    }

    createBrandProfile({
      id,
      brand_name: body.brand_name,
      tone_of_voice: body.tone_of_voice,
      visual_signature: body.visual_signature,
      color_palette: body.color_palette,
      forbidden_elements: body.forbidden_elements,
      brand_slogan_or_cta: body.brand_slogan_or_cta,
      raw_guideline_text: body.raw_guideline_text,
      guideline_filename: body.guideline_filename,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Brand Profiles POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
