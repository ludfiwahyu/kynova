import type { Extension } from '@codemirror/state'
import type { EditorView, ViewUpdate } from '@codemirror/view'
import { EditorView as View, ViewPlugin } from '@codemirror/view'

/** Pixels per line and per character in the overview, as VS Code's minimap draws them. */
const LINE = 2
const CHAR = 1
const LEFT = 6
/** Lines past this are left out of the overview; the editor itself is not limited. */
const MAX_LINES = 20_000

type RunKind = 'ink' | 'string' | 'number' | 'punct'

interface Run {
    from: number
    to: number
    kind: RunKind
}

interface Metrics {
    height: number
    lines: number
    total: number
    offset: number
    sliderTop: number
    sliderHeight: number
    lineHeight: number
}

const PUNCTUATION = /[{}[\]():,;]/
const WORD_END = /[\s"'{}[\]():,;]/

/** One line cut into coloured runs: strings, numbers, punctuation and the rest. Spaces are skipped. */
export function minimapRuns(text: string): Run[] {
    const runs: Run[] = []
    let index = 0

    while (index < text.length) {
        const char = text[index]

        if (char === ' ' || char === '\t') {
            index++
            continue
        }

        let end = index + 1
        let kind: RunKind = 'ink'

        if (char === '"' || char === "'") {
            while (end < text.length && text[end] !== char) {
                end += text[end] === '\\' ? 2 : 1
            }

            end = Math.min(end + 1, text.length)
            kind = 'string'
        } else if (/[0-9]/.test(char)) {
            while (end < text.length && /[0-9.eE+-]/.test(text[end])) {
                end++
            }

            kind = 'number'
        } else if (PUNCTUATION.test(char)) {
            kind = 'punct'
        } else {
            while (end < text.length && !WORD_END.test(text[end])) {
                end++
            }
        }

        runs.push({
            from: index,
            to: end,
            kind,
        })
        index = end
    }

    return runs
}

function palette(dom: HTMLElement): Record<RunKind, string> {
    const style = getComputedStyle(dom)
    const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback

    return {
        ink: read('--ink-2', '#9a9a9a'),
        string: read('--syn-string', '#7ee787'),
        number: read('--syn-number', '#ffa657'),
        punct: read('--ink-3', '#6e6e6e'),
    }
}

/**
 * A small overview of the whole text on the right of the editor, as in VS Code: the visible part
 * is marked, a click jumps there, dragging the mark scrolls, and the wheel scrolls the editor.
 */
class Minimap {
    dom = document.createElement('div')
    canvas = document.createElement('canvas')
    slider = document.createElement('div')
    view: EditorView

    constructor(view: EditorView) {
        this.view = view
        this.dom.className = 'cm-minimap'
        this.dom.setAttribute('aria-hidden', 'true')
        this.slider.className = 'cm-minimap-slider'
        this.dom.append(this.canvas, this.slider)
        view.dom.append(this.dom)

        view.scrollDOM.addEventListener('scroll', this.draw)
        this.dom.addEventListener('pointerdown', this.pointerDown)
        this.dom.addEventListener('wheel', this.wheel, { passive: true })
        requestAnimationFrame(this.draw)
    }

    update(update: ViewUpdate) {
        if (update.docChanged || update.geometryChanged || update.viewportChanged) {
            this.draw()
        }
    }

    destroy() {
        this.view.scrollDOM.removeEventListener('scroll', this.draw)
        this.dom.remove()
    }

    metrics(): Metrics {
        const scroller = this.view.scrollDOM
        const height = this.dom.clientHeight
        const lines = Math.min(this.view.state.doc.lines, MAX_LINES)
        const total = lines * LINE
        const range = scroller.scrollHeight - scroller.clientHeight
        const ratio = range > 0 ? scroller.scrollTop / range : 0
        const offset = Math.max(0, total - height) * ratio
        const lineHeight = this.view.defaultLineHeight

        return {
            height,
            lines,
            total,
            offset,
            sliderTop: (scroller.scrollTop / lineHeight) * LINE - offset,
            sliderHeight: Math.max(8, (scroller.clientHeight / lineHeight) * LINE),
            lineHeight,
        }
    }

    draw = () => {
        const metrics = this.metrics()
        const width = this.dom.clientWidth
        const context = this.canvas.getContext('2d')

        if (!context || width === 0 || metrics.height === 0) {
            return
        }

        const ratio = window.devicePixelRatio || 1

        this.canvas.width = width * ratio
        this.canvas.height = metrics.height * ratio
        this.canvas.style.width = `${width}px`
        this.canvas.style.height = `${metrics.height}px`
        context.setTransform(ratio, 0, 0, ratio, 0, 0)
        context.clearRect(0, 0, width, metrics.height)
        context.globalAlpha = 0.8

        const colours = palette(this.view.dom)
        const doc = this.view.state.doc
        const first = Math.floor(metrics.offset / LINE)
        const last = Math.min(metrics.lines, first + Math.ceil(metrics.height / LINE) + 1)
        const columns = Math.floor((width - LEFT) / CHAR)

        for (let index = first; index < last; index++) {
            const y = index * LINE - metrics.offset

            for (const run of minimapRuns(doc.line(index + 1).text.slice(0, columns))) {
                context.fillStyle = colours[run.kind]
                context.fillRect(LEFT + run.from * CHAR, y, (run.to - run.from) * CHAR, LINE - 0.5)
            }
        }

        this.slider.style.transform = `translateY(${metrics.sliderTop}px)`
        this.slider.style.height = `${metrics.sliderHeight}px`
    }

    pointerDown = (event: PointerEvent) => {
        if (event.button !== 0) {
            return
        }

        event.preventDefault()

        const scroller = this.view.scrollDOM
        const top = this.dom.getBoundingClientRect().top
        const start = this.metrics()
        const y = event.clientY - top

        // Outside the mark: centre the editor on the line that was clicked, then drag from there.
        if (y < start.sliderTop || y > start.sliderTop + start.sliderHeight) {
            const line = (y + start.offset) / LINE

            scroller.scrollTop = line * start.lineHeight - scroller.clientHeight / 2
        }

        const startY = event.clientY
        const startScroll = scroller.scrollTop

        const move = (moveEvent: PointerEvent) => {
            const metrics = this.metrics()
            const scrollRange = scroller.scrollHeight - scroller.clientHeight
            const sliderRange = Math.min(metrics.total, metrics.height) - metrics.sliderHeight
            const factor = sliderRange > 0 ? scrollRange / sliderRange : 0

            scroller.scrollTop = startScroll + (moveEvent.clientY - startY) * factor
        }

        const end = () => {
            this.dom.removeEventListener('pointermove', move)
            this.dom.removeEventListener('pointerup', end)
            this.dom.removeEventListener('pointercancel', end)
            this.dom.classList.remove('cm-minimap-dragging')
        }

        this.dom.setPointerCapture(event.pointerId)
        this.dom.classList.add('cm-minimap-dragging')
        this.dom.addEventListener('pointermove', move)
        this.dom.addEventListener('pointerup', end)
        this.dom.addEventListener('pointercancel', end)
    }

    wheel = (event: WheelEvent) => {
        this.view.scrollDOM.scrollTop += event.deltaY
    }
}

// CodeMirror rewrites the editor's class list, so the class that makes room for the overview is
// given through its attributes, not added by hand.
export const minimap: Extension = [
    ViewPlugin.fromClass(Minimap),
    View.editorAttributes.of({ class: 'cm-has-minimap' }),
]
