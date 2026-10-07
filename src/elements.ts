export const NO_CAPTURE_CLASS = 'dx-no-capture'

const NO_CAPTURE_ATTRIBUTE = 'data-dx-no-capture'

const CAPTURE_ATTRIBUTE = 'data-dx-capture'

const INTERACTIVE_TAGS = new Set([ 'a', 'button', 'summary' ])

const CLICKABLE_INPUT_TYPES = new Set([ 'button', 'submit', 'reset', 'image', 'checkbox', 'radio' ])

const INTERACTIVE_ROLES = new Set([
  'button',
  'link',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'tab',
  'checkbox',
  'radio',
  'switch',
  'option',
  'treeitem',
])

const MAX_TEXT_LENGTH = 255

const MAX_SELECTOR_DEPTH = 5

const MAX_CLASSES = 5

// Card numbers and US social security numbers, with or without separators.
const SENSITIVE_TEXT = /\b(?:\d[ -]?){13,19}\b|\b\d{3}-\d{2}-\d{4}\b/

export type ElementData = {
  eventType: 'click' | 'submit',
  tagName: string,
  text?: string,
  href?: string,
  elementId?: string,
  name?: string,
  role?: string,
  type?: string,
  ariaLabel?: string,
  classes?: string[],
  dataAttributes?: Record<string, string>,
  selector: string,
}

function isInteractive(element: Element): boolean {
  const tag = element.tagName.toLowerCase()
  if (tag === 'a') return element.hasAttribute('href')
  if (tag === 'input') return CLICKABLE_INPUT_TYPES.has((element as HTMLInputElement).type)
  if (INTERACTIVE_TAGS.has(tag)) return true

  const role = element.getAttribute('role')
  return (role !== null && INTERACTIVE_ROLES.has(role)) || element.hasAttribute(CAPTURE_ATTRIBUTE)
}

function isOptedOut(element: Element): boolean {
  return element.classList.contains(NO_CAPTURE_CLASS) || element.hasAttribute(NO_CAPTURE_ATTRIBUTE)
}

// Walks the composed path so a click inside an open shadow root is credited to its own element.
function elementPath(event: Event): Element[] {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : []
  const elements = path.filter((node): node is Element => node instanceof Element)
  if (elements.length) return elements

  const elementsFromTarget: Element[] = []
  let node = event.target instanceof Element ? event.target : (event.target as Node | null)?.parentElement ?? null
  while (node) {
    elementsFromTarget.push(node)
    node = node.parentElement
  }
  return elementsFromTarget
}

function clean(value: string | null | undefined): string | undefined {
  const text = value?.replace(/\s+/g, ' ').trim()
  if (!text) return undefined
  return text.slice(0, MAX_TEXT_LENGTH)
}

// An input's value is what was typed, except on a button, where it is the label.
function visibleText(element: Element): string | undefined {
  if (element.tagName.toLowerCase() === 'input') {
    const input = element as HTMLInputElement
    return [ 'button', 'submit', 'reset' ].includes(input.type) ? clean(input.value) : undefined
  }
  if ((element as HTMLElement).isContentEditable) return undefined

  const text = clean((element as HTMLElement).innerText || element.textContent)
  return text && !SENSITIVE_TEXT.test(text) ? text : undefined
}

function classesOf(element: Element): string[] {
  return Array.from(element.classList).filter((name) => name !== NO_CAPTURE_CLASS)
}

function selectorPart(element: Element): string {
  const tag = element.tagName.toLowerCase()
  const id = element.id ? `#${element.id}` : ''
  const classes = classesOf(element).slice(0, MAX_CLASSES).map((name) => `.${name}`).join('')
  return `${tag}${id}${classes}`
}

function selectorFor(path: Element[], start: number): string {
  return path
    .slice(start, start + MAX_SELECTOR_DEPTH)
    .filter((element) => element.tagName.toLowerCase() !== 'html' && element.tagName.toLowerCase() !== 'body')
    .map(selectorPart)
    .reverse()
    .join(' > ')
}

function dataAttributesOf(element: Element): Record<string, string> | undefined {
  const attributes: Record<string, string> = {}
  for (const { name, value } of Array.from(element.attributes)) {
    if (!name.startsWith('data-') || name === CAPTURE_ATTRIBUTE) continue
    const cleaned = clean(value)
    if (cleaned && !SENSITIVE_TEXT.test(cleaned)) attributes[name] = cleaned
  }
  return Object.keys(attributes).length ? attributes : undefined
}

function describe(
  element: Element,
  path: Element[],
  index: number,
  eventType: ElementData['eventType'],
  text: string | undefined,
  maskUrl: (_url: string) => string,
): ElementData {
  const href = element.tagName.toLowerCase() === 'a' ? (element as HTMLAnchorElement).href : ''
  const classes = classesOf(element)
  const data: ElementData = {
    eventType,
    tagName: element.tagName.toLowerCase(),
    text,
    href: href && !href.startsWith('javascript:') ? maskUrl(href) : undefined,
    elementId: element.id || undefined,
    name: clean(element.getAttribute('name')),
    role: clean(element.getAttribute('role')),
    type: clean(element.getAttribute('type')),
    ariaLabel: clean(element.getAttribute('aria-label') ?? element.getAttribute('title')),
    classes: classes.length ? classes.slice(0, MAX_CLASSES) : undefined,
    dataAttributes: dataAttributesOf(element),
    selector: selectorFor(path, index),
  }

  return Object.fromEntries(Object.entries(data).filter(([ , value ]) => value !== undefined)) as ElementData
}

// The nearest interactive element that was clicked, or `null` for a click on nothing
// interactive or inside an opted-out subtree.
export function describeClick(event: Event, maskUrl: (_url: string) => string): ElementData | null {
  const path = elementPath(event)
  if (path.some(isOptedOut)) return null

  const index = path.findIndex(isInteractive)
  if (index === -1) return null

  const element = path[index]
  return describe(element, path, index, 'click', visibleText(element), maskUrl)
}

export function describeSubmit(event: Event, maskUrl: (_url: string) => string): ElementData | null {
  const path = elementPath(event)
  if (!(path[0] instanceof HTMLFormElement) || path.some(isOptedOut)) return null

  return describe(path[0], path, 0, 'submit', undefined, maskUrl)
}
