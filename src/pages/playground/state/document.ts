import { create } from 'zustand';

export interface DocumentStore {
  documents: Document[];
  newDocument: (path: string, content?: string, language?: 'typescript' | 'json') => Document;
  setDocuments: (documents: Document[]) => void;
  updateDocument: (document: Document, content: string) => void;
  deleteDocument: (document: Document) => void;
  renameDocument: (document: Document, path: string) => void;
}

export interface Document {
  id: string;
  path: string;
  content: string;
  language: 'typescript' | 'json';
}

const d = (path: string, content: string, language: 'typescript' | 'json'): Document => ({
  id: path,
  path,
  content,
  language
});

export const defaultDocuments: Document[] = [
  d("/index.ts", require('./index.ts.txt'), "typescript"),
  d("/tsconfig.json", `{
  "compilerOptions": {
    "strict": true
  },
  "include": ["./index.ts"],
  "exclude": ["node_modules"]
}`, "json"),
];

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: defaultDocuments,
  newDocument: (path: string, content = '', language = 'typescript'): Document => {
    const id = path;
    const document = d(id, content, language);
    set({ documents: [...get().documents, document] });
    return document;
  },
  updateDocument: (document: Document, content: string) => {
    const documents = get().documents.map(d => d.id === document.id ? { ...d, content } : d);
    set({ documents });
  },
  deleteDocument: (document: Document) => {
    const documents = get().documents.filter(d => d.id !== document.id);
    set({ documents });
  },
  renameDocument: (document: Document, path: string) => {
    const documents = get().documents.map(d => d.id === document.id ? { ...d, path } : d);
    set({ documents });
  },
  setDocuments: (documents) => set({ documents }),
}));
