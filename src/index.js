firebase.initializeApp({
  apiKey: 'AIzaSyD1x281H24sd_lsyrLzP3e5SVX6_BCmOVU',
  authDomain: 'fooo-e20b5.firebaseapp.com',
  databaseURL: 'https://fooo-e20b5.firebaseio.com',
  projectId: 'fooo-e20b5',
  storageBucket: 'fooo-e20b5.appspot.com',
  messagingSenderId: '240653320347',
  appId: '1:240653320347:web:1f298d64bc19a0e8fd463e',
  measurementId: 'G-0JRW8RZ1V3',
});

const constant = {
  table: {
    boards: 'boards',
    connections: 'connections',
  },
  pushNotification: {
    url: 'https://yuzuru-line.netlify.app/.netlify/functions/api/v1/push',
    authorization: 'Bearer abc',
  },
};

const state = {
  active: true,
  popUp: false,
  setActive: function (bol) {
    if (bol && !this.popUp) {
      // 再接続
      firebase.database().goOnline();
    } else {
      // 切断
      firebase.database().goOffline();
    }
  },
  setPopUp: function (bol) {
    this.popUp = bol;
  },
};

ifvisible.on('focus', () => state.setActive(true));
ifvisible.on('blur', () => state.setActive(false));

const reactStringReplace = (source, match, fn) => {
  var isRegExp = _.isRegExp;
  var escapeRegExp = _.escapeRegExp;
  var isString = _.isString;
  var flatten = _.flatten;

  function replaceString(str, match, fn) {
    var curCharStart = 0;
    var curCharLen = 0;

    if (str === '') {
      return str;
    } else if (!str || !isString(str)) {
      throw new TypeError(
        'First argument to react-string-replace#replaceString must be a string'
      );
    }

    var re = match;

    if (!isRegExp(re)) {
      re = new RegExp('(' + escapeRegExp(re) + ')', 'gi');
    }

    var result = str.split(re);

    // Apply fn to all odd elements
    for (var i = 1, length = result.length; i < length; i += 2) {
      curCharLen = result[i].length;
      curCharStart += result[i - 1].length;
      result[i] = fn(result[i], i, curCharStart);
      curCharStart += curCharLen;
    }

    return result;
  }

  if (!Array.isArray(source)) source = [source];

  return flatten(
    source.map(function (x) {
      return isString(x) ? replaceString(x, match, fn) : x;
    })
  );
};

// プッシュ通知
const pushNotification = async message => {
  // if (process.env.NODE_ENV !== 'production') {
  //   return;
  // }
  // fetch(constant.pushNotification.url, {
  //   method: 'post',
  //   headers: {
  //     Authorization: constant.pushNotification.authorization,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     message: message,
  //   }),
  // });
};

const setList = async list => {
  document.getElementsByClassName('line-bc')[0].innerHTML = '';

  const _uid = await firebase.auth().currentUser?.uid;
  list.map((m, i) => {
    const _messages = reactStringReplace(
      m.message,
      /(https?:\/\/\S+)/g,
      (match, i) => {
        return { match: match };
      }
    );

    i === 0 ? console.log(_messages) : '';

    if (m.uid === _uid) {
      const _html = `
        <div>
          <div class="clearfix">
            <div class="float-right">
              <div style="color: #fff; font-size: 12px;">
                ${m.uname === undefined ? '名無し' : _.escape(m.uname)}
              </div>
              <div style="color: #fff; font-size: 12px;">
                ${_.escape(m.uid)}
              </div>
            </div>
          </div>

          <div class="clearfix">
            <div class="balloon2 float-right">
              ${_messages.reduce((accumulator, child) => {
                if (_.isString(child)) {
                  accumulator += _.escape(child);
                  return accumulator;
                }

                accumulator += `<a href="${child['match']}" target="_blank" rel="noopener noreferrer">${child['match']}</a>`;
                return accumulator;
              }, '')}
            </div>
          </div>

          <div class="clearfix">
            <div class="float-right">
              <time style="font-size: 12px;">
                ${_.escape(
                  moment(new Date(m.createdAt)).format('YYYY-MM-DD HH:mm:ss')
                )}
              </time>
            </div>
          </div>
          <br />
        </div>
      `;
      document.getElementsByClassName('line-bc')[0].innerHTML += _html;
      return;
    }

    const _html = `
      <div>
        <div style="color: #fff; font-size: 12px;">
          ${m.uname === undefined ? '名無し' : _.escape(m.uname)}
        </div>

        <div style="color: #fff; font-size: 12px;">
          ${_.escape(m.uid)}
        </div>

        <div class="clearfix">
          <div class="balloon1 float-left">
            ${_messages.reduce((accumulator, child) => {
              if (_.isString(child)) {
                accumulator += _.escape(child);
                return accumulator;
              }

              accumulator += `<a href="${child['match']}" target="_blank" rel="noopener noreferrer">${child['match']}</a>`;
              return accumulator;
            }, '')}
          </div>
        </div>

        <div class="clearfix">
          <time style="font-size: 12px;">
            ${_.escape(
              moment(new Date(m.createdAt)).format('YYYY-MM-DD HH:mm:ss')
            )}
          </time>
        </div>
        <br />
      </div>
    `;

    document.getElementsByClassName('line-bc')[0].innerHTML += _html;
  });
};

// 初期化
const init = () => {
  const _connectionMonitoring = async () => {
    const presenceRef = firebase.database().ref('/.info/connected');
    const listRef = firebase
      .database()
      .ref(
        constant.table.connections +
          '/' +
          (await firebase.auth().currentUser?.uid)
      );
    const userRef = listRef.push();

    presenceRef.on('value', async snap => {
      if (snap.val()) {
        userRef.onDisconnect().remove();
        userRef.set(await firebase.auth().currentUser?.uid);
      }
    });

    firebase
      .database()
      .ref('connections')
      .on('value', s => {
        document.getElementById('_su').textContent =
          '接続ユーザ数: ' + s.numChildren();
      });
  };

  const _list = () => {
    firebase
      .database()
      .ref(constant.table.boards)
      .orderByChild('createdAt')
      .limitToLast(50)
      .on('value', snapshot => {
        let _data = [];
        snapshot.forEach(childSnapshot => {
          _data.push(childSnapshot.val());
        });

        setList(_.orderBy(_data, 'createdAt', 'desc'));

        // くるくるもどす
        document.getElementById('_loading').style.display = 'none';
        document.getElementById('app').style.display = 'block';

        _connectionMonitoring();
      });
  };

  firebase.auth().onAuthStateChanged(async data => {
    if (data === null) {
      // 匿名ログイン
      await firebase.auth().signInAnonymously();
      return;
    }

    if (data.providerData.length !== 0) {
      document.getElementById('button').innerHTML = `
        <button type="button" class="btn btn-danger" id="logout">ログアウト</button>
      `;

      document.getElementById('logout').onclick = () => {
        firebase.database().goOffline();
        firebase
          .auth()
          .signOut()
          .then(() => {
            location.reload();
          })
          .catch(error => {});
      };
    } else {
      document.getElementById('button').innerHTML = `
        <button type="button" class="btn btn-success" id="login">ログイン</button>
      `;

      document.getElementById('login').onclick = async () => {
        // ローディング画面にする
        document.getElementById('_loading').style.display = 'block';
        document.getElementById('app').style.display = 'none';

        state.setPopUp(true);

        // delete connections
        firebase
          .database()
          .ref(constant.table.connections)
          .child(await firebase.auth().currentUser?.uid)
          .remove();

        const provider = new firebase.auth.TwitterAuthProvider();
        firebase
          .auth()
          .signInWithPopup(provider)
          .then(async result => {
            location.reload();
          })
          .catch(e => location.reload());
      };
    }

    // lineに通知
    pushNotification(await firebase.auth().currentUser?.uid);

    _list();
  });
};

// 投稿
document.getElementById('post').onclick = async e => {
  if (!document.getElementById('form').checkValidity()) {
    return;
  }

  e.preventDefault();

  const _message = document.getElementById('textarea').value;

  document.getElementById('textarea').value = '';
  document.getElementById('textarea')?.blur();

  await firebase
    .database()
    .ref(constant.table.boards)
    .push({
      uid: await firebase.auth().currentUser?.uid,
      uname: document.getElementById('input').value,
      message: _message.trim(),
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    });

  document.getElementById('textarea')?.focus();

  // lineに通知
  pushNotification(await firebase.auth().currentUser?.uid);
};

// エンターで送信
document.getElementById('textarea').onkeypress = e => {
  if ((e.keyCode || e.charCode || 0) == 13) {
    document.getElementById('post').click();
  }
};

init();
