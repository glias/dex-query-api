import winston, { format, transports, Logger } from "winston";

export class DexLogger {
  private logger: Logger;

  // private className: string;

  private logTag: string;

  constructor(className: string) {
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === "development" ? "debug" : "info",
      format: format.combine(format.colorize(), format.simple()),
      transports: [
        new transports.Console(),
        new transports.File({ filename: "error.log", level: "error" }),
      ],
    });

    // this.className = className;
    this.logTag = `\x1b[${className}]\x1b[0m`;
  }

  debug(message: string): void {
    this.logger.debug(`${this.logTag}: ${message}`);
  }

  info(message: string): void {
    this.logger.debug(`${this.logTag}: ${message}`);
  }

  error(error: Record<string, unknown>): void {
    this.logger.error(`${this.logTag}: ${error}`);
  }
}
