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
    threshold: 5,
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
          //debug.log(DEBUG_LEVEL.INFO, `${systemFunc.WAITTIME}ms later`);
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
};


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

  debugTest: function () {
    systemFunc.idPointList.forEach((idPoint, num) => {
      console.groupCollapsed(`idPointList:${systemFunc.idPointList[num].id}`);
      debug.log(DEBUG_LEVEL.INFO, `num:${num}`);
      debug.log(DEBUG_LEVEL.INFO, `id:${idPoint.id}`);
      debug.log(DEBUG_LEVEL.INFO, `emoji:${idPoint.emoji}`);
      debug.log(DEBUG_LEVEL.INFO, `img:${idPoint.img}`);
      debug.log(DEBUG_LEVEL.INFO, `video:${idPoint.video}`);
      debug.log(DEBUG_LEVEL.INFO, `link:${idPoint.link}`);
      debug.log(DEBUG_LEVEL.INFO, `blue:${idPoint.blue}`);
      debug.log(DEBUG_LEVEL.INFO, `reply:${idPoint.reply}`);
      debug.log(DEBUG_LEVEL.INFO, `trendWord:${idPoint.trendWord}`);
      debug.log(DEBUG_LEVEL.INFO, `lang:${idPoint.lang}`);
      debug.log(DEBUG_LEVEL.INFO, `totalPoint:${idPoint.totalPoint}`);
      console.groupEnd();
    });
  },

  restart: function () {
    //debug.log(DEBUG_LEVEL.INFO, 'rescanning', 'blue');
    console.info('%cRescanning', 'font-weight: bold;');

    if (deleteObjects.delIdList) {
      deleteObjects.delIdList.forEach(idName => {
        console.log(deleteObjects.delIdList); //[object Object]になる為
        debug.log(DEBUG_LEVEL.INFO, `deleted:${idName}`);
        deleteObjects.delTweet(idName);
      });
    }

    systemFunc.dataSet(this.tweetsList);
    console.log(replyObjects.tweetTextList);//[object Object]になる為
    deleteObjects.delId();
    systemFunc.debugTest();
    debug.log(DEBUG_LEVEL.INFO, `finished`);
  },

  dataSet: function (TlLists) {
    TlLists.forEach((TlList, lisNum) => {
      if (lisNum <= 1 && observeObject.category === 'reply') {//Excluding only tweet host
        return;
      }
      const usrId = this.setId(TlList);
      if (!usrId) {
        return;
      } else if (!(usrId in replyObjects.tweetTextList)) {
        this.idPointList.push(new idPoint(usrId));
        debug.log(DEBUG_LEVEL.INFO, `instance class:${lisNum}:${usrId}`);
        checkObjects.tweetEval(TlList, usrId, checkObjects.targetNum(usrId));
      } else {
        debug.log(DEBUG_LEVEL.INFO, `RECHECK class:${usrId}`);
        checkObjects.tweetEval(TlList, usrId, checkObjects.targetNum(usrId));
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
};


// リプライ用オブジェクト
const replyObjects = {
  tweetTextList: {},
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
    systemFunc.idPointList.forEach((idList) => {
      if (idList.totalPoint >= zombie_explosion.settings.threshold) {
        const idName = idList.id;
        deleteObjects.delTweet(idName);
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


const checkObjects = {
  EMOJI: /^https:\/\/abs-0.twimg.com\/emoji.*/, //https://abs-0.twimg.com/emoji/v2/svg/1f302.svg

  tweetTexts: function (tlList, usrId) {
    let textCate = 0;
    const emojiStr = checkObjects.emojiCheck(tlList);
    let replyText = emojiStr ? emojiStr : null;
    if (emojiStr) {
      textCate = 1;
    }
    if (tlList.querySelector('[data-testid="tweetText"]')) {
      const tweetText = tlList.querySelector('[data-testid="tweetText"]').innerText;
      replyText = replyText ? tweetText + replyText : tweetText;
      textCate = 2;
    }
    if (!replyObjects.tweetTextList[usrId]) {
      replyObjects.tweetTextList[usrId] = [replyText];
    } else if (!replyObjects.tweetTextList[usrId].includes(replyText)) {
      replyObjects.tweetTextList[usrId].push(replyText);
    }
    return textCate;
  },

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
    let boo = false;
    const imgs = replyEl.querySelectorAll('img');
    if (imgs) {
      imgs.forEach(img => {
        if (img.alt === '画像') {
          debug.log(DEBUG_LEVEL.INFO, `img:${img.src}`); //img.src
          boo = true;
        }
      });
    }
    return boo;
  },

  videoCheck: function (replyEl) {
    let boo = false;
    const videos = replyEl.querySelectorAll('img');
    debug.log(DEBUG_LEVEL.INFO, `videos:${videos}`);
    if (videos) {
      videos.forEach(video => {
        if (video.alt === '埋め込み動画') {
          debug.log(DEBUG_LEVEL.INFO, `videoCheck:${video.src}`); //videos.src
          debug.log(DEBUG_LEVEL.INFO, `videoCheck:${video}`);
          boo = true;
        }
      });
    }
    return boo;
  },

  linkCheck: function (replyEl) {
    let boo = false;
    const links = replyEl.querySelectorAll('a');
    if (links.target === '_blank') {
      links.forEach(link => {
        if (link.href) {
          debug.log(DEBUG_LEVEL.INFO, `link:${link.href}`);
          boo = true;
        }
      });
    }
    return boo;
  },

  blueCheck: function (replyEl) {
    let boo = 0;
    const blues = replyEl.querySelectorAll('svg');
    if (blues) {
      blues.forEach(blue => {
        if (blue.ariaLabel === '認証済みアカウント') {
          //debug.log(DEBUG_LEVEL.INFO, `blue:${usrId}`); //usrId
          boo = 1;
        }
      });
    }
    debug.log(DEBUG_LEVEL.INFO, `bluebool:${boo}`);
    return boo;
  },

  tweetEval: function (replyEl, usrId, num) {
    const textCate = checkObjects.tweetTexts(replyEl, usrId);
    const img = checkObjects.imgCheck(replyEl);
    const video = checkObjects.videoCheck(replyEl);
    const link = checkObjects.linkCheck(replyEl);
    const blue = checkObjects.blueCheck(replyEl);
    const replyT = replyObjects.tweetTextList[usrId].length > zombie_explosion.settings.replyTimes ? 1 : 0;
    const evalPoint = img + video + link;

    if (evalPoint === 1 && textCate === 0) {
      switch (true) {
        case img:
          systemFunc.idPointList[num].img = 1;
          break;
        case video:
          systemFunc.idPointList[num].video = 1;
          break;
        case link:
          systemFunc.idPointList[num].link = 1;
          break;
        default:
          debug.log(DEBUG_LEVEL.ERROR, `evalPoint:${evalPoint}`);
      }
    } else if (textCate === 1) {
      systemFunc.idPointList[num].emoji = 1;
    } else {
      debug.log(DEBUG_LEVEL.INFO, `\"392\"evalPoint:${evalPoint}`);
    }
    systemFunc.idPointList[num].blue = blue;
    if (observeObject.category === 'reply') {
      systemFunc.idPointList[num].reply = replyT;
    }
    systemFunc.idPointList[num].ratingCalculation();
  },

  targetNum: function (usrId) {
    let n = -1; // 初期値を -1 など、見つからなかったことを示す値に設定
    systemFunc.idPointList.forEach((list, num) => {
      if (list.id === usrId) {
        n = num;
        debug.log(DEBUG_LEVEL.INFO, `list.id:${list.id} n:${n}`);
      }
    });
    return n;
  }
}


const optionSettings = function () {
  chrome.storage.sync.get(Object.keys(zombie_explosion.settings), function (items) {
    if (items.enabled !== undefined) {
      zombie_explosion.settings.enabled = Number(items.enabled);
      zombie_explosion.settings.emojiP = Number(items.emojiP);
      zombie_explosion.settings.imgP = Number(items.imgP);
      zombie_explosion.settings.videoP = Number(items.videoP);
      zombie_explosion.settings.linkP = Number(items.linkP);
      zombie_explosion.settings.blueP = Number(items.blueP);
      zombie_explosion.settings.replyP = Number(items.replyP);
      zombie_explosion.settings.mixTrendWordP = Number(items.mixTrendWordP);
      zombie_explosion.settings.langP = Number(items.langP);
      zombie_explosion.settings.replyTimes = Number(items.replyTimes);
      zombie_explosion.settings.blacklist = items.blacklist;
    }
  });
};


class idPoint {
  constructor(idName) {
    this.id = idName;
    this.emoji = 0;
    this.img = 0;
    this.video = 0;
    this.link = 0;
    this.blue = 0;
    this.reply = 0;
    this.trendWord = 0;
    this.lang = 0;
    this.totalPoint = 0;
  }
  ratingCalculation() {
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