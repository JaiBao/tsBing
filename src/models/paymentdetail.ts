import mongoose, { Schema, Document } from 'mongoose';

interface IPaymentDetail extends Document {
  paymentMethod: string;
  cardNumber: string;
  expirationDate: Date;
  cvv: string;
}

const PaymentDetailSchema: Schema = new Schema({
  paymentMethod: { type: String, required: true },
  cardNumber: { type: String, required: true },
  expirationDate: { type: Date, required: true },
  cvv: { type: String, required: true },
});

const PaymentDetailModel = mongoose.model<IPaymentDetail>('PaymentDetail', PaymentDetailSchema);

export default PaymentDetailModel;
