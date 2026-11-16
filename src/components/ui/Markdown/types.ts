export type Block =
    | {
          kind: 'heading'
          level: number
          text: string
      }
    | {
          kind: 'paragraph'
          text: string
      }
    | {
          kind: 'list'
          ordered: boolean
          items: string[]
      }
    | {
          kind: 'code'
          text: string
      }

export interface MarkdownProps {
    source: string
}

export interface MarkdownBlockProps {
    block: Block
}

export interface InlineTextProps {
    text: string
}

export type InlineToken =
    | {
          kind: 'text'
          key: number
          text: string
      }
    | {
          kind: 'code' | 'strong' | 'em'
          key: number
          text: string
      }
    | {
          kind: 'link'
          key: number
          text: string
          href: string
      }
