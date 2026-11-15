import { Ionicons } from '@expo/vector-icons';
import React, { type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { StudioHeader } from '@/components/studio/StudioHeader';

export function StudioFrame({
  title,
  subtitle,
  eyebrow = 'SESSION WORKSPACE',
  children,
  onBack,
}: {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
  onBack?: () => void;
}) {
  const colors = useColors();
  return (
    <SafeAreaView
      edges={Platform.OS === 'web' ? [] : ['top', 'left', 'right']}
      style={[
        styles.root,
        { backgroundColor: colors.background },
        Platform.OS === 'web' && styles.webInsets,
      ]}
    >
      <StudioHeader />
      {(title || onBack) && (
        <View style={[styles.titleRow, { borderBottomColor: colors.line }]}>
          {onBack && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              style={({ pressed }) => [
                styles.backButton,
                { backgroundColor: colors.panel, borderColor: colors.line },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="chevron-back" size={17} color={colors.foreground} />
            </Pressable>
          )}
          <View style={styles.titleBlock}>
            <Text style={[styles.eyebrow, { color: colors.lime }]}>{eyebrow}</Text>
            {title && (
              <Text style={[styles.title, { color: colors.foreground }]}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      )}
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  webInsets: { paddingTop: 67, paddingBottom: 34 },
  titleRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  titleBlock: { flex: 1 },
  eyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  title: { fontSize: 19, fontWeight: '700', marginTop: 2 },
  subtitle: { fontSize: 10, marginTop: 3 },
  backButton: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minHeight: 0 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
