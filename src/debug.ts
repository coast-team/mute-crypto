const prefix = ['%cMUTE CRYPTO:%c ', 'background-color: #81C784; padding: 0 2px', '']
const prefixError = ['%cMUTE CRYPTO ERROR:%c ', 'background-color: #81C784; padding: 0 2px', '']
const perfPrefix = [
  '%cMUTE CRYPTO:%c %cPERFORMANCE:%c ',
  'background-color: #81C784; padding: 0 2px',
  '',
  'background-color: #FFCC80; padding: 0 2px',
  '',
]

// Logs
interface Log {
  debug: (...args: any[]) => void
  error: (...args: any[]) => void
}

const logEnabled: Log = {
  debug: (...args: any[]) => console.log(...prefix, ...args),
  error: (...args: any[]) => console.error(...prefixError, ...args),
}
const logDisabled: Log = {
  debug: () => {},
  error: () => {},
}

let log: Log = logDisabled

// Assert
type Assert = (...args: any[]) => void
const assertEnabled = (condition: boolean, msg: string, ...args: any[]) => {
  console.assert(condition, `MUTE-CRYPTO: ${msg}`, ...args)
}
const assertDisabled = () => {}

let assert: Assert = assertDisabled

// Performance
interface Perf {
  mark: (name: string) => void
  measure: (name: string, startMark: string, endMark: string) => void
}

const perfEnabled = {
  mark: (name: string) => window.performance.mark(name),
  measure: (name: string, startMark: string, endMark: string) => {
    window.performance.measure(name, startMark, endMark)
    const measure = window.performance.getEntriesByName(name)[0]
    console.log(...perfPrefix, `${measure.name} = ${measure.duration.toFixed(0)}ms`)
    window.performance.clearMeasures()
  },
}
const perfDisabled = {
  mark: () => {},
  measure: () => {},
}

let perf: Perf = perfDisabled

function enableDebug(enable = true) {
  if (enable) {
    log = logEnabled
    assert = assertEnabled
    perf = perfEnabled
  } else {
    log = logDisabled
    assert = assertDisabled
    perf = perfDisabled
  }
}

export { assert, log, perf, enableDebug }

/**
 * From Rohit Singh Sengar's answer on StackOverflow
 * https://stackoverflow.com/a/25644409
 */
export function bytesToString(bytes: Uint8Array) {
  const CHUNK_SIZE = 0x8000 // arbitrary number
  let index = 0
  const length = bytes.length
  let result = ''
  let slice
  while (index < length) {
    slice = bytes.subarray(index, Math.min(index + CHUNK_SIZE, length))
    result += String.fromCharCode.apply(null, slice)
    index += CHUNK_SIZE
  }
  return btoa(result).substr(0, 20) + '...'
}
