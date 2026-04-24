// Static export for GitHub Pages. The site is rebuilt daily by GitHub Actions
// after the Supabase ETL has run, so numbers stay at most 24 h stale.
const isGithubPages = process.env.DEPLOY_TARGET === 'github-pages';
const repo = 'vantetid';

const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  ...(isGithubPages ? { basePath: `/${repo}`, assetPrefix: `/${repo}/` } : {}),
};

export default nextConfig;
