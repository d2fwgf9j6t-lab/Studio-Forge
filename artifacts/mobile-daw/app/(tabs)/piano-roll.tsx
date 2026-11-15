import React from 'react';
import { StudioFrame } from '@/components/studio/StudioFrame';
import { PianoRoll } from '@/components/studio/PianoRoll';

export default function PianoRollScreen() {
  return (
    <StudioFrame
      title="Piano Roll"
      subtitle="Tap the grid to build a MIDI pattern."
      eyebrow="EDITOR / MIDI"
    >
      <PianoRoll />
    </StudioFrame>
  );
}
