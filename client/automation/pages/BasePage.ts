import { type Locator, type Page } from '@playwright/test';

/** Shared app shell (sidebar + header) available on every authenticated page. */
export abstract class BasePage {
  readonly sidebar: Locator;
  readonly humanResourcePoolNav: Locator;
  readonly logoutButton: Locator;
  readonly currentUserName: Locator;
  readonly currentUserRole: Locator;

  constructor(protected readonly page: Page) {
    this.sidebar = page.getByRole('complementary').first();
    this.humanResourcePoolNav = page.getByRole('button', { name: 'Human Resource Pool', exact: true });
    this.logoutButton = page.getByRole('button', { name: 'Log out' });
    this.currentUserName = page.getByRole('banner').getByText('Admin User', { exact: true });
    this.currentUserRole = page.getByRole('banner').getByText('ADMIN', { exact: true });
  }

  async goToHumanResourcePool(): Promise<void> {
    await this.humanResourcePoolNav.click();
  }

  /** Clicks "Log out" and accepts or dismisses the native confirm dialog. Returns the dialog text. */
  async logout({ confirm }: { confirm: boolean }): Promise<string> {
    // window.confirm blocks the click until handled, so the handler must be registered first.
    let message = '';
    this.page.once('dialog', async (dialog) => {
      message = dialog.message();
      await (confirm ? dialog.accept() : dialog.dismiss());
    });
    await this.logoutButton.click();
    return message;
  }
}
