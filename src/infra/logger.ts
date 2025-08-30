const createLogger = () => {
  const logger = {
    debug: (msg: string, ctx?: Record<string, any>) => {
      console.debug(`DEBUG: ${msg} ${ctx ? JSON.stringify(ctx) : ""}`);
    },
    info: (msg: string, ctx?: Record<string, any>) => {
      console.log(`INFO: ${msg} ${ctx ? JSON.stringify(ctx) : ""}`);
    },
    warn: (msg: string, ctx?: Record<string, any>) => {
      console.warn(`WARN: ${msg} ${ctx ? JSON.stringify(ctx) : ""}`);
    },
    error: (msg: string, ctx?: Record<string, any>) => {
      console.error(`ERROR: ${msg} ${ctx ? JSON.stringify(ctx) : ""}`);
    },
  };

  return logger;
};

export { createLogger };
