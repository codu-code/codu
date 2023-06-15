export function updateImageNodes(nodes: any) {
  for (let node of nodes) {
    if (node.type === 'img') {
      node.children = [{ text: '' }];
    }
  
    if (Array.isArray(node.children)) {
      updateImageNodes(node.children);
    }
  }
}