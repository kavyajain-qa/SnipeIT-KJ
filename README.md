# Snipe-IT UI Automation (TypeScript + Playwright)

End-to-end UI test for the [Snipe-IT demo](https://demo.snipeitapp.com) written in TypeScript with [Playwright Test](https://playwright.dev).

## The assignment

> 1. Login to the snipeit demo at https://demo.snipeitapp.com/login
> 2. Create a new Macbook Pro 13" asset with the ready to deploy status and checked out to a random user
> 3. Find the asset you just created in the assets list to verify it was created successfully
> 4. Navigate to the asset page from the list and validate relevant details from the asset creation
> 5. Validate the details in the "History" tab on the asset page

All five steps are one test, `tests/checkout-journey.spec.ts`, with one `test.step` per assignment step:

| Step | How the test does it | What it checks |
|---|---|---|
| 1. Log in | `SignInScreen.signIn` as `admin` | The user menu appears (a failed sign-in fails fast with the site's own error message) |
| 2. Create the asset | `HardwareCreateScreen.createCheckedOutToUser`: model **Macbook Pro 13"**, status **Ready to Deploy**, checked out to a **random user** from the user picker. The tag and serial are unique per run (e.g. `QA-20261023031500-4821`), so runs never clash on the shared demo. | The success message names the new asset tag |
| 3. Find it in the assets list | `HardwareListScreen.searchByTag` searches for the tag | Exactly one row, showing the serial, model and assigned user |
| 4. Open the asset page from the list | `HardwareListScreen.openByTag` clicks the tag link | Each value read from its own field: asset tag, serial and model; the status box shows "Ready to Deploy", a "Deployed" badge and a link to the assigned user |
| 5. Validate the History tab | `HardwareViewScreen.openHistoryTab` | One "create new" entry, and one "checkout" entry linked to the assigned user |

The random user is captured when it's picked (name, username and user id) and used in every later check. Users are matched by id, because display names are not unique.

Afterwards, the test **deletes the asset it created** through Snipe-IT's API, whether it passed or failed (see [Clean-up](#clean-up)).

## Running the test

Prerequisites: [Node.js](https://nodejs.org) 20 or later (check with `node --version`) and an internet connection.

Unzip the folder, open a terminal in it, and run:

```bash
npm ci
npm test
```

`npm ci` installs the exact package versions from `package-lock.json`. `npm test` downloads Chromium on the first run (takes a minute; later runs skip it), then runs the test headless in about 30 seconds, printing each step as it goes.

```bash
npm run test:headed   # watch the browser while the test runs
npm run report        # open the HTML report of the last run
npm run typecheck     # type-check the code with the TypeScript compiler
```

The test runs in Chromium only. It was the fastest and most stable browser against the demo, and Playwright pins its version, so every run uses the same browser build.

> **Linux only:** if Chromium fails to start because of missing system libraries, install them once with
> `npx playwright install-deps chromium` (needs sudo).

## Tech stack

| | Version |
|---|---|
| Node.js | 20 or later |
| @playwright/test | 1.64.0 |
| TypeScript | 6.0.3 (type checking; Playwright compiles the tests itself) |
| Browser | Chromium |

Versions are pinned exactly in `package.json`, so every machine gets the same ones.

## Configuration

The defaults in `src/config/settings.ts` point at the public demo, whose credentials are shown on its login page. Any value can be overridden with an environment variable, which is how you would point the test at another environment or pass secrets in CI:

```bash
export SNIPEIT_BASE_URL=https://my-snipeit.example.com
export SNIPEIT_USERNAME=qa.user
export SNIPEIT_PASSWORD=********
```

The asset is checked out to a random user by default. The output logs who was picked; to rerun a failure with the same user, set `SNIPEIT_ASSIGNED_USERNAME` to that username (PowerShell: `$env:SNIPEIT_ASSIGNED_USERNAME="jsmith"`).

## Test report and debugging

Every run writes Playwright's HTML report to `playwright-report/` (`npm run report` opens it). It shows each assignment step with its duration, the user that was picked, and the clean-up result. For a failed test it also has a **screenshot of the page at the moment it failed** and a **Playwright trace**: screenshots, DOM snapshots, network and console logs for every action, viewable right in the report.

Screenshots and traces are kept only for failed tests, so successful runs stay fast and clean. Failure artefacts are also in `test-results/`.

**Only signing in is retried.** The shared demo is sometimes slow to sign in, or is in the middle of a reset, so `SignInScreen.signIn` gives a failed sign-in one more try with fresh cookies, and the report shows a "Sign-in attempt 1 failed …; trying again" step when that happens. Playwright's test-level `retries` stay at 0: any other failure, such as a failed check or a timeout after signing in, is reported straight away, so a retry can never hide a real problem.

## Clean-up

After the test, the `hardwareCleanup` fixture (`tests/fixtures.ts`) looks the asset up by its unique tag and deletes it through Snipe-IT's REST API (`GET /api/v1/hardware/bytag/{tag}`, then `DELETE /api/v1/hardware/{id}`), then checks the tag can no longer be found. The output ends with e.g. `clean-up: Deleted asset QA-20261023050440-6738 (id 2614) through the API`.

- **No API key needed.** The calls go through the browser context's own session (`src/api/hardware-api-client.ts`), sending Laravel's XSRF token the way Snipe-IT's pages do, so they have exactly the signed-in user's permissions.
- **Runs on failure too.** Because the lookup is by tag, it also cleans up when the test failed part-way; if the asset was never saved, it logs that there was nothing to delete.
- **Never hides the result.** A problem while cleaning up is logged as a warning instead of failing the test, because the test's own checks have already passed or failed by then.
- Like deleting in the UI, Snipe-IT keeps a deleted asset as a record an admin can restore; it no longer appears in lists or searches.

## Design notes

- **Page Object Model.** Each Snipe-IT screen has one class in `src/screens/` holding its locators and user actions; all assertions are in the test, so it reads as a clear specification of the expected behaviour. Names follow Snipe-IT's own vocabulary: its asset screens live under `/hardware`, and the person an asset is checked out to is the assignee.
- **Select2 widget.** Snipe-IT uses Select2 for the model, status and user pickers, which hides the real `<select>`. `Select2Picker` drives it the way a user does (open, search, click) instead of setting values with JavaScript, so the page's own change handlers run. For example, choosing a deployable status is what reveals the "Checkout to" section.
- **Web-first assertions and auto-waiting.** No fixed sleeps. Playwright's `expect(...)` assertions and locator waits retry until the condition is met or the timeout is reached, which keeps the test stable against AJAX-loaded tables and dropdowns.
- **Resilient locators.** Stable ids from the Snipe-IT markup are used where available (`#asset_tag`, `#model_select_id`, `#submit_button`), and roles/visible text elsewhere.
- **Independent, repeatable data.** Unique asset tags and serials mean the test can be run repeatedly, and alongside other people using the demo, without collisions.
- **Isolation.** Playwright gives every test a fresh browser context (clean cookies and storage).
- **Strict TypeScript.** `npm run typecheck` runs the compiler in strict mode with unused-code checks.
- **CI-ready.** The GitHub Actions workflow installs the packages and Chromium, runs the test, and uploads the HTML report and failure artefacts.

## Known considerations

- The Snipe-IT demo is a shared public instance that is reset regularly, and other people use it at the same time. During a reset the site shows "Resetting the database. We'll be right back." for a few minutes and the test fails at sign-in; just run it again once https://demo.snipeitapp.com loads. If the demo is down or slow, or the "Macbook Pro 13"" model or "Ready to Deploy" status has been renamed or removed, the test will fail on that step with a clear message, a screenshot and a trace.
- The test runs serially (one worker) to be considerate of the shared demo.

## Project structure

```
src/
├── screens/                        # One class per Snipe-IT screen (page objects)
│   ├── screen-base.ts              # Shared navigation for all screens
│   ├── sign-in.screen.ts           # /login, with the sign-in retry
│   ├── hardware-create.screen.ts   # /hardware/create: fills the form, checks out to a user
│   ├── hardware-list.screen.ts     # /hardware: search and open an asset
│   ├── hardware-view.screen.ts     # /hardware/{id}: details, status box, History tab
│   └── sign-in-failed-error.ts     # Thrown when signing in fails (the only failure that's retried)
├── widgets/
│   └── select2-picker.ts           # Drives Snipe-IT's Select2 dropdowns like a user would
├── api/
│   └── hardware-api-client.ts      # Finds and deletes assets through the REST API, as the signed-in user
├── models/
│   └── hardware.ts                 # HardwareDraft (what's entered), Assignee, CheckedOutHardware
├── test-data/
│   └── hardware-seed.ts            # Builds unique test data per run
├── config/
│   └── settings.ts                 # Base URL and credentials, overridable by environment variables
└── support/
    └── regex.ts                    # Exact-text matching helpers
tests/
├── checkout-journey.spec.ts        # The assignment
└── fixtures.ts                     # hardwareCleanup fixture: deletes the created asset afterwards
playwright.config.ts                # Chromium, serial run, timeouts, reporters, trace/screenshot on failure
package.json                        # Scripts: test, test:headed, report, typecheck
tsconfig.json                       # Strict type checking
.github/workflows/ui-tests.yml      # Runs the test on GitHub Actions and uploads the report
```
