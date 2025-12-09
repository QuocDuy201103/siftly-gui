import { type User, type InsertUser, type Contact, type InsertContact, User as UserModel, Contact as ContactModel } from "@shared/schema";
import { connectDb } from "./db";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createContact(contact: InsertContact): Promise<Contact>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    await connectDb();
    const user = await UserModel.findById(id);
    if (!user) return undefined;
    return user.toObject() as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await connectDb();
    const user = await UserModel.findOne({ username });
    if (!user) return undefined;
    return user.toObject() as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await connectDb();
    const user = await UserModel.create(insertUser);
    return user.toObject() as User;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    await connectDb();
    const contact = await ContactModel.create(insertContact);
    return contact.toObject() as Contact;
  }
}

export const storage = new DbStorage();
