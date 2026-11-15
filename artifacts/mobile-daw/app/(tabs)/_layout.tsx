import React from 'react';
import {
  Platform,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'rectangle.3.group', selected: 'rectangle.3.group.fill' }}
          md="view_week"
        />
        <NativeTabs.Trigger.Label>Arrange</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="browser">
        <NativeTabs.Trigger.Icon sf="waveform" md="library_music" />
        <NativeTabs.Trigger.Label>Sounds</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="mixer">
        <NativeTabs.Trigger.Icon sf="slider.horizontal.3" md="tune" />
        <NativeTabs.Trigger.Label>Mixer</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="piano-roll">
        <NativeTabs.Trigger.Icon sf="pianokeys" md="piano" />
        <NativeTabs.Trigger.Label>Piano</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tools">
        <NativeTabs.Trigger.Icon sf="ellipsis" md="more_horiz" />
        <NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compactLandscape = width > height && height < 600;
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: compactLandscape ? 7 : 8,
          fontWeight: '700',
          letterSpacing: 0.2,
          marginTop: compactLandscape ? 0 : 1,
        },
        tabBarStyle: {
          backgroundColor: isIOS ? 'transparent' : colors.panel,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : compactLandscape ? 44 + insets.bottom : 60 + insets.bottom,
          paddingTop: compactLandscape ? 2 : 6,
          paddingBottom: isWeb ? 0 : insets.bottom,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.panel },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Arrange',
          tabBarIcon: ({ color, focused }) =>
            isIOS ? <SymbolView name="rectangle.3.group" tintColor={color} size={21} /> :
              <Feather name="grid" size={19} color={focused ? colors.primary : colors.mutedForeground} />,
        }}
      />
      <Tabs.Screen
        name="browser"
        options={{
          title: 'Sounds',
          tabBarIcon: ({ color, focused }) =>
            isIOS ? <SymbolView name="waveform" tintColor={color} size={21} /> :
              <Feather name="music" size={19} color={focused ? colors.primary : colors.mutedForeground} />,
        }}
      />
      <Tabs.Screen
        name="mixer"
        options={{
          title: 'Mixer',
          tabBarIcon: ({ color, focused }) =>
            isIOS ? <SymbolView name="slider.horizontal.3" tintColor={color} size={21} /> :
              <Feather name="sliders" size={19} color={focused ? colors.primary : colors.mutedForeground} />,
        }}
      />
      <Tabs.Screen
        name="piano-roll"
        options={{
          title: 'Piano',
          tabBarIcon: ({ color, focused }) =>
            isIOS ? <SymbolView name="pianokeys" tintColor={color} size={21} /> :
              <Feather name="columns" size={19} color={focused ? colors.primary : colors.mutedForeground} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) =>
            isIOS ? <SymbolView name="ellipsis" tintColor={color} size={21} /> :
              <Feather name="more-horizontal" size={19} color={focused ? colors.primary : colors.mutedForeground} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
