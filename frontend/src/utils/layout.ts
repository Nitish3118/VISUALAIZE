// frontend/src/utils/layout.ts
import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';

// We increase these values to prevent overlap
const PAGE_WIDTH = 250; 
const PAGE_HEIGHT = 80;

export const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: 'TB',
    nodesep: 80, 
    ranksep: 180, 
    edgesep: 30, 
    ranker: 'tight-tree', 
    acyclicer: 'greedy', 
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: PAGE_WIDTH, height: PAGE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target, { weight: 1 });
  });

  dagre.layout(dagreGraph);

  // --- 1. Layer Assignment Logic ---
  const getLayer = (label: string): number => {
    const lower = label.toLowerCase();
    if (lower.match(/client|admin|user|web|frontend|app|browser|ui/)) return 0;
    if (lower.match(/gateway|proxy|balancer|nginx|api/)) return 1;
    if (lower.match(/db|database|redis|cache|queue|kafka|mongo|postgres|sql|storage|bucket/)) return 3;
    return 2; // Core Services
  };

  const layers: Record<number, Node[]> = { 0: [], 1: [], 2: [], 3: [] };

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const layerIdx = getLayer((node.data?.label as string) || '');
    
    // Temporarily store Dagre's X for sorting (to minimize crossings)
    layers[layerIdx].push({
      ...node,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      position: { x: nodeWithPosition.x, y: 0 }, 
    });
  });

  // --- 2. Post-Layout Position Correction for Symmetry ---
  const layoutedNodes: Node[] = [];
  const LAYER_SPACING_Y = 220; // Consistent vertical gap
  const NODE_SPACING_X = 80;   // Consistent horizontal gap

  Object.keys(layers).forEach((key) => {
    const layerIndex = parseInt(key);
    const layerNodes = layers[layerIndex];
    
    if (layerNodes.length === 0) return;

    // Sort by Dagre's computed X to preserve edge-crossing minimization
    layerNodes.sort((a, b) => a.position.x - b.position.x);

    const totalWidth = (layerNodes.length * PAGE_WIDTH) + ((layerNodes.length - 1) * NODE_SPACING_X);
    let currentX = -(totalWidth / 2) + (PAGE_WIDTH / 2);

    layerNodes.forEach((node) => {
      layoutedNodes.push({
        ...node,
        position: {
          x: currentX,
          y: layerIndex * LAYER_SPACING_Y,
        }
      });
      currentX += PAGE_WIDTH + NODE_SPACING_X;
    });
  });

  return { nodes: layoutedNodes, edges };
};