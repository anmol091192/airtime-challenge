let Promise = require('bluebird');
let api = require('./apiUtils.js');

let droneList = [];
let roomsToExplore = [];
let roomsExplored = {};

let queueRead = [];
let queueExplore = [];
let writings = [];
// #STEP - 1
let start = function() {
  console.log('Step1 - /start - Getting Initial Values');
  return new Promise((resolve, reject) => {
    api
      .get('/start')
      .then(response => {
        resolve(response.data);
      })
      .catch(err => {
        reject(err);
      });
  });
};

// STEP - 2
let explore = function(data) {
  console.log('Step2 - Exploring labyrinth');
  //console.log(data);
  if (data == null || data.roomId == null) {
    throw new exception(
      'You must call locateDrones before to explore labyrinth.'
    );
  }

  let tasks = [];
  droneList = data.drones;

  roomsExplored[data.roomId] = true;
  roomsToExplore.push(data.roomId);
  //console.log(droneList);
  return promiseWhile(
    function() {
      //console.log('2');
      return roomsToExplore.length != 0 || queueRead.length != 0;
    },
    function() {
      for (let i = 0; i < droneList.length; i++) {
        //console.log(droneList[i]);
        tasks[i] = executeDrones(droneList[i], getDroneCommands(i));
        //console.log('3');
      }
      //console.log('4');

      return new Promise.all(tasks);
    }
  );
};
function getDroneCommands(i) {
  let commands = {};
  let droneId = droneList[i];

  let roomIdsExplore = getRooomIdsExplore();
  //console.log(roomIdsExplore);
  for (let i = 0; i < roomIdsExplore.length; i++) {
    commands[droneId + '_explore_' + roomIdsExplore[i]] = {
      explore: roomIdsExplore[i]
    };
  }

  let roomIdsRead = getRoomIdsRead(5 - roomIdsExplore.length);
  for (let i = 0; i < roomIdsRead.length; i++) {
    commands[droneId + '_read_' + roomIdsRead[i]] = {
      read: roomIdsRead[i]
    };
  }
  return commands;
}

function getRooomIdsExplore() {
  let ids = [];
  for (let i = 0; i < 5; i++) {
    if (roomsToExplore.length > 0) {
      let roomId = roomsToExplore.pop();
      ids[ids.length] = roomId;
      queueRead.push(roomId);
    }
  }
  return ids;
}

function getRoomIdsRead(max) {
  let ids = [];
  for (let i = 0; i < max; i++) {
    if (queueRead.length > 0) {
      ids[ids.length] = queueRead.pop();
    }
  }
  return ids;
}

function executeDrones(id, commands) {
  return apiCommands(id, commands).then(function(response) {
    let commandKeys = Object.keys(commands);
    for (let i = 0; i < commandKeys.length; i++) {
      let commandItem = commandKeys[i];
      //console.log(commandItem);
      if (commandItem.includes('_explore_')) {
        if (
          response[commandItem] != null &&
          response[commandItem].connections != null
        ) {
          let connections = response[commandItem].connections;
          //console.log(connections);
          for (let j = 0; j < connections.length; j++) {
            if (roomsExplored[connections[j]] == null) {
              roomsToExplore.push(connections[j]);
              roomsExplored[connections[j]] = true;
            }
          }
        } else {
          errorHandler(JSON.stringify(response[commandItem]));
        }
      } else if (commandItem.includes('_read_')) {
        if (
          response[commandItem] != null &&
          response[commandItem].order != null
        ) {
          let order = response[commandItem].order;
          let writing = response[commandItem].writing;
          if (order != -1) {
            console.log('order : ' + order + ' | writing : ' + writing);
            writings[order] = writing;
          }
        } else {
          //console.log('second loop');
          errorHandler(JSON.stringify(response[commandItem]));
        }
      }
    }
  }, errorHandler);
}

function apiCommands(id, commands) {
  return new Promise(function(resolve, reject) {
    api
      .post('/drone/' + id + '/commands', commands)
      .then(response => {
        //console.log(response.data);
        resolve(response.data);
      })
      .catch(err => {
        reject(err);
      });
  });
  /*  return new Promise((resolve, reject) => {
    api
      .post('/drone/' + id + '/commands', commands)
      .then(response => {
        console.log(response.data);
        resolve(response.data);
      })
      .catch(err => {
        reject(err);
      });
  });*/
}

let report = function(data) {
  if (writings.length == 0) {
    throw new exception('Call start before sending the report.');
  }

  console.log('Send report.');
  let reportD = '';
  for (let i = 0; i < writings.length; i++) {
    if (writings[i] != null) {
      reportD += writings[i];
    }
  }
  let reportdata = { message: reportD };

  api.post('/report', reportdata).then(function(response) {
    console.log(response.data);
  }, errorHandler);
};

let promiseWhile = Promise.method(function(condition, action) {
  if (!condition()) return;
  return action().then(promiseWhile.bind(null, condition, action));
});

function exception(message) {
  this.message = message;
}

function errorHandler(error) {
  return console.error('Failed!', error);
}

module.exports = {
  start,
  explore,
  report
};
