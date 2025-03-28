

const zombie_explosion = {
  settings: {
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
    blacklist: '/[\u0900-\u097f\u2600-\u26FF]+/', // default blacklist
  }
};


const DEBUG_LEVEL = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4
};

const debug = {
  level: DEBUG_LEVEL.INFO, // 初期レベルを設定
  log: (level, message, color = 'white') => {
    if (level <= debug.level) {
      if (level === DEBUG_LEVEL.ERROR) {
        console.error(`[${level}] ${message}`);
      } else if (level === DEBUG_LEVEL.WARN) {
        console.warn(`[${level}] ${message}`);
      } else if (level === DEBUG_LEVEL.INFO) {
        console.info(`[${level}] %c${message}`, `color: ${color};`);
      } else {
        console.log(`[${level}] ${message}`);
      }
    }
  }
};

// DOM監視オブジェクト
const observeObject = {
  config: { childList: true },
  flag: true,
  isUrl: undefined,
  category: undefined,


  //上位observer
  mutationUrl: async function (mutations) {
    const isUrl = location.href;
    if (isUrl !== systemFunc.preUrl) {
      // reply or trend or (other URL -> disconnect)
      if (systemFunc.preUrl) {
        this.observer.disconnect();
        debug.log(DEBUG_LEVEL.INFO, `observer was disconnected\n preUrl:${systemFunc.preUrl}`);
        systemFunc.preUrl = undefined;
        replyObjects.tweetTextList = {};

        // reply URL
      } else if (systemFunc.TIMELINEURL.test(isUrl)) {
        systemFunc.preUrl = isUrl;
        this.category = 'reply';
        this.observeStart(isUrl);

        // trend URL
      } else if (systemFunc.TRENDURL.test(isUrl)) {
        systemFunc.preUrl = isUrl;
        this.category = 'trend';
        this.observeStart(isUrl);

        // get trendWords
      } else if (systemFunc.TRENDWORDS.test(isUrl)) {
        if (systemFunc.preUrl !== isUrl && systemFunc.preUrl === undefined) {
          trendObjects.trendWords.length = 0;
        }
        systemFunc.preUrl = isUrl;
        await systemFunc.loadWait(systemFunc.getElmByDataTestIdTIME);
        systemFunc.getElementByDataTestId();
        trendObjects.getText(mutations);
        debug.log(DEBUG_LEVEL.INFO, `trendWords:${trendObjects.trendWords}`);
      }
    }
  },

  //下位observer
  mutationList: function (mutationList) {
    if (this.flag) {
      mutationList.forEach(async (mutation) => {
        if (mutation.addedNodes.length > 0 && this.flag) {
          debug.log(DEBUG_LEVEL.DEBUG, mutation.addedNodes);
          this.flag = false;
          systemFunc.restart();
          await systemFunc.loadWait(systemFunc.WAITTIME);
          this.flag = true;
          debug.log(DEBUG_LEVEL.INFO, `${systemFunc.WAITTIME}ms later`);
        }
      });
    }
  },

  //同じ処理を関数化
  observeStart: async function (isUrl) {
    debug.log(DEBUG_LEVEL.INFO, `${this.category}\nstart observe:${isUrl}`);
    await systemFunc.loadWait(systemFunc.getElmByDataTestIdTIME);
    systemFunc.getElementByDataTestId();
    this.observer.observe(systemFunc.tweetsParent, this.config);
  }
}

// システム用関数
const systemFunc = {
  TIMELINEURL: /^https:\/\/x.com\/.+\/status\/[0-9]+/,
  TRENDURL: /^https:\/\/x.com\/search\?q=.+&src=trend_click&vertical=trends/,
  TRENDWORDS: /^https:\/\/x.com\/explore.*/,
  WAITTIME: 0,
  getElmByDataTestIdTIME: 2000,
  document: document,
  tweetsParent: undefined,
  tweetsList: undefined,
  preUrl: undefined,
  idPointList: [],


  getElementByDataTestId: function () {
    const timeLineChild = this.document.querySelector('[data-testid="cellInnerDiv"]');
    if (timeLineChild) {
      debug.log(DEBUG_LEVEL.DEBUG, 'get timeLineChild');
      this.tweetsParent = timeLineChild.parentNode;
      this.tweetsList = this.tweetsParent.childNodes;
    } else {
      debug.log(DEBUG_LEVEL.ERROR, 'timeLineChild is Null');
    }
  },

  loadWait: async function (ms) {
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });
  },

  restart: function () {
    //debug.log(DEBUG_LEVEL.INFO, 'rescanning', 'blue');
    console.info('%crescanning', 'font-weight: bold;');

    if (deleteObjects.delIdList) {
      deleteObjects.delIdList.forEach(idName => {
        console.log(deleteObjects.delIdList);
        console.log(`deleted:${idName}`);
        deleteObjects.delTweet(idName);
      });
    }

    if (replyObjects.idCntList) {
      replyObjects.idCntList = {};
    }
    systemFunc.dataSet(this.tweetsList);
    console.log(replyObjects.idCntList);
    console.log(replyObjects.tweetTextList);
    deleteObjects.delId();
    debug.log(DEBUG_LEVEL.INFO, `finished`);
  },

  dataSet: function (TlLists) {
    TlLists.forEach((TlList, lisNum) => {
      //Excluding only tweet host.
      if (lisNum <= 1 && observeObject.category === 'reply') {
        return;
      }
      const usrId = this.setId(TlList);
      if (usrId) {
        this.tweetTexts(TlList, usrId);
        replyObjects.imgCheck(TlList);
        replyObjects.linkCheck(TlList);
        replyObjects.blueCheck(TlList, usrId);
        this.addar(usrId);
      }
    });
  },

  // Set custom data attribute with user ID
  setId: function (replyEl) {
    if (replyEl.querySelector('[role=link]')) {
      const UsrIdEl = replyEl.querySelector('a[href^="/"]');
      if (UsrIdEl) {
        let usrId = UsrIdEl.getAttribute('href');
        usrId = usrId.replace(/^\//g, '');
        if (!replyEl.querySelector(`[data-xusrid="${usrId}"]`)) {
          replyEl.dataset.xusrid = usrId;// Set custom data attribute with user ID
          return usrId;
        }
      } else {
        debug.log(DEBUG_LEVEL.ERROR, 'UsrIdEl is Null');
      }
    }
  },


  addar: function (usrId) {
    if (usrId in replyObjects.idCntList) {
      replyObjects.idCntList[usrId]++;
    } else {
      replyObjects.idCntList[usrId] = 1;
    }
  },

  tweetTexts: function (tlList, usrId) {
    if (tlList.querySelector('[data-testid="tweetText"]')) {
      const tweetText = tlList.querySelector('[data-testid="tweetText"]').innerText;
      const emojiStr = replyObjects.emojiCheck(tlList);
      let replyText = tweetText
      if (emojiStr) {
        replyText = tweetText + emojiStr;
      }
      if (!replyObjects.tweetTextList[usrId]) {
        replyObjects.tweetTextList[usrId] = [replyText];
      } else if (!replyObjects.tweetTextList[usrId].includes(replyText)) {
        replyObjects.tweetTextList[usrId].push(replyText);
      }
    }
  },

  createIdPointObject: function () {
    idCntList.forEach((idName, num) => {
      this.idPointList[num] = new idPoint(idName);
    });
  },

  tweetEval: function (text, num) {
    const emoji = replyObjects.emojiCheck();
    const img = replyObjects.imgCheck();
    const video = replyObjects.videoCheck();
    const link = replyObjects.linkCheck();
    const blue = replyObjects.blueCheck();
    if (text) {
      idPointList[num].emoji = false;
      idPointList[num].img = false;
      idPointList[num].video = false;
      idPointList[num].link = false;
    } else {

    }
  }
};

// リプライ用オブジェクト
const replyObjects = {
  EMOJI: /^https:\/\/abs-0.twimg.com\/emoji.*/, //https://abs-0.twimg.com/emoji/v2/svg/1f302.svg
  tweetTextList: {},
  idCntList: {}, //X_id_cnt

  emojiCheck: function (replyEl) {
    const emojis = replyEl.querySelectorAll('img');
    const emojiarry = [];
    if (emojis) {
      emojis.forEach(emoji => {
        if (this.EMOJI.test(emoji.src)) {
          emojiarry.push(emoji.alt);
        }
      });
      if (emojiarry.length > 0) {
        return emojiarry.join('');
      }
    }
  },

  imgCheck: function (replyEl) {
    const imgs = replyEl.querySelectorAll('img');
    if (imgs) {
      imgs.forEach(img => {
        if (img.alt === '画像') {
          debug.log(DEBUG_LEVEL.INFO, `img:${img.src}`); //img.src
        }
      });
    }
  },

  videoCheck: function (replyEl) {
    const videos = replyEl.querySelectorAll('img');
    debug.log(DEBUG_LEVEL.INFO, `videos:${videos}`);
    if (videos) {
      videos.forEach(video => {
        if (videos.alt === '埋め込み動画') {
          debug.log(DEBUG_LEVEL.INFO, `video:${videos.src}`); //videos.src
          return true;
        }
      });
    }
  },

  linkCheck: function (replyEl) {
    const links = replyEl.querySelectorAll('a');
    if (links.target === '_blank') {
      links.forEach(link => {
        if (link.href) {
          debug.log(DEBUG_LEVEL.INFO, `link:${link.href}`);
          return true;
        }
      });
    }
  },

  blueCheck: function (replyEl, usrId) {
    const blues = replyEl.querySelectorAll('svg');
    if (blues) {
      blues.forEach(blue => {
        if (blue.ariaLabel === '認証済みアカウント') {
          debug.log(DEBUG_LEVEL.INFO, `blue:${usrId}`); //usrId
          return true;
        }
      });
    }
  }
};

// トレンド用オブジェクト
const trendObjects = {
  trendWordsClass: "css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-b88u0q r-1bymd8e",
  trendWords: [],

  getText: function () {
    //live html collection
    const trendWordNodes = systemFunc.tweetsParent.getElementsByClassName(this.trendWordsClass);
    const xWords = [...trendWordNodes].map(node => node.innerText);
    xWords.forEach(xWord => {
      if (!(xWord in this.trendWords)) {
        this.trendWords.push(xWord);
      }
    });
  }
};

// リプライ削除用オブジェクト
const deleteObjects = {
  REPLYTIME: 3,
  delIdList: [],

  delId: function () {
    Object.keys(replyObjects.idCntList).forEach(idName => {
      if (replyObjects.idCntList[idName] >= this.REPLYTIME) {
        debug.log(DEBUG_LEVEL.INFO, `delID:${idName}`);
        this.delTweet(idName);
        if (!this.delIdList.includes(idName)) {
          this.delIdList.push(idName);
        }
      }
    });
  },

  delTweet: function (idName) {
    const delTweets = document.querySelectorAll(`[data-xusrid="${idName}"]`);
    delTweets.forEach(delTweet => {
      const delNodes = delTweet.childNodes;
      if (delNodes) {
        delNodes.forEach(delNode => {
          delNode.remove();
        });
      }
    });
  }
};

const optionSettings = function () {
  chrome.storage.sync.get(Object.keys(zombie_explosion.settings), function (items) {
    zombie_explosion.settings.enabled = items.enabled;
    zombie_explosion.settings.emojiP = items.emojiP;
    zombie_explosion.settings.imgP = items.imgP;
    zombie_explosion.settings.videoP = items.videoP;
    zombie_explosion.settings.linkP = items.linkP;
    zombie_explosion.settings.blueP = items.blueP;
    zombie_explosion.settings.replyP = items.replyP;
    zombie_explosion.settings.mixTrendWordP = items.mixTrendWordP;
    zombie_explosion.settings.langP = items.langP;
    zombie_explosion.settings.replyTimes = items.replyTimes;
    zombie_explosion.settings.blacklist = items.blacklist;
  });
};

class idPoint {
  constructor(idName) {
    this.id = idName;
    this.emoji = false;
    this.img = false;
    this.video = false;
    this.link = false;
    this.blue = false;
    this.reply = false;
    this.trendWord = false;
    this.lang = false;
    this.totalPoint = 0;
  }
  totalPoint() {
    this.totalPoint = this.emoji * zombie_explosion.settings.emojiP +
      this.img * zombie_explosion.settings.imgP +
      this.video * zombie_explosion.settings.videoP +
      this.link * zombie_explosion.settings.linkP +
      this.blue * zombie_explosion.settings.blueP +
      this.reply * zombie_explosion.settings.replyP +
      this.trendWord * zombie_explosion.settings.mixTrendWordP +
      this.lang * zombie_explosion.settings.langP;
  }
}



window.addEventListener("load", async (event) => {
  optionSettings();
  // 現在のURLを取得
  const isUrl = location.href;
  debug.log(DEBUG_LEVEL.INFO, `current URL:${isUrl}`);
  await systemFunc.loadWait(systemFunc.getElmByDataTestIdTIME);
  // DOM変更を監視
  debug.log(DEBUG_LEVEL.INFO, `start observe:${isUrl}(urlObserver)`);
  const urlObserver = new MutationObserver(observeObject.mutationUrl.bind(observeObject));
  urlObserver.observe(document.body, { childList: true, subtree: true });
  observeObject.observer = new MutationObserver(observeObject.mutationList.bind(observeObject));
});