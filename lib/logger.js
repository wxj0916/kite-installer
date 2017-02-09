'use strict';

const LEVELS = {
  SILLY: 0,
  VERBOSE: 1,
  DEBUG: 2,
  INFO: 3,
  WARNING: 4,
  ERROR: 5,
};

let _nextRequestId = 0;

const nextRequestId = () => ++_nextRequestId;

const Logger = {
  LEVELS,

  METHODS: {
    [LEVELS.SILLY]: 'debug',
    [LEVELS.VERBOSE]: 'debug',
    [LEVELS.DEBUG]: 'log',
    [LEVELS.INFO]: 'info',
    [LEVELS.WARN]: 'warn',
    [LEVELS.ERROR]: 'error',
  },

  LEVEL: 2,
  SILENT: false,
  TRACE_ALL: false,

  silly(...msgs) { this.log(LEVELS.SILLY, ...msgs); },
  verbose(...msgs) { this.log(LEVELS.VERBOSE, ...msgs); },
  debug(...msgs) { this.log(LEVELS.DEBUG, ...msgs); },
  info(...msgs) { this.log(LEVELS.INFO, ...msgs); },
  warn(...msgs) { this.log(LEVELS.WARN, ...msgs); },
  error(...msgs) { this.log(LEVELS.ERROR, ...msgs); },
  logRequest(req) {
    const id = `request#${nextRequestId()}`;

    req.on('error', err =>
      this.verbose(id, 'error occured', err, req));
    req.on('abort', (...args) =>
      this.verbose(id, 'aborted by client', ...args));
    req.on('aborted', (...args) =>
      this.verbose(id, 'aborted by server', ...args));
    req.on('connect', (...args) =>
      this.verbose(id, 'connected', ...args));
    req.on('response', resp => {
      let data = '';
      this.verbose(id, 'response received', req, resp);

      resp.on('error', err =>
        this.verbose(id, 'error occured', err, req, resp));
      resp.on('aborted', (...args) =>
        this.verbose(id, 'response aborted', ...args));
      resp.on('close', (...args) =>
        this.verbose(id, 'response closed', ...args));
      resp.on('data', (chunk) => {
        data += chunk;
        this.silly(id, 'data received', chunk);
      });
      resp.on('end', () => this.verbose(id, 'ended', data));
    });
  },
  log(level, ...msgs) {
    if (level >= this.LEVEL && !this.SILENT) {
      console[this.METHODS[level]](...msgs);
      if (this.TRACE_ALL) { console.trace(); }
    }
  },
};

module.exports = Logger;