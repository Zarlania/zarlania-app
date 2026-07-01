import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const publicDir = join(__dirname, '..', '..', 'public');

describe('SEO static assets', () => {
  it('robots.txt allows crawling and points at the sitemap', () => {
    const robots = readFileSync(join(publicDir, 'robots.txt'), 'utf8');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Sitemap: https://zarlania.com/sitemap.xml');
  });

  it('sitemap.xml lists the landing URL', () => {
    const sitemap = readFileSync(join(publicDir, 'sitemap.xml'), 'utf8');
    expect(sitemap).toContain('<loc>https://zarlania.com/</loc>');
  });
});
