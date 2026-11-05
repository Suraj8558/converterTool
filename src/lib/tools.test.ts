import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toolCategories } from './tools';

const tools = toolCategories.flatMap((category) => category.tools);

describe('tool registry', () => {
  it.each(tools.map((tool) => [tool.name, tool.href]))('%s links to a real page', (_, href) => {
    expect(existsSync(join(process.cwd(), 'src/app', href, 'page.tsx'))).toBe(true);
  });

  it('has no duplicate names or links', () => {
    expect(new Set(tools.map((tool) => tool.href)).size).toBe(tools.length);
    expect(new Set(tools.map((tool) => tool.name)).size).toBe(tools.length);
  });
});
