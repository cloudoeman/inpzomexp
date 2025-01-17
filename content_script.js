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
      } else if(level === DEBUG_LEVEL.WARN) {
        console.warn(`[${level}] ${message}`);
      } else if(level === DEBUG_LEVEL.INFO) {
        console.info(`[${level}] %c${message}`, `color: ${color};`);
      } else {
        console.log(`[${level}] ${message}`);
      }
    }
  }
};


const observeObject = {
  config: { childList: true },
  flag: true,
  isUrl: undefined,
  category: undefined,

  
  mutationUrl: async function(mutations) {
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

  mutationList: function(mutationList) {
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

  observeStart: async function(isUrl) {
    debug.log(DEBUG_LEVEL.INFO, `${this.category}\nstart observe:${isUrl}`);
    await systemFunc.loadWait(systemFunc.getElmByDataTestIdTIME);       
    systemFunc.getElementByDataTestId();
    this.observer.observe(systemFunc.tweetsParent, this.config);
  }
}


const systemFunc = {
  TIMELINEURL: /^https:\/\/x.com\/.+\/status\/[0-9]+/,
  TRENDURL: /^https:\/\/x.com\/search\?q=.+&src=trend_click&vertical=trends/,
  TRENDWORDS: /^https:\/\/x.com\/explore.*/,
  WAITTIME: 0,
  getElmByDataTestIdTIME: 2000,
  document1: document,
  tweetsParent: undefined,
  tweetsList: undefined,
  preUrl: undefined,
  

  getElementByDataTestId: function() {
    const timeLineChild = this.document1.querySelector('[data-testid="cellInnerDiv"]');
    if (timeLineChild) {
      debug.log(DEBUG_LEVEL.DEBUG, 'get timeLineChild');
      this.tweetsParent = timeLineChild.parentNode;
      this.tweetsList = this.tweetsParent.childNodes;
    } else {
      debug.log(DEBUG_LEVEL.ERROR, 'timeLineChild is Null');
    }
  },

  loadWait: async function(ms) {
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });
  },

  restart: function() {
    //debug.log(DEBUG_LEVEL.INFO, 'rescanning', 'blue');
    console.info('%crescanning', 'font-weight: bold;');
    deleteObjects.delIdList.forEach(idName => {
      deleteObjects.delTweet(idName);
    });
    if (replyObjects.idCntList) {
      replyObjects.idCntList = {};
    }
    systemFunc.dataSet(this.tweetsList);
    debug.log(DEBUG_LEVEL.DEBUG, `idCntList:${replyObjects.idCntList}`);
    debug.log(DEBUG_LEVEL.INFO, `tweetTextList:${replyObjects.tweetTextList}`);
    deleteObjects.delId();
    debug.log(DEBUG_LEVEL.INFO, `finished`);
  },
  
  dataSet: function (TlLists) {
    TlLists.forEach((TlList, lisNum) => {
      //Excluding only tweet host.
      if (lisNum <= 2 && observeObject.category === 'reply') {
        return;
      }
      const usrId = this.setId(TlList);
      this.tweetTexts(TlList, usrId);
      this.addar(usrId);
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
          TlList.dataset.xusrid = usrId;// Set custom data attribute with user ID
          return usrId;
        } else {
          debug.log(DEBUG_LEVEL.ERROR, 'UsrIdEl is Null');
        }
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
      replyObjects.imgCheck(tlList);
      replyObjects.linkCheck(tlList);
      replyObjects.blueCheck(tlList,usrId);
      if (!replyObjects.tweetTextList[usrId]) {
        replyObjects.tweetTextList[usrId] = [replyText];
      } else if (!replyObjects.tweetTextList[usrId].includes(replyText)) {
        replyObjects.tweetTextList[usrId].push(replyText);
      }
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
      debug.log(DEBUG_LEVEL.INFO, `deltweet:${idName}`);
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


window.addEventListener("load", async (event) => {
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