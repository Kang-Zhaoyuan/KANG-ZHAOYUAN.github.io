import {defineCollection} from 'astro:content';
import {glob} from 'astro/loaders';
import {z} from 'astro/zod';
const work=defineCollection({loader:glob({base:'./src/content/work',pattern:'**/*.md'}),schema:z.object({title:z.string(),summary:z.string().max(160),role:z.string(),tags:z.array(z.string()).default([]),cover:z.string().optional(),url:z.url().optional(),repo:z.url().optional(),draft:z.boolean().default(false)})});
const workZh=defineCollection({loader:glob({base:'./src/content/work-zh',pattern:'**/*.md'}),schema:z.object({})});
export const collections={work,workZh};
