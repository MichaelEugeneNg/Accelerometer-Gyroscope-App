import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import InstructionPage from './pages/InstructionPage';
import CountdownPage from './pages/CountdownPage';
import MeasurePage from './pages/MeasurePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/instruction" element={<InstructionPage />} />
        <Route path="/countdown" element={<CountdownPage />} />
        <Route path="/measure" element={<MeasurePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
