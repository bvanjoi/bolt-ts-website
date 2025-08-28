import React from 'react'
import { expect, test } from '@playwright/experimental-ct-react'
import { TestUseCompile0 } from './cases/TestUseCompile'

test('useCompile should work - 0', async ({ mount }) => {
	const c0 = await mount(
		<TestUseCompile0
			files={{
				'/index.ts': 'const a: number = 42',
			}}
		/>,
	)
	await expect(c0).toHaveText('CONTAIN_JS_OUTPUT')
	await c0.unmount()

	const c1 = await mount(
		<TestUseCompile0
			files={{
				'/index.ts': `
import { a } from "./a";
const b: number = a;
        `,
				'/a.ts': 'export const a = 42',
			}}
		/>,
	)
	await expect(c1).toHaveText('CONTAIN_JS_OUTPUT')
	await c1.unmount()
})

test('useCompile should work - 1', async ({ mount }) => {
	const c0 = await mount(
		<TestUseCompile0
			files={{
				'/index.ts': 'const a: string = 42',
			}}
		/>,
	)
	await expect(c0).toHaveText('CONTAIN_ERRORS')
})
