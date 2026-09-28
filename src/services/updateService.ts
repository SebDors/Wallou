import { Linking } from 'react-native';

export interface ReleaseInfo {
  version: string;
  releaseNotes: string;
  publishedAt: string;
  downloadUrl: string;
  isAvailable: boolean;
}

/**
 * Pure JavaScript semantic version comparison.
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareSemver(v1: string, v2: string): number {
  const clean = (v: string) => v.replace(/^v/, '').trim();
  const p1 = clean(v1).split('.').map((n) => parseInt(n, 10) || 0);
  const p2 = clean(v2).split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(p1.length, p2.length);

  for (let i = 0; i < len; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Queries GitHub Releases API for latest published release APK.
 */
export async function checkForUpdate(
  currentVersion: string,
  repoOwner: string = 'user',
  repoName: string = 'GestionApp'
): Promise<ReleaseInfo> {
  const defaultResult: ReleaseInfo = {
    version: currentVersion,
    releaseNotes: '',
    publishedAt: '',
    downloadUrl: '',
    isAvailable: false,
  };

  try {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'GestionApp-Mobile',
      },
    });

    if (!response.ok) {
      return defaultResult;
    }

    const data = await response.json();
    const latestVersion = (data.tag_name || '').replace(/^v/, '');
    const isAvailable = compareSemver(latestVersion, currentVersion) > 0;

    let downloadUrl = data.html_url || '';
    if (Array.isArray(data.assets)) {
      const apkAsset = data.assets.find((a: any) =>
        typeof a.name === 'string' && a.name.endsWith('.apk')
      );
      if (apkAsset && apkAsset.browser_download_url) {
        downloadUrl = apkAsset.browser_download_url;
      }
    }

    return {
      version: latestVersion || currentVersion,
      releaseNotes: data.body || 'Nouvelle mise à jour disponible.',
      publishedAt: data.published_at || '',
      downloadUrl,
      isAvailable,
    };
  } catch (error) {
    return defaultResult;
  }
}

/**
 * Opens external URL in user's browser to download APK or read notes.
 */
export async function openDownloadPage(url: string): Promise<void> {
  if (!url) return;
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  }
}
