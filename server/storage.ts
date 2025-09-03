import { type User, type InsertUser, type DocstringGeneration, type InsertDocstringGeneration } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createDocstringGeneration(generation: InsertDocstringGeneration): Promise<DocstringGeneration>;
  getDocstringGeneration(id: string): Promise<DocstringGeneration | undefined>;
  getRecentGenerations(limit?: number): Promise<DocstringGeneration[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private docstringGenerations: Map<string, DocstringGeneration>;

  constructor() {
    this.users = new Map();
    this.docstringGenerations = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createDocstringGeneration(generation: InsertDocstringGeneration): Promise<DocstringGeneration> {
    const id = randomUUID();
    const docstringGeneration: DocstringGeneration = {
      ...generation,
      id,
      createdAt: new Date(),
    };
    this.docstringGenerations.set(id, docstringGeneration);
    return docstringGeneration;
  }

  async getDocstringGeneration(id: string): Promise<DocstringGeneration | undefined> {
    return this.docstringGenerations.get(id);
  }

  async getRecentGenerations(limit: number = 10): Promise<DocstringGeneration[]> {
    const generations = Array.from(this.docstringGenerations.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
    return generations;
  }
}

export const storage = new MemStorage();
