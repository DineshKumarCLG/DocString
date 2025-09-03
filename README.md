# Python Docstring Generator

## Overview

This is a full-stack web application that generates high-quality Python docstrings using AI. Users can paste Python code or upload .py files, and the application will automatically parse functions and generate comprehensive docstrings in Google, NumPy, or Sphinx formats. The app features a modern React frontend with Monaco Editor integration and an Express.js backend that leverages OpenAI's API for intelligent docstring generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom warm color palette (cream/beige theme)
- **State Management**: TanStack Query for server state management
- **Code Editor**: Monaco Editor integration for Python syntax highlighting
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful API with structured error handling
- **File Processing**: Multer middleware for Python file uploads (10MB limit)
- **Development**: Hot module replacement with Vite integration
- **Build**: esbuild for production bundling

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon serverless PostgreSQL database
- **Schema**: Users table and docstring generations table with JSONB for complex data
- **Migrations**: Drizzle Kit for database schema management
- **Session Storage**: PostgreSQL-based session storage with connect-pg-simple

### Core Features
- **Python Parser**: Custom AST-based function extraction and validation
- **AI Integration**: OpenAI GPT integration for docstring generation
- **Multi-format Support**: Google, NumPy, and Sphinx docstring formats
- **File Upload**: Direct .py file processing with syntax validation
- **Code Preview**: Split-pane interface with original and generated code
- **Theme Support**: Light/dark mode with custom CSS variables

### External Dependencies

- **AI Service**: Google Gemini API (Gemini models) for intelligent docstring generation
- **Database**: Neon PostgreSQL for data persistence
- **CDN**: Monaco Editor loaded from CDNJS for code editing
- **Fonts**: Google Fonts (Lora, Space Grotesk) for typography
- **Development**: Replit integration with development banner and cartographer plugin
