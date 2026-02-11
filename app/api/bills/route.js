
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Bill from '@/models/Bill';

// GET: Fetch all bills
export async function GET() {
    await dbConnect();
    try {
        const bills = await Bill.find({}).sort({ createdAt: -1 }).limit(50);
        return NextResponse.json(bills);
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST: Create a new bill
export async function POST(req) {
    await dbConnect();
    try {
        const body = await req.json();
        const bill = await Bill.create(body);
        return NextResponse.json({ success: true, data: bill });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
