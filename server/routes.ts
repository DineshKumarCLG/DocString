import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { generateDocstrings } from "./services/gemini";
import { PythonParser } from "./services/python-parser";
import { docstringRequestSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.py')) {
      cb(null, true);
    } else {
      cb(new Error('Only Python (.py) files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate docstring endpoint
  app.post("/api/generate-docstring", async (req, res) => {
    try {
      const validatedData = docstringRequestSchema.parse(req.body);
      const { code, format, filename } = validatedData;

      // Validate Python syntax
      const syntaxValidation = PythonParser.validatePythonSyntax(code);
      if (!syntaxValidation.isValid) {
        return res.status(400).json({ 
          message: "Invalid Python syntax", 
          error: syntaxValidation.error 
        });
      }

      // Parse functions from code
      const functions = PythonParser.parseFunctions(code);
      
      if (functions.length === 0) {
        return res.status(400).json({ 
          message: "No functions found in the provided code" 
        });
      }

      // Generate docstrings using OpenAI
      const result = await generateDocstrings(code, format, functions);

      // Store the generation result
      const storedGeneration = await storage.createDocstringGeneration({
        code,
        filename: filename || 'untitled.py',
        format,
        generatedDocstrings: result.generatedDocstrings,
        analysisMetadata: result.analysisMetadata,
      });

      res.json({
        id: storedGeneration.id,
        generatedDocstrings: result.generatedDocstrings,
        analysisMetadata: result.analysisMetadata,
      });
    } catch (error) {
      console.error('Error generating docstrings:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate docstrings" 
      });
    }
  });

  // Upload Python file endpoint
  app.post("/api/upload-file", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const content = req.file.buffer.toString('utf-8');
      const filename = req.file.originalname;

      // Validate Python syntax
      const syntaxValidation = PythonParser.validatePythonSyntax(content);
      if (!syntaxValidation.isValid) {
        return res.status(400).json({ 
          message: "Invalid Python syntax in uploaded file", 
          error: syntaxValidation.error 
        });
      }

      res.json({
        filename,
        content,
        size: req.file.size,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to upload file" 
      });
    }
  });

  // Get recent generations
  app.get("/api/recent-generations", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const generations = await storage.getRecentGenerations(limit);
      res.json(generations);
    } catch (error) {
      console.error('Error fetching recent generations:', error);
      res.status(500).json({ 
        message: "Failed to fetch recent generations" 
      });
    }
  });

  // Get specific generation by ID
  app.get("/api/generation/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const generation = await storage.getDocstringGeneration(id);
      
      if (!generation) {
        return res.status(404).json({ message: "Generation not found" });
      }
      
      res.json(generation);
    } catch (error) {
      console.error('Error fetching generation:', error);
      res.status(500).json({ 
        message: "Failed to fetch generation" 
      });
    }
  });

  // Validate Python code endpoint
  app.post("/api/validate-python", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: "Code is required" });
      }

      const validation = PythonParser.validatePythonSyntax(code);
      const functions = PythonParser.parseFunctions(code);

      res.json({
        isValid: validation.isValid,
        error: validation.error,
        functionsFound: functions.length,
        functions: functions.map(fn => ({
          name: fn.name,
          signature: fn.signature,
          hasDocstring: fn.hasDocstring,
        })),
      });
    } catch (error) {
      console.error('Error validating Python code:', error);
      res.status(500).json({ 
        message: "Failed to validate Python code" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
