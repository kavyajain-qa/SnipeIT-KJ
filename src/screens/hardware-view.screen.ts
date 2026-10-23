import type { Locator } from '@playwright/test';
import type { Assignee } from '../models/hardware';
import { exactText } from '../support/regex';
import { ScreenBase } from './screen-base';

/** An asset's own page (/hardware/{id}), including its tabs. */
export class HardwareViewScreen extends ScreenBase {
  // No goto(): the asset id is only known at runtime, so the test
  // reaches this page by clicking through from the asset list.

  /** Matches /hardware/{numeric id}. */
  static readonly urlPattern = /\/hardware\/\d+/;

  /** Value next to the "Asset Tag" label on the Details tab. */
  readonly assetTagValue = this.detailValue('Asset Tag');

  /** The serial number in the asset's information list. */
  readonly serialValue = this.page.locator('li#serial-number code');

  /** The model name (a link to the model) in the asset's information list. */
  readonly modelValue = this.page.locator("li#model a[href*='/models/']");

  /**
   * The status box at the top of the Details tab. For a checked-out asset it reads e.g.
   * "Ready to Deploy [Deployed] → Jane Smith", with a link to that user.
   */
  readonly statusBox = this.page.locator('#details .well').first();

  /** The badge in the status box: "Deployed" once the asset is checked out. */
  readonly deploymentBadge = this.statusBox.locator('label');

  private readonly historyTabLink = this.page.locator("a[href='#history']");
  private readonly historyPane = this.page.locator('#history');

  /** Data rows of the History table (once loaded). */
  readonly historyRows = this.historyPane.locator('table tbody tr');

  /**
   * Link, in the status box, to the user the asset is checked out to.
   * Matched on the user id in the link, because display names are not unique.
   */
  assignedUserLink(assignee: Assignee): Locator {
    return this.statusBox.locator(HardwareViewScreen.userLinkSelector(assignee));
  }

  /** CSS selector for a link to the given user's page (/users/{id}). */
  static userLinkSelector(assignee: Assignee): string {
    return `a[href$='/users/${assignee.id}']`;
  }

  /**
   * History rows that have a cell matching the given action, e.g. "checkout".
   * Matched per cell rather than on the whole row: a row's text joins its cells with no
   * separator (e.g. "Admin Usercreate new"), so word boundaries across cells don't work.
   */
  historyRowsWithAction(action: RegExp): Locator {
    return this.historyRows.filter({ has: this.page.locator('td').filter({ hasText: action }) });
  }

  async openHistoryTab(): Promise<void> {
    await this.historyTabLink.click();
    await this.historyPane.waitFor();
    // The history table is loaded via AJAX after the tab opens.
    await this.historyRows.first().waitFor();
  }

  private detailValue(label: string): Locator {
    return this.page
      .locator('dt')
      .filter({ hasText: exactText(label) })
      .locator('xpath=following-sibling::dd[1]')
      .first();
  }
}
