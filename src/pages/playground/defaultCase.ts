export interface FileData {
  id: string;
  path: string;
  content: string;
  language: 'typescript' | 'json';
}

export const defaultFiles: FileData[] = [
  newFile("/index.ts", require('./example.txt'), "typescript"),
  newFile("/tsconfig.json", `{
  "compilerOptions": {
    "strict": true
  },
  "include": ["./index.ts"],
  "exclude": ["node_modules"]
}`, "json"),
]

export function newFile(path: string, content: string, language: 'typescript' | 'json'): FileData {
  return {
    id: path,
    path,
    content,
    language
  }
}