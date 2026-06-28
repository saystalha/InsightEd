import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/logout
 *
 * Terminates the user's session by deleting both session cookies.
 * The client is responsible for clearing any localStorage data after receiving
 * a successful response from this endpoint.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();

    // Delete the HttpOnly session cookie (prevents further API access)
    cookieStore.delete('insighted_session');

    // Delete the client-readable metadata cookie (clears cached user info in the browser)
    cookieStore.delete('insighted_user');

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
