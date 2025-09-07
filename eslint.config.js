import next from '@next/eslint-plugin-next'

export default [
  {
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      '@next/next': next
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
]