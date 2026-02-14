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
    <div style={{ display: 'flex', height: '100vh', background: '#f8f9fa' }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{
          width: '300px',
          background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 16px rgba(0,0,0,0.1)',
        }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}>
                📝
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Note-Flow</h2>
            </div>
            <button
              onClick={handleCreateNote}
              className="btn"
              style={{ 
                width: '100%', 
                marginBottom: '10px',
                background: 'rgba(255,255,255,0.9)',
                color: '#667eea',
                fontWeight: '700',
              }}
            >
              + New Note
            </button>
            <button
              onClick={() => router.push('/mindmap')}
              className="btn"
              style={{ 
                width: '100%',
                marginBottom: '10px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
              }}
            >
              🧠 Mind Map
            </button>
            <button
              onClick={() => router.push('/plugins')}
              className="btn"
              style={{ 
                width: '100%',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
              }}
            >
              🔌 Plugins
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <h3 style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px', padding: '0 12px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>
              Your Notes ({notes.length})
            </h3>
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className="slide-in"
                style={{
                  padding: '14px',
                  marginBottom: '8px',
                  borderRadius: '10px',
                  background: selectedNote?.id === note.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid ' + (selectedNote?.id === note.id ? 'rgba(255,255,255,0.3)' : 'transparent'),
                }}
                onMouseEnter={(e) => {
                  if (selectedNote?.id !== note.id) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedNote?.id !== note.id) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '6px', fontSize: '15px' }}>{note.title}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                  {new Date(note.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={handleLogout}
              className="btn"
              style={{ 
                width: '100%',
                background: 'rgba(235,51,73,0.8)',
                color: 'white',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
        {selectedNote ? (
          <>
            <div style={{
              padding: '24px 32px',
              borderBottom: '1px solid #e0e0e0',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={handleSaveNote}
                style={{
                  flex: 1,
                  fontSize: '28px',
                  fontWeight: '700',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                }}
                placeholder="Untitled Note"
              />
              <button onClick={handleSaveNote} className="btn btn-success">
                💾 Save
              </button>
              <button
                onClick={() => handleDeleteNote(selectedNote.id)}
                className="btn btn-danger"
              >
                🗑️ Delete
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px', background: '#fafafa' }}>
              <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <MDEditor
                  value={editingContent}
                  onChange={(val) => setEditingContent(val || '')}
                  height="calc(100vh - 200px)"
                  preview="live"
                />
              </div>
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
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          }}>
            <div style={{ textAlign: 'center', maxWidth: '500px', padding: '40px' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>📝</div>
              <h2 style={{ fontSize: '36px', marginBottom: '16px', fontWeight: '700', color: '#333' }}>
                Welcome to Note-Flow
              </h2>
              <p style={{ fontSize: '18px', color: '#666', marginBottom: '32px' }}>
                Select a note from the sidebar or create a new one to get started
              </p>
              <button onClick={handleCreateNote} className="btn btn-primary" style={{ fontSize: '16px', padding: '14px 28px' }}>
                + Create Your First Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
