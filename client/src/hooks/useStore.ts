import { create } from 'zustand';
import { Note, NoteLink, User } from '../types';

interface AppState {
  user: User | null;
  notes: Note[];
  links: NoteLink[];
  selectedNote: Note | null;
  setUser: (user: User | null) => void;
  setNotes: (notes: Note[]) => void;
  setLinks: (links: NoteLink[]) => void;
  setSelectedNote: (note: Note | null) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addLink: (link: NoteLink) => void;
  deleteLink: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  notes: [],
  links: [],
  selectedNote: null,
  setUser: (user) => set({ user }),
  setNotes: (notes) => set({ notes }),
  setLinks: (links) => set({ links }),
  setSelectedNote: (selectedNote) => set({ selectedNote }),
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((note) => (note.id === id ? { ...note, ...updates } : note)),
      selectedNote: state.selectedNote?.id === id ? { ...state.selectedNote, ...updates } : state.selectedNote,
    })),
  deleteNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
    })),
  addLink: (link) => set((state) => ({ links: [...state.links, link] })),
  deleteLink: (id) => set((state) => ({ links: state.links.filter((link) => link.id !== id) })),
}));
