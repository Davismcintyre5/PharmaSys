import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';

const GITHUB_REPO = 'Davismcintyre5/PharmaSys';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  assets: GitHubAsset[];
}

function currentVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.0';
}

function isNewerVersion(latest: string, current: string): boolean {
  const l = latest.split('.').map((n) => parseInt(n, 10) || 0);
  const c = current.split('.').map((n) => parseInt(n, 10) || 0);
  const max = Math.max(l.length, c.length);

  for (let i = 0; i < max; i++) {
    const lp = l[i] ?? 0;
    const cp = c[i] ?? 0;
    if (lp > cp) return true;
    if (lp < cp) return false;
  }
  return false;
}

function pickMobileAsset(assets: GitHubAsset[]): GitHubAsset | null {
  return (
    assets.find((a) => a.name.toLowerCase().endsWith('.apk')) ??
    assets.find((a) => a.name.toLowerCase().includes('pharmasys-mobile')) ??
    null
  );
}

export async function checkForUpdate(showUpToDate = false): Promise<void> {
  if (Platform.OS === 'ios') {
    if (showUpToDate) {
      Alert.alert('Updates', 'iOS updates are managed by the App Store.');
    }
    return;
  }

  try {
    const res = await axios.get<GitHubRelease>(GITHUB_API, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      timeout: 10000,
    });

    const release = res.data;
    const apk = pickMobileAsset(release.assets ?? []);

    if (!apk) {
      if (showUpToDate) {
        Alert.alert(
          'No Update Available',
          'No mobile build found in the latest release.'
        );
      }
      return;
    }

    const latestVersion = release.tag_name.replace(/^v/i, '');
    const current = currentVersion();

    if (isNewerVersion(latestVersion, current)) {
      Alert.alert(
        'Update Available',
        `PharmaSys v${latestVersion} is available.\n\nYou're on v${current}.\n\nDownload and install the latest version.`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Download',
            onPress: () => {
              Linking.openURL(apk.browser_download_url).catch(() => {
                Alert.alert('Error', 'Could not open the download link.');
              });
            },
          },
        ],
        { cancelable: true }
      );
    } else if (showUpToDate) {
      Alert.alert('Up to Date', `You're on the latest version (v${current}).`);
    }
  } catch {
    if (showUpToDate) {
      Alert.alert(
        'Update Check Failed',
        'Could not check for updates. Check your internet connection and try again.'
      );
    }
  }
}