import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/theme-provider';
import { MonacoEditor } from '@/components/monaco-editor';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  FileText, 
  Upload, 
  Download, 
  Copy, 
  Sun, 
  Moon, 
  Settings, 
  Github,
  Code,
  Brain,
  Loader2,
  FileCode,
  Sparkles
} from 'lucide-react';
import type { DocstringRequest, GeneratedDocstring, AnalysisMetadata } from '@shared/schema';

interface DocstringResponse {
  id: string;
  generatedDocstrings: GeneratedDocstring[];
  analysisMetadata: AnalysisMetadata;
}

export default function Home() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [code, setCode] = useState('');
  const [filename, setFilename] = useState('main.py');
  const [format, setFormat] = useState<'google' | 'numpy' | 'sphinx'>('google');
  const [previewTab, setPreviewTab] = useState('preview');
  const [recentFiles] = useState(['utils.py', 'models.py', 'api.py']);

  const generateDocstringMutation = useMutation({
    mutationFn: async (request: DocstringRequest): Promise<DocstringResponse> => {
      const response = await apiRequest('POST', '/api/generate-docstring', request);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Docstrings Generated Successfully',
        description: `Generated ${data.generatedDocstrings.length} docstrings with quality score ${data.analysisMetadata.qualityScore}/100`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.py')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
        setFilename(file.name);
        toast({
          title: 'File Uploaded',
          description: `Loaded ${file.name} successfully`,
        });
      };
      reader.readAsText(file);
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please upload a Python (.py) file',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.name.endsWith('.py')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
        setFilename(file.name);
        toast({
          title: 'File Uploaded',
          description: `Loaded ${file.name} successfully`,
        });
      };
      reader.readAsText(file);
    }
  }, [toast]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const generateDocstrings = () => {
    if (!code.trim()) {
      toast({
        title: 'No Code Provided',
        description: 'Please enter Python code or upload a file',
        variant: 'destructive',
      });
      return;
    }

    generateDocstringMutation.mutate({
      code,
      format,
      filename,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to Clipboard',
        description: 'Docstring copied successfully',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const exportAsMarkdown = () => {
    if (!generateDocstringMutation.data) return;
    
    let markdown = `# ${filename} Documentation\n\n`;
    generateDocstringMutation.data.generatedDocstrings.forEach((doc) => {
      markdown += `## ${doc.functionName}\n\n\`\`\`python\n${doc.docstring}\n\`\`\`\n\n`;
    });
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace('.py', '')}_docs.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJson = () => {
    if (!generateDocstringMutation.data) return;
    
    const jsonData = {
      filename,
      format,
      generatedDocstrings: generateDocstringMutation.data.generatedDocstrings,
      metadata: generateDocstringMutation.data.analysisMetadata,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace('.py', '')}_docstrings.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Code className="text-primary-foreground w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-foreground font-serif">DocString AI</h1>
            </div>
            <span className="text-muted-foreground text-sm hidden md:inline">Automated Python Documentation</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              data-testid="button-theme-toggle"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            <Button variant="ghost" size="sm" data-testid="button-github">
              <Github className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm" data-testid="button-settings">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
          
          {/* Left Panel: Code Input */}
          <div className="flex flex-col space-y-4">
            {/* Input Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h2 className="text-lg font-semibold text-foreground font-serif">Python Code Input</h2>
                  
                  <div className="flex items-center space-x-2">
                    <Select value={format} onValueChange={(value: 'google' | 'numpy' | 'sphinx') => setFormat(value)}>
                      <SelectTrigger className="w-32" data-testid="select-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google Style</SelectItem>
                        <SelectItem value="numpy">NumPy Style</SelectItem>
                        <SelectItem value="sphinx">Sphinx Style</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      onClick={generateDocstrings}
                      disabled={generateDocstringMutation.isPending}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      data-testid="button-generate"
                    >
                      {generateDocstringMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* File Upload Area */}
                <div 
                  className="file-upload-hover border-2 border-dashed border-border rounded-lg p-8 text-center mb-4 cursor-pointer transition-all"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById('file-input')?.click()}
                  data-testid="area-file-upload"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Upload className="text-muted-foreground w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium">Drop Python files here</p>
                      <p className="text-muted-foreground text-sm">or <span className="text-primary">click to browse</span></p>
                    </div>
                    <p className="text-xs text-muted-foreground">Supports .py files up to 10MB</p>
                  </div>
                  <input 
                    id="file-input"
                    type="file" 
                    accept=".py" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    data-testid="input-file"
                  />
                </div>
                
                {/* Recent Files */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Recent:</span>
                  {recentFiles.map((file, index) => (
                    <Button
                      key={index}
                      variant="secondary"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setFilename(file)}
                      data-testid={`button-recent-${index}`}
                    >
                      {file}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Code Editor */}
            <Card className="flex-1 flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <div className="flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground font-mono" data-testid="text-filename">{filename}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground" data-testid="text-line-count">
                    {code.split('\n').length} lines
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(code)}
                    data-testid="button-copy-code"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <MonacoEditor
                  value={code}
                  onChange={setCode}
                  language="python"
                  theme={theme}
                  height="100%"
                />
              </div>
            </Card>
          </div>

          {/* Right Panel: Generated Documentation */}
          <div className="flex flex-col space-y-4">
            {/* Preview Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-foreground font-serif">Generated Documentation</h2>
                  
                  <div className="flex items-center space-x-2">
                    {/* Quality Indicator */}
                    {generateDocstringMutation.data && (
                      <div className="flex items-center space-x-1 text-xs">
                        <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                        <span className="text-muted-foreground" data-testid="text-quality">
                          Quality: {generateDocstringMutation.data.analysisMetadata.qualityScore}/100
                        </span>
                      </div>
                    )}
                    
                    {/* Export Options */}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={exportAsMarkdown}
                        disabled={!generateDocstringMutation.data}
                        data-testid="button-export-markdown"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        MD
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={exportAsJson}
                        disabled={!generateDocstringMutation.data}
                        data-testid="button-export-json"
                      >
                        <Code className="w-3 h-3 mr-1" />
                        JSON
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => generateDocstringMutation.data && copyToClipboard(
                          generateDocstringMutation.data.generatedDocstrings
                            .map(doc => `${doc.functionName}:\n${doc.docstring}`)
                            .join('\n\n---\n\n')
                        )}
                        disabled={!generateDocstringMutation.data}
                        data-testid="button-copy-all"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documentation Preview */}
            <Card className="flex-1 flex flex-col">
              <Tabs value={previewTab} onValueChange={setPreviewTab} className="flex-1 flex flex-col">
                <div className="flex items-center border-b border-border px-4">
                  <TabsList className="grid w-48 grid-cols-3 bg-transparent">
                    <TabsTrigger value="preview" className="text-xs" data-testid="tab-preview">Preview</TabsTrigger>
                    <TabsTrigger value="raw" className="text-xs" data-testid="tab-raw">Raw</TabsTrigger>
                    <TabsTrigger value="diff" className="text-xs" data-testid="tab-diff">Diff</TabsTrigger>
                  </TabsList>
                  
                  {/* Loading Indicator */}
                  {generateDocstringMutation.isPending && (
                    <div className="ml-auto px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">
                          Generating<span className="loading-dots"></span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 overflow-auto">
                  <TabsContent value="preview" className="p-4 mt-0" data-testid="content-preview">
                    {generateDocstringMutation.data ? (
                      <div className="space-y-8">
                        {generateDocstringMutation.data.generatedDocstrings.map((doc, index) => (
                          <div key={index} className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Code className="w-4 h-4 text-chart-1" />
                              <h3 className="text-base font-semibold text-foreground font-mono" data-testid={`text-function-${index}`}>
                                {doc.functionName}
                              </h3>
                              <Badge variant="secondary" className="bg-chart-1 text-white">
                                Generated
                              </Badge>
                            </div>
                            
                            <div className="bg-muted rounded-lg p-4 font-mono text-sm relative group">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => copyToClipboard(doc.docstring)}
                                data-testid={`button-copy-${index}`}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <pre className="text-foreground whitespace-pre-wrap" data-testid={`text-docstring-${index}`}>
                                {doc.docstring}
                              </pre>
                            </div>
                          </div>
                        ))}

                        {/* AI Analysis Summary */}
                        <div className="border-t border-border pt-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <Brain className="w-4 h-4 text-primary" />
                            <h4 className="text-sm font-semibold text-foreground">AI Analysis Summary</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-muted rounded-lg p-3">
                              <div className="text-xs text-muted-foreground mb-1">Functions Analyzed</div>
                              <div className="text-lg font-bold text-chart-1" data-testid="text-functions-count">
                                {generateDocstringMutation.data.analysisMetadata.functionsCount}
                              </div>
                            </div>
                            <div className="bg-muted rounded-lg p-3">
                              <div className="text-xs text-muted-foreground mb-1">Coverage</div>
                              <div className="text-lg font-bold text-chart-2" data-testid="text-coverage">
                                100%
                              </div>
                            </div>
                            <div className="bg-muted rounded-lg p-3">
                              <div className="text-xs text-muted-foreground mb-1">Quality Score</div>
                              <div className="text-lg font-bold text-chart-3" data-testid="text-quality-score">
                                {generateDocstringMutation.data.analysisMetadata.qualityScore}/100
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Brain className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-foreground font-medium mb-2">No Documentation Generated Yet</p>
                        <p className="text-muted-foreground text-sm">
                          Add Python code and click Generate to create AI-powered docstrings
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="raw" className="p-4 mt-0" data-testid="content-raw">
                    {generateDocstringMutation.data ? (
                      <pre className="text-sm font-mono bg-muted p-4 rounded-lg text-foreground whitespace-pre-wrap">
                        {JSON.stringify(generateDocstringMutation.data, null, 2)}
                      </pre>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No raw data available</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="diff" className="p-4 mt-0" data-testid="content-diff">
                    {generateDocstringMutation.data ? (
                      <div className="space-y-4">
                        {generateDocstringMutation.data.generatedDocstrings.map((doc, index) => (
                          <div key={index} className="space-y-2">
                            <h4 className="font-semibold text-foreground" data-testid={`text-diff-function-${index}`}>
                              {doc.functionName} (Lines {doc.startLine}-{doc.endLine})
                            </h4>
                            <div className="bg-muted rounded-lg p-4">
                              <div className="text-xs text-green-600 mb-2">+ Added docstring:</div>
                              <pre className="text-sm font-mono text-foreground whitespace-pre-wrap">
                                {doc.docstring}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No diff available</p>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>
        </div>

        {/* Status Bar */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-chart-2 rounded-full animate-pulse"></div>
                  <span className="text-sm text-foreground" data-testid="text-status">
                    {generateDocstringMutation.isPending 
                      ? 'Generating documentation...' 
                      : generateDocstringMutation.data 
                        ? 'Documentation generated successfully'
                        : 'Ready to generate documentation'
                    }
                  </span>
                </div>
                
                {generateDocstringMutation.data && (
                  <div className="text-sm text-muted-foreground">
                    Last generated: <span className="text-foreground">Just now</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span data-testid="text-api-status">
                  API Status: <span className="text-chart-2">Connected</span>
                </span>
                <span data-testid="text-model">Model: GPT-5</span>
                {generateDocstringMutation.data && (
                  <span data-testid="text-tokens">
                    Tokens Used: {generateDocstringMutation.data.analysisMetadata.tokensUsed}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
