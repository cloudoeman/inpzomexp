const regStrip = /^[\r\t\f\v ]+|[\r\t\f\v ]+$/gm;

const zoexSettings = {
  enabled: true, // default enabled
  emojiP: 3,
  imgP: 1,
  videoP: 1,
  linkP: 1,
  blueP: 1,
  replyP: 3,
  mixTrendWordP: 3,
  langP: 3,
  replyTimes: 3,
  blacklist: '/[\u0600-\u06FF]+[\u0900-\u097f\u2600-\u26FF]+/', // default blacklist
}



const validate = function () {
  let valid = true;
  const status = document.getElementById("status");
  const blacklist = document.getElementById("blacklist");

  blacklist.value.split("\n").forEach((match) => {
    match = match.replace(regStrip, "");
  });
}