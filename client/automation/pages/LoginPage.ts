import { type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly heading: Locator;
  // The inputs have no associated <label>, so the placeholder is the most stable handle.
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly invalidCredentialsMessage: Locator;
  readonly signedOutStatus: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Sign in' });
    this.emailInput = page.getByPlaceholder('admin@centralhospital.com');
    this.passwordInput = page.getByPlaceholder('••••••••');
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.invalidCredentialsMessage = page.getByText('Invalid credentials');
    this.signedOutStatus = page.getByRole('status').filter({ hasText: 'Signed out.' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.signInButton.click();
  }
}
