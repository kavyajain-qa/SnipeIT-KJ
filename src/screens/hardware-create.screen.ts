import { parseAssignee, type CheckedOutHardware, type HardwareDraft } from '../models/hardware';
import { Select2Picker } from '../widgets/select2-picker';
import { ScreenBase } from './screen-base';

/** Hardware > Create New (/hardware/create). */
export class HardwareCreateScreen extends ScreenBase {
  static readonly path = '/hardware/create';

  private readonly modelPicker = new Select2Picker(this.page, 'model_select_id');
  private readonly statusPicker = new Select2Picker(this.page, 'status_select_id');
  private readonly assigneePicker = new Select2Picker(this.page, 'assigned_user_select');

  private readonly assetTagInput = this.page.locator('#asset_tag');
  private readonly serialInput = this.page.locator('#serial_1');

  // Only shown once a deployable status has been chosen.
  private readonly checkoutToSelector = this.page.locator('#assignto_selector');
  private readonly checkoutToUserButton = this.checkoutToSelector.locator("label:has(input[value='user'])");
  private readonly assignedUserField = this.page.locator('#assigned_user');

  private readonly saveButton = this.page.locator('#submit_button');

  /** Success banner shown after the asset is saved. */
  readonly successAlert = this.page.locator('.alert-success');

  /**
   * Fills in and submits the create form, checking the asset out to a user.
   * @param draft The asset to create.
   * @param username The user to check out to, or undefined to pick a random user.
   */
  async createCheckedOutToUser(draft: HardwareDraft, username?: string): Promise<CheckedOutHardware> {
    await this.fillDetails(draft);

    // Choosing a deployable status reveals the "Checkout to" options.
    await this.checkoutToSelector.waitFor();
    await this.checkoutToUserButton.click();
    await this.assignedUserField.waitFor();

    // The picker shows "Display Name (username)", so match on "(username)".
    const pickerText = username
      ? await this.assigneePicker.searchAndSelect(username, `(${username})`)
      : await this.assigneePicker.selectRandom();
    const assignee = parseAssignee(await this.assigneePicker.selectedOptionValue(), pickerText);

    // A successful save redirects to the assets list; a validation error stays on the form.
    await this.saveButton.click();
    await this.page.waitForURL(/\/hardware\/?$/);

    return { draft, assignee };
  }

  /** Opens the form and fills in the asset's own details, without saving. */
  private async fillDetails(draft: HardwareDraft): Promise<void> {
    await this.navigateTo(HardwareCreateScreen.path);

    await this.assetTagInput.fill(draft.assetTag);
    await this.serialInput.fill(draft.serial);
    await this.modelPicker.searchAndSelect(draft.modelSearchText, draft.modelName);
    await this.statusPicker.select(draft.statusLabel);
  }
}
