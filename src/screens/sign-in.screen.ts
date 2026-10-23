import { test } from '@playwright/test';
import { ScreenBase } from './screen-base';
import { SignInFailedError } from './sign-in-failed-error';

/** The login screen (/login). */
export class SignInScreen extends ScreenBase {
  static readonly path = '/login';

  private readonly usernameInput = this.page.locator('#username');
  private readonly passwordInput = this.page.locator("input[name='password']");
  private readonly signInButton = this.page.locator('#submit');
  private readonly errorAlert = this.page.locator('.alert-danger');

  /** The signed-in user's menu in the top nav; only present once signed in. */
  readonly userMenu = this.page.locator('li.user.user-menu');

  /**
   * Signs in, throwing SignInFailedError with the site's message if it doesn't work.
   *
   * Signing in is the only step that's retried: the shared demo is sometimes slow to log in, or is
   * in the middle of a reset, so a failed attempt gets one more try with fresh cookies. Any failure
   * after signing in is reported straight away, so a retry can never hide a real problem.
   */
  async signIn(username: string, password: string, maxAttempts = 2): Promise<void> {
    for (let attempt = 1; ; attempt++) {
      try {
        await this.submitCredentials(username, password);
        return;
      } catch (error) {
        if (!(error instanceof SignInFailedError) || attempt >= maxAttempts) {
          throw error;
        }

        await test.step(`Sign-in attempt ${attempt} failed (${error.message}); trying again`, async () => {
          await this.page.context().clearCookies();
        });
      }
    }
  }

  /** Submits the form and waits for the outcome: signed in, or the site's error shown. */
  private async submitCredentials(username: string, password: string): Promise<void> {
    try {
      await this.navigateTo(SignInScreen.path);
      await this.usernameInput.fill(username);
      await this.passwordInput.fill(password);
      await this.signInButton.click();

      // Wait for whichever comes first, so bad credentials fail fast with the site's
      // own message rather than a navigation timeout.
      await this.userMenu.or(this.errorAlert).first().waitFor();
    } catch (error) {
      // A timeout, or the site not answering at all (e.g. mid-reset).
      throw new SignInFailedError(`Sign-in as '${username}' didn't complete: ${firstLine((error as Error).message)}`, {
        cause: error,
      });
    }

    if (await this.errorAlert.isVisible()) {
      const message = (await this.errorAlert.innerText()).trim();
      throw new SignInFailedError(`Sign-in as '${username}' was rejected: ${message}`);
    }
  }
}

function firstLine(text: string): string {
  return text.split('\n')[0];
}
