import { HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'

export const highlight = HighlightStyle.define([
    {
        tag: [tags.propertyName, tags.definition(tags.propertyName)],
        color: 'var(--syn-key)',
    },
    {
        tag: [tags.string, tags.special(tags.string)],
        color: 'var(--syn-string)',
    },
    {
        tag: tags.regexp,
        color: 'var(--syn-string)',
    },
    {
        tag: [tags.number, tags.integer, tags.float],
        color: 'var(--syn-number)',
    },
    {
        tag: [tags.bool, tags.atom, tags.self],
        color: 'var(--syn-bool)',
    },
    {
        tag: tags.null,
        color: 'var(--syn-null)',
    },
    {
        tag: [
            tags.keyword,
            tags.operatorKeyword,
            tags.controlKeyword,
            tags.definitionKeyword,
            tags.moduleKeyword,
        ],
        color: 'var(--syn-keyword)',
    },
    {
        tag: [
            tags.operator,
            tags.compareOperator,
            tags.logicOperator,
            tags.arithmeticOperator,
            tags.updateOperator,
        ],
        color: 'var(--syn-keyword)',
    },
    {
        tag: [
            tags.function(tags.variableName),
            tags.function(tags.propertyName),
            tags.definition(tags.function(tags.variableName)),
        ],
        color: 'var(--syn-function)',
    },
    {
        tag: [tags.className, tags.typeName, tags.definition(tags.variableName)],
        color: 'var(--syn-type)',
    },
    {
        tag: [tags.variableName, tags.name],
        color: 'var(--syn-variable)',
    },
    {
        tag: [tags.comment, tags.lineComment, tags.blockComment],
        color: 'var(--syn-comment)',
        fontStyle: 'italic',
    },
    {
        tag: tags.tagName,
        color: 'var(--syn-keyword)',
    },
    {
        tag: tags.attributeName,
        color: 'var(--syn-key)',
    },
    {
        tag: [tags.meta, tags.processingInstruction, tags.documentMeta],
        color: 'var(--syn-comment)',
    },
    {
        tag: tags.invalid,
        color: 'var(--danger)',
    },
])
