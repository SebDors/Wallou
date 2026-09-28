import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableWithoutFeedback } from 'react-native';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from './ThemeContext';

export type DialogVariant = 'info' | 'success' | 'warning' | 'danger';

export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface DialogOptions {
  title: string;
  message?: string;
  variant?: DialogVariant;
  buttons?: DialogButton[];
}

interface DialogContextValue {
  showDialog: (options: DialogOptions) => void;
  hideDialog: () => void;
  showSuccess: (title: string, message?: string, onConfirm?: () => void) => void;
  showError: (title: string, message?: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    isDestructive?: boolean
  ) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<DialogOptions>({ title: '' });

  const showDialog = (opts: DialogOptions) => {
    setOptions(opts);
    setVisible(true);
    try {
      if (opts.variant === 'danger' || opts.variant === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else if (opts.variant === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {}
  };

  const hideDialog = () => {
    setVisible(false);
  };

  const showSuccess = (title: string, message?: string, onConfirm?: () => void) => {
    showDialog({
      title,
      message,
      variant: 'success',
      buttons: [
        {
          text: 'Super',
          style: 'default',
          onPress: () => {
            hideDialog();
            onConfirm?.();
          },
        },
      ],
    });
  };

  const showError = (title: string, message?: string) => {
    showDialog({
      title,
      message,
      variant: 'danger',
      buttons: [
        {
          text: 'Compris',
          style: 'default',
          onPress: hideDialog,
        },
      ],
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'Confirmer',
    isDestructive = false
  ) => {
    showDialog({
      title,
      message,
      variant: isDestructive ? 'danger' : 'info',
      buttons: [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: hideDialog,
        },
        {
          text: confirmText,
          style: isDestructive ? 'destructive' : 'default',
          onPress: () => {
            hideDialog();
            onConfirm();
          },
        },
      ],
    });
  };

  const getVariantIcon = () => {
    switch (options.variant) {
      case 'success':
        return <CheckCircle2 size={24} color={theme.colors.status.income} />;
      case 'warning':
        return <AlertTriangle size={24} color={theme.colors.status.warning} />;
      case 'danger':
        return <AlertCircle size={24} color={theme.colors.status.overrun} />;
      default:
        return <Info size={24} color={theme.colors.pillar.savings} />;
    }
  };

  const buttons = options.buttons && options.buttons.length > 0
    ? options.buttons
    : [{ text: 'OK', style: 'default' as const, onPress: hideDialog }];

  return (
    <DialogContext.Provider
      value={{ showDialog, hideDialog, showSuccess, showError, showConfirm }}
    >
      {children}

      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideDialog}
      >
        <TouchableWithoutFeedback onPress={hideDialog}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.modalBox,
                  {
                    backgroundColor: theme.colors.bg.surface,
                    borderColor: theme.colors.border.subtle,
                    borderRadius: theme.radii.lg,
                  },
                ]}
              >
                {/* Header Icon + Title */}
                <View style={styles.header}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor:
                          options.variant === 'danger'
                            ? theme.colors.status.overrunBg
                            : options.variant === 'success'
                            ? theme.colors.status.incomeBg
                            : theme.colors.bg.surfaceSubtle,
                        borderRadius: theme.radii.full,
                      },
                    ]}
                  >
                    {getVariantIcon()}
                  </View>
                  <Text
                    style={[
                      theme.typography.title2,
                      { color: theme.colors.text.primary, marginTop: 12, textAlign: 'center' },
                    ]}
                  >
                    {options.title}
                  </Text>
                </View>

                {/* Message Body */}
                {Boolean(options.message) && (
                  <Text
                    style={[
                      theme.typography.body,
                      {
                        color: theme.colors.text.secondary,
                        textAlign: 'center',
                        marginTop: 8,
                        marginBottom: 20,
                        lineHeight: 20,
                      },
                    ]}
                  >
                    {options.message}
                  </Text>
                )}

                {/* Action Buttons */}
                <View style={[styles.buttonsRow, !options.message && { marginTop: 20 }]}>
                  {buttons.map((btn, idx) => {
                    const isCancel = btn.style === 'cancel';
                    const isDestructive = btn.style === 'destructive';

                    let btnBg = theme.colors.pillar.savings;
                    let btnTextColor = '#FFFFFF';

                    if (isCancel) {
                      btnBg = theme.colors.bg.surfaceSubtle;
                      btnTextColor = theme.colors.text.secondary;
                    } else if (isDestructive) {
                      btnBg = theme.colors.status.overrun;
                      btnTextColor = '#FFFFFF';
                    }

                    return (
                      <Pressable
                        key={idx}
                        onPress={() => {
                          if (btn.onPress) {
                            btn.onPress();
                          } else {
                            hideDialog();
                          }
                        }}
                        style={({ pressed }) => [
                          styles.actionBtn,
                          {
                            backgroundColor: btnBg,
                            borderRadius: theme.radii.md,
                            opacity: pressed ? 0.85 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            theme.typography.body,
                            { color: btnTextColor, fontWeight: '700' },
                          ]}
                        >
                          {btn.text}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextValue => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
