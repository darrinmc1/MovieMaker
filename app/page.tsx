'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import charactersData from '@/data/characters.json';
import actsData from '@/data/acts.json';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import outlinesData from '@/data/outlines.json';
import Uploader from '@/components/Uploader';

import { Character } from '@/types';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<'library' | 'characters' | 'upload'>('library');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const acts = actsData as any[];
  const characters = charactersData as Character[];

  // Group acts by book
  const actsByBook = acts.reduce((acc, act) => {
    const bookId = act.bookId || 'book-1';
    if (!acc[bookId]) acc[bookId] = [];
    acc[bookId].push(act);
    return acc;
  }, {} as Record<string, any[]>);

  const sidebarItems = [
    { id: 'library', label: 'Library', icon: '📚', count: acts.length },
    { id: 'characters', label: 'Characters', icon: '👥', count: characters.length },
    { id: 'upload', label: 'Upload New', icon: '⬆️' },
  ];

  return (
    <main className="min-h-screen bg-black text-zinc-100 flex font-sans">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-zinc-950 border-r border-zinc-800 transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-zinc-800">
          {sidebarOpen && <h2 className="text-lg font-black text-white tracking-tighter">EDITOR</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-zinc-900 rounded-lg transition-colors text-zinc-400 hover:text-white"
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                activeSection === item.id
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {sidebarOpen && (
                <div className="flex-1">
                  <div className="text-sm font-bold">{item.label}</div>
                  {item.count !== undefined && (
                    <div className="text-xs text-zinc-500">{item.count} items</div>
                  )}
                </div>
              )}
              {!sidebarOpen && item.count !== undefined && (
                <div className="absolute left-20 bg-zinc-900 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none">
                  {item.count}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-2">
          <button className="w-full px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg transition-colors">
            {sidebarOpen ? '⚙️ Settings' : '⚙️'}
          </button>
          <button className="w-full px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg transition-colors">
            {sidebarOpen ? '❓ Help' : '❓'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8 space-y-8">

        {/* Header */}
        <header className="space-y-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
              {activeSection === 'library' && '📚 Project Library'}
              {activeSection === 'characters' && '👥 Story Bible: Characters'}
              {activeSection === 'upload' && '⬆️ Upload New Content'}
            </h1>
            <p className="text-zinc-400 text-sm">
              {activeSection === 'library' && 'Manage your manuscript acts and chapters'}
              {activeSection === 'characters' && 'View and manage your character database'}
              {activeSection === 'upload' && 'Add new acts or character profiles to your project'}
            </p>
          </div>
        </header>

        {/* Library Section */}
        {activeSection === 'library' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Total Acts</div>
                <div className="text-3xl font-black text-white">{acts.length}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Total Characters</div>
                <div className="text-3xl font-black text-white">{characters.length}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Total Versions</div>
                <div className="text-3xl font-black text-white">{acts.reduce((sum, a) => sum + (a.versions?.length || 1), 0)}</div>
              </div>
              <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-xl">
                <div className="text-blue-400 text-xs font-bold uppercase mb-1">Last Updated</div>
                <div className="text-sm text-blue-200 font-mono">Today</div>
              </div>
            </div>

            {/* Acts by Book */}
            {Object.entries(actsByBook).map(([bookId, bookActs]) => (
              <section key={bookId} className="space-y-4">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Book {bookId.replace('book', '')} — {bookActs.length} act{bookActs.length !== 1 ? 's' : ''}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bookActs.map(act => (
                    <div key={act.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all hover:shadow-lg hover:shadow-white/5 group">
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors">{act.heading}</h3>
                          <p className="text-xs text-zinc-500 mt-1">{act.id}</p>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">
                            {act.versions?.length || 1} version{(act.versions?.length || 1) !== 1 ? 's' : ''}
                          </span>
                          <span className="text-zinc-600 font-mono">
                            {new Date(act.versions?.[act.versions.length - 1]?.createdAt || new Date()).toLocaleDateString()}
                          </span>
                        </div>

                        <Link
                          href={`/act/${act.id}`}
                          className="block w-full px-4 py-2.5 bg-white text-black text-xs font-black uppercase tracking-widest rounded-lg hover:bg-zinc-100 transition-all text-center"
                        >
                          Review Act ➡
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {acts.length === 0 && (
              <div className="text-center p-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                <p className="text-zinc-400 mb-4">No acts uploaded yet.</p>
                <button
                  onClick={() => setActiveSection('upload')}
                  className="px-6 py-3 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-100 transition-all"
                >
                  Upload Your First Act
                </button>
              </div>
            )}
          </div>
        )}

        {/* Characters Section */}
        {activeSection === 'characters' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters.length === 0 ? (
                <div className="col-span-full text-center p-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                  <p className="text-zinc-400 mb-4">No characters in your story bible yet.</p>
                  <button
                    onClick={() => setActiveSection('upload')}
                    className="px-6 py-3 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-100 transition-all"
                  >
                    Upload Character Profiles
                  </button>
                </div>
              ) : (
                characters.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCharacter(c)}
                    className="text-left p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-emerald-500 hover:bg-zinc-800 transition-all shadow-lg group"
                  >
                    <h3 className="font-bold text-lg text-emerald-400 group-hover:text-emerald-300 transition-colors mb-3">{c.name}</h3>
                    
                    {c.core_want && c.core_want !== "Not specified" && (
                      <div className="mb-3">
                        <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Core Want</div>
                        <p className="text-xs text-zinc-300 line-clamp-2">{c.core_want}</p>
                      </div>
                    )}
                    
                    {c.core_flaw && c.core_flaw !== "Not specified" && (
                      <div>
                        <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Core Flaw</div>
                        <p className="text-xs text-zinc-300 line-clamp-2">{c.core_flaw}</p>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Upload Section */}
        {activeSection === 'upload' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
            <Uploader />
          </div>
        )}

      </div>

        </div>
      </div>

      {/* Character Modal Overlay */}
      {selectedCharacter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h3 className="text-2xl font-black text-emerald-400 tracking-tight">{selectedCharacter.name}</h3>
                <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mt-1">ID: {selectedCharacter.id}</p>
              </div>
              <button
                onClick={() => setSelectedCharacter(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6">
              {selectedCharacter.core_want !== "Not specified" && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Core Want</h4>
                  <p className="text-sm text-zinc-200 font-medium">{selectedCharacter.core_want}</p>
                </div>
              )}
              {selectedCharacter.core_flaw !== "Not specified" && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Core Flaw</h4>
                  <p className="text-sm text-zinc-200 font-medium">{selectedCharacter.core_flaw}</p>
                </div>
              )}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Current Narrative State / Profile
                </h4>
                <div className="text-sm text-zinc-300 leading-relaxed font-serif bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50 whitespace-pre-wrap">
                  {selectedCharacter.current_state}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
