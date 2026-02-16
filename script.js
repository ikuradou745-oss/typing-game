// =========================================
// ULTIMATE TYPING ONLINE - RAMO EDITION
// FIREBASE & ENGINE VERSION 3.0 (MATCH READY & SOUND FIXED)
// =========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, push, remove, onDisconnect, serverTimestamp, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBXnNXQ5khcR0EvRide4C0PjshJZpSF4oM",
    authDomain: "typing-game-28ed0.firebaseapp.com",
    databaseURL: "https://typing-game-28ed0-default-rtdb.firebaseio.com",
    projectId: "typing-game-28ed0",
    storageBucket: "typing-game-28ed0.firebasestorage.app",
    messagingSenderId: "963797267101",
    appId: "1:963797267101:web:0d5d700458fb1991021a74",
    measurementId: "G-CL4B6ZK0SC"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- 音声システム (復活版) ---
const sounds = {
    type: new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"),
    miss: new Audio("https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3"),
    correct: new Audio("https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3"),
    finish: new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3"),
    notify: new Audio("https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3")
};

// ブラウザの制限を解除するための関数
let audioUnlocked = false;
function unlockAudio() {
    if (audioUnlocked) return;
    Object.values(sounds).forEach(s => {
        s.play().then(() => { s.pause(); s.currentTime = 0; }).catch(() => {});
    });
    audioUnlocked = true;
}
document.body.addEventListener('click', unlockAudio, { once: true });

// --- ユーザー初期化 ---
const generateId = () => Math.floor(10000000 + Math.random() * 89999999).toString();
let myId = localStorage.getItem("ramo_typing_uid") || generateId();
localStorage.setItem("ramo_typing_uid", myId);
let myName = localStorage.getItem("ramo_typing_name") || `園名：${generateId()}`;

let myPartyId = null;
let isLeader = false;
let gameActive = false;
let score = 0;
let combo = 0;
let timer = 30;
let currentWords = [];
let currentIndex = 0;
let currentRoma = "";
let romaIndex = 0;
let customWords = JSON.parse(localStorage.getItem("ramo_custom_words")) || [];

// --- タイピングエンジン (伸ばし棒 & 特殊文字) ---
const KANA_MAP = {
    'あ':'a','い':'i','う':'u','え':'e','お':'o',
    'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
    'さ':'sa','し':['si','shi'],'す':'su','せ':'se','そ':'so',
    'た':'ta','ち':['ti','chi'],'つ':['tu','tsu'],'て':'te','と':'to',
    'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
    'は':'ha','ひ':'hi','ふ':['fu','hu'],'へ':'he','ほ':'ho',
    'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
    'や':'ya','ゆ':'yu','よ':'yo',
    'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
    'わ':'wa','を':'wo','ん':['nn','n'],
    'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
    'ざ':'za','じ':['zi','ji'],'ず':'zu','ぜ':'ze','ぞ':'zo',
    'だ':'da','ぢ':['di','ji'],'づ':'du','で':'de','ど':'do',
    'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
    'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
    'きゃ':['kya'],'きゅ':['kyu'],'きょ':['kyo'],
    'しゃ':['sya','sha'],'しゅ':['syu','shu'],'しょ':['syo','sho'],
    'ちゃ':['tya','cha'],'ちゅ':['tyu','chu'],'ちょ':['tyo','cho'],
    'ふぁ':['fa'],'ふぃ':['fi'],'ふぇ':['fe'],'ふぉ':['fo'],
    'てぃ':['ti'],'でぃ':['di'],'てゅ':['tyu'],'でゅ':['dyu'],
    'ぁ':['la','xa'],'ぃ':['li','xi'],'ぅ':['lu','xu'],'ぇ':['le','xe'],'ぉ':['lo','xo'],
    'っ':['ltu','xtu'],
    'ー':['-']
};

function getRomaPatterns(kana) {
    let result = [""];
    for (let i = 0; i < kana.length; i++) {
        let char2 = kana.substring(i, i + 2);
        let char1 = kana.substring(i, i + 1);
        let candidates = [];
        if (KANA_MAP[char2]) { candidates = Array.isArray(KANA_MAP[char2]) ? KANA_MAP[char2] : [KANA_MAP[char2]]; i++; }
        else if (char1 === 'っ' && i + 1 < kana.length) {
            let nextChar = kana.substring(i + 1, i + 2);
            let nextRoma = Array.isArray(KANA_MAP[nextChar]) ? KANA_MAP[nextChar][0] : KANA_MAP[nextChar];
            candidates = nextRoma ? [nextRoma[0]] : ['xtu'];
        } else if (KANA_MAP[char1]) { candidates = Array.isArray(KANA_MAP[char1]) ? KANA_MAP[char1] : [KANA_MAP[char1]]; }
        else { candidates = [char1]; }
        let newResult = [];
        for (let r of result) { for (let c of candidates) { newResult.push(r + c); } }
        result = newResult;
    }
    return result;
}

// --- UI操作 ---
const el = (id) => document.getElementById(id);

window.goHome = () => {
    gameActive = false;
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    el("screen-home").classList.remove("hidden");
    el("ready-overlay").classList.add("hidden");
};

window.updateMyName = () => {
    myName = el("my-name-input").value || `園名：${myId}`;
    localStorage.setItem("ramo_typing_name", myName);
    update(ref(db, `users/${myId}`), { name: myName });
};

// --- フレンド機能 ---
window.addFriendPrompt = async () => {
    const code = prompt("相手のフレンドコードを入力してください");
    if (!code || code === myId) return;
    const snap = await get(ref(db, `users/${code}`));
    if (snap.exists()) {
        await update(ref(db, `users/${myId}/friends/${code}`), { exists: true });
        await update(ref(db, `users/${code}/friends/${myId}`), { exists: true });
        alert("フレンドになりました！");
    } else { alert("コードが見つかりません。"); }
};

window.removeFriend = (id) => { if (confirm("削除しますか？")) remove(ref(db, `users/${myId}/friends/${id}`)); };

onValue(ref(db, `users/${myId}/friends`), (snap) => {
    const listUI = el("friend-list-ui");
    listUI.innerHTML = "";
    const friends = snap.val();
    if (!friends) return;
    Object.keys(friends).forEach(fId => {
        onValue(ref(db, `users/${fId}`), (fSnap) => {
            const data = fSnap.val();
            if (!data) return;
            const old = document.getElementById(`friend-${fId}`);
            if (old) old.remove();
            const div = document.createElement("div");
            div.id = `friend-${fId}`; div.className = "friend-item";
            div.innerHTML = `<span><i class="status-dot ${data.status === 'online' ? 'online' : 'offline'}"></i>${data.name}</span>
                <div><button class="btn-invite btn-s" onclick="window.inviteToParty('${fId}')">招待</button>
                <button class="btn-kick btn-s" onclick="window.removeFriend('${fId}')">削除</button></div>`;
            listUI.appendChild(div);
        });
    });
});

// --- パーティー・オンライン機能 (準備OKボタン対応) ---
window.inviteToParty = (targetId) => {
    if (!myPartyId) {
        myPartyId = myId;
        set(ref(db, `parties/${myPartyId}`), { leader: myId, state: "lobby", members: { [myId]: { name: myName, score: 0, ready: false } } });
        update(ref(db, `users/${myId}`), { partyId: myPartyId });
    }
    update(ref(db, `users/${targetId}/invites/${myId}`), { fromName: myName });
    sounds.notify.play().catch(() => {});
};

window.acceptInvite = () => {
    get(ref(db, `users/${myId}/invites`)).then(snap => {
        const pId = Object.keys(snap.val())[0];
        update(ref(db, `parties/${pId}/members/${myId}`), { name: myName, score: 0, ready: false });
        update(ref(db, `users/${myId}`), { partyId: pId });
        remove(ref(db, `users/${myId}/invites`));
        el("invite-toast").classList.add("hidden");
    });
};

window.declineInvite = () => { remove(ref(db, `users/${myId}/invites`)); el("invite-toast").classList.add("hidden"); };

window.leaveParty = () => {
    if (!myPartyId) return;
    if (isLeader) remove(ref(db, `parties/${myPartyId}`));
    else remove(ref(db, `parties/${myPartyId}/members/${myId}`));
    update(ref(db, `users/${myId}`), { partyId: null });
    myPartyId = null;
    goHome();
};

window.sendReady = () => {
    if (!myPartyId) return;
    update(ref(db, `parties/${myPartyId}/members/${myId}`), { ready: true });
    el("ready-btn").classList.add("hidden"); // 押したら隠す
};

// パーティー状態監視
onValue(ref(db, `users/${myId}/partyId`), snap => {
    myPartyId = snap.val();
    if (myPartyId) {
        el("party-controls").classList.remove("hidden");
        onValue(ref(db, `parties/${myPartyId}`), pSnap => {
            const party = pSnap.val();
            if (!party) { myPartyId = null; return; }
            isLeader = (party.leader === myId);
            el("party-title").innerText = isLeader ? "パーティー (リーダー)" : "パーティー (メンバー)";
            el("party-list-ui").innerHTML = Object.entries(party.members).map(([id, m]) => `<div class="friend-item"><span>${m.name} ${m.ready ? '✅' : '⏳'}</span></div>`).join("");
            
            // 準備OKチェック画面
            if (party.state === "ready_check") {
                if (!gameActive) {
                    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
                    el("screen-play").classList.remove("hidden");
                    el("ready-overlay").classList.remove("hidden");
                    syncReadyStatus(party.members);
                }
                // 全員準備OKならリーダーが開始
                if (isLeader) {
                    const allReady = Object.values(party.members).every(m => m.ready === true);
                    if (allReady) {
                        update(ref(db, `parties/${myPartyId}`), { state: "playing" });
                    }
                }
            }
            // ゲーム開始
            if (party.state === "playing" && !gameActive) {
                el("ready-overlay").classList.add("hidden");
                currentWords = WORD_DB[party.diff || "normal"];
                startGame(party.time || 30);
            }
        });
    } else {
        el("party-controls").classList.add("hidden");
        el("party-title").innerText = "パーティー (未参加)";
        el("party-list-ui").innerHTML = "";
    }
});

function syncReadyStatus(members) {
    el("ready-status-list").innerHTML = Object.values(members).map(m => `
        <div class="ready-user"><span>${m.name}</span><span class="${m.ready?'is-ready':'not-ready'}">${m.ready?'準備OK':'準備中...'}</span></div>
    `).join("");
}

// --- ゲームコア ---
function nextQuestion() {
    let q = currentWords[currentIndex % currentWords.length];
    el("q-ja").innerText = q;
    let patterns = getRomaPatterns(q);
    currentRoma = patterns[0];
    romaIndex = 0;
    renderRoma();
}

function renderRoma() {
    el("q-done").innerText = currentRoma.substring(0, romaIndex);
    el("q-todo").innerText = currentRoma.substring(romaIndex);
}

window.addEventListener("keydown", (e) => {
    if (!gameActive) return;
    if (e.key === currentRoma[romaIndex]) {
        romaIndex++; score += (10 + combo); combo++;
        sounds.type.currentTime = 0; sounds.type.play().catch(()=>{});
        if (romaIndex >= currentRoma.length) { sounds.correct.play().catch(()=>{}); currentIndex++; nextQuestion(); }
    } else {
        if (!["Shift","Control","Alt"].includes(e.key)) { combo = 0; sounds.miss.currentTime = 0; sounds.miss.play().catch(()=>{}); }
    }
    renderRoma();
    el("stat-score").innerText = score;
    el("stat-combo").innerText = combo;
    if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
});

function startGame(duration) {
    gameActive = true; score = 0; combo = 0; timer = duration;
    nextQuestion();
    const interval = setInterval(() => {
        timer--;
        el("timer-display").innerText = `00:${timer.toString().padStart(2, '0')}`;
        if (myPartyId) syncRivals(duration);
        if (timer <= 0) { clearInterval(interval); endGame(); }
    }, 1000);
}

function syncRivals(maxTime) {
    el("rival-scores").classList.remove("hidden");
    get(ref(db, `parties/${myPartyId}/members`)).then(snap => {
        const members = snap.val();
        el("rival-list").innerHTML = Object.entries(members).map(([id, m]) => {
            if (id === myId) return "";
            const hide = timer <= (maxTime / 2);
            return `<div class="friend-item"><span>${m.name}</span><span class="${hide?'unknown':'stat-val'}">${hide?'?':m.score}</span></div>`;
        }).join("");
    });
}

function endGame() {
    gameActive = false;
    sounds.finish.play().catch(()=>{});
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    el("screen-result").classList.remove("hidden");
    if (myPartyId) {
        get(ref(db, `parties/${myPartyId}/members`)).then(snap => {
            const sorted = Object.values(snap.val()).sort((a,b) => b.score - a.score);
            el("ranking-box").innerHTML = sorted.map((m, i) => `
                <div class="ranking-item"><span>${i+1}位: ${m.name}</span><span>${m.score} pts</span></div>
            `).join("");
            if (isLeader) update(ref(db, `parties/${myPartyId}`), { state: "lobby", members: Object.fromEntries(Object.entries(snap.val()).map(([k,v])=>[k,{...v, ready:false}])) });
        });
    } else { el("ranking-box").innerHTML = `<div class="ranking-item"><span>スコア:</span><span>${score} pts</span></div>`; }
}

// --- 初期実行 ---
const userRef = ref(db, `users/${myId}`);
set(userRef, { name: myName, status: "online" });
onDisconnect(userRef).update({ status: "offline" });
el("my-name-input").value = myName;
el("my-id-display").innerText = myId;

window.openSingleSelect = () => { document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden")); el("screen-single-select").classList.remove("hidden"); };
window.startSingle = (diff) => { currentWords = WORD_DB[diff].sort(() => Math.random() - 0.5); startGame(60); };
window.openFriendBattle = () => {
    if (!myPartyId) return alert("パーティー未参加");
    if (!isLeader) return alert("リーダー限定");
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    el("screen-battle-setup").classList.remove("hidden");
};
window.launchBattle = () => {
    update(ref(db, `parties/${myPartyId}`), {
        state: "ready_check",
        time: parseInt(el("setup-time").value),
        diff: el("setup-diff").value
    });
    el("ready-btn").classList.remove("hidden");
};

// --- エディター ---
window.openEditor = () => {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    el("screen-editor").classList.remove("hidden");
    if (customWords.length < 5) customWords = ["","","","",""];
    renderEditor();
};
function renderEditor() {
    el("editor-container").innerHTML = customWords.map((w, i) => `
        <div class="editor-row">
            <input type="text" class="name-edit" value="${w}" onchange="customWords[${i}]=this.value.replace(/[^ぁ-んー]/g,'')">
            <button class="btn-kick btn-s" onclick="customWords.splice(${i},1);renderEditor()">削除</button>
        </div>
    `).join("");
}
window.addEditorRow = () => { if(customWords.length<20){ customWords.push(""); renderEditor(); } };
window.saveEditor = () => {
    const valid = customWords.filter(w => w.length >= 2);
    if(valid.length < 5) return alert("最低5個必要です");
    customWords = valid; localStorage.setItem("ramo_custom_words", JSON.stringify(customWords));
    alert("保存しました"); goHome();
};
window.playCustom = () => { if(customWords.length < 5) return alert("未完成です"); currentWords = customWords; startGame(60); };

// --- オンライン対戦 ---
window.openOnlineMatch = async () => {
    const count = parseInt(prompt("何人で遊ぶ？ (2-4)"));
    if (![2,3,4].includes(count)) return;
    const matchRef = ref(db, `matchmaking/${count}/${myId}`);
    set(matchRef, { name: myName });
    alert("マッチング待機中...");
    onValue(ref(db, `matchmaking/${count}`), snap => {
        const players = snap.val();
        if (players && Object.keys(players).length >= count) {
            const ids = Object.keys(players).slice(0, count);
            if (ids[0] === myId) {
                const newPId = "match_" + myId;
                const members = {};
                ids.forEach(id => { members[id] = { name: players[id].name, score: 0, ready: false }; remove(ref(db, `matchmaking/${count}/${id}`)); });
                set(ref(db, `parties/${newPId}`), { leader: myId, state: "ready_check", time: 30, diff: "normal", members: members });
                ids.forEach(id => update(ref(db, `users/${id}`), { partyId: newPId }));
            }
        }
    });
};

const WORD_DB = {
    easy: ["ねこ","いぬ","うみ","つき","さかな","たこ","やま","はな","とり","くつ","ほん","いす"],
    normal: ["すまーとふぉん","いんたーねっと","ぷろぐらみんぐ","こうきゅう","しんかんせん","たいぴんぐ","ふぉん"],
    hard: ["じょうほうしょりぎじゅつしゃ","きょだいなうちゅうすてーしょん","にほんごにゅうりょく","ちょうこうそうびる"]
};

goHome();
