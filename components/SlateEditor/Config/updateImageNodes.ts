// slate is expecting objects with type: img to also
// have a node.children = [{ text: '' }] attr
// something in the deserialization process from html back to slate
// is messing this up.

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