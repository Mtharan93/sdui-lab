import { test, expect } from '@playwright/test';

test.describe('sdui-lab smoke flows', () => {
  test('edit JSON in Playground, observe live screen change, see error appear and clear', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/sdui-lab/i);

    const editor = page.getByLabel('Screen JSON Document');
    await expect(editor).toBeVisible();

    const validEditedDoc = JSON.stringify(
      {
        version: 2,
        screenId: 'e2e-edited',
        title: 'E2E Edited Screen',
        initialState: { user: 'Playwright' },
        root: {
          id: 'root',
          type: 'Stack',
          props: { direction: 'column', gap: 'md' },
          children: [
            {
              id: 'heading',
              type: 'Text',
              props: { content: 'Live for {{state.user}}', variant: 'h2' },
            },
            { id: 'cta', type: 'Button', props: { label: 'Submit', variant: 'primary' } },
          ],
        },
      },
      null,
      2,
    );

    await editor.fill(validEditedDoc);
    await expect(page.getByRole('heading', { name: 'Live for Playwright' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();

    // Introduce an invalid empty label at root.children[1].props.label
    const brokenDoc = validEditedDoc.replace('"label": "Submit"', '"label": ""');
    await editor.fill(brokenDoc);

    await expect(page.getByText('root.children[1].props.label')).toBeVisible();
    await expect(page.getByLabel('Fallback for node at root.children[1]')).toBeVisible();
    // Sibling heading still renders normally
    await expect(page.getByRole('heading', { name: 'Live for Playwright' })).toBeVisible();

    // Fix the label and confirm error clears
    const fixedDoc = brokenDoc.replace('"label": ""', '"label": "Confirmed"');
    await editor.fill(fixedDoc);

    await expect(page.getByText(/Valid v2 screen document/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirmed' })).toBeVisible();
  });

  test('switch between legacy v1 migration and break-on-purpose isolation examples', async ({
    page,
  }) => {
    await page.goto('/');

    const select = page.getByLabel('Example Screen');
    await select.selectOption('legacy-v1');

    await expect(page.getByText(/automatically migrated to v2/i)).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Hello from Schema v1, Legacy Client/i }),
    ).toBeVisible();

    await select.selectOption('break-on-purpose');
    await expect(page.getByText(/Top section: Healthy siblings still work/i)).toBeVisible();

    await page.getByRole('button', { name: 'Test surviving button' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Isolation works');
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
  });

  test('navigate to Trade-offs tab and run the 50-update browser benchmark', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Trade-offs' }).click();
    await expect(
      page.getByRole('heading', { name: /What does the abstraction cost\?/i }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hand-Written React' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'SDUI Runtime' })).toBeVisible();

    await page.getByRole('button', { name: /Run 50-update browser benchmark/i }).click();
    await expect(page.getByText(/Browser flushSync \(50 updates\):/i)).toBeVisible();
  });
});
