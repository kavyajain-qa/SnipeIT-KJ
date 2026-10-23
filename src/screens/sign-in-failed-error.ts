/**
 * Signing in didn't work: the site rejected it, or it didn't finish in time (the shared demo is
 * sometimes slow, or mid-reset). It's the only failure that is retried; see SignInScreen.signIn.
 */
export class SignInFailedError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'SignInFailedError';
  }
}
