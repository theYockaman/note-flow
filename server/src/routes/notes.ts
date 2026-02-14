import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../models/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, Note } from '../types';

const router = Router();

// Get all notes for the authenticated user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const notes = (await dbAll('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [userId])) as Note[];
    
    // Parse tags from JSON string
    const parsedNotes = notes.map(note => ({
      ...note,
      tags: JSON.parse(note.tags as any || '[]')
    }));

    res.json(parsedNotes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single note by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const note = (await dbGet('SELECT * FROM notes WHERE id = ? AND user_id = ?', [id, userId])) as Note | undefined;

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Parse tags from JSON string
    const parsedNote = {
      ...note,
      tags: JSON.parse(note.tags as any || '[]')
    };

    res.json(parsedNote);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new note
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, content, tags = [], position_x, position_y, parent_id } = req.body;

    if (!title || content === undefined) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const noteId = uuidv4();
    const tagsJson = JSON.stringify(tags);
    
    await dbRun(`
      INSERT INTO notes (id, user_id, title, content, tags, position_x, position_y, parent_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [noteId, userId, title, content, tagsJson, position_x, position_y, parent_id]);

    const note = (await dbGet('SELECT * FROM notes WHERE id = ?', [noteId])) as Note;
    const parsedNote = {
      ...note,
      tags: JSON.parse(note.tags as any || '[]')
    };

    res.status(201).json(parsedNote);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a note
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { title, content, tags, position_x, position_y, parent_id } = req.body;

    // Verify note belongs to user
    const existingNote = await dbGet('SELECT * FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(tags));
    }
    if (position_x !== undefined) {
      updates.push('position_x = ?');
      values.push(position_x);
    }
    if (position_y !== undefined) {
      updates.push('position_y = ?');
      values.push(position_y);
    }
    if (parent_id !== undefined) {
      updates.push('parent_id = ?');
      values.push(parent_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push("updated_at = datetime('now')");
    values.push(id, userId);

    await dbRun(`UPDATE notes SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, values);

    const note = (await dbGet('SELECT * FROM notes WHERE id = ?', [id])) as Note;
    const parsedNote = {
      ...note,
      tags: JSON.parse(note.tags as any || '[]')
    };

    res.json(parsedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a note
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await dbRun('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, userId]);

    if ((result as any).changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
