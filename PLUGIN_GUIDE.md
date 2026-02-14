# Plugin Development Guide

## Overview

Note-Flow's plugin system allows you to extend the application's functionality with custom JavaScript/TypeScript code. Plugins can transform text, process data, or add new features.

## Plugin Architecture

### Basic Structure

A plugin is a JavaScript function that follows this pattern:

```javascript
return function(input, config) {
  // Your plugin logic
  return result;
}
```

### Parameters

- **input**: The data passed to your plugin (can be any type)
- **config**: Configuration object for your plugin

### Return Value

Your plugin can return any value type:
- String
- Number
- Object
- Array
- Boolean

## Creating Your First Plugin

### Example: Simple Text Transformer

```javascript
return function(input, config) {
  // Convert text to uppercase
  return input.toUpperCase();
}
```

### Installing the Plugin

Via API:
```bash
curl -X POST http://localhost:3001/api/plugins \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "uppercase",
    "version": "1.0.0",
    "code": "return function(input, config) { return input.toUpperCase(); }",
    "config": {}
  }'
```

### Executing the Plugin

```bash
curl -X POST http://localhost:3001/api/plugins/PLUGIN_ID/execute \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "hello world"
  }'
```

Response:
```json
{
  "result": "HELLO WORLD"
}
```

## Advanced Plugin Examples

### 1. Configurable Text Transformer

```javascript
return function(input, config) {
  let result = input;
  
  if (config.uppercase) {
    result = result.toUpperCase();
  } else if (config.lowercase) {
    result = result.toLowerCase();
  }
  
  if (config.prefix) {
    result = config.prefix + result;
  }
  
  if (config.suffix) {
    result = result + config.suffix;
  }
  
  return result;
}
```

Configuration:
```json
{
  "uppercase": true,
  "prefix": ">> ",
  "suffix": " <<"
}
```

### 2. Markdown Statistics

```javascript
return function(input, config) {
  const lines = input.split('\n');
  const words = input.split(/\s+/).filter(w => w.length > 0);
  const chars = input.length;
  
  // Count headers
  const headers = lines.filter(line => line.trim().startsWith('#')).length;
  
  // Count links
  const links = (input.match(/\[.*?\]\(.*?\)/g) || []).length;
  
  // Count code blocks
  const codeBlocks = (input.match(/```/g) || []).length / 2;
  
  return {
    lines: lines.length,
    words: words.length,
    characters: chars,
    headers: headers,
    links: links,
    codeBlocks: codeBlocks,
    avgWordsPerLine: words.length / lines.length,
    readingTime: Math.ceil(words.length / 200) // Assuming 200 words per minute
  };
}
```

### 3. CSV to Markdown Table

```javascript
return function(input, config) {
  const lines = input.trim().split('\n');
  if (lines.length === 0) return '';
  
  const delimiter = config.delimiter || ',';
  const rows = lines.map(line => line.split(delimiter).map(cell => cell.trim()));
  
  // Create header
  let markdown = '| ' + rows[0].join(' | ') + ' |\n';
  markdown += '| ' + rows[0].map(() => '---').join(' | ') + ' |\n';
  
  // Add data rows
  for (let i = 1; i < rows.length; i++) {
    markdown += '| ' + rows[i].join(' | ') + ' |\n';
  }
  
  return markdown;
}
```

Configuration:
```json
{
  "delimiter": ","
}
```

### 4. Tag Extractor

```javascript
return function(input, config) {
  const tagPattern = config.pattern || /#(\w+)/g;
  const tags = [];
  let match;
  
  while ((match = tagPattern.exec(input)) !== null) {
    if (!tags.includes(match[1])) {
      tags.push(match[1]);
    }
  }
  
  return {
    tags: tags,
    count: tags.length
  };
}
```

### 5. Note Template Generator

```javascript
return function(input, config) {
  const { title, author, date, tags } = input;
  
  let template = `# ${title}\n\n`;
  template += `**Author:** ${author}\n`;
  template += `**Date:** ${date || new Date().toISOString().split('T')[0]}\n`;
  
  if (tags && tags.length > 0) {
    template += `**Tags:** ${tags.map(t => `#${t}`).join(' ')}\n`;
  }
  
  template += '\n---\n\n';
  template += '## Overview\n\n';
  template += '[Write your overview here]\n\n';
  template += '## Details\n\n';
  template += '[Write details here]\n\n';
  template += '## References\n\n';
  template += '- [Reference 1](url)\n';
  
  return template;
}
```

## Plugin Best Practices

### 1. Error Handling

Always handle errors gracefully:

```javascript
return function(input, config) {
  try {
    // Your plugin logic
    return processData(input);
  } catch (error) {
    return {
      error: true,
      message: error.message
    };
  }
}
```

### 2. Input Validation

Validate inputs before processing:

```javascript
return function(input, config) {
  if (typeof input !== 'string') {
    return { error: 'Input must be a string' };
  }
  
  if (input.length === 0) {
    return { error: 'Input cannot be empty' };
  }
  
  // Process input
  return input.toUpperCase();
}
```

### 3. Configuration Defaults

Provide sensible defaults:

```javascript
return function(input, config) {
  const options = {
    maxLength: config.maxLength || 100,
    suffix: config.suffix || '...',
    preserveWords: config.preserveWords !== false
  };
  
  if (input.length <= options.maxLength) {
    return input;
  }
  
  let truncated = input.substring(0, options.maxLength);
  
  if (options.preserveWords) {
    truncated = truncated.substring(0, truncated.lastIndexOf(' '));
  }
  
  return truncated + options.suffix;
}
```

### 4. Documentation

Document your plugin in the config:

```json
{
  "name": "text-truncator",
  "version": "1.0.0",
  "description": "Truncates text to a specified length",
  "config": {
    "maxLength": 100,
    "suffix": "...",
    "preserveWords": true
  },
  "examples": [
    {
      "input": "This is a very long text...",
      "output": "This is a very long..."
    }
  ]
}
```

## Security Considerations

⚠️ **IMPORTANT**: The current plugin system is simplified for demonstration. For production use:

1. **Sandboxing**: Implement proper code sandboxing
2. **Permissions**: Add permission system for plugins
3. **Validation**: Validate plugin code before installation
4. **Rate Limiting**: Limit plugin execution frequency
5. **Timeout**: Add execution timeout
6. **Memory Limits**: Restrict memory usage

### Production-Ready Sandboxing

Consider using:

- **isolated-vm**: Secure isolated contexts
- **vm2**: Enhanced VM module with timeout
- **Web Workers**: Browser-side isolation

Example with timeout:

```javascript
const vm = require('vm');

function executePlugin(code, input, config, timeout = 5000) {
  const sandbox = { input, config, result: null };
  const script = new vm.Script(`result = (${code})(input, config)`);
  const context = vm.createContext(sandbox);
  
  script.runInContext(context, { timeout });
  
  return sandbox.result;
}
```

## Testing Your Plugin

### Manual Testing

1. Install the plugin via API
2. Execute with test inputs
3. Verify output matches expectations

### Automated Testing

Create a test suite:

```javascript
const testCases = [
  { input: 'hello', expected: 'HELLO' },
  { input: 'world', expected: 'WORLD' },
  { input: '', expected: '' }
];

testCases.forEach(test => {
  const result = executePlugin(pluginCode, test.input, {});
  console.assert(result === test.expected, `Failed: ${test.input}`);
});
```

## Plugin Ideas

Here are some plugin ideas to get you started:

1. **Spell Checker**: Check spelling in markdown notes
2. **Link Validator**: Verify all links in a note
3. **Image Optimizer**: Optimize image references
4. **TOC Generator**: Generate table of contents
5. **Export Formatter**: Format notes for export
6. **Code Highlighter**: Add syntax highlighting
7. **Math Renderer**: Render LaTeX equations
8. **Task Manager**: Extract and manage tasks
9. **Timeline Generator**: Create timelines from dates
10. **Search Indexer**: Build custom search index

## Next Steps

1. Review the example plugins
2. Create your first plugin
3. Test it thoroughly
4. Share with the community
5. Contribute to the plugin marketplace (coming soon)

## Resources

- [JavaScript Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Markdown Guide](https://www.markdownguide.org/)
- [Regular Expressions](https://regexr.com/)
- [Note-Flow API Documentation](../README.md#api-documentation)
