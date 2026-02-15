import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue, onDisconnect, remove } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBXnNXQ5khcR0EvRide4C0PjshJZpSF4oM",
    authDomain: "typing-game-28ed0.firebaseapp.com",
    projectId: "typing-game-28ed0",
    databaseURL: "https://typing-game-28ed0-default-rtdb.firebaseio.com",
    appId: "1:963797267101:web:0d5d700458fb1991021a74"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- ユーザー初期設定 ---
const myCode = localStorage.getItem("T_ID") || Math.floor(10000000 + Math.random() * 90000000).toString();
let myName = localStorage.getItem("T_NAME") || "Player" + myCode.slice(-3);
localStorage.setItem("T_ID", myCode);
localStorage.setItem("T_NAME", myName);

document.getElementById("my-friend-code").innerText = myCode;
document.getElementById("display-name").innerText = myName;

const playSfx = (id) => { const el = document.getElementById(id); if(el){ el.currentTime=0; el.play().catch(()=>{}); } };
const bgmBox = { 
    lobby: document.getElementById("bgm-lobby"), 
    battle: document.getElementById("bgm-battle"),
    play: function(key) { this.stopAll(); this[key].play(); },
    stopAll: function() { this.lobby.pause(); this.battle.pause(); }
};

// --- ローマ字エンジン ---
const romajiTable = {
    'あ':['a'], 'い':['i'], 'う':['u'], 'え':['e'], 'お':['o'],
    'か':['ka','ca'], 'き':['ki'], 'く':['ku'], 'け':['ke'], 'こ':['ko'],
    'さ':['sa'], 'し':['shi','si'], 'す':['su'], 'せ':['se'], 'そ':['so'],
    'た':['ta'], 'ち':['chi','ti'], 'つ':['tsu','tu'], 'て':['te'], 'と':['to'],
    'な':['na'], 'に':['ni'], 'ぬ':['nu'], 'ね':['ne'], 'の':['no'],
    'は':['ha'], 'ひ':['hi'], 'ふ':['fu','hu'], 'へ':['he'], 'ほ':['ho'],
    'ま':['ma'], 'み':['mi'], 'む':['mu'], 'め':['me'], 'も':['mo'],
    'や':['ya'], 'ゆ':['yu'], 'よ':['yo'], 'ら':['ra'], 'り':['ri'], 'る':['ru'], 'れ':['re'], 'ろ':['ro'],
    'わ':['wa'], 'を':['wo'], 'ん':['nn','n'], 'っ':['xtsu'],
    'きゃ':['kya'], 'きゅ':['kyu'], 'きょ':['kyo'],
    'しゃ':['sha','sya'], 'しゅ':['shu','syu'], 'しょ':['sho','syo'],
    'ちゃ':['cha','tya'], 'ちゅ':['chu','tyu'], 'ちょ':['cho','tyo'],
    'にゃ':['nya'], 'にゅ':['nyu'], 'にょ':['nyo'],
    'じゃ':['ja','jya'], 'じゅ':['ju','jyu'], 'じょ':['jo','jyo'],
    'ー':['-']
};

const words = [
    { k: "林檎", kana: "りんご", lv: "easy" }, { k: "寿司", kana: "すし", lv: "easy" },
    { k: "自転車", kana: "じてんしゃ", lv: "normal" }, { k: "勉強中", kana: "べんきょうちゅう", lv: "normal" },
    { k: "一生懸命", kana: "いっしょうけんめい", lv: "hard" }, { k: "一石二鳥", kana: "いっせきにちょう", lv: "hard" }
];

function parseKana(kana) {
    let nodes = [];
    for (let i = 0; i < kana.length; i++) {
        let chunk = kana[i], next = kana[i+1];
        if (next && ['ゃ','ゅ','ょ'].includes(next)) { chunk += next; i++; }
        nodes.push({ k: chunk, opts: romajiTable[chunk] || [chunk] });
    }
    // 特殊処理: っ (次が子音なら重ねる)
    nodes.forEach((n, idx) => {
        if(n.k === 'っ' && nodes[idx+1]) {
            nodes[idx+1].opts.forEach(o => { if(!['a','i','u','e','o'].includes(o[0])) n.opts.push(o[0]); });
        }
        if(n.k === 'ん' && nodes[idx+1]) {
            if(!['a','i','u','e','o','y'].includes(nodes[idx+1].opts[0][0])) n.opts.push('n');
        }
    });
    return nodes;
}

// --- ゲーム変数 ---
let tState = { nodes: [], cIdx: 0, typed: "", valid: [], textDone: "" };
let isPlaying = false, score = 0, combo = 0, timeLeft = 30, gameTimer = null;
let currentPartyId = null, isLeader = false;

// --- 画面遷移 ---
function showScreen(id) {
    document.querySelectorAll(".menu-screen").forEach(s => s.classList.add("hidden"));
    document.getElementById(id === "mode" ? "mode-selection" : (id === "diff" ? "difficulty-selection" : (id === "setup" ? "battle-setup" : (id === "wait" ? "battle-waiting" : (id === "game" ? "game-play-area" : "result-screen"))))).classList.remove("hidden");
    if(id === "mode") { bgmBox.play("lobby"); }
}

// --- バトルロジック ---
document.getElementById("friend-play-btn").onclick = async () => {
    playSfx("sound-click");
    const err = document.getElementById("mode-error-msg");
    err.classList.add("hidden");

    if(!currentPartyId) {
        err.innerText = "パーティーに入る必要があります。";
        err.classList.remove("hidden");
        return;
    }

    const snap = await get(ref(db, `parties/${currentPartyId}`));
    const partyData = snap.val();
    if(partyData.leader !== myCode) {
        err.innerText = "パーティーのリーダー限定です。";
        err.classList.remove("hidden");
        return;
    }

    isLeader = true;
    showScreen("setup");
};

// リーダーが設定を変更
document.getElementById("battle-time-range").oninput = (e) => {
    document.getElementById("time-val").innerText = e.target.value;
};

// バトル開始トリガー (リーダー)
document.getElementById("start-battle-trigger").onclick = () => {
    const diff = document.getElementById("battle-diff-select").value;
    const time = parseInt(document.getElementById("battle-time-range").value);
    set(ref(db, `parties/${currentPartyId}/battle`), {
        status: "start",
        config: { diff, time },
        timestamp: Date.now()
    });
};

// リアルタイムリスナー (バトル同期)
function listenBattle(pid) {
    onValue(ref(db, `parties/${pid}/battle`), (snap) => {
        const b = snap.val();
        if(!b) return;
        if(b.status === "start") {
            startBattle(b.config.diff, b.config.time);
        }
        if(b.status === "playing") {
            updateRivals(b.scores || {});
        }
    });
}

function startBattle(diff, time) {
    score = 0; combo = 0; timeLeft = time;
    isPlaying = true;
    showScreen("game");
    bgmBox.play("battle");
    playSfx("sound-start");
    
    document.getElementById("rival-lanes").classList.remove("hidden");
    nextWord(diff);
    
    // タイマー開始
    if(gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(() => {
        timeLeft--;
        document.getElementById("timer-display").innerText = `TIME: ${timeLeft}`;
        
        // 残り時間半分で「霧」
        if(timeLeft < time / 2) {
            document.getElementById("rival-lanes").classList.add("fog");
        } else {
            document.getElementById("rival-lanes").classList.remove("fog");
        }

        if(timeLeft <= 0) {
            endBattle();
        }
        // スコア同期
        set(ref(db, `parties/${currentPartyId}/battle/scores/${myCode}`), { name: myName, score: score });
    }, 1000);
}

function updateRivals(scores) {
    const container = document.getElementById("rival-lanes");
    container.innerHTML = "";
    Object.entries(scores).forEach(([uid, data]) => {
        if(uid === myCode) return;
        const div = document.createElement("div");
        div.className = "lane";
        div.innerHTML = `
            <div class="lane-name">${data.name}</div>
            <div class="lane-bar-bg"><div class="lane-bar-fill" style="width: ${Math.min(data.score/10, 100)}%"></div></div>
            <div style="font-size:0.7rem">${data.score}</div>
        `;
        container.appendChild(div);
    });
}

async function endBattle() {
    isPlaying = false;
    clearInterval(gameTimer);
    bgmBox.stopAll();
    showScreen("result");
    
    const snap = await get(ref(db, `parties/${currentPartyId}/battle/scores`));
    const allScores = Object.values(snap.val() || {}).sort((a,b) => b.score - a.score);
    
    const list = document.getElementById("ranking-list");
    list.innerHTML = "";
    allScores.slice(0,3).forEach((s, i) => {
        const d = document.createElement("div");
        d.className = `rank-item rank-${i+1}`;
        d.innerHTML = `<span>${i+1}位: ${s.name}</span> <span>${s.score} pts</span>`;
        list.appendChild(d);
    });

    if(isLeader) {
        setTimeout(() => {
            set(ref(db, `parties/${currentPartyId}/battle`), { status: "idle" });
        }, 5000);
    }
}

// --- タイピング判定ロジック ---
function nextWord(lv) {
    const pool = words.filter(w => w.lv === lv);
    const target = pool[Math.floor(Math.random()*pool.length)];
    tState.nodes = parseKana(target.kana);
    tState.cIdx = 0; tState.typed = ""; tState.textDone = "";
    tState.valid = [...tState.nodes[0].opts];
    document.getElementById("japanese-word").innerText = target.k;
    updateDisplay();
}

function updateDisplay() {
    document.getElementById("char-done").innerText = tState.textDone;
    let todo = "";
    for(let i=tState.cIdx; i<tState.nodes.length; i++) {
        let opt = tState.nodes[i].opts[0];
        todo += (i === tState.cIdx) ? opt.slice(tState.typed.length) : opt;
    }
    document.getElementById("char-todo").innerText = todo;
    document.getElementById("score-count").innerText = score;
}

window.onkeydown = (e) => {
    if(!isPlaying) return;
    const key = e.key.toLowerCase();
    if(key.length > 1) return;

    let nextTyped = tState.typed + key;
    let matches = tState.valid.filter(o => o.startsWith(nextTyped));

    if(matches.length > 0) {
        tState.typed = nextTyped;
        tState.valid = matches;
        tState.textDone += key;
        score += 10; combo++;
        playSfx("sound-type");
        if(tState.valid.includes(tState.typed)) {
            tState.cIdx++; tState.typed = "";
            if(tState.cIdx >= tState.nodes.length) {
                playSfx("sound-success");
                nextWord(document.getElementById("battle-diff-select")?.value || "easy");
            } else {
                tState.valid = [...tState.nodes[tState.cIdx].opts];
            }
        }
    } else {
        combo = 0; playSfx("sound-error");
    }
    updateDisplay();
};

// --- Firebase 基礎機能 (プロフィール・フレンド・切断検知) ---
const myRef = ref(db, `users/${myCode}`);
onValue(ref(db, ".info/connected"), (s) => {
    if(s.val()){
        update(myRef, { name: myName, status: "online" });
        onDisconnect(myRef).update({ status: "offline" });
    }
});

document.getElementById("update-name-btn").onclick = () => {
    const n = document.getElementById("name-input").value.trim();
    if(n){ myName = n; localStorage.setItem("T_NAME", n); update(myRef, {name: n}); }
};

document.getElementById("send-request-btn").onclick = async () => {
    const t = document.getElementById("target-code-input").value.trim();
    if(t.length === 8) {
        set(ref(db, `friends/${myCode}/${t}`), true);
        set(ref(db, `friends/${t}/${myCode}`), true);
        alert("追加完了");
    }
};

onValue(ref(db, `friends/${myCode}`), (s) => {
    const list = document.getElementById("friend-list");
    list.innerHTML = "";
    s.forEach(child => {
        onValue(ref(db, `users/${child.key}`), (fs) => {
            const fd = fs.val(); if(!fd) return;
            let li = document.createElement("li");
            li.className = "friend-item";
            li.innerHTML = `<strong>${fd.name}</strong> <button onclick="invite('${child.key}')">招待</button>`;
            list.appendChild(li);
        });
    });
});

// パーティー招待・参加・切断監視
window.invite = async (fid) => {
    if(!currentPartyId) {
        currentPartyId = myCode;
        await set(ref(db, `parties/${myCode}`), { leader: myCode, members: {[myCode]: myName} });
        update(myRef, { partyId: myCode });
    }
    set(ref(db, `invites/${fid}`), { from: myName, pid: currentPartyId });
};

onValue(ref(db, `invites/${myCode}`), (s) => {
    if(s.val()) {
        document.getElementById("inviter-name").innerText = s.val().from;
        document.getElementById("invite-notification").classList.remove("hidden");
        document.getElementById("accept-invite-btn").onclick = () => {
            update(ref(db, `parties/${s.val().pid}/members`), {[myCode]: myName});
            update(myRef, { partyId: s.val().pid });
            remove(ref(db, `invites/${myCode}`));
        };
    } else { document.getElementById("invite-notification").classList.add("hidden"); }
});

onValue(myRef, (s) => {
    const pid = s.val()?.partyId;
    if(pid) {
        currentPartyId = pid;
        listenBattle(pid);
        onValue(ref(db, `parties/${pid}`), (ps) => {
            const pd = ps.val();
            if(!pd) { showScreen("mode"); return; }
            const list = document.getElementById("party-member-list");
            list.innerHTML = "";
            Object.entries(pd.members).forEach(([id, name]) => {
                list.innerHTML += `<div>${id===pd.leader?'★':''}${name}</div>`;
            });
            isLeader = (pd.leader === myCode);
            document.getElementById("party-info").classList.remove("hidden");
            document.getElementById("no-party-msg").classList.add("hidden");
            document.getElementById("party-controls").innerHTML = isLeader ? `<button onclick="disband()">解散</button>` : `<button onclick="leave()">脱退</button>`;
            
            // 非リーダーが待機画面に飛ばされる処理
            if(!isLeader && isPlaying === false) showScreen("wait");
        });
    } else { 
        currentPartyId = null;
        document.getElementById("party-info").classList.add("hidden");
        document.getElementById("no-party-msg").classList.remove("hidden");
    }
});

// 切断・離脱検知
onValue(ref(db, `parties`), (snap) => {
    if(currentPartyId && isPlaying) {
        const p = snap.val()[currentPartyId];
        if(!p) return;
        // メンバーが減ったかチェック
        const toast = document.getElementById("battle-toast");
        // ここでは簡易的に「誰かがいなくなった」通知を出すロジック
    }
});

window.disband = () => remove(ref(db, `parties/${currentPartyId}`));
window.leave = () => { remove(ref(db, `parties/${currentPartyId}/members/${myCode}`)); update(myRef, {partyId: null}); showScreen("mode"); };

showScreen("mode");
