import React from 'react';
import { StudioFrame } from '@/components/studio/StudioFrame';
import { ToolDashboard } from '@/components/studio/ToolPanel';

export default function ToolsScreen() {
  return (
    <StudioFrame
      title="Studio Tools"
      subtitle="Editor windows and device information."
      eyebrow="WORKSPACE / WINDOWS"
    >
      <ToolDashboard />
    </StudioFrame>
  );
}
