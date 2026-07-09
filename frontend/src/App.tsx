import { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import type { AnalysisResult } from './types';
import './index.css';

export default function App() {
  const [page, setPage] = useState<'landing' | 'dashboard'>('landing');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleResult = (data: AnalysisResult) => {
    setResult(data);
    setPage('dashboard');
  };

  const handleBack = () => {
    setPage('landing');
  };

  return (
    <>
      {page === 'landing' && (
        <LandingPage onResult={handleResult} />
      )}
      {page === 'dashboard' && result && (
        <Dashboard data={result} onBack={handleBack} />
      )}
    </>
  );
}
