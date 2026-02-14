# Example Plugins for Note-Flow

This directory contains example plugins to demonstrate the Note-Flow plugin system.

## Available Example Plugins

### 1. Uppercase Transformer

**Description**: Converts text to uppercase
**Version**: 1.0.0

**Plugin Code**:
```javascript
return input.toUpperCase();
```

**Installation**:
```bash
curl -X POST http://localhost:3001/api/plugins \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "uppercase",
    "version": "1.0.0",
    "code": "return input.toUpperCase();",
    "config": {}
  }'
```

**Usage**:
```bash
curl -X POST http://localhost:3001/api/plugins/PLUGIN_ID/execute \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "hello world"}'
```

**Result**: `"HELLO WORLD"`

---

### 2. Word Counter

**Description**: Counts words, characters, and calculates reading time
**Version**: 1.0.0

**Plugin Code**:
```javascript
return function(input, config) {
  const words = input.split(/\s+/).filter(w => w.length > 0);
  const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  return {
    words: words.length,
    characters: input.length,
    charactersNoSpaces: input.replace(/\s/g, '').length,
    sentences: sentences.length,
    paragraphs: input.split(/\n\n+/).filter(p => p.trim().length > 0).length,
    readingTime: Math.ceil(words.length / 200) + ' min',
    avgWordLength: Math.round(words.reduce((sum, w) => sum + w.length, 0) / words.length)
  };
}
```

**Installation**:
```bash
curl -X POST http://localhost:3001/api/plugins \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "word-counter",
    "version": "1.0.0",
    "code": "return function(input, config) { const words = input.split(/\\s+/).filter(w => w.length > 0); const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0); return { words: words.length, characters: input.length, charactersNoSpaces: input.replace(/\\s/g, \"\").length, sentences: sentences.length, paragraphs: input.split(/\\n\\n+/).filter(p => p.trim().length > 0).length, readingTime: Math.ceil(words.length / 200) + \" min\", avgWordLength: Math.round(words.reduce((sum, w) => sum + w.length, 0) / words.length) }; }",
    "config": {}
  }'
```

---

### 3. CSV to Markdown Table

**Description**: Converts CSV data to a markdown table
**Version**: 1.0.0

**Plugin Code**:
```javascript
return function(input, config) {
  const delimiter = config.delimiter || ',';
  const lines = input.trim().split('\n');
  if (lines.length === 0) return '';
  
  const rows = lines.map(line => 
    line.split(delimiter).map(cell => cell.trim())
  );
  
  let markdown = '| ' + rows[0].join(' | ') + ' |\n';
  markdown += '| ' + rows[0].map(() => '---').join(' | ') + ' |\n';
  
  for (let i = 1; i < rows.length; i++) {
    markdown += '| ' + rows[i].join(' | ') + ' |\n';
  }
  
  return markdown;
}
```

**Configuration**:
```json
{
  "delimiter": ","
}
```

**Example Input**:
```
Name,Age,City
John,25,New York
Jane,30,San Francisco
Bob,35,Chicago
```

**Result**:
```markdown
| Name | Age | City |
| --- | --- | --- |
| John | 25 | New York |
| Jane | 30 | San Francisco |
| Bob | 35 | Chicago |
```

---

### 4. Markdown Link Extractor

**Description**: Extracts all markdown links from text
**Version**: 1.0.0

**Plugin Code**:
```javascript
return function(input, config) {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match;
  
  while ((match = linkPattern.exec(input)) !== null) {
    links.push({
      text: match[1],
      url: match[2]
    });
  }
  
  return {
    count: links.length,
    links: links
  };
}
```

---

### 5. Tag Extractor

**Description**: Extracts hashtags from text
**Version**: 1.0.0

**Plugin Code**:
```javascript
return function(input, config) {
  const tagPattern = /#(\w+)/g;
  const tags = new Set();
  let match;
  
  while ((match = tagPattern.exec(input)) !== null) {
    tags.add(match[1]);
  }
  
  return {
    count: tags.size,
    tags: Array.from(tags)
  };
}
```

---

### 6. Note Template Generator

**Description**: Generates a structured note template
**Version**: 1.0.0

**Plugin Code**:
```javascript
return function(input, config) {
  const { title, tags = [], author = 'Unknown' } = input;
  const date = new Date().toISOString().split('T')[0];
  
  let template = `# ${title}\n\n`;
  template += `**Author:** ${author}\n`;
  template += `**Date:** ${date}\n`;
  
  if (tags.length > 0) {
    template += `**Tags:** ${tags.map(t => '#' + t).join(' ')}\n`;
  }
  
  template += '\n---\n\n';
  template += '## Summary\n\n';
  template += '[Brief summary here]\n\n';
  template += '## Details\n\n';
  template += '[Detailed content here]\n\n';
  template += '## Action Items\n\n';
  template += '- [ ] Task 1\n';
  template += '- [ ] Task 2\n\n';
  template += '## References\n\n';
  template += '- [Reference 1](url)\n';
  
  return template;
}
```

**Example Input**:
```json
{
  "title": "Project Meeting Notes",
  "tags": ["meeting", "project", "q1"],
  "author": "John Doe"
}
```

---

### 7. Text Summarizer (Simple)

**Description**: Creates a simple summary by extracting first sentences
**Version**: 1.0.0

**Plugin Code**:
```javascript
return function(input, config) {
  const maxSentences = config.maxSentences || 3;
  const sentences = input
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  const summary = sentences
    .slice(0, maxSentences)
    .join('. ') + '.';
  
  return {
    original: input,
    originalLength: input.length,
    summary: summary,
    summaryLength: summary.length,
    reductionPercent: Math.round((1 - summary.length / input.length) * 100)
  };
}
```

---

### 8. Code Block Extractor

**Description**: Extracts code blocks from markdown
**Version**: 1.0.0

**Plugin Code**:
```javascript
return function(input, config) {
  const codeBlockPattern = /```(\w*)\n([\s\S]*?)```/g;
  const blocks = [];
  let match;
  
  while ((match = codeBlockPattern.exec(input)) !== null) {
    blocks.push({
      language: match[1] || 'plaintext',
      code: match[2].trim()
    });
  }
  
  return {
    count: blocks.length,
    blocks: blocks
  };
}
```

---

## Installation Script

To install all example plugins at once:

```bash
#!/bin/bash
TOKEN="YOUR_JWT_TOKEN"
API_URL="http://localhost:3001/api"

# Install uppercase plugin
curl -X POST $API_URL/plugins \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "uppercase",
    "version": "1.0.0",
    "code": "return input.toUpperCase();",
    "config": {}
  }'

# Install word counter plugin
curl -X POST $API_URL/plugins \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "word-counter",
    "version": "1.0.0",
    "code": "return function(input, config) { const words = input.split(/\\s+/).filter(w => w.length > 0); const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0); return { words: words.length, characters: input.length, charactersNoSpaces: input.replace(/\\s/g, \"\").length, sentences: sentences.length, paragraphs: input.split(/\\n\\n+/).filter(p => p.trim().length > 0).length, readingTime: Math.ceil(words.length / 200) + \" min\", avgWordLength: Math.round(words.reduce((sum, w) => sum + w.length, 0) / words.length) }; }",
    "config": {}
  }'

echo "Plugins installed successfully!"
```

## Using Plugins

### Via API

```bash
# 1. Get your authentication token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  | jq -r '.token')

# 2. List available plugins
curl -s http://localhost:3001/api/plugins | jq

# 3. Execute a plugin
curl -s -X POST http://localhost:3001/api/plugins/PLUGIN_ID/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input":"your text here"}' | jq
```

### Via Frontend

1. Login to the Note-Flow application
2. Navigate to Settings > Plugins
3. Browse available plugins
4. Click "Execute" on any plugin
5. Enter your input
6. View the result

## Contributing

Want to contribute your own plugin? Follow these steps:

1. Create your plugin following the structure above
2. Test it thoroughly
3. Add it to this document
4. Submit a pull request

## Security Note

⚠️ Remember that plugins execute arbitrary code. Only install plugins from trusted sources and review the code before installation. For production use, implement proper sandboxing.
