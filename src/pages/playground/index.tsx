import { type FC, useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTranslation } from 'react-i18next';
import libFiles from './libs';
import boltts, { compile } from '/Users/zjk/w/gh/jkzing/bolt-ts/crates/wasm/pkg/bolt_ts_wasm.js';
import { EditorCard } from './EditorCard';
import { useDocumentStore, type Document } from './state/document';

interface CompilerOptions {
  target: string;
  strict: boolean;
  module?: string;
  esModuleInterop?: boolean;
  skipLibCheck?: boolean;
  forceConsistentCasingInFileNames?: boolean;
}

const PlaygroundPage: FC = () => {
  const { t } = useTranslation();

  const store = useDocumentStore();

  const [output, setOutput] = useState<string>('');
  const [jsOutput, setJsOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'output' | 'js' | 'definitions'>('output');
  const [activeFileForJs, setActiveFileForJs] = useState<string>(store.documents[0].id);
  const [compilerOptions, setCompilerOptions] = useState<CompilerOptions>({
    target: 'ES2015',
    module: 'ESNext',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
  });

  const handleNewFile = () => {
    store.newDocument(`/file${store.documents.length + 1}.ts`, '', 'typescript');
  }
  const handleFileUpdate = (document: Document, newContent: string) => {
    store.updateDocument(document, newContent);
  }
  const handleFileRename = (document: Document, newName: string) => {
    store.renameDocument(document, newName);
  }
  const handleFileDelete = (document: Document) => {
    store.deleteDocument(document);
  }

  useEffect(() => {
    boltts()
  }, []);

  // Select a file for JS output view
  const selectFileForJsOutput = (fileId: string) => {
    // setActiveFileForJs(fileId);
    // const file = files.find(f => f.id === fileId);
    // if (file) {
    //   generateJsOutput(file.content, fileId);
    // }
  };

  const runCompile = () => {
    setIsLoading(true);

    const compileFiles = Object.fromEntries(store.documents.map((f) => [f.path, f.content]))
    Object.assign(compileFiles, libFiles);
    type Output = Record<string, string> | [string, [number, number], [number, number], number][];
    const output: Output = compile('/', compileFiles);
    if (Array.isArray(output)) {
      const msg = output.map(item => {
        const filename = item[0];
        const startLine = item[1][0];
        const startColumn = item[1][1];
        const endLine = item[2][0];
        const endColumn = item[2][1];
        const code = item[3];
        return `[${filename}:${startLine}:${startColumn}]: ${code}`
      }).join('\n');
      setOutput(msg)
    } else {
      setOutput('no errors found');
      // setJsOutput("hello world")
    }
    setIsLoading(false)
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Top toolbar */}
      <div className="border-b border-gray-700 bg-gray-800 p-2 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold mr-6">{t('title')}</h1>
          <div className="flex space-x-2">
            <button
              onClick={runCompile}
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
          <button className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm cursor-pointer">
            {t('share')}
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Left side - File cards */}
        <div className="w-1/2 flex flex-col border-r border-gray-700">
          {/* Make scrolling explicitly enabled on this container */}
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden p-4"
            onWheel={(e) => {
              // Ensure the wheel event properly scrolls this container
              const container = e.currentTarget;
              const { scrollTop, scrollHeight, clientHeight } = container;

              // Check if we're at the top or bottom of scroll
              const isAtTop = scrollTop === 0;
              const isAtBottom = scrollTop + clientHeight >= scrollHeight;

              // Only prevent default if we can scroll in the direction of the wheel
              if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
                e.stopPropagation();
              }
            }}
          >
            <div className="space-y-4 pb-4">
              {store.documents.map((document) => <EditorCard
                key={document.id}
                document={document}
                active={activeTab === 'js' && activeFileForJs === document.id}
                onCardClick={() => {}}
                onFileRename={handleFileRename}
                onFileDelete={handleFileDelete}
                onFileUpdate={handleFileUpdate}
              />)}
              {/* 新增卡片按钮 */}
              <div
                className="bg-gray-800 border border-dashed border-gray-600 rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-750 hover:border-gray-500 transition-colors h-40"
                onClick={handleNewFile}
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
                    <span className="font-medium">{store.documents.find(f => f.id === activeFileForJs)?.path || 'Unknown file'}</span>
                    {store.documents.length > 1 && (
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