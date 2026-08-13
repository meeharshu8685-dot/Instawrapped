import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import WrappedStory from './components/WrappedStory';
import ExploreMode from './components/ExploreMode';
import SharedPreview from './components/SharedPreview';
import type { WrappedStats, SharedStats } from './types/instagram';
import './App.css';

function App() {
  const [stats, setStats] = useState<WrappedStats | null>(null);
  const [view, setView] = useState<'upload' | 'story' | 'explore' | 'shared'>('upload');
  const [sharedStats, setSharedStats] = useState<SharedStats | null>(null);

  useEffect(() => {
    // Check for shared stats in URL hash
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      try {
        const payload = hash.replace('#share=', '');
        const decoded = JSON.parse(decodeURIComponent(atob(payload))) as SharedStats;
        if (decoded && decoded.totalMessages) {
          setSharedStats(decoded);
          setView('shared');
        }
      } catch (e) {
        console.error("Failed to decode shared stats:", e);
        window.location.hash = '';
      }
    }
  }, []);

  const handleCreateOwn = () => {
    window.location.hash = '';
    setSharedStats(null);
    setView('upload');
  };

  return (
    <div className="min-h-screen bg-background text-white">
      {view === 'shared' && sharedStats && (
        <SharedPreview 
          sharedStats={sharedStats}
          onCreateOwn={handleCreateOwn}
        />
      )}

      {view === 'upload' && (
        <main className="w-full">
          <LandingPage 
            stats={stats}
            onViewWrapped={() => setView('story')}
            onDataLoaded={(s) => {
              setStats(s);
              setView('story');
            }}
            onDemoLoaded={() => {
              import('./analytics/sampleData').then(({ sampleStats }) => {
                setStats(sampleStats);
                setView('story');
              });
            }}
          />
        </main>
      )}

      {view === 'story' && stats && (
        <WrappedStory 
          stats={stats} 
          onReset={() => { setView('upload'); }} 
          onExplore={() => setView('explore')}
        />
      )}

      {view === 'explore' && stats && (
        <ExploreMode 
          stats={stats} 
          onBack={() => setView('story')} 
          onReset={() => { setView('upload'); }}
        />
      )}
    </div>
  );
}

export default App;
