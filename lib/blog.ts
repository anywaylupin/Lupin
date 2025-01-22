import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

const getMDXFiles = (dir: string) => fs.readdirSync(dir).filter((file) => path.extname(file) === '.mdx');

export const markdownToHTML = async (markdown: string) => {
  const processed = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypePrettyCode, {
      theme: { light: 'min-light', dark: 'min-dark' },
      keepBackground: false
    })
    .use(rehypeStringify)
    .process(markdown);

  return processed.toString();
};

export const getPost = async (slug: string) => {
  const filePath = path.join('content', `${slug}.mdx`);
  const source = fs.readFileSync(filePath, 'utf-8');
  const { content: rawContent, data: metadata } = matter(source);
  const content = await markdownToHTML(rawContent);

  return { source: content, metadata, slug };
};

const getAllPosts = async (dir: string) => {
  const mdxFiles = getMDXFiles(dir);
  return Promise.all(
    mdxFiles.map(async (file) => {
      const slug = path.basename(file, path.extname(file));
      const { metadata, source } = await getPost(slug);
      return { metadata, slug, source };
    })
  );
};

export const getBlogPosts = () => getAllPosts(path.join(process.cwd(), 'content'));
