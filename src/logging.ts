const getTimestamp = (): string => {
  const now = new Date()
  const month = now.toLocaleString('en-US', { month: 'short' })
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0')

  return `${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
}

export const log = (prefix: string, message: string, ...args: any[]): void => {
  console.log(`${getTimestamp()} [${prefix}]`, message, ...args)
}

export const warn = (prefix: string, message: string, ...args: any[]): void => {
  console.warn(`${getTimestamp()} [${prefix}]`, message, ...args)
}

export const error = (prefix: string, message: string, ...args: any[]): void => {
  console.error(`${getTimestamp()} [${prefix}]`, message, ...args)
}

export const createLogger = (prefix: string) => ({
  log: (message: string, ...args: any[]) => log(prefix, message, ...args),
  warn: (message: string, ...args: any[]) => warn(prefix, message, ...args),
  error: (message: string, ...args: any[]) => error(prefix, message, ...args),
})
