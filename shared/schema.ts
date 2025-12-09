import mongoose from "mongoose";
import { z } from "zod";

// Zod schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const insertContactSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  message: z.string().min(1),
  newsletter: z.boolean().default(false),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;

// MongoDB Schemas with Mongoose
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, {
  timestamps: true,
});

const contactSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String, required: false },
  message: { type: String, required: true },
  newsletter: { type: Boolean, required: true, default: false },
}, {
  timestamps: true,
});

// Models
export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);

// Types
export interface User {
  _id: string;
  username: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Contact {
  _id: string;
  fullName: string;
  email: string;
  company?: string;
  message: string;
  newsletter: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
