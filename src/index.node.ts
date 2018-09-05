/// <reference types="node" />
import { performance } from 'perf_hooks'
import { env } from './env'

env.performance = performance

export * from './index.common'
