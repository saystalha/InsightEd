import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Public registration is disabled. Only administrators can create accounts.' },
    { status: 403 }
  );
}
