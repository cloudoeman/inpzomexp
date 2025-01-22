const regStrip = /^[\r\t\f\v ]+|[\r\t\f\v ]+$/gm;

const zoexDefault = {
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
  blacklist: '/[\u0600-\u06FF]+ | [\u0900-\u097f\u2600-\u26FF]+/', // default blacklist
}

const validate = function () {
  let valid = true;
  const status = document.getElementById("status");
  const blacklist = document.getElementById("blacklist");

  blacklist.value.split("\n").forEach((match) => {
    match = match.replace(regStrip, "");
  });
}

const restoreOptions = function () {
  chrome.storage.sync.get(zoexDefault, function (storage) {
    document.getElementById("enabled").checked = storage.enabled;
    document.getElementById("emojiP").value = storage.emojiP;
    document.getElementById("imgP").value = storage.imgP;
    document.getElementById("videoP").value = storage.videoP;
    document.getElementById("linkP").value = storage.linkP;
    document.getElementById("blueP").value = storage.blueP;
    document.getElementById("replyP").value = storage.replyP;
    document.getElementById("mixTrendWordP").value = storage.mixTrendWordP;
    document.getElementById("langP").value = storage.langP;
    document.getElementById("replyTimes").value = storage.replyTimes;
    document.getElementById("blacklist").value = storage.blacklist;
  });
}

const restoreDefaults = function () {
  chrome.storage.sync.set(zoexDefault, function () {
    restoreOptions();
    const status = document.getElementById("status");
    status.textContent = "Default options restored";
    setTimeout(function () {
      status.textContent = "";
    }, 1000);
  });
}



document.addEventListener("DOMContentLoaded", function () {
  restoreOptions();
  //document.getElementById("save").addEventListener("click", save_options);
  document.getElementById("restore").addEventListener("click", restoreDefaults);
});