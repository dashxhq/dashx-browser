import type { InputScalar, InputShape } from './generated/inputShapes'

const INVALID = Symbol('invalid')

type ConformScalar = (_value: unknown) => unknown

const INT_LIMIT = 2 ** 31

const DECIMAL = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const KNOWN_SCALARS = {
  Boolean: (value) => (typeof value === 'boolean' ? value : INVALID),
  Decimal: (value) => (typeof value === 'number' || (typeof value === 'string' && DECIMAL.test(value)) ? value : INVALID),
  Float: (value) => (typeof value === 'number' ? value : INVALID),
  ID: (value) => (typeof value === 'string' || Number.isInteger(value) ? value : INVALID),
  Int: (value) => (Number.isInteger(value) && Math.abs(value as number) <= INT_LIMIT && value !== INT_LIMIT ? value : INVALID),
  JSON: (value) => value,
  String: (value) => (typeof value === 'string' ? value : INVALID),
  // The API only parses ISO 8601; Date.parse also takes looser formats.
  Timestamp: (value) => {
    const time = typeof value === 'string' ? Date.parse(value) : NaN
    return Number.isNaN(time) ? INVALID : new Date(time).toISOString()
  },
} satisfies Record<string, ConformScalar>

// Fails to compile when the schema starts using a scalar this file cannot check.
const SCALARS: Record<InputScalar, ConformScalar> = KNOWN_SCALARS

// Checks a JSON value against a generated input shape, leaving out fields the shape does not
// know: GraphQL rejects the whole request over one unknown, missing or mistyped field.
export default function conformInput(value: unknown, shape: InputShape, path = ''): Record<string, unknown> {
  if (!isObject(value)) throw new Error(`${path || 'it'} must be an object`)

  const conformed: Record<string, unknown> = {}
  for (const [ field, spec ] of Object.entries(shape)) {
    const fieldValue = value[field]
    const fieldPath = path ? `${path}.${field}` : field

    if (fieldValue == null) {
      if (spec.required) throw new Error(`${fieldPath} is required`)
      continue
    }

    if ('fields' in spec) {
      conformed[field] = conformInput(fieldValue, spec.fields, fieldPath)
      continue
    }

    const conformedValue = SCALARS[spec.scalar](fieldValue)
    if (conformedValue === INVALID) throw new Error(`${fieldPath} must be a ${spec.scalar}`)
    conformed[field] = conformedValue
  }
  return conformed
}
