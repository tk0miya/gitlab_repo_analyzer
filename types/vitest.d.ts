// Vitest global types
import type { TestAPI, ExpectStatic, MockAPI } from 'vitest';

declare global {
  const describe: TestAPI['describe'];
  const it: TestAPI['it'];
  const test: TestAPI['test'];
  const expect: ExpectStatic;
  const vi: MockAPI;
  const beforeEach: TestAPI['beforeEach'];
  const afterEach: TestAPI['afterEach'];
  const beforeAll: TestAPI['beforeAll'];
  const afterAll: TestAPI['afterAll'];
}

export {};