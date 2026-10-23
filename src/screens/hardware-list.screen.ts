import type { Locator } from '@playwright/test';
import { HardwareViewScreen } from './hardware-view.screen';
import { ScreenBase } from './screen-base';

/** Hardware > List All (/hardware). */
export class HardwareListScreen extends ScreenBase {
  static readonly path = '/hardware';

  private readonly assetTable = this.page.locator('#assetsListingTable');
  private readonly searchInput = this.page.locator('.bootstrap-table .search input').first();

  async goto(): Promise<void> {
    await this.navigateTo(HardwareListScreen.path);
  }

  /** The table row(s) that mention the given asset tag. */
  rowForTag(assetTag: string): Locator {
    return this.assetTable.locator('tbody tr').filter({ hasText: assetTag });
  }

  /** Searches the list and waits for the asset's row to be rendered. */
  async searchByTag(assetTag: string): Promise<void> {
    await this.assetTable.waitFor();
    await this.searchInput.fill(assetTag);
    await this.searchInput.press('Enter');
    await this.rowForTag(assetTag).first().waitFor();
  }

  /** Clicks the asset tag link in the list to open the asset page. */
  async openByTag(assetTag: string): Promise<void> {
    await this.rowForTag(assetTag).getByRole('link', { name: assetTag, exact: true }).first().click();
    await this.page.waitForURL(HardwareViewScreen.urlPattern);
  }
}
