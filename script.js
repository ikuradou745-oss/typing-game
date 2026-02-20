// =========================================
// ULTIMATE TYPING ONLINE - RAMO EDITION
// FIREBASE & TYPING ENGINE V5.7 (Auto-Leave Match Bug Fix)
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
let isMatchmaking = false; 
let score = 0;
let combo = 0;
let timer = 30;
let duration = 30;
let currentWords = [];
let currentWordIdx = 0;
let currentRoma = "";
let romaIdx = 0;
let customWords = JSON.parse(localStorage.getItem("ramo_custom")) || ["たいぴんぐ","らもえディション","ぷろぐらみんぐ","こんぼ","ふれんど"];
let gameInterval; 

let isCustomGame = false;
let coins = parseInt(localStorage.getItem("ramo_coins")) || 0;

// --- コイン保存・表示更新用関数 ---
function saveAndDisplayCoins() {























    localStorage.setItem("ramo_coins", coins);
    if (el("coin-amount")) {
        el("coin-amount").innerText = coins;
    }
    update(ref(db, `users/${myId}`), { coins: coins });







}

// --- 出題データ ---
const WORD_DB = {
    easy: ["ねこ","いぬ","うみ","つき","さかな","たこ","やま","はな","とり","いす","ゆめ","かぜ","あめ","ほし","そら","はし"],
    normal: ["すまーとふぉん","いんたーねっと","ぷろぐらみんぐ","しんかんせん","たいぴんぐ","ふぉん","あにめーしょん","うみのせかい"],
    hard: ["じぶんだけのものものものすごくひろいせかい","るびーちゃんのあいすくりーむ","ばくだいなせかいがまちうけている","ぷろぐらまーのぷろぐらみんぐ","このげーむをつくったひとはらもです","おあそびはここまでだここからがほんばん","ゆーちゅーぶぷれみあむはさいこうである","いしばしをよくたたいてわたる"]
};

// --- ボタン状態の制御 ---
function updateButtonStates() {
    const isBusy = myPartyId !== null || isMatchmaking;
    const btnSingle = el("btn-single");
    const btnParty = el("btn-party");
    const btnMatch = el("btn-match");
    const btnEditor = el("btn-editor");
    const btnCustom = el("btn-custom");


    if (btnSingle) btnSingle.disabled = isBusy;
    if (btnParty) btnParty.disabled = isMatchmaking; 
    if (btnMatch) btnMatch.disabled = isBusy;
    if (btnEditor) btnEditor.disabled = isBusy;
    if (btnCustom) btnCustom.disabled = isBusy;

}

// --- リアルタイム名前更新 ---
window.updateMyName = () => {
    myName = el("my-name-input").value || `園名：${myId}`;
    localStorage.setItem("ramo_name", myName);
    update(ref(db, `users/${myId}`), { name: myName });
};

// --- ローマ字変換テーブル ---
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
    const ui = el("friend-list-ui");
    const friends = snap.val();
    if (!friends) { ui.innerHTML = ""; return; }
    ui.innerHTML = ""; 
    Object.keys(friends).forEach(fid => {
        onValue(ref(db, `users/${fid}`), fs => {
            const data = fs.val(); 
            if (!data) return;
            let row = el(`friend-${fid}`);
            if (!row) {
                row = document.createElement("div");
                row.id = `friend-${fid}`;
                row.className = "friend-item";
                ui.appendChild(row);
            }
            row.innerHTML = `
                <div><span class="status-dot ${data.status}"></span>${data.name}</div>
                <div>
                    <button class="btn-invite" onclick="window.inviteToParty('${fid}')">招待</button>
                    <button class="btn-kick" onclick="window.removeFriend('${fid}')">削除</button>
                </div>`;
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
    if (gameActive || isMatchmaking) {
        alert("プレイ中・待機中は参加できません。");
        window.declineInvite();
        return;
    }
    get(ref(db, `users/${myId}/invite`)).then(s => {
        const pId = s.val().partyId;
        update(ref(db, `parties/${pId}/members/${myId}`), { name: myName, score: 0, ready: false });
        update(ref(db, `users/${myId}`), { partyId: pId });
        remove(ref(db, `users/${myId}/invite`));
    });
};
window.declineInvite = () => remove(ref(db, `users/${myId}/invite`));

// 【修正】パーティーから抜ける処理を共通化
window.leaveParty = () => {
    if (!myPartyId) return;

    // オンライン対戦の場合は相手と組んだ状態を完全に解消する
    if (myPartyId.startsWith("match_")) {
        // マッチング用パーティーからは常に退出・削除を試みる
        remove(ref(db, `parties/${myPartyId}/members/${myId}`));
        // リーダーならパーティー自体を消す
        if (isLeader) remove(ref(db, `parties/${myPartyId}`));
    } else {
        // 通常のフレンドパーティー
        if (isLeader) remove(ref(db, `parties/${myPartyId}`));
        else remove(ref(db, `parties/${myPartyId}/members/${myId}`));
    }

    update(ref(db, `users/${myId}`), { partyId: null });
    myPartyId = null;
    isLeader = false;
    updateButtonStates();
};

onValue(ref(db, `users/${myId}/partyId`), snap => {
    myPartyId = snap.val();
    updateButtonStates();
    if (myPartyId) {
        el("party-actions").classList.remove("hidden");
        onValue(ref(db, `parties/${myPartyId}`), ps => {
            const p = ps.val(); 
            if (!p) { 
                update(ref(db, `users/${myId}`), { partyId: null });
                myPartyId = null; 
                isLeader = false;
                updateButtonStates();
                return; 
            }
            isLeader = (p.leader === myId);
            el("party-label").innerText = isLeader ? "パーティー (リーダー)" : "パーティー (メンバー)";
            el("party-list-ui").innerHTML = Object.values(p.members).map(m => `<div class="friend-item">${m.name} ${m.ready?'✅':''}</div>`).join("");

            if (p.state === "ready_check" && !gameActive) {
                openScreen("screen-play"); 
                el("ready-overlay").classList.remove("hidden");
                el("ready-list").innerHTML = Object.values(p.members).map(m => `<div>${m.name}: ${m.ready?'準備完了':'待機中...'}</div>`).join("");
                if (isLeader && Object.values(p.members).every(m => m.ready)) {
                    update(ref(db, `parties/${myPartyId}`), { state: "playing" });
                }
            }
            if (p.state === "playing" && !gameActive) {
                el("ready-overlay").classList.add("hidden");
                currentWords = WORD_DB[p.diff]; 
                isCustomGame = false;
                startGame(p.time);
            }
            if (p.state === "lobby" && gameActive) {
                endGame();
            }
        });
    } else { 
        el("party-actions").classList.add("hidden"); 
        el("party-label").innerText = "パーティー (未参加)"; 
        el("party-list-ui").innerHTML = ""; 
    }
});

window.sendReady = () => {
    if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { ready: true });
};
























































// --- ゲームエンジン ---
function openScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    const target = el(id);
    if(target) target.classList.remove("hidden");
}

// 【重要修正】ホームに戻る際にパーティーを確実にリセット
window.goHome = () => { 
    gameActive = false; 
    clearInterval(gameInterval);


    // オンライン対戦終了後、または対戦中にホームへ戻る場合はパーティーを抜ける
    if (myPartyId && myPartyId.startsWith("match_")) {
        window.leaveParty();
    }

    openScreen("screen-home"); 
    updateButtonStates();
};

function nextQuestion() {
    if (!currentWords || currentWords.length === 0) currentWords = ["えらー"];
    let randomIdx = Math.floor(Math.random() * currentWords.length);
    let q = currentWords[randomIdx];
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
    clearInterval(gameInterval);
    gameActive = true; score = 0; combo = 0; timer = sec; duration = sec; currentWordIdx = 0;









    if (!myPartyId) {
        el("rival-display").classList.add("hidden");












    }

    nextQuestion(); 
    el("stat-score").innerText = "0"; 
    el("stat-combo").innerText = "0";

    gameInterval = setInterval(() => {
        if(!gameActive) { clearInterval(gameInterval); return; }
        timer--; 
        el("timer-display").innerText = `00:${timer.toString().padStart(2,'0')}`;
        if (myPartyId) syncRivals();
        if (timer <= 0) { 
            clearInterval(gameInterval); 
            endGame(); 
        }
    }, 1000);
}

function syncRivals() {
    if (!myPartyId) return;
    el("rival-display").classList.remove("hidden");
    const isHidden = timer < (duration / 2);
    get(ref(db, `parties/${myPartyId}/members`)).then(s => {
        const val = s.val();
        if(val) {
            el("rival-list").innerHTML = Object.values(val).map(m => `
                <div class="friend-item"><span>${m.name}</span><span>${isHidden?'わからないよ！':m.score}</span></div>
            `).join("");
        }
    });
}

function endGame() {
    gameActive = false; 
    clearInterval(gameInterval);







    sounds.finish.play();
    openScreen("screen-result");

    let earnedCoins = Math.floor(score / 10);
    let isWinner = false;

    if (isCustomGame) {
        earnedCoins = 0;
    }

    if (myPartyId) {
        get(ref(db, `parties/${myPartyId}/members`)).then(s => {
            const val = s.val();
            if(val) {
                const res = Object.entries(val).sort((a,b) => b[1].score - a[1].score);

                if (!isCustomGame && res[0][0] === myId && res.length > 1) {
                    earnedCoins *= 2;
                    isWinner = true;
                }

                if (earnedCoins > 0) {
                    coins += earnedCoins;
                    saveAndDisplayCoins();
                }

                el("ranking-box").innerHTML = res.map((item, i) => {
                    const m = item[1];
                    return `<div class="ranking-row"><span>${i+1}位: ${m.name}</span><span>${m.score} pts</span></div>`;
                }).join("");

                let coinText = isCustomGame ? "カスタムモードは獲得不可" : (isWinner ? `勝利ボーナス！ +${earnedCoins} 🪙` : `獲得コイン +${earnedCoins} 🪙`);
                el("ranking-box").innerHTML += `
                    <div class="ranking-row" style="color: #FFD700; margin-top: 15px; border-top: 2px dashed #FFD700; padding-top: 15px;">
                        <span>結果</span><span>${coinText}</span>
                    </div>`;

                // 【重要】オンライン対戦(match_)の場合は、状態をlobbyに戻さず、そのまま終了させる
                if (isLeader && !myPartyId.startsWith("match_")) {
                    update(ref(db, `parties/${myPartyId}`), { state: "lobby" });
                }
            }
        });
    } else { 
        if (earnedCoins > 0) {
            coins += earnedCoins;
            saveAndDisplayCoins();
        }
        el("ranking-box").innerHTML = `<div class="ranking-row"><span>スコア</span><span>${score} pts</span></div>`; 
        let coinText = isCustomGame ? "カスタムモードは獲得不可" : `獲得コイン +${earnedCoins} 🪙`;
        el("ranking-box").innerHTML += `
            <div class="ranking-row" style="color: #FFD700; margin-top: 15px; border-top: 2px dashed #FFD700; padding-top: 15px;">
                <span>結果</span><span>${coinText}</span>
            </div>`;
    }
}





































































































































































































// --- モード制御 ---
window.openSingleSelect = () => {
    if (myPartyId || isMatchmaking) return; 
    openScreen("screen-single-select");
};

window.startSingle = (diff) => { 
    if (myPartyId || isMatchmaking) return; 
    currentWords = WORD_DB[diff]; 
    isCustomGame = false;
    openScreen("screen-play"); 
    startGame(60); 
};

window.openFriendBattle = () => {
    if (isMatchmaking) return;
    if (!myPartyId) return alert("パーティーに参加していません！");
    if (!isLeader) return alert("リーダー限定です！");
    openScreen("screen-battle-setup");
};

window.launchBattle = () => {
    if (!myPartyId || !isLeader) return;
    const selectedTime = parseInt(el("setup-time").value, 10);
    const selectedDiff = el("setup-diff").value;
    update(ref(db, `parties/${myPartyId}`), {
        state: "ready_check",
        time: selectedTime,
        diff: selectedDiff
    });
};

window.openOnlineMatch = () => {
    if (myPartyId) return alert("パーティー中は利用できません");
    if (isMatchmaking) {
        alert("マッチングをキャンセルします。");
        isMatchmaking = false;
        updateButtonStates();
        return;
    }
    const n = prompt("何人で遊ぶ？ (2-4)");
    if (![2,3,4].includes(Number(n))) return;
    isMatchmaking = true;
    updateButtonStates();
    set(ref(db, `matchmaking/${n}/${myId}`), { name: myName });
    alert("マッチング待機中...");
    onValue(ref(db, `matchmaking/${n}`), snap => {
        const players = snap.val();
        if (players && Object.keys(players).length >= n) {
            const ids = Object.keys(players).slice(0, n);
            if (ids[0] === myId) {
                const pid = "match_" + myId;
                const members = {};
                ids.forEach(id => { 
                    members[id] = { name: players[id].name, score: 0, ready: false }; 
                    remove(ref(db, `matchmaking/${n}/${id}`)); 
                });
                set(ref(db, `parties/${pid}`), { leader: myId, state: "ready_check", time: 30, diff: "normal", members });
                ids.forEach(id => update(ref(db, `users/${id}`), { partyId: pid }));
            }
            isMatchmaking = false; 
            updateButtonStates();
        }
    });
};

// --- エディター ---
window.openEditor = () => { 
    if (myPartyId || isMatchmaking) return; 
    openScreen("screen-editor"); 
    renderEditor(); 
};

window.updateCustomWord = (index, value) => {
    customWords[index] = value;
};

window.removeCustomWord = (index) => {
    customWords.splice(index, 1);
    renderEditor();
};

function renderEditor() {
    el("editor-list").innerHTML = customWords.map((w, i) => `
        <div class="editor-row">
            <input type="text" class="editor-input" value="${w}" oninput="window.updateCustomWord(${i}, this.value)" placeholder="2~20文字のひらがな">
            <button class="btn-kick" onclick="window.removeCustomWord(${i})">削除</button>
        </div>
    `).join("");
}

window.addEditorRow = () => { 
    if (customWords.length < 20) { 
        customWords.push(""); 
        renderEditor(); 
    } 
};

window.saveEditor = () => {
    const valid = customWords.filter(w => w && w.length >= 2 && w.length <= 20);
    if (valid.length < 5) return alert("最低5個必要です (2~20文字で入力してください)");
    customWords = valid; 
    localStorage.setItem("ramo_custom", JSON.stringify(customWords));
    alert("完成しました！"); 
    window.goHome();
};

window.playCustom = () => { 
    if (myPartyId || isMatchmaking) return; 
    const savedWords = JSON.parse(localStorage.getItem("ramo_custom"));
    if (!savedWords || savedWords.length < 5) {
        return alert("まずはエディターで5個以上作って保存してください"); 
    }
    customWords = savedWords; 
    currentWords = customWords; 
    isCustomGame = true;
    openScreen("screen-play"); 
    startGame(60); 
};

// --- 初期化 ---
el("my-id-display").innerText = myId;
el("my-name-input").value = myName;
const userRef = ref(db, `users/${myId}`);

get(userRef).then(snap => {
    if(snap.exists() && snap.val().coins !== undefined) {
        let cloudCoins = snap.val().coins;
        if(cloudCoins > coins) {
            coins = cloudCoins; 






        }
    }
    saveAndDisplayCoins(); 
});

update(userRef, { name: myName, status: "online", partyId: null });
onDisconnect(userRef).update({ status: "offline" });
updateButtonStates();

const timeSlider = el("setup-time");
const timeLabel = el("time-val"); 
if (timeSlider) {
    timeSlider.addEventListener("input", (e) => {
        if (timeLabel) timeLabel.innerText = e.target.value;
    });
}

window.goHome();
