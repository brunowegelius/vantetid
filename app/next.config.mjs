// Static export for GitHub Pages. Rebuilt daily after Supabase ETL.
const isGithubPages = process.env.DEPLOY_TARGET === 'github-pages';
const repo = 'vantetid';

const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  logging: { fetches: { fullUrl: false } },
  ...(isGithubPages ? { basePath: `/${repo}`, assetPrefix: `/${repo}/` } : {}),
};

export default nextConfig;
