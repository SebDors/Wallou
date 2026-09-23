import { compareSemver, checkForUpdate } from '../src/services/updateService';

describe('updateService', () => {
  describe('compareSemver', () => {
    it('correctly compares semantic versions', () => {
      expect(compareSemver('1.1.0', '1.0.0')).toBe(1);
      expect(compareSemver('1.0.0', '1.0.1')).toBe(-1);
      expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
      expect(compareSemver('v2.0.0', '1.9.9')).toBe(1);
      expect(compareSemver('1.0.0', 'v1.0.0')).toBe(0);
      expect(compareSemver('1.0.10', '1.0.2')).toBe(1);
    });
  });

  describe('checkForUpdate', () => {
    it('returns safe fallback when fetch fails or offline', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await checkForUpdate('1.0.0');
      expect(result.isAvailable).toBe(false);
      expect(result.version).toBe('1.0.0');
    });

    it('identifies available update when latest release is higher', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.1.0',
          body: 'New features and improvements',
          published_at: '2026-10-01T12:00:00Z',
          assets: [
            {
              name: 'gestion-app-release.apk',
              browser_download_url: 'https://github.com/user/GestionApp/releases/download/v1.1.0/app.apk',
            },
          ],
        }),
      });

      const result = await checkForUpdate('1.0.0');
      expect(result.isAvailable).toBe(true);
      expect(result.version).toBe('1.1.0');
      expect(result.downloadUrl).toBe(
        'https://github.com/user/GestionApp/releases/download/v1.1.0/app.apk'
      );
    });
  });
});
