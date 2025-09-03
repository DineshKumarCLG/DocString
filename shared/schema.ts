import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const docstringGenerations = pgTable("docstring_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull(),
  filename: text("filename"),
  format: text("format").notNull(), // 'google', 'numpy', 'sphinx'
  generatedDocstrings: jsonb("generated_docstrings").notNull(), // Array of {functionName, docstring, startLine, endLine}
  analysisMetadata: jsonb("analysis_metadata"), // {functionsCount, qualityScore, tokensUsed}
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDocstringGenerationSchema = createInsertSchema(docstringGenerations).omit({
  id: true,
  createdAt: true,
});

export const docstringRequestSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  format: z.enum(["google", "numpy", "sphinx"]),
  filename: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type DocstringGeneration = typeof docstringGenerations.$inferSelect;
export type InsertDocstringGeneration = z.infer<typeof insertDocstringGenerationSchema>;
export type DocstringRequest = z.infer<typeof docstringRequestSchema>;

export interface GeneratedDocstring {
  functionName: string;
  docstring: string;
  startLine: number;
  endLine: number;
}

export interface AnalysisMetadata {
  functionsCount: number;
  qualityScore: number;
  tokensUsed: number;
}
