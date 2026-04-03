import React from "react";
import Editor from "@monaco-editor/react";

const CodeEditor = ({ code, language = "javascript", onChange }) => {
  const handleEditorChange = (value) => {
    onChange(value);
  };

  const handleEditorMount = (editor, monaco) => {
    // Disable all JS/TS validation and red squiggly lines
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });
  };

  return (
    <div className="relative h-full bg-[linear-gradient(180deg,rgba(37,99,235,0.07),transparent_18%),#1e1e1e]">
      {!code ? (
        <div className="pointer-events-none absolute left-[56px] top-[20px] z-10 font-mono text-[13px] italic text-white/28">
          // paste your code here
        </div>
      ) : null}

      <Editor
        height="100%"
        theme="vs-dark"
        language={language}
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineHeight: 22,
          padding: { top: 18 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          glyphMargin: false,
          folding: false,
          lineNumbersMinChars: 3,
          renderLineHighlight: "gutter",
          roundedSelection: false,
          cursorBlinking: "smooth",
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          wordWrap: "off",
          renderValidationDecorations: "off",
          overviewRulerLanes: 0,
        }}
      />
    </div>
  );
};

export default CodeEditor;
