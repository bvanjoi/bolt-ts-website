import React from 'react';
import {
  useCompile,
  type CompileOutput,
} from '../../src/pages/playground/useCompile';

interface Props {
  files: Record<string, string>;
}
export function TestUseCompile({ files }: Props) {
  const output = useCompile({
    files,
    cwd: '/',
  });

  if (Array.isArray(output)) {
    return <div>CONTAIN_ERRORS</div>;
  }
  if (output instanceof Map) {
    return <div>CONTAIN_JS_OUTPUT</div>;
  }
  return <div>unreachable</div>;
}
