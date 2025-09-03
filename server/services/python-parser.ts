export interface PythonFunction {
  name: string;
  startLine: number;
  endLine: number;
  signature: string;
  hasDocstring: boolean;
}

export class PythonParser {
  
  static parseFunctions(code: string): PythonFunction[] {
    const functions: PythonFunction[] = [];
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Match function definitions - more flexible pattern
      const functionMatch = line.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
      if (functionMatch) {
        const functionName = functionMatch[1];
        const startLine = i + 1; // 1-indexed
        
        // Find the end of the function
        let endLine = startLine;
        let indentLevel = this.getIndentLevel(lines[i]);
        
        // Check if next line has a docstring
        let hasDocstring = false;
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.startsWith('"""') || nextLine.startsWith("'''")) {
            hasDocstring = true;
          }
        }
        
        // Find the end of the function by looking for the next function or class at the same indent level
        for (let j = i + 1; j < lines.length; j++) {
          const currentLine = lines[j];
          if (currentLine.trim() === '') continue; // Skip empty lines
          
          const currentIndent = this.getIndentLevel(currentLine);
          
          // If we find a line at the same or lower indent level that's not part of this function
          if (currentIndent <= indentLevel && 
              (currentLine.trim().startsWith('def ') || 
               currentLine.trim().startsWith('class ') ||
               currentLine.trim().startsWith('if __name__'))) {
            endLine = j;
            break;
          }
          endLine = j + 1; // 1-indexed
        }
        
        // Get the full function signature - handle multi-line definitions
        let signature = lines[i].trim();
        let j = i + 1;
        let parenCount = (signature.match(/\(/g) || []).length - (signature.match(/\)/g) || []).length;
        
        // Continue reading lines until we find the closing colon and balanced parentheses
        while (j < lines.length && (parenCount > 0 || !signature.includes(':'))) {
          const nextLine = lines[j].trim();
          signature += ' ' + nextLine;
          parenCount += (nextLine.match(/\(/g) || []).length - (nextLine.match(/\)/g) || []).length;
          j++;
        }
        
        functions.push({
          name: functionName,
          startLine,
          endLine,
          signature: signature.replace(':', ''),
          hasDocstring,
        });
      }
    }
    
    return functions;
  }
  
  static getIndentLevel(line: string): number {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }
  
  static validatePythonSyntax(code: string): { isValid: boolean; error?: string } {
    try {
      // Basic syntax validation - check for common Python syntax issues
      const lines = code.split('\n');
      let parenCount = 0;
      let bracketCount = 0;
      let braceCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') continue;
        
        const indent = this.getIndentLevel(line);
        const trimmed = line.trim();
        
        // Skip comments and strings for bracket counting
        let inString = false;
        let stringChar = '';
        let inComment = false;
        
        for (let j = 0; j < trimmed.length; j++) {
          const char = trimmed[j];
          
          if (!inString && char === '#') {
            inComment = true;
            break;
          }
          
          if (!inComment && (char === '"' || char === "'")) {
            if (!inString) {
              inString = true;
              stringChar = char;
            } else if (char === stringChar) {
              inString = false;
              stringChar = '';
            }
          }
          
          if (!inString && !inComment) {
            if (char === '(') parenCount++;
            else if (char === ')') parenCount--;
            else if (char === '[') bracketCount++;
            else if (char === ']') bracketCount--;
            else if (char === '{') braceCount++;
            else if (char === '}') braceCount--;
          }
        }
        
        // Check for basic syntax issues
        if (trimmed.endsWith(':') && !trimmed.startsWith('#')) {
          // This line should be followed by an indented block
          let nextNonEmptyLine = i + 1;
          while (nextNonEmptyLine < lines.length && lines[nextNonEmptyLine].trim() === '') {
            nextNonEmptyLine++;
          }
          
          if (nextNonEmptyLine < lines.length) {
            const nextLine = lines[nextNonEmptyLine];
            if (this.getIndentLevel(nextLine) <= indent) {
              return { 
                isValid: false, 
                error: `Line ${i + 1}: Expected indented block after '${trimmed}'` 
              };
            }
          }
        }
      }
      
      // Check for unmatched brackets at the end
      if (parenCount !== 0) {
        return { 
          isValid: false, 
          error: `Unmatched parentheses in code` 
        };
      }
      if (bracketCount !== 0) {
        return { 
          isValid: false, 
          error: `Unmatched square brackets in code` 
        };
      }
      if (braceCount !== 0) {
        return { 
          isValid: false, 
          error: `Unmatched curly braces in code` 
        };
      }
      
      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Unknown syntax error' 
      };
    }
  }
  
  static extractCodeWithoutDocstrings(code: string): string {
    const lines = code.split('\n');
    const result: string[] = [];
    let inDocstring = false;
    let docstringQuote = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!inDocstring && (trimmed.startsWith('"""') || trimmed.startsWith("'''"))) {
        docstringQuote = trimmed.startsWith('"""') ? '"""' : "'''";
        inDocstring = true;
        
        // Check if docstring ends on the same line
        if (trimmed.length > 3 && trimmed.endsWith(docstringQuote)) {
          inDocstring = false;
        }
        continue;
      }
      
      if (inDocstring && trimmed.endsWith(docstringQuote)) {
        inDocstring = false;
        continue;
      }
      
      if (!inDocstring) {
        result.push(line);
      }
    }
    
    return result.join('\n');
  }
}
