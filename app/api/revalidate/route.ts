import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

import { tagsForPayload } from './tags'

export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json(
      { message: 'Revalidation secret is not configured' },
      { status: 500 },
    )
  }

  const signature = request.headers.get(SIGNATURE_HEADER_NAME)
  const body = await request.text()

  if (!signature || !(await isValidSignature(body, signature, secret))) {
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 })
  }

  const tags = tagsForPayload(JSON.parse(body))
  tags.forEach((tag) => revalidateTag(tag, 'max'))

  return NextResponse.json({ revalidated: tags })
}
