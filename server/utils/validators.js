const validateEmail = (email) => {
  const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

const validateUsername = (username) => {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

module.exports = {
  validateEmail,
  validateUsername,
  validatePassword
};
