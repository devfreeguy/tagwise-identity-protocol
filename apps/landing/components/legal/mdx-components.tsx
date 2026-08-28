import type { MDXComponents } from "mdx/types";

export const legalMdxComponents: MDXComponents = {
  table: (props) => (
    <div className="doc-table-wrapper">
      <table {...props} />
    </div>
  ),
};
