import { eq, desc } from "drizzle-orm";
import { type User, type InsertUser, type Contact, type InsertContact, users, contacts } from "@/shared/schema";
import { connectDb } from "./db";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
    getUser(id: string): Promise<User | undefined>;
    getUserByUsername(username: string): Promise<User | undefined>;
    createUser(user: InsertUser): Promise<User>;
    createContact(contact: InsertContact): Promise<Contact>;
    getAllContacts(): Promise<Contact[]>;
    deleteContact(id: string): Promise<boolean>;
}

export class DbStorage implements IStorage {
    async getUser(id: string): Promise<User | undefined> {
        const db = await connectDb();
        const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return user;
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        const db = await connectDb();
        const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
        return user;
    }

    async createUser(insertUser: InsertUser): Promise<User> {
        const db = await connectDb();
        const [user] = await db.insert(users).values(insertUser).returning();
        return user;
    }

    async createContact(insertContact: InsertContact): Promise<Contact> {
        const db = await connectDb();
        const [contact] = await db.insert(contacts).values(insertContact).returning();
        return contact;
    }

    async getAllContacts(): Promise<Contact[]> {
        const db = await connectDb();
        const allContacts = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
        return allContacts;
    }

    async deleteContact(id: string): Promise<boolean> {
        const db = await connectDb();
        const [deleted] = await db.delete(contacts).where(eq(contacts.id, id)).returning();
        return !!deleted;
    }
}

export const storage = new DbStorage();
