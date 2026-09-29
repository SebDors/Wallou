import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Sparkles, Download, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { checkForUpdate, openDownloadPage, ReleaseInfo } from '../services/updateService';
import { APP_VERSION } from '../constants/version';

export function UpdateNotificationToast() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [updateInfo, setUpdateInfo] = useState<ReleaseInfo | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const release = await checkForUpdate(APP_VERSION);
        if (isMounted && release.isAvailable && release.downloadUrl) {
          setUpdateInfo(release);
          Animated.spring(fadeAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
          }).start();
        }
      } catch {
        // Silently ignore if offline
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!updateInfo || isDismissed) {
    return null;
  }

  const handleOpenUpdate = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    await openDownloadPage(updateInfo.downloadUrl);
  };

  const handleDismiss = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setIsDismissed(true));
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          top: Math.max(insets.top, 12) + 8,
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        onPress={handleOpenUpdate}
        style={({ pressed }) => [
          styles.toastCard,
          {
            backgroundColor: theme.colors.bg.surface,
            borderColor: theme.colors.pillar.savings,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: theme.colors.pillar.savings + '20',
              borderRadius: theme.radii.full,
            },
          ]}
        >
          <Sparkles size={18} color={theme.colors.pillar.savings} />
        </View>

        <View style={styles.textWrapper}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.text.primary, fontWeight: '700' },
            ]}
          >
            Mise à jour v{updateInfo.version} disponible !
          </Text>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.text.secondary, fontSize: 11, marginTop: 1 },
            ]}
          >
            Appuyez pour télécharger la nouvelle version
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleOpenUpdate}
            style={[
              styles.downloadButton,
              {
                backgroundColor: theme.colors.pillar.savings,
                borderRadius: theme.radii.full,
              },
            ]}
          >
            <Download size={14} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>

          <Pressable
            onPress={handleDismiss}
            hitSlop={8}
            style={[
              styles.dismissButton,
              {
                backgroundColor: theme.colors.bg.surfaceSubtle,
                borderRadius: theme.radii.full,
              },
            ]}
          >
            <X size={14} color={theme.colors.text.muted} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    elevation: 10,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textWrapper: {
    flex: 1,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  downloadButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
