import React, { useState } from 'react';
import { View } from './types';
import { Analyzer } from './components/Analyzer';
import { ImageGenerator } from './components/ImageGenerator';
import { ChatBot } from './components/ChatBot';
import { IconBook, IconImage, IconChat } from './components/Icons';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.ANALYZER);

  const renderContent = () => {
    switch (currentView) {
      case View.ANALYZER:
        return <Analyzer />;
      case View.IMAGE_GEN:
        return <ImageGenerator />;
      case View.CHAT:
        return <ChatBot />;
      default:
        return <Analyzer />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <nav className="w-20 md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 z-20 shadow-sm">
        <div className="flex flex-col">
          <div className="h-20 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-100">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              PG
            </div>
            <span className="ml-3 font-bold text-lg text-slate-800 hidden md:block">Page Genius</span>
          </div>

          <div className="p-4 space-y-2">
            <button 
              onClick={() => setCurrentView(View.ANALYZER)}
              className={`w-full flex items-center justify-center md:justify-start p-3 rounded-xl transition-all duration-200 ${
                currentView === View.ANALYZER 
                  ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-sm ring-1 ring-indigo-200' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <IconBook className="w-6 h-6" />
              <span className="ml-3 hidden md:block">Analyze</span>
            </button>
            
            <button 
              onClick={() => setCurrentView(View.IMAGE_GEN)}
              className={`w-full flex items-center justify-center md:justify-start p-3 rounded-xl transition-all duration-200 ${
                currentView === View.IMAGE_GEN 
                  ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-sm ring-1 ring-indigo-200' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <IconImage className="w-6 h-6" />
              <span className="ml-3 hidden md:block">Illustrate</span>
            </button>
            
            <button 
              onClick={() => setCurrentView(View.CHAT)}
              className={`w-full flex items-center justify-center md:justify-start p-3 rounded-xl transition-all duration-200 ${
                currentView === View.CHAT 
                  ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-sm ring-1 ring-indigo-200' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <IconChat className="w-6 h-6" />
              <span className="ml-3 hidden md:block">Tutor Chat</span>
            </button>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-100">
          <div className="text-xs text-slate-400 text-center md:text-left">
            <p className="hidden md:block">v1.0.0 • Gemini 3.0</p>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden relative">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;