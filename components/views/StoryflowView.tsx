import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  MiniMap,
  Background,
  useReactFlow,
} from 'reactflow';
import type { Connection, Edge, Node } from 'reactflow';
import { GoogleGenAI, Type } from '@google/genai';
import CustomSceneNode from '../storyflow/CustomSceneNode';
import { Character } from '../../types';
import { ActivityItemProps } from '../ContextualSmartPanel';
import { ExportIcon } from '../icons/ExportIcon';
import { AddIcon } from '../icons/AddIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { AlertIcon } from '../icons/AlertIcon';

interface StoryflowViewProps {
  characters: Character[];
  addActivity: (activity: Omit<ActivityItemProps, 'time'>) => void;
}

export interface SceneNodeData {
  title: string;
  summary: string;
  chapter?: string;
  characterIds: string[];
  updateNodeData: (id: string, data: Partial<SceneNodeData>) => void;
  allCharacters: Character[];
  onDeleteNode?: (id: string) => void;
  onGenerateScript?: (id: string) => void;
  script?: string;
}

const defaultInitialNodes: Node<SceneNodeData>[] = [
  {
    id: '1',
    type: 'sceneNode',
    position: { x: 300, y: 30 },
    data: {
      title: 'Scene 1: Rooftop Infiltration',
      chapter: 'CHAPTER 1',
      summary: 'Kaira Vance overlooks the neon haze of Sector 4, preparing her neural deck for the Kurogane Tower breach.',
      characterIds: ['char-1'],
      updateNodeData: () => {},
      allCharacters: [],
    },
  },
  {
    id: '2',
    type: 'sceneNode',
    position: { x: 300, y: 320 },
    data: {
      title: 'Scene 2: Ambush in the Server Vault',
      chapter: 'CHAPTER 1',
      summary: 'As Kaira bypasses the ICE security protocols, Cipher-09 emerges from optical cloak in the shadows.',
      characterIds: ['char-1', 'char-2'],
      updateNodeData: () => {},
      allCharacters: [],
    },
  },
];

const defaultInitialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#FF2244', strokeWidth: 3 } },
];

const nodeTypes = {
  sceneNode: CustomSceneNode,
};

const StoryflowContent: React.FC<StoryflowViewProps> = ({ characters, addActivity }) => {
  const { getNode } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultInitialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultInitialEdges);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const updateNodeData = useCallback((id: string, data: Partial<SceneNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...data } } : node))
    );
  }, [setNodes]);

  const handleDeleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      showToast('Deleted scene node.');
      addActivity({
        imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
        userName: 'You',
        action: 'deleted a scene node from Storyflow.',
      });
    },
    [setNodes, setEdges, addActivity]
  );

  const handleGenerateScriptForNode = useCallback(
    async (nodeId: string) => {
      setError(null);
      showToast('Generating scene script with AI...');
      try {
        const targetNode = getNode(nodeId) as Node<SceneNodeData> | undefined;
        if (!targetNode) return;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
        const prompt = `Write a 4-panel comic page script with dialogue for this scene in 'Project: Midnight City':
Scene Title: "${targetNode.data.title}"
Summary: "${targetNode.data.summary}"
Characters in scene: ${targetNode.data.characterIds.map((cid) => characters.find((c) => c.id === cid)?.name || cid).join(', ')}.

Format clearly as:
PANEL 1: [Visual action description]
DIALOGUE: Character: "Quote"
SFX: [Sound effect]`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const scriptText = response.text || '';
        updateNodeData(nodeId, { script: scriptText });
        showToast('Generated 4-panel script for scene!');
        addActivity({
          imgSrc: 'https://picsum.photos/seed/ai-icon/40/40',
          userName: 'Storyflow AI',
          action: `wrote panel script for "${targetNode.data.title}".`,
        });
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to generate script.');
      }
    },
    [getNode, characters, updateNodeData, addActivity]
  );

  // Sync callbacks and characters to nodes without causing redundant re-renders
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (
          n.data.allCharacters === characters &&
          n.data.updateNodeData === updateNodeData &&
          n.data.onDeleteNode === handleDeleteNode &&
          n.data.onGenerateScript === handleGenerateScriptForNode
        ) {
          return n;
        }
        return {
          ...n,
          data: {
            ...n.data,
            allCharacters: characters,
            updateNodeData,
            onDeleteNode: handleDeleteNode,
            onGenerateScript: handleGenerateScriptForNode,
          },
        };
      })
    );
  }, [characters, updateNodeData, handleDeleteNode, handleGenerateScriptForNode, setNodes]);

  const onConnect = useCallback(
    (params: Connection | Edge) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { stroke: '#FF2244', strokeWidth: 3 } }, eds)
      ),
    [setEdges]
  );

  const handleAddNode = useCallback(() => {
    setNodes((nds) => {
      const newNodeId = `${Date.now()}`;
      const lastNode = nds[nds.length - 1];
      const newPos = lastNode
        ? { x: lastNode.position.x + (Math.random() * 40 - 20), y: lastNode.position.y + 260 }
        : { x: 300, y: 100 };

      const newNode: Node<SceneNodeData> = {
        id: newNodeId,
        type: 'sceneNode',
        position: newPos,
        data: {
          title: `Scene ${nds.length + 1}: Next Plot Beat`,
          chapter: `CHAPTER 1`,
          summary: 'Enter a concise description of the conflict or dramatic turning point here.',
          characterIds: [],
          updateNodeData,
          allCharacters: characters,
          onDeleteNode: handleDeleteNode,
          onGenerateScript: handleGenerateScriptForNode,
        },
      };

      if (lastNode) {
        setEdges((eds) =>
          eds.concat({
            id: `e-${lastNode.id}-${newNodeId}`,
            source: lastNode.id,
            target: newNodeId,
            animated: true,
            style: { stroke: '#FF2244', strokeWidth: 3 },
          })
        );
      }

      return nds.concat(newNode);
    });

    showToast('Added new scene node!');
    addActivity({
      imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
      userName: 'You',
      action: `added a new scene node to Storyflow.`,
    });
  }, [characters, updateNodeData, handleDeleteNode, handleGenerateScriptForNode, setNodes, setEdges, addActivity]);

  const handleAiSuggestNextScene = async () => {
    setIsAiSuggesting(true);
    setError(null);

    try {
      const lastNode = nodes[nodes.length - 1];
      const previousScenesContext = nodes
        .map((n, i) => `${i + 1}. [${n.data.title}] - ${n.data.summary}`)
        .join('\n');

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const prompt = `You are a comic book narrative architect for 'Project: Midnight City'.
Previous Scenes in graph:
${previousScenesContext}

Generate the logical, high-tension NEXT SCENE in the storyflow.
Return a JSON object with:
- title: Scene title (e.g. "Scene X: Rooftop Motorcycle Duel")
- summary: 2 concise sentences of what happens, what stakes are raised, and the cliffhanger.
- suggestedCharacterNames: Array of 1-2 character names involved.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              suggestedCharacterNames: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['title', 'summary', 'suggestedCharacterNames'],
          },
        },
      });

      const parsed = JSON.parse(response.text.trim());
      const newNodeId = `scene-ai-${Date.now()}`;
      const newPos = lastNode
        ? { x: lastNode.position.x + (Math.random() * 60 - 30), y: lastNode.position.y + 260 }
        : { x: 300, y: 100 };

      // Link matched character IDs
      const matchedCharIds = characters
        .filter((c) =>
          parsed.suggestedCharacterNames.some((name: string) =>
            c.name.toLowerCase().includes(name.toLowerCase())
          )
        )
        .map((c) => c.id);

      const newNode: Node<SceneNodeData> = {
        id: newNodeId,
        type: 'sceneNode',
        position: newPos,
        data: {
          title: parsed.title,
          chapter: 'CHAPTER 1',
          summary: parsed.summary,
          characterIds: matchedCharIds,
          updateNodeData,
          allCharacters: characters,
          onDeleteNode: handleDeleteNode,
          onGenerateScript: handleGenerateScriptForNode,
        },
      };

      setNodes((nds) => nds.concat(newNode));
      if (lastNode) {
        setEdges((eds) =>
          eds.concat({
            id: `e-${lastNode.id}-${newNodeId}`,
            source: lastNode.id,
            target: newNodeId,
            animated: true,
            style: { stroke: '#FF2244', strokeWidth: 3 },
          })
        );
      }

      showToast(`AI added "${parsed.title}"!`);
      addActivity({
        imgSrc: 'https://picsum.photos/seed/ai-icon/40/40',
        userName: 'Storyflow AI',
        action: `suggested next plot point: "${parsed.title}".`,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to suggest next scene.');
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const handleExport = () => {
    const flowData = {
      exportDate: new Date().toISOString(),
      nodes: nodes.map((n) => ({
        id: n.id,
        position: n.position,
        data: {
          title: n.data.title,
          summary: n.data.summary,
          characterIds: n.data.characterIds,
          script: n.data.script,
        },
      })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    };
    const dataStr = JSON.stringify(flowData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'project_midnight_city_storyflow.json');
    linkElement.click();

    showToast('Exported Storyflow Graph (JSON)!');
    addActivity({
      imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
      userName: 'You',
      action: 'exported the storyflow map.',
    });
  };

  return (
    <div className="h-[calc(100vh-13rem)] w-full relative bg-[#0A0A0F] border-2 border-[#2E2E3A] shadow-[8px_8px_0px_#0A0A0F] overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#1A1A24" gap={24} size={1.5} />
        <Controls className="!bg-[#12121A] !border-2 !border-[#2E2E3A] !text-[#F0EBE1] !rounded-none" />
        <MiniMap
          nodeColor="#FF2244"
          maskColor="rgba(10, 10, 15, 0.85)"
          className="!bg-[#12121A] !border-2 !border-[#2E2E3A] !rounded-none"
        />
      </ReactFlow>

      {/* Floating Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 items-center">
        <button
          onClick={handleAddNode}
          className="flex items-center gap-2 bg-[#1A1A24] hover:bg-[#2A2A38] border-2 border-[#2E2E3A] text-[#F0EBE1] font-mono text-xs font-bold py-2 px-4 shadow-[4px_4px_0px_#0A0A0F] transition-all"
        >
          <AddIcon className="w-4 h-4 text-[#00E5FF]" />
          <span>ADD SCENE NODE</span>
        </button>

        <button
          onClick={handleAiSuggestNextScene}
          disabled={isAiSuggesting}
          className="flex items-center gap-2 bg-[#FF2244] hover:bg-[#FF2244]/80 text-white font-mono text-xs font-bold py-2 px-4 shadow-[4px_4px_0px_#0A0A0F] transition-all disabled:opacity-50"
        >
          {isAiSuggesting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>AI WRITING NEXT SCENE...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="w-4 h-4" />
              <span>AI NEXT SCENE</span>
            </>
          )}
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-[#1A1A24] hover:bg-[#2A2A38] border-2 border-[#2E2E3A] text-[#C8C0B8] font-mono text-xs font-bold py-2 px-4 shadow-[4px_4px_0px_#0A0A0F] transition-all"
        >
          <ExportIcon className="w-4 h-4 text-[#00E5FF]" />
          <span>EXPORT GRAPH</span>
        </button>
      </div>

      {/* Floating Notifications */}
      {notification && (
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-4 py-2 bg-[#00E5FF]/10 border-2 border-[#00E5FF] text-[#00E5FF] font-mono text-xs shadow-[4px_4px_0px_#0A0A0F] animate-fade-in">
          <CheckIcon className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-4 py-2 bg-[#FF2244]/10 border-2 border-[#FF2244] text-[#FF2244] font-mono text-xs shadow-[4px_4px_0px_#0A0A0F]">
          <AlertIcon className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const StoryflowView: React.FC<StoryflowViewProps> = (props) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b-2 border-[#2E2E3A] pb-3">
        <span className="w-3 h-8 bg-[#FF2244]"></span>
        <div>
          <h2 className="font-display text-4xl font-extrabold text-[#F0EBE1] uppercase tracking-wider">
            THE CONSPIRACY BOARD // STORYFLOW
          </h2>
          <p className="font-mono text-xs text-[#8E8A84] mt-0.5">
            Node-based narrative map with red string connections and AI scene script synthesis.
          </p>
        </div>
      </div>
      <ReactFlowProvider>
        <StoryflowContent {...props} />
      </ReactFlowProvider>
    </div>
  );
};


export default StoryflowView;
