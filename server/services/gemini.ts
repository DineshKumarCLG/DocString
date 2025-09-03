import { GoogleGenAI } from "@google/genai";
import type { GeneratedDocstring, AnalysisMetadata } from "@shared/schema";

// Note that the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro"
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface DocstringGenerationResult {
  generatedDocstrings: GeneratedDocstring[];
  analysisMetadata: AnalysisMetadata;
}

export async function generateDocstrings(
  code: string, 
  format: 'google' | 'numpy' | 'sphinx',
  functions: Array<{name: string, startLine: number, endLine: number, signature: string}>
): Promise<DocstringGenerationResult> {
  
  const formatInstructions = {
    google: `Use Google-style docstrings with the following format:
"""Brief description.

Longer description if needed.

Args:
    param1 (type): Description.
    param2 (type): Description.

Returns:
    type: Description.

Raises:
    ExceptionType: Description.

Examples:
    >>> example_usage()
    expected_output
"""`,
    numpy: `Use NumPy-style docstrings with the following format:
"""Brief description.

Longer description if needed.

Parameters
----------
param1 : type
    Description.
param2 : type
    Description.

Returns
-------
type
    Description.

Raises
------
ExceptionType
    Description.

Examples
--------
>>> example_usage()
expected_output
"""`,
    sphinx: `Use Sphinx-style docstrings with the following format:
"""Brief description.

Longer description if needed.

:param param1: Description.
:type param1: type
:param param2: Description.
:type param2: type
:returns: Description.
:rtype: type
:raises ExceptionType: Description.

.. code-block:: python

   example_usage()
"""`,
  };

  const prompt = `You are an expert Python developer and documentation specialist. Generate comprehensive, professional docstrings for the provided Python functions.

REQUIREMENTS:
1. ${formatInstructions[format]}
2. Analyze the code logic to understand what each function does
3. Infer parameter types from usage context and type hints
4. Provide clear, concise descriptions
5. Include examples when helpful
6. Mention any exceptions that might be raised
7. Be thorough but concise

FUNCTIONS TO DOCUMENT:
${functions.map(fn => `Function: ${fn.name}\nSignature: ${fn.signature}\nLines: ${fn.startLine}-${fn.endLine}`).join('\n\n')}

COMPLETE CODE CONTEXT:
\`\`\`python
${code}
\`\`\`

Respond with JSON in this exact format:
{
  "docstrings": [
    {
      "functionName": "function_name",
      "docstring": "complete_docstring_here",
      "startLine": line_number,
      "endLine": line_number
    }
  ],
  "qualityScore": 85,
  "tokensUsed": 1247
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: "You are an expert Python documentation generator. Always respond with valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            docstrings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  functionName: { type: "string" },
                  docstring: { type: "string" },
                  startLine: { type: "number" },
                  endLine: { type: "number" }
                },
                required: ["functionName", "docstring", "startLine", "endLine"]
              }
            },
            qualityScore: { type: "number" },
            tokensUsed: { type: "number" }
          },
          required: ["docstrings", "qualityScore", "tokensUsed"]
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    const result = JSON.parse(rawJson);
    
    if (!result.docstrings || !Array.isArray(result.docstrings)) {
      throw new Error("Invalid response format from Gemini");
    }

    const generatedDocstrings: GeneratedDocstring[] = result.docstrings.map((doc: any) => ({
      functionName: doc.functionName,
      docstring: doc.docstring,
      startLine: doc.startLine,
      endLine: doc.endLine,
    }));

    const analysisMetadata: AnalysisMetadata = {
      functionsCount: functions.length,
      qualityScore: Math.min(100, Math.max(0, result.qualityScore || 85)),
      tokensUsed: result.tokensUsed || 0,
    };

    return {
      generatedDocstrings,
      analysisMetadata,
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`Failed to generate docstrings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
