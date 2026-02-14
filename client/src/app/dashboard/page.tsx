'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { authService } from '../../services/auth';
import { notesService } from '../../services/notes';
import { useStore } from '../../hooks/useStore';
import { Note } from '../../types';

// Dynamically import markdown editor to avoid SSR issues
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

export default function DashboardPage() {
  const router = useRouter();
  const { notes, selectedNote, setNotes, setSelectedNote, addNote, updateNote, deleteNote } = useStore();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadNotes();
  }, [router]);

  useEffect(() => {
    if (selectedNote) {
      setEditingTitle(selectedNote.title);
      setEditingContent(selectedNote.content);
    }
  }, [selectedNote]);

  const loadNotes = async () => {
    try {
      const fetchedNotes = await notesService.getAll();
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      const newNote = await notesService.create({
        title: 'Untitled Note',
        content: '# New Note\n\nStart writing here...',
        tags: [],
      });
      addNote(newNote);
      setSelectedNote(newNote);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;

    try {
      await notesService.update(selectedNote.id, {
        title: editingTitle,
        content: editingContent,
      });
      updateNote(selectedNote.id, {
        title: editingTitle,
        content: editingContent,
      });
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await notesService.delete(noteId);
      deleteNote(noteId);
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{
          width: '280px',
          background: '#2c2c2c',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #444' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px' }}>Note-Flow</h2>
            <button
              onClick={handleCreateNote}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '10px' }}
            >
              + New Note
            </button>
            <button
              onClick={() => router.push('/mindmap')}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              🧠 Mind Map
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            <h3 style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px', padding: '0 10px' }}>
              Your Notes ({notes.length})
            </h3>
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                style={{
                  padding: '12px',
                  marginBottom: '5px',
                  borderRadius: '6px',
                  background: selectedNote?.id === note.id ? '#444' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (selectedNote?.id !== note.id) {
                    e.currentTarget.style.background = '#333';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedNote?.id !== note.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>{note.title}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {new Date(note.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '20px', borderTop: '1px solid #444' }}>
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedNote ? (
          <>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #ddd',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={handleSaveNote}
                style={{
                  flex: 1,
                  fontSize: '24px',
                  fontWeight: '600',
                  border: 'none',
                  outline: 'none',
                }}
              />
              <button onClick={handleSaveNote} className="btn btn-primary">
                Save
              </button>
              <button
                onClick={() => handleDeleteNote(selectedNote.id)}
                className="btn btn-secondary"
              >
                Delete
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              <MDEditor
                value={editingContent}
                onChange={(val) => setEditingContent(val || '')}
                height="100%"
                preview="live"
              />
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#999',
          }}>
            <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>Welcome to Note-Flow</h2>
            <p style={{ fontSize: '18px' }}>Select a note or create a new one to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
