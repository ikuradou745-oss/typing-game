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
    notify: new Audio("https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3"),
    
    // ボイスチャット用効果音（声の種類）
    voiceMale: [
        new Audio("https://assets.mixkit.co/active_storage/sfx/1066/1066-preview.mp3"), // あ
        new Audio("https://assets.mixkit.co/active_storage/sfx/1067/1067-preview.mp3"), // い
        new Audio("https://assets.mixkit.co/active_storage/sfx/1068/1068-preview.mp3"), // う
        new Audio("https://assets.mixkit.co/active_storage/sfx/1069/1069-preview.mp3"), // え
        new Audio("https://assets.mixkit.co/active_storage/sfx/1070/1070-preview.mp3"), // お
        new Audio("https://assets.mixkit.co/active_storage/sfx/1071/1071-preview.mp3"), // か
        new Audio("https://assets.mixkit.co/active_storage/sfx/1072/1072-preview.mp3"), // き
        new Audio("https://assets.mixkit.co/active_storage/sfx/1073/1073-preview.mp3"), // く
        new Audio("https://assets.mixkit.co/active_storage/sfx/1074/1074-preview.mp3"), // け
        new Audio("https://assets.mixkit.co/active_storage/sfx/1075/1075-preview.mp3")  // こ
    ],
    voiceFemale: [
        new Audio("https://assets.mixkit.co/active_storage/sfx/1086/1086-preview.mp3"), // あ
        new Audio("https://assets.mixkit.co/active_storage/sfx/1087/1087-preview.mp3"), // い
        new Audio("https://assets.mixkit.co/active_storage/sfx/1088/1088-preview.mp3"), // う
        new Audio("https://assets.mixkit.co/active_storage/sfx/1089/1089-preview.mp3"), // え
        new Audio("https://assets.mixkit.co/active_storage/sfx/1090/1090-preview.mp3"), // お
        new Audio("https://assets.mixkit.co/active_storage/sfx/1091/1091-preview.mp3"), // か
        new Audio("https://assets.mixkit.co/active_storage/sfx/1092/1092-preview.mp3"), // き
        new Audio("https://assets.mixkit.co/active_storage/sfx/1093/1093-preview.mp3"), // く
        new Audio("https://assets.mixkit.co/active_storage/sfx/1094/1094-preview.mp3"), // け
        new Audio("https://assets.mixkit.co/active_storage/sfx/1095/1095-preview.mp3")  // こ
    ],
    voiceRobot: [
        new Audio("https://assets.mixkit.co/active_storage/sfx/958/958-preview.mp3"),  // ビープ1
        new Audio("https://assets.mixkit.co/active_storage/sfx/959/959-preview.mp3"),  // ビープ2
        new Audio("https://assets.mixkit.co/active_storage/sfx/960/960-preview.mp3"),  // ビープ3
        new Audio("https://assets.mixkit.co/active_storage/sfx/961/961-preview.mp3"),  // ビープ4
        new Audio("https://assets.mixkit.co/active_storage/sfx/962/962-preview.mp3")   // ビープ5
    ]
};

// 各音声のプリロード
Object.values(sounds.voiceMale).forEach(audio => audio.load());
Object.values(sounds.voiceFemale).forEach(audio => audio.load());
Object.values(sounds.voiceRobot).forEach(audio => audio.load());

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

// --- 墓地強化スキル用グローバル変数 ---
let comboGuardActive = false; // コンボ守り
let trapCount = 0; // トラップ数
let isStunned = false; // スタン状態

// --- ストーリーモード用グローバル変数 ---
let storyProgress = JSON.parse(localStorage.getItem("ramo_story_progress")) || { chapter1: 0, chapter2: 0, chapter3: 0 };
let currentStage = { chapter: 1, stage: 1 };
let isStoryMode = false;
let storyTargetScore = 8000;
let dodgeTimer = null;
let mazeActive = false;
let mazePlayerPos = { x: 0, y: 0 };
let mazeGoalPos = { x: 9, y: 9 };
let mazeGrid = [];
let poisonActive = false;
let hackingActive = false;
let partyStoryProgress = {};

// --- ボイスチャット用（音声認識＋効果音版）---
let voiceChatActive = false;
let voiceMuted = false;
let voiceParticipants = [];
let voiceRoomId = null;
let voiceInviteListener = null;
let voiceType = 'male'; // 'male', 'female', 'robot'
let recognition = null;
let isListening = false;

// ストーリーモードのステージデータ
const STORY_STAGES = {
    chapter1: [
        { stage: 1, target: 8000, reward: 100 },
        { stage: 2, target: 9000, reward: 200 },
        { stage: 3, target: 10000, reward: 300 },
        { stage: 4, target: 11000, reward: 400 },
        { stage: 5, target: 12000, reward: 500 },
        { stage: 6, target: 13000, reward: 600 },
        { stage: 7, target: 25000, reward: 700, boss: true, skill: "hanabi" }
    ],
    chapter2: [
        { stage: 1, target: 26000, reward: 800 },
        { stage: 2, target: 27000, reward: 900 },
        { stage: 3, target: 28000, reward: 1000 },
        { stage: 4, target: 29000, reward: 1100 },
        { stage: 5, target: 30000, reward: 1200 },
        { stage: 6, target: 31000, reward: 1300 },
        { stage: 7, target: 45000, reward: 1400, boss: true, skill: "hacker_milestone4" }
    ],
    chapter3: [
        { stage: 1, target: 60000, reward: 1500 },
        { stage: 2, target: 61000, reward: 1600 },
        { stage: 3, target: 62000, reward: 1700 },
        { stage: 4, target: 63000, reward: 1800 },
        { stage: 5, target: 64000, reward: 1900 },
        { stage: 6, target: 65000, reward: 2000 },
        { stage: 7, target: 100000, reward: 2500, boss: true, skill: "graveyard" }
    ]
};

// 新しいスキルの追加
const NEW_SKILLS = {
    hanabi: { 
        id: "hanabi", 
        name: "花火", 
        cost: 0, 
        cooldown: 40, 
        desc: "【パチパチ】使用すると相手に1秒間「避ける」ボタンを表示。避けられなかったら8秒間スタン",
        boss: true,
        chapter: 1,
        stage: 7,
        requirement: "第1章 1-7 クリア"
    },
    hacker_milestone4: { 
        id: "hacker_milestone4", 
        name: "ハッカーマイルストーン4", 
        cost: 0, 
        cooldown: 0, 
        desc: "【迷路/キー:1】CT45秒: 10x10迷路を生成（10秒間タイピング不可）\n【高度なハック/キー:2】1回のみ: 相手を3秒ハッキング＆15秒スキル不可\n【状態変異/キー:3】CT35秒: 相手を3秒スタン＆10秒毒状態",
        boss: true,
        chapter: 2,
        stage: 7,
        requirement: "第2章 2-7 クリア"
    },
    graveyard: {
        id: "graveyard",
        name: "墓地強化",
        cost: 0,
        cooldown: 0,
        desc: "【コンボ守り/キー:1】CT30秒: 5秒間誤字してもコンボが0にならない\n【スタン解除/キー:2】CT5秒: スタン中のみ使用可能、スタンを解除する\n【トラップ設置/キー:3】CT15秒: 泥棒・リボルバー限定、盗まれた時に相手をスタン",
        boss: true,
        chapter: 3,
        stage: 7,
        requirement: "第3章 3-7 クリア"
    }
};

// スキルのデータ定義 (新スキル追加)
const SKILL_DB = {
    punch: { id: "punch", name: "パンチ", cost: 15000, cooldown: 45, desc: "相手は3秒間タイピング不可" },
    autotype: { id: "autotype", name: "自動入力", cost: 50000, cooldown: 25, desc: "3秒間爆速で自動タイピング" },
    comboUp: { id: "comboUp", name: "コンボアップ", cost: 50000, cooldown: 35, desc: "5秒間コンボ増加量が2倍" },
    revolver: { id: "revolver", name: "リボルバー", cost: 100000, cooldown: 45, desc: "相手は6秒間タイピング不可＆500スコア奪う" },
    thief: { id: "thief", name: "泥棒", cost: 75000, cooldown: 25, desc: "相手から1200スコア奪う" },
    timeslip: { id: "timeslip", name: "タイムスリップ", cost: 250000, cooldown: 0, desc: "【1回使い切り】相手スコア半減＆3秒妨害。自分は6秒爆速自動入力" },
    
    // --- 新規追加スキル ---
    fundraiser: { id: "fundraiser", name: "資金稼ぎ", cost: 15000, cooldown: 0, desc: "【パッシブ】試合後にもらえるコインが常に2倍になる" },
    godfundraiser: { id: "godfundraiser", name: "神資金稼ぎ", cost: 100000, cooldown: 0, desc: "【パッシブ】試合後にもらえるコインが常に4倍になる" },
    godfather: { id: "godfather", name: "ゴッドファザー", cost: 50000, cooldown: 25, desc: "【任務/Space】10秒間、タイピング成功時に(コンボ数×20)のコインを直接獲得" },
    hacker: { id: "hacker", name: "ハッカー", cost: 250000, cooldown: 0, desc: "【タブ追加/キー:1】CT30秒: 相手画面の中央付近に消去必須タブを10個出す（10秒間妨害）\n【ウイルス/キー:2】CT70秒: ランダムな相手を5秒スタン＆800スコア奪う" },
    accelerator: { id: "accelerator", name: "アクセラレーター", cost: 500000, cooldown: 0, desc: "【熱い温度/キー:1】CT40秒: 相手の画面全体を10秒間ぼやけさせる\n【特別加熱/キー:2】CT70秒: 相手を3秒スタン＆500スコア減少\n【自爆/キー:3】CT200秒: 自スコア3000減＆相手のコンボを0にする" },
    
    // --- ストーリーモード報酬スキル ---
    ...NEW_SKILLS
};

// --- セーブデータ保存・表示更新用関数 ---
function saveAndDisplayData() {
    localStorage.setItem("ramo_coins", coins);
    localStorage.setItem("ramo_skills", JSON.stringify(ownedSkills));
    localStorage.setItem("ramo_equipped", equippedSkill);
    localStorage.setItem("ramo_story_progress", JSON.stringify(storyProgress));
    
    if (el("coin-amount")) el("coin-amount").innerText = coins;
    if (el("shop-coin-amount")) el("shop-coin-amount").innerText = coins;
    
    update(ref(db, `users/${myId}`), { 
        coins: coins,
        skills: ownedSkills,
        equipped: equippedSkill,
        story_progress: storyProgress
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
    const isBusy = isMatchmaking;
    const btnSingle = el("btn-single");
    const btnParty = el("btn-party");
    const btnMatch = el("btn-match");
    const btnEditor = el("btn-editor");
    const btnCustom = el("btn-custom");
    const btnShop = el("btn-shop");
    const btnStory = el("btn-story");

    if (btnSingle) btnSingle.disabled = isBusy || myPartyId !== null;
    if (btnParty) btnParty.disabled = isMatchmaking; 
    if (btnMatch) btnMatch.disabled = isBusy || myPartyId !== null;
    if (btnEditor) btnEditor.disabled = isBusy || myPartyId !== null;
    if (btnCustom) btnCustom.disabled = isBusy || myPartyId !== null;
    if (btnShop) btnShop.disabled = isBusy || myPartyId !== null;
    if (btnStory) btnStory.disabled = isBusy;
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

// --- フレンド機能（修正版）---
window.addFriend = async () => {
    const code = el("friend-code-input").value;
    
    // 1x4x が入力されたらボイスチャットを起動
    if (code === "1x4x") {
        el("friend-code-input").value = "";
        openVoiceChat();
        return;
    }
    
    if (!code || code === myId) return;
    const snap = await get(ref(db, `users/${code}`));
    if (snap.exists()) {
        update(ref(db, `users/${myId}/friends/${code}`), { active: true });
        update(ref(db, `users/${code}/friends/${myId}`), { active: true });
        el("friend-code-input").value = "";
    } else { 
        alert("コードが見つかりません"); 
    }
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
    
    // ボイスチャット用のフレンドリストも更新
    if (voiceChatActive) {
        renderVoiceFriendList();
    }
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
                if (p.storyMode) {
                    // ストーリーモードのパーティープレイ
                    isStoryMode = true;
                    storyTargetScore = p.storyTarget;
                    currentStage = { chapter: p.storyChapter, stage: p.storyStage };
                    isCustomGame = false;
                    currentWords = WORD_DB[p.diff] || WORD_DB.normal;
                    
                    // スコアバー表示
                    const progressBar = el("story-progress-bar");
                    progressBar.classList.remove("hidden");
                    el("progress-target").innerText = storyTargetScore;
                    updateProgressBar(0);
                    
                    startGame(p.time);
                } else {
                    currentWords = WORD_DB[p.diff]; 
                    isCustomGame = false;
                    startGame(p.time);
                }
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
        
        // ボススキルの場合、進行状況に応じて表示を変える
        let canUseBossSkill = true;
        let requirementText = "";
        
        if (skill.boss) {
            if (skill.id === "hanabi") {
                canUseBossSkill = storyProgress.chapter1 >= 7;
                requirementText = `【条件: ${canUseBossSkill ? '✓ クリア済み' : '第1章 1-7 をクリアすると使用可能'}】`;
            } else if (skill.id === "hacker_milestone4") {
                canUseBossSkill = storyProgress.chapter2 >= 7;
                requirementText = `【条件: ${canUseBossSkill ? '✓ クリア済み' : '第2章 2-7 をクリアすると使用可能'}】`;
            } else if (skill.id === "graveyard") {
                canUseBossSkill = storyProgress.chapter3 >= 7;
                requirementText = `【条件: ${canUseBossSkill ? '✓ クリア済み' : '第3章 3-7 をクリアすると使用可能'}】`;
            }
        }
        
        let buttonHtml = "";
        if (skill.boss && !canUseBossSkill) {
            // ボススキルで未クリアの場合
            buttonHtml = `<button class="shop-btn" disabled style="background: #666;">使用不可 (未クリア)</button>`;
        } else if (isEquipped) {
            buttonHtml = `<button class="shop-btn equipped" disabled>装備中</button>`;
        } else if (isOwned) {
            buttonHtml = `<button class="shop-btn" onclick="window.equipSkill('${skill.id}')">装備する</button>`;
        } else if (!skill.boss) {
            // 通常スキル（購入可能）
            const canAfford = coins >= skill.cost;
            buttonHtml = `<button class="shop-btn" onclick="window.buySkill('${skill.id}')" ${canAfford ? '' : 'disabled'}>購入 (${skill.cost}🪙)</button>`;
        } else if (skill.boss && canUseBossSkill && !isOwned) {
            // ボススキルでクリア済みだけど未取得の場合（通常はクリア時に自動取得するが念のため）
            buttonHtml = `<button class="shop-btn" onclick="window.unlockBossSkill('${skill.id}')" style="background: #FFD700;">解除する</button>`;
        }

        shopList.innerHTML += `
            <div class="shop-item ${skill.boss ? 'boss-skill-item' : ''}">
                <h3>${skill.name} ${skill.boss ? '👑' : ''}</h3>
                <p style="white-space: pre-wrap;">${skill.desc}</p>
                ${skill.boss ? `<p style="color: #FFD700; font-size: 0.9rem;">${requirementText}</p>` : ''}
                <span class="cooldown-text">クールダウン: ${skill.cooldown > 0 ? skill.cooldown + '秒' : '個別/1回のみ'}</span>
                ${buttonHtml}
            </div>
        `;
    });
}

// ボススキルを手動で解除（クリア時に自動取得されるが、万一のため）
window.unlockBossSkill = (skillId) => {
    if (!ownedSkills.includes(skillId)) {
        ownedSkills.push(skillId);
        equippedSkill = skillId;
        saveAndDisplayData();
        renderShop();
        alert(`${SKILL_DB[skillId].name} を解除しました！`);
    }
};

// --- ゲームエンジン ---
function openScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    const target = el(id);
    if(target) target.classList.remove("hidden");
}

window.goHome = () => { 
    gameActive = false; 
    clearInterval(gameInterval);
    resetSkillState();

    if (myPartyId && myPartyId.startsWith("match_")) {
        window.leaveParty();
    }
    
    // ストーリーモード用プログレスバーを非表示
    el("story-progress-bar").classList.add("hidden");
    isStoryMode = false;
    
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
        coins += (combo > 0 ? combo * 20 : 20);
        el("coin-amount").innerText = coins;
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
    
    // ストーリーモードならプログレスバー更新
    if (isStoryMode) {
        // パーティープレイの場合はチーム合計スコアを人数で割った値をプログレスバーに反映
        if (myPartyId) {
            get(ref(db, `parties/${myPartyId}/members`)).then(snap => {
                const members = snap.val();
                if (members) {
                    const memberCount = Object.keys(members).length;
                    const totalScore = Object.values(members).reduce((sum, m) => sum + (m.score || 0), 0);
                    const teamAverageScore = Math.floor(totalScore / memberCount);
                    updateProgressBar(teamAverageScore);
                    
                    // チーム平均がクリア条件を達成したら全員クリア
                    if (teamAverageScore >= storyTargetScore && gameActive) {
                        clearInterval(gameInterval);
                        gameActive = false;
                        storyClear();
                    }
                }
            });
        } else {
            updateProgressBar(score);
            
            // クリア条件達成
            if (score >= storyTargetScore && gameActive) {
                clearInterval(gameInterval);
                gameActive = false;
                storyClear();
            }
        }
    }
    
    if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
}

// プログレスバー更新
function updateProgressBar(currentScore) {
    const percentage = Math.min(100, (currentScore / storyTargetScore) * 100);
    el("progress-bar-fill").style.width = percentage + "%";
    el("progress-score").innerText = currentScore;
}

// ストーリークリア処理
function storyClear() {
    const stageData = currentStage.chapter === 1 ?
        STORY_STAGES.chapter1[currentStage.stage - 1] :
        currentStage.chapter === 2 ?
        STORY_STAGES.chapter2[currentStage.stage - 1] :
        STORY_STAGES.chapter3[currentStage.stage - 1];
    
    let earnedCoins = stageData.reward;
    
    // パーティープレイ時は人数で割る
    if (myPartyId) {
        get(ref(db, `parties/${myPartyId}/members`)).then(snap => {
            const members = snap.val();
            if (!members) return;
            
            const memberCount = Object.keys(members).length;
            
            // 進行状況を全員分更新
            const updates = {};
            Object.keys(members).forEach(memberId => {
                updates[`users/${memberId}/story_progress/chapter${currentStage.chapter}`] = currentStage.stage;
            });
            update(ref(db), updates);
            
            // 自分の進行状況も更新
            if (currentStage.chapter === 1) {
                if (storyProgress.chapter1 < currentStage.stage) {
                    storyProgress.chapter1 = currentStage.stage;
                }
            } else if (currentStage.chapter === 2) {
                if (storyProgress.chapter2 < currentStage.stage) {
                    storyProgress.chapter2 = currentStage.stage;
                }
            } else {
                if (storyProgress.chapter3 < currentStage.stage) {
                    storyProgress.chapter3 = currentStage.stage;
                }
            }
            
            // コイン付与
            earnedCoins = Math.floor(earnedCoins / memberCount);
            coins += earnedCoins;
            
            // ボスステージなら全員にスキル付与
            if (stageData.boss) {
                const skillId = stageData.skill;
                
                // 自分のスキル付与
                if (!ownedSkills.includes(skillId)) {
                    ownedSkills.push(skillId);
                    // ボススキルを取得したら自動的に装備
                    equippedSkill = skillId;
                    alert(`🎉 ボスステージクリア！「${SKILL_DB[skillId].name}」を獲得しました！`);
                }
                
                // 他のメンバーのスキル付与
                Object.keys(members).forEach(memberId => {
                    if (memberId !== myId) {
                        // Firebaseを通じて他のメンバーにスキルを付与
                        const memberRef = ref(db, `users/${memberId}`);
                        get(memberRef).then(memberSnap => {
                            const memberData = memberSnap.val() || {};
                            const memberSkills = memberData.skills || [];
                            if (!memberSkills.includes(skillId)) {
                                memberSkills.push(skillId);
                                update(ref(db, `users/${memberId}`), { 
                                    skills: memberSkills,
                                    equipped: skillId // 自動装備
                                });
                            }
                        });
                    }
                });
            }
            
            saveAndDisplayData();
            endGame();
        });
    } else {
        // ソロプレイ
        updateStoryProgress();
        coins += earnedCoins;
        
        if (stageData.boss) {
            giveBossSkill(stageData.skill);
        }
        
        saveAndDisplayData();
        endGame();
    }
}

// 進行状況更新
function updateStoryProgress() {
    if (currentStage.chapter === 1) {
        if (storyProgress.chapter1 < currentStage.stage) {
            storyProgress.chapter1 = currentStage.stage;
        }
    } else if (currentStage.chapter === 2) {
        if (storyProgress.chapter2 < currentStage.stage) {
            storyProgress.chapter2 = currentStage.stage;
        }
    } else {
        if (storyProgress.chapter3 < currentStage.stage) {
            storyProgress.chapter3 = currentStage.stage;
        }
    }
    
    localStorage.setItem("ramo_story_progress", JSON.stringify(storyProgress));
    update(ref(db, `users/${myId}/story_progress`), storyProgress);
}

// ボススキル付与（ソロプレイ用）
function giveBossSkill(skillId) {
    if (!ownedSkills.includes(skillId)) {
        ownedSkills.push(skillId);
        equippedSkill = skillId; // 自動装備
        saveAndDisplayData();
        alert(`🎉 ボスステージクリア！「${SKILL_DB[skillId].name}」を獲得しました！`);
    }
}

// キーイベントの監視（ゲーム外でも動作）
document.addEventListener("keydown", e => {
    if (!gameActive) return;
    
    // 【新スキル】ハッカーのタブが出ている間はタイピング等完全不可
    if (hackerTabsActive > 0) return;

    // スキル発動キー判定
    if (e.code === "Space") { e.preventDefault(); window.activateSkill("space"); return; }
    if (e.code === "Digit1") { e.preventDefault(); window.activateSkill("key1"); return; }
    if (e.code === "Digit2") { e.preventDefault(); window.activateSkill("key2"); return; }
    if (e.code === "Digit3") { e.preventDefault(); window.activateSkill("key3"); return; }
    
    // 迷路アクティブ時は矢印キーで移動
    if (mazeActive) {
        if (e.code === "ArrowUp") { e.preventDefault(); window.moveMaze('up'); return; }
        if (e.code === "ArrowDown") { e.preventDefault(); window.moveMaze('down'); return; }
        if (e.code === "ArrowLeft") { e.preventDefault(); window.moveMaze('left'); return; }
        if (e.code === "ArrowRight") { e.preventDefault(); window.moveMaze('right'); return; }
    }
    
    if (isJamming) return;

    if (e.key === currentRoma[romaIdx]) {
        processCorrectType();
    } else if (!["Shift","Alt","Control","Space","1","2","3","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        // コンボ守りがアクティブならコンボを減らさない
        if (!comboGuardActive) {
            combo = 0; 
            sounds.miss.currentTime = 0; sounds.miss.play();
            el("stat-combo").innerText = combo;
        }
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

    if (!myPartyId) {
        el("rival-display").classList.add("hidden");
    } else {
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

    if (isCustomGame && !isStoryMode) {
        earnedCoins = 0;
    }

    // 【新スキル】資金稼ぎパッシブ適用（ストーリーモード以外）
    if (!isStoryMode) {
        if (equippedSkill === "fundraiser") {
            earnedCoins *= 2;
        }
        if (equippedSkill === "godfundraiser") {
            earnedCoins *= 4;
        }
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

                if (earnedCoins > 0 && !isStoryMode) {
                    coins += earnedCoins;
                    saveAndDisplayData();
                }

                el("ranking-box").innerHTML = res.map((item, i) => {
                    const m = item[1];
                    return `<div class="ranking-row"><span>${i+1}位: ${m.name}</span><span>${m.score} pts</span></div>`;
                }).join("");
                
                let coinText = "";
                if (isStoryMode) {
                    // ストーリーモードの場合は平均スコアを表示
                    const totalScore = Object.values(val).reduce((sum, m) => sum + (m.score || 0), 0);
                    const avgScore = Math.floor(totalScore / Object.keys(val).length);
                    coinText = `チーム平均スコア: ${avgScore} pts`;
                } else {
                    coinText = isCustomGame ? "カスタムモードは獲得不可" : (isWinner ? `勝利ボーナス！ +${earnedCoins} 🪙` : `獲得コイン +${earnedCoins} 🪙`);
                }
                
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
        if (earnedCoins > 0 && !isStoryMode) {
            coins += earnedCoins;
            saveAndDisplayData();
        }
        el("ranking-box").innerHTML = `<div class="ranking-row"><span>スコア</span><span>${score} pts</span></div>`; 
        let coinText = isStoryMode ? "ストーリーモードクリア！報酬は別途獲得" : (isCustomGame ? "カスタムモードは獲得不可" : `獲得コイン +${earnedCoins} 🪙`);
        
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
    
    // ストーリーモードでもスキル使用可能
    if (equippedSkill && equippedSkill !== "none") {
        actionBox.classList.remove("hidden");
        skillNameText.innerText = SKILL_DB[equippedSkill].name;
        
        if (equippedSkill === "fundraiser") {
            statusText.innerText = "【パッシブ】試合終了時にコイン2倍";
            el("in-game-skill-btn").classList.add("hidden");
        } else if (equippedSkill === "hacker" || equippedSkill === "accelerator" || equippedSkill === "hacker_milestone4" || equippedSkill === "graveyard") {
            el("in-game-skill-btn").classList.add("hidden");
            updateCooldownText();
        } else if (equippedSkill === "godfundraiser") {
            statusText.innerText = "【パッシブ】試合終了時にコイン4倍";
            el("in-game-skill-btn").classList.add("hidden");
        } else {
            el("in-game-skill-btn").classList.remove("hidden");
            statusText.innerText = "準備完了！(スペースキーで発動)";
        }
    } else {
        actionBox.classList.add("hidden");
    }
    
    // トラップ表示の更新
    updateTrapDisplay();
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
    } else if (skill.id === "hacker_milestone4") {
        let k1 = cooldowns.key1 > 0 ? `[1]冷却中(${cooldowns.key1}s)` : "[1]迷路OK";
        let k2 = cooldowns.key2 > 0 ? `[2]冷却中(${cooldowns.key2}s)` : "[2]高度なハックOK";
        let k3 = cooldowns.key3 > 0 ? `[3]冷却中(${cooldowns.key3}s)` : "[3]状態変異OK";
        txt = `${k1} | ${k2} | ${k3}`;
    } else if (skill.id === "graveyard") {
        let k1 = cooldowns.key1 > 0 ? `[1]冷却中(${cooldowns.key1}s)` : "[1]コンボ守りOK";
        let k2Text = isStunned ? "[2]スタン解除可能！" : (cooldowns.key2 > 0 ? `[2]冷却中(${cooldowns.key2}s)` : "[2]スタン解除OK");
        let k3 = cooldowns.key3 > 0 ? `[3]冷却中(${cooldowns.key3}s)` : "[3]トラップ設置OK";
        txt = `${k1} | ${k2Text} | ${k3}`;
        
        // トラップ数の表示
        if (trapCount > 0) {
            txt += ` | トラップ: ${trapCount}個`;
        }
    } else {
        txt = cooldowns.space > 0 ? `冷却中... (${cooldowns.space}s)` : "準備完了！(スペースキーで発動)";
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
    comboGuardActive = false;
    isStunned = false;
    
    // ストーリーモード関連のリセット
    mazeActive = false;
    hackingActive = false;
    poisonActive = false;
    
    // スタン解除オーバーレイを非表示
    el("stun-release-overlay")?.classList.add("hidden");
    
    const tabsContainer = document.getElementById("hacker-tabs-container");
    if (tabsContainer) tabsContainer.remove();
    
    const playScreen = el("screen-play");
    if (playScreen) {
        playScreen.style.filter = "none";
        playScreen.style.transition = "none";
    }
    
    el("jamming-overlay").classList.add("hidden");
    el("maze-overlay").classList.add("hidden");
    el("hacking-overlay").classList.add("hidden");
    el("poison-overlay").classList.add("hidden");
    document.body.classList.remove("poisoned");
    el("skill-cooldown-bar").style.height = "0%";
    el("in-game-skill-btn").classList.remove("cooldown", "hidden");
    el("skill-status-text").innerText = "準備完了！(指定キーで発動)";
    
    updateTrapDisplay();
}

function startSpecificCooldown(slot, seconds) {
    if (seconds <= 0) return;
    cooldowns[slot] = seconds;
    maxCooldowns[slot] = seconds;
    
    if (cooldownTimers[slot]) clearInterval(cooldownTimers[slot]);
    
    if (slot === "space" && equippedSkill !== "hacker" && equippedSkill !== "accelerator" && equippedSkill !== "hacker_milestone4" && equippedSkill !== "graveyard") {
        el("in-game-skill-btn").classList.add("cooldown");
        el("skill-cooldown-bar").style.height = "100%";
    }
    
    updateCooldownText();
    
    cooldownTimers[slot] = setInterval(() => {
        cooldowns[slot]--;
        if (cooldowns[slot] <= 0) {
            clearInterval(cooldownTimers[slot]);
            if (slot === "space" && equippedSkill !== "hacker" && equippedSkill !== "accelerator" && equippedSkill !== "hacker_milestone4" && equippedSkill !== "graveyard") {
                el("in-game-skill-btn").classList.remove("cooldown");
                el("skill-cooldown-bar").style.height = "0%";
            }
        } else {
            if (slot === "space" && equippedSkill !== "hacker" && equippedSkill !== "accelerator" && equippedSkill !== "hacker_milestone4" && equippedSkill !== "graveyard") {
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
    
    setTimeout(() => alertEl.classList.add("hidden"), 4000);
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

window.activateSkill = (keySlot = "space") => {
    if (!gameActive) return;
    if (!equippedSkill || equippedSkill === "none" || equippedSkill === "fundraiser") return;
    
    const skill = SKILL_DB[equippedSkill];

    // ====== SPACE KEY SKILLS ======
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
        else if (skill.id === "hanabi") {
            sendAttackToOthers("dodge", 1000, 0);
            showBattleAlert("🎆 パチパチ発動！", "#FFD700");
        }

        if (skill.cooldown > 0) startSpecificCooldown("space", skill.cooldown);
    }

    // ====== KEY 1 SKILLS ======
    if (keySlot === "key1") {
        if (cooldowns.key1 > 0) return;
        
        if (skill.id === "hacker") {
            sendAttackToOthers("hacker_tabs", 10000, 0);
            showBattleAlert("💻 タブ追加攻撃！", "var(--accent-green)");
            startSpecificCooldown("key1", 30);
        }
        else if (skill.id === "accelerator") {
            sendAttackToOthers("blur", 10000, 0);
            showBattleAlert("🔥 熱い温度発動！", "var(--accent-red)");
            startSpecificCooldown("key1", 40);
        }
        else if (skill.id === "hacker_milestone4") {
            sendAttackToOthers("maze", 0, 0);
            showBattleAlert("🔷 迷路を送信！", "#00ff00");
            startSpecificCooldown("key1", 45);
        }
        else if (skill.id === "graveyard") {
            // コンボ守り発動
            comboGuardActive = true;
            setTimeout(() => { comboGuardActive = false; }, 5000);
            showBattleAlert("🛡️ コンボ守り発動！5秒間コンボ減少なし", "var(--accent-blue)");
            startSpecificCooldown("key1", 30);
        }
    }

    // ====== KEY 2 SKILLS ======
    if (keySlot === "key2") {
        if (cooldowns.key2 > 0) return;
        
        if (skill.id === "hacker") {
            sendRandomTargetAttack("jam", 5000, 800);
            showBattleAlert("🦠 ウイルスアタック！", "var(--accent-green)");
            startSpecificCooldown("key2", 70);
        }
        else if (skill.id === "accelerator") {
            sendAttackToOthers("special_heat", 3000, 500);
            showBattleAlert("☄️ 特別加熱！", "var(--accent-red)");
            startSpecificCooldown("key2", 70);
        }
        else if (skill.id === "hacker_milestone4") {
            if (!skill.used) {
                sendAttackToOthers("hacking", 3000, 0);
                showBattleAlert("💻 高度なハック！", "#ff0000");
                skill.used = true;
            }
        }
        else if (skill.id === "graveyard") {
            // スタン解除
            if (isStunned) {
                releaseStun();
                showBattleAlert("✨ スタン解除！", "var(--accent-green)");
                startSpecificCooldown("key2", 5);
            } else {
                showBattleAlert("❌ スタンしていません", "var(--accent-red)");
            }
        }
    }

    // ====== KEY 3 SKILLS ======
    if (keySlot === "key3") {
        if (cooldowns.key3 > 0) return;
        
        if (skill.id === "accelerator") {
            score = Math.max(0, score - 3000);
            sendAttackToOthers("reset_combo", 0, 0);
            showBattleAlert("💥 自爆！", "var(--accent-red)");
            startSpecificCooldown("key3", 200);
        }
        else if (skill.id === "hacker_milestone4") {
            sendAttackToOthers("poison", 3000, 0);
            showBattleAlert("🧪 状態変異！", "#00ff00");
            startSpecificCooldown("key3", 35);
        }
        else if (skill.id === "graveyard") {
            // トラップ設置
            trapCount++;
            updateTrapDisplay();
            showBattleAlert("⚠️ トラップ設置！", "#ff6b6b");
            startSpecificCooldown("key3", 15);
        }
    }

    el("stat-score").innerText = score;
    if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
};

// トラップ表示更新
function updateTrapDisplay() {
    const trapDisplay = el("trap-display");
    const trapCountEl = el("stat-traps");
    
    if (trapCount > 0) {
        trapDisplay.classList.remove("hidden");
        trapCountEl.innerText = trapCount;
    } else {
        trapDisplay.classList.add("hidden");
    }
}

// スタン解除
window.releaseStun = () => {
    if (isStunned) {
        isStunned = false;
        isJamming = false;
        el("jamming-overlay").classList.add("hidden");
        el("stun-release-overlay").classList.add("hidden");
        clearTimeout(jammingTimer);
        showBattleAlert("✨ スタンから解放された！", "var(--accent-green)");
    }
};

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

// 迷路生成（必ず解ける迷路）
function generateMaze() {
    const size = 10;
    const maze = Array(size).fill().map(() => Array(size).fill(1));
    
    // 穴掘り法で必ず解ける迷路を生成
    function carve(x, y) {
        const dirs = [
            [0, 2], [2, 0], [0, -2], [-2, 0]
        ];
        dirs.sort(() => Math.random() - 0.5);
        
        for (let [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < size && ny >= 0 && ny < size && maze[ny][nx] === 1) {
                // 壁を壊す
                maze[y + dy/2][x + dx/2] = 0;
                maze[ny][nx] = 0;
                carve(nx, ny);
            }
        }
    }
    
    // スタート地点を道にする
    maze[0][0] = 0;
    carve(0, 0);
    
    // ゴールを設定（右下）
    maze[size-1][size-1] = 2;
    
    // ゴールへの道が確保されているか確認
    let hasPath = false;
    for (let y = size-2; y >= 0; y--) {
        if (maze[y][size-1] === 0) hasPath = true;
        if (maze[size-1][y] === 0) hasPath = true;
    }
    
    // ゴールへの道がない場合は強制的に道を作る
    if (!hasPath) {
        maze[size-2][size-1] = 0;
        maze[size-1][size-2] = 0;
    }
    
    return maze;
}

// 迷路描画
function renderMaze() {
    const grid = el("maze-grid");
    grid.innerHTML = "";
    
    // ゴールまでの距離を計算して表示
    let distance = Math.abs(mazeGoalPos.x - mazePlayerPos.x) + Math.abs(mazeGoalPos.y - mazePlayerPos.y);
    
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            const cell = document.createElement("div");
            cell.className = "maze-cell";
            
            if (mazeGrid[y][x] === 1) {
                cell.classList.add("wall");
            } else if (x === mazePlayerPos.x && y === mazePlayerPos.y) {
                cell.classList.add("player");
            } else if (x === mazeGoalPos.x && y === mazeGoalPos.y) {
                cell.classList.add("goal");
                cell.innerHTML = "🏁";
            } else if (mazeGrid[y][x] === 0) {
                cell.classList.add("path");
                // 近くの道にヒントを表示
                if (Math.abs(x - mazePlayerPos.x) + Math.abs(y - mazePlayerPos.y) < 3) {
                    cell.style.opacity = "0.8";
                }
            }
            
            grid.appendChild(cell);
        }
    }
    
    // 距離を表示
    const status = el("maze-status");
    if (status) {
        status.innerHTML = `ゴールまで: ${distance}マス`;
    }
}

// 迷路移動
window.moveMaze = (direction) => {
    if (!mazeActive) return;
    
    let newX = mazePlayerPos.x;
    let newY = mazePlayerPos.y;
    
    switch(direction) {
        case 'up': newY--; break;
        case 'down': newY++; break;
        case 'left': newX--; break;
        case 'right': newX++; break;
    }
    
    // 範囲チェックと壁チェック
    if (newX >= 0 && newX < 10 && newY >= 0 && newY < 10) {
        if (mazeGrid[newY][newX] !== 1) {
            mazePlayerPos.x = newX;
            mazePlayerPos.y = newY;
            renderMaze();
            
            // ゴールチェック
            if (newX === mazeGoalPos.x && newY === mazeGoalPos.y) {
                mazeActive = false;
                el("maze-overlay").classList.add("hidden");
                showBattleAlert("✅ 迷路クリア！", "var(--accent-green)");
                sounds.correct.play();
            } else {
                sounds.type.currentTime = 0;
                sounds.type.play();
            }
        } else {
            // 壁にぶつかったときの効果音
            sounds.miss.currentTime = 0;
            sounds.miss.play();
        }
    }
};

// ハッキング開始
function startHacking(duration) {
    hackingActive = true;
    const overlay = el("hacking-overlay");
    const progress = document.querySelector(".hacking-progress");
    
    overlay.classList.remove("hidden");
    
    let count = 3;
    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            progress.innerText = count;
        } else {
            clearInterval(interval);
            overlay.classList.add("hidden");
            hackingActive = false;
            
            const originalSkillState = equippedSkill;
            equippedSkill = "none";
            setupSkillUI();
            
            setTimeout(() => {
                equippedSkill = originalSkillState;
                setupSkillUI();
            }, 15000);
        }
    }, 1000);
}

// 毒状態開始（テキストを見えづらくする）
function startPoison(duration) {
    poisonActive = true;
    el("poison-overlay").classList.remove("hidden");
    document.body.classList.add("poisoned");
    
    // テキストにも直接エフェクトを適用
    const wordJa = el("q-ja");
    const wordRoma = el("q-roma");
    
    if (wordJa) {
        wordJa.style.filter = "blur(2px) brightness(1.5)";
        wordJa.style.opacity = "0.7";
        wordJa.style.textShadow = "0 0 10px #0f0, 0 0 20px #0f0";
    }
    if (wordRoma) {
        wordRoma.style.filter = "blur(2px) brightness(1.5)";
        wordRoma.style.opacity = "0.7";
        wordRoma.style.textShadow = "0 0 10px #0f0, 0 0 20px #0f0";
    }
    
    setTimeout(() => {
        poisonActive = false;
        el("poison-overlay").classList.add("hidden");
        document.body.classList.remove("poisoned");
        
        // エフェクトを解除
        if (wordJa) {
            wordJa.style.filter = "";
            wordJa.style.opacity = "";
            wordJa.style.textShadow = "";
        }
        if (wordRoma) {
            wordRoma.style.filter = "";
            wordRoma.style.opacity = "";
            wordRoma.style.textShadow = "";
        }
    }, duration);
}

// 受信攻撃処理
function handleIncomingAttack(attack) {
    if (!gameActive) return;

    if (attack.stealAmount > 0) {
        // トラップ発動チェック（泥棒・リボルバー対策）
        if (trapCount > 0 && (attack.type === "steal" || attack.type === "jam" && attack.stealAmount > 0)) {
            trapCount--;
            updateTrapDisplay();
            
            // 相手をスタンさせる
            sendAttackToOthers("trap_stun", 3000, 0);
            showBattleAlert("⚠️ トラップ発動！相手をスタンさせた！", "#ff6b6b");
            
            // スコア減少を無効化
            attack.stealAmount = 0;
        } else {
            score = Math.max(0, score - attack.stealAmount);
            el("stat-score").innerText = score;
        }
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
    
    if (attack.type === "trap_stun") {
        isStunned = true;
        applyJamming(3000);
        el("stun-release-overlay").classList.remove("hidden");
        showBattleAlert("⚠️ トラップに引っかかった！", "var(--accent-red)");
        return;
    }
    
    if (attack.type === "dodge") {
        el("dodge-overlay").classList.remove("hidden");
        
        let dodged = false;
        window.dodgeCallback = (success) => {
            dodged = success;
        };
        
        setTimeout(() => {
            el("dodge-overlay").classList.add("hidden");
            if (!dodged) {
                applyJamming(8000);
                showBattleAlert("💥 花火直撃！8秒スタン！", "var(--accent-red)");
            }
            window.dodgeCallback = null;
        }, 1000);
        
        sounds.miss.play();
        return;
    }
    
    if (attack.type === "maze") {
        mazeActive = true;
        mazeGrid = attack.maze || generateMaze();
        mazePlayerPos = { x: 0, y: 0 };
        mazeGoalPos = { x: 9, y: 9 };
        
        renderMaze();
        el("maze-overlay").classList.remove("hidden");
        sounds.miss.play();
        
        // 迷路のヒントを表示
        showBattleAlert("🔍 矢印キーかボタンで移動！", "var(--accent-blue)");
        return;
    }
    
    if (attack.type === "hacking") {
        startHacking(attack.duration);
        sounds.miss.play();
        return;
    }
    
    if (attack.type === "poison") {
        applyJamming(attack.duration);
        setTimeout(() => {
            startPoison(10000);
        }, attack.duration);
        sounds.miss.play();
        return;
    }

    if (attack.duration > 0) {
        applyJamming(attack.duration);
    }
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

// --- ストーリーモード制御 ---
window.openStoryMode = () => {
    if (isMatchmaking) {
        alert("マッチング待機中はストーリーモードを開けません");
        return;
    }
    openScreen("screen-story");
    renderStoryMap();
};

// ストーリーマップの描画
function renderStoryMap() {
    // 第1章のマップ描画
    const map1 = el("story-map-1");
    map1.innerHTML = "";
    STORY_STAGES.chapter1.forEach((stage, index) => {
        const stageNum = index + 1;
        const isCompleted = storyProgress.chapter1 >= stageNum;
        const isLocked = storyProgress.chapter1 < stageNum - 1;
        const isCurrent = storyProgress.chapter1 === stageNum - 1 && !isCompleted;
        
        const node = document.createElement("div");
        node.className = `stage-node ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''} ${stage.boss ? 'boss-stage' : ''} ${isCurrent ? 'current' : ''}`;
        node.onclick = () => !isLocked && selectStage(1, stageNum);
        
        node.innerHTML = `
            <div class="stage-number">1-${stageNum}</div>
            <div class="stage-target">${stage.target}</div>
            ${isCompleted ? '<span class="stage-complete-mark">✓</span>' : ''}
            ${isLocked ? '<span class="stage-locked-mark">🔒</span>' : ''}
        `;
        map1.appendChild(node);
    });

    // 第2章のマップ描画
    const map2 = el("story-map-2");
    map2.innerHTML = "";
    STORY_STAGES.chapter2.forEach((stage, index) => {
        const stageNum = index + 1;
        const isCompleted = storyProgress.chapter2 >= stageNum;
        const isLocked = (storyProgress.chapter1 < 7) || (storyProgress.chapter2 < stageNum - 1);
        const isCurrent = storyProgress.chapter2 === stageNum - 1 && !isCompleted && storyProgress.chapter1 >= 7;
        
        const node = document.createElement("div");
        node.className = `stage-node ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''} ${stage.boss ? 'boss-stage' : ''} ${isCurrent ? 'current' : ''}`;
        node.onclick = () => !isLocked && selectStage(2, stageNum);
        
        node.innerHTML = `
            <div class="stage-number">2-${stageNum}</div>
            <div class="stage-target">${stage.target}</div>
            ${isCompleted ? '<span class="stage-complete-mark">✓</span>' : ''}
            ${isLocked ? '<span class="stage-locked-mark">🔒</span>' : ''}
        `;
        map2.appendChild(node);
    });
    
    // 第3章のマップ描画
    const map3 = el("story-map-3");
    map3.innerHTML = "";
    STORY_STAGES.chapter3.forEach((stage, index) => {
        const stageNum = index + 1;
        const isCompleted = storyProgress.chapter3 >= stageNum;
        const isLocked = (storyProgress.chapter2 < 7) || (storyProgress.chapter3 < stageNum - 1);
        const isCurrent = storyProgress.chapter3 === stageNum - 1 && !isCompleted && storyProgress.chapter2 >= 7;
        
        const node = document.createElement("div");
        node.className = `stage-node ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''} ${stage.boss ? 'boss-stage' : ''} ${isCurrent ? 'current' : ''}`;
        node.onclick = () => !isLocked && selectStage(3, stageNum);
        
        node.innerHTML = `
            <div class="stage-number">3-${stageNum}</div>
            <div class="stage-target">${stage.target}</div>
            ${isCompleted ? '<span class="stage-complete-mark">✓</span>' : ''}
            ${isLocked ? '<span class="stage-locked-mark">🔒</span>' : ''}
        `;
        map3.appendChild(node);
    });
    
    // チャプタータブ切り替え
    document.querySelectorAll('.chapter-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.chapter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.story-chapter').forEach(ch => ch.classList.add('hidden'));
            el(`story-chapter-${tab.dataset.chapter}`).classList.remove('hidden');
        };
    });
}

// ステージ選択
function selectStage(chapter, stage) {
    currentStage = { chapter, stage };
    const stageData = chapter === 1 ? 
        STORY_STAGES.chapter1[stage - 1] : 
        chapter === 2 ?
        STORY_STAGES.chapter2[stage - 1] :
        STORY_STAGES.chapter3[stage - 1];
    
    el("stage-title").innerText = `${chapter}-${stage}`;
    el("stage-time").innerText = "60";
    el("stage-target").innerText = stageData.target;
    el("stage-reward").innerText = stageData.reward;
    
    if (stageData.boss) {
        el("boss-info").classList.remove("hidden");
        if (stageData.skill === "hanabi") {
            el("boss-skill-name").innerText = "花火";
        } else if (stageData.skill === "hacker_milestone4") {
            el("boss-skill-name").innerText = "ハッカーマイルストーン4";
        } else if (stageData.skill === "graveyard") {
            el("boss-skill-name").innerText = "墓地強化";
        }
        
        // ボススキルの取得状態を表示
        const skillId = stageData.skill;
        if (ownedSkills.includes(skillId)) {
            el("boss-skill-name").innerHTML += ' <span style="color: var(--accent-green);">(獲得済み)</span>';
        } else {
            el("boss-skill-name").innerHTML += ' <span style="color: var(--accent-red);">(未獲得)</span>';
        }
    } else {
        el("boss-info").classList.add("hidden");
    }
    
    // ボタン状態の更新
    updateStageButtons();
    
    openScreen("screen-stage-detail");
}

// ステージボタンの状態更新
function updateStageButtons() {
    const soloBtn = el("story-solo-btn");
    const partyBtn = el("story-party-btn");
    const restrictionMsg = el("party-restriction-msg");
    
    // パーティー参加中は一人プレイボタンを非表示
    if (myPartyId) {
        soloBtn.style.display = "none";
    } else {
        soloBtn.style.display = "block";
    }
    soloBtn.disabled = false;
    
    if (myPartyId && isLeader) {
        partyBtn.style.display = "block";
        partyBtn.disabled = false;
        checkPartyProgress();
    } else {
        partyBtn.style.display = myPartyId ? "block" : "none";
        partyBtn.disabled = true;
        restrictionMsg.classList.add("hidden");
    }
}

// パーティーメンバーの進行状況チェック
async function checkPartyProgress() {
    if (!myPartyId) return;
    
    const snap = await get(ref(db, `parties/${myPartyId}/members`));
    const members = snap.val();
    if (!members) return;
    
    const memberIds = Object.keys(members).filter(id => id !== myId);
    let allCleared = true;
    
    for (const mid of memberIds) {
        const userSnap = await get(ref(db, `users/${mid}/story_progress`));
        const progress = userSnap.val() || { chapter1: 0, chapter2: 0, chapter3: 0 };
        
        if (currentStage.chapter === 1) {
            if (progress.chapter1 < currentStage.stage - 1) {
                allCleared = false;
                break;
            }
        } else if (currentStage.chapter === 2) {
            if (progress.chapter2 < currentStage.stage - 1) {
                allCleared = false;
                break;
            }
        } else {
            if (progress.chapter3 < currentStage.stage - 1) {
                allCleared = false;
                break;
            }
        }
    }
    
    const msg = el("party-restriction-msg");
    if (!allCleared) {
        msg.classList.remove("hidden");
        el("story-party-btn").disabled = true;
    } else {
        msg.classList.add("hidden");
        el("story-party-btn").disabled = false;
    }
}

// ストーリーモードソロプレイ開始
window.startStorySolo = () => {
    if (myPartyId) {
        alert("パーティー参加中は一人プレイできません");
        return;
    }
    
    const stageData = currentStage.chapter === 1 ?
        STORY_STAGES.chapter1[currentStage.stage - 1] :
        currentStage.chapter === 2 ?
        STORY_STAGES.chapter2[currentStage.stage - 1] :
        STORY_STAGES.chapter3[currentStage.stage - 1];
    
    const diffs = ["easy", "normal", "hard"];
    const randomDiff = diffs[Math.floor(Math.random() * diffs.length)];
    currentWords = WORD_DB[randomDiff];
    
    isStoryMode = true;
    storyTargetScore = stageData.target;
    isCustomGame = false;
    
    const progressBar = el("story-progress-bar");
    progressBar.classList.remove("hidden");
    el("progress-target").innerText = storyTargetScore;
    updateProgressBar(0);
    
    openScreen("screen-play");
    startGame(60);
};

// ストーリーモードパーティープレイ開始
window.startStoryParty = () => {
    if (!myPartyId || !isLeader) {
        alert("パーティーリーダーのみ開始できます");
        return;
    }
    
    const stageData = currentStage.chapter === 1 ?
        STORY_STAGES.chapter1[currentStage.stage - 1] :
        currentStage.chapter === 2 ?
        STORY_STAGES.chapter2[currentStage.stage - 1] :
        STORY_STAGES.chapter3[currentStage.stage - 1];
    
    update(ref(db, `parties/${myPartyId}`), {
        state: "ready_check",
        time: 60,
        diff: "normal",
        storyMode: true,
        storyTarget: stageData.target,
        storyChapter: currentStage.chapter,
        storyStage: currentStage.stage
    });
};

// ストーリー画面に戻る
window.backToStory = () => {
    openScreen("screen-story");
    renderStoryMap();
};

// 避けるボタン実行
window.executeDodge = () => {
    if (window.dodgeCallback) {
        window.dodgeCallback(true);
    }
};

// --- ボイスチャット機能（音声認識＋効果音版）---
function openVoiceChat() {
    console.log("ボイスチャットを開きます");
    const overlay = el("debug-overlay");
    if (overlay) {
        overlay.classList.remove("hidden");
        renderVoiceFriendList();
        initVoiceChat();
        createVoiceChatBar(); // 常時表示バーを作成
        alert("🎤 ボイスチャットモードを起動しました");
    } else {
        console.error("debug-overlayが見つかりません");
        alert("ボイスチャット画面が見つかりません");
    }
}

// 常時表示のボイスチャットバーを作成
function createVoiceChatBar() {
    // 既存のバーがあれば削除
    const existingBar = document.getElementById("voice-chat-bar");
    if (existingBar) existingBar.remove();
    
    const bar = document.createElement("div");
    bar.id = "voice-chat-bar";
    bar.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid var(--accent-purple);
        border-radius: 50px;
        padding: 10px 20px;
        display: flex;
        gap: 20px;
        align-items: center;
        z-index: 20001;
        backdrop-filter: blur(5px);
        box-shadow: 0 0 20px var(--accent-purple);
    `;
    
    // 参加者表示
    const participantsSpan = document.createElement("span");
    participantsSpan.id = "voice-bar-participants";
    participantsSpan.style.color = "white";
    participantsSpan.innerHTML = `👥 参加者: ${myName}`;
    
    // 声の種類選択
    const voiceSelect = document.createElement("select");
    voiceSelect.style.cssText = `
        background: #333;
        color: white;
        border: 1px solid var(--accent-blue);
        padding: 5px;
        border-radius: 5px;
    `;
    voiceSelect.innerHTML = `
        <option value="male">👨 男性の声</option>
        <option value="female">👩 女性の声</option>
        <option value="robot">🤖 ロボットの声</option>
    `;
    voiceSelect.onchange = (e) => {
        voiceType = e.target.value;
    };
    
    // ミュートボタン
    const muteBtn = document.createElement("button");
    muteBtn.innerHTML = voiceMuted ? "🔇 ミュート解除" : "🔊 ミュート";
    muteBtn.style.cssText = `
        background: ${voiceMuted ? '#666' : 'var(--accent-blue)'};
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 20px;
        cursor: pointer;
        font-weight: bold;
    `;
    muteBtn.onclick = toggleVoiceMute;
    
    // 通話終了ボタン
    const endBtn = document.createElement("button");
    endBtn.innerHTML = "📞 通話終了";
    endBtn.style.cssText = `
        background: var(--accent-red);
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 20px;
        cursor: pointer;
        font-weight: bold;
    `;
    endBtn.onclick = () => {
        closeDebugMode();
    };
    
    bar.appendChild(participantsSpan);
    bar.appendChild(voiceSelect);
    bar.appendChild(muteBtn);
    bar.appendChild(endBtn);
    
    document.body.appendChild(bar);
    
    window.voiceBarMuteBtn = muteBtn;
}

// ミュート切り替え
function toggleVoiceMute() {
    voiceMuted = !voiceMuted;
    
    if (voiceMuted && recognition) {
        recognition.stop();
        isListening = false;
    } else if (!voiceMuted && !isListening) {
        startListening();
    }
    
    if (window.voiceBarMuteBtn) {
        window.voiceBarMuteBtn.innerHTML = voiceMuted ? "🔇 ミュート解除" : "🔊 ミュート";
        window.voiceBarMuteBtn.style.background = voiceMuted ? '#666' : 'var(--accent-blue)';
    }
}

// 音声認識の初期化
function initVoiceChat() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("お使いのブラウザは音声認識に対応していません");
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
        if (voiceMuted) return;
        
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;
        console.log("認識結果:", text);
        
        // 認識されたテキストを音声効果に変換
        playVoiceEffect(text);
        
        // 参加者に音声効果を送信
        sendVoiceEffect(text);
    };
    
    recognition.onerror = (event) => {
        console.error("音声認識エラー:", event.error);
        if (event.error === 'not-allowed') {
            alert("マイクの使用が許可されていません");
        }
    };
    
    recognition.onend = () => {
        if (!voiceMuted && voiceChatActive) {
            // 自動的に再開
            startListening();
        }
    };
    
    // 音声認識開始
    startListening();
}

// 音声認識開始
function startListening() {
    if (recognition && !isListening && !voiceMuted) {
        try {
            recognition.start();
            isListening = true;
            console.log("音声認識開始");
        } catch (e) {
            console.error("音声認識開始エラー:", e);
        }
    }
}

// 音声効果を再生
function playVoiceEffect(text) {
    // テキストから発音の種類を判断（簡易版）
    // 実際には形態素解析などが必要だが、ここでは文字数と最初の文字で判断
    const firstChar = text.charAt(0);
    const charCode = firstChar.charCodeAt(0);
    const index = Math.floor(Math.random() * 5); // 0-4のランダム
    
    let soundArray;
    switch(voiceType) {
        case 'female':
            soundArray = sounds.voiceFemale;
            break;
        case 'robot':
            soundArray = sounds.voiceRobot;
            break;
        default:
            soundArray = sounds.voiceMale;
    }
    
    // ランダムな効果音を再生
    const sound = soundArray[Math.floor(Math.random() * soundArray.length)];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("音声再生エラー:", e));
    }
}

// 音声効果を相手に送信
function sendVoiceEffect(text) {
    if (!voiceChatActive || voiceParticipants.length === 0) return;
    
    voiceParticipants.forEach(pid => {
        if (pid !== myId) {
            const effectId = generateId();
            update(ref(db, `users/${pid}/voice_effect`), {
                from: myId,
                fromName: myName,
                voiceType: voiceType,
                text: text,
                timestamp: Date.now()
            });
            
            // 1秒後に削除
            setTimeout(() => {
                remove(ref(db, `users/${pid}/voice_effect`));
            }, 1000);
        }
    });
}

// 音声効果の受信監視
onValue(ref(db, `users/${myId}/voice_effect`), snap => {
    const effect = snap.val();
    if (effect && voiceChatActive) {
        // 相手の声の種類で効果音を再生
        const soundArray = effect.voiceType === 'female' ? sounds.voiceFemale :
                          effect.voiceType === 'robot' ? sounds.voiceRobot :
                          sounds.voiceMale;
        
        const sound = soundArray[Math.floor(Math.random() * soundArray.length)];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log("音声再生エラー:", e));
        }
        
        // バーの参加者表示を更新（相手が話していることを示す）
        const bar = document.getElementById("voice-chat-bar");
        if (bar) {
            const participantsSpan = document.getElementById("voice-bar-participants");
            if (participantsSpan) {
                participantsSpan.innerHTML = `👥 参加者: ${myName}, ${effect.fromName} (話し中)`;
                setTimeout(() => {
                    participantsSpan.innerHTML = `👥 参加者: ${myName}, ${effect.fromName}`;
                }, 1000);
            }
        }
    }
});

window.closeDebugMode = () => {
    endVoiceChat();
    el("debug-overlay").classList.add("hidden");
    const bar = document.getElementById("voice-chat-bar");
    if (bar) bar.remove();
};

function renderVoiceFriendList() {
    const voiceFriendList = el("voice-friend-list");
    if (!voiceFriendList) return;
    
    voiceFriendList.innerHTML = "";
    
    get(ref(db, `users/${myId}/friends`)).then(snap => {
        const friends = snap.val();
        if (!friends || Object.keys(friends).length === 0) {
            voiceFriendList.innerHTML = '<div class="voice-friend-item" style="text-align: center; padding: 20px;">フレンドがまだいません</div>';
            return;
        }
        
        let loadedCount = 0;
        const totalFriends = Object.keys(friends).length;
        
        Object.keys(friends).forEach(fid => {
            get(ref(db, `users/${fid}`)).then(userSnap => {
                const userData = userSnap.val();
                if (!userData) return;
                
                const friendDiv = document.createElement("div");
                friendDiv.className = "voice-friend-item";
                friendDiv.innerHTML = `
                    <div class="voice-friend-info">
                        <span class="status-dot ${userData.status || 'offline'}"></span>
                        <span class="voice-friend-name">${userData.name}</span>
                    </div>
                    <button class="voice-invite-btn" onclick="window.inviteToVoiceChat('${fid}', '${userData.name}')">ボイチャ招待</button>
                `;
                voiceFriendList.appendChild(friendDiv);
                
                loadedCount++;
                if (loadedCount === totalFriends) {
                    console.log("フレンドリストの読み込み完了");
                }
            });
        });
    }).catch(error => {
        console.error("フレンドリストの取得に失敗:", error);
        voiceFriendList.innerHTML = '<div class="voice-friend-item" style="text-align: center; padding: 20px;">フレンドリストの読み込みに失敗しました</div>';
    });
}

window.inviteToVoiceChat = (fid, friendName) => {
    if (!voiceChatActive) {
        alert('先にボイスチャットを起動してください');
        return;
    }
    
    // ボイスチャット招待を送信
    set(ref(db, `users/${fid}/voice_invite`), {
        from: myId,
        fromName: myName,
        timestamp: Date.now()
    }).then(() => {
        alert(`${friendName} にボイスチャット招待を送信しました`);
    }).catch(error => {
        console.error("招待の送信に失敗:", error);
        alert("招待の送信に失敗しました");
    });
};

// ボイスチャット招待の受信監視
if (voiceInviteListener) {
    off(voiceInviteListener);
}
voiceInviteListener = onValue(ref(db, `users/${myId}/voice_invite`), snap => {
    const invite = snap.val();
    if (invite && !voiceChatActive) {
        // 招待が来たら確認ダイアログを表示
        const result = confirm(`${invite.fromName} からボイスチャットの招待が来ています。参加しますか？`);
        if (result) {
            // ボイスチャットを起動
            openVoiceChat();
            setTimeout(() => {
                // 参加者リストに追加
                if (!voiceParticipants.includes(invite.from)) {
                    voiceParticipants.push(invite.from);
                    
                    // バーの表示を更新
                    const bar = document.getElementById("voice-chat-bar");
                    if (bar) {
                        const participantsSpan = document.getElementById("voice-bar-participants");
                        if (participantsSpan) {
                            participantsSpan.innerHTML = `👥 参加者: ${myName}, ${invite.fromName}`;
                        }
                    }
                }
            }, 1000);
        }
        // 招待を削除
        remove(ref(db, `users/${myId}/voice_invite`));
    }
});

function endVoiceChat() {
    voiceChatActive = false;
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
    isListening = false;
    voiceParticipants = [];
    voiceMuted = false;
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
        if(data.story_progress !== undefined) {
            storyProgress = data.story_progress;
        }
    }
    saveAndDisplayData(); 
});

update(userRef, { name: myName, status: "online", partyId: null, story_progress: storyProgress });
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
