import { type FC, useRef } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";
import type { editor } from 'monaco-editor';
import { useDocumentStore, type Document } from "./state/document";

export interface EditorCardProps {
  /**
   * Displayed document in this editor
   */
  document: Document;
  active: boolean;
  onCardClick: (document: Document) => void;
  onFileRename: (document: Document, newName: string) => void;
  onFileUpdate: (document: Document, newContent: string) => void;
  onFileDelete: (document: Document) => void;
}

export const EditorCard: FC<EditorCardProps> = ({ document, active, onCardClick, onFileRename, onFileUpdate, onFileDelete }) =>  {
  const monacoRef = useRef<Monaco>(null);
  const documents = useDocumentStore(state => state.documents);

  // Set up editor for each file
  const handleEditorMount = (editorInstance: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    // Store monaco reference
    if (!monacoRef.current) {
      monacoRef.current = monaco;

      // Set up TypeScript language service
      if (monaco.languages.typescript) {
        // TODO: use config from tsconfig.json
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.ES2015,
          allowNonTsExtensions: true,
          moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
          module: monaco.languages.typescript.ModuleKind.ESNext,
          noEmit: false,
          esModuleInterop: true,
          jsx: monaco.languages.typescript.JsxEmit.React,
          reactNamespace: 'React',
          allowJs: true,
          typeRoots: ["node_modules/@types"]
        });

        // TODO: Add all declaration files (.d.ts) to the compiler
        // for (const file of libFiles)
        // monaco.languages.typescript.typescriptDefaults.addExtraLib
      }
    }

    const uri = monaco.Uri.parse(`file:${document.path}`);
    // Create model if it doesn't exist
    const model = monaco.editor.createModel(document.content, document.language, uri);
    editorInstance.setModel(model);

    editorInstance.onDidChangeModelContent(() => {
      onFileUpdate(document, editorInstance.getModel()?.getValue() ?? '');
    })
  };
  return (
    <div
      id={`file-card-${document.id}`}
      key={document.id}
      className={`bg-gray-800 rounded-md border border-gray-700 overflow-hidden flex flex-col mb-6 ${active ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => onCardClick(document)}
    >
      <div className="bg-gray-700 px-3 py-2 flex justify-between items-center">
        <input
          type="text"
          value={document.path}
          onChange={(e) => onFileRename(document, e.target.value)}
          className="bg-transparent border-b border-transparent hover:border-gray-500 focus:border-blue-500 focus:outline-none px-1 py-0.5 text-sm font-medium"
          onClick={(e) => e.stopPropagation()}
        />
        {documents.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFileDelete(document);
            }}
            className="text-gray-400 hover:text-red-500 cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      <div className="relative w-full" style={{
        minHeight: "16rem",
        visibility: "visible",
        overflow: "auto"
      }}>
        <Editor
          height="16rem"
          theme="vs-dark"
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            formatOnType: true,
            formatOnPaste: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 2,
            wordWrap: 'on',
            lineNumbers: 'on',
            scrollbar: {
              useShadows: true,
              verticalHasArrows: false,
              horizontalHasArrows: false,
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
              alwaysConsumeMouseWheel: false
            }
          }}
          onChange={(value) => {
            // TODO: handle file change
          }}
        />
      </div>
    </div>
  );
}