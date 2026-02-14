'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Plugin {
  id: string;
  name: string;
  version: string;
  enabled: number;
  config: string;
}

const EXAMPLE_PLUGINS = [
  {
    name: 'uppercase',
    version: '1.0.0',
    description: 'Convert text to uppercase',
    code: 'return input.toUpperCase();',
    icon: '🔤',
    category: 'Text Transform',
  },
  {
    name: 'word-counter',
    version: '1.0.0',
    description: 'Count words, characters, and reading time',
    code: `return function(input, config) {
  const words = input.split(/\\s+/).filter(w => w.length > 0);
  const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return {
    words: words.length,
    characters: input.length,
    charactersNoSpaces: input.replace(/\\s/g, '').length,
    sentences: sentences.length,
    paragraphs: input.split(/\\n\\n+/).filter(p => p.trim().length > 0).length,
    readingTime: Math.ceil(words.length / 200) + ' min',
    avgWordLength: Math.round(words.reduce((sum, w) => sum + w.length, 0) / words.length)
  };
}`,
    icon: '📊',
    category: 'Analysis',
  },
  {
    name: 'csv-to-table',
    version: '1.0.0',
    description: 'Convert CSV data to markdown table',
    code: `return function(input, config) {
  const delimiter = config.delimiter || ',';
  const lines = input.trim().split('\\n');
  if (lines.length === 0) return '';
  const rows = lines.map(line => line.split(delimiter).map(cell => cell.trim()));
  let markdown = '| ' + rows[0].join(' | ') + ' |\\n';
  markdown += '| ' + rows[0].map(() => '---').join(' | ') + ' |\\n';
  for (let i = 1; i < rows.length; i++) {
    markdown += '| ' + rows[i].join(' | ') + ' |\\n';
  }
  return markdown;
}`,
    icon: '📋',
    category: 'Conversion',
  },
  {
    name: 'tag-extractor',
    version: '1.0.0',
    description: 'Extract hashtags from text',
    code: `return function(input, config) {
  const tagPattern = /#(\\w+)/g;
  const tags = new Set();
  let match;
  while ((match = tagPattern.exec(input)) !== null) {
    tags.add(match[1]);
  }
  return { count: tags.size, tags: Array.from(tags) };
}`,
    icon: '#️⃣',
    category: 'Analysis',
  },
];

export default function PluginsPage() {
  const router = useRouter();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [selectedForTest, setSelectedForTest] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadPlugins();
  }, [router]);

  const loadPlugins = async () => {
    try {
      const response = await axios.get(`${API_URL}/plugins`);
      setPlugins(response.data);
    } catch (error) {
      console.error('Error loading plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  const installPlugin = async (examplePlugin: typeof EXAMPLE_PLUGINS[0]) => {
    setInstalling(examplePlugin.name);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/plugins`,
        {
          name: examplePlugin.name,
          version: examplePlugin.version,
          code: examplePlugin.code,
          config: {},
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await loadPlugins();
      alert(`${examplePlugin.name} installed successfully!`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to install plugin');
    } finally {
      setInstalling(null);
    }
  };

  const togglePlugin = async (pluginId: string, currentState: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/plugins/${pluginId}`,
        { enabled: currentState === 1 ? 0 : 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadPlugins();
    } catch (error) {
      console.error('Error toggling plugin:', error);
    }
  };

  const testPlugin = async (pluginId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/plugins/${pluginId}/execute`,
        { input: testInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTestResult(response.data.result);
    } catch (error: any) {
      setTestResult({ error: error.response?.data?.error || 'Execution failed' });
    }
  };

  const deletePlugin = async (pluginId: string) => {
    if (!confirm('Are you sure you want to delete this plugin?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/plugins/${pluginId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadPlugins();
    } catch (error) {
      console.error('Error deleting plugin:', error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '20px 32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🔌 Plugin Manager
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => router.push('/dashboard')} className="btn btn-secondary">
              ← Back to Notes
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        {/* Installed Plugins */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px', color: '#333' }}>
            📦 Installed Plugins ({plugins.length})
          </h2>
          
          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <p>Loading plugins...</p>
            </div>
          ) : plugins.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p style={{ fontSize: '18px', color: '#666', marginBottom: '8px' }}>No plugins installed yet</p>
              <p style={{ fontSize: '14px', color: '#999' }}>Install plugins from the gallery below</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {plugins.map((plugin) => (
                <div key={plugin.id} className="card fade-in" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>{plugin.name}</h3>
                      <p style={{ fontSize: '12px', color: '#999' }}>v{plugin.version}</p>
                    </div>
                    <div
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: plugin.enabled === 1 ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : '#e0e0e0',
                        color: plugin.enabled === 1 ? 'white' : '#666',
                      }}
                    >
                      {plugin.enabled === 1 ? '✓ Active' : '○ Inactive'}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => togglePlugin(plugin.id, plugin.enabled)}
                      className="btn"
                      style={{
                        flex: 1,
                        fontSize: '13px',
                        padding: '8px 16px',
                        background: plugin.enabled === 1 ? 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        color: 'white',
                      }}
                    >
                      {plugin.enabled === 1 ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => setSelectedForTest(plugin.id)}
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '13px', padding: '8px 16px' }}
                    >
                      Test
                    </button>
                    <button
                      onClick={() => deletePlugin(plugin.id)}
                      className="btn"
                      style={{
                        fontSize: '13px',
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                        color: 'white',
                      }}
                    >
                      Delete
                    </button>
                  </div>

                  {selectedForTest === plugin.id && (
                    <div style={{ marginTop: '16px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <textarea
                        className="input"
                        placeholder="Enter test input..."
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        style={{ marginBottom: '8px', minHeight: '60px', resize: 'vertical' }}
                      />
                      <button
                        onClick={() => testPlugin(plugin.id)}
                        className="btn btn-primary"
                        style={{ width: '100%', fontSize: '13px', padding: '8px' }}
                      >
                        Execute
                      </button>
                      {testResult && (
                        <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '6px', fontSize: '13px' }}>
                          <strong>Result:</strong>
                          <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {JSON.stringify(testResult, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plugin Gallery */}
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#333' }}>
            🎨 Plugin Gallery
          </h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
            Install pre-built plugins with one click
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {EXAMPLE_PLUGINS.map((examplePlugin) => {
              const isInstalled = plugins.some((p) => p.name === examplePlugin.name);
              
              return (
                <div key={examplePlugin.name} className="card fade-in" style={{
                  border: isInstalled ? '2px solid #11998e' : '2px solid transparent',
                  position: 'relative',
                }}>
                  {isInstalled && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      ✓ Installed
                    </div>
                  )}
                  
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>{examplePlugin.icon}</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>{examplePlugin.name}</h3>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    marginBottom: '12px',
                  }}>
                    {examplePlugin.category}
                  </div>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px', lineHeight: '1.5' }}>
                    {examplePlugin.description}
                  </p>
                  
                  <button
                    onClick={() => installPlugin(examplePlugin)}
                    disabled={isInstalled || installing === examplePlugin.name}
                    className="btn"
                    style={{
                      width: '100%',
                      background: isInstalled 
                        ? '#e0e0e0' 
                        : installing === examplePlugin.name 
                        ? '#999' 
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: isInstalled ? '#999' : 'white',
                      cursor: isInstalled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {installing === examplePlugin.name ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          width: '14px', 
                          height: '14px', 
                          border: '2px solid white', 
                          borderTopColor: 'transparent', 
                          borderRadius: '50%', 
                          animation: 'spin 0.6s linear infinite' 
                        }}></span>
                        Installing...
                      </span>
                    ) : isInstalled ? (
                      '✓ Already Installed'
                    ) : (
                      '+ Install Plugin'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
