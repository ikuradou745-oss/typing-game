/**
 * Typing Game - Professional Online Edition
 * フルコードでの提供（省略・簡略化一切なし）
 */

import { initializeApp } from "firebase/app";
import { 
    getDatabase, ref, set, get, update, onValue, 
    onDisconnect, remove, off, serverTimestamp 
} from "firebase/database";

// ==========================================================
// 1. Firebase 初期設定
// ==========================================================
const firebaseConfig = {
    apiKey: "AIzaSyBXnNXQ5khcR0EvRide4C0PjshJZpSF4oM",
    authDomain: "typing-game-28ed0.firebaseapp.com",
    projectId: "typing-game-28ed0",
    storageBucket: "typing-game-28ed0.firebasestorage.app",
    messagingSenderId: "963797267101",
    appId: "1:963797267101:web:0d5d700458fb1991021a74",
    measurementId: "G-CL4B6ZK0SC"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================================
// 2. ユーザーデータ管理
// ==========================================================
const STORAGE_ID = "TYPING_USER_ID_8";
const STORAGE_NAME = "TYPING_USER_NAME_8";
const STORAGE_BEST = "TYPING_BEST_";
const STORAGE_CUSTOM = "CUSTOM_TYPING_LIST";

let myCode = localStorage.getItem(STORAGE_ID);
if (!myCode) {
    myCode = Math.floor(10000000 + Math.random() * 90000000).toString();
    localStorage.setItem(STORAGE_ID, myCode);
}

let myName = localStorage.getItem(STORAGE_NAME);
if (!myName) {
    myName = "プレイヤー" + Math.floor(Math.random() * 1000);
    localStorage.setItem(STORAGE_NAME, myName);
}

document.getElementById("my-friend-code").innerText = myCode;
document.getElementById("display-name").innerText = myName;
const nameInput = document.getElementById("name-input");
if (nameInput) nameInput.value = myName;

// ==========================================================
// 3. サウンドエンジン
// （ご指定通り：クリック、タイピング、完了、対戦終了の4種）
// ==========================================================
const playSfx = (id) => { 
    const el = document.getElementById(id); 
    if (el) { 
        el.currentTime = 0; 
        el.play().catch((err) => {
            console.warn("Audio play blocked:", err);
        }); 
    } 
};

// ==========================================================
// 4. 単語データ & ローマ字定義 (省略なし)
// ==========================================================
const words = [
    { k: "林檎", kana: "りんご", lv: "easy" }, { k: "猫", kana: "ねこ", lv: "easy" }, 
    { k: "犬", kana: "いぬ", lv: "easy" }, { k: "本", kana: "ほん", lv: "easy" }, 
    { k: "空", kana: "そら", lv: "easy" }, { k: "海", kana: "うみ", lv: "easy" },
    { k: "山", kana: "やま", lv: "easy" }, { k: "花", kana: "はな", lv: "easy" }, 
    { k: "雨", kana: "あめ", lv: "easy" }, { k: "お茶", kana: "おちゃ", lv: "easy" }, 
    { k: "寿司", kana: "すし", lv: "easy" }, { k: "時計", kana: "とけい", lv: "easy" },
    
    { k: "学校", kana: "がっこう", lv: "normal" }, { k: "友達", kana: "ともだち", lv: "normal" }, 
    { k: "先生", kana: "せんせい", lv: "normal" }, { k: "勉強", kana: "べんきょう", lv: "normal" }, 
    { k: "自転車", kana: "じてんしゃ", lv: "normal" }, { k: "携帯電話", kana: "けいたいでんわ", lv: "normal" },
    { k: "図書館", kana: "としょかん", lv: "normal" }, { k: "音楽", kana: "おんがく", lv: "normal" }, 
    { k: "映画", kana: "えいが", lv: "normal" }, { k: "挑戦", kana: "ちょうせん", lv: "normal" }, 
    { k: "秘密", kana: "ひみつ", lv: "normal" }, { k: "希望", kana: "きぼう", lv: "normal" },
    { k: "動物園", kana: "どうぶつえん", lv: "normal" }, { k: "水族館", kana: "すいぞくかん", lv: "normal" }, 
    { k: "遊園地", kana: "ゆうえんち", lv: "normal" }, { k: "新聞紙", kana: "しんぶんし", lv: "normal" }, 
    { k: "飛行機", kana: "ひこうき", lv: "normal" }, { k: "新幹線", kana: "しんかんせん", lv: "normal" },
    { k: "冷蔵庫", kana: "れいぞうこ", lv: "normal" }, { k: "洗濯機", kana: "せんたくき", lv: "normal" },
    
    { k: "一生懸命", kana: "いっしょうけんめい", lv: "hard" }, { k: "温故知新", kana: "おんこちしん", lv: "hard" }, 
    { k: "試行錯誤", kana: "しこうさくご", lv: "hard" }, { k: "プログラミング", kana: "ぷろぐらみんぐ", lv: "hard" }, 
    { k: "自分自身", kana: "じぶんじしん", lv: "hard" }, { k: "宇宙旅行", kana: "うちゅうりょこう", lv: "hard" },
    { k: "最高速度", kana: "さいこうそくど", lv: "hard" }, { k: "勇猛果敢", kana: "ゆうもうかかん", lv: "hard" }, 
    { k: "一石二鳥", kana: "いっせきにちょう", lv: "hard" }, { k: "四字熟語", kana: "よじじゅくご", lv: "hard" }, 
    { k: "春夏秋冬", kana: "しゅんかしゅうとう", lv: "hard" }, { k: "起死回生", kana: "きしかいせい", lv: "hard" },
    { k: "以心伝心", kana: "いしんでんしん", lv: "hard" }, { k: "完全無欠", kana: "かんぜんむけつ", lv: "hard" }, 
    { k: "自業自得", kana: "じごうじとく", lv: "hard" }, { k: "前代未聞", kana: "ぜんだいみもん", lv: "hard" }, 
    { k: "臨機応変", kana: "りんきおうへん", lv: "hard" }, { k: "天真爛漫", kana: "てんしんらんまん", lv: "hard" },
    { k: "七転八起", kana: "しちてんはっき", lv: "hard" }, { k: "電光石火", kana: "でんこうせっか", lv: "hard" }
];

const romajiTable = {
    'あ':['a'], 'い':['i'], 'う':['u','wu'], 'え':['e'], 'お':['o'],
    'か':['ka','ca'], 'き':['ki'], 'く':['ku','cu','qu'], 'け':['ke'], 'こ':['ko','co'],
    'さ':['sa'], 'し':['shi','si','ci'], 'す':['su'], 'せ':['se','ce'], 'そ':['so'],
    'た':['ta'], 'ち':['chi','ti'], 'つ':['tsu','tu'], 'て':['te'], 'と':['to'],
    'な':['na'], 'に':['ni'], 'ぬ':['nu'], 'ね':['ne'], 'の':['no'],
    'は':['ha'], 'ひ':['hi'], 'ふ':['fu','hu'], 'へ':['he'], 'ほ':['ho'],
    'ま':['ma'], 'み':['mi'], 'む':['mu'], 'め':['me'], 'も':['mo'],
    'や':['ya'], 'ゆ':['yu'], 'よ':['yo'],
    'ら':['ra'], 'り':['ri'], 'る':['ru'], 'れ':['re'], 'ろ':['ro'],
    'わ':['wa'], 'を':['wo'], 'ん':['nn','n','xn'],
    'が':['ga'], 'ぎ':['gi'], 'ぐ':['gu'], 'げ':['ge'], 'ご':['go'],
    'ざ':['za'], 'じ':['ji','zi'], 'ず':['zu'], 'ぜ':['ze'], 'ぞ':['zo'],
    'だ':['da'], 'ぢ':['di'], 'づ':['du'], 'で':['de'], 'ど':['do'],
    'ば':['ba'], 'び':['bi'], 'ぶ':['bu'], 'べ':['be'], 'ぼ':['bo'],
    'ぱ':['pa'], 'ぴ':['pi'], 'ぷ':['pu'], 'ぺ':['pe'], 'ぽ':['po'],
    'きゃ':['kya'], 'きゅ':['kyu'], 'きょ':['kyo'],
    'しゃ':['sha','sya'], 'しゅ':['shu','syu'], 'しょ':['sho','syo'],
    'ちゃ':['cha','tya','cya'], 'ちゅ':['chu','tyu','cyu'], 'ちょ':['cho','tyo','cyo'],
    'にゃ':['nya'], 'にゅ':['nyu'], 'にょ':['nyo'],
    'ひゃ':['hya'], 'ひゅ':['hyu'], 'ひょ':['hyo'],
    'みゃ':['mya'], 'みゅ':['myu'], 'みょ':['myo'],
    'りゃ':['rya'], 'りゅ':['ryu'], 'りょ':['ryo'],
    'ぎゃ':['gya'], 'ぎゅ':['gyu'], 'ぎょ':['gyo'],
    'じゃ':['ja','jya','zya'], 'じゅ':['ju','jyu','zyu'], 'じょ':['jo','jyo','zyo'],
    'びゃ':['bya'], 'びゅ':['byu'], 'びょ':['byo'],
    'ぴゃ':['pya'], 'ぴゅ':['pyu'], 'ぴょ':['pyo'],
    'ふぁ':['fa'], 'ふぃ':['fi'], 'ふぇ':['fe'], 'ふぉ':['fo'],
    'てぃ':['thi'], 'でぃ':['dhi'],
    'っ':['xtsu', 'ltu', 'ltsu'],
    'ゃ':['xya', 'lya'], 'ゅ':['xyu', 'lyu'], 'ょ':['xyo', 'lyo'],
    'ぁ':['xa', 'la'], 'ぃ':['xi', 'li'], 'ぅ':['xu', 'lu'], 'ぇ':['xe', 'le'], 'ぉ':['xo', 'lo'],
    'ー':['-']
};

function parseKana(kanaText) {
    let nodes = [];
    for (let i = 0; i < kanaText.length; i++) {
        let chunk = kanaText[i];
        let next = kanaText[i+1];
        if (next && ['ゃ','ゅ','ょ','ぁ','ぃ','ぅ','ぇ','ぉ'].includes(next)) { chunk += next; i++; }
        nodes.push({ k: chunk, opts: romajiTable[chunk] ? [...romajiTable[chunk]] : [chunk] });
    }
    for (let i = 0; i < nodes.length; i++) {
        let n = nodes[i];
        if (n.k === 'っ' && i + 1 < nodes.length) {
            let nextOpts = nodes[i+1].opts;
            nextOpts.forEach(opt => {
                let firstChar = opt[0];
                if (!['a','i','u','e','o','y','n'].includes(firstChar)) {
                    if (!n.opts.includes(firstChar)) n.opts.push(firstChar);
                }
            });
        }
        if (n.k === 'ん') {
            if (i + 1 < nodes.length) {
                let startsWithSpecial = nodes[i+1].opts.some(opt => ['a','i','u','e','o','y','n'].includes(opt[0]));
                if (!startsWithSpecial && !n.opts.includes('n')) n.opts.push('n');
            }
        }
    }
    return nodes;
}

// ==========================================================
// 5. ゲーム状態管理
// ==========================================================
let tState = { nodes: [], cIdx: 0, typedInNode: "", validOpts: [], textDone: "" };
let isPlaying = false, isBattleMode = false;
let score = 0, combo = 0, currentLevel = "easy";
let battleTimer = null, timeLeft = 0, totalTime = 0;
let currentScreen = "mode";

const screens = {
    mode: document.getElementById("mode-selection"),
    diff: document.getElementById("difficulty-selection"),
    setup: document.getElementById("battle-setup"),
    wait: document.getElementById("battle-waiting"),
    game: document.getElementById("game-play-area"),
    result: document.getElementById("result-screen"),
    online: document.getElementById("online-selection"),
    onlinewait: document.getElementById("online-waiting"),
    editor: document.getElementById("custom-editor")
};

window.showScreen = (key) => {
    Object.keys(screens).forEach(k => {
        if (screens[k]) screens[k].classList.add("hidden");
    });
    if (screens[key]) {
        screens[key].classList.remove("hidden");
        currentScreen = key;
    }
    if (key === 'diff') {
        ["easy", "normal", "hard"].forEach(lv => {
            const el = document.getElementById("best-" + lv);
            if (el) el.innerText = localStorage.getItem(STORAGE_BEST + lv) || 0;
        });
    }
};

// ==========================================================
// 6. メインゲームロジック
// ==========================================================
function startGame(time = 0) {
    score = 0; 
    combo = 0;
    isPlaying = true;
    showScreen("game");
    
    const lanes = document.getElementById("rival-lanes");
    const bHeader = document.getElementById("battle-header");

    if (isBattleMode) {
        timeLeft = time;
        totalTime = time;
        if (bHeader) bHeader.classList.remove("hidden");
        if (lanes) {
            lanes.classList.remove("hidden");
            lanes.classList.remove("half-time-fog"); // 初期化時はフォグを外す
        }
        updateTimerDisplay();
        
        battleTimer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            // 【重要】半分経過で相手の情報を隠す（自分は見える）CSSクラスの付与
            if (lanes) {
                if (timeLeft <= totalTime / 2) { 
                    lanes.classList.add("half-time-fog"); 
                } else { 
                    lanes.classList.remove("half-time-fog"); 
                }
            }

            if (timeLeft <= 0) {
                endBattle();
            }
            
            if (curParty) {
                set(ref(db, `parties/${curParty}/battle/scores/${myCode}`), { 
                    name: myName, 
                    score: score 
                });
            }
        }, 1000);
    } else {
        if (bHeader) bHeader.classList.add("hidden");
        if (lanes) lanes.classList.add("hidden");
    }

    nextWord();
}

function nextWord() {
    let pool = currentLevel === "custom" 
        ? customTypingData.map(w => ({ k: w, kana: w, lv: "custom" })) 
        : words.filter(w => w.lv === currentLevel);

    if (pool.length === 0) pool = [{ k: "データなし", kana: "でーたなし", lv: "easy" }];
    const target = pool[Math.floor(Math.random() * pool.length)];
    
    tState.nodes = parseKana(target.kana);
    tState.cIdx = 0;
    tState.typedInNode = "";
    tState.validOpts = [...tState.nodes[0].opts];
    tState.textDone = "";

    const wordEl = document.getElementById("japanese-word");
    if (wordEl) wordEl.innerText = target.k;
    updateDisplay();
}

function getHintString() {
    let hint = "";
    for (let i = 0; i < tState.nodes.length; i++) {
        if (i < tState.cIdx) continue;
        if (i === tState.cIdx) {
            let bestOpt = [...tState.validOpts].sort((a,b) => a.length - b.length)[0] || tState.nodes[i].opts[0];
            hint += bestOpt.substring(tState.typedInNode.length);
        } else {
            hint += [...tState.nodes[i].opts].sort((a,b) => a.length - b.length)[0];
        }
    }
    return hint;
}

function updateDisplay() {
    document.getElementById("char-done").innerText = tState.textDone;
    document.getElementById("char-todo").innerText = getHintString();
    document.getElementById("score-count").innerText = score;
    
    const cbEl = document.getElementById("combo-display");
    if (cbEl) {
        cbEl.innerText = combo > 0 ? combo + " COMBO" : "";
        combo > 0 ? cbEl.classList.add("active") : cbEl.classList.remove("active");
    }
}

function updateTimerDisplay() {
    const timerEl = document.getElementById("timer-display");
    if (timerEl) timerEl.innerText = `TIME: ${timeLeft}`;
}

window.addEventListener("keydown", (e) => {
    if (!isPlaying) return;
    const key = e.key.toLowerCase();
    if (key.length > 1 && key !== "escape") return;

    let nextInput = tState.typedInNode + key;
    let matchingOpts = tState.validOpts.filter(opt => opt.startsWith(nextInput));

    if (matchingOpts.length > 0) {
        tState.typedInNode = nextInput;
        tState.validOpts = matchingOpts;
        tState.textDone += key;
        
        combo++;
        score += 10 + Math.floor(combo / 10);
        
        // 【音声】タイピング入力時
        playSfx('sound-type');

        if (tState.validOpts.includes(tState.typedInNode)) {
            tState.cIdx++;
            tState.typedInNode = "";
            
            if (tState.cIdx < tState.nodes.length) {
                tState.validOpts = [...tState.nodes[tState.cIdx].opts];
            } else {
                // 【音声】単語入力完了時
                playSfx('sound-success');
                setTimeout(nextWord, 100);
            }
        }
    } else {
        combo = 0;
    }
    updateDisplay();
});

// ==========================================================
// 7. カスタムタイピングエディター
// ==========================================================
let customTypingData = JSON.parse(localStorage.getItem(STORAGE_CUSTOM)) || [
    "あいうえお", "かきくけこ", "さしすせそ", "たちつてと", "なにぬねの"
];

document.getElementById("open-editor-btn").onclick = () => {
    playSfx('sound-click'); // 【音声】ボタンクリック時
    if (curParty) return alert("パーティー参加中はエディターを開けません。");
    showScreen("editor");
    renderEditor();
};

function renderEditor() {
    const list = document.getElementById("custom-word-list");
    if (!list) return;
    list.innerHTML = "";
    customTypingData.forEach((word, i) => {
        const div = document.createElement("div");
        div.className = "editor-row";
        div.innerHTML = `
            <input type="text" value="${word}" onchange="window.updateCustomWord(${i}, this.value)" placeholder="ひらがなで入力">
            <button class="action-btn danger-btn" onclick="window.removeCustomWord(${i})">削除</button>
        `;
        list.appendChild(div);
    });
    document.getElementById("custom-count").innerText = customTypingData.length;
}

window.updateCustomWord = (i, val) => { customTypingData[i] = val.trim(); };
window.addCustomWord = () => {
    playSfx('sound-click');
    if (customTypingData.length < 20) { customTypingData.push("あたらしいもじ"); renderEditor(); }
    else alert("最大20個まで登録可能です。");
};
window.removeCustomWord = (i) => {
    playSfx('sound-click');
    if (customTypingData.length > 5) { customTypingData.splice(i, 1); renderEditor(); }
    else alert("最低5つの単語が必要です。");
};
window.saveCustomWords = () => {
    playSfx('sound-click');
    for (let i = 0; i < customTypingData.length; i++) {
        let w = customTypingData[i];
        if (w.length < 2 || w.length > 15 || !/^[ぁ-んー]*$/.test(w)) return alert(`入力エラー: ${i+1}番目の単語を確認してください。`);
    }
    localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(customTypingData));
    alert("保存しました！");
    showScreen("mode");
};

// ==========================================================
// 8. Firebase: フレンド & パーティー & バトルUI同期
// ==========================================================
let curParty = null, isLeader = false, friendListeners = {}; 

const myRef = ref(db, `users/${myCode}`);
onValue(ref(db, ".info/connected"), (snapshot) => {
    if (snapshot.val()) {
        update(myRef, { name: myName, status: "online" });
        onDisconnect(myRef).update({ status: "offline" });
    }
});

document.getElementById("update-name-btn").onclick = () => {
    playSfx('sound-click');
    const n = document.getElementById("name-input").value.trim();
    if (n) {
        myName = n; localStorage.setItem(STORAGE_NAME, n);
        document.getElementById("display-name").innerText = n;
        update(myRef, { name: n });
    }
};

document.getElementById("send-request-btn").onclick = async () => {
    playSfx('sound-click');
    const t = document.getElementById("target-code-input").value.trim();
    if (t.length === 8 && t !== myCode) {
        const snap = await get(ref(db, `users/${t}`));
        if (snap.exists()) {
            set(ref(db, `friends/${myCode}/${t}`), true);
            set(ref(db, `friends/${t}/${myCode}`), true);
            alert("フレンド追加完了！");
            document.getElementById("target-code-input").value = "";
        }
    }
};

onValue(ref(db, `friends/${myCode}`), (snapshot) => {
    const list = document.getElementById("friend-list");
    if (!list) return;
    const currentFriends = snapshot.val() || {};
    
    Object.keys(friendListeners).forEach(fid => {
        if (!currentFriends[fid]) {
            const li = document.getElementById(`li-${fid}`);
            if (li) li.remove();
            if (typeof friendListeners[fid] === 'function') friendListeners[fid]();
            delete friendListeners[fid];
        }
    });

    snapshot.forEach(child => {
        const fid = child.key;
        if (!friendListeners[fid]) {
            let li = document.createElement("li");
            li.id = `li-${fid}`; li.className = "friend-item";
            list.appendChild(li);

            const unsub = onValue(ref(db, `users/${fid}`), (fSnap) => {
                const fd = fSnap.val();
                if (!fd) return;
                li.innerHTML = `
                    <div class="friend-info">
                        <strong>${fd.name}</strong> <span class="dot ${fd.status === 'online' ? 'online' : 'offline'}"></span>
                    </div>
                    <div>
                        <button class="action-btn primary-btn" onclick="window.inviteFriend('${fid}')">招待</button>
                        <button class="action-btn danger-btn" onclick="window.removeFriend('${fid}')">削除</button>
                    </div>
                `;
            });
            friendListeners[fid] = unsub;
        }
    });
});

window.inviteFriend = (tCode) => {
    playSfx('sound-click');
    if (!curParty) createParty();
    set(ref(db, `invites/${tCode}/${myCode}`), { name: myName, time: serverTimestamp() });
    alert("招待を送信しました！");
};
window.removeFriend = (tCode) => { playSfx('sound-click'); remove(ref(db, `friends/${myCode}/${tCode}`)); remove(ref(db, `friends/${tCode}/${myCode}`)); };

onValue(ref(db, `invites/${myCode}`), (snapshot) => {
    const data = snapshot.val();
    const notifyBox = document.getElementById("invite-notification");
    if (data && notifyBox) {
        const invCode = Object.keys(data)[0];
        document.getElementById("inviter-name").innerText = data[invCode].name;
        notifyBox.classList.remove("hidden");
        document.getElementById("accept-invite-btn").onclick = () => { playSfx('sound-click'); remove(ref(db, `invites/${myCode}`)); joinParty(invCode); notifyBox.classList.add("hidden"); };
        document.getElementById("decline-invite-btn").onclick = () => { playSfx('sound-click'); remove(ref(db, `invites/${myCode}`)); notifyBox.classList.add("hidden"); };
    }
});

function createParty() {
    curParty = myCode; isLeader = true;
    set(ref(db, `parties/${myCode}`), { leader: myCode, status: "waiting", members: { [myCode]: myName } });
    onDisconnect(ref(db, `parties/${myCode}`)).remove();
    listenToParty(myCode);
}

function joinParty(leaderCode) {
    curParty = leaderCode; isLeader = false;
    update(ref(db, `parties/${leaderCode}/members`), { [myCode]: myName });
    onDisconnect(ref(db, `parties/${leaderCode}/members/${myCode}`)).remove();
    listenToParty(leaderCode);
}

function listenToParty(partyId) {
    onValue(ref(db, `parties/${partyId}`), (snapshot) => {
        const p = snapshot.val();
        if (!p) {
            curParty = null; isLeader = false;
            document.getElementById("no-party-msg").classList.remove("hidden");
            document.getElementById("party-info").classList.add("hidden");
            if (isPlaying) { isPlaying = false; clearInterval(battleTimer); showScreen("mode"); }
            return;
        }

        document.getElementById("no-party-msg").classList.add("hidden");
        document.getElementById("party-info").classList.remove("hidden");
        
        let mHtml = "";
        Object.keys(p.members).forEach(uid => {
            mHtml += `<div class="party-member">
                        <span>${uid === p.leader ? '<span class="leader-tag">LEADER</span>' : ''}${p.members[uid]}</span>
                      </div>`;
        });
        document.getElementById("party-member-list").innerHTML = mHtml;
        document.getElementById("party-controls").innerHTML = `<button class="action-btn danger-btn" onclick="window.leaveParty()" style="width:100%">${isLeader ? 'パーティー解散' : '抜ける'}</button>`;

        if (p.status === "setup" && !isLeader && currentScreen !== "wait") showScreen("wait");
        else if (p.status === "playing" && !isPlaying) { isBattleMode = true; startGame(p.battle.time); }

        if (p.status === "playing" && p.battle && p.battle.scores) updateBattleLanes(p.battle.scores);
    });
}

window.leaveParty = () => { playSfx('sound-click'); isLeader ? remove(ref(db, `parties/${myCode}`)) : remove(ref(db, `parties/${curParty}/members/${myCode}`)); curParty = null; isLeader = false; };

document.getElementById("friend-play-btn").onclick = () => {
    playSfx('sound-click');
    if (!curParty || !isLeader) return alert("リーダーのみがバトル設定を行えます。");
    update(ref(db, `parties/${curParty}`), { status: "setup" });
    showScreen("setup");
};

document.getElementById("start-battle-trigger").onclick = () => {
    playSfx('sound-click');
    const timeVal = parseInt(document.getElementById("battle-time-range").value);
    currentLevel = document.getElementById("battle-diff-select").value;
    update(ref(db, `parties/${curParty}`), { status: "playing", battle: { time: timeVal, scores: {} } });
    isBattleMode = true;
    startGame(timeVal);
};

// 【重要】名前：スコア フォーマットによるレーン描画
function updateBattleLanes(scores) {
    const lanes = document.getElementById("rival-lanes");
    if (!lanes) return;

    let html = "";
    let maxS = 100;
    Object.values(scores).forEach(s => { if (s.score > maxS) maxS = s.score; });

    const sortedIds = Object.keys(scores).sort((a,b) => scores[b].score - scores[a].score);

    sortedIds.forEach(uid => {
        const d = scores[uid];
        const pct = Math.min(100, (d.score / maxS) * 100);
        const isMe = (uid === myCode);
        
        // CSSと連動し、相手の「.lane-score-value」と「.lane-bar-fill」は半分経過で隠れる
        html += `
            <div class="lane ${isMe ? 'me' : ''}">
                <div class="lane-name-score">
                    ${d.name} : <span class="lane-score-value">${d.score} pt</span>
                </div>
                <div class="lane-bar-bg">
                    <div class="lane-bar-fill" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    });
    lanes.innerHTML = html;
}

function endBattle() {
    isPlaying = false;
    clearInterval(battleTimer);
    
    // 【音声】対戦終了時
    playSfx('sound-finish');
    
    if (isLeader && curParty) update(ref(db, `parties/${curParty}`), { status: "waiting" });
    
    get(ref(db, `parties/${curParty}/battle/scores`)).then(snapshot => {
        const scores = snapshot.val() || {};
        const arr = Object.values(scores).sort((a, b) => b.score - a.score);
        let rHtml = "";
        arr.forEach((d, i) => {
            rHtml += `<div class="rank-item rank-${i+1}"><span>${i+1}位: ${d.name}</span><span>${d.score} pt</span></div>`;
        });
        document.getElementById("ranking-list").innerHTML = rHtml;
        showScreen("result");
    });
}

// ==========================================================
// 9. オンラインマッチ
// ==========================================================
let matchQueueRef = null;
document.getElementById("online-play-btn").onclick = () => { playSfx('sound-click'); showScreen("online"); };

window.joinMatchmaking = (playerCount) => {
    playSfx('sound-click');
    showScreen("onlinewait");
    const qPath = `matchmaking/${playerCount}/${myCode}`;
    set(ref(db, qPath), { name: myName, time: serverTimestamp() });
    
    matchQueueRef = ref(db, `matchmaking/${playerCount}`);
    onValue(matchQueueRef, (snap) => {
        if (!snap.exists()) return;
        const players = snap.val();
        const keys = Object.keys(players).sort((a,b) => players[a].time - players[b].time);
        
        document.getElementById("online-wait-count").innerText = `${keys.length} / ${playerCount}`;

        if (keys.length >= playerCount && keys.slice(0, playerCount).includes(myCode)) {
            off(matchQueueRef); remove(ref(db, qPath));
            const leaderId = keys[0];
            curParty = leaderId; isLeader = (myCode === leaderId);

            if (isLeader) {
                let members = {};
                keys.slice(0, playerCount).forEach(k => members[k] = players[k].name);
                set(ref(db, `parties/${leaderId}`), { leader: leaderId, status: "playing", members: members, battle: { time: 40, scores: {} } });
                setTimeout(() => { currentLevel = "normal"; isBattleMode = true; startGame(40); }, 2000);
            } else {
                const pRef = ref(db, `parties/${leaderId}`);
                onValue(pRef, (pSnap) => {
                    const pData = pSnap.val();
                    if (pData && pData.status === "playing") {
                        off(pRef); currentLevel = "normal"; isBattleMode = true; startGame(40); listenToParty(leaderId);
                    }
                });
            }
        }
    });
};

window.cancelMatchmaking = () => { playSfx('sound-click'); if (matchQueueRef) off(matchQueueRef); remove(ref(db, `matchmaking/2/${myCode}`)); showScreen("mode"); };

// ==========================================================
// 10. 各種汎用ボタン
// ==========================================================
document.getElementById("single-play-btn").onclick = () => { playSfx('sound-click'); showScreen("diff"); };
document.getElementById("back-to-mode").onclick = () => { playSfx('sound-click'); showScreen("mode"); };
document.getElementById("custom-play-btn").onclick = () => { playSfx('sound-click'); currentLevel = "custom"; isBattleMode = false; startGame(); };

document.getElementById("end-game-btn").onclick = () => { 
    playSfx('sound-click'); 
    isPlaying = false; clearInterval(battleTimer);
    if (!isBattleMode) {
        let best = parseInt(localStorage.getItem(STORAGE_BEST + currentLevel)) || 0;
        if (score > best) localStorage.setItem(STORAGE_BEST + currentLevel, score);
    } else if (curParty) {
        set(ref(db, `parties/${curParty}/battle/scores/${myCode}`), { name: myName, score: 0 });
    }
    showScreen("mode"); 
};

document.querySelectorAll(".diff-btn").forEach(b => {
    b.onclick = () => { playSfx('sound-click'); currentLevel = b.dataset.level; isBattleMode = false; startGame(); };
});

showScreen("mode");
