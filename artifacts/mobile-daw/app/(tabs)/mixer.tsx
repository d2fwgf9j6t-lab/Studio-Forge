import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { MixerSurface } from '@/components/studio/Mixer';
import { StudioFrame } from '@/components/studio/StudioFrame';

export default function MixerScreen() {
  return (
    <StudioFrame
      title="Mixer"
      subtitle="Sixteen channel strips and a master bus."
      eyebrow="WINDOW / MIXER"
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MixerSurface />
      </ScrollView>
    </StudioFrame>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 20 },
});
