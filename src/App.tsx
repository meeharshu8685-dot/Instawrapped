import { useState } from 'react';
import LandingPage from './components/LandingPage';
import WrappedStory from './components/WrappedStory';
import { sampleStats } from './analytics/sampleData';
import type { WrappedStats } from './types/instagram';

function App() {
  const [stats, setStats] = useState<WrappedStats | null>(null);

  if (stats) {
    return <WrappedStory stats={stats} onReset={() => setStats(null)} />;
  }

  return (
    <LandingPage 
      onDataLoaded={(loadedStats) => setStats(loadedStats)}
      onDemoLoaded={() => setStats(sampleStats)}
    />
  );
}

export default App;
