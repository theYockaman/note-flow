import api from './api';
import { Note } from '../types';

export const notesService = {
  async getAll(): Promise<Note[]> {
    const response = await api.get('/notes');
    return response.data;
  },

  async getById(id: string): Promise<Note> {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  async create(note: Partial<Note>): Promise<Note> {
    const response = await api.post('/notes', note);
    return response.data;
  },

  async update(id: string, note: Partial<Note>): Promise<Note> {
    const response = await api.put(`/notes/${id}`, note);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/notes/${id}`);
  },
};
