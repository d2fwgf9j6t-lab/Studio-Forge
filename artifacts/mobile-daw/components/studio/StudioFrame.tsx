import { Ionicons } from '@expo/vector-icons';
import React, { type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
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
  const { width, height } = useWindowDimensions();
  const compactLandscape = width > height && height < 600;
  const showTitleRow = (title || onBack) && !(compactLandscape && !onBack);
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
      {showTitleRow && (
        <View
          style={[
            styles.titleRow,
            compactLandscape && styles.compactLandscapeTitleRow,
            { borderBottomColor: colors.line },
          ]}
        >
          {onBack && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              style={({ pressed }) => [
                styles.backButton,
                compactLandscape && styles.compactLandscapeBackButton,
                { backgroundColor: colors.panel, borderColor: colors.line },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="chevron-back" size={17} color={colors.foreground} />
            </Pressable>
          )}
          <View style={styles.titleBlock}>
            {!compactLandscape && (
              <Text style={[styles.eyebrow, { color: colors.lime }]}>{eyebrow}</Text>
            )}
            {title && (
              <Text
                style={[
                  styles.title,
                  compactLandscape && styles.compactLandscapeTitle,
                  { color: colors.foreground },
                ]}
              >
                {title}
              </Text>
            )}
            {subtitle && !compactLandscape && (
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
  compactLandscapeTitleRow: {
    minHeight: 34,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  titleBlock: { flex: 1 },
  eyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  title: { fontSize: 19, fontWeight: '700', marginTop: 2 },
  compactLandscapeTitle: { fontSize: 14, marginTop: 0 },
  subtitle: { fontSize: 10, marginTop: 3 },
  backButton: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactLandscapeBackButton: { width: 28, height: 28, borderRadius: 8 },
  body: { flex: 1, minHeight: 0 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
