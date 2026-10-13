const { isInputObjectType, isListType, isNonNullType, isScalarType } = require('graphql')

// Emits the named input types as runtime data, so a client can check a value against the schema
// before sending it. Config: `inputs: [ 'TrackedEventInput' ]`.
module.exports = {
  plugin(schema, _documents, config) {
    const scalars = new Set()

    const shapeOf = (inputType, seen) => {
      if (seen.includes(inputType.name)) {
        throw new Error(`inputShapes: ${[ ...seen, inputType.name ].join(' > ')} is recursive`)
      }

      return Object.fromEntries(Object.values(inputType.getFields()).map((field) => {
        const required = isNonNullType(field.type)
        const type = required ? field.type.ofType : field.type
        const where = `${inputType.name}.${field.name}`

        if (isListType(type)) throw new Error(`inputShapes: ${where} is a list, which is not supported yet`)
        if (isInputObjectType(type)) {
          return [ field.name, { required, fields: shapeOf(type, [ ...seen, inputType.name ]) } ]
        }
        if (!isScalarType(type)) throw new Error(`inputShapes: ${where} is a ${type}, which is not supported yet`)

        scalars.add(type.name)
        return [ field.name, { required, scalar: type.name } ]
      }))
    }

    const shapes = (config.inputs ?? []).map((name) => {
      const inputType = schema.getType(name)
      if (!isInputObjectType(inputType)) throw new Error(`inputShapes: ${name} is not an input type`)
      return `export const ${name}Shape: InputShape = ${JSON.stringify(shapeOf(inputType, []), null, 2)}`
    })

    const scalarNames = [ ...scalars ].sort().map((name) => `'${name}'`).join(' | ') || 'never'

    return [
      `export type InputScalar = ${scalarNames}`,
      'export type InputField = { required: boolean, scalar: InputScalar } | { required: boolean, fields: InputShape }',
      'export type InputShape = { [field: string]: InputField }',
      ...shapes,
    ].join('\n\n')
  },
}
