// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    formatters: true,
    ignores: defaults => [...defaults, '**/*.md'],
    rules: {
      'jsonc/sort-keys': 'off',
    },
  },
)
