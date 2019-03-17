import {compiler as ClosureCompiler} from 'google-closure-compiler';
import {EntryConfig, PlovrMode} from './entryconfig';

export interface CompilerOptions {
  [idx: string]: any;
  dependency_mode?: string;
  entry_point?: string[];
  compilation_level?: 'BUNDLE' | 'WHITESPACE' | 'WHITESPACE_ONLY' | 'SIMPLE' | 'ADVANCED';
  js?: string[];
  js_output_file?: string;
  // chunk or module: `name:num-js-files[:[dep,...][:]]` ex) chunk1:3:app
  chunk?: string[];
  language_in?: string;
  language_out?: string;
  json_streams?: 'IN' | 'OUT' | 'BOTH';
  warning_level?: string;
  debug?: boolean;
  formatting?: string[];
  define?: string[];
  // chunkname:wrappercode
  chunk_wrapper?: string[];
  chunk_output_path_prefix?: string;
  isolation_mode?: 'NONE' | 'IIFE';
}

export function toCompilerOptions(entryConfig: EntryConfig): CompilerOptions {
  const opts: CompilerOptions = {};
  function copy(entryKey: keyof EntryConfig, closureKey = entryKey.replace(/-/g, '_')) {
    if (entryKey in entryConfig) {
      opts[closureKey] = entryConfig[entryKey];
    }
  }
  copy('language-in');
  copy('language-out');
  copy('externs');
  copy('level', 'warning_level');
  copy('debug');
  copy('output-file', 'js_output_file');

  if (entryConfig.mode === PlovrMode.RAW) {
    opts.compilation_level = 'WHITESPACE';
  } else {
    opts.compilation_level = entryConfig.mode;
  }

  if (entryConfig.modules) {
    // for chunks
    opts.dependency_mode = 'NONE';
    opts.json_streams = 'OUT';
  } else {
    // for pages
    opts.dependency_mode = 'PRUNE';
    opts.js = entryConfig.paths;
    opts.entry_point = entryConfig.inputs;
    // TODO: consider `global-scope-name`
    opts.isolation_mode = 'IIFE';
  }

  const formatting: string[] = [];
  if (entryConfig['pretty-print']) {
    formatting.push('PRETTY_PRINT');
  }
  if (entryConfig['print-input-delimiter']) {
    formatting.push('PRINT_INPUT_DELIMITER');
  }
  if (formatting.length > 0) {
    opts.formatting = formatting;
  }

  if (entryConfig.define) {
    const defines: string[] = [];
    for (const key in entryConfig.define) {
      const value = entryConfig.define[key];
      defines.push(`${key}=${value}`);
    }
    opts.define = defines;
  }

  // TODO
  // * experimental-compiler-options: Object<string, any>
  // * global-scope-name: `__CBZ__`
  // * soy-function-plugins: string[]
  // * checks: Object<string, string>
  // * output-file: string
  // * module-output-path: string
  // * module-production-uri: string
  return opts;
}

export async function compile(opts: CompilerOptions): Promise<string> {
  const compiler = new ClosureCompiler(opts as any);
  return new Promise((resolve, reject) => {
    compiler.run((exitCode: number, stdout: string, stderr?: string) => {
      if (stderr) {
        return reject(new CompilerError(stderr, exitCode));
      }
      resolve(stdout);
    });
  });
}

class CompilerError extends Error {
  exitCode: number;
  constructor(msg: string, exitCode: number) {
    super(msg);
    this.name = 'CompilerError';
    this.exitCode = exitCode;
  }
}
