import { expect, test, type Page } from '@playwright/test';

interface ToolLink {
  name: string;
  href: string;
}

/** The icon library can't load in the test runner, so the footer supplies the tool list. */
async function readToolsFromFooter(page: Page) {
  await page.goto('/');
  const categories = await page.locator('footer div:has(> ul)').evaluateAll((columns) =>
    columns.map((column) => ({
      name: column.querySelector('h3')!.textContent!,
      tools: [...column.querySelectorAll('a')].map((a) => ({
        name: a.textContent!.trim(),
        href: a.getAttribute('href')!,
      })),
    }))
  );
  return { categories, tools: categories.flatMap((category) => category.tools) as ToolLink[] };
}

test.describe('navigation', () => {
  test('header menus link to every tool', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const { categories, tools } = await readToolsFromFooter(page);
    expect(tools.length).toBeGreaterThanOrEqual(20);
    for (const category of categories) {
      await page.locator('header').getByRole('button', { name: category.name }).click();
      for (const tool of category.tools) {
        await expect(page.getByRole('menuitem', { name: tool.name, exact: true })).toHaveAttribute('href', tool.href);
      }
      await page.keyboard.press('Escape');
    }
  });

  test('a header menu item opens its tool', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.locator('header').getByRole('button', { name: 'PDF & Document Tools' }).click();
    await page.getByRole('menuitem', { name: 'PDF Merge' }).click();
    await expect(page).toHaveURL(/\/pdf-merge$/);
  });

  test('the mobile menu lists every tool and closes after choosing', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const { tools } = await readToolsFromFooter(page);
    await page.getByRole('button', { name: 'Open tools menu' }).click();
    const menu = page.getByRole('dialog');
    await expect(menu.getByRole('link')).toHaveCount(tools.length);
    await menu.getByRole('link', { name: 'MP3 to WAV' }).click();
    await expect(page).toHaveURL(/\/mp3-to-wav$/);
    await expect(menu).toBeHidden();
  });

  test('the page does not scroll sideways on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('the footer links to every tool, and each one loads', async ({ page, request }) => {
    const { tools } = await readToolsFromFooter(page);
    expect(new Set(tools.map((tool) => tool.href)).size).toBe(tools.length);
    for (const tool of tools) {
      expect((await request.get(tool.href)).status(), tool.href).toBe(200);
    }
  });

  test('the old DOC to PDF address goes to Word to PDF', async ({ page }) => {
    await page.goto('/doc-to-pdf');
    await expect(page).toHaveURL(/\/word-to-pdf$/);
  });
});

test.describe('homepage search', () => {
  test('filters tools and explains when nothing matches', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const search = page.getByRole('searchbox');
    await search.fill('heic');
    await expect(page.locator('main').getByRole('link', { name: /HEIC to JPG/ })).toBeVisible();
    await expect(page.locator('main').getByRole('link', { name: /PDF Merge/ })).toHaveCount(0);

    await search.fill('zzz');
    await expect(page.getByRole('heading', { name: 'No Tools Found' })).toBeVisible();
  });
});

test.describe('accessibility basics', () => {
  test('the upload area works from the keyboard', async ({ page }) => {
    await page.goto('/png-to-jpg');
    await page.waitForLoadState('networkidle');
    const dropzone = page.locator('main [role=button]');
    await dropzone.focus();
    const chooser = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    await chooser;
  });
});

test.describe('theme', () => {
  test('can switch to dark mode', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await page.getByRole('menuitem', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});

test.describe('contact form', () => {
  test('checks its fields before doing anything', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Continue in Email App' }).click();
    await expect(page.getByText('Name must be at least 2 characters.')).toBeVisible();
    await expect(page.getByText('Message must be at least 10 characters.')).toBeVisible();
  });

  test('never claims a message was sent', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit test builds treat mailto: as a web address.');
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Name').fill('Test Person');
    await page.getByLabel('Message').fill('A message long enough to pass.');
    await page.getByRole('button', { name: 'Continue in Email App' }).click();
    await expect(page.getByText(/not sent until you press send/).first()).toBeVisible();
    await expect(page.getByText(/Message Sent/)).toHaveCount(0);
  });
});

test.describe('search engine and sharing tags', () => {
  test('every tool has its own title, canonical link and sharing image', async ({ page }) => {
    test.setTimeout(120_000);
    const { tools } = await readToolsFromFooter(page);
    const titles = new Set<string>();
    for (const tool of tools) {
      await page.goto(tool.href);
      titles.add(await page.title());
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', `https://example.com${tool.href}`);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://example.com/og.png');
    }
    expect(titles.size).toBe(tools.length);
  });

  test('the contact page has its own title', async ({ page }) => {
    await page.goto('/contact');
    await expect(page).toHaveTitle('Contact Us - Converter Tool');
  });

  test('robots.txt and the sitemap point at the real site', async ({ page, request }) => {
    const { tools } = await readToolsFromFooter(page);
    expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://example.com/sitemap.xml');
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap.match(/<url>/g)).toHaveLength(tools.length + 4);
    for (const tool of tools) expect(sitemap).toContain(`https://example.com${tool.href}<`);
  });

  test('the sharing image exists', async ({ request }) => {
    expect((await request.get('/og.png')).status()).toBe(200);
  });
});

test('files stay in the browser: converting uploads nothing', async ({ page }) => {
  const uploads: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && !request.url().includes('google')) uploads.push(request.url());
  });
  await page.goto('/png-to-jpg');
  await page.locator('input[type=file]').setInputFiles(`${__dirname}/fixtures/logo.png`);
  await page.getByRole('button', { name: /Convert to/ }).click();
  await expect(page.getByRole('heading', { name: 'Conversion Complete!' })).toBeVisible();
  expect(uploads).toEqual([]);
});

test.describe('header menus on hover', () => {
  test('open on hover and close when the pointer leaves', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const trigger = page.locator('header').getByRole('button', { name: 'PDF & Document Tools' });
    await trigger.hover();
    const item = page.getByRole('menuitem', { name: 'PDF Merge' });
    await expect(item).toBeVisible();
    await item.hover();
    await expect(item).toBeVisible();
    await page.mouse.move(600, 600);
    await expect(item).toBeHidden();
  });
});
