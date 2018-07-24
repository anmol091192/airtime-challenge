let axios = require('axios');
const API_ROOT = 'http://challenge2.airtime.com:10001';

const get = path => {
  return new Promise((resolve, reject) => {
    axios
      .get(`${API_ROOT}${path}`, {
        headers: {
          'x-commander-email': 'abc@aa.com',
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        reject(error.response);
      });
  });
};

const post = (path, data) => {
  return new Promise((resolve, reject) => {
    axios
      .post(`${API_ROOT}${path}`, data, {
        headers: {
          'x-commander-email': 'abc@aa.com'
        }
      })
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        reject(error.response);
      });
  });
};

module.exports = {
  get,
  post
};
