import React, { useRef } from 'react';

interface OrbProps {
  isLive: boolean;
  onToggleLive: () => void;
  onFileContent: (text: string) => void;
  onToast: (msg: string) => void;
}

export const Orb: React.FC<OrbProps> = ({
  isLive,
  onToggleLive,
  onFileContent,
  onToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (['txt', 'md', 'markdown', 'json', 'csv', 'js', 'py'].includes(ext) || file.type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        if (text) {
          onFileContent(text.slice(0, 5000));
          onToast(`Loaded ${file.name} ✓`);
        }
      };
      reader.readAsText(file);
    } else {
      // For binary/PDF files, acknowledge and load snippet or note
      const reader = new FileReader();
      reader.onload = () => {
        onFileContent(`[Document attached: ${file.name}]\n\nExplain the core principles behind this subject.`);
        onToast(`Attached ${file.name} to explanation ✓`);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-6 select-none">
      {/* Hidden File Picker triggered by inner core */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.markdown,.json,.csv,.pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Ripple wave rings when in live teaching mode */}
      {isLive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-40 h-40 rounded-full border border-emerald-400/30 animate-wave-ripple" />
          <div
            className="w-40 h-40 rounded-full border border-emerald-400/20 animate-wave-ripple"
            style={{ animationDelay: '1.2s' }}
          />
        </div>
      )}

      {/* Ambient background radial glow */}
      <div
        className={`absolute w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 ${
          isLive ? 'bg-emerald-500/10' : 'bg-indigo-600/10'
        }`}
      />

      {/* Centered Breathing Orb Button */}
      <button
        type="button"
        onClick={onToggleLive}
        aria-label={isLive ? 'Stop live teaching mode' : 'Start live teaching mode'}
        className={`relative z-10 w-40 h-40 rounded-full flex items-center justify-center transition-all duration-700 cursor-pointer shadow-2xl active:scale-95 ${
          isLive
            ? 'animate-orb-live bg-gradient-to-b from-[#091510] to-[#040B07] border border-emerald-400/40 shadow-emerald-500/10'
            : 'animate-orb-breathe bg-gradient-to-b from-[#0D0D14] to-[#07070B] border border-zinc-800/80 hover:border-indigo-500/40 shadow-indigo-500/10'
        }`}
      >
        {/* Subtle inner concentric guide ring */}
        <div
          className={`w-28 h-28 rounded-full border border-dashed transition-colors duration-700 ${
            isLive ? 'border-emerald-400/20' : 'border-zinc-800/60'
          }`}
        />

        {/* AI Portal Core Dot (Tap opens file picker) */}
        <div
          onClick={handleCoreClick}
          title="AI Portal Core — Tap to load reference notes (.txt)"
          className="absolute z-20 flex items-center justify-center p-3 cursor-pointer group tap-target"
        >
          <div
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              isLive
                ? 'bg-emerald-300 shadow-[0_0_12px_#34D399] animate-core-pulse'
                : 'bg-indigo-400 shadow-[0_0_10px_#6366F1] group-hover:scale-150 animate-core-pulse'
            }`}
          />
        </div>

        {/* Live indicator micro-badge inside orb */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              isLive ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'
            }`}
          />
          <span className="text-[9px] tracking-widest uppercase font-light text-zinc-400">
            {isLive ? 'LISTENING' : 'TAP TO TEACH'}
          </span>
        </div>
      </button>
    </div>
  );
};
