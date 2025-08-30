type LogContext = Record<string, any>;

type Logger = {
  debug: (msg: string, context?: LogContext) => void;
  info: (msg: string, context?: LogContext) => void;
  warn: (msg: string, context?: LogContext) => void;
  error: (msg: string, context?: LogContext) => void;
};

const emptyLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

export { type Logger, type LogContext, emptyLogger };
