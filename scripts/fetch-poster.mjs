import { mkdir, writeFile } from 'node:fs/promises';

const url = 'https://raw.githubusercontent.com/Kang-Zhaoyuan/Flipo_Flip/main/03_%E7%AD%94%E8%BE%A9%E4%B8%8E%E6%B1%87%E6%8A%A5/v2_%E7%AD%94%E8%BE%A9%E4%B8%8E%E6%B1%87%E6%8A%A5/References_On_PPT_Making/Experiment_PPT_Figures/Video_Tracking_Poster.png';
const response = await fetch(url);
if (!response.ok) throw new Error(`Image download failed: ${response.status}`);
const data = new Uint8Array(await response.arrayBuffer());
if (data.length < 100000 || data[0] !== 137 || data[1] !== 80 || data[2] !== 78 || data[3] !== 71) {
  throw new Error('Invalid poster image');
}
await mkdir('public/media', { recursive: true });
await writeFile('public/media/flipo-poster.png', data);
