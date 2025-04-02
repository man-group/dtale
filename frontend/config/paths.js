const fs = require('fs');
const path = require('path');

// Make sure any symlinks in the project folder are resolved
// https://githb.com/facebookincubator/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

module.exports = {
  appPackageJson: resolveApp('package.json'),
  appSrc: resolveApp('static'),
  appTsConfig: resolveApp('tsconfig.json'),
  yarnLockFile: resolveApp('yarn.lock'),
};
