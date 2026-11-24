const tutorialsHome = 'guides/index';

function containsPage(node, key) {
  if (node.type === 'page') return node.key === key;
  return node.link?.key === key || node.children?.some(child => containsPage(child, key));
}

export function tutorialNavigation(tree, key) {
  if (key === tutorialsHome) return undefined;
  const branch = tree.find(node => containsPage(node, key));
  if (!branch) return undefined;
  const overview = branch.link;
  return {
    overview,
    title: branch.title,
    nodes: branch.children,
  };
}
