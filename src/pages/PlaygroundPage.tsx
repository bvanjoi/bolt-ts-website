import React, { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from "@monaco-editor/react";
import type { editor } from 'monaco-editor';
import { useTranslation } from 'react-i18next';
import boltts, { compile } from '/Users/bytedance/bolt-ts/crates/wasm/pkg/bolt_ts_wasm.js';

interface CompilerOptions {
  target: string;
  strict: boolean;
  module?: string;
  esModuleInterop?: boolean;
  skipLibCheck?: boolean;
  forceConsistentCasingInFileNames?: boolean;
}

interface FileData {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
}

const initialFiles: FileData[] = [
  {
    id: 'file1',
    name: "index.ts",
    path: "/index.ts",
    language: "typescript",
    content: `function greeting(name: string): string {
  return \`Hello, \${name}!\`;
}
greeting(42);
`
  },
  {
    id: 'file2',
    name: "tsconfig.json",
    path: "/tsconfig.json",
    language: "json",
    content: `{
  "compilerOptions": {
    "strict": true
  },
  "include": ["./index.ts"],
  "exclude": ["node_modules"]
}`
  }
];

const PlaygroundPage: React.FC = () => {
  const { t } = useTranslation();

  const [files, setFiles] = useState<FileData[]>(initialFiles);
  const [output, setOutput] = useState<string>('');
  const [jsOutput, setJsOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'output' | 'js' | 'definitions'>('output');
  const [activeFileForJs, setActiveFileForJs] = useState<string>(initialFiles[0].id);
  const [compilerOptions, setCompilerOptions] = useState<CompilerOptions>({
    target: 'ES2015',
    module: 'ESNext',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
  });

  // Map to store editor references by file id
  const editorsRef = useRef<Map<string, editor.IStandaloneCodeEditor>>(new Map());
  const monacoRef = useRef<any>(null);

  useEffect(() => {
    boltts()
  }, [])

  // Update all models in Monaco when files change
  useEffect(() => {
    if (monacoRef.current) {
      const monaco = monacoRef.current;

      // For each file, make sure it has a model
      files.forEach(file => {
        const uri = monaco.Uri.parse(`file:${file.path}`);
        let model = monaco.editor.getModel(uri);

        if (!model) {
          // Create model if it doesn't exist
          model = monaco.editor.createModel(file.content, file.language, uri);
        } else {
          // Update existing model if content doesn't match
          if (model.getValue() !== file.content) {
            model.setValue(file.content);
          }
        }
      });

      // Let TypeScript know about our files
      if (monaco.languages.typescript) {
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
  }, [files]);

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

  // Generate JS output for a specific file
  const generateJsOutput = (content: string, fileId: string) => {
    if (!monacoRef.current) return;

    const monaco = monacoRef.current;
    const file = files.find(f => f.id === fileId);

    if (file && file.language === 'typescript') {
      try {
        const worker = monaco.languages.typescript.getTypeScriptWorker();
        worker().then((client: any) => {
          const uri = monaco.Uri.parse(`file:${file.path}`);
          client.getEmitOutput(uri.toString()).then((result: any) => {
            if (result.outputFiles && result.outputFiles.length > 0) {
              setJsOutput(result.outputFiles[0].text);
            } else {
              // Fallback to a simple transformation if compilation fails
              setJsOutput(`// Transpiled from ${file.name}\n${content
                .replace(/export\s+interface\s+([a-zA-Z0-9_]+)\s*\{[^}]*\}/g, '// Interface removed')
                .replace(/:\s*[a-zA-Z0-9_<>|&]+/g, '')
                .replace(/export\s+/g, '')}`);
            }
          });
        });
      } catch (error) {
        console.error("Error generating JS:", error);
        setJsOutput(`// Error generating JS output for ${file.name}`);
      }
    }
  };

  // Add a new file
  const addNewFile = () => {
    const newId = `file${Date.now()}`;
    const newFile: FileData = {
      id: newId,
      name: `file${files.length + 1}.ts`,
      path: `/file${files.length + 1}.ts`,
      language: "typescript",
      content: "// Add your code here"
    };

    setFiles([...files, newFile]);
  };

  // Delete a file
  const deleteFile = (fileId: string) => {
    if (files.length <= 1) return; // Don't allow deleting the last file

    // Remove the editor reference
    editorsRef.current.delete(fileId);

    // If this was the active file for JS output, reset to first file
    if (fileId === activeFileForJs && files.length > 1) {
      const remainingFiles = files.filter(f => f.id !== fileId);
      setActiveFileForJs(remainingFiles[0].id);
    }

    // Update files state
    setFiles(files.filter(file => file.id !== fileId));
  };

  // Update file name
  const updateFileName = (fileId: string, newName: string) => {
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
      const updatedFiles = [...files];

      // If name is empty, keep the old name
      if (!newName.trim()) return;

      // Add extension if not present
      let fileExtension = '';
      if (!newName.includes('.')) {
        // Get appropriate extension based on language
        fileExtension = updatedFiles[fileIndex].language === 'json' ? '.json' : '.ts';
        newName = `${newName}${fileExtension}`;
      }

      // Update path based on new name
      const newPath = `/${newName}`;

      const oldPath = updatedFiles[fileIndex].path;

      updatedFiles[fileIndex] = {
        ...updatedFiles[fileIndex],
        name: newName,
        path: newPath
      };

      // Update the model URI in Monaco
      if (monacoRef.current) {
        const monaco = monacoRef.current;
        const oldUri = monaco.Uri.parse(`file:${oldPath}`);
        const oldModel = monaco.editor.getModel(oldUri);

        if (oldModel) {
          const content = oldModel.getValue();

          // Dispose old model
          oldModel.dispose();

          // Create new model with new URI
          const newUri = monaco.Uri.parse(`file:${newPath}`);
          monaco.editor.createModel(content, updatedFiles[fileIndex].language, newUri);

          // Update editor if it exists
          const editor = editorsRef.current.get(fileId);
          if (editor) {
            editor.setModel(monaco.editor.getModel(newUri));
          }

          // Update TypeScript service
          if (updatedFiles[fileIndex].language === 'typescript') {
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
              content,
              `file:${newPath}`
            );
          }
        }
      }

      setFiles(updatedFiles);
    }
  };

  // Select a file for JS output view
  const selectFileForJsOutput = (fileId: string) => {
    setActiveFileForJs(fileId);
    const file = files.find(f => f.id === fileId);
    if (file) {
      generateJsOutput(file.content, fileId);
    }
  };

  const runCode = () => {
    setIsLoading(true);

    let files = Object.fromEntries(initialFiles.map((f) => [f.path, f.content]))
    files['/lib.es5.d.ts'] = require('./es5.txt');
    console.log(files);
    type Output = Record<string, string> | [string, [number, number], [number, number], number][];
    const output: Output = compile('/', files);
    if (Array.isArray(output)) {
      let msg = output.map(item => {
        let filename = item[0];
        let startLine = item[1][0];
        let startColumn = item[1][1];
        let endLine = item[2][0];
        let endColumn = item[2][1];
        let code = item[3];
        return `[${filename}:${startLine}:${startColumn}]: ${code}`
      }).join('\n');
      setOutput(msg)
    } else {
      setJsOutput("hello world")
    }
    setIsLoading(false)
    // try {
    //   let simulatedOutput = '';

    //   // Find index.ts file
    //   const indexFile = files.find(f => f.name === 'index.ts' || f.path === '/index.ts');
    //   const userFile = files.find(f => f.name === 'user.ts' || f.path === '/user.ts');

    //   if (indexFile && userFile) {
    //     // Simulate full program execution with imports
    //     simulatedOutput = `> Running TypeScript program with multiple files...\n`;
    //     simulatedOutput += `> Compiling ${files.length} TypeScript files...\n`;
    //     simulatedOutput += `> Successfully compiled!\n\n`;
    //     simulatedOutput += `Output:\n`;
    //     simulatedOutput += `Hello, TypeScript Fan\n`;
    //     simulatedOutput += `User age: 25\n\n`;

    //     // Add a validation section showing imports worked
    //     simulatedOutput += `Module imports validated:\n`;
    //     simulatedOutput += `✓ Successfully imported User interface from './user'\n`;
    //     simulatedOutput += `✓ Successfully imported greeting function from './user'\n`;

    //     // Add complete output for all files
    //     let allJsOutput = '';
    //     files.forEach(file => {
    //       if (file.language === 'typescript') {
    //         if (file.name === 'index.ts') {
    //           allJsOutput += `// ----- Compiled ${file.name} -----\n`;
    //           allJsOutput += `import { greeting, User } from './user';\n\n`;
    //           allJsOutput += `const user = { \n`;
    //           allJsOutput += `  name: "TypeScript Fan", \n`;
    //           allJsOutput += `  age: 25 \n`;
    //           allJsOutput += `};\n\n`;
    //           allJsOutput += `console.log(greeting(user.name));\n`;
    //           allJsOutput += `console.log(\`User age: \${user.age}\`);\n\n`;
    //         } else if (file.name === 'user.ts') {
    //           allJsOutput += `// ----- Compiled ${file.name} -----\n`;
    //           allJsOutput += `export function greeting(name) {\n`;
    //           allJsOutput += `  return \`Hello, \${name}!\`;\n`;
    //           allJsOutput += `}\n\n`;
    //           allJsOutput += `export function displayUser(user) {\n`;
    //           allJsOutput += `  return \`Name: \${user.name}, Age: \${user.age}\`;\n`;
    //           allJsOutput += `}\n\n`;
    //         }
    //       }
    //     });

    //     setJsOutput(allJsOutput);
    //   } else {
    //     // Simple fallback for non-standard file structure
    //     simulatedOutput = `> Running TypeScript files...\n`;
    //     simulatedOutput += `> Compiling ${files.length} files...\n\n`;

    //     // Output something from each file
    //     files.forEach(file => {
    //       if (file.language === 'typescript') {
    //         simulatedOutput += `File: ${file.name}\n`;
    //         simulatedOutput += `Content sample: ${file.content.split('\n')[0]}\n\n`;
    //       }
    //     });

    //     simulatedOutput += `Program executed successfully.`;
    //   }

    //   setOutput(simulatedOutput);
    //   setActiveTab('output');
    //   setIsLoading(false);
    // } catch (error) {
    //   setOutput(`Execution error: ${error}`);
    //   setIsLoading(false);
    // }
  };

  // File card click handler - to show JS for a specific file
  const handleFileCardClick = (fileId: string) => {
    if (activeTab === 'js') {
      selectFileForJsOutput(fileId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Top toolbar */}
      <div className="border-b border-gray-700 bg-gray-800 p-2 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold mr-6">{t('title')}</h1>
          <div className="flex space-x-2">
            <button
              onClick={runCode}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm flex items-center cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('running')}
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('run')}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={addNewFile}
            className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-sm cursor-pointer flex items-center"
          >
            <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add File
          </button>

          <button className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm cursor-pointer">
            {t('share')}
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Left side - File cards */}
        <div className="w-1/2 flex flex-col border-r border-gray-700">
          {/* 创建一个固定的滚动容器 */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
            <div className="space-y-4 pb-4">
              {files.map((file) => (
                <div
                  id={`file-card-${file.id}`}
                  key={file.id}
                  className={`bg-gray-800 rounded-md border border-gray-700 overflow-hidden flex flex-col mb-6 ${activeTab === 'js' && activeFileForJs === file.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => handleFileCardClick(file.id)}
                >
                  <div className="bg-gray-700 px-3 py-2 flex justify-between items-center">
                    <input
                      type="text"
                      value={file.name}
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
                        className="text-gray-400 hover:text-red-500"
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
                    overflow: "hidden"
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
                        }, 100);

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
                      }}
                      onChange={(value) => {
                        if (activeTab === 'js' && activeFileForJs === file.id && value) {
                          generateJsOutput(value, file.id);
                        }
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* 新增卡片按钮 */}
              <div
                className="bg-gray-800 border border-dashed border-gray-600 rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-750 hover:border-gray-500 transition-colors h-40"
                onClick={addNewFile}
              >
                <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="mt-2 text-gray-400">Add new file</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Output */}
        <div className="w-1/2 flex flex-col">
          <div className="bg-gray-800 flex">
            {(['output', 'js', 'definitions'] as const).map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 text-sm font-medium cursor-pointer ${activeTab === tab ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                onClick={() => setActiveTab(tab)}
              >
                {t(tab)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto bg-gray-900 p-0">
            {activeTab === 'output' && (
              <div className="h-full">
                {output ? (
                  <div className="p-4 font-mono text-sm whitespace-pre bg-[#1e1e1e]">
                    {output}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    <p>{t('runToSeeResults')}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'js' && (
              <div className="h-full">
                {activeFileForJs && (
                  <div className="bg-gray-800 px-3 py-1 border-b border-gray-700 text-xs">
                    <span>JavaScript output for: </span>
                    <span className="font-medium">{files.find(f => f.id === activeFileForJs)?.name || 'Unknown file'}</span>
                    {files.length > 1 && (
                      <span className="ml-2 text-gray-400">(Click a file card to view its JavaScript output)</span>
                    )}
                  </div>
                )}
                <SyntaxHighlighter
                  language="javascript"
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, height: 'calc(100% - 30px)', fontSize: '14px' }}
                  showLineNumbers
                >
                  {jsOutput || t('jsWillAppearHere')}
                </SyntaxHighlighter>
              </div>
            )}

            {activeTab === 'definitions' && (
              <div className="p-4 font-mono text-sm h-full bg-[#1e1e1e]">
                <p className="text-gray-400">{t('definitionsWillAppearHere')}</p>
                <pre className="text-gray-300 mt-2">
                  {`interface User {
    name: string;
    age: number;
}

function greeting(name: string): string;
function displayUser(user: User): string;`}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaygroundPage; 