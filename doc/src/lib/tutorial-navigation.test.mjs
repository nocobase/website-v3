import { expect, test } from 'vitest';
import { getSite } from './site.mjs';
import { tutorialNavigation } from './tutorial-navigation.mjs';

const courses = {
  'team-delivery': ['open-crm-project', 'business-colleagues', 'capture-knowledge', 'enterprise-management', 'release'],
  'core-capabilities': [
    'opportunities-and-quotes', 'sales-workspace', 'team-permissions',
    'quote-approvals', 'file-management', 'template-print',
    'notifications', 'scheduled-reminders', 'email',
    'business-agent', 'ai-assistant', 'data-import', 'external-integrations',
  ],
};

function collectPageKeys(nodes) {
  return nodes.flatMap(node => (
    node.type === 'page' ? [node.key]
      : node.children ? collectPageKeys(node.children)
        : []
  ));
}

test.each(['en', 'zh-CN', 'ja-JP'])('scopes tutorial navigation to the current series in %s', lang => {
  const site = getSite();
  const { tree } = site.sections(lang).find(section => section.id === 'guides');
  expect(tutorialNavigation(tree, 'guides/index')).toBeUndefined();

  for (const [series, slugs] of Object.entries(courses)) {
    const overview = `guides/${series}/index`;
    const courseKeys = slugs.map(slug => `guides/${slug}`);
    for (const key of [overview, ...courseKeys]) {
      const navigation = tutorialNavigation(tree, key);
      expect(navigation.overview.key).toBe(overview);
      expect(navigation.title).toBeTruthy();
      expect(collectPageKeys(navigation.nodes)).toEqual(courseKeys);
      expect(site.page(lang, key).url).toBe(`${site.config.byCode[lang].url}${key.replace(/\/index$/, '')}/`);
    }
  }

  expect(tree.filter(node => node.type === 'folder').map(node => node.dir)).toEqual(
    Object.keys(courses).map(series => `guides/${series}`),
  );
  expect(tree.filter(node => node.type !== 'folder').map(node => node.key)).toEqual(['guides/index']);

  const coreNav = tutorialNavigation(tree, 'guides/core-capabilities/index');
  expect(coreNav.nodes.filter(node => node.type === 'group')).toHaveLength(0);

  const archive = site.sections(lang).find(section => section.id === 'legacy');
  expect(archive.showInNav).toBe(false);
  expect(archive.tree.map(node => node.dir)).toEqual(['legacy/crm', 'legacy/itam']);
  expect(archive.order).toHaveLength(24);
  expect(archive.order).toContain('legacy/crm/create-app');
  expect(archive.order).toContain('legacy/crm/customers-and-follow-ups');
  expect(archive.order).toContain('legacy/crm/agent-team-request');
  expect(archive.order).toContain('legacy/itam/create-app');
});
