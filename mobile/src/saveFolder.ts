import { Alert } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';

/**
 * Where saved files go. Since Android 11 an app can't be given the Downloads folder
 * itself, so the user picks a folder once (or makes one, such as "Converter Tool") and
 * Android remembers that the app may use it. The choice is kept in a small file.
 */
export interface FolderStore {
  /** The folder the user chose earlier, or null when none was chosen. */
  savedFolder(): Directory | null;
  /** Explains, then asks the user to choose a folder. Null if they decline or cancel. */
  chooseFolder(): Promise<Directory | null>;
  /** Forgets the choice, for example after Android withdrew access to the folder. */
  forget(): void;
}

const choiceFile = () => new File(Paths.document, 'save-folder.txt');

export const androidFolderStore: FolderStore = {
  savedFolder() {
    try {
      const file = choiceFile();
      if (!file.exists) return null;
      const uri = file.textSync().trim();
      return uri ? new Directory(uri) : null;
    } catch {
      return null;
    }
  },

  async chooseFolder() {
    const agreed = await new Promise<boolean>((resolve) =>
      Alert.alert(
        'Where should files be saved?',
        'Choose a folder on your phone, or make a new one. Android doesn’t let apps use the Downloads folder itself, so pick Documents or create a folder such as “Converter Tool”.',
        [
          { text: 'Share instead', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Choose folder', onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      )
    );
    if (!agreed) return null;

    try {
      const folder = await Directory.pickDirectoryAsync();
      const file = choiceFile();
      file.create({ overwrite: true });
      await file.write(folder.uri);
      return folder;
    } catch {
      return null; // The user closed the picker.
    }
  },

  forget() {
    try {
      const file = choiceFile();
      if (file.exists) file.delete();
    } catch {
      // Nothing to forget.
    }
  },
};
