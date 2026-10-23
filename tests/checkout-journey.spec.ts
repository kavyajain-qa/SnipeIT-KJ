import { settings } from '../src/config/settings';
import { HardwareCreateScreen } from '../src/screens/hardware-create.screen';
import { HardwareListScreen } from '../src/screens/hardware-list.screen';
import { HardwareViewScreen } from '../src/screens/hardware-view.screen';
import { SignInScreen } from '../src/screens/sign-in.screen';
import { macbookPro13ReadyToDeploy } from '../src/test-data/hardware-seed';
import { expect, note, test } from './fixtures';

// Snipe-IT shows history actions in lower case, e.g. "create new" and "checkout".
// Anchored so they match the whole Action cell, not text inside another column.
const CREATE_NEW_ACTION = /^\s*create new\s*$/i;
const CHECKOUT_ACTION = /^\s*checkout\s*$/i;

test.describe('Hardware checkout journey', () => {
  test('checked-out asset shows in list, details and history', async ({ page, hardwareCleanup }, testInfo) => {
    const newAsset = macbookPro13ReadyToDeploy();
    hardwareCleanup.deleteAfterTest(newAsset.assetTag);

    const signInScreen = new SignInScreen(page);
    await test.step(`1. Sign in to the Snipe-IT demo as ${settings.username}`, async () => {
      await signInScreen.signIn(settings.username, settings.password);
      await expect(signInScreen.userMenu).toBeVisible();
    });

    const createScreen = new HardwareCreateScreen(page);
    const assignedTo = settings.assignedUsername ? `'${settings.assignedUsername}'` : 'a random user';
    const { assignee } = await test.step(`2. Create asset ${newAsset.assetTag} and check it out to ${assignedTo}`, async () => {
      const created = await createScreen.createCheckedOutToUser(newAsset, settings.assignedUsername);
      await expect(createScreen.successAlert).toContainText(newAsset.assetTag);
      return created;
    });
    note(
      testInfo,
      'assignee',
      `${assignee.displayName} (username: ${assignee.username}, id: ${assignee.id}). ` +
        `To rerun with this user, set SNIPEIT_ASSIGNED_USERNAME=${assignee.username}`,
    );

    const listScreen = new HardwareListScreen(page);
    await test.step('3. Find the new asset in the asset list', async () => {
      await listScreen.goto();
      await listScreen.searchByTag(newAsset.assetTag);

      const assetRow = listScreen.rowForTag(newAsset.assetTag);
      await expect(assetRow).toHaveCount(1);
      await expect(assetRow).toContainText(newAsset.serial);
      await expect(assetRow).toContainText(newAsset.modelName);
      await expect(assetRow).toContainText(assignee.displayName);
    });

    const viewScreen = new HardwareViewScreen(page);
    await test.step('4. Open the asset page from the list and validate its details', async () => {
      await listScreen.openByTag(newAsset.assetTag);

      await expect(page).toHaveURL(HardwareViewScreen.urlPattern);
      await expect(viewScreen.assetTagValue).toContainText(newAsset.assetTag);
      // Each value is read from its own field, so a match elsewhere on the page (e.g. "Ready to Deploy"
      // in the sidebar menu) can't make the check pass.
      await expect(viewScreen.serialValue).toHaveText(newAsset.serial);
      await expect(viewScreen.modelValue).toHaveText(newAsset.modelName);
      // The status box reads "Ready to Deploy [Deployed] → <user>" once the asset is checked out.
      await expect(viewScreen.statusBox).toContainText(newAsset.statusLabel);
      await expect(viewScreen.deploymentBadge).toHaveText('Deployed');
      await expect(viewScreen.assignedUserLink(assignee)).toHaveText(assignee.displayName);
    });

    await test.step('5. Validate the History tab', async () => {
      await viewScreen.openHistoryTab();

      await expect(viewScreen.historyRowsWithAction(CREATE_NEW_ACTION)).toHaveCount(1);

      const checkoutHistoryRows = viewScreen.historyRowsWithAction(CHECKOUT_ACTION);
      await expect(checkoutHistoryRows).toHaveCount(1);
      await expect(checkoutHistoryRows.locator(HardwareViewScreen.userLinkSelector(assignee))).toHaveText(
        assignee.displayName,
      );
    });
  });
});
