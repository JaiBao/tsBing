import mongoose, { Schema, Document } from 'mongoose';

interface timestamp extends Document {
  date: string;
  time: string;
  amount: number;
  order_id: string;
  road:string;
}

const UserSchema: Schema = new Schema({
  date: { type: String },
  time: { type: String },
  amount: { type: Number },
  order_id: { type: String },
  road: { type: String },
  remark: { type: String },
});

const User = mongoose.model<timestamp>('timestamp', UserSchema);

export default User;