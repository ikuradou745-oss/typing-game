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

// --- 永続化データ ---
const STORAGE_KEY_ID = "TYPING_GAME_USER_ID_8DIGITS";
const STORAGE_KEY_NAME = "TYPING_GAME_USER_NAME_PERSISTENT";
const STORAGE_KEY_BEST = "TYPING_GAME_BEST_SCORE_";

let myCode = localStorage.getItem(STORAGE_KEY_ID) || Math.floor(10000000 + Math.random() * 90000000).toString();
localStorage.setItem(STORAGE_KEY_ID, myCode);
let myName = localStorage.getItem(STORAGE_KEY_NAME) || "園名：" + Math.floor(100000000000 + Math.random() * 900000000000).toString();
localStorage.setItem(STORAGE_KEY_NAME, myName);

document.getElementById("my-friend-code").innerText = myCode;
document.getElementById("display-name").innerText = myName;

// --- サウンド再生関数 ---
const playSound = (id) => {
    const el = document.getElementById(id);
    if (el) {
        el.currentTime = 0;
        el.play().catch(()=>{});
    }
};

// --- 日本語単語データ ---
const wordData = [
    { kanji: "林檎", roma: "ringo", lv: "easy" },
    { kanji: "猫", roma: "neko", lv: "easy" },
    { kanji: "空", roma: "sora", lv: "easy" },
    { kanji: "海", roma: "umi", lv: "easy" },
    { kanji: "本", roma: "hon", lv: "easy" },
    { kanji: "時計", roma: "tokei", lv: "easy" },
    { kanji: "学校", roma: "gakkou", lv: "normal" },
    { kanji: "秘密", roma: "himitsu", lv: "normal" },
    { kanji: "挑戦", roma: "chousen", lv: "normal" },
    { kanji: "友達", roma: "tomodachi", lv: "normal" },
    { kanji: "図書館", roma: "toshokan", lv: "normal" },
    { kanji: "飛行機", roma: "hikouki", lv: "normal" },
    { kanji: "プログラミング", roma: "puroguramingu", lv: "hard" },
    { kanji: "一生懸命", roma: "isshoukenmei", lv: "hard" },
    { kanji: "温故知新", roma: "onkochishin", lv: "hard" },
    { kanji: "試行錯誤", roma: "shikousakugo", lv: "hard" },
    { kanji: "電光石火", roma: "denkousekka", lv: "hard" },
    { kanji: "不撓不屈", roma: "futoufukutsu", lv: "hard" }
];

// --- ゲーム状態 ---
let currentLevel = "easy";
let targetWord = null;
let currentIndex = 0;
let isPlaying = false;
let score = 0;
let combo = 0;

const screens = {
    mode: document.getElementById("mode-selection"),
    diff: document.getElementById("difficulty-selection"),
    game: document.getElementById("game-play-area"),
    multi: document.getElementById("multi-play-area")
};

function showScreen(key) {
    Object.values(screens).forEach(s => s.classList.add("hidden"));
    screens[key].classList.remove("hidden");
    if (key === 'diff') updateBestScores();
    if (key !== 'game') isPlaying = false;
}

function updateBestScores() {
    ["easy", "normal", "hard"].forEach(lv => {
        const best = localStorage.getItem(STORAGE_KEY_BEST + lv) || 0;
        document.getElementById("best-" + lv).innerText = best;
    });
}

// 起動ボタン
document.getElementById("single-play-btn").onclick = () => { playSound('sound-click'); showScreen('diff'); };
document.getElementById("back-to-mode").onclick = () => { playSound('sound-click'); showScreen('mode'); };
document.getElementById("end-game-btn").onclick = () => { playSound('sound-click'); endGame(); };

document.querySelectorAll(".diff-btn").forEach(btn => {
    btn.onclick = () => {
        playSound('sound-click');
        currentLevel = btn.dataset.level;
        startGame();
    };
});

function startGame() {
    showScreen('game');
    score = 0; combo = 0;
    document.getElementById("score-count").innerText = score;
    updateComboUI();
    isPlaying = true;
    nextWord();
}

function nextWord() {
    const pool = wordData.filter(w => w.lv === currentLevel);
    targetWord = pool[Math.floor(Math.random() * pool.length)];
    currentIndex = 0;
    document.getElementById("japanese-word").innerText = targetWord.kanji;
    updateWordDisplay();
}

function updateWordDisplay() {
    document.getElementById("char-done").innerText = targetWord.roma.substring(0, currentIndex);
    document.getElementById("char-todo").innerText = targetWord.roma.substring(currentIndex);
}

function updateComboUI() {
    const el = document.getElementById("combo-display");
    el.innerText = combo + " COMBO";
    if (combo > 0) {
        el.classList.add("active");
    } else {
        el.classList.remove("active");
    }
}

function endGame() {
    const best = localStorage.getItem(STORAGE_KEY_BEST + currentLevel) || 0;
    if (score > best) {
        localStorage.setItem(STORAGE_KEY_BEST + currentLevel, score);
        alert("ハイスコア更新！: " + score);
    }
    showScreen('diff');
}

// --- キー入力判定 ---
window.addEventListener("keydown", (e) => {
    if (!isPlaying) return;
    if (e.key === "Shift" || e.key === "Control" || e.key === "Alt") return;

    if (e.key === targetWord.roma[currentIndex]) {
        // 正解
        currentIndex++;
        combo++;
        score += 10 + (Math.floor(combo / 5) * 2); // コンボボーナス
        playSound('sound-type');
        
        if (currentIndex >= targetWord.roma.length) {
            playSound('sound-success');
            nextWord();
        }
        updateWordDisplay();
        updateComboUI();
        document.getElementById("score-count").innerText = score;
    } else {
        // ミス
        combo = 0;
        playSound('sound-error');
        updateComboUI();
    }
});

// --- Firebase (維持) ---
const myStatusRef = ref(db, `users/${myCode}`);
onValue(ref(db, ".info/connected"), (snap) => {
    if (snap.val() === true) {
        update(myStatusRef, { name: myName, status: "online", lastSeen: Date.now() });
        onDisconnect(myStatusRef).update({ status: "offline" });
    }
});

document.getElementById("update-name-btn").onclick = () => {
    const val = document.getElementById("name-input").value.trim();
    if (val) {
        myName = val;
        localStorage.setItem(STORAGE_KEY_NAME, myName);
        document.getElementById("display-name").innerText = myName;
        update(myStatusRef, { name: myName });
    }
};

document.getElementById("send-request-btn").onclick = async () => {
    const target = document.getElementById("target-code-input").value.trim();
    if (target.length === 8 && target !== myCode) {
        const snap = await get(ref(db, `users/${target}`));
        if (snap.exists()) {
            update(ref(db, `friends/${myCode}/${target}`), true);
            update(ref(db, `friends/${target}/${myCode}`), true);
            alert("フレンド追加成功！");
        }
    }
};

onValue(ref(db, `friends/${myCode}`), (snapshot) => {
    const listUI = document.getElementById("friend-list");
    listUI.innerHTML = "";
    snapshot.forEach((child) => {
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
    document.getElementById("friend-count-badge").innerText = snapshot.size || 0;
});

window.deleteFriend = (fid) => { remove(ref(db, `friends/${myCode}/${fid}`)); remove(ref(db, `friends/${fid}/${myCode}`)); };
window.inviteToParty = async (fid, fname) => {
    if (!currentPartyId) {
        currentPartyId = myCode;
        await set(ref(db, `parties/${currentPartyId}`), { leader: myCode, members: { [myCode]: myName } });
        update(myStatusRef, { partyId: currentPartyId });
    }
    set(ref(db, `invites/${fid}`), { fromId: myCode, fromName: myName, partyId: currentPartyId });
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
        };
        document.getElementById("decline-invite-btn").onclick = () => remove(ref(db, `invites/${myCode}`));
    } else { notifyUI.classList.add("hidden"); }
});

onValue(myStatusRef, (snap) => {
    const pId = snap.val()?.partyId;
    const infoUI = document.getElementById("party-info");
    const msgUI = document.getElementById("no-party-msg");
    const memberListUI = document.getElementById("party-member-list");
    const controlsUI = document.getElementById("party-controls");
    if (pId) {
        currentPartyId = pId; msgUI.classList.add("hidden"); infoUI.classList.remove("hidden");
        onValue(ref(db, `parties/${pId}`), (pSnap) => {
            const pData = pSnap.val();
            if (!pData) { update(myStatusRef, { partyId: null }); return; }
            memberListUI.innerHTML = "";
            Object.entries(pData.members).forEach(([mid, mname]) => {
                const div = document.createElement("div"); div.className = "party-member";
                div.innerHTML = `<span>${mid === pData.leader ? '<span class="leader-tag">L</span>' : ''}${mname}</span>
                ${pData.leader === myCode && mid !== myCode ? `<button onclick="kickMember('${mid}')">KICK</button>` : ''}`;
                memberListUI.appendChild(div);
            });
            controlsUI.innerHTML = pData.leader === myCode ? `<button onclick="disbandParty()">解散</button>` : `<button onclick="leaveParty()">脱退</button>`;
        });
    } else { infoUI.classList.add("hidden"); msgUI.classList.remove("hidden"); }
});

window.disbandParty = () => remove(ref(db, `parties/${currentPartyId}`));
window.leaveParty = () => { remove(ref(db, `parties/${currentPartyId}/members/${myCode}`)); update(myStatusRef, { partyId: null }); };
window.kickMember = (mid) => { remove(ref(db, `parties/${currentPartyId}/members/${mid}`)); update(ref(db, `users/${mid}`), { partyId: null }); };
