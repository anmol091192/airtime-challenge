let main = require('./main.js');

main
  .start()
  .then(main.explore)
  .then(main.report)
  .catch('Failed');
