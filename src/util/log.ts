function stamp(): string {
  return new Date().toLocaleString('pt-BR', { hour12: false });
}

export const log = {
  info(message: string, ...rest: unknown[]): void {
    console.log(`[${stamp()}] ${message}`, ...rest);
  },
  warn(message: string, ...rest: unknown[]): void {
    console.warn(`[${stamp()}] WARN ${message}`, ...rest);
  },
  error(message: string, ...rest: unknown[]): void {
    console.error(`[${stamp()}] ERROR ${message}`, ...rest);
  },
};
