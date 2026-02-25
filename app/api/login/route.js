
import { NextResponse } from 'next/server';

export async function POST(req) {
    const { username, password } = await req.json();

    if (username === 'admin' && password === 'admin@123') { // Updated to match portal
        return NextResponse.json({ success: true, token: 'dummy-token-123' });
    } else {
        return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }
}
