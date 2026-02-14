// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { initDatabase } from './models/database';

// Import routes
import authRoutes from './routes/auth';
import notesRoutes from './routes/notes';
import linksRoutes from './routes/links';
import pluginsRoutes from './routes/plugins';

// Initialize database
initDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/plugins', pluginsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Note-Flow API',
    version: '1.0.0',
    description: 'API for Note-Flow - A powerful note-taking app',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
      },
      notes: {
        'GET /api/notes': 'Get all notes for authenticated user',
        'GET /api/notes/:id': 'Get a specific note',
        'POST /api/notes': 'Create a new note',
        'PUT /api/notes/:id': 'Update a note',
        'DELETE /api/notes/:id': 'Delete a note',
      },
      links: {
        'GET /api/links': 'Get all note links',
        'GET /api/links/note/:noteId': 'Get links for a specific note',
        'POST /api/links': 'Create a new link between notes',
        'DELETE /api/links/:id': 'Delete a link',
      },
      plugins: {
        'GET /api/plugins': 'Get all plugins',
        'GET /api/plugins/:id': 'Get a specific plugin',
        'POST /api/plugins': 'Install a new plugin',
        'PUT /api/plugins/:id': 'Update plugin configuration',
        'DELETE /api/plugins/:id': 'Delete a plugin',
        'POST /api/plugins/:id/execute': 'Execute a plugin',
      },
    },
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api/docs`);
});

export default app;
