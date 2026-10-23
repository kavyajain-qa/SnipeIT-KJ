/** The data entered when creating an asset. */
export interface HardwareDraft {
  /** Unique asset tag, used to find the asset again. */
  assetTag: string;
  /** Unique serial number. */
  serial: string;
  /** Asset model name as it appears in Snipe-IT. */
  modelName: string;
  /** Text typed into the model picker's search box to find `modelName`. */
  modelSearchText: string;
  /** Status label to assign. */
  statusLabel: string;
}

/** A Snipe-IT user an asset is checked out to, as shown in the user picker. */
export interface Assignee {
  /** Database id, used in user links (/users/{id}). Unique, unlike the display name. */
  id: string;
  /** Name shown on asset pages and in history, e.g. "Jane Smith". */
  displayName: string;
  /** Login name, e.g. "jsmith". May be empty. */
  username: string;
}

/** What was actually created, including the user picked at runtime. */
export interface CheckedOutHardware {
  draft: HardwareDraft;
  assignee: Assignee;
}

/**
 * Parses the user picker's text, which Snipe-IT formats as
 * "Display Name (username) - #employeeNumber" (username and employee number are optional).
 */
export function parseAssignee(id: string, pickerText: string): Assignee {
  let text = pickerText.trim();

  const employeeSeparator = text.lastIndexOf(' - #');
  if (employeeSeparator >= 0) {
    text = text.slice(0, employeeSeparator);
  }

  const usernameStart = text.lastIndexOf(' (');
  if (usernameStart >= 0 && text.endsWith(')')) {
    return {
      id,
      displayName: text.slice(0, usernameStart).trim(),
      username: text.slice(usernameStart + 2, -1).trim(),
    };
  }

  return { id, displayName: text, username: '' };
}
