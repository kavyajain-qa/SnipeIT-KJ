import type { Page } from '@playwright/test';

/**
 * Common base for all screens (page objects). Screens expose intent-revealing actions and
 * locators; assertions live in the tests.
 */
export abstract class ScreenBase {
  constructor(protected readonly page: Page) {}

  /** Navigates to a path relative to the configured baseURL, e.g. "/hardware". */
  protected async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
  }
}
