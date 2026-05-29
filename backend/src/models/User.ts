import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, minlength: 2 },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['STUDENT', 'ADMIN'], default: 'STUDENT' },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);