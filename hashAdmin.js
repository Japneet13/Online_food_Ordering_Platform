// hashAdmin.js
const bcrypt = require('bcrypt');

const plainPassword = 'jk@13'; // you can change it
const saltRounds = 10;

bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
  } else {
    console.log('Hashed password:', hash);
  }
});
