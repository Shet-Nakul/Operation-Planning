// spec: specs/Rostering.md (Common Setup – sign in)
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures/test-fixtures';
import { credentials } from '../test-data/rostering';

test.describe('Authentication', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await expect(loginPage.heading).toBeVisible();
  });

  test('Sign in button is enabled only when both fields are filled', async ({ loginPage }) => {
    await expect(loginPage.signInButton).toBeDisabled();

    await loginPage.emailInput.fill(credentials.admin.email);
    await expect(loginPage.signInButton).toBeDisabled();

    await loginPage.passwordInput.fill(credentials.admin.password);
    await expect(loginPage.signInButton).toBeEnabled();
  });

  test('Sign in with valid credentials and open the Human Resource Pool', async ({ loginPage, poolDirectoryPage }) => {
    await loginPage.login(credentials.admin.email, credentials.admin.password);

    await expect(poolDirectoryPage.currentUserName).toBeVisible();
    await expect(poolDirectoryPage.currentUserRole).toBeVisible();

    await poolDirectoryPage.goToHumanResourcePool();
    await expect(poolDirectoryPage.heading).toBeVisible();
  });

  test('Sign in with an invalid password is rejected', async ({ loginPage, poolDirectoryPage }) => {
    await loginPage.login(credentials.admin.email, 'wrong-password');

    await expect(loginPage.invalidCredentialsMessage).toBeVisible();
    await expect(loginPage.heading).toBeVisible();
    await expect(poolDirectoryPage.humanResourcePoolNav).toBeHidden();
  });

  test('Log out after confirming returns to the Sign in page', async ({ loginPage, poolDirectoryPage }) => {
    await loginPage.login(credentials.admin.email, credentials.admin.password);
    await expect(poolDirectoryPage.logoutButton).toBeVisible();

    const message = await poolDirectoryPage.logout({ confirm: true });

    expect(message).toBe('Are you sure you want to log out?');
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.signedOutStatus).toBeVisible();
  });

  test('Cancelling the log out confirmation keeps the user signed in', async ({ loginPage, poolDirectoryPage }) => {
    await loginPage.login(credentials.admin.email, credentials.admin.password);
    await expect(poolDirectoryPage.logoutButton).toBeVisible();

    await poolDirectoryPage.logout({ confirm: false });

    await expect(poolDirectoryPage.logoutButton).toBeVisible();
    await expect(loginPage.heading).toBeHidden();
  });
});
