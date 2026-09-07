import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = resolve(projectRoot, 'dist');
const builtHtmlPath = resolve(distRoot, 'app.html');

let html = await readFile(builtHtmlPath, 'utf8');

const stylesheetMatch = html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
if (!stylesheetMatch) throw new Error('未找到构建后的样式文件');
const stylesheetPath = resolve(distRoot, stylesheetMatch[1].replace(/^\.\//, ''));
const stylesheet = await readFile(stylesheetPath, 'utf8');
html = html.replace(stylesheetMatch[0], () => `<style>${stylesheet}</style>`);

const moduleMatch = html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);
if (!moduleMatch) throw new Error('未找到构建后的脚本文件');
const modulePath = resolve(distRoot, moduleMatch[1].replace(/^\.\//, ''));
let moduleCode = (await readFile(modulePath, 'utf8')).replaceAll('</script', '<\\/script');

const sealData = `data:image/webp;base64,${(await readFile(resolve(projectRoot, 'public/sppm-seal.webp'))).toString('base64')}`;
const teamMarkData = `data:image/svg+xml;base64,${(await readFile(resolve(projectRoot, 'public/nanyong-mark.svg'))).toString('base64')}`;
moduleCode = moduleCode.replaceAll('./sppm-seal.webp', sealData).replaceAll('./nanyong-mark.svg', teamMarkData);
html = html.replaceAll('./nanyong-mark.svg', teamMarkData);

const scenarios = JSON.parse(await readFile(resolve(projectRoot, 'public/data/scenarios.json'), 'utf8'));
const departments = JSON.parse(await readFile(resolve(projectRoot, 'public/data/departments.json'), 'utf8'));
const facts = JSON.parse(await readFile(resolve(projectRoot, 'public/data/facts.json'), 'utf8'));
const embeddedData = JSON.stringify({ scenarios, departments, facts }).replaceAll('</script', '<\\/script');
const inlineScripts = `<script>window.__STATION_DATA__=${embeddedData};</script><script type="module">${moduleCode}</script>`;
html = html.replace(moduleMatch[0], () => inlineScripts);

await writeFile(resolve(projectRoot, 'index.html'), html);
console.log('已生成可直接双击打开的 index.html');
