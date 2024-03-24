import fs from 'fs';
import {warn} from './logger.mjs';

let fileWatchers = [];

function resetFileWatchers() {
  fileWatchers.forEach((watcher) => watcher.close());
  fileWatchers = [];
}

export function watchFiles(files, selectors, externals, env, callback) {
  resetFileWatchers();

  fileWatchers = files.map((file) => {
    const watcher = fs.watch(file, (eventType) => {
      if (eventType === 'change') {
        warn(`Input file ${file} has changed. Extracting tests...`);
        callback();
      }
    });

    fileWatchers.push(watcher);
    return watcher;
  });

  fileWatchers.push(
      fs.watch(selectors, (eventType) => {
        if (eventType === 'change') {
          warn(`Selectors file ${selectors} has changed. Extracting tests...`);
          callback();
        }
      })
  );

  if (externals != null) {
    fileWatchers.push(
        fs.watch(externals, (eventType) => {
          if (eventType === 'change') {
            warn(`Externals file ${externals} has changed. Extracting tests...`);
            callback();
          }
        })
    );
  }

  if (env != null) {
    fileWatchers.push(
        fs.watch(env, (eventType) => {
          if (eventType === 'change') {
            warn(`Environment file ${env} has changed. Extracting tests...`);
            callback();
          }
        })
    );
  }
}