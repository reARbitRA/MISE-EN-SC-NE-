import React, { useRef } from 'react';
import ImageGeneratorCard, { ImageGeneratorCardRef } from '../ImageGeneratorCard';
import type { ActivityItemProps } from '../ContextualSmartPanel';

interface FrameGeneratorViewProps {
  addRecentFrame: (imageUrl: string) => void;
  addActivity: (activity: Omit<ActivityItemProps, 'time'>) => void;
}

const FrameGeneratorView: React.FC<FrameGeneratorViewProps> = ({ addRecentFrame, addActivity }) => {
  const imageGeneratorRef = useRef<ImageGeneratorCardRef>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const handleCreationSaved = (prompt: string) => {
    addActivity({
      imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
      userName: 'You',
      action: `saved a creation with prompt "${prompt.substring(0, 20)}...".`
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b-2 border-[#2E2E3A] pb-3">
        <span className="w-3 h-8 bg-[#FF2244]"></span>
        <div>
          <h2 className="font-display text-4xl font-extrabold text-[#F0EBE1] uppercase tracking-wider">
            THE PROJECTION BOOTH // FRAME GENERATOR
          </h2>
          <p className="font-mono text-xs text-[#8E8A84] mt-0.5">
            Synthesize high-octane comic frames using Arena.ai vision engines.
          </p>
        </div>
      </div>

      <div className="bg-[#12121A] border-2 border-[#2E2E3A] shadow-[8px_8px_0px_#0A0A0F] p-6 relative">
        {/* Decorative corner tag */}
        <div className="absolute -top-3 right-4 bg-[#FF2244] text-white font-mono text-[10px] font-bold px-2 py-0.5 border border-[#0A0A0F]">
          RENDER UNIT #404
        </div>

        <ImageGeneratorCard
          ref={imageGeneratorRef}
          promptInputRef={promptInputRef}
          onImageGenerated={addRecentFrame}
          onCreationSaved={handleCreationSaved}
        />
      </div>
    </div>
  );
};

export default FrameGeneratorView;
