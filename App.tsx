import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Experience } from './components/Experience';
import { Overlay } from './components/Overlay';

const App: React.FC = () => {
  // Core State Machine
  const [isTreeForm, setIsTreeForm] = useState<boolean>(false);
  
  // Audio Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio with Smart Fallback
  useEffect(() => {
    // 1. Try Local File first
    const localPath = '/Christmas.m4a';
    // 2. Fallback to a copyright-free Christmas track (Jingle Bells Jazz)
    const onlineBackup = 'https://cdn.pixabay.com/download/audio/2022/11/22/audio_febc508520.mp3';

    const audio = new Audio(localPath);
    audio.loop = true;
    audio.volume = 0.5;
    
    // Smart Recovery: If local file fails, switch to online backup seamlessly
    audio.addEventListener('error', (e) => {
        console.warn("⚠️ Local 'Christmas.m4a' not found. Switching to online backup music.");
        // Switch source and reload
        audio.src = onlineBackup;
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleForm = useCallback(() => {
    setIsTreeForm((prev) => {
      const nextState = !prev;
      
      // Music Logic: Play when Tree forms, Pause when scatters
      if (audioRef.current) {
        if (nextState) {
          // Play requires user interaction, which this click provides
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
             playPromise.catch((e) => {
                console.log("Audio waiting for interaction");
             });
          }
        } else {
          audioRef.current.pause();
        }
      }

      return nextState;
    });
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#021a0f]">
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <Experience isTreeForm={isTreeForm} />
      </div>

      {/* UI Overlay Layer */}
      <Overlay 
        isTreeForm={isTreeForm} 
        toggleForm={toggleForm} 
      />
      
      {/* Decorative Border Frame */}
      <div className="absolute inset-0 border-[1px] border-[#c5a059] opacity-20 pointer-events-none m-4 rounded-sm" />
    </div>
  );
};

export default App;