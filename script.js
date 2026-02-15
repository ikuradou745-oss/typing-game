import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue, onDisconnect, remove } from "firebase/database";

// --- Firebase 設定 ---
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

// --- データ永続化 (localStorage) ---
const STORAGE_KEY_ID = "TYPING_GAME_USER_ID_8DIGITS";
const STORAGE_KEY_NAME = "TYPING_GAME_USER_NAME_PERSISTENT";

let myCode = localStorage.getItem(STORAGE_KEY_ID) || Math.floor(10000000 + Math.random() * 90000000).toString();
localStorage.setItem(STORAGE_KEY_ID, myCode);

let myName = localStorage.getItem(STORAGE_KEY_NAME) || "園名：" + Math.floor(100000000000 + Math.random() * 900000000000).toString();
localStorage.setItem(STORAGE_KEY_NAME, myName);

document.getElementById("my-friend-code").innerText = myCode;
document.getElementById("display-name").innerText = myName;

let currentPartyId = null;

// --- 画面遷移管理 ---
const screens = {
    mode: document.getElementById("mode-selection"),
    diff: document.getElementById("difficulty-selection"),
    game: document.getElementById("game-play-area"),
    multi: document.getElementById("multi-play-area")
};

function showScreen(screenKey) {
    Object.values(screens).forEach(s => s.classList.add("hidden"));
    screens[screenKey].classList.remove("hidden");
    if (screenKey !== 'game') isPlaying = false;
}

// ボタンイベント
document.getElementById("single-play-btn").onclick = () => showScreen('diff');
document.getElementById("friend-play-btn").onclick = () => showScreen('multi');
document.getElementById("back-to-mode").onclick = () => showScreen('mode');
document.getElementById("back-to-mode-from-multi").onclick = () => showScreen('mode');
document.getElementById("end-game-btn").onclick = () => {
    isPlaying = false;
    showScreen('diff');
};

// --- タイピングゲームロジック ---
const wordList = [
    "apple", "banana", "cherry", "dragon", "energy", "forest", "guitar", "hello", "island", "jungle",
    "keyboard", "lemon", "mountain", "network", "ocean", "player", "queen", "river", "sky", "tiger",
    "universe", "victory", "window", "xray", "yellow", "zebra", "javascript", "firebase", "programming",
    "challenge", "experience", "beautiful", "wonderful", "dangerous", "important", "knowledge", "structure"
];

let targetWord = "";
let currentIndex = 0;
let isPlaying = false;
let score = 0;
let currentLevel = "easy";

// 難易度ボタン設定
document.querySelectorAll(".diff-btn").forEach(btn => {
    btn.onclick = () => {
        currentLevel = btn.dataset.level;
        startGame();
    };
});

function startGame() {
    showScreen('game');
    score = 0;
    document.getElementById("score-count").innerText = score;
    isPlaying = true;
    nextWord();
}

function nextWord() {
    let min, max;
    if (currentLevel === "easy") { min = 1; max = 6; }
    else if (currentLevel === "normal") { min = 6; max = 12; }
    else { min = 12; max = 24; }

    // 条件に合う単語をフィルタリング
    const filtered = wordList.filter(w => w.length >= min && w.length <= max);
    // もしリストになければデフォルトを出す
    const pool = filtered.length > 0 ? filtered : ["no-words-found"];
    
    targetWord = pool[Math.floor(Math.random() * pool.length)];
    currentIndex = 0;
    updateWordDisplay();
}

function updateWordDisplay() {
    document.getElementById("char-done").innerText = targetWord.substring(0, currentIndex);
    document.getElementById("char-todo").innerText = targetWord.substring(currentIndex);
}

// キー入力検知
window.addEventListener("keydown", (e) => {
    if (!isPlaying) return;
    if (e.key === "Escape") return; // メニュー操作などを阻害しない

    if (e.key === targetWord[currentIndex]) {
        currentIndex++;
        if (currentIndex >= targetWord.length) {
            score++;
            document.getElementById("score-count").innerText = score;
            nextWord();
        } else {
            updateWordDisplay();
        }
    }
});

// --- Firebase (プロフィール・フレンド・パーティー) ※以前のものを完全維持 ---

const myStatusRef = ref(db, `users/${myCode}`);
onValue(ref(db, ".info/connected"), (snap) => {
    if (snap.val() === true) {
        update(myStatusRef, { name: myName, status: "online", lastSeen: Date.now() });
        onDisconnect(myStatusRef).update({ status: "offline", lastSeen: Date.now() });
    }
});

document.getElementById("update-name-btn").onclick = () => {
    const input = document.getElementById("name-input");
    if (input.value.trim()) {
        myName = input.value.trim();
        localStorage.setItem(STORAGE_KEY_NAME, myName);
        document.getElementById("display-name").innerText = myName;
        update(myStatusRef, { name: myName });
        input.value = "";
    }
};

document.getElementById("send-request-btn").onclick = async () => {
    const target = document.getElementById("target-code-input").value.trim();
    if (target.length === 8 && target !== myCode) {
        const snap = await get(ref(db, `users/${target}`));
        if (snap.exists()) {
            update(ref(db, `friends/${myCode}/${target}`), true);
            update(ref(db, `friends/${target}/${myCode}`), true);
            document.getElementById("target-code-input").value = "";
            alert("フレンドを追加しました！");
        } else { alert("ユーザーが見つかりません。"); }
    }
};

onValue(ref(db, `friends/${myCode}`), (snapshot) => {
    const listUI = document.getElementById("friend-list");
    listUI.innerHTML = "";
    let count = 0;
    snapshot.forEach((child) => {
        count++;
        const fid = child.key;
        onValue(ref(db, `users/${fid}`), (fSnap) => {
            const fData = fSnap.val();
            if (!fData) return;
            let li = document.getElementById(`li-${fid}`) || document.createElement("li");
            li.id = `li-${fid}`; li.className = "friend-item";
            li.innerHTML = `
                <div class="friend-info">
                    <strong>${fData.name}</strong>
                    <span><span class="dot ${fData.status === 'online' ? 'online' : 'offline'}"></span></span>
                </div>
                <div class="friend-btns">
                    <button class="invite-btn" onclick="inviteToParty('${fid}', '${fData.name}')">招待</button>
                    <button class="del-btn" onclick="deleteFriend('${fid}')">削除</button>
                </div>
            `;
            listUI.appendChild(li);
        });
    });
    document.getElementById("friend-count-badge").innerText = count;
});

window.deleteFriend = (fid) => {
    if (confirm("削除しますか？")) {
        remove(ref(db, `friends/${myCode}/${fid}`));
        remove(ref(db, `friends/${fid}/${myCode}`));
    }
};

window.inviteToParty = async (fid, fname) => {
    if (!currentPartyId) {
        currentPartyId = myCode;
        await set(ref(db, `parties/${currentPartyId}`), { leader: myCode, members: { [myCode]: myName } });
        update(myStatusRef, { partyId: currentPartyId });
    }
    set(ref(db, `invites/${fid}`), { fromId: myCode, fromName: myName, partyId: currentPartyId });
    alert("招待を送りました");
};

onValue(ref(db, `invites/${myCode}`), (snap) => {
    const invite = snap.val();
    const notifyUI = document.getElementById("invite-notification");
    if (invite) {
        document.getElementById("inviter-name").innerText = invite.fromName;
        notifyUI.classList.remove("hidden");
        document.getElementById("accept-invite-btn").onclick = async () => {
            await update(ref(db, `parties/${invite.partyId}/members`), { [myCode]: myName });
            update(myStatusRef, { partyId: invite.partyId });
            remove(ref(db, `invites/${myCode}`));
            notifyUI.classList.add("hidden");
        };
        document.getElementById("decline-invite-btn").onclick = () => {
            remove(ref(db, `invites/${myCode}`));
            notifyUI.classList.add("hidden");
        };
    } else { notifyUI.classList.add("hidden"); }
});

onValue(myStatusRef, (snap) => {
    const pId = snap.val()?.partyId;
    const infoUI = document.getElementById("party-info");
    const msgUI = document.getElementById("no-party-msg");
    const memberListUI = document.getElementById("party-member-list");
    const controlsUI = document.getElementById("party-controls");

    if (pId) {
        currentPartyId = pId;
        msgUI.classList.add("hidden"); infoUI.classList.remove("hidden");
        onValue(ref(db, `parties/${pId}`), (pSnap) => {
            const pData = pSnap.val();
            if (!pData) { update(myStatusRef, { partyId: null }); currentPartyId = null; return; }
            memberListUI.innerHTML = "";
            const isLeader = pData.leader === myCode;
            Object.entries(pData.members).forEach(([mid, mname]) => {
                const div = document.createElement("div"); div.className = "party-member";
                div.innerHTML = `<span>${mid === pData.leader ? '<span class="leader-tag">L</span>' : ''}${mname}</span>
                    ${isLeader && mid !== myCode ? `<button class="danger-btn" style="padding:4px 8px; font-size:0.7rem;" onclick="kickMember('${mid}')">KICK</button>` : ''}`;
                memberListUI.appendChild(div);
            });
            controlsUI.innerHTML = isLeader 
                ? `<button class="danger-btn" style="width:100%" onclick="disbandParty()">解散</button>`
                : `<button class="danger-btn" style="width:100%" onclick="leaveParty()">脱退</button>`;
        });
    } else { infoUI.classList.add("hidden"); msgUI.classList.remove("hidden"); }
});

window.disbandParty = () => { if (confirm("解散しますか？")) remove(ref(db, `parties/${currentPartyId}`)); };
window.leaveParty = () => { remove(ref(db, `parties/${currentPartyId}/members/${myCode}`)); update(myStatusRef, { partyId: null }); };
window.kickMember = (mid) => { remove(ref(db, `parties/${currentPartyId}/members/${mid}`)); update(ref(db, `users/${mid}`), { partyId: null }); };
