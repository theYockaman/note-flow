import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// Get all plugins
router.get('/', (req, res: Response) => {
  try {
    const plugins = db.prepare('SELECT id, name, version, enabled, config FROM plugins').all();
    res.json(plugins);
  } catch (error) {
    console.error('Error fetching plugins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single plugin
router.get('/:id', (req, res: Response) => {
  try {
    const { id } = req.params;
    const plugin = db.prepare('SELECT * FROM plugins WHERE id = ?').get(id);

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    res.json(plugin);
  } catch (error) {
    console.error('Error fetching plugin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Install a new plugin (admin only - simplified for now)
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name, version, code, config = {} } = req.body;

    if (!name || !version || !code) {
      return res.status(400).json({ error: 'Name, version, and code are required' });
    }

    // Check if plugin already exists
    const existingPlugin = db.prepare('SELECT * FROM plugins WHERE name = ?').get(name);
    if (existingPlugin) {
      return res.status(409).json({ error: 'Plugin with this name already exists' });
    }

    const pluginId = uuidv4();
    db.prepare(`
      INSERT INTO plugins (id, name, version, code, config)
      VALUES (?, ?, ?, ?, ?)
    `).run(pluginId, name, version, code, JSON.stringify(config));

    const plugin = db.prepare('SELECT * FROM plugins WHERE id = ?').get(pluginId);
    res.status(201).json(plugin);
  } catch (error) {
    console.error('Error creating plugin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update plugin configuration
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { enabled, config } = req.body;

    const existingPlugin = db.prepare('SELECT * FROM plugins WHERE id = ?').get(id);
    if (!existingPlugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(enabled ? 1 : 0);
    }
    if (config !== undefined) {
      updates.push('config = ?');
      values.push(JSON.stringify(config));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    db.prepare(`UPDATE plugins SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const plugin = db.prepare('SELECT * FROM plugins WHERE id = ?').get(id);
    res.json(plugin);
  } catch (error) {
    console.error('Error updating plugin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a plugin
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM plugins WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    res.json({ message: 'Plugin deleted successfully' });
  } catch (error) {
    console.error('Error deleting plugin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Execute a plugin (simplified example)
router.post('/:id/execute', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { input } = req.body;

    const plugin: any = db.prepare('SELECT * FROM plugins WHERE id = ? AND enabled = 1').get(id);

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found or disabled' });
    }

    // WARNING: This is a simplified example. In production, you should use a
    // sandboxed environment like vm2 or isolated-vm to execute user code safely
    try {
      const pluginFunction = new Function('input', 'config', plugin.code);
      const result = pluginFunction(input, JSON.parse(plugin.config));
      res.json({ result });
    } catch (execError) {
      console.error('Plugin execution error:', execError);
      res.status(500).json({ error: 'Plugin execution failed', details: String(execError) });
    }
  } catch (error) {
    console.error('Error executing plugin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
