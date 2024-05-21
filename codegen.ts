import { CodegenConfig } from '@graphql-codegen/cli'

require('dotenv').config()

const config: CodegenConfig = {
  schema: process.env.API_URL,
  documents: [ 'src/graphql/*.gql' ],
  generates: {
    './src/generated/index.ts': {
      plugins: [
        {
          add: {
            content: '/* eslint-disable max-len */',
          },
        },
        'graphql-codegen-typescript-operation-types',
        'typescript-operations',
        'typescript-urql',
      ],
      config: {
        omitObjectTypes: true,
        withHooks: false,
      },
    },
  },
}

export default config
