export let log: Log
export interface Log {
  debug: (...args: any[]) => void
  assert: (...args: any[]) => void
}

export let assert: Assert
export type Assert = (...args: any[]) => void

export function enableDebug(enable: boolean) {
  if (enable) {
    log = enable ? logEnabled : logDisabled
    assert = enable ? assertEnabled : assertDisabled
  }
}

const logEnabled = {
  debug: (...args: any[]) => console.log(...args),
  assert: (...args: any[]) => console.assert(...args),
}
const logDisabled = {
  debug: () => {},
  assert: () => {},
}

const assertEnabled = (...args: any[]) => console.assert(...args)
const assertDisabled = () => {}

// Default
log = logDisabled
assert = assertDisabled
