import api from './api';
import { NoteLink } from '../types';

export const linksService = {
  async getAll(): Promise<NoteLink[]> {
    const response = await api.get('/links');
    return response.data;
  },

  async getByNoteId(noteId: string): Promise<NoteLink[]> {
    const response = await api.get(`/links/note/${noteId}`);
    return response.data;
  },

  async create(sourceId: string, targetId: string): Promise<NoteLink> {
    const response = await api.post('/links', {
      source_note_id: sourceId,
      target_note_id: targetId,
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/links/${id}`);
  },
};
