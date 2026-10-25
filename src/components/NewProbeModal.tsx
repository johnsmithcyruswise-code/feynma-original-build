import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const NewProbeModal: React.FC = () => {
  const { isNewProbeModalOpen, setIsNewProbeModalOpen, synthesizeNotes } = useApp();
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('Physics');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isNewProbeModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    await synthesizeNotes(title, notes, domain);
    setIsSubmitting(false);
    setIsNewProbeModalOpen(false);
    setTitle('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-surface-container-lowest dark:bg-surface-container-low rounded-2xl hairline-border p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container dark:border-surface-container-high">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">
              cloud_upload
            </span>
            <h3 className="font-headline-sm text-headline-sm font-bold text-primary dark:text-primary-fixed">
              New Concept Probe Synthesis
            </h3>
          </div>
          <button
            onClick={() => setIsNewProbeModalOpen(false)}
            className="text-outline hover:text-on-surface p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-label-sm font-label-sm text-outline uppercase tracking-wider mb-1">
              Concept / Topic Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bell's Theorem, Attention Mechanism, CRISPR-Cas9"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface-container-low dark:bg-surface-container px-3 py-2 rounded-lg hairline-border text-on-surface text-body-md focus:outline-primary"
            />
          </div>

          <div>
            <label className="block text-label-sm font-label-sm text-outline uppercase tracking-wider mb-1">
              Academic Domain
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full bg-surface-container-low dark:bg-surface-container px-3 py-2 rounded-lg hairline-border text-on-surface text-body-md focus:outline-primary"
            >
              <option value="Physics">Physics</option>
              <option value="Machine Learning">Machine Learning</option>
              <option value="Neuroscience">Neuroscience</option>
              <option value="Distributed Systems">Distributed Systems</option>
              <option value="Biology">Biology</option>
              <option value="Mathematics">Mathematics</option>
            </select>
          </div>

          <div>
            <label className="block text-label-sm font-label-sm text-outline uppercase tracking-wider mb-1">
              Paste Lecture Notes, Paper Abstract, or ArXiv Text
            </label>
            <textarea
              rows={4}
              placeholder="Paste raw textbook excerpt, paper abstract, or lecture transcripts to synthesize into Feynman checkpoints..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-surface-container-low dark:bg-surface-container px-3 py-2 rounded-lg hairline-border text-on-surface text-body-md focus:outline-primary placeholder:text-outline/70"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewProbeModalOpen(false)}
              className="px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container font-label-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-md font-semibold hover:opacity-90 active:scale-95 transition-transform flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              {isSubmitting ? 'Synthesizing...' : 'Synthesize Concept'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
