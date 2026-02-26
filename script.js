// =========================================
// ULTIMATE TYPING ONLINE - RAMO EDITION
// FIREBASE & TYPING ENGINE V10.6 (Final fixes)
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
    coin: new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3")
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
let gameStartTime = null; // サーバー時刻同期用（今回は未使用）

let coins = parseInt(localStorage.getItem("ramo_coins")) || 1000;

// --- コードシステム用グローバル変数 ---
let usedCodes = JSON.parse(localStorage.getItem("ramo_used_codes")) || [];
let dailyCode = localStorage.getItem("ramo_daily_code") || generateDailyCode();
let dailyCodeDate = localStorage.getItem("ramo_daily_date") || new Date().toDateString();
let codeTimer = null;

// 特殊コード使用フラグ（Firebaseでも管理）
let tysmUsed = localStorage.getItem("ramo_tysm_used") === "true";
let byramoUsed = localStorage.getItem("ramo_byramo_used") === "true";
let yuseSyazai2Used = localStorage.getItem("ramo_yuseSyazai2_used") === "true";

// コンボアップの神スキル
let comboGodActive = false;
let comboGodTimer = null;

// --- スキンシステム用グローバル変数 ---
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

// --- ストーリーモード用グローバル変数 ---
let storyProgress = JSON.parse(localStorage.getItem("ramo_story_progress")) || { chapter1: 0, chapter2: 0 };
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

// --- デバッグモード用変数 ---
let debugCode = "";
let debugActive = false;
let debugKeys = { w: false, l: false };

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
    comboGod: {
        id: "comboGod",
        name: "コンボアップの神",
        cost: 0,
        cooldown: 0,
        desc: "【1回のみ使用可能】7秒間、コンボの数が3.5倍になる",
        special: true
    }
};

// =========================================
// 追加：ガチャキャラクターデータベース
// =========================================
const GACHA_CHAR_DB = {
    // R (レア) 3種
    paintballer: {
        id: "paintballer",
        name: "ペイントボーラー",
        rarity: "R",
        desc: "【ペイント】CT15秒: 相手の画面に5秒間ペイントを塗り潰す（徐々に透明）",
        cooldown: 15,
        gacha: true
    },
    banana: {
        id: "banana",
        name: "バナナ",
        rarity: "R",
        desc: "【バナナをしく】CT5秒: バナナを設置（スタック可能）。スコアを奪う相手が自分を奪うと、奪った相手を3秒スタン",
        cooldown: 5,
        gacha: true
    },
    slate: {
        id: "slate",
        name: "スレート",
        rarity: "R",
        desc: "【パッシブ】スタン無効（ハッカータブ・高度なハックも無効）",
        cooldown: 0,
        gacha: true
    },
    // SR (スーパーレア) 2種
    trapper: {
        id: "trapper",
        name: "トラッパー",
        rarity: "SR",
        desc: "【トラップ】CT15秒: トラップ設置（スタック可）。スコア奪取攻撃を受けると相手の奪取失敗＆5秒スタン\n【免疫力】CT200秒: スタン中のみ使用可、スタン解除",
        cooldown: 15,
        gacha: true
    },
    rifleman: {
        id: "rifleman",
        name: "ライフルマン",
        rarity: "SR",
        desc: "【ヘッドショット】CT45秒: ランダムな相手1人を5秒スタン＆5秒間画面ゆらゆら",
        cooldown: 45,
        gacha: true
    },
    // UR (ウルトラレア) 1種
    narrator: {
        id: "narrator",
        name: "ナレーター",
        rarity: "UR",
        desc: "【アクションゲーム】CT150秒: 相手全員にアクションゲーム画面表示（操作：←→移動、Spaceジャンプ）\n【パズルゲーム】CT100秒: ドットコネクト（16個の丸を繋ぐ）\n【メガホン】CT10秒: 相手画面を10秒間ぼやけさせる",
        cooldown: 150,
        gacha: true
    }
};

// 既存の SKILL_DB にガチャキャラを追加
const SKILL_DB = {
    punch: { id: "punch", name: "パンチ", cost: 15000, cooldown: 45, desc: "相手は3秒間タイピング不可" },
    autotype: { id: "autotype", name: "自動入力", cost: 50000, cooldown: 25, desc: "3秒間爆速で自動タイピング" },
    comboUp: { id: "comboUp", name: "コンボアップ", cost: 50000, cooldown: 35, desc: "5秒間コンボ増加量が2倍" },
    revolver: { id: "revolver", name: "リボルバー", cost: 100000, cooldown: 45, desc: "相手は6秒間タイピング不可＆500スコア奪う" },
    thief: { id: "thief", name: "泥棒", cost: 75000, cooldown: 25, desc: "相手から1200スコア奪う" },
    timeslip: { id: "timeslip", name: "タイムスリップ", cost: 250000, cooldown: 0, desc: "【1回使い切り】相手スコア半減＆3秒妨害。自分は6秒爆速自動入力" },
    fundraiser: { id: "fundraiser", name: "資金稼ぎ", cost: 15000, cooldown: 0, desc: "【パッシブ】試合後にもらえるコインが常に2倍になる" },
    godfundraiser: { id: "godfundraiser", name: "神資金稼ぎ", cost: 100000, cooldown: 0, desc: "【パッシブ】試合後にもらえるコインが常に4倍になる" },
    godfather: { id: "godfather", name: "ゴッドファザー", cost: 50000, cooldown: 25, desc: "【任務/Space】10秒間、タイピング成功時に(コンボ数×20)のコインを直接獲得" },
    hacker: { id: "hacker", name: "ハッカー", cost: 250000, cooldown: 0, desc: "【タブ追加/キー:1】CT30秒: 相手画面の中央付近に消去必須タブを10個出す（10秒間妨害）\n【ウイルス/キー:2】CT70秒: ランダムな相手を5秒スタン＆800スコア奪う" },
    accelerator: { id: "accelerator", name: "アクセラレーター", cost: 500000, cooldown: 0, desc: "【熱い温度/キー:1】CT40秒: 相手の画面全体を10秒間ぼやけさせる\n【特別加熱/キー:2】CT70秒: 相手を3秒スタン＆500スコア減少\n【自爆/キー:3】CT200秒: 自スコア3000減＆相手のコンボを0にする" },
    ...NEW_SKILLS,
    // ガチャキャラを追加（gachaフラグを付与）
    ...Object.fromEntries(
        Object.entries(GACHA_CHAR_DB).map(([key, val]) => [key, { ...val, cost: 0 }])
    )
};

// --- ガチャ関連の追加グローバル変数 ---
const GACHA_COST = 50000;        // 1回のコスト
const GACHA_COST_10 = 450000;     // 10連のコスト（10%OFF）

// ガチャ確率（%）
const GACHA_RATES = {
    R: 75,
    SR: 23.5,
    UR: 1.5
};

// 各レアリティに属するキャラID（GACHA_CHAR_DB から抽出）
const GACHA_CHARS_BY_RARITY = {
    R: Object.values(GACHA_CHAR_DB).filter(c => c.rarity === 'R').map(c => c.id),
    SR: Object.values(GACHA_CHAR_DB).filter(c => c.rarity === 'SR').map(c => c.id),
    UR: Object.values(GACHA_CHAR_DB).filter(c => c.rarity === 'UR').map(c => c.id)
};

// =========================================
// 追加：ガチャ能力用の変数
// =========================================
let bananaStacks = 0;           // バナナ設置数
let trapperStacks = 0;          // トラップ設置数
let isStunned = false;          // スタン状態（タイピング不可）
let stunTimer = null;           // スタン解除タイマー

// --- パーティーメンバー情報をキャッシュする変数（クリア判定用）---
let partyMembers = {};           // { memberId: { name, score, ... } }

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
    
    // 日付が変わっていたら新しいコードを生成
    if (dailyCodeDate !== today) {
        dailyCode = generateDailyCode();
        dailyCodeDate = today;
        // デイリーコードの使用済みリセット（デイリーコードのみ）
        const dailyUsedCodes = usedCodes.filter(code => code !== dailyCode);
        usedCodes = dailyUsedCodes;
        localStorage.setItem("ramo_daily_code", dailyCode);
        localStorage.setItem("ramo_daily_date", dailyCodeDate);
        localStorage.setItem("ramo_used_codes", JSON.stringify(usedCodes));
        
        // Firebaseにも保存
        const userRef = ref(db, `users/${myId}`);
        update(userRef, {
            daily_code: dailyCode,
            daily_code_date: dailyCodeDate
        }).catch(err => console.error("Firebase daily code update error:", err));
    }
    
    // UI更新
    updateDailyCodeDisplay();
}

// デイリーコード表示更新
function updateDailyCodeDisplay() {
    const dailyCodeEl = el("daily-code");
    if (dailyCodeEl) {
        dailyCodeEl.innerText = dailyCode;
    }
}

// 次の更新までの時間を計算
function getTimeUntilNextUpdate() {
    const now = new Date();
    const nextUpdate = new Date();
    nextUpdate.setHours(7, 0, 0, 0); // 朝7時
    
    if (now > nextUpdate) {
        nextUpdate.setDate(nextUpdate.getDate() + 1);
    }
    
    const diff = nextUpdate - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// タイマー更新
function startCodeTimer() {
    if (codeTimer) clearInterval(codeTimer);
    
    codeTimer = setInterval(() => {
        const timerEl = el("daily-code-timer");
        if (timerEl) {
            timerEl.innerText = `更新まで: ${getTimeUntilNextUpdate()}`;
        }
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

// Firebaseからコード使用状況を読み込む関数
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
            
            // ローカルストレージも更新
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

// データ全リセット関数（隠しコードBA3用）
async function resetAllData() {
    // ローカルストレージをクリア
    localStorage.clear();
    // Firebase上のユーザーデータを初期化
    const userRef = ref(db, `users/${myId}`);
    await set(userRef, {
        name: myName,
        status: "online",
        partyId: null,
        coins: 1000,
        skills: ["none"],
        equipped: "none",
        story_progress: { chapter1: 0, chapter2: 0 },
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
    // 現在の変数もリセット
    coins = 1000;
    ownedSkills = ["none"];
    equippedSkill = "none";
    storyProgress = { chapter1: 0, chapter2: 0 };
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
    
    // Firebaseから最新の使用状況を取得
    await loadCodeStatusFromFirebase();
    
    // 隠しコード BA3 (データ全リセット)
    if (input === "BA3") {
        if (confirm("本当にすべてのデータをリセットしますか？この操作は元に戻せません。")) {
            await resetAllData();
        }
        el("code-input").value = "";
        closeCodeUI();
        return;
    }
    
    // TYSMコード (25000コイン)
    if (input === "TYSM") {
        if (tysmUsed) {
            alert("このコードは既に使用済みです！");
        } else {
            coins += 25000;
            tysmUsed = true;
            usedCodes.push("TYSM");
            
            // ローカルストレージに保存
            localStorage.setItem("ramo_tysm_used", "true");
            localStorage.setItem("ramo_used_codes", JSON.stringify(usedCodes));
            
            // Firebaseに保存
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
    // ByRamoコード (コンボアップの神スキル)
    else if (input === "BYRAMO") {
        if (byramoUsed) {
            alert("このコードは既に使用済みです！");
        } else {
            if (!ownedSkills.includes("comboGod")) {
                ownedSkills.push("comboGod");
                byramoUsed = true;
                usedCodes.push("BYRAMO");
                
                // ローカルストレージに保存
                localStorage.setItem("ramo_byramo_used", "true");
                localStorage.setItem("ramo_skills", JSON.stringify(ownedSkills));
                localStorage.setItem("ramo_used_codes", JSON.stringify(usedCodes));
                
                // Firebaseに保存
                const userRef = ref(db, `users/${myId}`);
                await update(userRef, {
                    byramo_used: true,
                    skills: ownedSkills,
                    used_codes: usedCodes
                });
                
                sounds.notify.play();
                alert(`🎉 ByRamoコード入力成功！\n「コンボアップの神」スキルを獲得しました！\n(7秒間、コンボが6倍になる 1回のみ使用可能)`);
                saveAndDisplayData();
            }
        }
    }
    // YuseSyazai2コード (2億コイン)
    else if (input === "YUSESYAZAI2") {
        if (yuseSyazai2Used) {
            alert("このコードは既に使用済みです！");
        } else {
            coins += 200000000; // 2億コイン
            yuseSyazai2Used = true;
            usedCodes.push("YUSESYAZAI2");
            
            // ローカルストレージに保存
            localStorage.setItem("ramo_yuseSyazai2_used", "true");
            localStorage.setItem("ramo_used_codes", JSON.stringify(usedCodes));
            
            // Firebaseに保存
            const userRef = ref(db, `users/${myId}`);
            await update(userRef, {
                yuseSyazai2_used: true,
                used_codes: usedCodes,
                coins: coins
            });
            
            sounds.coin.play();
            sounds.coin.play(); // 特別感を出すために2回鳴らす
            alert(`🎉✨ YuseSyazai2コード入力成功！\n200,000,000コインを獲得しました！ ✨🎉`);
            saveAndDisplayData();
        }
    }
    // デイリーコード
    else if (input === dailyCode) {
        if (usedCodes.includes(dailyCode)) {
            alert("このコードは既に使用済みです！");
        } else {
            const reward = Math.floor(Math.random() * 4500) + 500; // 500-5000
            coins += reward;
            usedCodes.push(dailyCode);
            
            // ローカルストレージに保存
            localStorage.setItem("ramo_used_codes", JSON.stringify(usedCodes));
            
            // Firebaseに保存
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
        
        // 使用済みにする（1回のみ）
        const index = ownedSkills.indexOf("comboGod");
        if (index > -1) {
            ownedSkills.splice(index, 1);
            if (equippedSkill === "comboGod") {
                equippedSkill = "none";
            }
            saveAndDisplayData();
            
            // Firebaseも更新
            const userRef = ref(db, `users/${myId}`);
            update(userRef, {
                skills: ownedSkills,
                equipped: equippedSkill
            }).catch(err => console.error("Firebase skill update error:", err));
        }
    }, 7000);
}

// --- セーブデータ保存・表示更新用関数 ---
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

// --- プロフィールの顔更新 ---
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
    
    if (profileFace) {
        profileFace.innerText = FACE_DATA[skinData.face] || "😊";
    }
    
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

// --- ボタン状態の制御 ---
function updateButtonStates() {
    const isBusy = isMatchmaking;
    const btnSingle = el("btn-single");
    const btnParty = el("btn-party");
    const btnMatch = el("btn-match");
    const btnSkin = el("btn-skin");
    const btnShop = el("btn-shop");
    const btnStory = el("btn-story");
    const btnGacha = el("btn-gacha");

    if (btnSingle) btnSingle.disabled = isBusy || myPartyId !== null;
    if (btnParty) btnParty.disabled = isMatchmaking; 
    if (btnMatch) btnMatch.disabled = isBusy || myPartyId !== null;
    if (btnSkin) btnSkin.disabled = isBusy;
    if (btnShop) btnShop.disabled = isBusy || myPartyId !== null;
    if (btnStory) btnStory.disabled = isBusy;
    if (btnGacha) btnGacha.disabled = isBusy || myPartyId !== null;
}

// --- リアルタイム名前更新 ---
window.updateMyName = () => {
    myName = el("my-name-input").value || `園名：${myId}`;
    localStorage.setItem("ramo_name", myName);
    saveAndDisplayData();
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

// --- パーティー機能 ---
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
                    accessory: equippedAccessory 
                } 
            } 
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
    if (gameActive || isMatchmaking) {
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
            accessory: equippedAccessory
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
            el("party-label").innerText = isLeader ? "パーティー (リーダー)" : "パーティー (メンバー)";
            
            // メンバー情報をキャッシュ
            if (p.members) {
                partyMembers = p.members;
            }

            const membersHtml = Object.entries(p.members || {}).map(([id, m]) => {
                const memberSkin = m.skin || { skin: "skin-1", face: "face-1" };
                const memberFace = FACE_DATA[memberSkin.face] || "😊";
                const memberAccessory = m.accessory ? ACCESSORY_DB[m.accessory]?.emoji || "" : "";
                return `<div class="friend-item">
                    <div class="friend-left">
                        <div class="friend-face">
                            <span>${memberFace}</span>
                            ${memberAccessory ? `<span style="font-size: 1rem; margin-left: 2px;">${memberAccessory}</span>` : ''}
                        </div>
                        <span class="friend-name">${m.name}</span>
                        ${m.ready ? '<span style="color: var(--accent-green); margin-left: 5px;">✅</span>' : ''}
                        ${id === p.leader ? '<span style="color: var(--accent-gold); margin-left: 5px;">👑</span>' : ''}
                    </div>
                </div>`;
            }).join("");
            el("party-list-ui").innerHTML = membersHtml;
            
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

// --- スキンショップシステム ---
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
    
    if (previewFace) {
        previewFace.innerText = FACE_DATA[skinData.face] || "😊";
    }
    
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

// --- ショップシステム（修正：gachaフラグのあるスキルは表示しない） ---
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
        // ガチャ画面の装備表示も更新
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
    // ガチャ画面の装備表示も更新
    if (el("screen-gacha") && !el("screen-gacha").classList.contains("hidden")) {
        renderGachaCharacters(getCurrentGachaTabRarity());
    }
};

function renderShop() {
    const shopList = el("shop-list");
    if (!shopList) return;
    shopList.innerHTML = "";
    Object.values(SKILL_DB).forEach(skill => {
        // ガチャキャラはショップに表示しない
        if (skill.gacha) return;
        
        const isOwned = ownedSkills.includes(skill.id);
        const isEquipped = equippedSkill === skill.id;
        
        let canUseBossSkill = true;
        let requirementText = "";
        
        if (skill.boss) {
            if (skill.id === "hanabi") {
                canUseBossSkill = storyProgress.chapter1 >= 7;
                requirementText = `【条件: ${canUseBossSkill ? '✓ クリア済み' : '第1章 1-7 をクリアすると使用可能'}】`;
            } else if (skill.id === "hacker_milestone4") {
                canUseBossSkill = storyProgress.chapter2 >= 7;
                requirementText = `【条件: ${canUseBossSkill ? '✓ クリア済み' : '第2章 2-7 をクリアすると使用可能'}】`;
            }
        }
        
        let buttonHtml = "";
        if (skill.boss && !canUseBossSkill) {
            buttonHtml = `<button class="shop-btn" disabled style="background: #666;">使用不可 (未クリア)</button>`;
        } else if (isEquipped) {
            buttonHtml = `<button class="shop-btn equipped" disabled>装備中</button>`;
        } else if (isOwned) {
            buttonHtml = `<button class="shop-btn" onclick="window.equipSkill('${skill.id}')">装備する</button>`;
        } else if (!skill.boss && !skill.special) {
            const canAfford = coins >= skill.cost;
            buttonHtml = `<button class="shop-btn" onclick="window.buySkill('${skill.id}')" ${canAfford ? '' : 'disabled'}>購入 (${skill.cost.toLocaleString()}🪙)</button>`;
        } else if (skill.boss && canUseBossSkill && !isOwned) {
            buttonHtml = `<button class="shop-btn" onclick="window.unlockBossSkill('${skill.id}')" style="background: #FFD700;">解除する</button>`;
        }

        if (!skill.special || (skill.special && isOwned)) {
            shopList.innerHTML += `
                <div class="shop-item ${skill.boss ? 'boss-skill-item' : ''} ${skill.special ? 'special-skill-item' : ''}">
                    <h3>${skill.name} ${skill.boss ? '👑' : ''} ${skill.special ? '✨' : ''}</h3>
                    <p style="white-space: pre-wrap;">${skill.desc}</p>
                    ${skill.boss ? `<p style="color: #FFD700; font-size: 0.9rem;">${requirementText}</p>` : ''}
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
// ガチャ機能（重複ありに修正）
// =========================================

// ガチャ画面を開く
window.openGacha = () => {
    openScreen("screen-gacha");
    updateGachaCoinDisplay();
    renderGachaCharacters('all'); // 初期表示は全キャラ
};

// コイン表示更新
function updateGachaCoinDisplay() {
    const gachaCoin = el("gacha-coin-amount");
    if (gachaCoin) gachaCoin.innerText = coins.toLocaleString();
}

// 現在選択中のタブレアリティを取得
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

// タブ切り替え
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

// 所持キャラ一覧を表示（重複があってもユニーク表示）
function renderGachaCharacters(rarity) {
    const container = el("gacha-char-list");
    if (!container) return;
    container.innerHTML = "";

    // 所有しているガチャキャラのID一覧（重複を含む可能性あり）
    const ownedGachaIds = ownedSkills.filter(id => SKILL_DB[id] && SKILL_DB[id].gacha);

    // 表示するキャラをフィルタ（ユニーク）
    let charsToShow = [];
    if (rarity === 'all') {
        charsToShow = Object.values(GACHA_CHAR_DB);
    } else {
        charsToShow = Object.values(GACHA_CHAR_DB).filter(c => c.rarity === rarity.toUpperCase());
    }

    charsToShow.forEach(char => {
        const isOwned = ownedGachaIds.includes(char.id); // 重複があっても1回所有と判定
        const isEquipped = equippedSkill === char.id;
        const item = document.createElement("div");
        item.className = `gacha-char-item ${char.rarity.toLowerCase()} ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`;
        item.innerHTML = `
            <div class="gacha-char-rarity">${char.rarity}</div>
            <div class="gacha-char-name">${char.name}</div>
            <div class="gacha-char-ability">${char.desc.substring(0, 20)}…</div>
        `;
        if (isOwned) {
            item.onclick = () => equipGachaCharacter(char.id);
        } else {
            item.style.opacity = "0.4";
            item.style.cursor = "default";
        }
        container.appendChild(item);
    });

    // 装備中表示更新
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

// ガチャキャラを装備
function equipGachaCharacter(charId) {
    if (!ownedSkills.includes(charId)) {
        alert("このキャラクターを所持していません");
        return;
    }
    equippedSkill = charId;
    saveAndDisplayData();
    renderGachaCharacters(getCurrentGachaTabRarity());
    // ショップの表示も更新（必要に応じて）
    if (el("screen-shop") && !el("screen-shop").classList.contains("hidden")) {
        renderShop();
    }
    sounds.notify.play();
}

// ガチャ実行（重複あり）
window.drawGacha = async (type) => {
    const isTen = type === "normal10";
    const cost = isTen ? GACHA_COST_10 : GACHA_COST;
    if (coins < cost) {
        alert(`コインが足りません！\n必要: ${cost}🪙`);
        return;
    }

    // 抽選結果を格納する配列
    let results = [];

    // 全ガチャキャラID
    const allGachaIds = Object.keys(GACHA_CHAR_DB);
    const drawCount = isTen ? 10 : 1;

    for (let i = 0; i < drawCount; i++) {
        // レアリティ抽選
        const rnd = Math.random() * 100;
        let selectedRarity;
        if (rnd < GACHA_RATES.R) {
            selectedRarity = 'R';
        } else if (rnd < GACHA_RATES.R + GACHA_RATES.SR) {
            selectedRarity = 'SR';
        } else {
            selectedRarity = 'UR';
        }

        // そのレアリティ内の全キャラからランダムに選択（所有済みでもOK）
        const candidates = GACHA_CHARS_BY_RARITY[selectedRarity];
        // 万が一そのレアリティにキャラが1体もいない場合はフォールバック（起こり得ない）
        if (candidates.length === 0) {
            console.warn(`No characters in rarity ${selectedRarity}, falling back to all.`);
            const fallback = allGachaIds[Math.floor(Math.random() * allGachaIds.length)];
            results.push(fallback);
            ownedSkills.push(fallback);
            continue;
        }

        const selectedChar = candidates[Math.floor(Math.random() * candidates.length)];
        results.push(selectedChar);
        ownedSkills.push(selectedChar);
    }

    // コイン消費
    coins -= cost;
    saveAndDisplayData();
    updateGachaCoinDisplay();

    // 結果表示
    showGachaResult(results);

    // 所持キャラ一覧を再表示（重複しても表示は変わらない）
    renderGachaCharacters(getCurrentGachaTabRarity());
};

// ガチャ結果表示
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
    // 4秒後に非表示
    setTimeout(() => {
        resultDiv.classList.add("hidden");
    }, 4000);
}

// ガチャ画面からスキルショップへ
window.openGachaSkillShop = () => {
    openScreen("screen-shop");
    renderShop();
};

// --- デバッグモード ---
window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === 'w') debugKeys.w = true;
    if (e.key.toLowerCase() === 'l') debugKeys.l = true;
    
    if (debugKeys.w && debugKeys.l && !debugActive) {
        debugActive = true;
        showDebugInput();
    }
});

window.addEventListener("keyup", (e) => {
    if (e.key.toLowerCase() === 'w') debugKeys.w = false;
    if (e.key.toLowerCase() === 'l') debugKeys.l = false;
});

function showDebugInput() {
    const code = prompt("デバッグコードを入力してください:");
    if (code === "1x4x") {
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
    
    el("story-progress-bar").classList.add("hidden");
    isStoryMode = false;
    
    openScreen("screen-home"); 
    updateButtonStates();
    saveAndDisplayData();
    // BGMなし
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

function processCorrectType() {
    romaIdx++;
    score += (10 + combo) * comboMultiplier; 
    combo += 1 * comboMultiplier; 
    
    if (isGodfatherMissionActive) {
        coins += (combo > 0 ? combo * 20 : 20);
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
            // チーム全体の合計スコアを計算
            let totalScore = 0;
            for (let id in partyMembers) {
                totalScore += partyMembers[id].score || 0;
            }
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
    const stageData = currentStage.chapter === 1 ?
        STORY_STAGES.chapter1[currentStage.stage - 1] :
        STORY_STAGES.chapter2[currentStage.stage - 1];
    
    let earnedCoins = stageData.reward;
    
    if (currentStage.chapter === 1) {
        if (storyProgress.chapter1 < currentStage.stage) {
            storyProgress.chapter1 = currentStage.stage;
        }
    } else {
        if (storyProgress.chapter2 < currentStage.stage) {
            storyProgress.chapter2 = currentStage.stage;
        }
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
            
            if (stageData.boss) {
                const skillId = stageData.skill;
                
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
            
            saveAndDisplayData();
            endGame();
        });
    } else {
        coins += earnedCoins;
        
        if (stageData.boss) {
            giveBossSkill(stageData.skill);
        }
        
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

// タイピング可否判定（スタンと妨害を考慮）
function canType() {
    return gameActive && !isStunned && !isJamming && hackerTabsActive === 0;
}

window.addEventListener("keydown", e => {
    if (!gameActive) return;
    
    if (hackerTabsActive > 0) return;

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
    
    if (!canType()) return;

    if (e.key === currentRoma[romaIdx]) {
        processCorrectType();
    } else if (!["Shift","Alt","Control","Space","1","2","3","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
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

    // スタック変数をリセット
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
        if (timer <= 0) { 
            clearInterval(gameInterval); 
            endGame(); 
        }
    }, 1000);
    
    // BGMなし
}

function syncRivals() {
    if (!myPartyId) return;
    el("rival-display").classList.remove("hidden");
    const isHidden = timer < (duration / 2);
    get(ref(db, `parties/${myPartyId}/members`)).then(s => {
        const val = s.val();
        if(val) {
            el("rival-list").innerHTML = Object.entries(val).map(([id, m]) => {
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
                        <span>${isHidden ? '???' : m.score.toLocaleString()}</span>
                    </div>
                `;
            }).join("");
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
                
                if (!isStoryMode && res[0][0] === myId && res.length > 1) {
                    earnedCoins *= 2;
                    isWinner = true;
                }

                if (earnedCoins > 0 && !isStoryMode) {
                    coins += earnedCoins;
                    saveAndDisplayData();
                }

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
                
                let coinText = "";
                if (isStoryMode) {
                    const totalScore = Object.values(val).reduce((sum, m) => sum + (m.score || 0), 0);
                    const avgScore = Math.floor(totalScore / Object.keys(val).length);
                    coinText = `チーム平均スコア: ${avgScore.toLocaleString()} pts`;
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
        if (earnedCoins > 0 && !isStoryMode) {
            coins += earnedCoins;
            saveAndDisplayData();
        }
        el("ranking-box").innerHTML = `<div class="ranking-row"><span>スコア</span><span>${score.toLocaleString()} pts</span></div>`; 
        let coinText = isStoryMode ? "ストーリーモードクリア！報酬は別途獲得" : `獲得コイン +${earnedCoins.toLocaleString()} 🪙`;
        
        el("ranking-box").innerHTML += `
            <div class="ranking-row" style="color: #FFD700; margin-top: 15px; border-top: 2px dashed #FFD700; padding-top: 15px;">
                <span>結果</span><span>${coinText}</span>
            </div>`;
    }
    
    // BGMなし
}

// --- スキル・バトルエフェクト処理 ---
function setupSkillUI() {
    const actionBox = el("skill-action-box");
    const skillNameText = el("skill-btn-name");
    // 各キー表示要素
    const keySpace = el("skill-key-space");
    const key1 = el("skill-key-1");
    const key2 = el("skill-key-2");
    const key3 = el("skill-key-3");
    
    // デフォルト非表示
    keySpace.classList.add("hidden");
    key1.classList.add("hidden");
    key2.classList.add("hidden");
    key3.classList.add("hidden");
    
    if (equippedSkill && equippedSkill !== "none") {
        const skill = SKILL_DB[equippedSkill];
        actionBox.classList.remove("hidden");
        skillNameText.innerText = skill.name;
        
        // パッシブ系の表示
        if (skill.id === "fundraiser" || skill.id === "godfundraiser") {
            // キー情報なし
        } else if (skill.id === "hacker" || skill.id === "accelerator" || skill.id === "hacker_milestone4") {
            el("in-game-skill-btn").classList.add("hidden");
            // 各キーの説明を表示
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
            }
        } else if (skill.id === "comboGod") {
            el("in-game-skill-btn").classList.remove("hidden");
            keySpace.classList.remove("hidden"); keySpace.innerText = "Space: コンボアップの神 (1回)";
        } else {
            // 通常アクティブスキル（ガチャキャラ含む）
            el("in-game-skill-btn").classList.remove("hidden");
            // ガチャキャラは個別のキー情報がある場合
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
                    // その他はスペースのみ
                    keySpace.classList.remove("hidden"); keySpace.innerText = `Space: ${skill.desc}`;
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
    } else if (skill.gacha) {
        // ガチャキャラは基本的にスペースキーのみ（個別分岐は activateSkill で）
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
    
    mazeActive = false;
    hackingActive = false;
    poisonActive = false;
    
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
    document.body.classList.remove("swaying");
    el("skill-cooldown-bar").style.height = "0%";
    el("in-game-skill-btn").classList.remove("cooldown", "hidden");
    el("skill-status-text").innerText = "準備完了！(指定キーで発動)";
}

function startSpecificCooldown(slot, seconds) {
    if (seconds <= 0) return;
    cooldowns[slot] = seconds;
    maxCooldowns[slot] = seconds;
    
    if (cooldownTimers[slot]) clearInterval(cooldownTimers[slot]);
    
    if (slot === "space" && equippedSkill !== "hacker" && equippedSkill !== "accelerator" && equippedSkill !== "hacker_milestone4" && equippedSkill !== "comboGod") {
        el("in-game-skill-btn").classList.add("cooldown");
        el("skill-cooldown-bar").style.height = "100%";
    }
    
    updateCooldownText();
    
    cooldownTimers[slot] = setInterval(() => {
        cooldowns[slot]--;
        if (cooldowns[slot] <= 0) {
            clearInterval(cooldownTimers[slot]);
            if (slot === "space" && equippedSkill !== "hacker" && equippedSkill !== "accelerator" && equippedSkill !== "hacker_milestone4") {
                el("in-game-skill-btn").classList.remove("cooldown");
                el("skill-cooldown-bar").style.height = "0%";
            }
        } else {
            if (slot === "space" && equippedSkill !== "hacker" && equippedSkill !== "accelerator" && equippedSkill !== "hacker_milestone4") {
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

function sendRandomTargetAttack(type, duration, stealAmount) {
    if (!myPartyId) return;
    get(ref(db, `parties/${myPartyId}/members`)).then(s => {
        const members = s.val();
        if (members) {
            const targets = Object.keys(members).filter(id => id !== myId);
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

// 特定のターゲットに攻撃を送信
function sendAttackToTarget(targetId, type, duration, stealAmount) {
    if (!myPartyId) return;
    const attackId = generateId();
    update(ref(db, `parties/${myPartyId}/members/${targetId}/attacks/${attackId}`), {
        type: type, duration: duration, stealAmount: stealAmount, timestamp: Date.now()
    });
}

window.activateSkill = (keySlot = "space") => {
    if (!gameActive) return;
    if (!equippedSkill || equippedSkill === "none" || equippedSkill === "fundraiser" || equippedSkill === "godfundraiser") return;
    
    const skill = SKILL_DB[equippedSkill];

    if (keySlot === "space") {
        if (cooldowns.space > 0) return;
        
        // 既存スキル
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
        // ガチャキャラのスキル
        else if (skill.id === "paintballer") {
            sendAttackToOthers("paint", 5000, 0);
            showBattleAlert("🎨 ペイント発動！", "#FF69B4");
        }
        else if (skill.id === "banana") {
            bananaStacks++;
            showBattleAlert(`🍌 バナナを設置！（残り ${bananaStacks}個）`, "#FFD700");
        }
        else if (skill.id === "slate") {
            showBattleAlert("🛡️ スレート（パッシブ）", "#AAAAAA");
            return; // クールダウン不要
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
            // メガホンをスペースキーに割り当て（簡易）
            sendAttackToOthers("megaphone", 10000, 0);
            showBattleAlert("📢 メガホン！", "#FF69B4");
        }

        if (skill.cooldown > 0) startSpecificCooldown("space", skill.cooldown);
    }

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
        else if (skill.id === "narrator") {
            sendAttackToOthers("action_game", 0, 0);
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
        else if (skill.id === "narrator") {
            sendAttackToOthers("puzzle_game", 0, 0);
            showBattleAlert("🧩 パズルゲーム！", "#00ff00");
            startSpecificCooldown("key2", 100);
        }
        // トラッパーの免疫力（スタン中のみ発動可能）
        else if (skill.id === "trapper") {
            if (!isStunned) {
                showBattleAlert("スタンしていないと使えません！", "#FF0000");
                return;
            }
            // スタン解除
            clearStun();
            showBattleAlert("💊 免疫力発動！スタンを解除！", "#00FF00");
            startSpecificCooldown("key2", 200);
        }
    }

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
    }

    el("stat-score").innerText = score.toLocaleString();
    if (myPartyId) update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
};

// スタン状態をセット
function setStun(durationMs) {
    if (equippedSkill === "slate") {
        showBattleAlert("🛡️ スレートがスタンを無効化！", "#AAAAAA");
        return false;
    }
    if (isStunned) return true; // 既にスタン中
    isStunned = true;
    el("jamming-overlay").classList.remove("hidden"); // 妨害オーバーレイを流用
    if (stunTimer) clearTimeout(stunTimer);
    stunTimer = setTimeout(() => {
        clearStun();
    }, durationMs);
    return true;
}

function clearStun() {
    isStunned = false;
    el("jamming-overlay").classList.add("hidden");
    if (stunTimer) {
        clearTimeout(stunTimer);
        stunTimer = null;
    }
}

function startAutoTypeEngine(durationMs, intervalMs) {
    clearInterval(autoTypeTimer);
    autoTypeTimer = setInterval(() => {
        if (!gameActive || isJamming || isStunned || hackerTabsActive > 0) return;
        processCorrectType();
    }, intervalMs);
    
    setTimeout(() => {
        clearInterval(autoTypeTimer);
    }, durationMs);
}

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

function applyBlurEffect() {
    const playScreen = el("screen-play");
    if (!playScreen) return;
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

// ペイントエフェクト（改良：最初の2.5秒は不透明）
function applyPaintEffect(durationMs) {
    const paintOverlay = el("paint-overlay");
    if (!paintOverlay) return;
    const paintEffect = paintOverlay.querySelector('.paint-effect');
    if (!paintEffect) return;

    // CSSアニメーションを無効化
    paintEffect.style.animation = 'none';
    paintEffect.style.opacity = '1';
    paintOverlay.classList.remove("hidden");

    const totalDuration = durationMs; // 5000ms
    const holdDuration = 2500; // 2.5秒間不透明
    const fadeDuration = totalDuration - holdDuration; // 残り2.5秒でフェード

    // ホールド時間後にフェード開始
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
                // フェード終了後、オーバーレイを非表示
                paintOverlay.classList.add("hidden");
                paintEffect.style.opacity = ''; // リセット
            }
        };
        requestAnimationFrame(fadeStep);
    }, holdDuration);
}

// ゆらゆらエフェクト
function applySwayEffect(durationMs) {
    document.body.classList.add("swaying");
    setTimeout(() => {
        document.body.classList.remove("swaying");
    }, durationMs);
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
    if (status) {
        status.innerHTML = `ゴールまで: ${distance}マス`;
    }
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
    hackingActive = true;
    const overlay = el("hacking-overlay");
    const progress = document.querySelector(".hacking-progress");
    
    if (!overlay || !progress) return;
    overlay.classList.remove("hidden");
    
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
    poisonActive = true;
    el("poison-overlay").classList.remove("hidden");
    document.body.classList.add("poisoned");
    
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

function handleIncomingAttack(attack) {
    if (!gameActive) return;

    // スレート（スタン無効パッシブ）のチェック
    if (equippedSkill === "slate") {
        // スタン系攻撃を無効化
        if (attack.type === "jam" || attack.type === "stun" || attack.type === "hacking" || attack.type === "maze" || attack.type === "snipe" || attack.type === "dodge") {
            showBattleAlert("🛡️ スレートのパッシブで無効化！", "#AAAAAA");
            return;
        }
    }

    // バナナ・トラップによる奪取防止
    if (attack.type === "steal" && attack.stealAmount > 0) {
        if (bananaStacks > 0) {
            bananaStacks--;
            showBattleAlert("🍌 バナナでやられた！相手がスタン！", "#FFD700");
            // 攻撃元にスタンを返す
            sendAttackToTarget(attack.from, "stun", 3000, 0);
            return; // スコア奪取を防ぐ
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
        score = Math.floor(score / 2);
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

    if (attack.type === "paint") {
        applyPaintEffect(attack.duration);
        sounds.miss.play();
        return;
    }

    if (attack.type === "snipe" || attack.type === "stun") {
        // まずスタン
        setStun(attack.duration);
        // スタン終了後にゆらゆらを開始
        setTimeout(() => {
            applySwayEffect(attack.duration);
        }, attack.duration);
        showBattleAlert("🎯 ヘッドショット！くらくら…", "#FF0000");
        sounds.miss.play();
        return;
    }

    if (attack.type === "action_game") {
        // アクションゲーム開始
        startActionGame();
        return;
    }

    if (attack.type === "puzzle_game") {
        // パズルゲーム開始
        startPuzzleGame();
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

// =========================================
// アクションゲーム関連（改良版：地面修正＋敵追加）
// =========================================
let actionGameActive = false;
let actionGamePlayer = { x: 50, y: 60, vy: 0 }; // 地面の高さを60に設定
let actionGameSpikePos = { x: 300, y: 60 };     // トゲ
let actionGameGoalPos = { x: 350, y: 60 };      // ゴール
let actionGameEnemyPos = { x: 200, y: 60 };     // 敵キャラ（クリボー風）
let actionGameEnemyAlive = true;
let actionGameGravity = 0.5;
let actionGameOnGround = true;
let actionGameInterval = null;

window.startActionGame = () => {
    actionGameActive = true;
    resetActionGame();
    el("action-game-overlay").classList.remove("hidden");
    if (actionGameInterval) clearInterval(actionGameInterval);
    actionGameInterval = setInterval(updateActionGame, 50);
};

function resetActionGame() {
    actionGamePlayer = { x: 50, y: 60, vy: 0 };
    actionGameOnGround = true;
    actionGameEnemyAlive = true;
    updateActionGameDisplay();
}

window.closeActionGame = () => {
    actionGameActive = false;
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
            actionGamePlayer.vy = -10; // 上向き速度
            actionGameOnGround = false;
        }
    }
};

function updateActionGame() {
    if (!actionGameActive) return;
    
    // 重力適用
    actionGamePlayer.vy += actionGameGravity;
    actionGamePlayer.y += actionGamePlayer.vy;
    
    // 地面チェック
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
    // 敵の表示はHTMLにないので、簡易的にテキストで追加（実際にはHTMLに要素を追加する必要あり）
    // ここではデモのため、既存の要素を使い回すか、新たに作成する
    let enemy = document.querySelector('.action-game-enemy');
    if (!enemy && actionGameActive) {
        // 敵要素がなければ作成（簡易）
        enemy = document.createElement('div');
        enemy.className = 'action-game-enemy';
        enemy.style.position = 'absolute';
        enemy.style.bottom = '30px';
        enemy.style.fontSize = '30px';
        enemy.innerText = '🐢'; // クリボーの代わり
        document.querySelector('.action-game-canvas').appendChild(enemy);
    }
    if (player) {
        player.style.left = actionGamePlayer.x + 'px';
        player.style.bottom = (actionGamePlayer.y - 30) + 'px';
    }
    if (enemy && actionGameEnemyAlive) {
        enemy.style.left = actionGameEnemyPos.x + 'px';
        enemy.style.bottom = (actionGameEnemyPos.y - 30) + 'px';
    } else if (enemy && !actionGameEnemyAlive) {
        enemy.style.display = 'none';
    }
}

function checkActionGameCollision() {
    // 棘との衝突（地面にいない時）
    if (Math.abs(actionGamePlayer.x - actionGameSpikePos.x) < 30 && !actionGameOnGround) {
        alert("トゲに当たった！最初からやり直し");
        resetActionGame();
    }
    // 敵との衝突（地面にいない時のみ倒せる）
    if (actionGameEnemyAlive && Math.abs(actionGamePlayer.x - actionGameEnemyPos.x) < 30) {
        if (!actionGameOnGround) {
            // 上から踏んだ
            actionGameEnemyAlive = false;
            showBattleAlert("敵を倒した！", "var(--accent-green)");
            sounds.correct.play();
        } else {
            // 横からぶつかった
            alert("敵にぶつかった！最初からやり直し");
            resetActionGame();
        }
    }
    // ゴール
    if (Math.abs(actionGamePlayer.x - actionGameGoalPos.x) < 30) {
        alert("ゴール！クリア！");
        closeActionGame();
    }
}

// =========================================
// パズルゲーム（ドットコネクト）改良版（閉じるボタン削除）
// =========================================
let puzzleDots = [];
let puzzleSelected = [];
let puzzleConnections = [];

window.startPuzzleGame = () => {
    // 16個のドットを生成（1〜16の番号）
    puzzleDots = [];
    for (let i = 1; i <= 16; i++) {
        puzzleDots.push({ id: i, connected: false });
    }
    puzzleSelected = [];
    puzzleConnections = [];
    renderPuzzleGrid();
    el("puzzle-game-overlay").classList.remove("hidden");
    // 閉じるボタンの処理を削除
};

window.closePuzzleGame = () => {
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
    
    // 各ドットをランダムな位置に配置（CSS Grid 内で少しずらす）
    puzzleDots.forEach((dot, index) => {
        const dotEl = document.createElement("div");
        dotEl.className = `puzzle-dot ${dot.connected ? 'connected' : ''}`;
        dotEl.dataset.index = index;
        dotEl.onclick = () => selectPuzzleDot(index);
        dotEl.innerText = dot.connected ? '✓' : dot.id;
        // ランダムなオフセット
        const xOffset = Math.random() * 20 - 10;
        const yOffset = Math.random() * 20 - 10;
        dotEl.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        grid.appendChild(dotEl);
    });
}

function selectPuzzleDot(index) {
    if (puzzleDots[index].connected) return;
    
    if (puzzleSelected.includes(index)) {
        // 既に選択中なら解除
        puzzleSelected = puzzleSelected.filter(i => i !== index);
    } else if (puzzleSelected.length < 2) {
        puzzleSelected.push(index);
    }
    
    // 2つ選択されたら接続
    if (puzzleSelected.length === 2) {
        const [a, b] = puzzleSelected;
        if (!puzzleDots[a].connected && !puzzleDots[b].connected) {
            puzzleDots[a].connected = true;
            puzzleDots[b].connected = true;
            puzzleConnections.push({ from: a, to: b });
        }
        puzzleSelected = [];
        renderPuzzleGrid();
        
        // すべて接続されたかチェック
        if (puzzleDots.every(d => d.connected)) {
            alert("全ての点をつなげた！クリア！");
            // 閉じるボタンの処理を削除
        }
    } else {
        // 選択中のハイライトを更新
        renderPuzzleGrid();
        document.querySelectorAll('.puzzle-dot').forEach((el, i) => {
            if (puzzleSelected.includes(i)) {
                el.classList.add('selected');
            }
        });
    }
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

function renderStoryMap() {
    const map1 = el("story-map-1");
    if (!map1) return;
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
            <div class="stage-target">${stage.target.toLocaleString()}</div>
            ${isCompleted ? '<span class="stage-complete-mark">✓</span>' : ''}
            ${isLocked ? '<span class="stage-locked-mark">🔒</span>' : ''}
        `;
        map1.appendChild(node);
    });

    const map2 = el("story-map-2");
    if (!map2) return;
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
            <div class="stage-target">${stage.target.toLocaleString()}</div>
            ${isCompleted ? '<span class="stage-complete-mark">✓</span>' : ''}
            ${isLocked ? '<span class="stage-locked-mark">🔒</span>' : ''}
        `;
        map2.appendChild(node);
    });
    
    document.querySelectorAll('.chapter-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.chapter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.story-chapter').forEach(ch => ch.classList.add('hidden'));
            const targetChapter = el(`story-chapter-${tab.dataset.chapter}`);
            if (targetChapter) targetChapter.classList.remove('hidden');
        };
    });
}

function selectStage(chapter, stage) {
    currentStage = { chapter, stage };
    const stageData = chapter === 1 ? 
        STORY_STAGES.chapter1[stage - 1] : 
        STORY_STAGES.chapter2[stage - 1];
    
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
        bossSkillNameEl.innerText = stageData.skill === "hanabi" ? "花火" : "ハッカーマイルストーン4";
        
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
        const progress = userSnap.val() || { chapter1: 0, chapter2: 0 };
        
        if (currentStage.chapter === 1) {
            if (progress.chapter1 < currentStage.stage - 1) {
                allCleared = false;
                break;
            }
        } else {
            if (progress.chapter2 < currentStage.stage - 1) {
                allCleared = false;
                break;
            }
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
    if (myPartyId) {
        alert("パーティー参加中は一人プレイできません");
        return;
    }
    
    const stageData = currentStage.chapter === 1 ?
        STORY_STAGES.chapter1[currentStage.stage - 1] :
        STORY_STAGES.chapter2[currentStage.stage - 1];
    
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
    
    const stageData = currentStage.chapter === 1 ?
        STORY_STAGES.chapter1[currentStage.stage - 1] :
        STORY_STAGES.chapter2[currentStage.stage - 1];
    
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
    if (window.dodgeCallback) {
        window.dodgeCallback(true);
    }
};

// --- モード制御 ---
window.openSingleSelect = () => {
    if (myPartyId || isMatchmaking) return; 
    openScreen("screen-single-select");
};

window.startSingle = (diff) => { 
    if (myPartyId || isMatchmaking) return; 
    currentWords = WORD_DB[diff]; 
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
                        skin: player.skin || { skin: "skin-1", face: "face-1" }
                    }; 
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

// --- 初期化 ---
const idDisplay = el("my-id-display");
if (idDisplay) idDisplay.innerText = myId;
const nameInput = el("my-name-input");
if (nameInput) nameInput.value = myName;

const userRef = ref(db, `users/${myId}`);

// Firebaseからデータを読み込む
get(userRef).then(snap => {
    if(snap.exists()) {
        let data = snap.val();
        if(data.coins !== undefined) {
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
        if(data.skin !== undefined) {
            skinData = data.skin;
        }
        if(data.accessory !== undefined) {
            equippedAccessory = data.accessory;
        }
        // コード使用状況を読み込み
        if(data.tysm_used !== undefined) tysmUsed = data.tysm_used;
        if(data.byramo_used !== undefined) byramoUsed = data.byramo_used;
        if(data.yuseSyazai2_used !== undefined) yuseSyazai2Used = data.yuseSyazai2_used;
        if(data.daily_code) dailyCode = data.daily_code;
        if(data.daily_code_date) dailyCodeDate = data.daily_code_date;
        if(data.used_codes) usedCodes = data.used_codes;
        
        // ローカルストレージも更新
        localStorage.setItem("ramo_tysm_used", tysmUsed.toString());
        localStorage.setItem("ramo_byramo_used", byramoUsed.toString());
        localStorage.setItem("ramo_yuseSyazai2_used", yuseSyazai2Used.toString());
        localStorage.setItem("ramo_daily_code", dailyCode);
        localStorage.setItem("ramo_daily_date", dailyCodeDate);
        localStorage.setItem("ramo_used_codes", JSON.stringify(usedCodes));
    }
    saveAndDisplayData();
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
    timeSlider.addEventListener("input", (e) => {
        timeLabel.innerText = e.target.value;
    });
}

// BGMはなし（bgmControl削除）

// デイリーコードの初期化とタイマー開始
checkDailyCode();
startCodeTimer();
updateProfileFace();

window.goHome();
