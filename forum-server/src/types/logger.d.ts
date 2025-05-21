declare module '../utils/logger.util' {
  export const logger: {
    error: (message: string | object, meta?: object) => void;
    warn: (message: string | object, meta?: object) => void;
    info: (message: string | object, meta?: object) => void;
    http: (message: string | object, meta?: object) => void;
    debug: (message: string | object, meta?: object) => void;
  };

  export const morganStream: {
    write: (message: string) => void;
  };
}
