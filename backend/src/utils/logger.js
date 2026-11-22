const formatLog = (level, message, meta = '') => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? (typeof meta === 'object' ? ` ${JSON.stringify(meta)}` : ` ${meta}`) : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

const logger = {
  info: (msg, meta) => console.log(formatLog('info', msg, meta)),
  warn: (msg, meta) => console.warn(formatLog('warn', msg, meta)),
  error: (msg, meta) => console.error(formatLog('error', msg, meta)),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatLog('debug', msg, meta));
    }
  }
};

module.exports = logger;
