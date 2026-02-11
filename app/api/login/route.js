
import { NextResponse } from 'next/server';

export async function POST(req) {
    const { username, password } = await req.json();

    if (username === 'admin' && password === 'password') { // HARDCODED as per request
        return NextResponse.json({ success: true, token: 'dummy-token-123' });
    } else {
        return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }
}
