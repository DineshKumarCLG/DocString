import { useEffect, useRef } from 'react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  theme?: 'light' | 'dark';
  readOnly?: boolean;
}

export function MonacoEditor({
  value,
  onChange,
  language = 'python',
  height = '400px',
  theme = 'light',
  readOnly = false,
}: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);

  useEffect(() => {
    // Load Monaco Editor from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';
    script.onload = () => {
      // @ts-ignore
      window.require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
      // @ts-ignore
      window.require(['vs/editor/editor.main'], () => {
        if (editorRef.current) {
          // @ts-ignore
          const monaco = window.monaco;
          
          // Define custom theme for light mode
          monaco.editor.defineTheme('docstring-light', {
            base: 'vs',
            inherit: true,
            rules: [
              { token: 'keyword', foreground: '6f42c1', fontStyle: 'bold' },
              { token: 'string', foreground: '22863a' },
              { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
              { token: 'function', foreground: '005cc5' },
              { token: 'class', foreground: 'd73a49', fontStyle: 'bold' },
            ],
            colors: {
              'editor.background': '#fefbf0',
              'editor.foreground': '#5d4e37',
              'editor.lineHighlightBackground': '#f7f2e8',
              'editorLineNumber.foreground': '#a0956b',
            }
          });

          // Define custom theme for dark mode
          monaco.editor.defineTheme('docstring-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              { token: 'keyword', foreground: 'c792ea', fontStyle: 'bold' },
              { token: 'string', foreground: 'c3e88d' },
              { token: 'comment', foreground: '546e7a', fontStyle: 'italic' },
              { token: 'function', foreground: '82aaff' },
              { token: 'class', foreground: 'ffcb6b', fontStyle: 'bold' },
            ],
            colors: {
              'editor.background': '#000000',
              'editor.foreground': '#e8e6e3',
              'editor.lineHighlightBackground': '#1a1a1a',
              'editorLineNumber.foreground': '#757575',
            }
          });

          const editor = monaco.editor.create(editorRef.current, {
            value,
            language,
            theme: theme === 'dark' ? 'docstring-dark' : 'docstring-light',
            fontFamily: 'Space Grotesk, monospace',
            fontSize: 14,
            lineHeight: 1.5,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            readOnly,
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'line',
            contextmenu: true,
            mouseWheelZoom: true,
          });

          editor.onDidChangeModelContent(() => {
            const newValue = editor.getValue();
            onChange(newValue);
          });

          monacoRef.current = editor;

          return () => {
            editor.dispose();
          };
        }
      });
    };
    document.head.appendChild(script);

    return () => {
      if (monacoRef.current) {
        monacoRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (monacoRef.current && monacoRef.current.getValue() !== value) {
      monacoRef.current.setValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (monacoRef.current) {
      // @ts-ignore
      window.monaco.editor.setTheme(theme === 'dark' ? 'docstring-dark' : 'docstring-light');
    }
  }, [theme]);

  return (
    <div 
      ref={editorRef} 
      style={{ height }} 
      className="border border-border rounded-lg overflow-hidden"
    />
  );
}
