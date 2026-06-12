import React from 'react';
import { isYouTubeUrl, getYouTubeEmbedUrl, isCloudflareStreamUrl } from '@shared/utils/format';
import type { PropertyVideo } from '@shared/types/app.types';

interface PropertyVideoPlayerProps {
  video: PropertyVideo;
}

export function PropertyVideoPlayer({ video }: PropertyVideoPlayerProps) {
  const url = video.video_url;

  if (isYouTubeUrl(url)) {
    const embedUrl = getYouTubeEmbedUrl(url);
    if (!embedUrl) return null;
    return (
      <div className="relative w-full rounded-2xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={embedUrl}
          title="Property Video"
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isCloudflareStreamUrl(url)) {
    const embedUrl = url.replace('watch', 'iframe');
    return (
      <div className="relative w-full rounded-2xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={embedUrl}
          title="Property Video"
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Fallback: HTML5 video
  return (
    <video
      controls
      className="w-full rounded-2xl"
      src={url}
    >
      <track kind="captions" />
      Your browser does not support video playback.
    </video>
  );
}
