import { useEffect, useState } from 'react';
import { Film } from 'lucide-react';

interface MediaThumbnailProps {
  src: string | null | undefined;
  alt: string;
  label?: string;
  className?: string;
}

export function MediaThumbnail({ src, alt, label, className = '' }: MediaThumbnailProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`aspect-video w-full bg-[#38111B] border-b border-[#702E3F] flex flex-col items-center justify-center gap-2 p-4 select-none ${className}`}
      >
        <Film className="w-6 h-6 text-[#D9C5A9]/70" aria-hidden="true" />
        {label ? (
          <span className="text-xs font-medium tracking-wide text-[#F2ECEE]/70 truncate max-w-full">
            {label}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`aspect-video w-full bg-[#38111B] overflow-hidden border-b border-[#702E3F] flex items-center justify-center ${className}`}
    >
      <img
        key={src}
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
