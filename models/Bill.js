
import mongoose from 'mongoose';

const BillSchema = new mongoose.Schema({
    receiptNo: { type: String, required: true, unique: true },
    patientName: { type: String, required: true },
    date: { type: String, required: true },
    netAmount: { type: String, required: true },
    fullState: { type: Object, required: true },
}, { timestamps: true });

// Prevent checking if model compiled if already compiled
export default mongoose.models.Bill || mongoose.model('Bill', BillSchema);
