import React from 'react';
import { expect, test } from '@playwright/experimental-ct-react';
import { TestUseCompile } from './cases/TestUseCompile';

test('useCompile should work - 0', async ({ mount }) => {
  const c = await mount(
    <TestUseCompile
      files={{
        '/index.ts': 'const a: number = 42',
      }}
    />
  );
  await expect(c).toHaveText('CONTAIN_JS_OUTPUT');
  await c.unmount();
});

test('useCompile should work - 1', async ({ mount }) => {
  const c2 = await mount(
    <TestUseCompile
      files={{
        '/index.ts': 'const a: string = 42',
      }}
    />
  );
  await expect(c2).toHaveText('CONTAIN_ERRORS');
});
