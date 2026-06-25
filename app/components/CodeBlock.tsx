import { ReactNode } from 'react'

interface CodeProps {
  node?: any
  inline?: boolean
  className?: string
  children?: ReactNode
  [key: string]: any
}

const CodeBlock = ({ inline, className, children, ...props }: CodeProps) => {
  if (inline) {
    return <code className="inline-code">{children}</code>
  }
  return (
    <pre className="code-block">
      <code>{children}</code>
    </pre>
  )
}

export default CodeBlock
