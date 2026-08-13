import { useState } from 'react';
import LandingPage from './components/LandingPage';
import WrappedStory from './components/WrappedStory';
import ExploreMode from './components/ExploreMode';
import type { WrappedStats } from './types/instagram';
import './App.css';

function App() {
  const [stats, setStats] = useState<WrappedStats | null>(null);
  const [view, setView] = useState<'upload' | 'story' | 'explore'>('upload');

  return (
    <div className="min-h-screen bg-background text-white">
      {view === 'upload' && !stats && (
        <main className="w-full">
          <LandingPage 
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
          onReset={() => { setStats(null); setView('upload'); }} 
          onExplore={() => setView('explore')}
        />
      )}

      {view === 'explore' && stats && (
        <ExploreMode 
          stats={stats} 
          onBack={() => setView('story')} 
        />
      )}
    </div>
  );
}

export default App;
