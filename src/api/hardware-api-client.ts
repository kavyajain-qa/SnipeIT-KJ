import type { BrowserContext } from '@playwright/test';

type ApiResponse = { id?: number; status?: string; messages?: unknown; error?: string };

/**
 * Calls Snipe-IT's REST API (/api/v1/hardware) as the user signed in to the browser context, the
 * same way Snipe-IT's own pages do: the session cookie plus Laravel's XSRF token in a header.
 * So no API key is needed, and the calls have exactly that user's permissions.
 */
export class HardwareApiClient {
  constructor(private readonly context: BrowserContext) {}

  /** The id of the asset with this tag, or undefined if there is none (e.g. it was never created). */
  async findIdByTag(assetTag: string): Promise<number | undefined> {
    const json = await this.send('GET', `/api/v1/hardware/bytag/${encodeURIComponent(assetTag)}`);
    return json.id;
  }

  /** Deletes the asset. Like deleting in the UI, Snipe-IT keeps it as a deleted record an admin can restore. */
  async delete(assetId: number): Promise<void> {
    const json = await this.send('DELETE', `/api/v1/hardware/${assetId}`);
    if (json.status !== 'success') {
      throw new Error(`Deleting asset ${assetId} failed: ${JSON.stringify(json)}`);
    }
  }

  private async send(method: 'GET' | 'DELETE', path: string): Promise<ApiResponse> {
    const response = await this.context.request.fetch(path, { method, headers: await this.headers() });
    const json = (await response.json()) as ApiResponse;
    // A refused call (e.g. not signed in) comes back as {"error": "Unauthorized or unauthenticated."}.
    if (json.error) {
      throw new Error(`${method} ${path} was refused: ${json.error}`);
    }
    return json;
  }

  private async headers(): Promise<Record<string, string>> {
    const xsrfCookie = (await this.context.cookies()).find((cookie) => cookie.name === 'XSRF-TOKEN');
    if (!xsrfCookie) {
      throw new Error("No XSRF-TOKEN cookie: the browser isn't signed in to Snipe-IT.");
    }

    return {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie.value),
    };
  }
}
