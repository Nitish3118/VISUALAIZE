import { Node, Edge } from 'reactflow';

export function mergeGraph(
  incoming: { nodes: Node[], edges: Edge[] },
  existing: { nodes: Node[], edges: Edge[] },
  preserveAll: boolean = false
): { nodes: Node[], edges: Edge[] } {
  const existingNodeMap = new Map(existing.nodes.map((n) => [n.id, n]));
  const mergedNodeMap = new Map<string, Node>();
  
  if (preserveAll) {
    existing.nodes.forEach(n => mergedNodeMap.set(n.id, n));
  }

  incoming.nodes.forEach((node) => {
    const existingNode = existingNodeMap.get(node.id);
    if (existingNode) {
      mergedNodeMap.set(node.id, { ...node, position: existingNode.position });
    } else {
      mergedNodeMap.set(node.id, node);
    }
  });

  const mergedEdgeMap = new Map<string, Edge>();
  if (preserveAll) {
    existing.edges.forEach(e => mergedEdgeMap.set(e.id, e));
  }
  
  incoming.edges.forEach((edge) => {
    mergedEdgeMap.set(edge.id, edge);
  });

  return {
    nodes: Array.from(mergedNodeMap.values()),
    edges: Array.from(mergedEdgeMap.values()),
  };
}
