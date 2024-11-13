import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PhotoBooth } from './components/PhotoBooth';
import AdminPanel from './components/AdminPanel';
import Navigation from './components/Navigation';
import { SettingsProvider } from './contexts/SettingsContext';

function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <div className="min-h-screen bg-canvas">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<PhotoBooth />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </main>
        </div>
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default App;