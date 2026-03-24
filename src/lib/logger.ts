const noop = () => {};

interface Logger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

const level = import.meta.env.DEV ? 0 : 2; // 0=debug, 1=info, 2=warn, 3=error

export const logger: Logger = {
  debug: level <= 0 ? console.debug.bind(console) : noop,
  info: level <= 1 ? console.info.bind(console) : noop,
  warn: level <= 2 ? console.warn.bind(console) : noop,
  error: console.error.bind(console),
};
