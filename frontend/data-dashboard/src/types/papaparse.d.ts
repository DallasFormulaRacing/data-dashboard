declare module "papaparse" {
  // Your CSV row structure for charting
  export interface ChartRow {
    "Lap Time1": string;
    "Engine RPM": string;
  }

  export interface ParseResult<T> {
    data: T[];
    errors: any[];
    meta: {
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      fields: string[];
    };
  }

  export interface ParseConfig<T> {
    delimiter?: string;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    header?: boolean;
    dynamicTyping?: boolean;
    preview?: number;
    encoding?: string;
    worker?: boolean;
    comments?: boolean | string;
    step?: (results: ParseResult<T>, parser: any) => void;
    complete?: (results: ParseResult<T>) => void;
    error?: (error: any) => void;
    download?: boolean;
    skipEmptyLines?: boolean;
    chunk?: (results: ParseResult<T>, parser: any) => void;
    fastMode?: boolean;
    beforeFirstChunk?: (chunk: string) => string;
    withCredentials?: boolean;
  }

  export function parse<T>(input: string | File, config?: ParseConfig<T>): void;
}