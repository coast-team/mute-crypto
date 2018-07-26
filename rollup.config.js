import filesize from 'rollup-plugin-filesize'
import resolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import cleanup from 'rollup-plugin-cleanup'

const tsConfigEs5 = {
  tsconfigOverride: {
    compilerOptions: {
      removeComments: true,
      sourceMap: true,
    },
  },
}

const tsConfigEs2015 = {
  tsconfigOverride: {
    compilerOptions: {
      target: 'es2015',
      downlevelIteration: false,
      removeComments: true,
      sourceMap: true,
    },
  },
}

const tsConfigEsNext = {
  tsconfigOverride: {
    compilerOptions: {
      target: 'esnext',
      downlevelIteration: false,
      removeComments: true,
      sourceMap: true,
    },
  },
}

const tsConfigDeclaration = {
  useTsconfigDeclarationDir: true,
  tsconfigOverride: {
    compilerOptions: {
      declaration: true,
      removeComments: true,
      sourceMap: true,
    },
  },
  include: ['src/**/*.ts'],
}

const filesizeConfig = { format: { round: 0 } }

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/mute-crypto.es5.cjs.js',
        format: 'cjs',
        sourcemap: true,
      },
    ],
    plugins: [typescript(tsConfigEs5), resolve(), filesize(filesizeConfig), cleanup()],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/mute-crypto.es5.esm.js',
      format: 'es',
      sourcemap: true,
    },
    external: ['rxjs', 'rxjs/operators', 'crypto-api-wrapper'],
    plugins: [typescript(tsConfigDeclaration), filesize(filesizeConfig), cleanup()],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/mute-crypto.es2015.esm.js',
      format: 'es',
      sourcemap: true,
    },
    external: ['rxjs', 'rxjs/operators', 'crypto-api-wrapper'],
    plugins: [typescript(tsConfigEs2015), filesize(filesizeConfig), cleanup()],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/mute-crypto.esnext.esm.js',
      format: 'es',
      sourcemap: true,
    },
    external: ['rxjs', 'rxjs/operators', 'crypto-api-wrapper'],
    plugins: [typescript(tsConfigEsNext), filesize(filesizeConfig), cleanup()],
  },
]
