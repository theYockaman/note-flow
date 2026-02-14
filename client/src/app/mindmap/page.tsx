'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { authService } from '../../services/auth';
import { notesService } from '../../services/notes';
import { linksService } from '../../services/links';
import { Note, NoteLink } from '../../types';

export default function MindMapPage() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [notes, setNotesData] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [fetchedNotes, fetchedLinks] = await Promise.all([
        notesService.getAll(),
        linksService.getAll(),
      ]);

      setNotesData(fetchedNotes);

      // Convert notes to ReactFlow nodes
      const flowNodes: Node[] = fetchedNotes.map((note, index) => ({
        id: note.id,
        type: 'default',
        data: {
          label: (
            <div style={{ padding: '10px', minWidth: '150px' }}>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>{note.title}</div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                {note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content}
              </div>
            </div>
          ),
        },
        position: {
          x: note.position_x || (index % 5) * 250,
          y: note.position_y || Math.floor(index / 5) * 200,
        },
      }));

      // Convert links to ReactFlow edges
      const flowEdges: Edge[] = fetchedLinks.map((link) => ({
        id: link.id,
        source: link.source_note_id,
        target: link.target_note_id,
        type: 'smoothstep',
        animated: true,
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      try {
        const newLink = await linksService.create(connection.source, connection.target);
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              id: newLink.id,
              type: 'smoothstep',
              animated: true,
            },
            eds
          )
        );
      } catch (error) {
        console.error('Error creating link:', error);
      }
    },
    [setEdges]
  );

  const handleNodeDragStop = useCallback(
    async (event: React.MouseEvent, node: Node) => {
      try {
        await notesService.update(node.id, {
          position_x: node.position.x,
          position_y: node.position.y,
        });
      } catch (error) {
        console.error('Error updating note position:', error);
      }
    },
    []
  );

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      router.push(`/dashboard?note=${node.id}`);
    },
    [router]
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10,
        background: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px' }}>Mind Map</h2>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn btn-secondary"
        >
          ← Back to Notes
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
