import type React from 'react';
import { Route, Routes } from 'react-router-dom';
import PlaygroundPage from './pages/playground';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<PlaygroundPage />} />
    </Routes>
  );
};

export default App;
