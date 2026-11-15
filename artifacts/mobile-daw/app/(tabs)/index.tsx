import React from 'react';
import { Playlist } from '@/components/studio/Playlist';
import { StudioFrame } from '@/components/studio/StudioFrame';

export default function ArrangementScreen() {
  return (
    <StudioFrame
      title="Arrangement"
      subtitle="Build a session across eight visible bars."
      eyebrow="WORKSPACE / PLAYLIST"
    >
      <Playlist />
    </StudioFrame>
  );
}
