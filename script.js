// =========================================
// ULTIMATE TYPING ONLINE - RAMO EDITION
// FIREBASE & TYPING ENGINE V16.0 (完全修正版)
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
    coin: new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3"),
    cut: new Audio("https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3"),
    blood: new Audio("https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3"),
    laugh: new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"),
    hack: new Audio("https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3")
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
let gameInterval; 
let gameStartTime = null;

let coins = parseInt(localStorage.getItem("ramo_coins")) || 1000;

// --- コードシステム用グローバル変数 ---
let usedCodes = JSON.parse(localStorage.getItem("ramo_used_codes")) || [];
let dailyCode = localStorage.getItem("ramo_daily_code") || generateDailyCode();
let dailyCodeDate = localStorage.getItem("ramo_daily_date") || new Date().toDateString();
let codeTimer = null;

// 特殊コード使用フラグ
let tysmUsed = localStorage.getItem("ramo_tysm_used") === "true";
let byramoUsed = localStorage.getItem("ramo_byramo_used") === "true";
let yuseSyazai2Used = localStorage.getItem("ramo_yuseSyazai2_used") === "true";

// コンボアップの神スキル
let comboGodActive = false;
let comboGodTimer = null;

// --- スキンシステム ---
let skinData = JSON.parse(localStorage.getItem("ramo_skin")) || {
    skin: "skin-1",
    face: "face-1",
    accessories: []
};
let equippedAccessory = localStorage.getItem("ramo_accessory") || null;

// アクセサリーデータ
const ACCESSORY_DB = {
    headphone1: { id: "headphone1", name: "ヘッドフォン", cost: 5000, emoji: "🎧" },
    banana: { id: "banana", name: "バナナ", cost: 15000, emoji: "🍌" },
    weirdglasses1: { id: "weirdglasses1", name: "変なメガネ", cost: 15000, emoji: "👓👀" },
    sunglasses: { id: "sunglasses", name: "サングラス", cost: 30000, emoji: "🕶️" },
    headphone2: { id: "headphone2", name: "高級ヘッドフォン", cost: 50000, emoji: "🎧✨" },
    guitar: { id: "guitar", name: "ギター", cost: 50000, emoji: "🎸" },
    trophySilver: { id: "trophySilver", name: "銀トロフィー", cost: 100000, emoji: "🏆" },
    weirdglasses2: { id: "weirdglasses2", name: "変なメガネ2", cost: 150000, emoji: "👓💫" },
    trophyGold: { id: "trophyGold", name: "金トロフィー", cost: 1000000, emoji: "🏆👑" },
    rich: { 
        id: "rich", 
        name: "大金持ち", 
        cost: 10000000, 
        emoji: "👑✨",
        unlocks: { 
            skin: "skin-gold", 
            face: "face-money"
        }
    }
};

// 肌の色データ
const SKIN_COLORS = {
    "skin-1": "#f5d0a9",
    "skin-2": "#f8d5b0",
    "skin-3": "#f0c08c",
    "skin-4": "#e8b17e",
    "skin-5": "#d89c6c",
    "skin-6": "#c88a5a",
    "skin-7": "#b87a4a",
    "skin-8": "#a86a3a",
    "skin-9": "#8a5a3a",
    "skin-10": "#6a4a2a",
    "skin-gold": "linear-gradient(135deg, #ffd700, #b8860b)"
};

// 顔データ
const FACE_DATA = {
    "face-1": "😊", "face-2": "🙂", "face-3": "😎", "face-4": "😲", "face-5": "😴",
    "face-6": "😠", "face-7": "😢", "face-8": "😉", "face-9": "😆", "face-10": "😇",
    "face-11": "🥳", "face-12": "🤔", "face-13": "😏", "face-14": "🥺", "face-15": "😡",
    "face-16": "🤪", "face-17": "🤓", "face-18": "🥸", "face-19": "😎", "face-20": "🤠",
    "face-21": "👽", "face-22": "🤖", "face-23": "👻", "face-24": "💀", "face-25": "🎃",
    "face-26": "😺", "face-27": "🙈", "face-28": "🐧", "face-29": "🐱", "face-30": "🐶",
    "face-money": "🤑"
};

// --- スキルシステム ---
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

// --- ストーリーモード ---
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
let bleedingActive = false;
let weakActive = false;
let weakTimer = null;
let partyStoryProgress = {};

// 偽物タイピング用変数
let fakeTypingActive = false;
let fakeTypingText = "";
let fakeTypingRoma = "";
let fakeTypingIdx = 0;
let fakeTypingTimer = null;
let fakeTypingButtonTimer = null;

// --- デバッグモード ---
let debugCode = "";
let debugActive = false;
let debugKeys = { w: false, l: false, digit8: false };

// --- チーム戦関連（改良版）---
let teamMode = "solo";
let playerTeams = {}; // { playerId: "red" or "blue" }
let memberHandicaps = {}; // メンバー個別のハンデ { memberId: handicapType }

// --- ハンデ関連（5種類）---
let handicapNoTypeTimer = null;
let handicapSlowTimer = null;
let handicapHalfTimeTimer = null;
let handicapSkillSealTimer = null;

// --- 修行モード関連 ---
let trainingMode = false;
let trainingAttackTimer = null;
let trainingType = 0; // 1 or 2
let trainingScore = 0;

// ストーリーモードのステージデータ（第3章追加・ロック条件修正）
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
        { stage: 1, target: 50000, reward: 1500 },
        { stage: 2, target: 50500, reward: 1600 },
        { stage: 3, target: 51000, reward: 1700 },
        { stage: 4, target: 51500, reward: 1800 },
        { stage: 5, target: 52000, reward: 1900 },
        { stage: 6, target: 52500, reward: 2000 },
        { stage: 7, target: 53000, reward: 2100 },
        { stage: 8, target: 53500, reward: 2200 },
        { stage: 9, target: 54000, reward: 2300 },
        { stage: 10, target: 70000, reward: 10000, boss: true, skill: "invincible_man" }
    ]
};

// 新しいスキルの追加（完全版）
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
    comboGod: {
        id: "comboGod",
        name: "コンボアップの神",
        cost: 0,
        cooldown: 0,
        desc: "【1回のみ使用可能】7秒間、コンボの数が3.5倍になる",
        special: true
    },
    invincible_man: {
        id: "invincible_man",
        name: "無敵マン",
        cost: 0,
        cooldown: 0,
        desc: "【無敵/キー:1】CT30秒: 15秒間、全ての妨害・スタン・スコア奪取を無効化（虹色エフェクト）\n【相手は最弱/キー:2】CT30秒: 相手を10秒間最弱状態にする（画面くらくら、タイピングミスで3秒スタン）",
        boss: true,
        chapter: 3,
        stage: 10,
        requirement: "第3章 3-10 クリア"
    },
    swordsman: {
        id: "swordsman",
        name: "剣士",
        cost: 0,
        cooldown: 0,
        desc: "【切りつけ/キー:1】CT15秒: 相手を3秒スタン、切り傷エフェクト、5秒間血の効果（毎秒コンボ-3）\n【大きな傷/キー:2】CT30秒: 相手を6秒スタン、大きな傷、血の効果10秒、最弱効果12秒",
        training: true,
        trainingLevel: 1
    },
    hacker_trainee: {
        id: "hacker_trainee",
        name: "ハッカー修行人",
        cost: 0,
        cooldown: 0,
        desc: "【タブ追加/キー:1】CT35秒: 消せるタブを10個出す\n【画面操作/キー:2】CT25秒: 画面を2回転＆くらくら（3秒）\n【偽物タイピング/キー:3】CT200秒: 偽物タイピングを表示\n【StarterGui/キー:Space】CT5000秒: ハッキング＆ウイルス表示、5秒後スキル封印10秒＆コンボ半減",
        training: true,
        trainingLevel: 2
    }
};

// ガチャキャラクターデータベース
const GACHA_CHAR_DB = {
    paintballer: {
        id: "paintballer",
        name: "ペイントボーラー",
        rarity: "R",
        desc: "【ペイント】CT15秒: 相手の画面全体を5秒間ピンク色のペイントで塗り潰す",
        cooldown: 15,
        gacha: true
    },
    banana: {
        id: "banana",
        name: "バナナ",
        rarity: "R",
        desc: "【バナナをしく】CT5秒: バナナを設置。スコア奪取攻撃を受けると相手を3秒スタン",
        cooldown: 5,
        gacha: true
    },
    slate: {
        id: "slate",
        name: "スレート",
        rarity: "R",
        desc: "【パッシブ】スタン無効",
        cooldown: 0,
        gacha: true
    },
    trapper: {
        id: "trapper",
        name: "トラッパー",
        rarity: "SR",
        desc: "【トラップ】CT15秒: トラップ設置\n【免疫力】CT200秒: スタン解除",
        cooldown: 15,
        gacha: true
    },
    rifleman: {
        id: "rifleman",
        name: "ライフルマン",
        rarity: "SR",
        desc: "【ヘッドショット】CT45秒: ランダムな相手を5秒スタン＆ゆらゆら",
        cooldown: 45,
        gacha: true
    },
    narrator: {
        id: "narrator",
        name: "ナレーター",
        rarity: "UR",
        desc: "【アクションゲーム】CT150秒\n【パズルゲーム】CT100秒\n【メガホン】CT10秒: 画面ぼやけ",
        cooldown: 150,
        gacha: true
    }
};

// スキルデータベース統合
const SKILL_DB = {
    punch: { id: "punch", name: "パンチ", cost: 15000, cooldown: 45, desc: "相手は3秒間タイピング不可" },
    autotype: { id: "autotype", name: "自動入力", cost: 50000, cooldown: 25, desc: "3秒間爆速で自動タイピング" },
    comboUp: { id: "comboUp", name: "コンボアップ", cost: 50000, cooldown: 35, desc: "5秒間コンボ増加量が2倍" },
    revolver: { id: "revolver", name: "リボルバー", cost: 100000, cooldown: 45, desc: "相手は6秒間タイピング不可＆500スコア奪う" },
    thief: { id: "thief", name: "泥棒", cost: 75000, cooldown: 25, desc: "相手から1200スコア奪う" },
    timeslip: { id: "timeslip", name: "タイムスリップ", cost: 250000, cooldown: 0, desc: "【1回使い切り】相手のスコアを1000〜3000減少、3秒間自動入力" },
    fundraiser: { id: "fundraiser", name: "資金稼ぎ", cost: 15000, cooldown: 0, desc: "【パッシブ】試合後にもらえるコインが常に2倍になる" },
    godfundraiser: { id: "godfundraiser", name: "神資金稼ぎ", cost: 100000, cooldown: 0, desc: "【パッシブ】試合後にもらえるコインが常に4倍になる" },
    godfather: { id: "godfather", name: "ゴッドファザー", cost: 50000, cooldown: 25, desc: "【任務/Space】10秒間、タイピング成功時に(コンボ数×5)のコインを獲得" },
    hacker: { id: "hacker", name: "ハッカー", cost: 250000, cooldown: 0, desc: "【タブ追加/キー:1】CT30秒: タブ10個\n【ウイルス/キー:2】CT70秒: スタン＆800スコア奪取" },
    accelerator: { id: "accelerator", name: "アクセラレーター", cost: 500000, cooldown: 0, desc: "【熱い温度/キー:1】CT40秒: ぼやけ\n【特別加熱/キー:2】CT70秒: スタン＆500減少\n【自爆/キー:3】CT200秒: 自スコア3000減＆相手コンボ0" },
    ...NEW_SKILLS,
    ...Object.fromEntries(
        Object.entries(GACHA_CHAR_DB).map(([key, val]) => [key, { ...val, cost: 0 }])
    )
};

// ガチャ関連
const GACHA_COST = 50000;
const GACHA_COST_10 = 450000;

const GACHA_RATES = {
    R: 75,
    SR: 23.5,
    UR: 1.5
};

const GACHA_CHARS_BY_RARITY = {
    R: Object.values(GACHA_CHAR_DB).filter(c => c.rarity === 'R').map(c => c.id),
    SR: Object.values(GACHA_CHAR_DB).filter(c => c.rarity === 'SR').map(c => c.id),
    UR: Object.values(GACHA_CHAR_DB).filter(c => c.rarity === 'UR').map(c => c.id)
};

// ガチャ能力用変数
let bananaStacks = 0;
let trapperStacks = 0;
let isStunned = false;
let stunTimer = null;
let invincibleActive = false;
let invincibleTimer = null;
let skillSealed = false;
let skillSealTimer = null;

// 効果残り時間表示用変数
let effectTimers = {
    stun: null,
    jamming: null,
    poison: null,
    sway: null,
    maze: null,
    hacking: null,
    blur: null,
    paint: null,
    bleeding: null,
    weak: null
};

// パーティーメンバー情報キャッシュ
let partyMembers = {};

// --- デイリーコード生成関数 ---
function generateDailyCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// デイリーコードの更新チェック
function checkDailyCode() {
    const now = new Date();
    const today = now.toDateString();
    
    if (dailyCodeDate !== today) {
        dailyCode = generateDailyCode();
        dailyCodeDate = today;
        const dailyUsedCodes = usedCodes.filter(code => code !== dailyCode);
        usedCodes = dailyUsedCodes;
        localStorage.setItem("ramo_daily_code", dailyCode);
        localStorage.setItem("ramo_daily_date", dailyCodeDate);
        localStorage.setItem("ramo_used_codes", JSON.stringify(usedCodes));
        
        const userRef = ref(db, `users/${myId}`);
        update(userRef, {
            daily_code: dailyCode,
            daily_code_date: dailyCodeDate
        }).catch(err => console.error("Firebase daily code update error:", err));
    }
    
    updateDailyCodeDisplay();
}

function updateDailyCodeDisplay() {
    const dailyCodeEl = el("daily-code");
    if (dailyCodeEl) dailyCodeEl.innerText = dailyCode;
}

function getTimeUntilNextUpdate() {
    const now = new Date();
    const nextUpdate = new Date();
    nextUpdate.setHours(7, 0, 0, 0);
    
    if (now > nextUpdate) nextUpdate.setDate(nextUpdate.getDate() + 1);
    
    const diff = nextUpdate - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startCodeTimer() {
    if (codeTimer) clearInterval(codeTimer);
    codeTimer = setInterval(() => {
        const timerEl = el("daily-code-timer");
        if (timerEl) timerEl.innerText = `更新まで: ${getTimeUntilNextUpdate()}`;
    }, 1000);
}

// --- コード入力UI ---
window.openCodeUI = () => {
    checkDailyCode();
    updateDailyCodeDisplay();
    startCodeTimer();
    el("code-ui").classList.remove("hidden");
};

window.closeCodeUI = () => {
    if (codeTimer) clearInterval(codeTimer);
    el("code-ui").classList.add("hidden");
    el("code-input").value = "";
};

async function loadCodeStatusFromFirebase() {
    try {
        const userRef = ref(db, `users/${myId}`);
        const snap = await get(userRef);
        if (snap.exists()) {
            const data = snap.val();
            if (data.tysm_used !== undefined) tysmUsed = data.tysm_used;
            if (data.byramo_used !== undefined) byramoUsed = data.byramo_used;
            if (data.yuseSyazai2_used !== undefined) yuseSyazai2Used = data.yuseSyazai2_used;
            if (data.daily_code) dailyCode = data.daily_code;
            if (data.daily_code_date) dailyCodeDate = data.daily_code_date;
            if (data.used_codes) usedCodes = data.used_codes;
            
            localStorage.setItem("ramo_tysm_used", tysmUsed.toString());
            localStorage.setItem("ramo_byramo_used", byramoUsed.toString());
            localStorage.setItem("ramo_yuseSyazai2_used", yuseSyazai2Used.toString());
            localStorage.setItem("ramo_daily_code", dailyCode);
            localStorage.setItem("ramo_daily_date", dailyCodeDate);
            localStorage.setItem("ramo_used_codes", JSON.stringify(usedCodes));
        }
    } catch (err) {
        console.error("Firebase code status load error:", err);
    }
}

async function resetAllData() {
    localStorage.clear();
    const userRef = ref(db, `users/${myId}`);
    await set(userRef, {
        name: myName,
        status: "online",
        partyId: null,
        coins: 1000,
        skills: ["none"],
        equipped: "none",
        story_progress: { chapter1: 0, chapter2: 0, chapter3: 0 },
        skin: { skin: "skin-1", face: "face-1", accessories: [] },
        accessory: null,
        tysm_used: false,
        byramo_used: false,
        yuseSyazai2_used: false,
        daily_code: dailyCode,
        daily_code_date: dailyCodeDate,
        used_codes: [],
        lastSeen: Date.now()
    });
    
    coins = 1000;
    ownedSkills = ["none"];
    equippedSkill = "none";
    storyProgress = { chapter1: 0, chapter2: 0, chapter3: 0 };
    skinData = { skin: "skin-1", face: "face-1", accessories: [] };
    equippedAccessory = null;
    tysmUsed = false;
    byramoUsed = false;
    yuseSyazai2Used = false;
    usedCodes = [];
    
    saveAndDisplayData();
    alert("すべてのデータをリセットしました。");
}

window.submitCode = async () => {
    const input = el("code-input").value.trim().toUpperCase();
    if (!input) return;
    
    await loadCodeStatusFromFirebase();
    
    if (input === "BA3") {
        if (confirm("本当にすべてのデータをリセットしますか？")) {
            await resetAllData();
        }
        el("code-input").value = "";
        closeCodeUI();
        return;
    }
    
    if (input === "TYSM") {
        if (tysmUsed) {
            alert("このコードは既に使用済みです！");
        } else {
            coins += 25000;
            tysmUsed = true;
            usedCodes.push("TYSM");
            
            localStorage.setItem("ramo_tysm_used", "true");
            localStorage.setItem("ramo_used_codes", JSON.stringify(usedCodes));
            
            const userRef = ref(db, `users/${myId}`);
            await update(userRef, {
                tysm_used: true,
                used_codes: usedCodes,
                coins: coins
            });
            
            sounds.coin.play();
            alert(`🎉 TYSMコード入力成功！\n25,000コインを獲得しました！`);
            saveAndDisplayData();
        }
    }
    else if (input === "BYRAMO") {
        if (byramoUsed) {
            alert("このコードは既に使用済みです！");
        } else {
            if (!ownedSkills.includes("comboGod")) {
                ownedSkills.push("comboGod");
                byramoUsed = true;
                usedCodes.push("BYRAMO");
                
                localStorage.setItem("ramo_byramo_used", "true");
                localStorage.setItem("ramo_skills", JSON.stringify(ownedSkills));
                localStorage.setItem("ramo_used_codes", JSON.stringify(usedCodes));
                
                const userRef = ref(db, `users/${myId}`);
                await update(userRef, {
                    byramo_used: true,
                    skills: ownedSkills,
                    used_codes: usedCodes
                });
                
                sounds.notify.play();
                alert(`🎉 ByRamoコード入力成功！\n「コンボアップの神」スキルを獲得しました！`);
                saveAndDisplayData();
            }
        }
    }
    else if (input === "YUSESYAZAI2") {
        if (yuseSyazai2Used) {
            alert("このコードは既に使用済みです！");
        } else {
            coins += 200000000;
            yuseSyazai2Used = true;
            usedCodes.push("YUSESYAZAI2");
            
            localStorage.setItem("ramo_yuseSyazai2_used", "true");
            localStorage.setItem("ramo_used_codes", JSON.stringify(usedCodes));
            
            const userRef = ref(db, `users/${myId}`);
            await update(userRef, {
                yuseSyazai2_used: true,
                used_codes: usedCodes,
                coins: coins
            });
            
            sounds.coin.play();
            sounds.coin.play();
            alert(`🎉✨ YuseSyazai2コード入力成功！\n200,000,000コインを獲得しました！ ✨🎉`);
            saveAndDisplayData();
        }
    }
    else if (input === dailyCode) {
        if (usedCodes.includes(dailyCode)) {
            alert("このコードは既に使用済みです！");
        } else {
            const reward = Math.floor(Math.random() * 4500) + 500;
            coins += reward;
            usedCodes.push(dailyCode);
            
            localStorage.setItem("ramo_used_codes", JSON.stringify(usedCodes));
            
            const userRef = ref(db, `users/${myId}`);
            await update(userRef, {
                used_codes: usedCodes,
                coins: coins
            });
            
            sounds.coin.play();
            alert(`🎉 デイリーコード入力成功！\n${reward.toLocaleString()}コインを獲得しました！`);
            saveAndDisplayData();
        }
    } else {
        alert("無効なコードです");
    }
    
    el("code-input").value = "";
};

// --- コンボアップの神スキル発動 ---
function activateComboGod() {
    if (comboGodActive) return;
    if (!ownedSkills.includes("comboGod")) {
        alert("「コンボアップの神」スキルを所持していません");
        return;
    }
    
    comboGodActive = true;
    const originalMultiplier = comboMultiplier;
    comboMultiplier *= 3.5;
    
    showBattleAlert("✨ コンボアップの神発動！7秒間コンボ3.5倍！", "#FFD700");
    sounds.notify.play();
    
    if (comboGodTimer) clearTimeout(comboGodTimer);
    comboGodTimer = setTimeout(() => {
        comboGodActive = false;
        comboMultiplier = originalMultiplier;
        showBattleAlert("コンボアップの神終了", "#FFD700");
        
        const index = ownedSkills.indexOf("comboGod");
        if (index > -1) {
            ownedSkills.splice(index, 1);
            if (equippedSkill === "comboGod") equippedSkill = "none";
            saveAndDisplayData();
            
            const userRef = ref(db, `users/${myId}`);
            update(userRef, {
                skills: ownedSkills,
                equipped: equippedSkill
            }).catch(err => console.error("Firebase skill update error:", err));
        }
    }, 7000);
}

// --- セーブデータ保存・表示更新 ---
function saveAndDisplayData() {
    localStorage.setItem("ramo_coins", coins);
    localStorage.setItem("ramo_skills", JSON.stringify(ownedSkills));
    localStorage.setItem("ramo_equipped", equippedSkill);
    localStorage.setItem("ramo_story_progress", JSON.stringify(storyProgress));
    localStorage.setItem("ramo_skin", JSON.stringify(skinData));
    localStorage.setItem("ramo_accessory", equippedAccessory);
    localStorage.setItem("ramo_used_codes", JSON.stringify(usedCodes));
    localStorage.setItem("ramo_tysm_used", tysmUsed.toString());
    localStorage.setItem("ramo_byramo_used", byramoUsed.toString());
    localStorage.setItem("ramo_yuseSyazai2_used", yuseSyazai2Used.toString());
    
    if (el("coin-amount")) el("coin-amount").innerText = coins.toLocaleString();
    if (el("shop-coin-amount")) el("shop-coin-amount").innerText = coins.toLocaleString();
    if (el("skin-coin-amount")) el("skin-coin-amount").innerText = coins.toLocaleString();
    if (el("gacha-coin-amount")) el("gacha-coin-amount").innerText = coins.toLocaleString();
    
    updateProfileFace();
    
    const userRef = ref(db, `users/${myId}`);
    get(userRef).then(snap => {
        const userData = snap.val() || {};
        update(userRef, { 
            coins: coins,
            skills: ownedSkills,
            equipped: equippedSkill,
            story_progress: storyProgress,
            skin: skinData,
            accessory: equippedAccessory,
            name: myName,
            lastUpdate: Date.now()
        });
    }).catch(err => console.error("Firebase save error:", err));
}

function updateProfileFace() {
    const profileSkin = el("profile-skin");
    const profileFace = el("profile-face-layer");
    const profileAccessory = el("profile-accessory");
    
    if (profileSkin) {
        if (skinData.skin === "skin-gold") {
            profileSkin.style.background = SKIN_COLORS["skin-gold"];
        } else {
            profileSkin.style.background = SKIN_COLORS[skinData.skin] || SKIN_COLORS["skin-1"];
        }
    }
    
    if (profileFace) profileFace.innerText = FACE_DATA[skinData.face] || "😊";
    
    if (profileAccessory) {
        if (equippedAccessory && ACCESSORY_DB[equippedAccessory]) {
            profileAccessory.innerText = ACCESSORY_DB[equippedAccessory].emoji;
            profileAccessory.style.display = "flex";
        } else {
            profileAccessory.innerText = "";
            profileAccessory.style.display = "none";
        }
    }
}

// --- 出題データ ---
const WORD_DB = {
    easy: ["ねこ","いぬ","うみ","つき","さかな","たこ","やま","はな","とり","いす","ゆめ","かぜ","あめ","ほし","そら","はし"],
    normal: ["すまーとふぉん","いんたーねっと","ぷろぐらみんぐ","しんかんせん","たいぴんぐ","ふぉん","あにめーしょん","うみのせかい"],
    hard: ["じぶんだけのものものものすごくひろいせかい","るびーちゃんのあいすくりーむ","ばくだいなせかいがまちうけている","ぷろぐらまーのぷろぐらみんぐ","このげーむをつくったひとはらもです","おあそびはここまでだここからがほんばん","ゆーちゅーぶぷれみあむはさいこうである","いしばしをよくたたいてわたる"]
};

function updateButtonStates() {
    const isBusy = isMatchmaking || trainingMode;
    const btnSingle = el("btn-single");
    const btnParty = el("btn-party");
    const btnMatch = el("btn-match");
    const btnSkin = el("btn-skin");
    const btnShop = el("btn-shop");
    const btnStory = el("btn-story");
    const btnGacha = el("btn-gacha");
    const btnTraining = el("btn-training");

    // パーティー中でもスキルショップとガチャは使用可能に
    if (btnSingle) btnSingle.disabled = isBusy || myPartyId !== null;
    if (btnParty) btnParty.disabled = isMatchmaking || trainingMode; 
    if (btnMatch) btnMatch.disabled = isBusy || myPartyId !== null;
    if (btnSkin) btnSkin.disabled = isBusy;
    if (btnShop) btnShop.disabled = isBusy; // パーティー中でも使用可能
    if (btnStory) btnStory.disabled = isBusy;
    if (btnGacha) btnGacha.disabled = isBusy; // パーティー中でも使用可能
    if (btnTraining) btnTraining.disabled = isBusy || myPartyId !== null;
}

window.updateMyName = () => {
    myName = el("my-name-input").value || `園名：${myId}`;
    localStorage.setItem("ramo_name", myName);
    saveAndDisplayData();
};

// --- ローマ字変換（完全版：すべてのパターンに対応）---
const KANA_MAP = {
    // 基本50音
    'あ':'a', 'い':'i', 'う':'u', 'え':'e', 'お':'o',
    'か':'ka', 'き':'ki', 'く':'ku', 'け':'ke', 'こ':'ko',
    'さ':'sa', 'し':['si','shi','ci'], 'す':'su', 'せ':'se', 'そ':'so',
    'た':'ta', 'ち':['ti','chi'], 'つ':['tu','tsu'], 'て':'te', 'と':'to',
    'な':'na', 'に':'ni', 'ぬ':'nu', 'ね':'ne', 'の':'no',
    'は':'ha', 'ひ':'hi', 'ふ':['fu','hu'], 'へ':'he', 'ほ':'ho',
    'ま':'ma', 'み':'mi', 'む':'mu', 'め':'me', 'も':'mo',
    'や':'ya', 'ゆ':'yu', 'よ':'yo',
    'ら':'ra', 'り':'ri', 'る':'ru', 'れ':'re', 'ろ':'ro',
    'わ':'wa', 'を':'wo', 'ん':['nn','n'],
    
    // 濁音・半濁音
    'が':'ga', 'ぎ':'gi', 'ぐ':'gu', 'げ':'ge', 'ご':'go',
    'ざ':'za', 'じ':['zi','ji'], 'ず':'zu', 'ぜ':'ze', 'ぞ':'zo',
    'だ':'da', 'ぢ':['di','ji'], 'づ':'du', 'で':'de', 'ど':'do',
    'ば':'ba', 'び':'bi', 'ぶ':'bu', 'べ':'be', 'ぼ':'bo',
    'ぱ':'pa', 'ぴ':'pi', 'ぷ':'pu', 'ぺ':'pe', 'ぽ':'po',
    
    // 拗音（完全版）
    'きゃ':['kya','kilya'], 'きゅ':['kyu','kilyu'], 'きょ':['kyo','kilyo'],
    'しゃ':['sya','sha','silya'], 'しゅ':['syu','shu','silyu'], 'しょ':['syo','sho','silyo'],
    'ちゃ':['tya','cha','tilya'], 'ちゅ':['tyu','chu','tilyu'], 'ちょ':['tyo','cho','tilyo'],
    'にゃ':['nya','nilya'], 'にゅ':['nyu','nilyu'], 'にょ':['nyo','nilyo'],
    'ひゃ':['hya','hilya'], 'ひゅ':['hyu','hilyu'], 'ひょ':['hyo','hilyo'],
    'みゃ':['mya','milya'], 'みゅ':['myu','milyu'], 'みょ':['myo','milyo'],
    'りゃ':['rya','rilya'], 'りゅ':['ryu','rilyu'], 'りょ':['ryo','rilyo'],
    'ぎゃ':['gya','gilya'], 'ぎゅ':['gyu','gilyu'], 'ぎょ':['gyo','gilyo'],
    'じゃ':['zya','ja','jya','jilya'], 'じゅ':['zyu','ju','jyu','jilyu'], 'じょ':['zyo','jo','jyo','jilyo'],
    'びゃ':['bya','bilya'], 'びゅ':['byu','bilyu'], 'びょ':['byo','bilyo'],
    'ぴゃ':['pya','pilya'], 'ぴゅ':['pyu','pilyu'], 'ぴょ':['pyo','pilyo'],
    
    // その他
    'ふぁ':['fa'], 'ふぃ':['fi'], 'ふぇ':['fe'], 'ふぉ':['fo'],
    'てぃ':['ti'], 'とぅ':['tu'], 'でぃ':['di'], 'どぅ':['du'],
    'うぃ':['wi'], 'うぇ':['we'], 'うぉ':['wo'],
    'ヴぁ':['va'], 'ヴぃ':['vi'], 'ヴぇ':['ve'], 'ヴぉ':['vo'],
    'つぁ':['tsa'], 'つぃ':['tsi'], 'つぇ':['tse'], 'つぉ':['tso'],
    'いぇ':['ye'],
    'くぁ':['kwa','qa'], 'くぃ':['kwi','qi'], 'くぇ':['kwe','qe'], 'くぉ':['kwo','qo'],
    'ぐぁ':['gwa'], 'ぐぃ':['gwi'], 'ぐぇ':['gwe'], 'ぐぉ':['gwo'],
    
    // 促音（っ）
    'っ': ['xtu', 'ltu']
};

function getRomaPatterns(kana) {
    let patterns = [""];
    let i = 0;
    
    while (i < kana.length) {
        // 3文字の拗音をチェック
        let char3 = kana.substring(i, i + 3);
        // 2文字の拗音をチェック
        let char2 = kana.substring(i, i + 2);
        // 1文字の通常音をチェック
        let char1 = kana.substring(i, i + 1);
        
        let candidates = [];
        
        // 3文字の拗音（「っしゃ」などの特殊ケース）
        if (char3 === 'っしゃ' || char3 === 'っしゅ' || char3 === 'っしょ' ||
            char3 === 'っちゃ' || char3 === 'っちゅ' || char3 === 'っちょ') {
            candidates = ['s', 't']; // 促音の処理
            i += 2; // 2文字進めて、次の拗音へ
        }
        // 2文字の拗音
        else if (KANA_MAP[char2]) {
            candidates = Array.isArray(KANA_MAP[char2]) ? KANA_MAP[char2] : [KANA_MAP[char2]];
            i += 2;
        }
        // 1文字の通常音
        else if (KANA_MAP[char1]) {
            candidates = Array.isArray(KANA_MAP[char1]) ? KANA_MAP[char1] : [KANA_MAP[char1]];
            i += 1;
        }
        // 促音（っ）の処理
        else if (char1 === 'っ' && i + 1 < kana.length) {
            let next = kana.substring(i + 1, i + 2);
            let nextChar = kana[i + 1];
            let nextRoma = Array.isArray(KANA_MAP[next]) ? KANA_MAP[next][0] : KANA_MAP[next];
            
            // 次の文字の最初の文字を重ねる（例：kka, tta など）
            if (nextRoma) {
                candidates = [nextRoma[0]];
            } else {
                candidates = ['xtu', 'ltu'];
            }
            i += 1;
        }
        // 不明な文字
        else {
            candidates = [char1];
            i += 1;
        }
        
        // パターンを組み合わせる
        let nextPatterns = [];
        patterns.forEach(p => {
            candidates.forEach(c => {
                nextPatterns.push(p + c);
            });
        });
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
            
            const friendSkin = data.skin || { skin: "skin-1", face: "face-1" };
            const friendFace = FACE_DATA[friendSkin.face] || "😊";
            const friendAccessory = data.accessory ? ACCESSORY_DB[data.accessory]?.emoji || "" : "";
            
            row.innerHTML = `
                <div class="friend-left">
                    <span class="status-dot ${data.status || 'offline'}"></span>
                    <div class="friend-face">
                        <span>${friendFace}</span>
                        ${friendAccessory ? `<span style="font-size: 1rem; margin-left: 2px;">${friendAccessory}</span>` : ''}
                    </div>
                    <span class="friend-name">${data.name || '不明'}</span>
                </div>
                <div class="friend-actions">
                    <button class="btn-invite btn-s" onclick="window.inviteToParty('${fid}')">招待</button>
                    <button class="btn-kick btn-s" onclick="window.removeFriend('${fid}')">削除</button>
                </div>`;
        });
    });
});

window.removeFriend = (fid) => { 
    remove(ref(db, `users/${myId}/friends/${fid}`)); 
    remove(ref(db, `users/${fid}/friends/${myId}`)); 
};

// --- パーティー機能（チーム戦・個別ハンデ対応）---
window.inviteToParty = (fid) => {
    if (!myPartyId) {
        myPartyId = myId;
        set(ref(db, `parties/${myPartyId}`), { 
            leader: myId, 
            state: "lobby", 
            members: { 
                [myId]: { 
                    name: myName, 
                    score: 0, 
                    ready: false, 
                    skin: skinData, 
                    accessory: equippedAccessory,
                    team: "red",
                    handicap: "none"
                } 
            },
            teamMode: "solo"
        });
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
    } else { 
        el("invite-toast").classList.add("hidden"); 
    }
});

window.acceptInvite = () => {
    if (gameActive || isMatchmaking || trainingMode) {
        alert("プレイ中・待機中は参加できません。");
        window.declineInvite();
        return;
    }
    get(ref(db, `users/${myId}/invite`)).then(s => {
        if(!s.exists()) return;
        const pId = s.val().partyId;
        update(ref(db, `parties/${pId}/members/${myId}`), { 
            name: myName, 
            score: 0, 
            ready: false,
            skin: skinData,
            accessory: equippedAccessory,
            team: "red",
            handicap: "none"
        });
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
            teamMode = p.teamMode || "solo";
            el("party-label").innerText = isLeader ? "パーティー (リーダー)" : "パーティー (メンバー)";
            
            if (p.members) {
                partyMembers = p.members;
                // メンバーのハンデをキャッシュ
                Object.keys(partyMembers).forEach(id => {
                    memberHandicaps[id] = partyMembers[id].handicap || "none";
                });
            }

            const membersHtml = Object.entries(p.members || {}).map(([id, m]) => {
                const memberSkin = m.skin || { skin: "skin-1", face: "face-1" };
                const memberFace = FACE_DATA[memberSkin.face] || "😊";
                const memberAccessory = m.accessory ? ACCESSORY_DB[m.accessory]?.emoji || "" : "";
                const teamColor = m.team === "red" ? "🔴" : m.team === "blue" ? "🔵" : "";
                return `<div class="friend-item">
                    <div class="friend-left">
                        <div class="friend-face">
                            <span>${memberFace}</span>
                            ${memberAccessory ? `<span style="font-size: 1rem; margin-left: 2px;">${memberAccessory}</span>` : ''}
                        </div>
                        <span class="friend-name">${m.name} ${teamColor}</span>
                        ${m.ready ? '<span style="color: var(--accent-green); margin-left: 5px;">✅</span>' : ''}
                        ${id === p.leader ? '<span style="color: var(--accent-gold); margin-left: 5px;">👑</span>' : ''}
                    </div>
                </div>`;
            }).join("");
            el("party-list-ui").innerHTML = membersHtml;
            
            // チーム設定とハンデ設定のUIを更新
            if (isLeader) {
                updateTeamSetupUI();
                updateHandicapSetupUI();
            }
            
            if (p.state === "ready_check" && !gameActive) {
                openScreen("screen-play"); 
                el("ready-overlay").classList.remove("hidden");
                el("ready-list").innerHTML = Object.values(p.members || {}).map(m => `<div>${m.name}: ${m.ready?'準備完了':'待機中...'}</div>`).join("");
                if (isLeader && Object.values(p.members || {}).every(m => m.ready)) {
                    update(ref(db, `parties/${myPartyId}`), { state: "playing" });
                }
            }
            if (p.state === "playing" && !gameActive) {
                el("ready-overlay").classList.add("hidden");
                if (p.storyMode) {
                    isStoryMode = true;
                    storyTargetScore = p.storyTarget;
                    currentStage = { chapter: p.storyChapter, stage: p.storyStage };
                    currentWords = WORD_DB[p.diff] || WORD_DB.normal;
                    
                    const progressBar = el("story-progress-bar");
                    progressBar.classList.remove("hidden");
                    el("progress-target").innerText = storyTargetScore;
                    updateProgressBar(0);
                    
                    startGame(p.time);
                } else {
                    currentWords = WORD_DB[p.diff]; 
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
        partyMembers = {};
    }
});

window.sendReady = () => {
    if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { ready: true });
};

// --- チーム設定（改良版：メンバーをクリックして赤・青を選択、確実に動作）---
window.toggleTeamSetup = () => {
    const teamSetup = el("team-setup");
    if (teamSetup) {
        teamSetup.classList.toggle("hidden");
        if (!teamSetup.classList.contains("hidden")) {
            updateTeamSetupUI();
        }
    }
};

function updateTeamSetupUI() {
    const teamList = el("team-members-list");
    if (!teamList || !partyMembers) return;
    
    teamList.innerHTML = "";
    Object.entries(partyMembers).forEach(([id, m]) => {
        const currentTeam = m.team || "red";
        const memberDiv = document.createElement("div");
        memberDiv.className = `team-member-item ${currentTeam}`;
        memberDiv.setAttribute('data-member-id', id);
        
        // クリックイベントを直接設定
        memberDiv.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log(`Team toggle clicked for ${id}, current team: ${currentTeam}`);
            toggleMemberTeam(id);
            return false;
        };
        
        memberDiv.innerHTML = `
            <span class="team-member-name">${m.name}</span>
            <span class="member-team-badge ${currentTeam}">
                ${currentTeam === "red" ? "🔴 赤" : "🔵 青"}
            </span>
        `;
        teamList.appendChild(memberDiv);
    });
}

// メンバーのチームを切り替える（赤↔青） - 確実に動作するよう改良
async function toggleMemberTeam(memberId) {
    if (!isLeader) {
        alert("リーダーのみがチームを変更できます");
        return;
    }
    
    if (!myPartyId) {
        alert("パーティーが見つかりません");
        return;
    }
    
    if (!partyMembers[memberId]) {
        alert("メンバーが見つかりません");
        return;
    }
    
    const currentTeam = partyMembers[memberId].team || "red";
    const newTeam = currentTeam === "red" ? "blue" : "red";
    
    console.log(`Changing team for ${memberId} from ${currentTeam} to ${newTeam}`);
    
    try {
        // Firebase更新
        const memberRef = ref(db, `parties/${myPartyId}/members/${memberId}/team`);
        await set(memberRef, newTeam);
        
        // ローカルキャッシュを即時更新
        if (partyMembers[memberId]) {
            partyMembers[memberId].team = newTeam;
        }
        
        // メンバーハンデキャッシュも更新
        if (memberHandicaps[memberId]) {
            memberHandicaps[memberId] = partyMembers[memberId].handicap || "none";
        }
        
        // UIを再描画
        updateTeamSetupUI();
        
        // 成功音
        sounds.notify.play();
        console.log(`Team changed successfully to ${newTeam}`);
    } catch (err) {
        console.error("チーム更新エラー:", err);
        alert("チームの変更に失敗しました: " + err.message);
    }
}

// 互換性のため残す
window.switchTeam = toggleMemberTeam;

// --- ハンデ設定（5種類対応・メンバー個別・選択状態がわかりやすく・確実に動作）---
function updateHandicapSetupUI() {
    const handicapList = el("handicap-members-list");
    if (!handicapList || !partyMembers) return;
    
    handicapList.innerHTML = "";
    Object.entries(partyMembers).forEach(([id, m]) => {
        const currentHandicap = m.handicap || "none";
        const memberFace = m.skin?.face ? FACE_DATA[m.skin.face] : "😊";
        
        const memberDiv = document.createElement("div");
        memberDiv.className = "handicap-member-item";
        memberDiv.setAttribute('data-member-id', id);
        
        // ヘッダー部分
        const headerDiv = document.createElement("div");
        headerDiv.className = "handicap-member-header";
        headerDiv.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleMemberHandicap(id);
        };
        headerDiv.innerHTML = `
            <span class="handicap-member-face">${memberFace}</span>
            <span class="handicap-member-name">${m.name}</span>
            <span class="handicap-current ${currentHandicap !== 'none' ? 'active' : ''}">${getHandicapName(currentHandicap)}</span>
        `;
        memberDiv.appendChild(headerDiv);
        
        // オプション部分 - 5種類のハンデ
        const optionsDiv = document.createElement("div");
        optionsDiv.className = `handicap-options ${currentHandicap === 'none' ? 'hidden' : ''}`;
        optionsDiv.id = `handicap-options-${id}`;
        
        const handicapTypes = [
            { value: 'none', label: '🚫 なし' },
            { value: 'no_type_10', label: '⏱️ 最初の10秒不可' },
            { value: 'score_half', label: '📉 スコア半減' },
            { value: 'skill_seal', label: '🔒 スキル封印' },
            { value: 'half_time', label: '⏳ 最初半分の時間打てない' }
        ];
        
        handicapTypes.forEach(type => {
            const optionBtn = document.createElement("button");
            optionBtn.className = `handicap-option ${currentHandicap === type.value ? 'selected' : ''}`;
            optionBtn.setAttribute('data-handicap', type.value);
            optionBtn.setAttribute('data-member-id', id);
            optionBtn.innerHTML = type.label;
            optionBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log(`Setting handicap for ${id} to ${type.value}`);
                setMemberHandicap(id, type.value);
            };
            optionsDiv.appendChild(optionBtn);
        });
        
        memberDiv.appendChild(optionsDiv);
        handicapList.appendChild(memberDiv);
    });
}

function getHandicapName(handicap) {
    const names = {
        'none': 'なし',
        'no_type_10': '最初の10秒不可',
        'score_half': 'スコア半減',
        'skill_seal': 'スキル封印',
        'half_time': '最初半分の時間打てない'
    };
    return names[handicap] || 'なし';
}

// ハンデオプションの表示/非表示を切り替え
function toggleMemberHandicap(memberId) {
    const options = document.getElementById(`handicap-options-${memberId}`);
    if (options) {
        options.classList.toggle('hidden');
    }
}

// ハンデを設定（確実に動作するよう改良）
async function setMemberHandicap(memberId, handicap) {
    if (!isLeader) {
        alert("リーダーのみがハンデを設定できます");
        return;
    }
    
    if (!myPartyId) {
        alert("パーティーが見つかりません");
        return;
    }
    
    if (!partyMembers[memberId]) {
        alert("メンバーが見つかりません");
        return;
    }
    
    console.log(`Setting handicap for ${memberId} to ${handicap}`);
    
    try {
        // Firebase更新
        const handicapRef = ref(db, `parties/${myPartyId}/members/${memberId}/handicap`);
        await set(handicapRef, handicap);
        
        // ローカルキャッシュを更新
        memberHandicaps[memberId] = handicap;
        if (partyMembers[memberId]) {
            partyMembers[memberId].handicap = handicap;
        }
        
        // オプションを非表示に戻す
        const options = document.getElementById(`handicap-options-${memberId}`);
        if (options) {
            options.classList.add('hidden');
        }
        
        // UI更新
        updateHandicapSetupUI();
        
        // 成功音
        sounds.notify.play();
        console.log(`Handicap set successfully to ${handicap}`);
    } catch (err) {
        console.error("ハンデ更新エラー:", err);
        alert("ハンデの設定に失敗しました: " + err.message);
    }
}

// グローバル公開
window.toggleMemberHandicap = toggleMemberHandicap;
window.setMemberHandicap = setMemberHandicap;

// 自分のハンデを取得
function getMyHandicap() {
    return memberHandicaps[myId] || "none";
}

// チームを取得（相手のチーム判定用）
function getTargetTeam(targetId) {
    return partyMembers[targetId]?.team || "red";
}

// 相手チームかどうか判定（チーム戦用）- すべての攻撃判定で使用
function isOpponentTeam(targetId) {
    if (!myPartyId) return true; // パーティーなしは全員が相手
    if (teamMode !== "team") return true; // 個人戦は全員が相手
    const myTeam = partyMembers[myId]?.team || "red";
    const targetTeam = getTargetTeam(targetId);
    return myTeam !== targetTeam; // 違うチームなら相手
}

// --- スキンショップ ---
window.openSkinShop = () => {
    openScreen("screen-skin-shop");
    updateSkinPreview();
    renderSkinShop();
};

window.saveAndExitSkinShop = () => {
    saveAndDisplayData();
    goHome();
};

function updateSkinPreview() {
    const previewSkin = el("preview-skin");
    const previewFace = el("preview-face");
    const previewAccessory = el("preview-accessory");
    
    if (previewSkin) {
        if (skinData.skin === "skin-gold") {
            previewSkin.style.background = SKIN_COLORS["skin-gold"];
        } else {
            previewSkin.style.background = SKIN_COLORS[skinData.skin] || SKIN_COLORS["skin-1"];
        }
    }
    
    if (previewFace) previewFace.innerText = FACE_DATA[skinData.face] || "😊";
    
    if (previewAccessory) {
        if (equippedAccessory && ACCESSORY_DB[equippedAccessory]) {
            previewAccessory.innerText = ACCESSORY_DB[equippedAccessory].emoji;
        } else {
            previewAccessory.innerText = "";
        }
    }
}

window.switchSkinCategory = (category) => {
    document.querySelectorAll('.skin-cat-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.skin-grid').forEach(grid => grid.classList.add('hidden'));
    
    const activeBtn = Array.from(document.querySelectorAll('.skin-cat-btn')).find(btn => 
        btn.textContent.includes(category === 'skin' ? '肌の色' : category === 'face' ? '顔' : 'アクセサリー')
    );
    if (activeBtn) activeBtn.classList.add('active');
    
    el(`skin-category-${category}`).classList.remove('hidden');
};

function renderSkinShop() {
    const skinGrid = el("skin-category-skin");
    if (skinGrid) {
        skinGrid.innerHTML = "";
        
        for (let i = 1; i <= 10; i++) {
            const skinId = `skin-${i}`;
            const isEquipped = skinData.skin === skinId;
            
            const item = document.createElement("div");
            item.className = `skin-item owned ${isEquipped ? 'equipped' : ''}`;
            item.style.background = SKIN_COLORS[skinId];
            item.onclick = () => selectSkin(skinId);
            skinGrid.appendChild(item);
        }
        
        if (skinData.accessories && skinData.accessories.includes('rich')) {
            const goldItem = document.createElement("div");
            goldItem.className = `skin-item owned ${skinData.skin === 'skin-gold' ? 'equipped' : ''}`;
            goldItem.style.background = SKIN_COLORS["skin-gold"];
            goldItem.onclick = () => selectSkin("skin-gold");
            skinGrid.appendChild(goldItem);
        }
    }
    
    const faceGrid = el("skin-category-face");
    if (faceGrid) {
        faceGrid.innerHTML = "";
        
        for (let i = 1; i <= 30; i++) {
            const faceId = `face-${i}`;
            const isEquipped = skinData.face === faceId;
            
            const item = document.createElement("div");
            item.className = `skin-item owned ${isEquipped ? 'equipped' : ''}`;
            item.innerHTML = FACE_DATA[faceId];
            item.onclick = () => selectFace(faceId);
            faceGrid.appendChild(item);
        }
    }
    
    const accessoryGrid = el("skin-category-accessory");
    if (accessoryGrid) {
        accessoryGrid.innerHTML = "";
        
        Object.entries(ACCESSORY_DB).forEach(([id, acc]) => {
            const isOwned = skinData.accessories ? skinData.accessories.includes(id) : false;
            const isEquipped = equippedAccessory === id;
            const canAfford = coins >= acc.cost;
            
            const item = document.createElement("div");
            item.className = `skin-item ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''} ${!isOwned && !canAfford ? 'locked' : ''}`;
            item.innerHTML = `
                <span style="font-size: 2rem;">${acc.emoji}</span>
                <span class="skin-price">${acc.cost.toLocaleString()}🪙</span>
            `;
            
            if (isOwned) {
                item.onclick = () => equipAccessory(id);
            } else if (canAfford) {
                item.onclick = () => buyAccessory(id);
            }
            
            accessoryGrid.appendChild(item);
        });
    }
}

function selectSkin(skinId) {
    skinData.skin = skinId;
    updateSkinPreview();
    renderSkinShop();
    updateProfileFace();
}

function selectFace(faceId) {
    skinData.face = faceId;
    updateSkinPreview();
    renderSkinShop();
    updateProfileFace();
}

function buyAccessory(accessoryId) {
    const acc = ACCESSORY_DB[accessoryId];
    if (coins >= acc.cost) {
        coins -= acc.cost;
        if (!skinData.accessories) skinData.accessories = [];
        skinData.accessories.push(accessoryId);
        equippedAccessory = accessoryId;
        
        if (accessoryId === 'rich') {
            alert("🎉 大金持ちアクセサリーを購入しました！\n金色の肌と特別な顔がアンロックされました！");
        }
        
        updateSkinPreview();
        renderSkinShop();
        updateProfileFace();
        saveAndDisplayData();
        sounds.notify.play();
    } else {
        alert(`コインが足りません！\n必要: ${acc.cost.toLocaleString()}🪙\n所持: ${coins.toLocaleString()}🪙`);
    }
}

function equipAccessory(accessoryId) {
    equippedAccessory = accessoryId;
    updateSkinPreview();
    renderSkinShop();
    updateProfileFace();
    saveAndDisplayData();
}

// --- ショップシステム（修行・ボススキル表示改善）---
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
        if (el("screen-gacha") && !el("screen-gacha").classList.contains("hidden")) {
            renderGachaCharacters(getCurrentGachaTabRarity());
        }
        sounds.notify.play();
        alert(`${skill.name} を購入・装備しました！`);
    } else {
        alert(`コインが足りません！\n必要: ${skill.cost.toLocaleString()}🪙\n所持: ${coins.toLocaleString()}🪙`);
    }
};

window.equipSkill = (skillId) => {
    equippedSkill = skillId;
    saveAndDisplayData();
    renderShop();
    if (el("screen-gacha") && !el("screen-gacha").classList.contains("hidden")) {
        renderGachaCharacters(getCurrentGachaTabRarity());
    }
};

function renderShop() {
    const shopList = el("shop-list");
    if (!shopList) return;
    shopList.innerHTML = "";
    Object.values(SKILL_DB).forEach(skill => {
        if (skill.gacha) return; // ガチャキャラはガチャ画面のみ
        
        const isOwned = ownedSkills.includes(skill.id);
        const isEquipped = equippedSkill === skill.id;
        
        let canUseBossSkill = true;
        let requirementText = "";
        let isUnlocked = true;
        
        if (skill.boss) {
            if (skill.id === "hanabi") {
                isUnlocked = storyProgress.chapter1 >= 7;
                requirementText = `【条件: ${isUnlocked ? '✓ クリア済み' : '第1章 1-7 をクリアすると使用可能'}】`;
            } else if (skill.id === "hacker_milestone4") {
                isUnlocked = storyProgress.chapter2 >= 7;
                requirementText = `【条件: ${isUnlocked ? '✓ クリア済み' : '第2章 2-7 をクリアすると使用可能'}】`;
            } else if (skill.id === "invincible_man") {
                isUnlocked = storyProgress.chapter3 >= 10;
                requirementText = `【条件: ${isUnlocked ? '✓ クリア済み' : '第3章 3-10 をクリアすると使用可能'}】`;
            }
        }
        
        if (skill.training) {
            if (skill.id === "swordsman") {
                isUnlocked = ownedSkills.includes("swordsman");
                requirementText = `【条件: ${isUnlocked ? '✓ クリア済み' : '修行1をクリアすると使用可能'}】`;
            } else if (skill.id === "hacker_trainee") {
                isUnlocked = ownedSkills.includes("hacker_trainee");
                requirementText = `【条件: ${isUnlocked ? '✓ クリア済み' : '修行2をクリアすると使用可能'}】`;
            }
        }
        
        let buttonHtml = "";
        if (!isUnlocked) {
            buttonHtml = `<button class="shop-btn" disabled style="background: #666;">使用不可 (未クリア)</button>`;
        } else if (isEquipped) {
            buttonHtml = `<button class="shop-btn equipped" disabled>装備中</button>`;
        } else if (isOwned) {
            buttonHtml = `<button class="shop-btn" onclick="window.equipSkill('${skill.id}')">装備する</button>`;
        } else if (!skill.boss && !skill.special && !skill.training) {
            const canAfford = coins >= skill.cost;
            buttonHtml = `<button class="shop-btn" onclick="window.buySkill('${skill.id}')" ${canAfford ? '' : 'disabled'}>購入 (${skill.cost.toLocaleString()}🪙)</button>`;
        } else if ((skill.boss || skill.training) && isUnlocked && !isOwned) {
            buttonHtml = `<button class="shop-btn" onclick="window.unlockBossSkill('${skill.id}')" style="background: #FFD700;">解除する</button>`;
        }

        if (!skill.special || (skill.special && isOwned)) {
            shopList.innerHTML += `
                <div class="shop-item ${skill.boss ? 'boss-skill-item' : ''} ${skill.training ? 'training-skill-item' : ''} ${skill.special ? 'special-skill-item' : ''}">
                    <h3>${skill.name} ${skill.boss ? '👑' : ''} ${skill.training ? '⚔️' : ''} ${skill.special ? '✨' : ''}</h3>
                    <p style="white-space: pre-wrap;">${skill.desc}</p>
                    ${requirementText ? `<p style="color: #FFD700; font-size: 0.9rem;">${requirementText}</p>` : ''}
                    <span class="cooldown-text">クールダウン: ${skill.cooldown > 0 ? skill.cooldown + '秒' : '個別/1回のみ'}</span>
                    ${buttonHtml}
                </div>
            `;
        }
    });
}

window.unlockBossSkill = (skillId) => {
    if (!ownedSkills.includes(skillId)) {
        ownedSkills.push(skillId);
        equippedSkill = skillId;
        saveAndDisplayData();
        renderShop();
        alert(`${SKILL_DB[skillId].name} を解除しました！`);
    }
};

// =========================================
// ガチャ機能（スクロール改善・装備バグ修正）
// =========================================

window.openGacha = () => {
    openScreen("screen-gacha");
    updateGachaCoinDisplay();
    renderGachaCharacters('all');
};

function updateGachaCoinDisplay() {
    const gachaCoin = el("gacha-coin-amount");
    if (gachaCoin) gachaCoin.innerText = coins.toLocaleString();
}

function getCurrentGachaTabRarity() {
    const activeTab = document.querySelector('.gacha-tab.active');
    if (!activeTab) return 'all';
    const text = activeTab.textContent;
    if (text.includes('全')) return 'all';
    if (text.includes('R')) return 'R';
    if (text.includes('SR')) return 'SR';
    if (text.includes('UR')) return 'UR';
    return 'all';
}

window.switchGachaTab = (rarity) => {
    document.querySelectorAll('.gacha-tab').forEach(tab => tab.classList.remove('active'));
    const targetTab = Array.from(document.querySelectorAll('.gacha-tab')).find(tab => 
        (rarity === 'all' && tab.textContent.includes('全')) ||
        (rarity === 'R' && tab.textContent.includes('R')) ||
        (rarity === 'SR' && tab.textContent.includes('SR')) ||
        (rarity === 'UR' && tab.textContent.includes('UR'))
    );
    if (targetTab) targetTab.classList.add('active');
    renderGachaCharacters(rarity);
};

function renderGachaCharacters(rarity) {
    const container = el("gacha-char-list");
    if (!container) return;
    container.innerHTML = "";

    const ownedGachaIds = ownedSkills.filter(id => SKILL_DB[id] && SKILL_DB[id].gacha);

    let charsToShow = [];
    if (rarity === 'all') {
        charsToShow = Object.values(GACHA_CHAR_DB);
    } else {
        charsToShow = Object.values(GACHA_CHAR_DB).filter(c => c.rarity === rarity.toUpperCase());
    }

    charsToShow.forEach(char => {
        const isOwned = ownedGachaIds.includes(char.id);
        const isEquipped = equippedSkill === char.id;
        const item = document.createElement("div");
        item.className = `gacha-char-item ${char.rarity.toLowerCase()} ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`;
        item.innerHTML = `
            <div class="gacha-char-rarity">${char.rarity}</div>
            <div class="gacha-char-name">${char.name}</div>
            <div class="gacha-char-ability">${char.desc.substring(0, 20)}…</div>
        `;
        if (isOwned) {
            item.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log(`Equipping gacha character: ${char.id}`);
                equipGachaCharacter(char.id);
            };
        } else {
            item.style.opacity = "0.4";
            item.style.cursor = "default";
        }
        container.appendChild(item);
    });

    const equippedNameEl = el("gacha-equipped-name");
    if (equippedNameEl) {
        const equipped = SKILL_DB[equippedSkill];
        if (equipped && equipped.gacha) {
            equippedNameEl.innerText = equipped.name;
        } else {
            equippedNameEl.innerText = "なし（通常スキル装備中）";
        }
    }
}

// ガチャキャラを装備（バグ修正）- 確実に装備できるよう改良
function equipGachaCharacter(charId) {
    if (!ownedSkills.includes(charId)) {
        alert("このキャラクターを所持していません");
        return;
    }
    
    console.log(`Equipping gacha character: ${charId}`);
    equippedSkill = charId;
    saveAndDisplayData();
    
    // UIを強制的に更新
    renderGachaCharacters(getCurrentGachaTabRarity());
    if (el("screen-shop") && !el("screen-shop").classList.contains("hidden")) {
        renderShop();
    }
    
    // スキルUIも更新
    if (gameActive) {
        setupSkillUI();
    }
    
    sounds.notify.play();
    alert(`${GACHA_CHAR_DB[charId].name}を装備しました！`);
    
    // Firebaseにも反映
    const userRef = ref(db, `users/${myId}`);
    update(userRef, { equipped: equippedSkill }).catch(err => console.error("Firebase equip error:", err));
}

window.drawGacha = async (type) => {
    const isTen = type === "normal10";
    const cost = isTen ? GACHA_COST_10 : GACHA_COST;
    if (coins < cost) {
        alert(`コインが足りません！\n必要: ${cost}🪙`);
        return;
    }

    let results = [];
    const allGachaIds = Object.keys(GACHA_CHAR_DB);
    const drawCount = isTen ? 10 : 1;

    for (let i = 0; i < drawCount; i++) {
        const rnd = Math.random() * 100;
        let selectedRarity;
        if (rnd < GACHA_RATES.R) {
            selectedRarity = 'R';
        } else if (rnd < GACHA_RATES.R + GACHA_RATES.SR) {
            selectedRarity = 'SR';
        } else {
            selectedRarity = 'UR';
        }

        const candidates = GACHA_CHARS_BY_RARITY[selectedRarity];
        if (candidates.length === 0) {
            const fallback = allGachaIds[Math.floor(Math.random() * allGachaIds.length)];
            results.push(fallback);
            if (!ownedSkills.includes(fallback)) {
                ownedSkills.push(fallback);
            }
            continue;
        }

        const selectedChar = candidates[Math.floor(Math.random() * candidates.length)];
        results.push(selectedChar);
        if (!ownedSkills.includes(selectedChar)) {
            ownedSkills.push(selectedChar);
        }
    }

    coins -= cost;
    saveAndDisplayData();
    updateGachaCoinDisplay();
    showGachaResult(results);
    renderGachaCharacters(getCurrentGachaTabRarity());
};

function showGachaResult(results) {
    const resultContainer = el("gacha-result-content");
    const resultDiv = el("gacha-result");
    if (!resultContainer || !resultDiv) return;

    resultContainer.innerHTML = "";
    results.forEach(charId => {
        const char = GACHA_CHAR_DB[charId];
        if (!char) return;
        const item = document.createElement("div");
        item.className = `gacha-result-item ${char.rarity.toLowerCase()}`;
        item.innerHTML = `
            <div class="gacha-result-rarity">${char.rarity}</div>
            <div class="gacha-result-name">${char.name}</div>
            <div class="gacha-result-new">NEW!</div>
        `;
        resultContainer.appendChild(item);
    });

    resultDiv.classList.remove("hidden");
    setTimeout(() => resultDiv.classList.add("hidden"), 4000);
}

window.openGachaSkillShop = () => {
    openScreen("screen-shop");
    renderShop();
};

// --- デバッグモード（w + l + 8）---
window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === 'w') debugKeys.w = true;
    if (e.key.toLowerCase() === 'l') debugKeys.l = true;
    if (e.key === '8') debugKeys.digit8 = true;
    
    if (debugKeys.w && debugKeys.l && debugKeys.digit8 && !debugActive) {
        debugActive = true;
        showDebugInput();
    }
});

window.addEventListener("keyup", (e) => {
    if (e.key.toLowerCase() === 'w') debugKeys.w = false;
    if (e.key.toLowerCase() === 'l') debugKeys.l = false;
    if (e.key === '8') debugKeys.digit8 = false;
});

function showDebugInput() {
    const code = prompt("デバッグコードを入力してください:");
    if (code === "1x4x5f") {
        el("debug-overlay").classList.remove("hidden");
    }
    debugActive = false;
}

window.executeDebug = async () => {
    const friendCode = el("debug-friend-code").value;
    const operation = el("debug-operation").value;
    const amount = parseInt(el("debug-amount").value) || 0;
    
    if (!friendCode) {
        alert("フレンドコードを入力してください");
        return;
    }
    
    if (friendCode === myId) {
        switch(operation) {
            case "add": coins += amount; break;
            case "subtract": coins = Math.max(0, coins - amount); break;
            case "set": coins = Math.max(0, amount); break;
        }
        saveAndDisplayData();
        alert(`自分のコインを変更しました: ${coins.toLocaleString()}🪙`);
    } else {
        const userRef = ref(db, `users/${friendCode}`);
        const snap = await get(userRef);
        
        if (snap.exists()) {
            const userData = snap.val();
            let newCoins = userData.coins || 0;
            
            switch(operation) {
                case "add": newCoins += amount; break;
                case "subtract": newCoins = Math.max(0, newCoins - amount); break;
                case "set": newCoins = Math.max(0, amount); break;
            }
            
            await update(userRef, { coins: newCoins });
            alert(`ユーザー ${friendCode} のコインを変更しました: ${newCoins.toLocaleString()}🪙`);
        } else {
            alert("指定されたユーザーが見つかりません");
        }
    }
    
    closeDebug();
};

window.closeDebug = () => {
    el("debug-overlay").classList.add("hidden");
    el("debug-friend-code").value = "";
    el("debug-amount").value = "0";
};

// --- 効果残り時間表示関数 ---
function updateEffectTimers() {
    const timerDiv = document.getElementById('effect-timer');
    if (!timerDiv && gameActive) {
        const newTimerDiv = document.createElement('div');
        newTimerDiv.id = 'effect-timer';
        newTimerDiv.style.position = 'absolute';
        newTimerDiv.style.top = '10px';
        newTimerDiv.style.left = '50%';
        newTimerDiv.style.transform = 'translateX(-50%)';
        newTimerDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
        newTimerDiv.style.color = '#fff';
        newTimerDiv.style.padding = '5px 15px';
        newTimerDiv.style.borderRadius = '20px';
        newTimerDiv.style.fontWeight = 'bold';
        newTimerDiv.style.zIndex = '1000';
        newTimerDiv.style.border = '2px solid';
        document.getElementById('game-core').appendChild(newTimerDiv);
    }
    
    const timerEl = document.getElementById('effect-timer');
    if (!timerEl) return;
    
    let activeEffects = [];
    
    if (isStunned && effectTimers.stun > 0) {
        activeEffects.push({ name: 'スタン', time: Math.ceil(effectTimers.stun / 1000), color: '#ff0000' });
    }
    if (isJamming && effectTimers.jamming > 0) {
        activeEffects.push({ name: '妨害', time: Math.ceil(effectTimers.jamming / 1000), color: '#ffff00' });
    }
    if (poisonActive && effectTimers.poison > 0) {
        activeEffects.push({ name: '毒', time: Math.ceil(effectTimers.poison / 1000), color: '#00ff00' });
    }
    if (document.body.classList.contains('swaying') && effectTimers.sway > 0) {
        activeEffects.push({ name: 'ゆらゆら', time: Math.ceil(effectTimers.sway / 1000), color: '#ff69b4' });
    }
    if (mazeActive && effectTimers.maze > 0) {
        activeEffects.push({ name: '迷路', time: Math.ceil(effectTimers.maze / 1000), color: '#00ffff' });
    }
    if (hackingActive && effectTimers.hacking > 0) {
        activeEffects.push({ name: 'ハッキング', time: Math.ceil(effectTimers.hacking / 1000), color: '#00ff00' });
    }
    if (bleedingActive && effectTimers.bleeding > 0) {
        activeEffects.push({ name: '血', time: Math.ceil(effectTimers.bleeding / 1000), color: '#ff0000' });
    }
    if (weakActive && effectTimers.weak > 0) {
        activeEffects.push({ name: '最弱', time: Math.ceil(effectTimers.weak / 1000), color: '#ffff00' });
    }
    
    if (activeEffects.length > 0) {
        const effectText = activeEffects.map(e => `<span style="color:${e.color}">${e.name}:残り${e.time}秒</span>`).join(' | ');
        timerEl.innerHTML = effectText;
        timerEl.style.display = 'block';
    } else {
        timerEl.style.display = 'none';
    }
}

function startEffectTimer(effectName, durationMs) {
    effectTimers[effectName] = durationMs;
    
    const timerInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(timerInterval);
            return;
        }
        effectTimers[effectName] = Math.max(0, effectTimers[effectName] - 1000);
        updateEffectTimers();
        
        if (effectTimers[effectName] <= 0) clearInterval(timerInterval);
    }, 1000);
}

// --- ゲームエンジン ---
function openScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    const target = el(id);
    if(target) target.classList.remove("hidden");
}

window.goHome = () => { 
    gameActive = false; 
    trainingMode = false;
    clearInterval(gameInterval);
    resetSkillState();
    clearHandicapEffects();
    clearFakeTyping();

    if (myPartyId && myPartyId.startsWith("match_")) {
        window.leaveParty();
    }
    
    el("story-progress-bar").classList.add("hidden");
    isStoryMode = false;
    
    openScreen("screen-home"); 
    updateButtonStates();
    saveAndDisplayData();
};

function clearHandicapEffects() {
    if (handicapNoTypeTimer) clearTimeout(handicapNoTypeTimer);
    if (handicapSlowTimer) clearInterval(handicapSlowTimer);
    if (handicapHalfTimeTimer) clearTimeout(handicapHalfTimeTimer);
    if (handicapSkillSealTimer) clearTimeout(handicapSkillSealTimer);
    handicapNoTypeTimer = null;
    handicapSlowTimer = null;
    handicapHalfTimeTimer = null;
    handicapSkillSealTimer = null;
}

function nextQuestion() {
    if (!currentWords || currentWords.length === 0) currentWords = ["えらー"];
    let randomIdx = Math.floor(Math.random() * currentWords.length);
    let q = currentWords[randomIdx];
    el("q-ja").innerText = q;
    let patterns = getRomaPatterns(q);
    // ランダムなパターンを選択
    currentRoma = patterns[Math.floor(Math.random() * patterns.length)]; 
    romaIdx = 0; 
    renderRoma();
}

function renderRoma() {
    el("q-done").innerText = currentRoma.substring(0, romaIdx);
    el("q-todo").innerText = currentRoma.substring(romaIdx);
}

// 偽物タイピング用の表示更新
function renderFakeRoma() {
    const fakeDoneEl = document.getElementById('fake-q-done');
    const fakeTodoEl = document.getElementById('fake-q-todo');
    if (fakeDoneEl && fakeTodoEl) {
        fakeDoneEl.innerText = fakeTypingRoma.substring(0, fakeTypingIdx);
        fakeTodoEl.innerText = fakeTypingRoma.substring(fakeTypingIdx);
    }
}

function processCorrectType() {
    const myHandicap = getMyHandicap();
    
    // ハンデチェック
    if (myHandicap === "no_type_10" && timer > duration - 10) {
        sounds.miss.play();
        return;
    }
    
    if (myHandicap === "half_time" && timer > duration / 2) {
        sounds.miss.play();
        return;
    }
    
    if (myHandicap === "skill_seal") {
        skillSealed = true;
        // スキル封印は試合全体に適用
    }
    
    romaIdx++;
    let scoreIncrease = (10 + combo) * comboMultiplier;
    
    if (myHandicap === "score_half") scoreIncrease = Math.floor(scoreIncrease / 2);
    
    score += scoreIncrease; 
    combo += 1 * comboMultiplier; 
    
    if (bleedingActive) {
        combo = Math.max(0, combo - 3);
    }
    
    if (isGodfatherMissionActive) {
        coins += combo * 5;
        el("coin-amount").innerText = coins.toLocaleString();
    }
    
    sounds.type.currentTime = 0; sounds.type.play();
    
    if (romaIdx >= currentRoma.length) { 
        sounds.correct.play(); 
        currentWordIdx++; 
        nextQuestion(); 
    }
    
    el("stat-score").innerText = score.toLocaleString(); 
    el("stat-combo").innerText = combo;
    renderRoma();
    
    if (isStoryMode) {
        if (myPartyId) {
            let totalScore = 0;
            for (let id in partyMembers) totalScore += partyMembers[id].score || 0;
            const memberCount = Object.keys(partyMembers).length;
            const avgScore = memberCount > 0 ? Math.floor(totalScore / memberCount) : 0;
            updateProgressBar(avgScore);
            
            if (avgScore >= storyTargetScore && gameActive) {
                clearInterval(gameInterval);
                gameActive = false;
                storyClear();
            }
        } else {
            updateProgressBar(score);
            if (score >= storyTargetScore && gameActive) {
                clearInterval(gameInterval);
                gameActive = false;
                storyClear();
            }
        }
    }
    
    if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
}

function updateProgressBar(currentScore) {
    const percentage = Math.min(100, (currentScore / storyTargetScore) * 100);
    el("progress-bar-fill").style.width = percentage + "%";
    el("progress-score").innerText = currentScore.toLocaleString();
}

function storyClear() {
    const stageData = currentStage.chapter === 1 ? STORY_STAGES.chapter1[currentStage.stage - 1] :
                     currentStage.chapter === 2 ? STORY_STAGES.chapter2[currentStage.stage - 1] :
                     STORY_STAGES.chapter3[currentStage.stage - 1];
    
    let earnedCoins = stageData.reward;
    
    if (currentStage.chapter === 1) {
        if (storyProgress.chapter1 < currentStage.stage) storyProgress.chapter1 = currentStage.stage;
    } else if (currentStage.chapter === 2) {
        if (storyProgress.chapter2 < currentStage.stage) storyProgress.chapter2 = currentStage.stage;
    } else {
        if (storyProgress.chapter3 < currentStage.stage) storyProgress.chapter3 = currentStage.stage;
    }
    
    if (myPartyId) {
        get(ref(db, `parties/${myPartyId}/members`)).then(snap => {
            const members = snap.val();
            if (!members) return;
            
            const memberCount = Object.keys(members).length;
            const updates = {};
            Object.keys(members).forEach(memberId => {
                updates[`users/${memberId}/story_progress/chapter${currentStage.chapter}`] = currentStage.stage;
            });
            update(ref(db), updates);
            
            earnedCoins = Math.floor(earnedCoins / memberCount);
            coins += earnedCoins;
            
            if (stageData.boss) giveBossSkillToAll(stageData.skill, members);
            
            saveAndDisplayData();
            endGame();
        });
    } else {
        coins += earnedCoins;
        if (stageData.boss) giveBossSkill(stageData.skill);
        saveAndDisplayData();
        endGame();
    }
}

function giveBossSkill(skillId) {
    if (!ownedSkills.includes(skillId)) {
        ownedSkills.push(skillId);
        equippedSkill = skillId;
        saveAndDisplayData();
        alert(`🎉 ボスステージクリア！「${SKILL_DB[skillId].name}」を獲得しました！`);
    }
}

function giveBossSkillToAll(skillId, members) {
    if (!ownedSkills.includes(skillId)) {
        ownedSkills.push(skillId);
        equippedSkill = skillId;
        alert(`🎉 ボスステージクリア！「${SKILL_DB[skillId].name}」を獲得しました！`);
    }
    
    Object.keys(members).forEach(memberId => {
        if (memberId !== myId) {
            const memberRef = ref(db, `users/${memberId}`);
            get(memberRef).then(memberSnap => {
                const memberData = memberSnap.val() || {};
                const memberSkills = memberData.skills || [];
                if (!memberSkills.includes(skillId)) {
                    memberSkills.push(skillId);
                    update(ref(db, `users/${memberId}`), { 
                        skills: memberSkills,
                        equipped: skillId
                    });
                }
            });
        }
    });
}

function canType() {
    const myHandicap = getMyHandicap();
    if (myHandicap === "no_type_10" && timer > duration - 10) return false;
    if (myHandicap === "half_time" && timer > duration / 2) return false;
    return gameActive && !isStunned && !isJamming && hackerTabsActive === 0 && !mazeActive && !hackingActive && !bleedingActive && !fakeTypingActive;
}

window.addEventListener("keydown", e => {
    if (!gameActive) return;
    if (hackerTabsActive > 0) return;
    if (skillSealed) {
        showBattleAlert("🔒 スキル封印中！", "#ff0000");
        return;
    }

    if (e.code === "Space") { 
        e.preventDefault(); 
        if (equippedSkill === "comboGod") {
            activateComboGod();
        } else {
            window.activateSkill("space");
        }
        return; 
    }
    
    if (e.code === "Digit1") { e.preventDefault(); window.activateSkill("key1"); return; }
    if (e.code === "Digit2") { e.preventDefault(); window.activateSkill("key2"); return; }
    if (e.code === "Digit3") { e.preventDefault(); window.activateSkill("key3"); return; }
    
    if (mazeActive) {
        if (e.code === "ArrowUp") { e.preventDefault(); window.moveMaze('up'); return; }
        if (e.code === "ArrowDown") { e.preventDefault(); window.moveMaze('down'); return; }
        if (e.code === "ArrowLeft") { e.preventDefault(); window.moveMaze('left'); return; }
        if (e.code === "ArrowRight") { e.preventDefault(); window.moveMaze('right'); return; }
    }
    
    if (fakeTypingActive) {
        // 偽物タイピングではどのパターンでも受け付けるように
        if (e.key === fakeTypingRoma[fakeTypingIdx]) {
            fakeTypingIdx++;
            renderFakeRoma(); // 打った文字を光らせる
            if (fakeTypingIdx >= fakeTypingRoma.length) {
                clearFakeTyping();
                setStun(5000);
                showLaughEffect();
                sounds.laugh.play();
                showBattleAlert("😂 偽物を打ってしまった！5秒スタン！", "#ff0000");
            }
        } else {
            sounds.miss.play();
        }
        return;
    }
    
    if (!canType()) return;

    if (e.key === currentRoma[romaIdx]) {
        processCorrectType();
    } else if (!["Shift","Alt","Control","Space","1","2","3","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        combo = 0; 
        sounds.miss.currentTime = 0; sounds.miss.play();
        el("stat-combo").innerText = combo;
        
        if (weakActive) {
            setStun(3000);
            showBattleAlert("💫 最弱状態のためミスでスタン！", "#ffff00");
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
    clearHandicapEffects();
    clearFakeTyping();

    bananaStacks = 0;
    trapperStacks = 0;
    isStunned = false;
    if (stunTimer) clearTimeout(stunTimer);
    stunTimer = null;

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
        updateEffectTimers();
        
        if (bleedingActive) {
            combo = Math.max(0, combo - 3);
            el("stat-combo").innerText = combo;
        }
        
        if (trainingMode && trainingType === 1 && timer % 10 === 0 && Math.random() > 0.5) {
            trainingAttack();
        }
        if (trainingMode && trainingType === 2) {
            if (timer % 20 === 0 && Math.random() > 0.5) createHackerTabs();
            if (timer % 30 === 0 && Math.random() > 0.7) trainingStatusAttack();
        }
        
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
            let scores = Object.entries(val).map(([id, m]) => ({ id, ...m }));
            
            if (teamMode === "team") {
                let redScore = 0, blueScore = 0;
                scores.forEach(m => {
                    if (m.team === "red") redScore += m.score || 0;
                    else blueScore += m.score || 0;
                });
                el("rival-list").innerHTML = `
                    <div class="friend-item" style="border-color: #ff4444;">
                        <span>🔴 赤チーム</span>
                        <span>${isHidden ? '???' : redScore.toLocaleString()}</span>
                    </div>
                    <div class="friend-item" style="border-color: #4444ff;">
                        <span>🔵 青チーム</span>
                        <span>${isHidden ? '???' : blueScore.toLocaleString()}</span>
                    </div>
                `;
            } else {
                el("rival-list").innerHTML = scores.map(({id, ...m}) => {
                    const memberSkin = m.skin || { face: "face-1" };
                    const memberFace = FACE_DATA[memberSkin.face] || "😊";
                    const memberAccessory = m.accessory ? ACCESSORY_DB[m.accessory]?.emoji || "" : "";
                    return `
                        <div class="friend-item">
                            <div class="friend-left">
                                <div class="friend-face">
                                    <span>${memberFace}</span>
                                    ${memberAccessory ? `<span style="font-size: 1rem; margin-left: 2px;">${memberAccessory}</span>` : ''}
                                </div>
                                <span class="friend-name">${m.name}</span>
                            </div>
                            <span>${isHidden ? '???' : (m.score || 0).toLocaleString()}</span>
                        </div>
                    `;
                }).join("");
            }
        }
    });
}

function endGame() {
    gameActive = false; 
    trainingMode = false;
    clearInterval(gameInterval);
    resetSkillState();
    clearHandicapEffects();
    clearFakeTyping();

    if (attackListenerReference) {
        off(attackListenerReference);
        attackListenerReference = null;
    }

    sounds.finish.play();
    openScreen("screen-result");

    let earnedCoins = Math.floor(score / 10);
    let isWinner = false;

    if (!isStoryMode) {
        if (equippedSkill === "fundraiser") earnedCoins *= 2;
        if (equippedSkill === "godfundraiser") earnedCoins *= 4;
    }

    if (myPartyId) {
        get(ref(db, `parties/${myPartyId}/members`)).then(s => {
            const val = s.val();
            if(val) {
                const res = Object.entries(val).sort((a,b) => b[1].score - a[1].score);
                
                if (!isStoryMode && res[0][0] === myId && res.length > 1) {
                    earnedCoins *= 2;
                    isWinner = true;
                }

                if (earnedCoins > 0 && !isStoryMode) {
                    coins += earnedCoins;
                    saveAndDisplayData();
                }

                if (teamMode === "team") {
                    let redScore = 0, blueScore = 0;
                    Object.entries(val).forEach(([id, m]) => {
                        if (m.team === "red") redScore += m.score || 0;
                        else blueScore += m.score || 0;
                    });
                    el("ranking-box").innerHTML = `
                        <div class="ranking-row" style="border-color: #ff4444;">
                            <span>🔴 赤チーム</span>
                            <span>${redScore.toLocaleString()} pts</span>
                        </div>
                        <div class="ranking-row" style="border-color: #4444ff;">
                            <span>🔵 青チーム</span>
                            <span>${blueScore.toLocaleString()} pts</span>
                        </div>
                    `;
                } else {
                    el("ranking-box").innerHTML = res.map((item, i) => {
                        const m = item[1];
                        const memberSkin = m.skin || { face: "face-1" };
                        const memberFace = FACE_DATA[memberSkin.face] || "😊";
                        const memberAccessory = m.accessory ? ACCESSORY_DB[m.accessory]?.emoji || "" : "";
                        return `<div class="ranking-row">
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <div class="friend-face">
                                    <span style="font-size: 1.2rem;">${memberFace}</span>
                                    ${memberAccessory ? `<span style="font-size: 1rem;">${memberAccessory}</span>` : ''}
                                </div>
                                <span>${i+1}位: ${m.name}</span>
                            </div>
                            <span>${m.score.toLocaleString()} pts</span>
                        </div>`;
                    }).join("");
                }
                
                let coinText = "";
                if (isStoryMode) {
                    const totalScore = Object.values(val).reduce((sum, m) => sum + (m.score || 0), 0);
                    const avgScore = Math.floor(totalScore / Object.keys(val).length);
                    coinText = `チーム平均スコア: ${avgScore.toLocaleString()} pts`;
                } else if (trainingMode) {
                    const targetScore = trainingType === 1 ? 45000 : 50000;
                    if (score >= targetScore) {
                        const skillId = trainingType === 1 ? "swordsman" : "hacker_trainee";
                        if (!ownedSkills.includes(skillId)) {
                            ownedSkills.push(skillId);
                            equippedSkill = skillId;
                            saveAndDisplayData();
                            coinText = "🎉 修行クリア！新スキル獲得！";
                        } else {
                            coinText = "修行クリア！（既にスキル獲得済み）";
                        }
                    } else {
                        coinText = "修行失敗...また挑戦しよう";
                    }
                } else {
                    coinText = isWinner ? `勝利ボーナス！ +${earnedCoins.toLocaleString()} 🪙` : `獲得コイン +${earnedCoins.toLocaleString()} 🪙`;
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
        if (earnedCoins > 0 && !isStoryMode && !trainingMode) {
            coins += earnedCoins;
            saveAndDisplayData();
        }
        
        if (trainingMode) {
            const targetScore = trainingType === 1 ? 45000 : 50000;
            if (score >= targetScore) {
                const skillId = trainingType === 1 ? "swordsman" : "hacker_trainee";
                if (!ownedSkills.includes(skillId)) {
                    ownedSkills.push(skillId);
                    equippedSkill = skillId;
                    saveAndDisplayData();
                    el("ranking-box").innerHTML = `
                        <div class="ranking-row"><span>スコア</span><span>${score.toLocaleString()} pts</span></div>
                        <div class="ranking-row" style="color: #00FF00;">
                            <span>🎉 修行クリア！</span>
                            <span>${skillId === "swordsman" ? "剣士" : "ハッカー修行人"}を獲得！</span>
                        </div>
                    `;
                } else {
                    el("ranking-box").innerHTML = `
                        <div class="ranking-row"><span>スコア</span><span>${score.toLocaleString()} pts</span></div>
                        <div class="ranking-row" style="color: #FFD700;">
                            <span>修行クリア！（既にスキル獲得済み）</span>
                        </div>
                    `;
                }
            } else {
                el("ranking-box").innerHTML = `
                    <div class="ranking-row"><span>スコア</span><span>${score.toLocaleString()} pts</span></div>
                    <div class="ranking-row" style="color: #FF0000;">
                        <span>❌ 修行失敗</span>
                        <span>目標: ${targetScore.toLocaleString()} pts</span>
                    </div>
                `;
            }
        } else {
            el("ranking-box").innerHTML = `<div class="ranking-row"><span>スコア</span><span>${score.toLocaleString()} pts</span></div>`; 
            let coinText = isStoryMode ? "ストーリーモードクリア！報酬は別途獲得" : `獲得コイン +${earnedCoins.toLocaleString()} 🪙`;
            el("ranking-box").innerHTML += `
                <div class="ranking-row" style="color: #FFD700; margin-top: 15px; border-top: 2px dashed #FFD700; padding-top: 15px;">
                    <span>結果</span><span>${coinText}</span>
                </div>`;
        }
    }
    
    if (trainingMode) {
        updateTrainingStatus();
    }
}

// --- スキル・バトルエフェクト処理 ---
function setupSkillUI() {
    const actionBox = el("skill-action-box");
    const skillNameText = el("skill-btn-name");
    const keySpace = el("skill-key-space");
    const key1 = el("skill-key-1");
    const key2 = el("skill-key-2");
    const key3 = el("skill-key-3");
    
    keySpace.classList.add("hidden");
    key1.classList.add("hidden");
    key2.classList.add("hidden");
    key3.classList.add("hidden");
    
    if (equippedSkill && equippedSkill !== "none") {
        const skill = SKILL_DB[equippedSkill];
        actionBox.classList.remove("hidden");
        skillNameText.innerText = skill.name;
        
        if (skill.id === "fundraiser" || skill.id === "godfundraiser") {
            // パッシブ
        } else if (skill.id === "hacker" || skill.id === "accelerator" || skill.id === "hacker_milestone4" || skill.id === "invincible_man" || skill.id === "swordsman" || skill.id === "hacker_trainee") {
            el("in-game-skill-btn").classList.add("hidden");
            if (skill.id === "hacker") {
                key1.classList.remove("hidden"); key1.innerText = "1: タブ追加 (30s)";
                key2.classList.remove("hidden"); key2.innerText = "2: ウイルス (70s)";
            } else if (skill.id === "accelerator") {
                key1.classList.remove("hidden"); key1.innerText = "1: 熱い温度 (40s)";
                key2.classList.remove("hidden"); key2.innerText = "2: 特別加熱 (70s)";
                key3.classList.remove("hidden"); key3.innerText = "3: 自爆 (200s)";
            } else if (skill.id === "hacker_milestone4") {
                key1.classList.remove("hidden"); key1.innerText = "1: 迷路 (45s)";
                key2.classList.remove("hidden"); key2.innerText = "2: 高度なハック (1回)";
                key3.classList.remove("hidden"); key3.innerText = "3: 状態変異 (35s)";
            } else if (skill.id === "invincible_man") {
                key1.classList.remove("hidden"); key1.innerText = "1: 無敵 (30s)";
                key2.classList.remove("hidden"); key2.innerText = "2: 相手は最弱 (30s)";
            } else if (skill.id === "swordsman") {
                key1.classList.remove("hidden"); key1.innerText = "1: 切りつけ (15s)";
                key2.classList.remove("hidden"); key2.innerText = "2: 大きな傷 (30s)";
            } else if (skill.id === "hacker_trainee") {
                key1.classList.remove("hidden"); key1.innerText = "1: タブ追加 (35s)";
                key2.classList.remove("hidden"); key2.innerText = "2: 画面操作 (25s)";
                key3.classList.remove("hidden"); key3.innerText = "3: 偽物タイピング (200s)";
                keySpace.classList.remove("hidden"); keySpace.innerText = "Space: StarterGui (5000s)";
            }
        } else if (skill.id === "comboGod") {
            el("in-game-skill-btn").classList.remove("hidden");
            keySpace.classList.remove("hidden"); keySpace.innerText = "Space: コンボアップの神 (1回)";
        } else {
            el("in-game-skill-btn").classList.remove("hidden");
            if (skill.gacha) {
                if (skill.id === "narrator") {
                    keySpace.classList.remove("hidden"); keySpace.innerText = "Space: メガホン (10s)";
                    key1.classList.remove("hidden"); key1.innerText = "1: アクションゲーム (150s)";
                    key2.classList.remove("hidden"); key2.innerText = "2: パズルゲーム (100s)";
                } else if (skill.id === "trapper") {
                    keySpace.classList.remove("hidden"); keySpace.innerText = "Space: トラップ設置 (15s)";
                    key2.classList.remove("hidden"); key2.innerText = "2: 免疫力 (200s, スタン中のみ)";
                } else if (skill.id === "rifleman") {
                    keySpace.classList.remove("hidden"); keySpace.innerText = "Space: ヘッドショット (45s)";
                } else {
                    keySpace.classList.remove("hidden"); keySpace.innerText = `Space: ${skill.desc.substring(0, 30)}...`;
                }
            } else {
                keySpace.classList.remove("hidden"); keySpace.innerText = `Space: ${skill.desc}`;
            }
        }
    } else {
        actionBox.classList.add("hidden");
    }
}

function updateCooldownText() {
    if (equippedSkill === "none" || equippedSkill === "fundraiser" || equippedSkill === "godfundraiser") return;
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
    } else if (skill.id === "invincible_man") {
        let k1 = cooldowns.key1 > 0 ? `[1]冷却中(${cooldowns.key1}s)` : "[1]無敵OK";
        let k2 = cooldowns.key2 > 0 ? `[2]冷却中(${cooldowns.key2}s)` : "[2]最弱OK";
        txt = `${k1} | ${k2}`;
    } else if (skill.id === "swordsman") {
        let k1 = cooldowns.key1 > 0 ? `[1]冷却中(${cooldowns.key1}s)` : "[1]切りつけOK";
        let k2 = cooldowns.key2 > 0 ? `[2]冷却中(${cooldowns.key2}s)` : "[2]大きな傷OK";
        txt = `${k1} | ${k2}`;
    } else if (skill.id === "hacker_trainee") {
        let k1 = cooldowns.key1 > 0 ? `[1]冷却中(${cooldowns.key1}s)` : "[1]タブ追加OK";
        let k2 = cooldowns.key2 > 0 ? `[2]冷却中(${cooldowns.key2}s)` : "[2]画面操作OK";
        let k3 = cooldowns.key3 > 0 ? `[3]冷却中(${cooldowns.key3}s)` : "[3]偽物タイピングOK";
        let ks = cooldowns.space > 0 ? `[Space]冷却中(${cooldowns.space}s)` : "[Space]StarterGuiOK";
        txt = `${k1} | ${k2} | ${k3} | ${ks}`;
    } else if (skill.gacha) {
        txt = cooldowns.space > 0 ? `冷却中... (${cooldowns.space}s)` : "準備完了！(スペースキーで発動)";
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
    isStunned = false;
    if (stunTimer) clearTimeout(stunTimer);
    stunTimer = null;
    comboMultiplier = 1;
    timeSlipUsed = false;
    isGodfatherMissionActive = false;
    hackerTabsActive = 0;
    invincibleActive = false;
    if (invincibleTimer) clearTimeout(invincibleTimer);
    invincibleTimer = null;
    weakActive = false;
    if (weakTimer) clearTimeout(weakTimer);
    weakTimer = null;
    skillSealed = false;
    if (skillSealTimer) clearTimeout(skillSealTimer);
    skillSealTimer = null;
    
    mazeActive = false;
    hackingActive = false;
    poisonActive = false;
    bleedingActive = false;
    
    effectTimers = {
        stun: null,
        jamming: null,
        poison: null,
        sway: null,
        maze: null,
        hacking: null,
        blur: null,
        paint: null,
        bleeding: null,
        weak: null
    };
    
    const tabsContainer = document.getElementById("hacker-tabs-container");
    if (tabsContainer) tabsContainer.remove();
    
    const playScreen = el("screen-play");
    if (playScreen) {
        playScreen.style.filter = "none";
        playScreen.style.transition = "none";
        playScreen.style.transform = "";
    }
    
    el("jamming-overlay").classList.add("hidden");
    el("maze-overlay").classList.add("hidden");
    el("hacking-overlay").classList.add("hidden");
    el("poison-overlay").classList.add("hidden");
    el("paint-overlay").classList.add("hidden");
    el("cut-effect").classList.add("hidden");
    el("blood-effect").classList.add("hidden");
    el("invincible-effect").classList.add("hidden");
    el("weak-effect").classList.add("hidden");
    el("laugh-effect").classList.add("hidden");
    el("fake-typing-button").classList.add("hidden");
    
    document.body.classList.remove("poisoned");
    document.body.classList.remove("swaying");
    document.body.classList.remove("bleeding");
    el("skill-cooldown-bar").style.height = "0%";
    el("in-game-skill-btn").classList.remove("cooldown", "hidden");
    el("skill-status-text").innerText = "準備完了！(指定キーで発動)";
}

function startSpecificCooldown(slot, seconds) {
    if (seconds <= 0) return;
    cooldowns[slot] = seconds;
    maxCooldowns[slot] = seconds;
    
    if (cooldownTimers[slot]) clearInterval(cooldownTimers[slot]);
    
    if (slot === "space" && equippedSkill !== "hacker" && equippedSkill !== "accelerator" && equippedSkill !== "hacker_milestone4" && equippedSkill !== "comboGod" && equippedSkill !== "invincible_man" && equippedSkill !== "swordsman" && equippedSkill !== "hacker_trainee") {
        el("in-game-skill-btn").classList.add("cooldown");
        el("skill-cooldown-bar").style.height = "100%";
    }
    
    updateCooldownText();
    
    cooldownTimers[slot] = setInterval(() => {
        cooldowns[slot]--;
        if (cooldowns[slot] <= 0) {
            clearInterval(cooldownTimers[slot]);
            if (slot === "space" && equippedSkill !== "hacker" && equippedSkill !== "accelerator" && equippedSkill !== "hacker_milestone4" && equippedSkill !== "invincible_man" && equippedSkill !== "swordsman" && equippedSkill !== "hacker_trainee") {
                el("in-game-skill-btn").classList.remove("cooldown");
                el("skill-cooldown-bar").style.height = "0%";
            }
        } else {
            if (slot === "space" && equippedSkill !== "hacker" && equippedSkill !== "accelerator" && equippedSkill !== "hacker_milestone4" && equippedSkill !== "invincible_man" && equippedSkill !== "swordsman" && equippedSkill !== "hacker_trainee") {
                const pct = (cooldowns[slot] / maxCooldowns[slot]) * 100;
                el("skill-cooldown-bar").style.height = `${pct}%`;
            }
        }
        updateCooldownText();
    }, 1000);
}

function showBattleAlert(text, color) {
    const alertEl = el("battle-alert");
    if (!alertEl) return;
    alertEl.innerText = text;
    alertEl.style.color = color;
    alertEl.style.textShadow = `0 0 20px ${color}`;
    alertEl.classList.remove("hidden");
    
    alertEl.style.animation = 'none';
    alertEl.offsetHeight; 
    alertEl.style.animation = null; 
    
    setTimeout(() => alertEl.classList.add("hidden"), 4000);
}

// チームを考慮した攻撃送信（改良版）
function sendAttackToOpponents(type, duration, stealAmount) {
    if (!myPartyId || invincibleActive) return;
    get(ref(db, `parties/${myPartyId}/members`)).then(s => {
        const members = s.val();
        if (members) {
            const myTeam = members[myId]?.team || "red";
            
            Object.keys(members).forEach(targetId => {
                if (targetId !== myId) {
                    const targetTeam = members[targetId]?.team || "red";
                    
                    // チーム戦の場合、相手チームにのみ攻撃
                    if (teamMode === "team" && myTeam === targetTeam) {
                        return; // 同じチームには攻撃しない
                    }
                    
                    const attackId = generateId();
                    update(ref(db, `parties/${myPartyId}/members/${targetId}/attacks/${attackId}`), {
                        type: type, 
                        duration: duration, 
                        stealAmount: stealAmount, 
                        timestamp: Date.now(), 
                        from: myId
                    });
                }
            });
        }
    });
}

function sendRandomTargetAttack(type, duration, stealAmount) {
    if (!myPartyId || invincibleActive) return;
    get(ref(db, `parties/${myPartyId}/members`)).then(s => {
        const members = s.val();
        if (members) {
            const myTeam = members[myId]?.team || "red";
            const targets = Object.keys(members).filter(id => {
                if (id === myId) return false;
                if (teamMode === "team") {
                    const targetTeam = members[id]?.team || "red";
                    return myTeam !== targetTeam; // 相手チームのみ
                }
                return true;
            });
            
            if (targets.length > 0) {
                const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                sendAttackToTarget(randomTarget, type, duration, stealAmount);
                if (stealAmount > 0) {
                    score += stealAmount;
                    el("stat-score").innerText = score.toLocaleString();
                    update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
                }
            }
        }
    });
}

function sendAttackToTarget(targetId, type, duration, stealAmount) {
    if (!myPartyId || invincibleActive) return;
    const attackId = generateId();
    update(ref(db, `parties/${myPartyId}/members/${targetId}/attacks/${attackId}`), {
        type: type, duration: duration, stealAmount: stealAmount, timestamp: Date.now(), from: myId
    });
}

window.activateSkill = (keySlot = "space") => {
    if (!gameActive) return;
    if (!equippedSkill || equippedSkill === "none" || equippedSkill === "fundraiser" || equippedSkill === "godfundraiser") return;
    if (invincibleActive) {
        showBattleAlert("🛡️ 無敵状態のためスキル無効！", "#FFD700");
        return;
    }
    if (skillSealed) {
        showBattleAlert("🔒 スキル封印中！", "#ff0000");
        return;
    }
    
    const skill = SKILL_DB[equippedSkill];

    if (keySlot === "space") {
        if (cooldowns.space > 0) return;
        
        if (skill.id === "punch") {
            sendAttackToOpponents("jam", 3000, 0);
            showBattleAlert("👊 パンチ発動！", "var(--accent-red)");
        } 
        else if (skill.id === "autotype") {
            startAutoTypeEngine(3000, 70); 
            showBattleAlert("⚡ 自動入力発動！", "var(--accent-blue)");
        } 
        else if (skill.id === "comboUp") {
            comboMultiplier = 2;
            setTimeout(() => comboMultiplier = 1, 5000);
            showBattleAlert("🔥 コンボ倍増発動！", "var(--accent-purple)");
        } 
        else if (skill.id === "revolver") {
            sendAttackToOpponents("jam", 6000, 500); 
            score += 500; 
            showBattleAlert("🔫 リボルバー発動！", "var(--accent-red)");
        } 
        else if (skill.id === "thief") {
            sendAttackToOpponents("steal", 0, 1200);
            score += 1200;
            showBattleAlert("💰 泥棒発動！", "var(--accent-green)");
        } 
        else if (skill.id === "timeslip") {
            if (timeSlipUsed) return;
            const stealAmount = Math.floor(Math.random() * 2000) + 1000;
            sendAttackToOpponents("timeslip", 3000, stealAmount);
            startAutoTypeEngine(3000, 60);
            timeSlipUsed = true;
            el("in-game-skill-btn").classList.add("cooldown");
            el("skill-status-text").innerText = "使用済み (対戦中1回のみ)";
            showBattleAlert(`⏳ タイムスリップ！${stealAmount}スコア奪取`, "#FFD700");
            return;
        }
        else if (skill.id === "godfather") {
            isGodfatherMissionActive = true;
            setTimeout(() => isGodfatherMissionActive = false, 10000);
            showBattleAlert("🕴 任務開始！(10秒間)", "#ffd700");
        }
        else if (skill.id === "hanabi") {
            sendAttackToOpponents("dodge", 1000, 0);
            showBattleAlert("🎆 パチパチ発動！", "#FFD700");
        }
        else if (skill.id === "hacker_trainee") {
            sendAttackToOpponents("starter_gui", 5000, 0);
            showBattleAlert("💻 StarterGui発動！", "#ff00ff");
            startSpecificCooldown("space", 5000);
        }
        else if (skill.gacha) {
            if (skill.id === "paintballer") {
                sendAttackToOpponents("paint", 5000, 0);
                showBattleAlert("🎨 ペイント発動！", "#FF69B4");
            }
            else if (skill.id === "banana") {
                bananaStacks++;
                showBattleAlert(`🍌 バナナを設置！（残り ${bananaStacks}個）`, "#FFD700");
            }
            else if (skill.id === "slate") {
                showBattleAlert("🛡️ スレート（パッシブ）", "#AAAAAA");
                return;
            }
            else if (skill.id === "trapper") {
                trapperStacks++;
                showBattleAlert(`🔫 トラップを設置！（残り ${trapperStacks}個）`, "#FF4500");
            }
            else if (skill.id === "rifleman") {
                sendRandomTargetAttack("snipe", 5000, 0);
                showBattleAlert("🎯 ヘッドショット！", "#FF0000");
            }
            else if (skill.id === "narrator") {
                sendAttackToOpponents("megaphone", 10000, 0);
                showBattleAlert("📢 メガホン！", "#FF69B4");
            }
        }

        if (skill.cooldown > 0) startSpecificCooldown("space", skill.cooldown);
    }

    if (keySlot === "key1") {
        if (cooldowns.key1 > 0) return;
        
        if (skill.id === "hacker") {
            sendAttackToOpponents("hacker_tabs", 10000, 0);
            showBattleAlert("💻 タブ追加攻撃！", "var(--accent-green)");
            startSpecificCooldown("key1", 30);
        }
        else if (skill.id === "accelerator") {
            sendAttackToOpponents("blur", 10000, 0);
            showBattleAlert("🔥 熱い温度発動！", "var(--accent-red)");
            startSpecificCooldown("key1", 40);
        }
        else if (skill.id === "hacker_milestone4") {
            sendAttackToOpponents("maze", 0, 0);
            showBattleAlert("🔷 迷路を送信！", "#00ff00");
            startSpecificCooldown("key1", 45);
        }
        else if (skill.id === "invincible_man") {
            activateInvincible();
            startSpecificCooldown("key1", 30);
        }
        else if (skill.id === "swordsman") {
            sendAttackToOpponents("cut", 3000, 300);
            showCutEffect();
            showBattleAlert("⚔️ 切りつけ発動！3秒スタン＋血5秒", "#FF0000");
            startSpecificCooldown("key1", 15);
        }
        else if (skill.id === "hacker_trainee") {
            sendAttackToOpponents("hacker_tabs", 10000, 0);
            showBattleAlert("💻 タブ追加発動！", "#00ff00");
            startSpecificCooldown("key1", 35);
        }
        else if (skill.id === "narrator") {
            sendAttackToOpponents("action_game", 0, 0);
            showBattleAlert("🎮 アクションゲーム！", "#00ffff");
            startSpecificCooldown("key1", 150);
        }
    }

    if (keySlot === "key2") {
        if (cooldowns.key2 > 0) return;
        
        if (skill.id === "hacker") {
            sendRandomTargetAttack("jam", 5000, 800);
            showBattleAlert("🦠 ウイルスアタック！", "var(--accent-green)");
            startSpecificCooldown("key2", 70);
        }
        else if (skill.id === "accelerator") {
            sendAttackToOpponents("special_heat", 3000, 500);
            showBattleAlert("☄️ 特別加熱！", "var(--accent-red)");
            startSpecificCooldown("key2", 70);
        }
        else if (skill.id === "hacker_milestone4") {
            if (!skill.used) {
                sendAttackToOpponents("hacking", 3000, 0);
                showBattleAlert("💻 高度なハック！", "#ff0000");
                skill.used = true;
            }
        }
        else if (skill.id === "invincible_man") {
            sendAttackToOpponents("weak", 10000, 0);
            showBattleAlert("💫 相手は最弱！10秒間", "#ffff00");
            startSpecificCooldown("key2", 30);
        }
        else if (skill.id === "swordsman") {
            sendAttackToOpponents("big_cut", 6000, 0);
            showBattleAlert("⚔️ 大きな傷発動！6秒スタン＋血10秒＋最弱12秒", "#8B0000");
            startSpecificCooldown("key2", 30);
        }
        else if (skill.id === "hacker_trainee") {
            sendAttackToOpponents("screen_disturb", 3000, 0);
            showBattleAlert("🌀 画面操作発動！", "#ff69b4");
            startSpecificCooldown("key2", 25);
        }
        else if (skill.id === "narrator") {
            sendAttackToOpponents("puzzle_game", 0, 0);
            showBattleAlert("🧩 パズルゲーム！", "#00ff00");
            startSpecificCooldown("key2", 100);
        }
        else if (skill.id === "trapper") {
            if (!isStunned) {
                showBattleAlert("スタンしていないと使えません！", "#FF0000");
                return;
            }
            clearStun();
            showBattleAlert("💊 免疫力発動！スタンを解除！", "#00FF00");
            startSpecificCooldown("key2", 200);
        }
    }

    if (keySlot === "key3") {
        if (cooldowns.key3 > 0) return;
        
        if (skill.id === "accelerator") {
            score = Math.max(0, score - 3000);
            sendAttackToOpponents("reset_combo", 0, 0);
            showBattleAlert("💥 自爆！", "var(--accent-red)");
            startSpecificCooldown("key3", 200);
        }
        else if (skill.id === "hacker_milestone4") {
            sendAttackToOpponents("poison", 3000, 0);
            showBattleAlert("🧪 状態変異！", "#00ff00");
            startSpecificCooldown("key3", 35);
        }
        else if (skill.id === "hacker_trainee") {
            sendAttackToOpponents("fake_typing", 0, 0);
            showBattleAlert("📝 偽物タイピング発動！", "#ffa500");
            startSpecificCooldown("key3", 200);
        }
    }

    el("stat-score").innerText = score.toLocaleString();
    if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
};

function activateInvincible() {
    invincibleActive = true;
    showBattleAlert("🛡️ 無敵モード発動！15秒間全て無効！", "#FFD700");
    
    const invincibleEffect = el("invincible-effect");
    if (invincibleEffect) invincibleEffect.classList.remove("hidden");
    
    if (invincibleTimer) clearTimeout(invincibleTimer);
    invincibleTimer = setTimeout(() => {
        invincibleActive = false;
        if (invincibleEffect) invincibleEffect.classList.add("hidden");
        showBattleAlert("無敵モード終了", "#FFD700");
    }, 15000);
}

function activateWeak(durationMs) {
    weakActive = true;
    effectTimers.weak = durationMs;
    startEffectTimer('weak', durationMs);
    
    const weakEffect = el("weak-effect");
    if (weakEffect) weakEffect.classList.remove("hidden");
    
    if (weakTimer) clearTimeout(weakTimer);
    weakTimer = setTimeout(() => {
        weakActive = false;
        effectTimers.weak = 0;
        if (weakEffect) weakEffect.classList.add("hidden");
    }, durationMs);
}

function showScoreRoulette() {
    const roulette = el("score-roulette");
    roulette.classList.remove("hidden");
    window.scoreRouletteActive = true;
}

window.spinScoreRoulette = () => {
    if (!window.scoreRouletteActive) return;
    
    const wheel = el("score-roulette-wheel");
    wheel.classList.add("spinning");
    
    setTimeout(() => {
        wheel.classList.remove("spinning");
        const result = Math.random() < 0.5 ? "stun" : "steal";
        
        if (result === "stun") {
            wheel.innerText = "💫";
            sendAttackToOpponents("stun", 5000, 0);
            showBattleAlert("🎲 5秒スタン！", "#ff0000");
        } else {
            wheel.innerText = "💰";
            sendAttackToOpponents("steal", 0, 500);
            score += 500;
            showBattleAlert("🎲 500スコア奪取！", "#FFD700");
        }
        
        setTimeout(() => {
            el("score-roulette").classList.add("hidden");
            wheel.innerText = "?";
            window.scoreRouletteActive = false;
        }, 2000);
    }, 2000);
};

function activateRandomSkill() {
    const skills = Object.keys(SKILL_DB).filter(id => !SKILL_DB[id].gacha && id !== "hacker_trainee");
    const randomSkill = skills[Math.floor(Math.random() * skills.length)];
    showBattleAlert(`🎲 ランダム発動: ${SKILL_DB[randomSkill].name}`, "#FF69B4");
    
    if (randomSkill === "punch") sendAttackToOpponents("jam", 3000, 0);
    else if (randomSkill === "autotype") startAutoTypeEngine(3000, 70);
    else if (randomSkill === "thief") sendAttackToOpponents("steal", 0, 1200);
    else if (randomSkill === "revolver") {
        sendAttackToOpponents("jam", 6000, 500);
        score += 500;
    }
    else if (randomSkill === "comboUp") {
        comboMultiplier = 2;
        setTimeout(() => comboMultiplier = 1, 5000);
    }
}

function setStun(durationMs) {
    if (invincibleActive) {
        showBattleAlert("🛡️ 無敵状態のため無効化！", "#FFD700");
        return false;
    }
    if (equippedSkill === "slate") {
        showBattleAlert("🛡️ スレートがスタンを無効化！", "#AAAAAA");
        return false;
    }
    if (isStunned) return true;
    isStunned = true;
    effectTimers.stun = durationMs;
    startEffectTimer('stun', durationMs);
    el("jamming-overlay").classList.remove("hidden");
    if (stunTimer) clearTimeout(stunTimer);
    stunTimer = setTimeout(clearStun, durationMs);
    return true;
}

function clearStun() {
    isStunned = false;
    effectTimers.stun = 0;
    el("jamming-overlay").classList.add("hidden");
    if (stunTimer) clearTimeout(stunTimer);
    stunTimer = null;
}

function startAutoTypeEngine(durationMs, intervalMs) {
    clearInterval(autoTypeTimer);
    autoTypeTimer = setInterval(() => {
        if (!gameActive || isJamming || isStunned || hackerTabsActive > 0 || invincibleActive || fakeTypingActive) return;
        processCorrectType();
    }, intervalMs);
    
    setTimeout(() => clearInterval(autoTypeTimer), durationMs);
}

function createHackerTabs() {
    if (hackerTabsActive > 0 || invincibleActive) return;
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

function applyBlurEffect() {
    if (invincibleActive) return;
    const playScreen = el("screen-play");
    if (!playScreen) return;
    playScreen.style.transition = "none";
    playScreen.style.filter = "blur(20px)";
    effectTimers.blur = 10000;
    startEffectTimer('blur', 10000);
    
    let blurAmount = 20;
    clearInterval(blurIntervalTimer);
    
    blurIntervalTimer = setInterval(() => {
        blurAmount -= 2; 
        if (blurAmount <= 0) {
            blurAmount = 0;
            clearInterval(blurIntervalTimer);
            playScreen.style.filter = "none";
            effectTimers.blur = 0;
        } else {
            playScreen.style.filter = `blur(${blurAmount}px)`;
        }
    }, 1000);
}

function applyPaintEffect(durationMs) {
    if (invincibleActive) return;
    const paintOverlay = el("paint-overlay");
    if (!paintOverlay) return;
    const paintEffect = paintOverlay.querySelector('.paint-effect');
    if (!paintEffect) return;

    effectTimers.paint = durationMs;
    startEffectTimer('paint', durationMs);

    paintEffect.style.animation = 'none';
    paintEffect.style.opacity = '1';
    paintEffect.style.background = 'radial-gradient(circle at 50% 50%, rgba(255, 105, 180, 1) 0%, rgba(255, 105, 180, 1) 100%)';
    paintEffect.style.width = '100%';
    paintEffect.style.height = '100%';
    paintEffect.style.position = 'absolute';
    paintEffect.style.top = '0';
    paintEffect.style.left = '0';
    
    paintOverlay.classList.remove("hidden");

    const totalDuration = durationMs;
    const holdDuration = 2500;
    const fadeDuration = totalDuration - holdDuration;

    setTimeout(() => {
        let startTime = null;
        const fadeStep = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / fadeDuration, 1);
            paintEffect.style.opacity = (1 - progress).toString();
            if (progress < 1) {
                requestAnimationFrame(fadeStep);
            } else {
                paintOverlay.classList.add("hidden");
                paintEffect.style.opacity = '';
                paintEffect.style.background = '';
                effectTimers.paint = 0;
            }
        };
        requestAnimationFrame(fadeStep);
    }, holdDuration);
}

function applySwayEffect(durationMs) {
    if (invincibleActive) return;
    document.body.classList.add("swaying");
    effectTimers.sway = durationMs;
    startEffectTimer('sway', durationMs);
    setTimeout(() => {
        document.body.classList.remove("swaying");
        effectTimers.sway = 0;
    }, durationMs);
}

function applyScreenRotateEffect(durationMs) {
    if (invincibleActive) return;
    const playScreen = el("screen-play");
    let rotation = 0;
    const interval = setInterval(() => {
        rotation += 30;
        playScreen.style.transform = `rotate(${rotation}deg)`;
        if (rotation >= 360) {
            clearInterval(interval);
            setTimeout(() => playScreen.style.transform = "", 1000);
        }
    }, 100);
    setTimeout(() => clearInterval(interval), durationMs);
}

function showCutEffect() {
    const cutEffect = el("cut-effect");
    cutEffect.classList.remove("hidden");
    sounds.cut.play();
    setTimeout(() => cutEffect.classList.add("hidden"), 1000);
}

function showBloodEffect(durationMs) {
    const bloodEffect = el("blood-effect");
    bloodEffect.classList.remove("hidden");
    document.body.classList.add("bleeding");
    bleedingActive = true;
    effectTimers.bleeding = durationMs;
    startEffectTimer('bleeding', durationMs);
    sounds.blood.play();
    
    setTimeout(() => {
        bloodEffect.classList.add("hidden");
        document.body.classList.remove("bleeding");
        bleedingActive = false;
        effectTimers.bleeding = 0;
    }, durationMs);
}

function showLaughEffect() {
    const laughEffect = el("laugh-effect");
    laughEffect.classList.remove("hidden");
    setTimeout(() => laughEffect.classList.add("hidden"), 5000);
}

function generateMaze() {
    const size = 10;
    const maze = Array(size).fill().map(() => Array(size).fill(1));
    
    function carve(x, y) {
        const dirs = [
            [0, 2], [2, 0], [0, -2], [-2, 0]
        ];
        dirs.sort(() => Math.random() - 0.5);
        
        for (let [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < size && ny >= 0 && ny < size && maze[ny][nx] === 1) {
                maze[y + dy/2][x + dx/2] = 0;
                maze[ny][nx] = 0;
                carve(nx, ny);
            }
        }
    }
    
    maze[0][0] = 0;
    carve(0, 0);
    
    maze[size-1][size-1] = 2;
    
    let hasPath = false;
    for (let y = size-2; y >= 0; y--) {
        if (maze[y][size-1] === 0) hasPath = true;
        if (maze[size-1][y] === 0) hasPath = true;
    }
    
    if (!hasPath) {
        maze[size-2][size-1] = 0;
        maze[size-1][size-2] = 0;
    }
    
    return maze;
}

function renderMaze() {
    const grid = el("maze-grid");
    if (!grid) return;
    grid.innerHTML = "";
    
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
                if (Math.abs(x - mazePlayerPos.x) + Math.abs(y - mazePlayerPos.y) < 3) {
                    cell.style.opacity = "0.8";
                }
            }
            
            grid.appendChild(cell);
        }
    }
    
    const status = el("maze-status");
    if (status) status.innerHTML = `ゴールまで: ${distance}マス`;
}

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
    
    if (newX >= 0 && newX < 10 && newY >= 0 && newY < 10) {
        if (mazeGrid[newY][newX] !== 1) {
            mazePlayerPos.x = newX;
            mazePlayerPos.y = newY;
            renderMaze();
            
            if (newX === mazeGoalPos.x && newY === mazeGoalPos.y) {
                mazeActive = false;
                effectTimers.maze = 0;
                el("maze-overlay").classList.add("hidden");
                showBattleAlert("✅ 迷路クリア！", "var(--accent-green)");
                sounds.correct.play();
            } else {
                sounds.type.currentTime = 0;
                sounds.type.play();
            }
        } else {
            sounds.miss.currentTime = 0;
            sounds.miss.play();
        }
    }
};

function startHacking(duration) {
    if (invincibleActive) return;
    hackingActive = true;
    const overlay = el("hacking-overlay");
    const progress = document.querySelector(".hacking-progress");
    
    if (!overlay || !progress) return;
    overlay.classList.remove("hidden");
    
    effectTimers.hacking = duration;
    startEffectTimer('hacking', duration);
    
    let count = 3;
    progress.innerText = "3";
    
    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            progress.innerText = count;
        } else {
            clearInterval(interval);
            overlay.classList.add("hidden");
            hackingActive = false;
            effectTimers.hacking = 0;
            
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

function startPoison(duration) {
    if (invincibleActive) return;
    poisonActive = true;
    el("poison-overlay").classList.remove("hidden");
    document.body.classList.add("poisoned");
    
    effectTimers.poison = duration;
    startEffectTimer('poison', duration);
    
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
        effectTimers.poison = 0;
        el("poison-overlay").classList.add("hidden");
        document.body.classList.remove("poisoned");
        
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

// 偽物タイピング開始（改良版）- 本物と同じ青色のハイライト
function startFakeTyping() {
    if (invincibleActive) return;
    
    fakeTypingActive = true;
    
    // 現在のゲームの難易度に合わせた単語を選択
    const currentDifficulty = currentWords === WORD_DB.easy ? 'easy' : 
                             currentWords === WORD_DB.normal ? 'normal' : 'hard';
    
    // 同じ難易度からランダムに単語を選択
    const wordList = WORD_DB[currentDifficulty];
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    
    fakeTypingText = randomWord;
    const patterns = getRomaPatterns(randomWord);
    // ランダムなパターンを選択
    fakeTypingRoma = patterns[Math.floor(Math.random() * patterns.length)];
    fakeTypingIdx = 0;
    
    // 偽物タイピング専用表示エリアを表示
    const fakeDisplay = el("fake-typing-display");
    
    if (fakeDisplay) {
        fakeDisplay.classList.remove("hidden");
        const fakeJa = document.getElementById('fake-q-ja');
        const fakeDone = document.getElementById('fake-q-done');
        const fakeTodo = document.getElementById('fake-q-todo');
        
        if (fakeJa) fakeJa.innerText = fakeTypingText;
        if (fakeDone) fakeDone.innerText = "";
        if (fakeTodo) fakeTodo.innerText = fakeTypingRoma;
        
        // 本物の表示を非表示
        const realJa = el("q-ja");
        const realRoma = el("q-roma");
        if (realJa) realJa.style.display = 'none';
        if (realRoma) realRoma.style.display = 'none';
    }
    
    if (fakeTypingButtonTimer) clearTimeout(fakeTypingButtonTimer);
    fakeTypingButtonTimer = setTimeout(() => {
        if (fakeTypingActive) {
            const button = el("fake-typing-button");
            if (button) button.classList.remove("hidden");
        }
    }, 5000);
    
    if (fakeTypingTimer) clearTimeout(fakeTypingTimer);
    fakeTypingTimer = setTimeout(() => {
        if (fakeTypingActive) {
            clearFakeTyping();
            showBattleAlert("偽物タイピング終了", "#ffa500");
        }
    }, 20000);
}

function clearFakeTyping() {
    fakeTypingActive = false;
    fakeTypingIdx = 0;
    if (fakeTypingTimer) clearTimeout(fakeTypingTimer);
    if (fakeTypingButtonTimer) clearTimeout(fakeTypingButtonTimer);
    
    const button = el("fake-typing-button");
    if (button) button.classList.add("hidden");
    
    // 偽物表示を非表示、本物を再表示
    const fakeDisplay = el("fake-typing-display");
    const realJa = el("q-ja");
    const realRoma = el("q-roma");
    
    if (fakeDisplay) fakeDisplay.classList.add("hidden");
    if (realJa) realJa.style.display = 'block';
    if (realRoma) realRoma.style.display = 'block';
    
    nextQuestion();
}

window.detectFakeTyping = () => {
    if (!fakeTypingActive) return;
    
    clearFakeTyping();
    score += 3000;
    el("stat-score").innerText = score.toLocaleString();
    showBattleAlert("✅ 偽物を見切った！3000スコア獲得！", "#00ff00");
    sounds.correct.play();
};

// StarterGui（ハッキング）改良版 - 5秒後にタイピング可能に
function startStarterGui() {
    if (invincibleActive) return;
    
    hackingActive = true;
    const overlay = el("hacking-overlay");
    const text = overlay.querySelector(".hacking-text");
    const progress = overlay.querySelector(".hacking-progress");
    const message = overlay.querySelector(".hacking-message");
    
    if (text) text.innerHTML = "ハッキング！しかもウイルスあり！";
    if (progress) progress.innerText = "5";
    if (message) message.classList.add("hidden");
    
    overlay.classList.remove("hidden");
    
    let count = 5;
    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            if (progress) progress.innerText = count;
        } else {
            clearInterval(interval);
            
            // 5秒後にハッキング終了
            if (message) {
                message.classList.remove("hidden");
                message.innerHTML = "ハッキング終了";
            }
            
            setTimeout(() => {
                overlay.classList.add("hidden");
                hackingActive = false;
                
                // スキル封印とコンボ半減の効果を適用
                skillSealed = true;
                showBattleAlert("🔒 スキル封印！10秒間", "#ff0000");
                
                combo = Math.floor(combo / 2);
                el("stat-combo").innerText = combo;
                
                if (skillSealTimer) clearTimeout(skillSealTimer);
                skillSealTimer = setTimeout(() => {
                    skillSealed = false;
                    showBattleAlert("🔓 スキル封印解除", "#00ff00");
                }, 10000);
            }, 1000); // 完了メッセージを1秒表示してから非表示
        }
    }, 1000);
}

function handleIncomingAttack(attack) {
    if (!gameActive) return;
    if (invincibleActive) {
        showBattleAlert("🛡️ 無敵状態のため無効化！", "#FFD700");
        return;
    }

    if (equippedSkill === "slate") {
        if (attack.type === "jam" || attack.type === "stun" || attack.type === "hacking" || attack.type === "maze" || attack.type === "snipe" || attack.type === "dodge" || attack.type === "cut" || attack.type === "big_cut") {
            showBattleAlert("🛡️ スレートのパッシブで無効化！", "#AAAAAA");
            return;
        }
    }

    if (attack.type === "steal" && attack.stealAmount > 0) {
        if (bananaStacks > 0) {
            bananaStacks--;
            showBattleAlert("🍌 バナナでやられた！相手がスタン！", "#FFD700");
            sendAttackToTarget(attack.from, "stun", 3000, 0);
            return;
        }
        if (trapperStacks > 0) {
            trapperStacks--;
            showBattleAlert("🔫 トラップでやられた！相手がスタン！", "#FF4500");
            sendAttackToTarget(attack.from, "stun", 5000, 0);
            return;
        }
    }

    if (attack.stealAmount > 0) {
        score = Math.max(0, score - attack.stealAmount);
        el("stat-score").innerText = score.toLocaleString();
        if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
    }

    if (attack.type === "timeslip") {
        score = Math.max(0, score - attack.stealAmount);
        el("stat-score").innerText = score.toLocaleString();
        if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
        applyJamming(3000);
        return;
    }
    
    if (attack.type === "hacker_tabs") {
        createHackerTabs();
        sounds.miss.play();
        return;
    }
    
    if (attack.type === "blur" || attack.type === "megaphone") {
        applyBlurEffect();
        sounds.miss.play();
        return;
    }
    
    if (attack.type === "special_heat") {
        score = Math.max(0, score - 500);
        el("stat-score").innerText = score.toLocaleString();
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
    
    if (attack.type === "dodge") {
        el("dodge-overlay").classList.remove("hidden");
        
        let dodged = false;
        window.dodgeCallback = (success) => dodged = success;
        
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
        effectTimers.maze = 10000;
        startEffectTimer('maze', 10000);
        
        renderMaze();
        el("maze-overlay").classList.remove("hidden");
        sounds.miss.play();
        
        setTimeout(() => {
            if (mazeActive) {
                mazeActive = false;
                effectTimers.maze = 0;
                el("maze-overlay").classList.add("hidden");
                showBattleAlert("⏰ 迷路の時間切れ！", "var(--accent-red)");
            }
        }, 10000);
        
        showBattleAlert("🔍 矢印キーかボタンで移動！(10秒以内)", "var(--accent-blue)");
        return;
    }
    
    if (attack.type === "hacking") {
        startHacking(attack.duration);
        sounds.miss.play();
        return;
    }
    
    if (attack.type === "poison") {
        applyJamming(attack.duration);
        setTimeout(() => startPoison(10000), attack.duration);
        sounds.miss.play();
        return;
    }

    if (attack.type === "paint") {
        applyPaintEffect(attack.duration);
        sounds.miss.play();
        return;
    }

    if (attack.type === "snipe" || attack.type === "stun") {
        setStun(attack.duration);
        setTimeout(() => applySwayEffect(attack.duration), attack.duration);
        showBattleAlert("🎯 ヘッドショット！くらくら…", "#FF0000");
        sounds.miss.play();
        return;
    }

    if (attack.type === "cut") {
        showCutEffect();
        setStun(3000);
        setTimeout(() => showBloodEffect(5000), 3000);
        showBattleAlert("⚔️ 切りつけ！3秒スタン＋血5秒", "#FF0000");
        sounds.miss.play();
        return;
    }

    if (attack.type === "big_cut") {
        showCutEffect();
        setStun(6000);
        setTimeout(() => {
            showBloodEffect(10000);
            activateWeak(12000);
        }, 6000);
        showBattleAlert("⚔️ 大きな傷！6秒スタン＋血10秒＋最弱12秒", "#8B0000");
        sounds.miss.play();
        return;
    }

    if (attack.type === "status_attack") {
        setStun(3000);
        setTimeout(() => {
            if (Math.random() < 0.5) startPoison(10000);
            else showBloodEffect(10000);
        }, 3000);
        sounds.miss.play();
        return;
    }

    if (attack.type === "screen_disturb") {
        applySwayEffect(3000);
        setTimeout(() => applyScreenRotateEffect(4000), 3000);
        sounds.miss.play();
        return;
    }

    if (attack.type === "weak") {
        activateWeak(attack.duration || 10000);
        showBattleAlert("💫 最弱状態！10秒間", "#ffff00");
        sounds.miss.play();
        return;
    }

    if (attack.type === "fake_typing") {
        startFakeTyping();
        sounds.miss.play();
        return;
    }

    if (attack.type === "starter_gui") {
        startStarterGui();
        sounds.hack.play();
        return;
    }

    if (attack.type === "action_game") {
        startActionGame();
        return;
    }

    if (attack.type === "puzzle_game") {
        startPuzzleGame();
        return;
    }

    if (attack.duration > 0) applyJamming(attack.duration);
}

function applyJamming(durationMs) {
    if (invincibleActive) return;
    isJamming = true;
    effectTimers.jamming = durationMs;
    startEffectTimer('jamming', durationMs);
    el("jamming-overlay").classList.remove("hidden");
    sounds.miss.play(); 
    
    clearTimeout(jammingTimer);
    jammingTimer = setTimeout(() => {
        isJamming = false;
        effectTimers.jamming = 0;
        el("jamming-overlay").classList.add("hidden");
    }, durationMs);
}

// =========================================
// アクションゲーム関連
// =========================================
let actionGameActive = false;
let actionGamePlayer = { x: 50, y: 60, vy: 0 };
let actionGameSpikePos = { x: 300, y: 60 };
let actionGameGoalPos = { x: 350, y: 60 };
let actionGameEnemyPos = { x: 200, y: 60 };
let actionGameEnemyAlive = true;
let actionGameGravity = 0.8;
let actionGameOnGround = true;
let actionGameInterval = null;
let actionGameJumpPower = -12;

window.startActionGame = () => {
    actionGameActive = true;
    resetActionGame();
    el("action-game-overlay").classList.remove("hidden");
    if (actionGameInterval) clearInterval(actionGameInterval);
    actionGameInterval = setInterval(updateActionGame, 50);
    
    effectTimers.actionGame = 30000;
    startEffectTimer('actionGame', 30000);
    
    setTimeout(() => {
        if (actionGameActive) {
            closeActionGame();
            showBattleAlert("⏰ アクションゲーム終了！", "var(--accent-red)");
        }
    }, 30000);
};

function resetActionGame() {
    actionGamePlayer = { x: 50, y: 60, vy: 0 };
    actionGameOnGround = true;
    actionGameEnemyAlive = true;
    
    const enemy = document.querySelector('.action-game-enemy');
    if (enemy) enemy.style.display = 'block';
    updateActionGameDisplay();
}

window.closeActionGame = () => {
    actionGameActive = false;
    effectTimers.actionGame = 0;
    if (actionGameInterval) {
        clearInterval(actionGameInterval);
        actionGameInterval = null;
    }
    el("action-game-overlay").classList.add("hidden");
};

window.moveActionGame = (dir) => {
    if (!actionGameActive) return;
    if (dir === 'left') {
        actionGamePlayer.x = Math.max(0, actionGamePlayer.x - 20);
    } else if (dir === 'right') {
        actionGamePlayer.x = Math.min(350, actionGamePlayer.x + 20);
    } else if (dir === 'jump') {
        if (actionGameOnGround) {
            actionGamePlayer.vy = actionGameJumpPower;
            actionGameOnGround = false;
        }
    }
};

function updateActionGame() {
    if (!actionGameActive) return;
    
    actionGamePlayer.vy += actionGameGravity;
    actionGamePlayer.y += actionGamePlayer.vy;
    
    if (actionGamePlayer.y >= 60) {
        actionGamePlayer.y = 60;
        actionGamePlayer.vy = 0;
        actionGameOnGround = true;
    }
    
    updateActionGameDisplay();
    checkActionGameCollision();
}

function updateActionGameDisplay() {
    const player = document.querySelector('.action-game-player');
    const spike = document.querySelector('.action-game-spike');
    const goal = document.querySelector('.action-game-goal');
    let enemy = document.querySelector('.action-game-enemy');
    
    if (!enemy && actionGameActive) {
        enemy = document.createElement('div');
        enemy.className = 'action-game-enemy';
        enemy.style.position = 'absolute';
        enemy.style.bottom = '30px';
        enemy.style.fontSize = '30px';
        enemy.innerText = '🐢';
        document.querySelector('.action-game-canvas').appendChild(enemy);
    }
    
    if (player) {
        player.style.left = actionGamePlayer.x + 'px';
        player.style.bottom = (actionGamePlayer.y - 30) + 'px';
    }
    if (enemy) {
        if (actionGameEnemyAlive) {
            enemy.style.display = 'block';
            enemy.style.left = actionGameEnemyPos.x + 'px';
            enemy.style.bottom = (actionGameEnemyPos.y - 30) + 'px';
        } else {
            enemy.style.display = 'none';
        }
    }
}

function checkActionGameCollision() {
    if (Math.abs(actionGamePlayer.x - actionGameSpikePos.x) < 30 && !actionGameOnGround) {
        showBattleAlert("トゲに当たった！最初からやり直し", "#ff0000");
        resetActionGame();
    }
    if (actionGameEnemyAlive && Math.abs(actionGamePlayer.x - actionGameEnemyPos.x) < 30) {
        if (!actionGameOnGround) {
            actionGameEnemyAlive = false;
            showBattleAlert("敵を倒した！", "var(--accent-green)");
            sounds.correct.play();
        } else {
            showBattleAlert("敵にぶつかった！最初からやり直し", "#ff0000");
            resetActionGame();
        }
    }
    if (Math.abs(actionGamePlayer.x - actionGameGoalPos.x) < 30) {
        showBattleAlert("ゴール！クリア！", "var(--accent-green)");
        sounds.correct.play();
        closeActionGame();
    }
}

// =========================================
// パズルゲーム
// =========================================
let puzzleDots = [];
let puzzleSelected = [];
let puzzleConnections = [];

window.startPuzzleGame = () => {
    puzzleDots = [];
    for (let i = 1; i <= 16; i++) puzzleDots.push({ id: i, connected: false });
    puzzleSelected = [];
    puzzleConnections = [];
    renderPuzzleGrid();
    el("puzzle-game-overlay").classList.remove("hidden");
    
    effectTimers.puzzleGame = 30000;
    startEffectTimer('puzzleGame', 30000);
    
    setTimeout(() => {
        if (!el("puzzle-game-overlay").classList.contains("hidden")) {
            closePuzzleGame();
            showBattleAlert("⏰ パズルゲーム終了！", "var(--accent-red)");
        }
    }, 30000);
};

window.closePuzzleGame = () => {
    effectTimers.puzzleGame = 0;
    el("puzzle-game-overlay").classList.add("hidden");
};

window.resetPuzzle = () => {
    puzzleDots.forEach(d => d.connected = false);
    puzzleSelected = [];
    puzzleConnections = [];
    renderPuzzleGrid();
};

function renderPuzzleGrid() {
    const grid = el("puzzle-grid");
    if (!grid) return;
    grid.innerHTML = "";
    
    puzzleDots.forEach((dot, index) => {
        const dotEl = document.createElement("div");
        dotEl.className = `puzzle-dot ${dot.connected ? 'connected' : ''}`;
        dotEl.dataset.index = index;
        dotEl.onclick = () => selectPuzzleDot(index);
        dotEl.innerText = dot.connected ? '✓' : dot.id;
        const xOffset = Math.random() * 20 - 10;
        const yOffset = Math.random() * 20 - 10;
        dotEl.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        grid.appendChild(dotEl);
    });
}

function selectPuzzleDot(index) {
    if (puzzleDots[index].connected) return;
    
    if (puzzleSelected.includes(index)) {
        puzzleSelected = puzzleSelected.filter(i => i !== index);
    } else if (puzzleSelected.length < 2) {
        puzzleSelected.push(index);
    }
    
    if (puzzleSelected.length === 2) {
        const [a, b] = puzzleSelected;
        if (!puzzleDots[a].connected && !puzzleDots[b].connected) {
            puzzleDots[a].connected = true;
            puzzleDots[b].connected = true;
            puzzleConnections.push({ from: a, to: b });
        }
        puzzleSelected = [];
        renderPuzzleGrid();
        
        if (puzzleDots.every(d => d.connected)) {
            showBattleAlert("全ての点をつなげた！クリア！", "var(--accent-green)");
            sounds.correct.play();
            closePuzzleGame();
        }
    } else {
        renderPuzzleGrid();
        document.querySelectorAll('.puzzle-dot').forEach((el, i) => {
            if (puzzleSelected.includes(i)) el.classList.add('selected');
        });
    }
}

// =========================================
// ストーリーモード制御（第3章ロック機能強化・完全修正版）
// =========================================
window.openStoryMode = () => {
    if (isMatchmaking || trainingMode) {
        alert("マッチング待機中・修行中はストーリーモードを開けません");
        return;
    }
    get(ref(db, `users/${myId}/story_progress`)).then(snap => {
        if (snap.exists()) {
            storyProgress = snap.val();
        }
        openScreen("screen-story");
        renderStoryMap();
    }).catch(err => {
        console.error("ストーリー進捗取得エラー:", err);
        openScreen("screen-story");
        renderStoryMap();
    });
};

function renderStoryMap() {
    updateChapterLocks();
    
    const map1 = el("story-map-1");
    if (map1) {
        map1.innerHTML = "";
        STORY_STAGES.chapter1.forEach((stage, index) => {
            const stageNum = index + 1;
            const isLocked = storyProgress.chapter1 < stageNum - 1;
            const isCompleted = storyProgress.chapter1 >= stageNum;
            const isCurrent = storyProgress.chapter1 === stageNum - 1 && !isCompleted;
            
            const node = document.createElement("div");
            node.className = `stage-node ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''} ${stage.boss ? 'boss-stage' : ''} ${isCurrent ? 'current' : ''}`;
            node.onclick = () => !isLocked && selectStage(1, stageNum);
            
            node.innerHTML = `
                <div class="stage-number">1-${stageNum}</div>
                <div class="stage-target">${stage.target.toLocaleString()}</div>
            `;
            map1.appendChild(node);
        });
    }

    const map2 = el("story-map-2");
    if (map2) {
        map2.innerHTML = "";
        STORY_STAGES.chapter2.forEach((stage, index) => {
            const stageNum = index + 1;
            const chapterLocked = storyProgress.chapter1 < 7;
            const isLocked = chapterLocked || storyProgress.chapter2 < stageNum - 1;
            const isCompleted = !chapterLocked && storyProgress.chapter2 >= stageNum;
            const isCurrent = !chapterLocked && storyProgress.chapter2 === stageNum - 1 && !isCompleted;
            
            const node = document.createElement("div");
            node.className = `stage-node ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''} ${stage.boss ? 'boss-stage' : ''} ${isCurrent ? 'current' : ''}`;
            node.onclick = () => !isLocked && selectStage(2, stageNum);
            
            node.innerHTML = `
                <div class="stage-number">2-${stageNum}</div>
                <div class="stage-target">${stage.target.toLocaleString()}</div>
            `;
            map2.appendChild(node);
        });
    }

    const map3 = el("story-map-3");
    if (map3) {
        map3.innerHTML = "";
        STORY_STAGES.chapter3.forEach((stage, index) => {
            const stageNum = index + 1;
            // 第3章のロック条件：第2章をクリアしていないと章全体がロック
            const chapterLocked = storyProgress.chapter2 < 7;
            // 前のステージをクリアしていないとロック（第1章と同じロジック）
            const isLocked = chapterLocked || storyProgress.chapter3 < stageNum - 1;
            const isCompleted = !chapterLocked && storyProgress.chapter3 >= stageNum;
            const isCurrent = !chapterLocked && storyProgress.chapter3 === stageNum - 1 && !isCompleted;
            
            const node = document.createElement("div");
            node.className = `stage-node ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''} ${stage.boss ? 'boss-stage' : ''} ${isCurrent ? 'current' : ''}`;
            node.onclick = () => !isLocked && selectStage(3, stageNum);
            
            node.innerHTML = `
                <div class="stage-number">3-${stageNum}</div>
                <div class="stage-target">${stage.target.toLocaleString()}</div>
            `;
            map3.appendChild(node);
        });
    }
    
    document.querySelectorAll('.chapter-tab').forEach(tab => {
        tab.onclick = () => {
            const chapter = parseInt(tab.dataset.chapter);
            if (isChapterLocked(chapter)) {
                alert(`第${chapter}章は前の章をクリアすると解放されます`);
                return;
            }
            
            document.querySelectorAll('.chapter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.story-chapter').forEach(ch => ch.classList.add('hidden'));
            const targetChapter = el(`story-chapter-${tab.dataset.chapter}`);
            if (targetChapter) targetChapter.classList.remove('hidden');
        };
    });
}

function isChapterLocked(chapter) {
    if (chapter === 1) return false;
    if (chapter === 2) return storyProgress.chapter1 < 7;
    if (chapter === 3) return storyProgress.chapter2 < 7;
    return true;
}

function updateChapterLocks() {
    document.querySelectorAll('.chapter-tab').forEach(tab => {
        const chapter = parseInt(tab.dataset.chapter);
        if (isChapterLocked(chapter)) {
            tab.classList.add('locked-chapter');
        } else {
            tab.classList.remove('locked-chapter');
        }
    });
}

function selectStage(chapter, stage) {
    // 厳密なロックチェック（第1章と同じロジック）
    if (chapter === 1) {
        if (stage > storyProgress.chapter1 + 1) {
            alert("前のステージをクリアしてください");
            return;
        }
    } else if (chapter === 2) {
        if (storyProgress.chapter1 < 7) {
            alert("第1章をクリアしてください");
            return;
        }
        if (stage > storyProgress.chapter2 + 1) {
            alert("前のステージをクリアしてください");
            return;
        }
    } else if (chapter === 3) {
        if (storyProgress.chapter2 < 7) {
            alert("第2章をクリアしてください");
            return;
        }
        if (stage > storyProgress.chapter3 + 1) {
            alert("前のステージをクリアしてください");
            return;
        }
    }
    
    currentStage = { chapter, stage };
    const stageData = chapter === 1 ? STORY_STAGES.chapter1[stage - 1] :
                     chapter === 2 ? STORY_STAGES.chapter2[stage - 1] :
                     STORY_STAGES.chapter3[stage - 1];
    
    const titleEl = el("stage-title");
    const timeEl = el("stage-time");
    const targetEl = el("stage-target");
    const rewardEl = el("stage-reward");
    const bossInfoEl = el("boss-info");
    const bossSkillNameEl = el("boss-skill-name");
    
    if (titleEl) titleEl.innerText = `${chapter}-${stage}`;
    if (timeEl) timeEl.innerText = "60";
    if (targetEl) targetEl.innerText = stageData.target.toLocaleString();
    if (rewardEl) rewardEl.innerText = stageData.reward.toLocaleString();
    
    if (stageData.boss && bossInfoEl && bossSkillNameEl) {
        bossInfoEl.classList.remove("hidden");
        let skillName = "";
        if (stageData.skill === "hanabi") skillName = "花火";
        else if (stageData.skill === "hacker_milestone4") skillName = "ハッカーマイルストーン4";
        else if (stageData.skill === "invincible_man") skillName = "無敵マン";
        bossSkillNameEl.innerText = skillName;
        
        const skillId = stageData.skill;
        if (ownedSkills.includes(skillId)) {
            bossSkillNameEl.innerHTML += ' <span style="color: var(--accent-green);">(獲得済み)</span>';
        } else {
            bossSkillNameEl.innerHTML += ' <span style="color: var(--accent-red);">(未獲得)</span>';
        }
    } else if (bossInfoEl) {
        bossInfoEl.classList.add("hidden");
    }
    
    updateStageButtons();
    openScreen("screen-stage-detail");
}

function updateStageButtons() {
    const soloBtn = el("story-solo-btn");
    const partyBtn = el("story-party-btn");
    const restrictionMsg = el("party-restriction-msg");
    
    if (!soloBtn || !partyBtn || !restrictionMsg) return;
    
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
            if (progress.chapter1 < currentStage.stage - 1) allCleared = false;
        } else if (currentStage.chapter === 2) {
            if (progress.chapter1 < 7 || progress.chapter2 < currentStage.stage - 1) allCleared = false;
        } else {
            if (progress.chapter2 < 7 || progress.chapter3 < currentStage.stage - 1) allCleared = false;
        }
    }
    
    const msg = el("party-restriction-msg");
    const partyBtn = el("story-party-btn");
    if (!msg || !partyBtn) return;
    
    if (!allCleared) {
        msg.classList.remove("hidden");
        partyBtn.disabled = true;
    } else {
        msg.classList.add("hidden");
        partyBtn.disabled = false;
    }
}

window.startStorySolo = () => {
    if (myPartyId || trainingMode) {
        alert("パーティー参加中・修行中は一人プレイできません");
        return;
    }
    
    const stageData = currentStage.chapter === 1 ? STORY_STAGES.chapter1[currentStage.stage - 1] :
                     currentStage.chapter === 2 ? STORY_STAGES.chapter2[currentStage.stage - 1] :
                     STORY_STAGES.chapter3[currentStage.stage - 1];
    
    const diffs = ["easy", "normal", "hard"];
    const randomDiff = diffs[Math.floor(Math.random() * diffs.length)];
    currentWords = WORD_DB[randomDiff];
    
    isStoryMode = true;
    storyTargetScore = stageData.target;
    
    const progressBar = el("story-progress-bar");
    if (progressBar) {
        progressBar.classList.remove("hidden");
        const targetEl = el("progress-target");
        if (targetEl) targetEl.innerText = storyTargetScore.toLocaleString();
        updateProgressBar(0);
    }
    
    openScreen("screen-play");
    startGame(60);
};

window.startStoryParty = () => {
    if (!myPartyId || !isLeader) {
        alert("パーティーリーダーのみ開始できます");
        return;
    }
    
    const stageData = currentStage.chapter === 1 ? STORY_STAGES.chapter1[currentStage.stage - 1] :
                     currentStage.chapter === 2 ? STORY_STAGES.chapter2[currentStage.stage - 1] :
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

window.backToStory = () => {
    openScreen("screen-story");
    renderStoryMap();
};

window.executeDodge = () => {
    if (window.dodgeCallback) window.dodgeCallback(true);
};

// --- 修行モード ---
window.openTraining = () => {
    if (myPartyId || isMatchmaking) {
        alert("パーティー中・マッチング待機中は修行できません");
        return;
    }
    openScreen("screen-training");
    updateTrainingStatus();
};

function updateTrainingStatus() {
    const status1 = el("training-1-status");
    const status2 = el("training-2-status");
    
    if (status1) {
        status1.innerText = ownedSkills.includes("swordsman") ? "✓ クリア済み" : "未クリア";
        status1.style.color = ownedSkills.includes("swordsman") ? "var(--accent-green)" : "var(--accent-red)";
    }
    if (status2) {
        status2.innerText = ownedSkills.includes("hacker_trainee") ? "✓ クリア済み" : "未クリア";
        status2.style.color = ownedSkills.includes("hacker_trainee") ? "var(--accent-green)" : "var(--accent-red)";
    }
}

window.startTraining = (type) => {
    if (myPartyId || isMatchmaking) return;
    if (type === 1 && ownedSkills.includes("swordsman")) {
        if (!confirm("既にクリア済みです。もう一度挑戦しますか？")) return;
    }
    if (type === 2 && ownedSkills.includes("hacker_trainee")) {
        if (!confirm("既にクリア済みです。もう一度挑戦しますか？")) return;
    }
    
    trainingMode = true;
    trainingType = type;
    trainingScore = type === 1 ? 45000 : 50000;
    
    const diffs = ["easy", "normal", "hard"];
    const randomDiff = diffs[Math.floor(Math.random() * diffs.length)];
    currentWords = WORD_DB[randomDiff];
    
    isStoryMode = true;
    storyTargetScore = trainingScore;
    
    const progressBar = el("story-progress-bar");
    if (progressBar) {
        progressBar.classList.remove("hidden");
        const targetEl = el("progress-target");
        if (targetEl) targetEl.innerText = storyTargetScore.toLocaleString();
        updateProgressBar(0);
    }
    
    openScreen("screen-play");
    startGame(60);
};

function trainingAttack() {
    showCutEffect();
    score = Math.max(0, score - 200);
    setStun(1000);
    el("stat-score").innerText = score.toLocaleString();
    showBattleAlert("⚔️ 修行の攻撃！200スコア減少！", "#FF0000");
}

function trainingStatusAttack() {
    if (Math.random() < 0.5) {
        setStun(3000);
        setTimeout(() => {
            if (Math.random() < 0.5) startPoison(10000);
            else showBloodEffect(10000);
        }, 3000);
    } else {
        createHackerTabs();
    }
    showBattleAlert("⚠️ 修行の特殊攻撃！", "#FF00FF");
}

// --- モード制御 ---
window.openSingleSelect = () => {
    if (myPartyId || isMatchmaking || trainingMode) return; 
    openScreen("screen-single-select");
};

window.startSingle = (diff) => { 
    if (myPartyId || isMatchmaking || trainingMode) return; 
    currentWords = WORD_DB[diff]; 
    openScreen("screen-play"); 
    startGame(60); 
};

window.openFriendBattle = () => {
    if (isMatchmaking || trainingMode) return;
    if (!myPartyId) return alert("パーティーに参加していません！");
    if (!isLeader) return alert("リーダー限定です！");
    openScreen("screen-battle-setup");
    updateTeamSetupUI();
    updateHandicapSetupUI();
};

window.launchBattle = () => {
    if (!myPartyId || !isLeader) return;
    const selectedTime = parseInt(el("setup-time").value, 10);
    const selectedDiff = el("setup-diff").value;
    const selectedMode = el("setup-mode").value;
    
    update(ref(db, `parties/${myPartyId}`), {
        state: "ready_check",
        time: selectedTime,
        diff: selectedDiff,
        teamMode: selectedMode
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
    if (trainingMode) return alert("修行中は利用できません");
    
    const n = prompt("何人で遊ぶ？ (2-4)");
    if (![2,3,4].includes(Number(n))) return;
    isMatchmaking = true;
    updateButtonStates();
    set(ref(db, `matchmaking/${n}/${myId}`), { name: myName, skin: skinData });
    alert("マッチング待機中...");
    onValue(ref(db, `matchmaking/${n}`), snap => {
        const players = snap.val();
        if (players && Object.keys(players).length >= n) {
            const ids = Object.keys(players).slice(0, n);
            if (ids[0] === myId) {
                const pid = "match_" + myId;
                const members = {};
                ids.forEach(id => { 
                    const player = players[id];
                    members[id] = { 
                        name: player.name, 
                        score: 0, 
                        ready: false,
                        skin: player.skin || { skin: "skin-1", face: "face-1" },
                        team: Math.random() < 0.5 ? "red" : "blue",
                        handicap: "none"
                    }; 
                    remove(ref(db, `matchmaking/${n}/${id}`)); 
                });
                set(ref(db, `parties/${pid}`), { 
                    leader: myId, 
                    state: "ready_check", 
                    time: 30, 
                    diff: "normal", 
                    members,
                    teamMode: "solo"
                });
                ids.forEach(id => update(ref(db, `users/${id}`), { partyId: pid }));
            }
            isMatchmaking = false; 
            updateButtonStates();
        }
    });
};

// --- 初期化 ---
const idDisplay = el("my-id-display");
if (idDisplay) idDisplay.innerText = myId;
const nameInput = el("my-name-input");
if (nameInput) nameInput.value = myName;

const userRef = ref(db, `users/${myId}`);

get(userRef).then(snap => {
    if(snap.exists()) {
        let data = snap.val();
        if(data.coins !== undefined) coins = data.coins;
        if(data.skills !== undefined) ownedSkills = data.skills;
        if(data.equipped !== undefined) equippedSkill = data.equipped;
        if(data.story_progress !== undefined) storyProgress = data.story_progress;
        if(data.skin !== undefined) skinData = data.skin;
        if(data.accessory !== undefined) equippedAccessory = data.accessory;
        if(data.tysm_used !== undefined) tysmUsed = data.tysm_used;
        if(data.byramo_used !== undefined) byramoUsed = data.byramo_used;
        if(data.yuseSyazai2_used !== undefined) yuseSyazai2Used = data.yuseSyazai2_used;
        if(data.daily_code) dailyCode = data.daily_code;
        if(data.daily_code_date) dailyCodeDate = data.daily_code_date;
        if(data.used_codes) usedCodes = data.used_codes;
        
        localStorage.setItem("ramo_tysm_used", tysmUsed.toString());
        localStorage.setItem("ramo_byramo_used", byramoUsed.toString());
        localStorage.setItem("ramo_yuseSyazai2_used", yuseSyazai2Used.toString());
        localStorage.setItem("ramo_daily_code", dailyCode);
        localStorage.setItem("ramo_daily_date", dailyCodeDate);
        localStorage.setItem("ramo_used_codes", JSON.stringify(usedCodes));
    }
    saveAndDisplayData();
    updateTrainingStatus();
}).catch(err => console.error("Firebase load error:", err));

update(userRef, { 
    name: myName, 
    status: "online", 
    partyId: null, 
    story_progress: storyProgress,
    skin: skinData,
    accessory: equippedAccessory,
    tysm_used: tysmUsed,
    byramo_used: byramoUsed,
    yuseSyazai2_used: yuseSyazai2Used,
    daily_code: dailyCode,
    daily_code_date: dailyCodeDate,
    used_codes: usedCodes,
    lastSeen: Date.now()
}).catch(err => console.error("Firebase update error:", err));

onDisconnect(userRef).update({ status: "offline", lastSeen: Date.now() });

updateButtonStates();

const timeSlider = el("setup-time");
const timeLabel = el("time-val"); 
if (timeSlider && timeLabel) {
    timeSlider.addEventListener("input", (e) => timeLabel.innerText = e.target.value);
}

checkDailyCode();
startCodeTimer();
updateProfileFace();

window.goHome();
