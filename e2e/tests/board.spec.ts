import { expect, test } from '@playwright/test';

const API_BASE = process.env.API_BASE ?? process.env.BASE_URL ?? 'http://localhost:8091';

// Reset the API to a known-empty state before each spec via the test-only endpoint.
test.beforeEach(async ({ request, page }) => {
  const res = await request.post(`${API_BASE}/api/_reset`);
  expect(res.status()).toBe(204);
  await page.goto('/');
});

test('the board starts empty', async ({ page }) => {
  await expect(page.getByText('No tasks yet. Add one above.')).toBeVisible();
  await expect(page.getByTestId('task')).toHaveCount(0);
});

test('adding a task makes it appear with a todo badge', async ({ page }) => {
  await page.getByPlaceholder('What needs doing?').fill('Buy milk');
  await page.getByRole('button', { name: 'Add task' }).click();

  const task = page.getByTestId('task');
  await expect(task).toHaveCount(1);
  await expect(task.getByTestId('task-title')).toHaveText('Buy milk');
  await expect(task.getByTestId('task-status')).toHaveText('todo');
});

test('cycling status updates the badge todo -> doing -> done -> todo', async ({ page }) => {
  await page.getByPlaceholder('What needs doing?').fill('Cycle me');
  await page.getByRole('button', { name: 'Add task' }).click();

  const badge = page.getByTestId('task').getByTestId('task-status');
  await expect(badge).toHaveText('todo');

  await badge.click();
  await expect(badge).toHaveText('doing');

  await badge.click();
  await expect(badge).toHaveText('done');

  await badge.click();
  await expect(badge).toHaveText('todo');
});

test('deleting a task removes it from the board', async ({ page }) => {
  await page.getByPlaceholder('What needs doing?').fill('Delete me');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByTestId('task')).toHaveCount(1);

  await page.getByTestId('task-delete').click();
  await expect(page.getByTestId('task')).toHaveCount(0);
  await expect(page.getByText('No tasks yet. Add one above.')).toBeVisible();
});
