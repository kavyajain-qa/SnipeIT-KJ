/**
 * Test settings. The defaults point at the public Snipe-IT demo, whose credentials are shown on its
 * login page; each value can be overridden with an environment variable, e.g. to point the test at
 * another environment or pass secrets in CI.
 */
export const settings = {
  baseUrl: process.env.SNIPEIT_BASE_URL || 'https://demo.snipeitapp.com',
  username: process.env.SNIPEIT_USERNAME || 'admin',
  password: process.env.SNIPEIT_PASSWORD || 'password',

  /**
   * Username to check the asset out to. Leave unset to pick a random user; set it to rerun a
   * failure with the same user that was logged on the failing run.
   */
  assignedUsername: process.env.SNIPEIT_ASSIGNED_USERNAME || undefined,
} as const;
