import React from 'react';
import { StudioFrame } from '@/components/studio/StudioFrame';
import { SoundBrowser } from '@/components/studio/SoundBrowser';

export default function BrowserScreen() {
  return (
    <StudioFrame
      title="Sound Browser"
      subtitle="Organize imported audio for future sessions."
      eyebrow="LIBRARY / SOURCES"
    >
      <SoundBrowser />
    </StudioFrame>
  );
}
