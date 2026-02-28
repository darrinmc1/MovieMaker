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
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const acts = actsData as any[];
  const characters = charactersData as Character[];

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Header & Getting Started */}
        <header className="space-y-6">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-white mb-2">Book Reviewer Editor</h1>
            <p className="text-zinc-400 text-lg">Your AI-powered editorial suite for continuity, pacing, and narrative review.</p>
          </div>

          <div className="bg-blue-950/20 border border-blue-900/30 rounded-2xl p-6">
            <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Getting Started Guide</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-sm mb-3">1</div>
                <h3 className="font-bold text-white tracking-tight">Upload Your Story</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">Drop your .docx or .txt manuscript acts, chapters, and character profiles into the Ingestion engine.</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-sm mb-3">2</div>
                <h3 className="font-bold text-white tracking-tight">Select a Chapter</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">Browse your Project Library below and click "Review" on any uploaded act to open the Editorial Interface.</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-sm mb-3">3</div>
                <h3 className="font-bold text-white tracking-tight">Run AI Evaluator</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">Choose your editor persona and let Gemini 1.5 Flash detect continuity errors and structural issues.</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Navigation */}
        <div className="flex items-center gap-6 border-b border-zinc-800 pb-px">
          <button
            onClick={() => setActiveTab('library')}
            className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'library' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
            Project Library
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'upload' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
            Ingest New Content
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'library' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Character Roster */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold text-white tracking-tight">Story Bible: Characters</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-1.5 rounded-lg border border-emerald-900/50 bg-emerald-950/20"
                  >
                    Upload New ➡
                  </button>
                  <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">{characters.length} entries</span>
                </div>
              </div>
              {characters.length === 0 ? (
                <p className="text-sm text-zinc-500 italic p-6 bg-zinc-900/50 rounded-xl border border-zinc-800/50 text-center">No characters uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {characters.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCharacter(c)}
                      className="text-left p-5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-500 hover:bg-zinc-800 transition-all shadow-xl group"
                    >
                      <h3 className="font-bold text-sm text-emerald-400 truncate group-hover:text-emerald-300 transition-colors">{c.name}</h3>
                      <p className="text-[10px] text-zinc-500 mt-2 font-mono uppercase tracking-widest">ID: {c.id}</p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Acts Library */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold text-white tracking-tight">Manuscript Acts</h2>
                <div className="flex items-center gap-4">
                  <Link href="/series" className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg border border-blue-900/50 bg-blue-950/20">
                    View Series Intelligence ➡
                  </Link>
                  <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">{acts.length} entries</span>
                </div>
              </div>

              {acts.length === 0 ? (
                <p className="text-sm text-zinc-500 italic p-6 bg-zinc-900/50 rounded-xl border border-zinc-800/50 text-center">No manuscript acts uploaded yet.</p>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-950/50">
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Chapter / Act</th>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Versions</th>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Last Updated</th>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {acts.map(act => (
                          <tr key={act.id} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="p-5">
                              <div className="font-bold text-sm text-zinc-200">{act.heading}</div>
                              <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-mono">ID: {act.id}</div>
                            </td>
                            <td className="p-5 text-sm text-zinc-400 font-medium">
                              {act.versions?.length || 1}
                            </td>
                            <td className="p-5 text-xs text-zinc-500 font-mono">
                              {new Date(act.versions?.[act.versions.length - 1]?.createdAt || new Date()).toLocaleString()}
                            </td>
                            <td className="p-5 text-right">
                              <Link
                                href={`/act/${act.id}`}
                                className="inline-block px-5 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all hover:scale-105 shadow-xl shadow-white/5"
                              >
                                Review ➡
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

          </div>
        )}

        {activeTab === 'upload' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight mb-2">Ingest New Documents</h2>
              <p className="text-zinc-400 text-sm">Upload raw .txt or .docx files to automatically parse them into the system schema.</p>
            </div>
            <Uploader />
          </div>
        )}

      </div>

      {/* Character Modal Overlay */}
      {selectedCharacter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
