import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import remarkGithubAlerts from "remark-github-alerts";

export const docs = defineDocs({
  dir: "content/docs",
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkGithubAlerts],
  },
});
