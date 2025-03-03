import { FileData } from "./defaultCase";
import Editor from "@monaco-editor/react";
import type { editor } from 'monaco-editor';

interface CodeCardProps {
  files: FileData[];
  file: FileData;
  activeTab: string;
  activeFileForJs: string;
  handleFileCardClick: (id: string) => void;
  updateFileName: (id: string, name: string) => void;
  deleteFile: (id: string) => void;
  generateJsOutput: (content: string, fileId: string) => void;
  editorsRef: React.RefObject<Map<string, editor.IStandaloneCodeEditor>>;
  monacoRef: any;
  setFiles: (files: FileData[]) => void;
}

export function CodeCard({ files, file, activeTab, activeFileForJs, handleFileCardClick, updateFileName, deleteFile, generateJsOutput, editorsRef, monacoRef, setFiles }: CodeCardProps) {
  // Set up editor for each file
  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor, monaco: any, fileId: string) => {
    // Store editor reference
    editorsRef.current.set(fileId, editorInstance);

    // Store monaco reference
    if (!monacoRef.current) {
      monacoRef.current = monaco;

      // Set up TypeScript language service
      if (monaco.languages.typescript) {
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

        // Add all TS files to the compiler
        files.forEach(file => {
          if (file.language === 'typescript') {
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
              file.content,
              `file:${file.path}`
            );
          }
        });
      }
    }

    // Get file URI
    const file = files.find(f => f.id === fileId);
    if (file) {
      const uri = monaco.Uri.parse(`file:${file.path}`);
      let model = monaco.editor.getModel(uri);

      if (!model) {
        // Create model if it doesn't exist
        model = monaco.editor.createModel(file.content, file.language, uri);
      }

      // Set model for this editor
      editorInstance.setModel(model);
    }

    // Update file content when editor content changes
    editorInstance.onDidChangeModelContent(() => {
      const fileIndex = files.findIndex(f => f.id === fileId);
      if (fileIndex !== -1) {
        const updatedFiles = [...files];
        const newContent = editorInstance.getValue();

        updatedFiles[fileIndex] = {
          ...updatedFiles[fileIndex],
          content: newContent
        };

        setFiles(updatedFiles);

        // Update TypeScript language service
        if (monacoRef.current && monacoRef.current.languages.typescript &&
          updatedFiles[fileIndex].language === 'typescript') {
          monacoRef.current.languages.typescript.typescriptDefaults.addExtraLib(
            newContent,
            `file:${updatedFiles[fileIndex].path}`
          );
        }

        // If this is the active file for JS output, update JS output
        if (fileId === activeFileForJs) {
          generateJsOutput(newContent, fileId);
        }
      }
    });
  };
  return (
    <div
      id={`file-card-${file.id}`}
      key={file.id}
      className={`bg-gray-800 rounded-md border border-gray-700 overflow-hidden flex flex-col mb-6 ${activeTab === 'js' && activeFileForJs === file.id ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => handleFileCardClick(file.id)}
    >
      <div className="bg-gray-700 px-3 py-2 flex justify-between items-center">
        <input
          type="text"
          value={file.path}
          onChange={(e) => updateFileName(file.id, e.target.value)}
          className="bg-transparent border-b border-transparent hover:border-gray-500 focus:border-blue-500 focus:outline-none px-1 py-0.5 text-sm font-medium"
          onClick={(e) => e.stopPropagation()}
        />
        {files.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteFile(file.id);
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
          height="100%"
          defaultLanguage={file.language}
          defaultValue={file.content}
          theme="vs-dark"
          onMount={(editor, monaco) => {
            handleEditorDidMount(editor, monaco, file.id);

            // 立即调整初始高度
            setTimeout(() => {
              const contentHeight = editor.getContentHeight();
              const container = editor.getContainerDomNode();
              const parent = container.parentElement;
              if (parent) {
                parent.style.height = `${Math.max(contentHeight + 10, 256)}px`;
              }

              // 强制编辑器重新布局
              editor.layout();
            }, 0);

            // 监听编辑器内容变化以调整高度
            editor.onDidChangeModelContent(() => {
              const contentHeight = editor.getContentHeight();
              const container = editor.getContainerDomNode();
              const parent = container.parentElement;
              if (parent) {
                parent.style.height = `${Math.max(contentHeight + 10, 256)}px`;
              }
            });
          }}
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
            if (activeTab === 'js' && activeFileForJs === file.id && value) {
              generateJsOutput(value, file.id);
            }
          }}
        />
      </div>
    </div>
  );
}