import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import '@/styles/video-skin.css';

/**
 * VideoPlayer — Wrapper de Video.js para React
 * @param {Object} options - Opciones de Video.js
 * @param {Function} onReady - Callback cuando el player está listo
 */
export const VideoPlayer = (props) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const { options, onReady } = props;

  useEffect(() => {
    // Asegurarse de que el Video.js player no se inicialice dos veces
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");

      videoElement.classList.add('vjs-big-play-centered');
      videoElement.classList.add('viddex-player'); // Nuestra skin
      videoRef.current.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, options, () => {
        videojs.log('player is ready');
        onReady && onReady(player);
      });

      // Plugins o configuraciones adicionales aquí si se necesitan
    } else {
      const player = playerRef.current;
      player.autoplay(options.autoplay);
      player.src(options.sources);
    }
  }, [options, videoRef]);

  // Limpiar el player cuando el componente se desmonte
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div data-vjs-player style={{ width: '100%', height: '100%' }}>
      <div ref={videoRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default VideoPlayer;
