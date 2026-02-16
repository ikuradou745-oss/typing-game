import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, push, update, remove, onDisconnect, serverTimestamp } from "firebase/database";

// --- CONFIG (あなたのFirebase情報を入れてください) ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- 状態管理 ---
let myId = localStorage.getItem("typing_uid") || Math.random().toString(36).substring(2, 10);
localStorage.setItem("typing_uid", myId);

let myName = localStorage.getItem("typing_name") || "No Name";
let myFriends = [];
let currentPartyId = null;
let isLeader = false;
let currentWords = [];
let currentIndex = 0;
let score = 0;
let combo = 0;
let timerInterval = null; // タイマー管理用
let battleActive = false;

// --- DOM要素 ---
const screens = ["mode", "online", "waiting", "editor", "difficulty", "setup", "play", "result"];
const el = (id) => document.getElementById(id);

// --- 初期化 ---
window.addEventListener("DOMContentLoaded", () => {
    updateProfileDisplay();
    initFirebaseListeners();
    setupEventListeners();
    renderCustomWords();
    el("bgm-lobby").play().catch(() => {});
});

function showScreen(name) {
    const screenMap = {
        mode: "mode-selection",
        online: "online-selection",
        waiting: "online-waiting",
        editor: "custom-editor",
        difficulty: "difficulty-selection",
        setup: "battle-setup",
        wait_leader: "battle-waiting",
        play: "game-play-area",
        result: "result-screen"
    };
    Object.values(screenMap).forEach(id => el(id).classList.add("hidden"));
    el(screenMap[name]).classList.remove("hidden");
    
    // 画面切り替え時に古いタイマーを必ず消す（2秒減るバグ対策）
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// --- Firebase リスナー ---
function initFirebaseListeners() {
    // 自身のデータ監視
    onValue(ref(db, `users/${myId}`), (snap) => {
        const data = snap.val();
        if (data) {
            myName = data.name || "No Name";
            el("display-name").innerText = myName;
            el("my-friend-code").innerText = myId;
            currentPartyId = data.partyId || null;
            updatePartyUI();
        }
    });

    // 招待の監視
    onValue(ref(db, `invites/${myId}`), (snap) => {
        const invite = snap.val();
        if (invite) {
            el("inviter-name").innerText = invite.fromName;
            el("invite-notification").classList.remove("hidden");
            el("sound-join").play();
        }
    });

    // パーティー同期とゲーム開始の監視
    onValue(ref(db, `users/${myId}/partyId`), (snap) => {
        const pid = snap.val();
        if (pid) {
            onValue(ref(db, `parties/${pid}`), (pSnap) => {
                const party = pSnap.val();
                if (!party) return;
                
                // リーダー判定
                isLeader = (party.leader === myId);

                // バトル開始の合図
                if (party.state === "playing" && !battleActive) {
                    startOnlineBattle(party);
                } else if (party.state === "setup" && !isLeader) {
                    showScreen("wait_leader");
                }
            });
        }
    });
}

// --- プロフィール・フレンド機能 ---
function updateProfileDisplay() {
    el("display-name").innerText = myName;
    el("my-friend-code").innerText = myId;
}

el("update-name-btn").onclick = () => {
    const newName = el("name-input").value.trim();
    if (newName) {
        myName = newName;
        localStorage.setItem("typing_name", myName);
        update(ref(db, `users/${myId}`), { name: myName });
        el("name-input").value = "";
    }
};

el("send-request-btn").onclick = () => {
    const targetId = el("target-code-input").value.trim();
    if (targetId === myId) return showToast("自分は追加できません");
    
    update(ref(db, `invites/${targetId}`), {
        fromId: myId,
        fromName: myName,
        type: "party"
    });
    showToast("招待を送信しました");
    el("target-code-input").value = "";
};

// 招待承諾
el("accept-invite-btn").onclick = () => {
    onValue(ref(db, `invites/${myId}`), (snap) => {
        const invite = snap.val();
        if (invite) {
            const partyId = invite.fromId; // 送信者のIDをパーティーIDとする
            joinParty(partyId);
            remove(ref(db, `invites/${myId}`));
            el("invite-notification").classList.add("hidden");
        }
    }, { onlyOnce: true });
};

function joinParty(pid) {
    currentPartyId = pid;
    update(ref(db, `users/${myId}`), { partyId: pid });
    update(ref(db, `parties/${pid}/members/${myId}`), {
        name: myName,
        score: 0,
        joinedAt: serverTimestamp()
    });
}

function updatePartyUI() {
    if (!currentPartyId) {
        el("no-party-msg").classList.remove("hidden");
        el("party-info").classList.add("hidden");
        return;
    }
    el("no-party-msg").classList.add("hidden");
    el("party-info").classList.remove("hidden");

    onValue(ref(db, `parties/${currentPartyId}`), (snap) => {
        const party = snap.val();
        if (!party) return;
        
        const listEl = el("party-member-list");
        listEl.innerHTML = "";
        Object.entries(party.members || {}).forEach(([id, m]) => {
            const div = document.createElement("div");
            div.className = "lane";
            div.innerHTML = `<span>${m.name}</span> ${id === party.leader ? "👑" : ""}`;
            listEl.appendChild(div);
        });

        const ctrl = el("party-controls");
        ctrl.innerHTML = "";
        if (isLeader) {
            const btn = document.createElement("button");
            btn.className = "success-btn";
            btn.innerText = "バトル設定へ";
            btn.onclick = () => {
                update(ref(db, `parties/${currentPartyId}`), { state: "setup" });
                showScreen("setup");
            };
            ctrl.appendChild(btn);
        }
        const leaveBtn = document.createElement("button");
        leaveBtn.className = "back-btn";
        leaveBtn.innerText = "抜ける";
        leaveBtn.onclick = leaveParty;
        ctrl.appendChild(leaveBtn);
    });
}

function leaveParty() {
    if (currentPartyId) {
        remove(ref(db, `parties/${currentPartyId}/members/${myId}`));
        update(ref(db, `users/${myId}`), { partyId: null });
        currentPartyId = null;
        showScreen("mode");
    }
}

// --- タイピングを作る (エディター) ---
let editorWords = JSON.parse(localStorage.getItem("custom_typing_words")) || [];

function renderCustomWords() {
    const container = el("custom-word-list");
    container.innerHTML = "";
    editorWords.forEach((word, index) => {
        const div = document.createElement("div");
        div.className = "word-item";
        div.innerHTML = `
            <input type="text" value="${word}" onchange="updateWord(${index}, this.value)">
            <button class="delete-word-btn" onclick="deleteWord(${index})">×</button>
        `;
        container.appendChild(div);
    });
    el("custom-count").innerText = editorWords.length;
}

window.updateWord = (idx, val) => { editorWords[idx] = val; };
window.deleteWord = (idx) => {
    editorWords.splice(idx, 1);
    renderCustomWords();
};

el("add-word-btn").onclick = () => {
    editorWords.push("");
    renderCustomWords();
};

el("save-words-btn").onclick = () => {
    const filtered = editorWords.filter(w => w.length >= 2);
    localStorage.setItem("custom_typing_words", JSON.stringify(filtered));
    showToast("保存しました！");
};

// --- ゲームロジック ---
const WORD_DB = {
    easy: ["ねこ", "いぬ", "とり", "さかな", "うし"],
    normal: ["ぷろぐらみんぐ", "たいぴんぐ", "すまーとふぉん", "いんたーねっと"],
    hard: ["きょうてきしんしゅく", "こんぴゅーたーぐらふぃっくす", "ぜったいれいど"]
};

function startOnlineBattle(party) {
    battleActive = true;
    currentWords = WORD_DB[party.difficulty || "normal"];
    score = 0;
    currentIndex = 0;
    combo = 0;
    showScreen("play");
    el("rival-lanes").classList.remove("hidden");
    
    initRivalLanes(party);
    nextWord();

    let timeLeft = party.duration || 30;
    el("timer-display").innerText = `TIME: ${timeLeft}`;
    
    // 二重タイマー防止
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        el("timer-display").innerText = `TIME: ${timeLeft}`;
        
        if (timeLeft <= 0) {
            endBattle();
        }
    }, 1000);
}

function initRivalLanes(party) {
    const container = el("rival-lanes");
    container.innerHTML = "";
    Object.entries(party.members).forEach(([id, m]) => {
        const lane = document.createElement("div");
        lane.id = `lane-${id}`;
        lane.className = `lane ${id === myId ? 'me' : ''}`;
        lane.innerHTML = `
            <div class="lane-info">${m.name}: <span class="lane-score">0</span></div>
            <div class="lane-bar-bg"><div class="lane-bar-fill"></div></div>
        `;
        container.appendChild(lane);
    });

    // 他の人のスコアをリアルタイム監視
    onValue(ref(db, `parties/${currentPartyId}/members`), (snap) => {
        const members = snap.val();
        if (!members) return;
        Object.entries(members).forEach(([id, m]) => {
            const lane = el(`lane-${id}`);
            if (lane) {
                lane.querySelector(".lane-score").innerText = m.score;
                const percent = Math.min(100, (m.score / 5000) * 100);
                lane.querySelector(".lane-bar-fill").style.width = percent + "%";
            }
        });
    });
}

function nextWord() {
    const word = currentWords[Math.floor(Math.random() * currentWords.length)];
    el("japanese-word").innerText = word;
    currentRoma = kanaToRoma(word);
     RomaIndex = 0;
    updateRomaDisplay();
}

let currentRoma = "";
let RomaIndex = 0;

function updateRomaDisplay() {
    el("char-done").innerText = currentRoma.substring(0, RomaIndex);
    el("char-todo").innerText = currentRoma.substring(RomaIndex);
}

window.onkeydown = (e) => {
    if (!battleActive || e.key === "Shift" || e.key === "Control") return;
    
    if (e.key === currentRoma[RomaIndex]) {
        RomaIndex++;
        score += 10 + combo;
        combo++;
        el("sound-type").currentTime = 0;
        el("sound-type").play();
        
        if (RomaIndex >= currentRoma.length) {
            score += 100;
            combo += 5;
            el("sound-success").play();
            nextWord();
        }
        updateRomaDisplay();
        el("score-count").innerText = score;
        el("combo-display").innerText = `${combo} COMBO`;
        
        // Firebaseに自分のスコアを送信
        if (currentPartyId) {
            update(ref(db, `parties/${currentPartyId}/members/${myId}`), { score: score });
        }
    } else {
        combo = 0;
        el("combo-display").innerText = "0 COMBO";
        el("sound-error").play();
    }
};

function endBattle() {
    battleActive = false;
    clearInterval(timerInterval);
    el("sound-finish").play();
    showScreen("result");

    if (currentPartyId) {
        onValue(ref(db, `parties/${currentPartyId}/members`), (snap) => {
            const members = snap.val();
            const sorted = Object.values(members).sort((a, b) => b.score - a.score);
            const list = el("ranking-list");
            list.innerHTML = "";
            sorted.forEach((m, i) => {
                const row = document.createElement("div");
                row.className = `rank-row ${i === 0 ? 'rank-1' : ''}`;
                row.innerHTML = `<span>${i+1}位 ${m.name}</span> <span>${m.score} pts</span>`;
                list.appendChild(row);
            });
        }, { onlyOnce: true });
        
        if (isLeader) {
            update(ref(db, `parties/${currentPartyId}`), { state: "lobby" });
        }
    }
}

// --- 警告システム ---
el("friend-play-btn").onclick = () => {
    if (!currentPartyId) {
        showToast("「フレンドと対戦」はパーティー限定です！");
        return;
    }
    // パーティーリーダーなら設定へ
    if (isLeader) {
        showScreen("setup");
    } else {
        showScreen("wait_leader");
    }
};

function showToast(msg) {
    const t = el("battle-toast");
    t.innerText = msg;
    t.classList.remove("hidden");
    setTimeout(() => t.classList.add("hidden"), 3000);
}

// --- ローマ字変換 (簡易版) ---
function kanaToRoma(kana) {
    const table = {
        'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
        'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
        'さ': 'sa', 'し': 'si', 'す': 'su', 'せ': 'se', 'そ': 'so',
        'た': 'ta', 'ち': 'ti', 'つ': 'tu', 'て': 'te', 'と': 'to',
        'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
        'は': 'ha', 'ひ': 'hi', 'ふ': 'hu', 'へ': 'he', 'ほ': 'ho',
        'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
        'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
        'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
        'わ': 'wa', 'を': 'wo', 'ん': 'nn',
        'ぷ': 'pu', 'ろ': 'ro', 'ぐ': 'gu', 'ら': 'ra', 'み': 'mi', 'ん': 'nn', 'ぐ': 'gu'
    };
    return kana.split('').map(c => table[c] || c).join('');
}

// --- イベントリスナー登録 (ボタン類) ---
el("single-play-btn").onclick = () => showScreen("difficulty");
el("custom-play-btn").onclick = () => {
    const saved = JSON.parse(localStorage.getItem("custom_typing_words"));
    if (!saved || saved.length === 0) return showToast("まずは「作る」から作成してください");
    currentWords = saved;
    startOnlineBattle({ difficulty: "custom", duration: 60, members: { [myId]: { name: myName, score: 0 } } });
};
el("open-editor-btn").onclick = () => showScreen("editor");
el("online-play-btn").onclick = () => showScreen("online");
el("back-from-online-btn").onclick = () => showScreen("mode");
el("back-from-editor-btn").onclick = () => showScreen("mode");
el("back-to-mode-btn").onclick = () => showScreen("mode");
el("result-back-btn").onclick = () => showScreen("mode");
el("cancel-setup-btn").onclick = () => showScreen("mode");

el("start-battle-trigger").onclick = () => {
    const diff = el("battle-diff-select").value;
    const time = parseInt(el("battle-time-range").value);
    update(ref(db, `parties/${currentPartyId}`), {
        state: "playing",
        difficulty: diff,
        duration: time,
        startTime: serverTimestamp()
    });
};

el("battle-time-range").oninput = (e) => {
    el("time-val").innerText = e.target.value;
};

el("copy-code-btn").onclick = () => {
    navigator.clipboard.writeText(myId);
    showToast("コードをコピーしました");
};

// マッチングロジック (簡易)
window.joinMatchmaking = (count) => {
    showScreen("waiting");
    el("online-wait-count").innerText = `Searching for ${count} players...`;
    // 実装はパーティー招待システムを流用
};
