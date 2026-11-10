import { Alert } from 'react-native';
import { androidFolderStore } from '../src/saveFolder';
import { fakeFs } from './support/fakeNative';

jest.mock('expo-file-system', () => require('./support/fakeNative').fileSystemModule);

type AlertButton = { text: string; onPress?: () => void };
type AlertOptions = { onDismiss?: () => void };

/** What the user does with the "Where should files be saved?" message. */
function userAnswers(answer: 'Choose folder' | 'Share instead' | 'dismiss') {
  jest.spyOn(Alert, 'alert').mockImplementation(((_title: string, _message: string, buttons: AlertButton[], options: AlertOptions) => {
    if (answer === 'dismiss') options.onDismiss?.();
    else buttons.find((button) => button.text === answer)?.onPress?.();
  }) as never);
}

beforeEach(() => fakeFs.reset());
afterEach(() => jest.restoreAllMocks());

describe('folder store', () => {
  it('has no folder before the user chooses one', () => {
    expect(androidFolderStore.savedFolder()).toBeNull();
  });

  it('explains, lets the user choose a folder, and remembers it', async () => {
    userAnswers('Choose folder');
    fakeFs.pick = 'content://tree/Documents%2FConverter%20Tool';

    const folder = await androidFolderStore.chooseFolder();
    expect(folder?.uri).toBe('content://tree/Documents%2FConverter%20Tool');
    expect(Alert.alert).toHaveBeenCalledWith(
      'Where should files be saved?',
      expect.stringContaining('Downloads'),
      expect.any(Array),
      expect.anything()
    );
    // Remembered for the next time the app opens.
    expect(androidFolderStore.savedFolder()?.uri).toBe('content://tree/Documents%2FConverter%20Tool');
  });

  it('does not open the picker when the user prefers to share', async () => {
    userAnswers('Share instead');
    expect(await androidFolderStore.chooseFolder()).toBeNull();
    expect(fakeFs.picks).toBe(0);
    expect(androidFolderStore.savedFolder()).toBeNull();
  });

  it('treats closing the message as declining', async () => {
    userAnswers('dismiss');
    expect(await androidFolderStore.chooseFolder()).toBeNull();
    expect(fakeFs.picks).toBe(0);
  });

  it('remembers nothing when the user closes the picker', async () => {
    userAnswers('Choose folder');
    fakeFs.pick = 'cancel';
    expect(await androidFolderStore.chooseFolder()).toBeNull();
    expect(fakeFs.picks).toBe(1);
    expect(androidFolderStore.savedFolder()).toBeNull();
  });

  it('replaces an earlier choice', async () => {
    userAnswers('Choose folder');
    fakeFs.pick = 'content://tree/One';
    await androidFolderStore.chooseFolder();
    fakeFs.pick = 'content://tree/Two';
    await androidFolderStore.chooseFolder();
    expect(androidFolderStore.savedFolder()?.uri).toBe('content://tree/Two');
  });

  it('forgets the choice, and forgetting nothing does no harm', async () => {
    expect(() => androidFolderStore.forget()).not.toThrow();
    userAnswers('Choose folder');
    fakeFs.pick = 'content://tree/One';
    await androidFolderStore.chooseFolder();
    androidFolderStore.forget();
    expect(androidFolderStore.savedFolder()).toBeNull();
  });
});
