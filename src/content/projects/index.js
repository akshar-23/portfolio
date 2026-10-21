// Every folder here with an index.mdx is a project. Folders starting with _ are skipped,
// so _template can sit next to the real ones.
const modules = import.meta.glob(['./*/index.mdx', '!./_*/index.mdx'], { eager: true });

export const projects = Object.entries(modules)
  .map(([path, module]) => ({ slug: path.split('/')[1], ...module.meta, Content: module.default }))
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

export const featured = projects.filter((project) => project.featured);
export const archive = projects.filter((project) => !project.featured);
