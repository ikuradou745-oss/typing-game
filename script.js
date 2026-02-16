// =========================================
// ULTIMATE TYPING ONLINE - RAMO EDITION
// FIREBASE & TYPING ENGINE V5.0
// =========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, remove, onDisconnect, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBXnNXQ5khcR0EvRide4C0PjshJZpSF4oM",
    authDomain: "typing-game-28ed0.firebaseapp.com",
    databaseURL: "https://typing-game-28ed0-default-rtdb.firebaseio.com",
    projectId: "typing-game-28ed0",
    storageBucket: "typing-game-28ed0.firebasestorage.app",
    messagingSenderId: "963797267101",
    appId: "1:963797267101:web:0d5d700458fb1991021a74"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- 音声定義 ---
const sounds = {
    type: new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"),
    miss: new Audio("https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3"),
    correct: new Audio("https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3"),
    finish: new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3"),
    notify: new Audio("https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3")
};

// --- グローバル変数 ---
const el = (id) => document.getElementById(id);
const generateId = () => Math.floor(10000000 + Math.random() * 89999999).toString();

let myId = localStorage.getItem("ramo_uid") || generateId();
localStorage.setItem("ramo_uid", myId);
let myName = localStorage.getItem("ramo_name") || `園名：${generateId()}`;
let myPartyId = null;
let isLeader = false;
let gameActive = false;
let score = 0;
let combo = 0;
let timer = 30;
let duration = 30;
let currentWords = [];
let currentWordIdx = 0;
let currentRoma = "";
let romaIdx = 0;
let customWords = JSON.parse(localStorage.getItem("ramo_custom")) || ["たいぴんぐ","らもえディション","ぷろぐらみんぐ","こんぼ","ふれんど"];

// --- リアルタイム名前更新 ---
window.updateMyName = () => {
    myName = el("my-name-input").value || `園名：${myId}`;
    localStorage.setItem("ramo_name", myName);
    update(ref(db, `users/${myId}`), { name: myName });
};

// --- ローマ字変換テーブル (sho/syo対応) ---
const KANA_MAP = {
    'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
    'さ':'sa','し':['si','shi'],'す':'su','せ':'se','そ':'so','た':'ta','ち':['ti','chi'],'つ':['tu','tsu'],'て':'te','と':'to',
    'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':['fu','hu'],'へ':'he','ほ':'ho',
    'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo','ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
    'わ':'wa','を':'wo','ん':['nn','n'],'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go','ざ':'za','じ':['zi','ji'],'ず':'zu','ぜ':'ze','ぞ':'zo',
    'だ':'da','ぢ':['di','ji'],'づ':'du','で':'de','ど':'do','ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo','ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
    'きゃ':['kya'],'きゅ':['kyu'],'きょ':['kyo'],'しゃ':['sya','sha'],'しゅ':['syu','shu'],'しょ':['syo','sho'],
    'ちゃ':['tya','cha'],'ちゅ':['tyu','chu'],'ちょ':['tyo','cho'],'ふぁ':['fa'],'ふぃ':['fi'],'ふぇ':['fe'],'ふぉ':['fo'],
    'ー':['-']
};

function getRomaPatterns(kana) {
    let patterns = [""];
    for (let i = 0; i < kana.length; i++) {
        let char2 = kana.substring(i, i + 2);
        let char1 = kana.substring(i, i + 1);
        let candidates = [];
        if (KANA_MAP[char2]) { candidates = Array.isArray(KANA_MAP[char2]) ? KANA_MAP[char2] : [KANA_MAP[char2]]; i++; }
        else if (KANA_MAP[char1]) { candidates = Array.isArray(KANA_MAP[char1]) ? KANA_MAP[char1] : [KANA_MAP[char1]]; }
        else if (char1 === 'っ' && i + 1 < kana.length) {
            let next = kana.substring(i + 1, i + 2);
            let nextRoma = Array.isArray(KANA_MAP[next]) ? KANA_MAP[next][0] : KANA_MAP[next];
            candidates = nextRoma ? [nextRoma[0]] : ['xtu'];
        } else { candidates = [char1]; }
        let nextPatterns = [];
        patterns.forEach(p => candidates.forEach(c => nextPatterns.push(p + c)));
        patterns = nextPatterns;
    }
    return patterns;
}

// --- フレンド機能 ---
window.addFriend = async () => {
    const code = el("friend-code-input").value;
    if (!code || code === myId) return;
    const snap = await get(ref(db, `users/${code}`));
    if (snap.exists()) {
        update(ref(db, `users/${myId}/friends/${code}`), { active: true });
        update(ref(db, `users/${code}/friends/${myId}`), { active: true });
        el("friend-code-input").value = "";
    } else { alert("コードが見つかりません"); }
};

onValue(ref(db, `users/${myId}/friends`), (snap) => {
    const ui = el("friend-list-ui"); ui.innerHTML = "";
    const friends = snap.val(); if (!friends) return;
    Object.keys(friends).forEach(fid => {
        onValue(ref(db, `users/${fid}`), fs => {
            const data = fs.val(); if (!data) return;
            const row = document.createElement("div"); row.className = "friend-item";
            row.innerHTML = `<div><span class="status-dot ${data.status}"></span>${data.name}</div>
                <div><button class="btn-invite" onclick="window.inviteToParty('${fid}')">招待</button>
                <button class="btn-kick" onclick="window.removeFriend('${fid}')">削除</button></div>`;
            ui.appendChild(row);
        });
    });
});

window.removeFriend = (fid) => { remove(ref(db, `users/${myId}/friends/${fid}`)); remove(ref(db, `users/${fid}/friends/${myId}`)); };

// --- パーティー機能 ---
window.inviteToParty = (fid) => {
    if (!myPartyId) {
        myPartyId = myId;
        set(ref(db, `parties/${myPartyId}`), { leader: myId, state: "lobby", members: { [myId]: { name: myName, score: 0, ready: false } } });
        update(ref(db, `users/${myId}`), { partyId: myPartyId });
    }
    set(ref(db, `users/${fid}/invite`), { from: myName, partyId: myPartyId });
};

onValue(ref(db, `users/${myId}/invite`), snap => {
    const inv = snap.val();
    if (inv) {
        el("invite-msg").innerText = `${inv.from}からパーティーの招待！`;
        el("invite-toast").classList.remove("hidden");
        sounds.notify.play();
    } else { el("invite-toast").classList.add("hidden"); }
});

window.acceptInvite = () => {
    get(ref(db, `users/${myId}/invite`)).then(s => {
        const pId = s.val().partyId;
        update(ref(db, `parties/${pId}/members/${myId}`), { name: myName, score: 0, ready: false });
        update(ref(db, `users/${myId}`), { partyId: pId });
        remove(ref(db, `users/${myId}/invite`));
    });
};
window.declineInvite = () => remove(ref(db, `users/${myId}/invite`));

window.leaveParty = () => {
    if (isLeader) remove(ref(db, `parties/${myPartyId}`));
    else remove(ref(db, `parties/${myPartyId}/members/${myId}`));
    update(ref(db, `users/${myId}`), { partyId: null });
    window.goHome();
};

onValue(ref(db, `users/${myId}/partyId`), snap => {
    myPartyId = snap.val();
    if (myPartyId) {
        el("party-actions").classList.remove("hidden");
        onValue(ref(db, `parties/${myPartyId}`), ps => {
            const p = ps.val(); if (!p) { myPartyId = null; return; }
            isLeader = (p.leader === myId);
            el("party-label").innerText = isLeader ? "パーティー (リーダー)" : "パーティー (メンバー)";
            el("party-list-ui").innerHTML = Object.values(p.members).map(m => `<div class="friend-item">${m.name} ${m.ready?'✅':''}</div>`).join("");
            
            if (p.state === "ready_check" && !gameActive) {
                openScreen("screen-play"); el("ready-overlay").classList.remove("hidden");
                el("ready-list").innerHTML = Object.values(p.members).map(m => `<div>${m.name}: ${m.ready?'準備完了':'待機中...'}</div>`).join("");
                if (isLeader && Object.values(p.members).every(m => m.ready)) update(ref(db, `parties/${myPartyId}`), { state: "playing" });
            }
            if (p.state === "playing" && !gameActive) {
                el("ready-overlay").classList.add("hidden");
                currentWords = WORD_DB[p.diff]; startGame(p.time);
            }
        });
    } else { el("party-actions").classList.add("hidden"); el("party-label").innerText = "パーティー (未参加)"; el("party-list-ui").innerHTML = ""; }
});

window.sendReady = () => update(ref(db, `parties/${myPartyId}/members/${myId}`), { ready: true });

// --- ゲームエンジン ---
function openScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    el(id).classList.remove("hidden");
}

window.goHome = () => { gameActive = false; openScreen("screen-home"); };

function nextQuestion() {
    let q = currentWords[currentWordIdx % currentWords.length];
    el("q-ja").innerText = q;
    let patterns = getRomaPatterns(q);
    currentRoma = patterns[0]; romaIdx = 0; renderRoma();
}
function renderRoma() {
    el("q-done").innerText = currentRoma.substring(0, romaIdx);
    el("q-todo").innerText = currentRoma.substring(romaIdx);
}

window.addEventListener("keydown", e => {
    if (!gameActive) return;
    if (e.key === currentRoma[romaIdx]) {
        romaIdx++; score += (10 + combo); combo++;
        sounds.type.currentTime = 0; sounds.type.play();
        if (romaIdx >= currentRoma.length) { sounds.correct.play(); currentWordIdx++; nextQuestion(); }
    } else if (!["Shift","Alt","Control"].includes(e.key)) {
        combo = 0; sounds.miss.currentTime = 0; sounds.miss.play();
    }
    el("stat-score").innerText = score; el("stat-combo").innerText = combo;
    renderRoma();
    if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
});

function startGame(sec) {
    gameActive = true; score = 0; combo = 0; timer = sec; duration = sec; currentWordIdx = 0;
    nextQuestion(); el("stat-score").innerText = "0"; el("stat-combo").innerText = "0";
    const itv = setInterval(() => {
        timer--; el("timer-display").innerText = `00:${timer.toString().padStart(2,'0')}`;
        if (myPartyId) syncRivals();
        if (timer <= 0) { clearInterval(itv); endGame(); }
    }, 1000);
}

function syncRivals() {
    el("rival-display").classList.remove("hidden");
    const isHidden = timer < (duration / 2);
    get(ref(db, `parties/${myPartyId}/members`)).then(s => {
        el("rival-list").innerHTML = Object.values(s.val()).map(m => `
            <div class="friend-item"><span>${m.name}</span><span>${isHidden?'わからないよ！':m.score}</span></div>
        `).join("");
    });
}

function endGame() {
    gameActive = false; sounds.finish.play();
    openScreen("screen-result");
    if (myPartyId) {
        get(ref(db, `parties/${myPartyId}/members`)).then(s => {
            const res = Object.values(s.val()).sort((a,b) => b.score - a.score);
            el("ranking-box").innerHTML = res.map((m,i) => `<div class="ranking-row"><span>${i+1}位: ${m.name}</span><span>${m.score} pts</span></div>`).join("");
            if (isLeader) update(ref(db, `parties/${myPartyId}`), { state: "lobby" });
        });
    } else { el("ranking-box").innerHTML = `<div class="ranking-row"><span>スコア</span><span>${score} pts</span></div>`; }
}

// --- モード制御 ---
window.openSingleSelect = () => openScreen("screen-single-select");
window.startSingle = (diff) => { currentWords = WORD_DB[diff]; openScreen("screen-play"); startGame(60); };

window.openFriendBattle = () => {
    if (!myPartyId) return alert("パーティーに参加していません！");
    if (!isLeader) return alert("リーダー限定です！");
    openScreen("screen-battle-setup");
};
window.launchBattle = () => {
    update(ref(db, `parties/${myPartyId}`), {
        state: "ready_check",
        time: parseInt(el("setup-time").value),
        diff: el("setup-diff").value
    });
};

window.openOnlineMatch = () => {
    if (myPartyId) return alert("パーティー中は利用できません");
    const n = prompt("何人で遊ぶ？ (2-4)");
    if (![2,3,4].includes(Number(n))) return;
    set(ref(db, `matchmaking/${n}/${myId}`), { name: myName });
    alert("マッチング待機中...");
    onValue(ref(db, `matchmaking/${n}`), snap => {
        const players = snap.val();
        if (players && Object.keys(players).length >= n) {
            const ids = Object.keys(players).slice(0, n);
            if (ids[0] === myId) {
                const pid = "match_" + myId;
                const members = {};
                ids.forEach(id => { members[id] = { name: players[id].name, score: 0, ready: false }; remove(ref(db, `matchmaking/${n}/${id}`)); });
                set(ref(db, `parties/${pid}`), { leader: myId, state: "ready_check", time: 30, diff: "normal", members });
                ids.forEach(id => update(ref(db, `users/${id}`), { partyId: pid }));
            }
        }
    });
};

// --- エディター ---
window.openEditor = () => { openScreen("screen-editor"); renderEditor(); };
function renderEditor() {
    el("editor-list").innerHTML = customWords.map((w, i) => `
        <div class="editor-row">
            <input type="text" class="editor-input" value="${w}" oninput="customWords[${i}]=this.value" placeholder="2~20文字のひらがな">
            <button class="btn-kick" onclick="customWords.splice(${i},1);renderEditor()">削除</button>
        </div>
    `).join("");
}
window.addEditorRow = () => { if (customWords.length < 20) { customWords.push(""); renderEditor(); } };
window.saveEditor = () => {
    const valid = customWords.filter(w => w.length >= 2 && w.length <= 20);
    if (valid.length < 5) return alert("最低5個必要です");
    customWords = valid; localStorage.setItem("ramo_custom", JSON.stringify(customWords));
    alert("完成しました！"); window.goHome();
};
window.playCustom = () => { if (customWords.length < 5) return alert("まずは5個以上作ってください"); currentWords = customWords; openScreen("screen-play"); startGame(60); };

// --- データ ---
const WORD_DB = {
    easy: ["ねこ","いぬ","うみ","つき","さかな","たこ","やま","はな","とり","いす","ゆめ","かぜ","あめ","ほし","そら","はし"],
    normal: ["すまーとふぉん","いんたーねっと","ぷろぐらみんぐ","こうきゅうしゃ","しんかんせん","たいぴんぐ","ふぉん","あにめーしょん"],
    hard: ["じぶんだけのものすごくひろいせかい","るびーちゃんのあいすくりーむ","ばくだいなせかいがまちうけている","ぷろぐらまーのぷろぐらみんぐ","このげーむをつくったひとはらもです"]
};

// 初期化
el("my-id-display").innerText = myId;
el("my-name-input").value = myName;
const userRef = ref(db, `users/${myId}`);
update(userRef, { name: myName, status: "online" });
onDisconnect(userRef).update({ status: "offline" });
window.goHome();
