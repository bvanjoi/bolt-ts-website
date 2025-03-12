import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PlaygroundPage from './pages/playground';

const App: React.FC = () => {
  return (
    <Routes>
      {/* <Route path="/" element={<LandingPage />} /> */}
      <Route path="/" element={<PlaygroundPage />} />
      {/* <Route path="/playground" element={<PlaygroundPage />} /> */}
    </Routes>
  );
};

export default App; 