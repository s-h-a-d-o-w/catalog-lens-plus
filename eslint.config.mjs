// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    formatters: true,
    rules: {
      'jsonc/sort-keys': 'off',
    },
  },
)
