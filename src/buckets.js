"use strict";

const path = require("path");
const fs = require("fs");
const queue = require("async/queue");
const promisify = require("util").promisify;

const stat = promisify(fs.stat);

const listStorageBuckets = (dir, events) => {
  fs.readdir(dir, (err, dirList) => {
    if (err) {
      console.error(err);
    } else {
      Promise.all(
        dirList.map(async file => {
          const copyLock = `.${file}.copy.lock`;
          const deleteLock = `.${file}.delete.lock`;
          const st = await stat(path.join(dir, file));
          if (st.isDirectory()) {
            return {
              name: file,
              created: stat.birthtime,
              isLocked:
                dirList.indexOf(copyLock) >= 0 ||
                dirList.indexOf(deleteLock) >= 0
            };
          }
        })
      )
        .then(buckets => buckets.filter(b => b))
        .then(buckets => events.emit("/buckets", buckets));
    }
  });
};

module.exports = {
  list: (baseDir, events) => bucket => listStorageBuckets(baseDir, events),
};
