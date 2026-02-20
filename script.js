// =========================================
// ULTIMATE TYPING ONLINE - RAMO EDITION
// FIREBASE & TYPING ENGINE V7.0 (Multi-Skill & Advanced Effects Integrated)
// =========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, remove, onDisconnect, get, off } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

// --- ストーリーモード用グローバル変数 ---
let isStoryMode = false;
let currentStoryWorld = parseInt(localStorage.getItem("ramo_story_world")) || 1;
let currentStoryStage = parseInt(localStorage.getItem("ramo_story_stage")) || 1;
let cpuTypingSpeed = 1000; // ボスや面によって調整可能にする変数

// --- ネクロマンサー用変数 ---
let minionCount = 0;
let isSummoningMinions = false;
let summonTimer = null;

// --- スキルシステム用グローバル変数 ---
let ownedSkills = JSON.parse(localStorage.getItem("ramo_skills")) || ["none"];
let equippedSkill = localStorage.getItem("ramo_equipped") || "none";

// マルチクールダウン管理システム
let cooldowns = { space: 0, key1: 0, key2: 0, key3: 0 };
let maxCooldowns = { space: 0, key1: 0, key2: 0, key3: 0 };
let cooldownTimers = { space: null, key1: null, key2: null, key3: null };

let autoTypeTimer = null;
let jammingTimer = null;
let blurIntervalTimer = null;
let isJamming = false;
let comboMultiplier = 1;
let timeSlipUsed = false;
let isGodfatherMissionActive = false;
let hackerTabsActive = 0;
let attackListenerReference = null;

// スキルのデータ定義 (新スキル・ストーリー報酬追加)
const SKILL_DB = {
    punch: { id: "punch", name: "パンチ", cost: 15000, cooldown: 45, desc: "相手は3秒間タイピング不可" },
    autotype: { id: "autotype", name: "自動入力", cost: 50000, cooldown: 10, desc: "3秒間爆速で自動タイピング" },
    comboUp: { id: "comboUp", name: "コンボアップ", cost: 50000, cooldown: 35, desc: "5秒間コンボ増加量が2倍" },
    revolver: { id: "revolver", name: "リボルバー", cost: 100000, cooldown: 45, desc: "相手は6秒間タイピング不可＆500スコア奪う" },
    thief: { id: "thief", name: "泥棒", cost: 75000, cooldown: 25, desc: "相手から1200スコア奪う" },
    timeslip: { id: "timeslip", name: "タイムスリップ", cost: 250000, cooldown: 0, desc: "【1回使い切り】相手スコア半減＆3秒妨害。自分は6秒爆速自動入力" },
    
    // --- 新規追加スキル ---
    fundraiser: { id: "fundraiser", name: "資金稼ぎ", cost: 15000, cooldown: 0, desc: "【パッシブ】試合後にもらえるコインが常に2倍になる" },
    godfather: { id: "godfather", name: "ゴッドファザー", cost: 50000, cooldown: 25, desc: "【任務/Space】10秒間、タイピング成功時に(コンボ数×5)のコインを直接獲得" },
    hacker: { id: "hacker", name: "ハッカー", cost: 250000, cooldown: 0, desc: "【タブ追加/キー:1】CT30秒: 相手画面の中央付近に消去必須タブを10個出す\n【ウイルス/キー:2】CT70秒: ランダムな相手を5秒スタン＆800スコア奪う" },
    accelerator: { id: "accelerator", name: "アクセラレーター", cost: 500000, cooldown: 0, desc: "【熱い温度/キー:1】CT40秒: 相手の画面全体を10秒間ぼやけさせる\n【特別加熱/キー:2】CT70秒: 相手を3秒スタン＆500スコア減少\n【自爆/キー:3】CT200秒: 自スコア3000減＆相手のコンボを0にする" },

    // --- ストーリーモード報酬スキル ---
    fireworks: { id: "fireworks", name: "花火", cost: 0, cooldown: 30, desc: "【1-5クリア報酬 / パチパチ】\n相手画面に1秒だけ「避ける」ボタンがでかく出現する。1秒以内に避けられなかった場合、相手を8秒間スタンする。", isStoryReward: true },
    necromancer: { id: "necromancer", name: "ネクロマンサー", cost: 0, cooldown: 0, desc: "【2-5クリア報酬】\n【子分を出す/キー:1】CT20秒: 8秒間タイピングを打てた回数だけ子分が増える\n【子分アタック/キー:2】CT45秒: (子分の数÷5)秒分、相手をスタンする。その後子分の数はリセットされる。", isStoryReward: true }
};

// --- セーブデータ保存・表示更新用関数 ---
function saveAndDisplayData() {
    localStorage.setItem("ramo_coins", coins);
    localStorage.setItem("ramo_skills", JSON.stringify(ownedSkills));
    localStorage.setItem("ramo_equipped", equippedSkill);
    
    // ストーリー進行度の保存
    localStorage.setItem("ramo_story_world", currentStoryWorld);
    localStorage.setItem("ramo_story_stage", currentStoryStage);
    
    if (el("coin-amount")) el("coin-amount").innerText = coins;
    if (el("shop-coin-amount")) el("shop-coin-amount").innerText = coins;
    
    update(ref(db, `users/${myId}`), { 
        coins: coins,
        skills: ownedSkills,
        equipped: equippedSkill
    });
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
    const btnShop = el("btn-shop");
    const btnStory = el("btn-story"); // 新規追加: ストーリーモードボタン

    if (btnSingle) btnSingle.disabled = isBusy;
    if (btnParty) btnParty.disabled = isMatchmaking; 
    if (btnMatch) btnMatch.disabled = isBusy;
    if (btnEditor) btnEditor.disabled = isBusy;
    if (btnCustom) btnCustom.disabled = isBusy;
    if (btnShop) btnShop.disabled = isBusy;
    if (btnStory) btnStory.disabled = isBusy; // パーティー中は入れない仕様
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
        if(!s.exists()) return;
        const pId = s.val().partyId;
        update(ref(db, `parties/${pId}/members/${myId}`), { name: myName, score: 0, ready: false });
        update(ref(db, `users/${myId}`), { partyId: pId });
        remove(ref(db, `users/${myId}/invite`));
    });
};
window.declineInvite = () => remove(ref(db, `users/${myId}/invite`));

window.leaveParty = () => {
    if (!myPartyId) return;
    if (myPartyId.startsWith("match_")) {
        remove(ref(db, `parties/${myPartyId}/members/${myId}`));
        if (isLeader) remove(ref(db, `parties/${myPartyId}`));
    } else {
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

// --- ショップシステム ---
window.openShop = () => {
    openScreen("screen-shop");
    renderShop();
};

window.buySkill = (skillId) => {
    const skill = SKILL_DB[skillId];
    if (coins >= skill.cost) {
        coins -= skill.cost;
        ownedSkills.push(skillId);
        equippedSkill = skillId; 
        saveAndDisplayData();
        renderShop();
        sounds.notify.play();
        alert(`${skill.name} を購入・装備しました！`);
    } else {
        alert("コインが足りません！");
    }
};

window.equipSkill = (skillId) => {
    equippedSkill = skillId;
    saveAndDisplayData();
    renderShop();
};

function renderShop() {
    const shopList = el("shop-list");
    shopList.innerHTML = "";
    Object.values(SKILL_DB).forEach(skill => {
        const isOwned = ownedSkills.includes(skill.id);
        const isEquipped = equippedSkill === skill.id;
        
        let buttonHtml = "";
        
        if (skill.isStoryReward && !isOwned) {
            // ストーリーモードの報酬で未所持の場合は購入不可にする
            buttonHtml = `<button class="shop-btn" disabled>ストーリー報酬で獲得</button>`;
        } else if (isEquipped) {
            buttonHtml = `<button class="shop-btn equipped" disabled>装備中</button>`;
        } else if (isOwned) {
            buttonHtml = `<button class="shop-btn" onclick="window.equipSkill('${skill.id}')">装備する</button>`;
        } else {
            const canAfford = coins >= skill.cost;
            buttonHtml = `<button class="shop-btn" onclick="window.buySkill('${skill.id}')" ${canAfford ? '' : 'disabled'}>購入 (${skill.cost}🪙)</button>`;
        }

        shopList.innerHTML += `
            <div class="shop-item">
                <h3>${skill.name}</h3>
                <p style="white-space: pre-wrap;">${skill.desc}</p>
                <span class="cooldown-text">クールダウン: ${skill.cooldown > 0 ? skill.cooldown + '秒' : '個別/1回のみ'}</span>
                ${buttonHtml}
            </div>
        `;
    });
}

// --- ゲームエンジン ---
function openScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    const target = el(id);
    if(target) target.classList.remove("hidden");
}

window.goHome = () => { 
    gameActive = false; 
    isStoryMode = false;
    clearInterval(gameInterval);
    resetSkillState();

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

// タイピング成功処理
function processCorrectType() {
    romaIdx++;
    score += (10 + combo) * comboMultiplier; 
    combo += 1 * comboMultiplier; 
    
    // 【新スキル】ゴッドファザー任務処理
    if (isGodfatherMissionActive) {
        coins += (combo > 0 ? combo * 5 : 5);
        el("coin-amount").innerText = coins; // UI即時反映
    }

    // 【新スキル】ネクロマンサーの子分増加処理
    if (isSummoningMinions) {
        minionCount++;
        if (el("minion-count-ui")) {
            el("minion-count-ui").innerText = `子分: ${minionCount}体`;
        }
    }
    
    sounds.type.currentTime = 0; sounds.type.play();
    
    if (romaIdx >= currentRoma.length) { 
        sounds.correct.play(); 
        currentWordIdx++; 
        nextQuestion(); 
    }
    
    el("stat-score").innerText = score; 
    el("stat-combo").innerText = combo;
    renderRoma();
    if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
}

window.addEventListener("keydown", e => {
    if (!gameActive) return;
    
    // 【新スキル】ハッカーのタブが出ている間はタイピング等完全不可
    if (hackerTabsActive > 0) return;

    // スキル発動キー判定
    if (e.code === "Space") { e.preventDefault(); window.activateSkill("space"); return; }
    if (e.code === "Digit1") { e.preventDefault(); window.activateSkill("key1"); return; }
    if (e.code === "Digit2") { e.preventDefault(); window.activateSkill("key2"); return; }
    if (e.code === "Digit3") { e.preventDefault(); window.activateSkill("key3"); return; }
    
    if (isJamming) return;

    if (e.key === currentRoma[romaIdx]) {
        processCorrectType();
    } else if (!["Shift","Alt","Control","Space","1","2","3"].includes(e.key)) {
        combo = 0; 
        sounds.miss.currentTime = 0; sounds.miss.play();
        el("stat-combo").innerText = combo;
    }
});

function startGame(sec) {
    clearInterval(gameInterval);
    gameActive = true; 
    score = 0; 
    combo = 0; 
    timer = sec; 
    duration = sec; 
    currentWordIdx = 0;
    
    resetSkillState();
    setupSkillUI();

    if (!myPartyId && !isStoryMode) {
        el("rival-display").classList.add("hidden");
    } else if (myPartyId) {
        attackListenerReference = ref(db, `parties/${myPartyId}/members/${myId}/attacks`);
        onValue(attackListenerReference, snap => {
            const attacks = snap.val();
            if (attacks) {
                Object.keys(attacks).forEach(key => {
                    handleIncomingAttack(attacks[key]);
                    remove(ref(db, `parties/${myPartyId}/members/${myId}/attacks/${key}`));
                });
            }
        });
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
    resetSkillState();

    if (attackListenerReference) {
        off(attackListenerReference);
        attackListenerReference = null;
    }

    sounds.finish.play();
    openScreen("screen-result");

    let earnedCoins = Math.floor(score / 10);
    let isWinner = false;

    if (isCustomGame) {
        earnedCoins = 0;
    }

    // 【新スキル】資金稼ぎパッシブ適用
    if (equippedSkill === "fundraiser") {
        earnedCoins *= 2;
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
                    saveAndDisplayData();
                }

                el("ranking-box").innerHTML = res.map((item, i) => {
                    const m = item[1];
                    return `<div class="ranking-row"><span>${i+1}位: ${m.name}</span><span>${m.score} pts</span></div>`;
                }).join("");
                
                let coinText = isCustomGame ? "カスタムモードは獲得不可" : (isWinner ? `勝利ボーナス！ +${earnedCoins} 🪙` : `獲得コイン +${earnedCoins} 🪙`);
                if (equippedSkill === "fundraiser" && !isCustomGame) coinText += " (資金稼ぎ2倍適用!)";
                el("ranking-box").innerHTML += `
                    <div class="ranking-row" style="color: #FFD700; margin-top: 15px; border-top: 2px dashed #FFD700; padding-top: 15px;">
                        <span>結果</span><span>${coinText}</span>
                    </div>`;

                if (isLeader && !myPartyId.startsWith("match_")) {
                    update(ref(db, `parties/${myPartyId}`), { state: "lobby" });
                }
            }
        });
    } else { 
        if (earnedCoins > 0) {
            coins += earnedCoins;
            saveAndDisplayData();
        }
        el("ranking-box").innerHTML = `<div class="ranking-row"><span>スコア</span><span>${score} pts</span></div>`; 
        let coinText = isCustomGame ? "カスタムモードは獲得不可" : `獲得コイン +${earnedCoins} 🪙`;
        if (equippedSkill === "fundraiser" && !isCustomGame) coinText += " (資金稼ぎ2倍適用!)";
        el("ranking-box").innerHTML += `
            <div class="ranking-row" style="color: #FFD700; margin-top: 15px; border-top: 2px dashed #FFD700; padding-top: 15px;">
                <span>結果</span><span>${coinText}</span>
            </div>`;
    }
}

// --- スキル・バトルエフェクト処理 ---
function setupSkillUI() {
    const actionBox = el("skill-action-box");
    const skillNameText = el("skill-btn-name");
    const statusText = el("skill-status-text");
    
    if (equippedSkill && equippedSkill !== "none") {
        actionBox.classList.remove("hidden");
        skillNameText.innerText = SKILL_DB[equippedSkill].name;
        
        if (equippedSkill === "fundraiser") {
            statusText.innerText = "【パッシブ】試合終了時にコイン2倍";
            el("in-game-skill-btn").classList.add("hidden");
        } else if (equippedSkill === "hacker" || equippedSkill === "accelerator" || equippedSkill === "necromancer") {
            el("in-game-skill-btn").classList.add("hidden");
            updateCooldownText();
        } else {
            el("in-game-skill-btn").classList.remove("hidden");
            statusText.innerText = "準備完了！(スペースキーで発動)";
        }
    } else {
        actionBox.classList.add("hidden");
    }
}

function updateCooldownText() {
    if (equippedSkill === "none" || equippedSkill === "fundraiser") return;
    const skill = SKILL_DB[equippedSkill];
    let txt = "";
    
    if (skill.id === "hacker") {
        let k1 = cooldowns.key1 > 0 ? `[1]冷却中(${cooldowns.key1}s)` : "[1]タブ追加OK";
        let k2 = cooldowns.key2 > 0 ? `[2]冷却中(${cooldowns.key2}s)` : "[2]ウイルスOK";
        txt = `${k1} | ${k2}`;
    } else if (skill.id === "accelerator") {
        let k1 = cooldowns.key1 > 0 ? `[1]冷却中(${cooldowns.key1}s)` : "[1]熱い温度OK";
        let k2 = cooldowns.key2 > 0 ? `[2]冷却中(${cooldowns.key2}s)` : "[2]特別加熱OK";
        let k3 = cooldowns.key3 > 0 ? `[3]冷却中(${cooldowns.key3}s)` : "[3]自爆OK";
        txt = `${k1} | ${k2} | ${k3}`;
    } else if (skill.id === "necromancer") {
        let k1 = cooldowns.key1 > 0 ? `[1]冷却中(${cooldowns.key1}s)` : "[1]子分を出すOK";
        let k2 = cooldowns.key2 > 0 ? `[2]冷却中(${cooldowns.key2}s)` : "[2]子分アタックOK";
        txt = `${k1} | ${k2} | 子分:${minionCount}体`;
    } else {
        txt = cooldowns.space > 0 ? `冷却中... (${cooldowns.space}s)` : "準備完了！(指定キーで発動)";
    }
    el("skill-status-text").innerText = txt;
}

function resetSkillState() {
    Object.values(cooldownTimers).forEach(t => clearInterval(t));
    clearInterval(autoTypeTimer);
    clearTimeout(jammingTimer);
    clearInterval(blurIntervalTimer);
    
    cooldownTimers = { space: null, key1: null, key2: null, key3: null };
    cooldowns = { space: 0, key1: 0, key2: 0, key3: 0 };
    
    isJamming = false;
    comboMultiplier = 1;
    timeSlipUsed = false;
    isGodfatherMissionActive = false;
    hackerTabsActive = 0;
    
    // ネクロマンサー・花火のリセット処理
    minionCount = 0;
    isSummoningMinions = false;
    clearTimeout(summonTimer);
    if (el("minion-count-ui")) el("minion-count-ui").innerText = "";
    const dodgeBtn = el("fireworks-dodge-btn-container");
    if (dodgeBtn) dodgeBtn.remove();
    
    const tabsContainer = document.getElementById("hacker-tabs-container");
    if (tabsContainer) tabsContainer.remove();
    
    const playScreen = el("screen-play");
    if (playScreen) {
        playScreen.style.filter = "none";
        playScreen.style.transition = "none";
    }
    
    el("jamming-overlay").classList.add("hidden");
    el("skill-cooldown-bar").style.height = "0%";
    el("in-game-skill-btn").classList.remove("cooldown", "hidden");
    el("skill-status-text").innerText = "準備完了！(指定キーで発動)";
}

function startSpecificCooldown(slot, seconds) {
    if (seconds <= 0) return;
    cooldowns[slot] = seconds;
    maxCooldowns[slot] = seconds;
    
    if (cooldownTimers[slot]) clearInterval(cooldownTimers[slot]);
    
    if (slot === "space" && equippedSkill !== "hacker" && equippedSkill !== "accelerator" && equippedSkill !== "necromancer") {
        el("in-game-skill-btn").classList.add("cooldown");
        el("skill-cooldown-bar").style.height = "100%";
    }
    
    updateCooldownText();
    
    cooldownTimers[slot] = setInterval(() => {
        cooldowns[slot]--;
        if (cooldowns[slot] <= 0) {
            clearInterval(cooldownTimers[slot]);
            if (slot === "space" && equippedSkill !== "hacker" && equippedSkill !== "accelerator" && equippedSkill !== "necromancer") {
                el("in-game-skill-btn").classList.remove("cooldown");
                el("skill-cooldown-bar").style.height = "0%";
            }
        } else {
            if (slot === "space" && equippedSkill !== "hacker" && equippedSkill !== "accelerator" && equippedSkill !== "necromancer") {
                const pct = (cooldowns[slot] / maxCooldowns[slot]) * 100;
                el("skill-cooldown-bar").style.height = `${pct}%`;
            }
        }
        updateCooldownText();
    }, 1000);
}

function showBattleAlert(text, color) {
    const alertEl = el("battle-alert");
    alertEl.innerText = text;
    alertEl.style.color = color;
    alertEl.style.textShadow = `0 0 20px ${color}`;
    alertEl.classList.remove("hidden");
    
    alertEl.style.animation = 'none';
    alertEl.offsetHeight; 
    alertEl.style.animation = null; 
    
    setTimeout(() => alertEl.classList.add("hidden"), 2000);
}

// ターゲット指定なし全体攻撃
function sendAttackToOthers(type, duration, stealAmount) {
    if (!myPartyId) return;
    get(ref(db, `parties/${myPartyId}/members`)).then(s => {
        const members = s.val();
        if (members) {
            Object.keys(members).forEach(targetId => {
                if (targetId !== myId) {
                    const attackId = generateId();
                    update(ref(db, `parties/${myPartyId}/members/${targetId}/attacks/${attackId}`), {
                        type: type, duration: duration, stealAmount: stealAmount, timestamp: Date.now()
                    });
                }
            });
        }
    });
}

// ランダムなターゲット単体攻撃 (ウイルスのため)
function sendRandomTargetAttack(type, duration, stealAmount) {
    if (!myPartyId) return;
    get(ref(db, `parties/${myPartyId}/members`)).then(s => {
        const members = s.val();
        if (members) {
            const targets = Object.keys(members).filter(id => id !== myId);
            if (targets.length > 0) {
                const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                const attackId = generateId();
                update(ref(db, `parties/${myPartyId}/members/${randomTarget}/attacks/${attackId}`), {
                    type: type, duration: duration, stealAmount: stealAmount, timestamp: Date.now()
                });
                
                if (stealAmount > 0) {
                    score += stealAmount;
                    el("stat-score").innerText = score;
                    update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
                }
            }
        }
    });
}
// --- グローバル変数追加 (ストーリー用) ---
let storyStage = { world: 1, level: 1 };
let subunCount = 0;
let isSubunCollecting = false;
let dodgeBtnActive = false;

// ====== SKILL ACTIVATION SYSTEM ======
window.activateSkill = (keySlot = "space") => {
    if (!gameActive) return;
    if (!equippedSkill || equippedSkill === "none" || equippedSkill === "fundraiser") return;
    
    const skill = SKILL_DB[equippedSkill];

    // ====== SPACE KEY SKILLS (Main Skill) ======
    if (keySlot === "space") {
        if (cooldowns.space > 0) return;
        
        if (skill.id === "punch") {
            sendAttackToOthers("jam", 3000, 0);
            showBattleAlert("👊 パンチ発動！", "var(--accent-red)");
        } 
        else if (skill.id === "autotype") {
            startAutoTypeEngine(3000, 70); 
            showBattleAlert("⚡ 自動入力発動！", "var(--accent-blue)");
        } 
        else if (skill.id === "comboUp") {
            comboMultiplier = 2;
            setTimeout(() => { comboMultiplier = 1; }, 5000);
            showBattleAlert("🔥 コンボ倍増発動！", "var(--accent-purple)");
        } 
        else if (skill.id === "revolver") {
            sendAttackToOthers("jam", 6000, 500); 
            score += 500; 
            showBattleAlert("🔫 リボルバー発動！", "var(--accent-red)");
        } 
        else if (skill.id === "thief") {
            sendAttackToOthers("steal", 0, 1200);
            score += 1200;
            showBattleAlert("💰 泥棒発動！", "var(--accent-green)");
        } 
        else if (skill.id === "timeslip") {
            if (timeSlipUsed) return;
            sendAttackToOthers("timeslip", 3000, 0);
            startAutoTypeEngine(6000, 60); 
            comboMultiplier = 1;
            setTimeout(() => { comboMultiplier = 1; }, 5000);
            timeSlipUsed = true;
            el("in-game-skill-btn").classList.add("cooldown");
            el("skill-status-text").innerText = "使用済み (対戦中1回のみ)";
            showBattleAlert("⏳ タイムスリップ！", "#FFD700");
            return;
        }
        else if (skill.id === "godfather") {
            isGodfatherMissionActive = true;
            setTimeout(() => { isGodfatherMissionActive = false; }, 10000);
            showBattleAlert("🕴 任務開始！(10秒間)", "#ffd700");
        }
        // --- ストーリー報酬スキル: 花火 ---
        else if (skill.id === "fireworks") {
            sendAttackToOthers("fireworks_dodge", 0, 0);
            showBattleAlert("🎆 花火発動！パチパチ！", "#ff69b4");
        }

        if (skill.cooldown > 0) startSpecificCooldown("space", skill.cooldown);
    }

    // ====== KEY 1 SKILLS (Sub Skill 1) ======
    if (keySlot === "key1") {
        if (cooldowns.key1 > 0) return;
        
        if (skill.id === "hacker") {
            sendAttackToOthers("hacker_tabs", 0, 0);
            showBattleAlert("💻 タブ追加攻撃！", "var(--accent-green)");
            startSpecificCooldown("key1", 30);
        }
        else if (skill.id === "accelerator") {
            sendAttackToOthers("blur", 0, 0);
            showBattleAlert("🔥 熱い温度発動！", "var(--accent-red)");
            startSpecificCooldown("key1", 40);
        }
        // --- ストーリー報酬スキル: ネクロマンサー(子分出し) ---
        else if (skill.id === "necromancer") {
            isSubunCollecting = true;
            subunCount = 0;
            updateSubunDisplay();
            showBattleAlert("💀 子分召喚開始！(8秒間)", "#8b008b");
            setTimeout(() => {
                isSubunCollecting = false;
                showBattleAlert(`✅ 子分が ${subunCount} 人集まった！`, "#8b008b");
            }, 8000);
            startSpecificCooldown("key1", 20);
        }
    }

    // ====== KEY 2 SKILLS (Sub Skill 2) ======
    if (keySlot === "key2") {
        if (cooldowns.key2 > 0) return;
        
        if (skill.id === "hacker") {
            sendRandomTargetAttack("jam", 5000, 800);
            showBattleAlert("🦠 ウイルスアタック！", "var(--accent-green)");
            startSpecificCooldown("key2", 70);
        }
        else if (skill.id === "accelerator") {
            sendAttackToOthers("special_heat", 0, 0);
            showBattleAlert("☄️ 特別加熱！", "var(--accent-red)");
            startSpecificCooldown("key2", 70);
        }
        // --- ストーリー報酬スキル: ネクロマンサー(子分アタック) ---
        else if (skill.id === "necromancer") {
            if (subunCount <= 0) return alert("子分がいません！");
            const stunSec = Math.floor(subunCount / 5);
            sendAttackToOthers("jam", stunSec * 1000, 0);
            showBattleAlert(`💀 子分アタック！ ${stunSec}秒スタン！`, "#8b008b");
            subunCount = 0;
            updateSubunDisplay();
            startSpecificCooldown("key2", 45);
        }
    }

    // ====== KEY 3 SKILLS (Sub Skill 3) ======
    if (keySlot === "key3") {
        if (cooldowns.key3 > 0) return;
        
        if (skill.id === "accelerator") {
            score = Math.max(0, score - 3000);
            sendAttackToOthers("reset_combo", 0, 0);
            showBattleAlert("💥 自爆！", "var(--accent-red)");
            startSpecificCooldown("key3", 200);
        }
    }

    el("stat-score").innerText = score;
    if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
};

// 子分表示更新
function updateSubunDisplay() {
    const display = el("subun-count-display");
    if (display) display.innerText = `子分: ${subunCount}人`;
}

function startAutoTypeEngine(durationMs, intervalMs) {
    clearInterval(autoTypeTimer);
    autoTypeTimer = setInterval(() => {
        if (!gameActive || isJamming || hackerTabsActive > 0) return;
        processCorrectType();
    }, intervalMs);
    
    setTimeout(() => {
        clearInterval(autoTypeTimer);
    }, durationMs);
}

// ハッカーのタブ生成処理
function createHackerTabs() {
    if (hackerTabsActive > 0) return; 
    hackerTabsActive = 10;
    
    const container = document.createElement('div');
    container.id = 'hacker-tabs-container';
    container.style.position = 'fixed';
    container.style.top = '0'; container.style.left = '0';
    container.style.width = '100vw'; container.style.height = '100vh';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    window.removeHackerTab = () => {
        hackerTabsActive--;
        if (hackerTabsActive <= 0) {
            const c = document.getElementById('hacker-tabs-container');
            if(c) c.remove();
        }
    };

    for(let i = 0; i < 10; i++) {
        const tab = document.createElement('div');
        tab.style.position = 'absolute';
        tab.style.pointerEvents = 'auto';
        tab.style.width = '240px'; 
        tab.style.height = '130px';
        tab.style.backgroundColor = '#111';
        tab.style.border = '2px solid #0f0';
        tab.style.borderRadius = '5px';
        tab.style.boxShadow = '0 0 15px #000';
        tab.style.display = 'flex';
        tab.style.flexDirection = 'column';
        tab.style.top = (Math.random() * 45 + 40) + '%'; 
        tab.style.left = (Math.random() * 70 + 5) + '%';
        
        tab.innerHTML = `
            <div style="background:#0f0; padding:3px 8px; text-align:right;">
                <button onclick="this.parentElement.parentElement.remove(); window.removeHackerTab()" style="background:#fff; color:#000; border:none; padding:4px 10px; cursor:pointer; font-weight:bold; font-size:14px;">X 削除</button>
            </div>
            <div style="flex:1; display:flex; align-items:center; justify-content:center; color:#0f0; font-family:monospace; text-align:center; padding:10px;">
                FATAL ERROR<br>システム汚染<br>消去してください
            </div>
        `;
        container.appendChild(tab);
    }
}

// アクセラレーターのぼかし処理
function applyBlurEffect() {
    const playScreen = el("screen-play");
    playScreen.style.transition = "none";
    playScreen.style.filter = "blur(20px)";
    
    let blurAmount = 20;
    clearInterval(blurIntervalTimer);
    
    blurIntervalTimer = setInterval(() => {
        blurAmount -= 2; 
        if (blurAmount <= 0) {
            blurAmount = 0;
            clearInterval(blurIntervalTimer);
            playScreen.style.filter = "none";
        } else {
            playScreen.style.filter = `blur(${blurAmount}px)`;
        }
    }, 1000);
}

// 攻撃受信ハンドル
function handleIncomingAttack(attack) {
    if (!gameActive) return;

    if (attack.stealAmount > 0) {
        score = Math.max(0, score - attack.stealAmount);
        el("stat-score").innerText = score;
        if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
    }

    if (attack.type === "timeslip") {
        score = Math.floor(score / 2);
        el("stat-score").innerText = score;
        if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
        applyJamming(3000);
        return;
    }
    
    if (attack.type === "hacker_tabs") {
        createHackerTabs();
        sounds.miss.play();
        return;
    }
    
    if (attack.type === "blur") {
        applyBlurEffect();
        sounds.miss.play();
        return;
    }
    
    if (attack.type === "special_heat") {
        score = Math.max(0, score - 500);
        el("stat-score").innerText = score;
        if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
        applyJamming(3000);
        return;
    }
    
    if (attack.type === "reset_combo") {
        combo = 0;
        el("stat-combo").innerText = combo;
        showBattleAlert("⚠️ コンボリセット！", "var(--accent-red)");
        sounds.miss.play();
        return;
    }

    // 花火回避処理
    if (attack.type === "fireworks_dodge") {
        showDodgeButton();
        return;
    }

    if (attack.duration > 0) {
        applyJamming(attack.duration);
    }
}

// 花火の「避ける」ボタン表示
function showDodgeButton() {
    if (dodgeBtnActive) return;
    dodgeBtnActive = true;
    const btn = document.createElement("button");
    btn.id = "dodge-fireworks-btn";
    btn.innerText = "避ける！";
    btn.style.position = "fixed";
    btn.style.top = "50%"; btn.style.left = "50%";
    btn.style.transform = "translate(-50%, -50%)";
    btn.style.padding = "40px 80px";
    btn.style.fontSize = "40px";
    btn.style.zIndex = "10000";
    btn.style.background = "red";
    btn.style.color = "white";
    btn.onclick = () => {
        btn.remove();
        dodgeBtnActive = false;
        showBattleAlert("👍 回避成功！", "var(--accent-blue)");
    };
    document.body.appendChild(btn);

    setTimeout(() => {
        if (document.getElementById("dodge-fireworks-btn")) {
            btn.remove();
            dodgeBtnActive = false;
            showBattleAlert("💥 回避失敗！8秒スタン", "var(--accent-red)");
            applyJamming(8000);
        }
    }, 1000);
}

function applyJamming(durationMs) {
    isJamming = true;
    el("jamming-overlay").classList.remove("hidden");
    sounds.miss.play(); 
    
    clearTimeout(jammingTimer);
    jammingTimer = setTimeout(() => {
        isJamming = false;
        el("jamming-overlay").classList.add("hidden");
    }, durationMs);
}

// --- モード制御 ---
window.openSingleSelect = () => {
    if (myPartyId || isMatchmaking) return; 
    openScreen("screen-single-select");
};

// ストーリーモード画面を開く
window.openStoryMode = () => {
    if (myPartyId || isMatchmaking) return alert("パーティー中はストーリーを遊べません");
    openScreen("screen-story-select");
    renderStoryMap();
};

function renderStoryMap() {
    const container = el("story-map-container");
    container.innerHTML = "";
    
    // ワールド1・2の生成
    for (let w = 1; w <= 2; w++) {
        const wDiv = document.createElement("div");
        wDiv.className = "world-section";
        wDiv.innerHTML = `<h3>ワールド ${w}</h3>`;
        
        for (let l = 1; l <= 5; l++) {
            const btn = document.createElement("button");
            const isUnlocked = (w < storyStage.world) || (w === storyStage.world && l <= storyStage.level);
            btn.className = isUnlocked ? "btn-story-level" : "btn-story-level locked";
            btn.innerText = `${w}-${l}${l === 5 ? " (BOSS)" : ""}`;
            btn.disabled = !isUnlocked;
            btn.onclick = () => startStoryLevel(w, l);
            wDiv.appendChild(btn);
        }
        container.appendChild(wDiv);
    }
}

window.startStoryLevel = (w, l) => {
    isStoryMode = true;
    currentStoryWorld = w;
    currentStoryLevel = l;
    
    // CPUの強さ設定
    let cpuSpeed = 1000; // 初期
    if (w === 1) cpuSpeed = 1500 - (l * 200);
    if (w === 2) cpuSpeed = 800 - (l * 100);
    
    // 単発設定
    currentWords = WORD_DB[w === 1 ? "easy" : "normal"];
    isCustomGame = false;
    openScreen("screen-play");
    startGame(60);
    
    // CPU起動（ダミー対戦相手としてスコアを伸ばすロジック等）
    startCPULogic(cpuSpeed, w, l);
};

// CPUロジック (簡易版)
function startCPULogic(speed, w, l) {
    let cpuScore = 0;
    const cpuTimer = setInterval(() => {
        if (!gameActive) {
            clearInterval(cpuTimer);
            return;
        }
        cpuScore += 100;
        
        // ボス攻撃
        if (l === 5) {
            if (w === 1 && Math.random() < 0.1) {
                 // パンチ
                 applyJamming(3000);
                 showBattleAlert("👹 ボスのパンチ！", "red");
            }
            if (w === 2 && Math.random() < 0.1) {
                 // リボルバー
                 applyJamming(6000);
                 score = Math.max(0, score - 500);
                 showBattleAlert("👹 ボスのリボルバー！", "red");
            }
        }
    }, speed);
}

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
    if(snap.exists()) {
        let data = snap.val();
        if(data.coins !== undefined && data.coins > coins) {
            coins = data.coins; 
        }
        if(data.skills !== undefined) {
            ownedSkills = data.skills;
        }
        if(data.equipped !== undefined) {
            equippedSkill = data.equipped;
        }
        // ストーリー進捗ロード
        if(data.storyStage) {
            storyStage = data.storyStage;
        }
    }
    saveAndDisplayData(); 
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
