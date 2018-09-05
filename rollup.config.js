import filesize from 'rollup-plugin-filesize'
import resolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import cleanup from 'rollup-plugin-cleanup'

const tsConfigEs2015 = {
  tsconfigOverride: {
    compilerOptions: {
      target: 'es2015',
      downlevelIteration: false,
    },
  },
}

const tsConfigEsNext = {
  tsconfigOverride: {
    compilerOptions: {
      target: 'esnext',
      downlevelIteration: false,
    },
  },
}

const tsConfigDeclaration = {
  useTsconfigDeclarationDir: true,
  tsconfigOverride: {
    compilerOptions: {
      declarationDir: 'dist/types',
      declaration: true,
    },
  },
  include: ['src/**/*.ts'],
}

const filesizeConfig = { format: { round: 0 } }

export default [
  {
    input: 'src/index.node.ts',
    output: [
      {
        file: 'dist/mute-crypto.node.es5.cjs.js',
        format: 'cjs',
        sourcemap: true,
      },
    ],
    external: ['@coast-team/mute-crypto-helper', 'perf_hooks', 'buffer'],
    plugins: [typescript(), resolve(), filesize(filesizeConfig), cleanup()],
  },
  {
    input: 'src/index.node.ts',
    output: {
      file: 'dist/mute-crypto.node.es5.esm.js',
      format: 'es',
      sourcemap: true,
    },
    external: ['@coast-team/mute-crypto-helper', 'perf_hooks', 'buffer'],
    plugins: [typescript(tsConfigDeclaration), filesize(filesizeConfig), cleanup()],
  },
  {
    input: 'src/index.browser.ts',
    output: {
      file: 'dist/mute-crypto.browser.es5.esm.js',
      format: 'es',
      sourcemap: true,
    },
    external: ['@coast-team/mute-crypto-helper'],
    plugins: [
      typescript(tsConfigDeclaration),
      resolve({ browser: true }),
      filesize(filesizeConfig),
      cleanup(),
    ],
  },
  {
    input: 'src/index.browser.ts',
    output: {
      file: 'dist/mute-crypto.browser.es2015.esm.js',
      format: 'es',
      sourcemap: true,
    },
    external: ['@coast-team/mute-crypto-helper'],
    plugins: [
      typescript(tsConfigEs2015),
      resolve({ browser: true }),
      filesize(filesizeConfig),
      cleanup(),
    ],
  },
  {
    input: 'src/index.browser.ts',
    output: {
      file: 'dist/mute-crypto.browser.esnext.esm.js',
      format: 'es',
      sourcemap: true,
    },
    external: ['@coast-team/mute-crypto-helper'],
    plugins: [
      typescript(tsConfigEsNext),
      resolve({ browser: true }),
      filesize(filesizeConfig),
      cleanup(),
    ],
  },
]
