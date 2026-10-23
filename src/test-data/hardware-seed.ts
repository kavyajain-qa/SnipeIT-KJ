import type { HardwareDraft } from '../models/hardware';

export const MACBOOK_PRO_13_MODEL = 'Macbook Pro 13"';
export const READY_TO_DEPLOY_STATUS = 'Ready to Deploy';

/** A Macbook Pro 13" that is Ready to Deploy, with a tag and serial unique to this run, so runs never collide on the shared demo. */
export function macbookPro13ReadyToDeploy(): HardwareDraft {
  const uniqueId = `${utcTimestamp()}-${1000 + Math.floor(Math.random() * 9000)}`;

  return {
    assetTag: `QA-${uniqueId}`,
    serial: `SN-${uniqueId}`,
    modelName: MACBOOK_PRO_13_MODEL,
    // The picker's search doesn't cope well with the trailing inch mark, so search without it.
    modelSearchText: 'Macbook Pro 13',
    statusLabel: READY_TO_DEPLOY_STATUS,
  };
}

/** e.g. 20261023031500 */
function utcTimestamp(): string {
  return new Date().toISOString().replace(/\D/g, '').slice(0, 14);
}
