// =========================================
// ULTIMATE TYPING ONLINE - RAMO EDITION
// FIREBASE & TYPING ENGINE V8.0 (Story Mode & Milestone Skills)
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
    notify: new Audio("https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3"),
    boss: new Audio("https://assets.mixkit.co/active_storage/sfx/2528/2528-preview.mp3") // ボス戦用追加
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

// --- ストーリーモード用変数 ---
let isStoryMode = false;
let storyProgress = localStorage.getItem("ramo_story_progress") || "1-1"; // 到達している最新ステージ
let currentStoryStage = "1-1"; // 現在挑戦中のステージ
let storyTargetScore = 0;
let storyBaseTime = 60;

// --- スキルシステム用グローバル変数 ---
let ownedSkills = JSON.parse(localStorage.getItem("ramo_skills")) || ["none"];
let equippedSkill = localStorage.getItem("ramo_equipped") || "none";

// マルチクールダウン管理
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

// 特殊妨害フラグ
let isPoisoned = false; // 毒状態（テキストが見えづらい）
let isStunned = false; // スタン状態
let isSkillSealed = false; // スキル使用不可
let advancedHackUsed = false; // 1回切りスキル用フラグ
let isMazeActive = false; // 迷路中

// --- スキルのデータ定義 ---
const SKILL_DB = {
    none: { id: "none", name: "なし", cost: 0, cooldown: 0, desc: "スキルを装備しません" },
    punch: { id: "punch", name: "パンチ", cost: 15000, cooldown: 45, desc: "相手は3秒間タイピング不可" },
    autotype: { id: "autotype", name: "自動入力", cost: 50000, cooldown: 10, desc: "3秒間爆速で自動タイピング" },
    comboUp: { id: "comboUp", name: "コンボアップ", cost: 50000, cooldown: 35, desc: "5秒間コンボ増加量が2倍" },
    revolver: { id: "revolver", name: "リボルバー", cost: 100000, cooldown: 45, desc: "相手は6秒間タイピング不可＆500スコア奪う" },
    thief: { id: "thief", name: "泥棒", cost: 75000, cooldown: 25, desc: "相手から1200スコア奪う" },
    timeslip: { id: "timeslip", name: "タイムスリップ", cost: 250000, cooldown: 0, desc: "【1回使い切り】相手スコア半減＆3秒妨害。自分は6秒爆速自動入力" },
    fundraiser: { id: "fundraiser", name: "資金稼ぎ", cost: 15000, cooldown: 0, desc: "【パッシブ】試合後にもらえるコインが常に2倍になる" },
    godfundraiser: { id: "godfundraiser", name: "神資金稼ぎ", cost: 100000, cooldown: 0, desc: "【パッシブ】試合後にもらえるコインが常に4倍になる" },
    godfather: { id: "godfather", name: "ゴッドファザー", cost: 50000, cooldown: 25, desc: "【任務/Space】10秒間、タイピング成功時に(コンボ数×3)のコインを獲得" },
    hacker: { id: "hacker", name: "ハッカー", cost: 250000, cooldown: 0, desc: "【タブ/1】CT30: 相手に消去必須タブ10個\n【ウイルス/2】CT70: 5秒スタン＆800奪う" },
    accelerator: { id: "accelerator", name: "アクセラレーター", cost: 500000, cooldown: 0, desc: "【熱い温度/1】CT40: 20秒画面をぼかす\n【特別加熱/2】CT70: 3秒スタン＆500減\n【自爆/3】CT200: 自スコア3000減＆相手コンボ0" },
    
    // --- ストーリー報酬スキル ---
    firework: { 
        id: "firework", 
        name: "花火", 
        cost: 0, 
        cooldown: 40, 
        desc: "【パチパチ/Space】相手に1秒間「避ける」ボタンを表示。失敗で8秒間スタンさせる" 
    },
    hacker4: { 
        id: "hacker4", 
        name: "ハッカーマイルストーン4", 
        cost: 0, 
        cooldown: 0, 
        desc: "【迷路/1】CT45: 10x10迷路クリアまで停止\n【高度ハック/2】1回: 3秒妨害+15秒スキル封印\n【状態変異/3】CT35: 3秒スタン+10秒毒(不可視化)" 
    }
};

// --- ストーリー設定データ ---
function getStoryData(stage) {
    const [world, level] = stage.split("-").map(Number);
    let target = 0;
    let reward = 0;
    let isBoss = (level === 7);

    if (world === 1) {
        if (level === 7) target = 25000;
        else target = 8000 + (level - 1) * 1000;
        reward = level * 100;
    } else if (world === 2) {
        if (level === 7) target = 45000;
        else target = 26000 + (level - 1) * 1000;
        reward = (level + 7) * 100; // 2面は800円〜
    }
    
    return { target, reward, isBoss, world, level };
}

// --- セーブデータ保存・表示更新 ---
function saveAndDisplayData() {
    localStorage.setItem("ramo_coins", coins);
    localStorage.setItem("ramo_skills", JSON.stringify(ownedSkills));
    localStorage.setItem("ramo_equipped", equippedSkill);
    localStorage.setItem("ramo_story_progress", storyProgress);
    
    if (el("coin-amount")) el("coin-amount").innerText = coins;
    if (el("shop-coin-amount")) el("shop-coin-amount").innerText = coins;
    
    update(ref(db, `users/${myId}`), { 
        coins: coins,
        skills: ownedSkills,
        equipped: equippedSkill,
        name: myName,
        storyProgress: storyProgress,
        status: "online"
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
    const btnStory = el("btn-story-mode");

    if (btnSingle) btnSingle.disabled = isBusy;
    if (btnParty) btnParty.disabled = isMatchmaking; 
    if (btnMatch) btnMatch.disabled = isBusy;
    if (btnStory) btnStory.disabled = isMatchmaking;
}

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

// --- パーティー機能 & ストーリー進捗チェック ---
window.inviteToParty = (fid) => {
    if (!myPartyId) {
        myPartyId = myId;
        set(ref(db, `parties/${myPartyId}`), { leader: myId, state: "lobby", members: { [myId]: { name: myName, score: 0, ready: false, progress: storyProgress } } });
        update(ref(db, `users/${myId}`), { partyId: myPartyId });
    }
    set(ref(db, `users/${fid}/invite`), { from: myName, partyId: myPartyId });
};

// ストーリー開始可能かチェックする関数
window.checkPartyStoryProgress = async (stage) => {
    if (!myPartyId) return true;
    const snap = await get(ref(db, `parties/${myPartyId}/members`));
    const members = snap.val();
    if (!members) return false;

    const [reqW, reqL] = stage.split("-").map(Number);
    for (const mid in members) {
        const prog = members[mid].progress || "1-1";
        const [pW, pL] = prog.split("-").map(Number);
        if (pW < reqW || (pW === reqW && pL < reqL)) {
            alert(`${members[mid].name} さんがまだこのステージに到達していません。`);
            return false;
        }
    }
    return true;
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
                myPartyId = null; isLeader = false;
                updateButtonStates(); return; 
            }
            isLeader = (p.leader === myId);
            el("party-label").innerText = isLeader ? "パーティー (リーダー)" : "パーティー (メンバー)";
            el("party-list-ui").innerHTML = Object.values(p.members).map(m => `<div class="friend-item">${m.name} ${m.ready?'✅':''}</div>`).join("");
            
            // ストーリーモード同期
            if (p.state === "story_wait" && !gameActive) {
                currentStoryStage = p.storyStage;
                isStoryMode = true;
                openScreen("screen-play");
                el("ready-overlay").classList.remove("hidden");
                el("ready-list").innerHTML = Object.values(p.members).map(m => `<div>${m.name}: ${m.ready?'準備完了':'待機中...'}</div>`).join("");
                if (isLeader && Object.values(p.members).every(m => m.ready)) {
                    update(ref(db, `parties/${myPartyId}`), { state: "story_playing" });
                }
            }

            if (p.state === "story_playing" && !gameActive) {
                el("ready-overlay").classList.add("hidden");
                startStoryGame(p.storyStage);
            }

            // 通常対戦同期
            if (p.state === "ready_check" && !gameActive) {
                openScreen("screen-play"); 
                el("ready-overlay").classList.remove("hidden");
                if (isLeader && Object.values(p.members).every(m => m.ready)) {
                    update(ref(db, `parties/${myPartyId}`), { state: "playing" });
                }
            }
            if (p.state === "playing" && !gameActive) {
                el("ready-overlay").classList.add("hidden");
                isStoryMode = false;
                currentWords = WORD_DB[p.diff]; 
                startGame(p.time);
            }
            if (p.state === "lobby" && gameActive) endGame();
        });
    } else { 
        el("party-actions").classList.add("hidden"); 
        el("party-label").innerText = "パーティー (未参加)"; 
    }
});
// ==========================================
// ストーリーモード・新スキル・パーティー制御ロジック
// ==========================================

// --- 定数・ステージデータ定義 ---
// 1-1=101, 1-7=107, 2-1=201...
const STORY_STAGES = {
    // 1面 (1-1 ~ 1-7)
    101: { target: 8000, reward: 100, boss: false },
    102: { target: 9000, reward: 200, boss: false },
    103: { target: 10000, reward: 300, boss: false },
    104: { target: 11000, reward: 400, boss: false },
    105: { target: 12000, reward: 500, boss: false },
    106: { target: 13000, reward: 600, boss: false },
    107: { target: 25000, reward: 700, boss: true, unlockSkill: "fireworks" },
    // 2面 (2-1 ~ 2-7)
    201: { target: 26000, reward: 800, boss: false },
    202: { target: 27000, reward: 900, boss: false },
    203: { target: 28000, reward: 1000, boss: false },
    204: { target: 29000, reward: 1100, boss: false },
    205: { target: 30000, reward: 1200, boss: false },
    206: { target: 31000, reward: 1300, boss: false },
    207: { target: 45000, reward: 1400, boss: true, unlockSkill: "hacker_milestone_4" }
};

// --- スキル表示・クールダウン更新 ---
function updateCooldownText() {
    if (!equippedSkill || equippedSkill === "none" || equippedSkill === "fundraiser") return;
    const skill = SKILL_DB[equippedSkill];
    if (!skill) return;
    
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
    } else if (skill.id === "hacker_milestone_4") {
        let k1 = cooldowns.key1 > 0 ? `[1]迷路冷却中(${cooldowns.key1}s)` : "[1]迷路OK";
        let k2 = advancedHackUsed ? `[2]使用不可` : "[2]高度ハックOK";
        let k3 = cooldowns.key3 > 0 ? `[3]変異冷却中(${cooldowns.key3}s)` : "[3]状態変異OK";
        txt = `${k1} | ${k2} | ${k3}`;
    } else {
        txt = cooldowns.space > 0 ? `スキル冷却中... (${cooldowns.space}s)` : "準備完了！(スペースキーで発動)";
    }
    el("skill-status-text").innerText = txt;
}

// --- 状態リセット ---
function resetSkillState() {
    // タイマー類の全停止
    Object.values(cooldownTimers).forEach(t => { if(t) clearInterval(t); });
    if (autoTypeTimer) clearInterval(autoTypeTimer);
    if (jammingTimer) clearTimeout(jammingTimer);
    if (blurIntervalTimer) clearInterval(blurIntervalTimer);
    
    // 変数初期化
    cooldownTimers = { space: null, key1: null, key2: null, key3: null };
    cooldowns = { space: 0, key1: 0, key2: 0, key3: 0 };
    isJamming = false;
    isStunned = false;
    isPoisoned = false;
    comboMultiplier = 1;
    timeSlipUsed = false;
    advancedHackUsed = false;
    hackerTabsActive = 0;
    
    // 特殊UIの完全削除
    const elementsToRemove = ["hacker-tabs-container", "dodge-button-container", "maze-container", "hacked-overlay"];
    elementsToRemove.forEach(id => {
        const e = document.getElementById(id);
        if (e) e.remove();
    });
    
    // 画面エフェクト解除
    const playScreen = el("screen-play");
    if (playScreen) {
        playScreen.style.filter = "none";
        playScreen.style.background = "";
    }
    
    el("jamming-overlay").classList.add("hidden");
    el("skill-cooldown-bar").style.height = "0%";
    el("in-game-skill-btn").classList.remove("cooldown", "hidden");
    
    // ストーリーUI
    el("story-score-fill").style.width = "0%";
    updateCooldownText();
}

// --- クールダウン開始 ---
function startSpecificCooldown(slot, seconds) {
    if (seconds <= 0) return;
    cooldowns[slot] = seconds;
    maxCooldowns[slot] = seconds;
    
    if (cooldownTimers[slot]) clearInterval(cooldownTimers[slot]);
    
    // スペースキー単発スキルの場合のゲージ連動
    if (slot === "space" && !["hacker", "accelerator", "hacker_milestone_4"].includes(equippedSkill)) {
        el("in-game-skill-btn").classList.add("cooldown");
        el("skill-cooldown-bar").style.height = "100%";
    }
    
    updateCooldownText();
    
    cooldownTimers[slot] = setInterval(() => {
        cooldowns[slot]--;
        if (cooldowns[slot] <= 0) {
            clearInterval(cooldownTimers[slot]);
            if (slot === "space" && !["hacker", "accelerator", "hacker_milestone_4"].includes(equippedSkill)) {
                el("in-game-skill-btn").classList.remove("cooldown");
                el("skill-cooldown-bar").style.height = "0%";
            }
        } else {
            if (slot === "space" && !["hacker", "accelerator", "hacker_milestone_4"].includes(equippedSkill)) {
                const pct = (cooldowns[slot] / maxCooldowns[slot]) * 100;
                el("skill-cooldown-bar").style.height = `${pct}%`;
            }
        }
        updateCooldownText();
    }, 1000);
}

// --- 通信系（攻撃送信） ---
function sendAttackToOthers(type, duration = 0, stealAmount = 0) {
    if (!myPartyId) return;
    get(ref(db, `parties/${myPartyId}/members`)).then(s => {
        const members = s.val();
        if (members) {
            Object.keys(members).forEach(targetId => {
                if (targetId !== myId) {
                    const attackId = generateId();
                    update(ref(db, `parties/${myPartyId}/members/${targetId}/attacks/${attackId}`), {
                        type: type, 
                        duration: duration, 
                        stealAmount: stealAmount, 
                        timestamp: Date.now()
                    });
                }
            });
        }
    });
}

// ==========================================
// スキル発動メイン処理 ( activateSkill )
// ==========================================
window.activateSkill = (keySlot = "space") => {
    if (!gameActive || isJamming || isStunned) return;
    if (isStoryMode) return; // ストーリーモードはスキル禁止
    if (!equippedSkill || equippedSkill === "none") return;
    
    const skill = SKILL_DB[equippedSkill];

    // --- SPACE KEY スロット ---
    if (keySlot === "space") {
        if (cooldowns.space > 0) return;
        
        if (skill.id === "punch") {
            sendAttackToOthers("jam", 3000);
            showBattleAlert("👊 パンチ！", "var(--accent-red)");
        } else if (skill.id === "autotype") {
            startAutoTypeEngine(3000, 70);
            showBattleAlert("⚡ 自動入力！", "var(--accent-blue)");
        } else if (skill.id === "fireworks") {
            // パチパチ能力
            sendAttackToOthers("firework_snap");
            showBattleAlert("🎆 パチパチ！", "#ff4500");
        } else if (skill.id === "thief") {
            sendAttackToOthers("steal", 0, 1200);
            score += 1200;
            showBattleAlert("💰 スティール！", "var(--accent-green)");
        }
        // クールダウン開始
        if (skill.cooldown > 0) startSpecificCooldown("space", skill.cooldown);
    }

    // --- KEY 1 スロット (マルチスキル) ---
    if (keySlot === "key1") {
        if (cooldowns.key1 > 0) return;
        if (skill.id === "hacker_milestone_4") {
            sendAttackToOthers("maze_attack");
            showBattleAlert("🌀 迷路ハック！", "#00ff00");
            startSpecificCooldown("key1", 45);
        } else if (skill.id === "hacker") {
            sendAttackToOthers("hacker_tabs");
            startSpecificCooldown("key1", 30);
        }
    }

    // --- KEY 2 スロット ---
    if (keySlot === "key2") {
        if (cooldowns.key2 > 0) return;
        if (skill.id === "hacker_milestone_4") {
            if (advancedHackUsed) return;
            sendAttackToOthers("advanced_hack");
            showBattleAlert("⚡ 高度なハック！", "red");
            advancedHackUsed = true; // 1回切り
            updateCooldownText();
        }
    }

    // --- KEY 3 スロット ---
    if (keySlot === "key3") {
        if (cooldowns.key3 > 0) return;
        if (skill.id === "hacker_milestone_4") {
            sendAttackToOthers("mutation");
            showBattleAlert("🧪 状態変異！", "#7cfc00");
            startSpecificCooldown("key3", 35);
        }
    }

    el("stat-score").innerText = score;
    if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
};

// ==========================================
// ギミック：回避・迷路・毒
// ==========================================

// 1. 回避ボタン (花火スキル)
function createDodgeButton() {
    const container = document.createElement("div");
    container.id = "dodge-button-container";
    container.innerHTML = `<button id="dodge-btn">避ける</button>`;
    document.body.appendChild(container);
    
    let dodged = false;
    const btn = document.getElementById("dodge-btn");
    btn.onclick = () => {
        dodged = true;
        container.remove();
        showBattleAlert("回避成功！", "#fff");
    };
    
    setTimeout(() => {
        if (!dodged) {
            container.remove();
            applyStun(8000); // 失敗で8秒スタン
            showBattleAlert("回避失敗！8秒スタン", "red");
        }
    }, 1000); // 1秒間だけ表示
}

// 2. 迷路ハック (10x10)
function createMazeGame() {
    isStunned = true; // 操作封印
    const container = document.createElement("div");
    container.id = "maze-container";
    container.style = "position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:350px; height:350px; background:#000; border:3px solid #0f0; z-index:20000; display:grid; grid-template-columns:repeat(10, 1fr);";
    
    const mazeData = [
        [0,1,0,0,0,0,1,0,0,0],
        [0,1,0,1,1,0,1,0,1,0],
        [0,0,0,0,1,0,0,0,1,0],
        [1,1,1,0,1,1,1,1,1,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,1,1,1,1,1,1,1,1,0],
        [0,1,0,0,0,0,0,0,1,0],
        [0,1,0,1,1,1,1,0,1,0],
        [0,0,0,1,0,0,0,0,0,0],
        [1,1,1,1,0,1,1,1,1,0]
    ];
    
    let px = 0, py = 0; // 開始位置
    const goalX = 4, goalY = 9; // ゴール位置

    function draw() {
        container.innerHTML = "";
        for(let y=0; y<10; y++) {
            for(let x=0; x<10; x++) {
                const cell = document.createElement("div");
                cell.style.border = "1px solid #111";
                if(mazeData[y][x] === 1) cell.style.background = "#333";
                if(x === px && y === py) cell.style.background = "#0f0";
                if(x === goalX && y === goalY) cell.style.background = "gold";
                container.appendChild(cell);
            }
        }
    }
    
    const moveListener = (e) => {
        let nx = px, ny = py;
        if(e.key === "ArrowUp") ny--;
        if(e.key === "ArrowDown") ny++;
        if(e.key === "ArrowLeft") nx--;
        if(e.key === "ArrowRight") nx++;
        
        if(nx >=0 && nx < 10 && ny >= 0 && ny < 10 && mazeData[ny][nx] === 0) {
            px = nx; py = ny;
            draw();
            if(px === goalX && py === goalY) {
                window.removeEventListener("keydown", moveListener);
                container.remove();
                isStunned = false;
                showBattleAlert("迷路脱出！", "#0f0");
            }
        }
    };
    
    window.addEventListener("keydown", moveListener);
    document.body.appendChild(container);
    draw();
}

// 攻撃受信コア
function handleIncomingAttack(attack) {
    if (!gameActive) return;

    switch(attack.type) {
        case "firework_snap": createDodgeButton(); break;
        case "maze_attack": createMazeGame(); break;
        case "advanced_hack":
            const overlay = document.createElement("div");
            overlay.id = "hacked-overlay";
            overlay.innerHTML = "<h1>HACKED BY ENEMY</h1>";
            document.body.appendChild(overlay);
            applyStun(3000);
            setTimeout(() => { 
                if(document.getElementById("hacked-overlay")) document.getElementById("hacked-overlay").remove();
                // スキル封印はisStunnedとは別に管理が必要だが、ここでは3sスタン+15sスキル使用不可とする
                isStunned = true; 
                setTimeout(() => { isStunned = false; }, 15000);
            }, 3000);
            break;
        case "mutation":
            applyStun(3000);
            el("screen-play").style.background = "rgba(0, 100, 0, 0.4)";
            setTimeout(() => {
                isPoisoned = true;
                setTimeout(() => { 
                    isPoisoned = false; 
                    el("screen-play").style.background = "";
                }, 10000);
            }, 3000);
            break;
        case "jam": applyJamming(attack.duration); break;
        case "steal":
            score = Math.max(0, score - attack.stealAmount);
            el("stat-score").innerText = score;
            break;
    }
}

function applyStun(ms) {
    isStunned = true;
    el("screen-play").style.filter = "grayscale(1) contrast(0.5)";
    setTimeout(() => {
        isStunned = false;
        el("screen-play").style.filter = "none";
    }, ms);
}

// ==========================================
// ストーリーモード進行管理
// ==========================================

window.openStoryMode = () => {
    openScreen("screen-story-select");
    renderStoryMap();
};

function renderStoryMap() {
    const list = el("story-stage-list");
    list.innerHTML = "";
    
    [1, 2].forEach(world => {
        const area = document.createElement("div");
        area.className = "story-world-section";
        area.innerHTML = `<h3>第 ${world} 面</h3>`;
        
        const grid = document.createElement("div");
        grid.className = "story-grid";
        
        for(let s=1; s<=7; s++) {
            const sid = world * 100 + s;
            const stage = STORY_STAGES[sid];
            const btn = document.createElement("button");
            
            const isUnlocked = sid === 101 || sid <= userHighestStage;
            btn.className = `stage-card ${isUnlocked ? 'unlocked' : 'locked'} ${stage.boss ? 'boss' : ''}`;
            btn.innerHTML = `
                <div class="stage-num">${world}-${s}</div>
                <div class="stage-info">${stage.boss ? 'BOSS' : stage.target + 'pts'}</div>
            `;
            
            if (isUnlocked) {
                btn.onclick = () => selectStoryMode(sid);
            } else {
                btn.disabled = true;
            }
            grid.appendChild(btn);
        }
        area.appendChild(grid);
        list.appendChild(area);
    });
}

// ステージ選択時のパーティーチェック
window.selectStoryMode = async (sid) => {
    currentStageId = sid;
    
    // パーティーに入っている場合
    if (myPartyId) {
        const snap = await get(ref(db, `parties/${myPartyId}/members`));
        const members = snap.val();
        
        // 全員の進捗をチェック
        let allReady = true;
        for (let mid in members) {
            const mSnap = await get(ref(db, `users/${mid}/highestStage`));
            const mStage = mSnap.val() || 101;
            if (mStage < sid) allReady = false;
        }
        
        if (!allReady) {
            return alert("パーティーメンバーの中に、このステージに到達していないプレイヤーがいます。");
        }
        
        if (!isLeader) {
            return alert("パーティーリーダーが開始するのを待ってください。");
        }
        
        // リーダーが開始
        startStorySequence(true, Object.keys(members).length);
    } else {
        // 一人プレイ
        startStorySequence(false, 1);
    }
};

function startStorySequence(isParty, memberCount) {
    isStoryMode = true;
    const stage = STORY_STAGES[currentStageId];
    
    // スコアノルマ設定： 1人あたりの目標 = ステージ目標 / 人数
    storyTargetScore = isParty ? Math.floor(stage.target / memberCount) : stage.target;
    
    openScreen("screen-play");
    resetSkillState();
    
    // ストーリーモードはスキルUIを隠す
    el("in-game-skill-btn").classList.add("hidden");
    el("skill-status-text").innerText = "【ストーリーモード】スキル使用不可";
    
    // 難易度ランダム決定
    const diffs = ["easy", "normal", "hard"];
    const randomDiff = diffs[Math.floor(Math.random() * 3)];
    currentWords = WORD_DB[randomDiff];
    
    startGame(60); // 60秒固定
}

// ゲーム中に呼ばれる進捗更新
function updateStoryProgressUI() {
    if (!isStoryMode) return;
    const progress = Math.min(100, (score / storyTargetScore) * 100);
    el("story-score-fill").style.width = `${progress}%`;
    el("story-target-text").innerText = `目標: ${score} / ${storyTargetScore}`;
}

// ゲーム終了後のクリア判定
function checkStoryResult() {
    if (!isStoryMode) return;
    
    if (score >= storyTargetScore) {
        const stage = STORY_STAGES[currentStageId];
        alert(`🎉 ステージクリア！\n報酬: ${stage.reward}コイン`);
        
        coins += stage.reward;
        
        // 進捗更新
        let next = currentStageId + 1;
        if (currentStageId === 107) next = 201; // 1-7の次は2-1
        
        if (next > userHighestStage) {
            userHighestStage = next;
            update(ref(db, `users/${myId}`), { highestStage: userHighestStage });
        }
        
        // スキルアンロック
        if (stage.unlockSkill && !ownedSkills.includes(stage.unlockSkill)) {
            ownedSkills.push(stage.unlockSkill);
            const sName = stage.unlockSkill === "fireworks" ? "花火" : "ハッカーマイルストーン4";
            alert(`🎁 新スキル「${sName}」を解放しました！`);
            update(ref(db, `users/${myId}`), { skills: ownedSkills });
        }
    } else {
        alert("❌ クリア失敗... 目標スコアに届きませんでした。");
    }
    
    isStoryMode = false;
    saveAndDisplayData();
    window.goHome();
}

// --- 初期ロード処理 ---
onValue(userRef, (snap) => {
    const data = snap.val();
    if (data) {
        if (data.highestStage) userHighestStage = data.highestStage;
        if (data.skills) ownedSkills = data.skills;
        if (data.coins !== undefined) coins = data.coins;
    }
    saveAndDisplayData();
});

// 初期画面へ
window.goHome();
