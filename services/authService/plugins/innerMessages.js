// const cote = require("cote");
import cote from "cote";
const clientAuth = new cote.Requester({
  name: "AuthValidate",
  key: "Authentification_Service_key",
});

const sendCoteMessageToTestAuth = (message) => {
  return new Promise((resolve) => {
    clientAuth.send({ type: "getUser", message }, (getData) => {
      //   console.log(time);
      resolve(getData);
    });
  });
};
const clientError = new cote.Requester({
  name: "ErrorSet",
  key: "Error_Service_key",
});

const sendCoteMessageToError = (message) => {
  return new Promise((resolve) => {
    clientError.send({ type: "setError", message }, (error) => {
      resolve(error);
    });
  });
};

const clientEmail = new cote.Requester({
  name: "EmailSet",
  key: "Email_Service_key",
});

const sendCoteMessageToEmail = (data) => {
  return new Promise((resolve) => {
    clientEmail.send({ type: "sendEmail", data }, (result) => {
      resolve(result);
    });
  });
};

module.exports = {
  sendCoteMessageToTestAuth,
  sendCoteMessageToError,
  sendCoteMessageToEmail,
};
