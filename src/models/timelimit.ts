import mongoose, { Schema, Document } from 'mongoose';

interface timelimit extends Document {
  date: string;
  time: string;
}

const TimeSchema: Schema = new Schema({
  date: { type: String },
  time: { type: String },

});

const User = mongoose.model<timelimit>('timelimit', TimeSchema);

export default User;