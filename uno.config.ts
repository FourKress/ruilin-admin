import transformerDirectives from '@unocss/transformer-directives'

import { defineConfig, presetUno, UserConfig } from 'unocss'

export default <UserConfig>defineConfig({
  presets: [presetUno()],
  transformers: [transformerDirectives()]
})
