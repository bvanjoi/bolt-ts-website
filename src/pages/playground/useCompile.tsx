import * as React from 'react';
import boltts, { compile } from 'bolt_ts_wasm';

interface UseCompileProps {
  files: Record<string, string>;
  cwd: string;
}

const DEFAULT_LIB_DIR = '/node_modules/typescript/lib';

type JsOutput = Map<string, string>;
type CompileError = [string, [number, number], [number, number], string];
type CompileErrors = CompileError[];
export type CompileOutput = JsOutput | CompileErrors;

export function errorOutputFromCompileError(error: CompileError): string {
  const [filename, [startLine, startColumn], [endLine, endColumn], code] =
    error;
  return `[${filename}:${startLine}:${startColumn}]: ${code}`;
}

export function useCompile(props: UseCompileProps): CompileOutput | undefined {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [output, setOutput] = React.useState<CompileOutput | undefined>(
    undefined
  );

  React.useEffect(() => {
    boltts().then(() => {
      setIsInitialized(true);
    });
  }, []);

  React.useEffect(() => {
    if (!isInitialized) return;
    const output = compile(props.cwd, DEFAULT_LIB_DIR, props.files);
    setOutput(output);
  }, [props.files, props.cwd, isInitialized]);

  return output;
}
