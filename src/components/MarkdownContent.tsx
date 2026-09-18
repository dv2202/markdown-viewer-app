import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

// ReactMarkdown supplies an AST node alongside the DOM props.
function cleanProps<T extends { node?: unknown }>(props: T) {
  const clean = { ...props };
  delete clean.node;
  return clean;
}

export default function MarkdownContent({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
      components={{
        h1: (props) => (
          <h1 className="text-3xl font-bold tracking-tight mt-8 mb-4 text-neutral-900 dark:text-neutral-100" {...cleanProps(props)} />
        ),
        h2: (props) => (
          <h2 className="text-xl font-semibold tracking-tight mt-8 mb-3 text-neutral-900 dark:text-neutral-100" {...cleanProps(props)} />
        ),
        h3: (props) => (
          <h3 className="text-lg font-semibold mt-6 mb-2 text-neutral-900 dark:text-neutral-100" {...cleanProps(props)} />
        ),
        p: (props) => (
          <p className="my-4 text-[15.5px] leading-[1.8] text-neutral-800 dark:text-neutral-200" {...cleanProps(props)} />
        ),
        ul: (props) => (
          <ul className="list-disc pl-5 my-4 space-y-1.5 text-[15.5px] leading-relaxed text-neutral-800 dark:text-neutral-200" {...cleanProps(props)} />
        ),
        ol: (props) => (
          <ol className="list-decimal pl-5 my-4 space-y-1.5 text-[15.5px] leading-relaxed text-neutral-800 dark:text-neutral-200" {...cleanProps(props)} />
        ),
        li: (props) => (
          <li className="pl-1" {...cleanProps(props)} />
        ),
        blockquote: (props) => (
          <blockquote className="border-l-2 border-neutral-900 dark:border-neutral-100 pl-4 my-6 italic text-neutral-600 dark:text-neutral-400" {...cleanProps(props)} />
        ),
        code: ({ className, children, ...props }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code
                className="px-1.5 py-0.5 mx-0.5 text-[13px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded border border-neutral-200/60 dark:border-neutral-700/60"
                {...cleanProps(props)}
              >
                {children}
              </code>
            );
          }
          return (
            <code className={className} {...cleanProps(props)}>
              {children}
            </code>
          );
        }
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
