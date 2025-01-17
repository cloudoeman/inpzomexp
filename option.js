const regStrip = /^[\r\t\f\v ]+|[\r\t\f\v ]+$/gm;

const zoexDefaults = {
  enabled: true, // default enabled
  replyTimes: 3, // default: 3
  blacklist: '/^[\u0900-\u097f\u2600-\u26FF]+$/'.replace(regStrip, "")
  [\u0600-\u061d-\u0900 - \u097f\u2600 -\u26FF]
};



const validate = function () {
  let valid = true;
  const status = document.getElementById("status");
  const blacklist = document.getElementById("blacklist");

  blacklist.value.split("\n").forEach((match) => {
    match = match.replace(regStrip, "");
  });
}