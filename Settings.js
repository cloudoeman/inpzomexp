const regStrip = /^[\r\t\f\v\n ]+|[\r\t\f\v\n ]+$/gm;

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
  blacklist: `[\\u0600-\\u06FF]+
    [\\u0900-\\u097f\\u2600-\\u26FF]+
  `.replace(regStrip, ""), // default blacklist
}
//ex /[\\u0600-\\u06FF]+\n[\\u0900-\\u097f\\u2600-\\u26FF]+/
/*
const validate = function () {
  let valid = true;
  const status = document.getElementById("status");
  let blacklist = document.getElementById("blacklist");

  blacklist = blacklist.replace(regStrip, "");
  if (blacklist.startsWith("/")) {
    try {
      const parts = blacklist.split("/");

      if (parts.length > 3)
        throw "invalid regex";

      const flags
    }
  }
  blacklist.value.split("\n").forEach((match) => {
    match = match.replace(regStrip, "");

    if (match.startsWith("[")) {
      try {
        const parts = match.split("[");

        if (!match.endsWith("+"))
          throw "invalid regex";
        /*
        var flags = parts.pop();
        var regex = parts.slice(1).join("/");
 
        var regexp = new RegExp(regex, flags);
        
      } catch (err) {
        status.textContent =
          "Error: Invalid blacklist regex: \"" + match + "\". Unable to save. Try wrapping it in foward slashes.";
        valid = false;
        return;
      }
    }
  });
  return valid;
}
*/

const saveOptions = function () {
  /*
  if(validate() === false) {
    return;
  }
  */

  const enabled = document.getElementById("enabled").checked;
  const emojiP = document.getElementById("emojiP").value;
  const imgP = document.getElementById("imgP").value;
  const videoP = document.getElementById("videoP").value;
  const linkP = document.getElementById("linkP").value;
  const blueP = document.getElementById("blueP").value;
  const replyP = document.getElementById("replyP").value;
  const mixTrendWordP = document.getElementById("mixTrendWordP").value;
  const langP = document.getElementById("langP").value;
  const replyTimes = document.getElementById("replyTimes").value;
  const blacklist = document.getElementById("blacklist").value;

  chrome.storage.sync.set(
    {
      enabled: true, // default enabled
      emojiP: emojiP,
      imgP: imgP,
      videoP: videoP,
      linkP: linkP,
      blueP: blueP,
      replyP: replyP,
      mixTrendWordP: mixTrendWordP,
      langP: langP,
      replyTimes: replyTimes,
      blacklist: blacklist.replace(regStrip, ""), // default blacklist
    },
    function () {
      const status = document.getElementById("status");
      status.textContent = "Options saved";
      console.log(blacklist);
      setTimeout(function () {
        status.textContent = "";
      }, 1000);
    }
  );
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
  document.getElementById("save").addEventListener("click", saveOptions);
  document.getElementById("restore").addEventListener("click", restoreDefaults);
});