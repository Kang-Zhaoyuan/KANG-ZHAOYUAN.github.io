import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({site:'https://kang-zhaoyuan.github.io', integrations:[sitemap()], vite:{plugins:[tailwindcss()]}, fonts:[
{provider:fontProviders.google(),name:'Fraunces',cssVariable:'--ff-display',weights:['400','500','600'],styles:['normal','italic'],subsets:['latin']},
{provider:fontProviders.google(),name:'Inter',cssVariable:'--ff-body',weights:['400','500','600'],subsets:['latin']},
{provider:fontProviders.google(),name:'Space Mono',cssVariable:'--ff-mono',weights:['400','700'],subsets:['latin']}
]});
