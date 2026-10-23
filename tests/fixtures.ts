import { test as base, type TestInfo } from '@playwright/test';
import { HardwareApiClient } from '../src/api/hardware-api-client';

export { expect } from '@playwright/test';

/** Assets a test created, to delete once it has finished. */
export interface HardwareCleanup {
  deleteAfterTest(assetTag: string): void;
}

export const test = base.extend<{ hardwareCleanup: HardwareCleanup }>({
  /**
   * Deletes the assets a test registered, through the API, whether the test passed or failed, so
   * runs don't leave data behind. A problem here is reported as a warning rather than failing the
   * test, because the test's own checks have already passed or failed by then.
   */
  hardwareCleanup: async ({ context }, use, testInfo) => {
    const assetTags: string[] = [];
    await use({ deleteAfterTest: (assetTag) => assetTags.push(assetTag) });

    const api = new HardwareApiClient(context);
    for (const assetTag of assetTags) {
      await test.step(`Clean-up: delete asset ${assetTag} through the API`, async () => {
        await deleteQuietly(api, assetTag, testInfo);
      });
    }
  },
});

async function deleteQuietly(api: HardwareApiClient, assetTag: string, testInfo: TestInfo): Promise<void> {
  try {
    // Looked up by tag, so this also works when the test failed before reaching the asset page.
    const assetId = await api.findIdByTag(assetTag);
    if (assetId === undefined) {
      note(testInfo, 'clean-up', `Asset ${assetTag} was never created, nothing to delete`);
      return;
    }

    await api.delete(assetId);
    if ((await api.findIdByTag(assetTag)) === undefined) {
      note(testInfo, 'clean-up', `Deleted asset ${assetTag} (id ${assetId}) through the API`);
    } else {
      note(testInfo, 'clean-up warning', `Asset ${assetTag} (id ${assetId}) can still be found after deleting it`);
    }
  } catch (error) {
    note(testInfo, 'clean-up warning', `Could not delete asset ${assetTag}: ${(error as Error).message}`);
  }
}

/** Shows a message in the terminal and as an annotation in the HTML report. */
export function note(testInfo: TestInfo, type: string, description: string): void {
  testInfo.annotations.push({ type, description });
  console.log(`  ${type}: ${description}`);
}
