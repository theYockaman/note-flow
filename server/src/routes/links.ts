import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, NoteLink } from '../types';

const router = Router();

// Get all links for user's notes
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get all links where both source and target notes belong to the user
    const links = db.prepare(`
      SELECT nl.* FROM note_links nl
      INNER JOIN notes n1 ON nl.source_note_id = n1.id
      INNER JOIN notes n2 ON nl.target_note_id = n2.id
      WHERE n1.user_id = ? AND n2.user_id = ?
    `).all(userId, userId) as NoteLink[];

    res.json(links);
  } catch (error) {
    console.error('Error fetching note links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get links for a specific note
router.get('/note/:noteId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { noteId } = req.params;
    const userId = req.user!.id;

    // Verify note belongs to user
    const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(noteId, userId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const links = db.prepare(`
      SELECT * FROM note_links 
      WHERE source_note_id = ? OR target_note_id = ?
    `).all(noteId, noteId) as NoteLink[];

    res.json(links);
  } catch (error) {
    console.error('Error fetching note links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new link between notes
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { source_note_id, target_note_id } = req.body;

    if (!source_note_id || !target_note_id) {
      return res.status(400).json({ error: 'Source and target note IDs are required' });
    }

    // Verify both notes belong to the user
    const sourceNote = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(source_note_id, userId);
    const targetNote = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(target_note_id, userId);

    if (!sourceNote || !targetNote) {
      return res.status(404).json({ error: 'One or both notes not found' });
    }

    // Check if link already exists
    const existingLink = db.prepare(
      'SELECT * FROM note_links WHERE source_note_id = ? AND target_note_id = ?'
    ).get(source_note_id, target_note_id);

    if (existingLink) {
      return res.status(409).json({ error: 'Link already exists' });
    }

    const linkId = uuidv4();
    db.prepare(`
      INSERT INTO note_links (id, source_note_id, target_note_id)
      VALUES (?, ?, ?)
    `).run(linkId, source_note_id, target_note_id);

    const link = db.prepare('SELECT * FROM note_links WHERE id = ?').get(linkId);
    res.status(201).json(link);
  } catch (error) {
    console.error('Error creating note link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a link
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify link belongs to user's notes
    const link = db.prepare(`
      SELECT nl.* FROM note_links nl
      INNER JOIN notes n1 ON nl.source_note_id = n1.id
      WHERE nl.id = ? AND n1.user_id = ?
    `).get(id, userId);

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    db.prepare('DELETE FROM note_links WHERE id = ?').run(id);
    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Error deleting note link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
