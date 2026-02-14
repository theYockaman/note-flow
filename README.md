# Note-Flow

A powerful note-taking application with Obsidian-like markdown support, Notion-like interface, mind mapping capabilities, and an extensible plugin system.

## Features

- 🔐 **User Authentication**: Secure login and registration system
- 📝 **Markdown Notes**: Full markdown support with live preview
- 🎨 **Notion-like Interface**: Clean, intuitive UI for note organization
- 🧠 **Mind Mapping**: Visual representation of notes with drag-and-drop positioning
- 🔗 **Note Linking**: Create connections between notes (Obsidian-style)
- 🔌 **Plugin System**: Extend functionality with JavaScript/TypeScript plugins
- 🌐 **REST API**: Full API access for external integrations
- 📊 **Hierarchical Notes**: Organize notes with parent-child relationships
- 🏷️ **Tags**: Categorize notes with custom tags

## Technology Stack

### Backend
- **Node.js** with **Express**: RESTful API server
- **TypeScript**: Type-safe development
- **SQLite** with **sqlite3**: Lightweight database
- **JWT**: Secure authentication
- **bcryptjs**: Password hashing

### Frontend
- **Next.js 14**: React framework with App Router
- **React**: UI library
- **TypeScript**: Type-safe development
- **ReactFlow**: Mind mapping visualization
- **MDEditor**: Markdown editing with live preview
- **Zustand**: State management
- **Axios**: HTTP client

## Getting Started

### Prerequisites

- Node.js 18+ and npm installed
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/theYockaman/note-flow.git
cd note-flow
```

2. Install dependencies:
```bash
npm run install-all
```

3. Set up environment variables:

For the server, copy the example env file:
```bash
cp server/.env.example server/.env
```

Edit `server/.env` and update the JWT_SECRET:
```
PORT=3001
JWT_SECRET=your-secure-secret-key-here
DB_PATH=./data/noteflow.db
NODE_ENV=development
```

For the client, create `client/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

4. Start the development servers:
```bash
npm run dev
```

This will start:
- Backend API server on http://localhost:3001
- Frontend app on http://localhost:3000

5. Open your browser and navigate to http://localhost:3000

### Building for Production

```bash
# Build both client and server
npm run build

# Start production server
npm start
```

## Project Structure

```
note-flow/
├── server/               # Backend API
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── models/      # Database models
│   │   ├── middleware/  # Auth and other middleware
│   │   ├── types/       # TypeScript types
│   │   └── index.ts     # Server entry point
│   └── package.json
│
├── client/              # Frontend application
│   ├── src/
│   │   ├── app/        # Next.js App Router pages
│   │   ├── components/ # React components
│   │   ├── services/   # API services
│   │   ├── hooks/      # Custom React hooks
│   │   └── types/      # TypeScript types
│   └── package.json
│
└── package.json         # Root package.json
```

## API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

### Notes Endpoints

All notes endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

#### Get All Notes
```http
GET /api/notes
```

#### Get Single Note
```http
GET /api/notes/:id
```

#### Create Note
```http
POST /api/notes
Content-Type: application/json

{
  "title": "My Note",
  "content": "# Note content in markdown",
  "tags": ["tag1", "tag2"],
  "position_x": 100,
  "position_y": 200,
  "parent_id": null
}
```

#### Update Note
```http
PUT /api/notes/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content",
  "tags": ["updated-tag"]
}
```

#### Delete Note
```http
DELETE /api/notes/:id
```

### Links Endpoints (Mind Mapping)

#### Get All Links
```http
GET /api/links
```

#### Get Links for Note
```http
GET /api/links/note/:noteId
```

#### Create Link
```http
POST /api/links
Content-Type: application/json

{
  "source_note_id": "note-id-1",
  "target_note_id": "note-id-2"
}
```

#### Delete Link
```http
DELETE /api/links/:id
```

### Plugins Endpoints

#### Get All Plugins
```http
GET /api/plugins
```

#### Get Single Plugin
```http
GET /api/plugins/:id
```

#### Install Plugin
```http
POST /api/plugins
Content-Type: application/json

{
  "name": "my-plugin",
  "version": "1.0.0",
  "code": "return input.toUpperCase();",
  "config": {}
}
```

#### Update Plugin
```http
PUT /api/plugins/:id
Content-Type: application/json

{
  "enabled": true,
  "config": { "option": "value" }
}
```

#### Execute Plugin
```http
POST /api/plugins/:id/execute
Content-Type: application/json

{
  "input": "some data"
}
```

## Plugin Development

Plugins allow you to extend Note-Flow's functionality with custom JavaScript/TypeScript code.

### Plugin Structure

A plugin is a JavaScript function that receives input and config:

```javascript
// Plugin code
return function(input, config) {
  // Your plugin logic here
  return transformedResult;
}
```

### Example Plugins

#### 1. Text Transformer
```javascript
return function(input, config) {
  if (config.uppercase) {
    return input.toUpperCase();
  }
  return input.toLowerCase();
}
```

#### 2. Word Counter
```javascript
return function(input, config) {
  const words = input.split(/\s+/).filter(w => w.length > 0);
  return {
    wordCount: words.length,
    charCount: input.length,
    avgWordLength: words.reduce((sum, w) => sum + w.length, 0) / words.length
  };
}
```

#### 3. Markdown Table Generator
```javascript
return function(input, config) {
  const rows = input.split('\n').filter(r => r.trim());
  const cols = rows[0].split(',');
  
  let table = '| ' + cols.join(' | ') + ' |\n';
  table += '| ' + cols.map(() => '---').join(' | ') + ' |\n';
  
  rows.slice(1).forEach(row => {
    table += '| ' + row.split(',').join(' | ') + ' |\n';
  });
  
  return table;
}
```

### Installing a Plugin via API

```bash
curl -X POST http://localhost:3001/api/plugins \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "uppercase-plugin",
    "version": "1.0.0",
    "code": "return function(input, config) { return input.toUpperCase(); }",
    "config": {}
  }'
```

## Usage Examples

### Creating Your First Note

1. Register/Login at http://localhost:3000
2. Click "New Note" in the sidebar
3. Edit the title and content
4. Click "Save"

### Using Mind Map

1. Create multiple notes
2. Click "Mind Map" in the sidebar
3. Drag notes to position them
4. Click on a note's output handle and drag to another note to create a connection
5. Click on a note to edit it

### Linking Notes

Notes can be linked together to create a knowledge graph:

1. Create source and target notes
2. Use the Links API to create connections
3. View connections in the Mind Map view

## Security Considerations

⚠️ **Important Security Notes:**

1. **JWT Secret**: Change the default JWT_SECRET in production
2. **Plugin Execution**: The current plugin system uses `new Function()` which can be unsafe. For production, implement proper sandboxing using:
   - `isolated-vm`
   - `vm2`
   - Web Workers with restricted permissions
3. **Input Validation**: Always validate and sanitize user inputs
4. **HTTPS**: Use HTTPS in production
5. **Rate Limiting**: Implement rate limiting for API endpoints

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

- [ ] Real-time collaboration
- [ ] File attachments
- [ ] Export to PDF/HTML
- [ ] Advanced search and filtering
- [ ] Mobile app
- [ ] Plugin marketplace
- [ ] Themes and customization
- [ ] Offline support
- [ ] Version history and snapshots

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/theYockaman/note-flow).