import type { Locator, Page } from '@playwright/test';
import { exactText } from '../support/regex';

/**
 * Drives a Select2 widget. Snipe-IT hides the native <select> and renders Select2 markup instead,
 * so we use it like a real user would: open the widget, optionally type to search, then click an
 * option. That way the page's own change handlers run (e.g. choosing a deployable status is what
 * reveals the "Checkout to" options).
 */
export class Select2Picker {
  /**
   * @param page The page that owns the widget.
   * @param selectId The id of the underlying native <select> element.
   */
  constructor(
    private readonly page: Page,
    private readonly selectId: string,
  ) {}

  /** The visible "selected value" area of the widget. */
  get selectedValue(): Locator {
    return this.page.locator(`#select2-${this.selectId}-container`);
  }

  private get openDropdown(): Locator {
    return this.page.locator('.select2-container--open .select2-dropdown');
  }

  private get searchField(): Locator {
    return this.openDropdown.locator('input.select2-search__field');
  }

  /** Real, clickable results (excludes "Searching…", "No results" and disabled entries). */
  private get selectableOptions(): Locator {
    return this.openDropdown.locator(
      'li.select2-results__option' +
        ':not(.loading-results)' +
        ':not(.select2-results__message)' +
        ":not([aria-disabled='true'])",
    );
  }

  /** Selects the option whose text matches exactly (for static lists such as status labels). */
  async select(optionText: string): Promise<void> {
    await this.open();
    await this.selectableOptions.filter({ hasText: exactText(optionText) }).first().click();
    await this.waitUntilClosed();
  }

  /**
   * Types into the search box (for AJAX-backed lists such as models and users) and selects the
   * first option containing `optionText`.
   * @returns The full text of the option that was selected.
   */
  async searchAndSelect(searchText: string, optionText: string): Promise<string> {
    await this.open();
    await this.searchField.fill(searchText);

    const option = this.selectableOptions.filter({ hasText: optionText }).first();
    await option.waitFor();
    const selectedText = (await option.innerText()).trim();

    await option.click();
    await this.waitUntilClosed();
    return selectedText;
  }

  /**
   * Selects a random option from the first page of results.
   * @returns The full text of the option that was selected.
   */
  async selectRandom(): Promise<string> {
    await this.open();
    await this.selectableOptions.first().waitFor();

    const count = await this.selectableOptions.count();
    const option = this.selectableOptions.nth(Math.floor(Math.random() * count));
    const selectedText = (await option.innerText()).trim();

    await option.click();
    await this.waitUntilClosed();
    return selectedText;
  }

  /** The value (e.g. database id) of the selected option on the underlying native <select>. */
  selectedOptionValue(): Promise<string> {
    return this.page.locator(`select#${this.selectId}`).inputValue();
  }

  private async open(): Promise<void> {
    await this.selectedValue.click();
    await this.openDropdown.waitFor();
  }

  private async waitUntilClosed(): Promise<void> {
    await this.openDropdown.waitFor({ state: 'detached' });
  }
}
