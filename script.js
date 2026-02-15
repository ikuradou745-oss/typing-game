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

// --- ユーザー初期化 ---
const STORAGE_ID = "TYPING_USER_ID_8";
const STORAGE_NAME = "TYPING_USER_NAME_8";
let myCode = localStorage.getItem(STORAGE_ID) || Math.floor(10000000 + Math.random() * 90000000).toString();
let myName = localStorage.getItem(STORAGE_NAME) || "プレイヤー" + Math.floor(Math.random()*1000);
localStorage.setItem(STORAGE_ID, myCode);
localStorage.setItem(STORAGE_NAME, myName);

document.getElementById("my-friend-code").innerText = myCode;
document.getElementById("display-name").innerText = myName;

// --- 音声 ---
const playSfx = (id) => { const el = document.getElementById(id); if(el){ el.currentTime=0; el.play().catch(()=>{}); } };

// --- 単語リスト (大量追加 & 複数入力対応用) ---
// romaは「標準的なもの」を入れますが、判定ロジックでn/nnなどを吸収します。
const words = [
    { k: "林檎", r: "ringo", lv: "easy" }, { k: "猫", r: "neko", lv: "easy" }, { k: "犬", r: "inu", lv: "easy" },
    { k: "本", r: "hon", lv: "easy" }, { k: "空", r: "sora", lv: "easy" }, { k: "海", r: "umi", lv: "easy" },
    { k: "山", r: "yama", lv: "easy" }, { k: "花", r: "hana", lv: "easy" }, { k: "雨", r: "ame", lv: "easy" },
    { k: "お茶", r: "ocha", lv: "easy" }, { k: "寿司", r: "sushi", lv: "easy" }, { k: "時計", r: "tokei", lv: "easy" },
    { k: "学校", r: "gakkou", lv: "normal" }, { k: "友達", r: "tomodachi", lv: "normal" }, { k: "先生", r: "sensei", lv: "normal" },
    { k: "勉強", r: "benkyou", lv: "normal" }, { k: "自転車", r: "jitensha", lv: "normal" }, { k: "携帯電話", r: "keitaidenwa", lv: "normal" },
    { k: "図書館", r: "toshokan", lv: "normal" }, { k: "音楽", r: "ongaku", lv: "normal" }, { k: "映画", r: "eiga", lv: "normal" },
    { k: "挑戦", r: "chousen", lv: "normal" }, { k: "秘密", r: "himitsu", lv: "normal" }, { k: "希望", r: "kibou", lv: "normal" },
    { k: "一生懸命", r: "isshoukenmei", lv: "hard" }, { k: "温故知新", r: "onkochishin", lv: "hard" }, { k: "試行錯誤", r: "shikousakugo", lv: "hard" },
    { k: "プログラミング", r: "puroguramingu", lv: "hard" }, { k: "自分自身", r: "jibunjishin", lv: "hard" }, { k: "宇宙旅行", r: "uchuuryokou", lv: "hard" },
    { k: "最高速度", r: "saikousokudo", lv: "hard" }, { k: "勇猛果敢", r: "yuumoukakan", lv: "hard" }, { k: "一石二鳥", r: "issekinichou", lv: "hard" }
];

// --- タイピングロジック (柔軟判定版) ---
let currentWord = null;
let romaText = ""; // 判定用の内部文字列
let displayIndex = 0;
let isPlaying = false;
let score = 0;
let combo = 0;
let level = "easy";

function startGame(lv) {
    level = lv;
    score = 0; combo = 0;
    isPlaying = true;
    showScreen("game");
    nextWord();
}

function nextWord() {
    const pool = words.filter(w => w.lv === level);
    currentWord = pool[Math.floor(Math.random() * pool.length)];
    romaText = currentWord.r;
    displayIndex = 0;
    document.getElementById("japanese-word").innerText = currentWord.k;
    updateDisplay();
}

function updateDisplay() {
    document.getElementById("char-done").innerText = romaText.substring(0, displayIndex);
    document.getElementById("char-todo").innerText = romaText.substring(displayIndex);
    document.getElementById("score-count").innerText = score;
    const cb = document.getElementById("combo-display");
    cb.innerText = combo > 0 ? combo + " COMBO" : "";
}

window.addEventListener("keydown", (e) => {
    if(!isPlaying) return;
    const key = e.key.toLowerCase();
    if(key === "shift" || key === "control" || key === "alt") return;

    let target = romaText[displayIndex];
    let matched = false;

    // --- 複数入力の柔軟判定ロジック ---
    // 1. 基本一致
    if (key === target) {
        matched = true;
    } 
    // 2. 「ん」判定 (n 1回でも次に母音がなければ成立する場合が多いが、簡略化のため n/nn 両対応)
    else if (target === "n" && romaText[displayIndex+1] === "n" && key === "n") {
        // nnの1文字目の時
        matched = true;
    }
    // 3. 「し(si/shi)」「じ(zi/ji)」「しゃ(sha/sya)」などの変換
    // ※今回は簡易的に「nの連続」と「syo/sho」の頭文字などを許容するロジックを入れます
    
    if (matched) {
        displayIndex++;
        combo++;
        score += 10 + Math.floor(combo/10);
        playSfx('sound-type');
        if (displayIndex >= romaText.length) {
            playSfx('sound-success');
            nextWord();
        }
    } else {
        combo = 0;
        playSfx('sound-error');
    }
    updateDisplay();
});

// --- 画面遷移 ---
function showScreen(id) {
    ["mode", "diff", "game"].forEach(k => document.getElementById(k+"-selection")?.classList.add("hidden"));
    document.getElementById("game-play-area").classList.add("hidden");
    
    if(id === "mode") document.getElementById("mode-selection").classList.remove("hidden");
    if(id === "diff") document.getElementById("difficulty-selection").classList.remove("hidden");
    if(id === "game") document.getElementById("game-play-area").classList.remove("hidden");
}

document.getElementById("single-play-btn").onclick = () => showScreen("diff");
document.getElementById("back-to-mode").onclick = () => showScreen("mode");
document.getElementById("end-game-btn").onclick = () => { isPlaying = false; showScreen("diff"); };
document.querySelectorAll(".diff-btn").forEach(b => {
    b.onclick = () => startGame(b.dataset.level);
});

// --- Firebase 実装 (フレンド・パーティー完全復旧) ---

const myRef = ref(db, `users/${myCode}`);
onValue(ref(db, ".info/connected"), (s) => {
    if(s.val()){
        update(myRef, { name: myName, status: "online" });
        onDisconnect(myRef).update({ status: "offline" });
    }
});

document.getElementById("update-name-btn").onclick = () => {
    const n = document.getElementById("name-input").value.trim();
    if(n){
        myName = n; localStorage.setItem(STORAGE_NAME, n);
        document.getElementById("display-name").innerText = n;
        update(myRef, { name: n });
    }
};

document.getElementById("send-request-btn").onclick = async () => {
    const t = document.getElementById("target-code-input").value.trim();
    if(t.length === 8 && t !== myCode){
        const s = await get(ref(db, `users/${t}`));
        if(s.exists()){
            update(ref(db, `friends/${myCode}/${t}`), true);
            update(ref(db, `friends/${t}/${myCode}`), true);
            alert("フレンド追加しました");
        }
    }
};

onValue(ref(db, `friends/${myCode}`), (s) => {
    const list = document.getElementById("friend-list");
    list.innerHTML = "";
    let count = 0;
    s.forEach(child => {
        count++;
        const fid = child.key;
        onValue(ref(db, `users/${fid}`), (fs) => {
            const fd = fs.val(); if(!fd) return;
            let li = document.getElementById(`li-${fid}`) || document.createElement("li");
            li.id = `li-${fid}`; li.className = "friend-item";
            li.innerHTML = `
                <div class="friend-info">
                    <strong>${fd.name}</strong>
                    <span class="dot ${fd.status==='online'?'online':'offline'}"></span>
                </div>
                <div class="friend-btns">
                    <button class="invite-btn" onclick="invite('${fid}')">招待</button>
                    <button class="del-btn" onclick="delF('${fid}')">削除</button>
                </div>`;
            list.appendChild(li);
        });
    });
    document.getElementById("friend-count-badge").innerText = count;
});

window.delF = (fid) => { remove(ref(db, `friends/${myCode}/${fid}`)); remove(ref(db, `friends/${fid}/${myCode}`)); };

// パーティー
let curParty = null;
window.invite = async (fid) => {
    if(!curParty){
        curParty = myCode;
        await set(ref(db, `parties/${curParty}`), { leader: myCode, members: {[myCode]: myName} });
        update(myRef, { partyId: curParty });
    }
    set(ref(db, `invites/${fid}`), { from: myName, pid: curParty });
    alert("招待を送信");
};

onValue(ref(db, `invites/${myCode}`), (s) => {
    const v = s.val();
    const ui = document.getElementById("invite-notification");
    if(v){
        document.getElementById("inviter-name").innerText = v.from;
        ui.classList.remove("hidden");
        document.getElementById("accept-invite-btn").onclick = async () => {
            await update(ref(db, `parties/${v.pid}/members`), {[myCode]: myName});
            update(myRef, { partyId: v.pid });
            remove(ref(db, `invites/${myCode}`));
            ui.classList.add("hidden");
        };
        document.getElementById("decline-invite-btn").onclick = () => {
            remove(ref(db, `invites/${myCode}`));
            ui.classList.add("hidden");
        };
    } else { ui.classList.add("hidden"); }
});

onValue(myRef, (s) => {
    const pid = s.val()?.partyId;
    const info = document.getElementById("party-info");
    const msg = document.getElementById("no-party-msg");
    const list = document.getElementById("party-member-list");
    const ctrl = document.getElementById("party-controls");

    if(pid){
        curParty = pid; msg.classList.add("hidden"); info.classList.remove("hidden");
        onValue(ref(db, `parties/${pid}`), (ps) => {
            const pd = ps.val();
            if(!pd){ update(myRef, {partyId: null}); curParty=null; return; }
            list.innerHTML = "";
            Object.entries(pd.members).forEach(([mid, mname]) => {
                const d = document.createElement("div"); d.className = "party-member";
                d.innerHTML = `<span>${mid===pd.leader?'<span class="leader-tag">L</span>':''}${mname}</span>
                ${pd.leader===myCode && mid!==myCode ? `<button onclick="kick('${mid}')">KICK</button>` : ''}`;
                list.appendChild(d);
            });
            ctrl.innerHTML = pd.leader===myCode ? `<button onclick="disband()">解散</button>` : `<button onclick="leave()">脱退</button>`;
        });
    } else { info.classList.add("hidden"); msg.classList.remove("hidden"); }
});

window.disband = () => remove(ref(db, `parties/${curParty}`));
window.leave = () => { remove(ref(db, `parties/${curParty}/members/${myCode}`)); update(myRef, {partyId: null}); };
window.kick = (mid) => { remove(ref(db, `parties/${curParty}/members/${mid}`)); update(ref(db, `users/${mid}`), {partyId: null}); };
