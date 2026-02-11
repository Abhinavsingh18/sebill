
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Bill from '@/models/Bill';

// GET: Get the next available receipt number
export async function GET() {
    await dbConnect();
    try {
        const lastBill = await Bill.findOne().sort({ createdAt: -1 });
        let nextNo = '001';

        if (lastBill && lastBill.receiptNo) {
            const num = parseInt(lastBill.receiptNo);
            if (!isNaN(num)) {
                nextNo = String(num + 1).padStart(3, '0');
            }
        }

        return NextResponse.json({ nextReceiptNo: nextNo });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
