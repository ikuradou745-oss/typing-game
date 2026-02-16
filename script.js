/**
 * Typing Game - Professional Online Edition
 * * [構成構成]
 * 1. Firebase Service (通信・同期)
 * 2. GameDataManager (状態管理)
 * 3. TypingEngine (解析・判定)
 * 4. UIManager (画面遷移・描画)
 * 5. AudioService (SE/BGM)
 */

import { initializeApp } from "firebase/app";
import { 
    getDatabase, ref, set, get, update, onValue, 
    onDisconnect, remove, off, push, serverTimestamp 
} from "firebase/database";

// ==========================================================
// 1. Firebase 初期設定
// ==========================================================
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

// ==========================================================
// 2. GameDataManager & ユーザー管理
// ==========================================================
const STORAGE_ID = "TYPING_USER_ID_8";
const STORAGE_NAME = "TYPING_USER_NAME_8";
const STORAGE_BEST = "TYPING_BEST_";
const STORAGE_CUSTOM = "CUSTOM_TYPING_LIST";

class GameDataManager {
    constructor() {
        this.myCode = localStorage.getItem(STORAGE_ID) || this.generateCode();
        this.myName = localStorage.getItem(STORAGE_NAME) || ("プレイヤー" + Math.floor(Math.random() * 1000));
        this.isPlaying = false;
        this.isBattleMode = false;
        this.currentLevel = "easy";
        this.score = 0;
        this.combo = 0;
        this.timeLeft = 0;
        this.totalTime = 0;
        this.curParty = null;
        this.isLeader = false;
        this.customTypingData = JSON.parse(localStorage.getItem(STORAGE_CUSTOM)) || [
            "あいうえお", "かきくけこ", "さしすせそ", "たちつてと", "なにぬねの"
        ];
        
        this.initStorage();
    }

    generateCode() {
        const code = Math.floor(10000000 + Math.random() * 90000000).toString();
        localStorage.setItem(STORAGE_ID, code);
        return code;
    }

    initStorage() {
        localStorage.setItem(STORAGE_ID, this.myCode);
        localStorage.setItem(STORAGE_NAME, this.myName);
    }

    saveScore(level, score) {
        const key = STORAGE_BEST + level;
        const best = parseInt(localStorage.getItem(key)) || 0;
        if (score > best) {
            localStorage.setItem(key, score);
        }
    }
}

const GDM = new GameDataManager();

// UI初期反映
document.getElementById("my-friend-code").innerText = GDM.myCode;
document.getElementById("display-name").innerText = GDM.myName;
const nameInput = document.getElementById("name-input");
if (nameInput) nameInput.value = GDM.myName;

// ==========================================================
// 3. AudioService (サウンドエンジン)
// ==========================================================
const playSfx = (id) => { 
    const el = document.getElementById(id); 
    if (el) { 
        el.currentTime = 0; 
        el.play().catch((err) => console.warn("Audio blocked:", err)); 
        
        if (id === 'sound-sizzle') {
            setTimeout(() => {
                if (!el.paused) { el.pause(); el.currentTime = 0; }
            }, 3000);
        }
    } 
};

const bgmBox = {
    lobby: document.getElementById("bgm-lobby"),
    battle: document.getElementById("bgm-battle"),
    play: function(type) {
        if (!this.lobby || !this.battle) return;
        this.stopAll();
        if (type === 'lobby') { 
            this.lobby.currentTime = 0; 
            this.lobby.play().catch(() => {}); 
        } else if (type === 'battle') { 
            this.battle.currentTime = 0; 
            this.battle.play().catch(() => {}); 
        }
    },
    stopAll: function() {
        if (this.lobby) this.lobby.pause();
        if (this.battle) this.battle.pause();
    }
};

// ==========================================================
// 4. TypingEngine & ローマ字定義
// ==========================================================
const words = [
    { k: "林檎", kana: "りんご", lv: "easy" }, { k: "猫", kana: "ねこ", lv: "easy" }, 
    { k: "犬", kana: "いぬ", lv: "easy" }, { k: "本", kana: "ほん", lv: "easy" }, 
    { k: "空", kana: "そら", lv: "easy" }, { k: "海", kana: "うみ", lv: "easy" },
    { k: "山", kana: "やま", lv: "easy" }, { k: "花", kana: "はな", lv: "easy" }, 
    { k: "雨", kana: "あめ", lv: "easy" }, { k: "お茶", kana: "おちゃ", lv: "easy" }, 
    { k: "寿司", kana: "すし", lv: "easy" }, { k: "時計", kana: "とけい", lv: "easy" },
    { k: "学校", kana: "がっこう", lv: "normal" }, { k: "友達", kana: "ともだち", lv: "normal" }, 
    { k: "先生", kana: "せんせい", lv: "normal" }, { k: "勉強", kana: "べんきょう", lv: "normal" }, 
    { k: "自転車", kana: "じてんしゃ", lv: "normal" }, { k: "携帯電話", kana: "けいたいでんわ", lv: "normal" },
    { k: "一生懸命", kana: "いっしょうけんめい", lv: "hard" }, { k: "温故知新", kana: "おんこちしん", lv: "hard" }, 
    { k: "試行錯誤", kana: "しこうさくご", lv: "hard" }, { k: "プログラミング", kana: "ぷろぐらみんぐ", lv: "hard" }
];

const romajiTable = {
    'あ':['a'], 'い':['i'], 'う':['u','wu'], 'え':['e'], 'お':['o'],
    'か':['ka','ca'], 'き':['ki'], 'く':['ku','cu','qu'], 'け':['ke'], 'こ':['ko','co'],
    'さ':['sa'], 'し':['shi','si','ci'], 'す':['su'], 'せ':['se','ce'], 'そ':['so'],
    'た':['ta'], 'ち':['chi','ti'], 'つ':['tsu','tu'], 'て':['te'], 'と':['to'],
    'な':['na'], 'に':['ni'], 'ぬ':['nu'], 'ね':['ne'], 'の':['no'],
    'は':['ha'], 'ひ':['hi'], 'ふ':['fu','hu'], 'へ':['he'], 'ほ':['ho'],
    'ま':['ma'], 'み':['mi'], 'む':['mu'], 'め':['me'], 'も':['mo'],
    'や':['ya'], 'ゆ':['yu'], 'よ':['yo'],
    'ら':['ra'], 'り':['ri'], 'る':['ru'], 'れ':['re'], 'ろ':['ro'],
    'わ':['wa'], 'を':['wo'], 'ん':['nn','n','xn'],
    'が':['ga'], 'ぎ':['gi'], 'ぐ':['gu'], 'げ':['ge'], 'ご':['go'],
    'ざ':['za'], 'じ':['ji','zi'], 'ず':['zu'], 'ぜ':['ze'], 'ぞ':['zo'],
    'だ':['da'], 'ぢ':['di'], 'づ':['du'], 'で':['de'], 'ど':['do'],
    'ば':['ba'], 'び':['bi'], 'ぶ':['bu'], 'べ':['be'], 'ぼ':['bo'],
    'ぱ':['pa'], 'ぴ':['pi'], 'ぷ':['pu'], 'ぺ':['pe'], 'ぽ':['po'],
    'きゃ':['kya'], 'きゅ':['kyu'], 'きょ':['kyo'],
    'しゃ':['sha','sya'], 'しゅ':['shu','syu'], 'しょ':['sho','syo'],
    'ちゃ':['cha','tya','cya'], 'ちゅ':['chu','tyu','cyu'], 'ちょ':['cho','tyo','cyo'],
    'にゃ':['nya'], 'にゅ':['nyu'], 'にょ':['nyo'],
    'ひゃ':['hya'], 'ひゅ':['hyu'], 'ひょ':['hyo'],
    'みゃ':['mya'], 'みゅ':['myu'], 'みょ':['myo'],
    'りゃ':['rya'], 'りゅ':['ryu'], 'りょ':['ryo'],
    'ぎゃ':['gya'], 'ぎゅ':['gyu'], 'ぎょ':['gyo'],
    'じゃ':['ja','jya','zya'], 'じゅ':['ju','jyu','zyu'], 'じょ':['jo','jyo','zyo'],
    'びゃ':['bya'], 'びゅ':['byu'], 'びょ':['byo'],
    'ぴゃ':['pya'], 'ぴゅ':['pyu'], 'ぴょ':['pyo'],
    'ふぁ':['fa'], 'ふぃ':['fi'], 'ふぇ':['fe'], 'ふぉ':['fo'],
    'てぃ':['thi'], 'でぃ':['dhi'],
    'っ':['xtsu', 'ltu', 'ltsu'],
    'ゃ':['xya', 'lya'], 'ゅ':['xyu', 'lyu'], 'ょ':['xyo', 'lyo'],
    'ぁ':['xa', 'la'], 'ぃ':['xi', 'li'], 'ぅ':['xu', 'lu'], 'ぇ':['xe', 'le'], 'ぉ':['xo', 'lo'],
    'ー':['-']
};

let tState = { nodes: [], cIdx: 0, typedInNode: "", validOpts: [], textDone: "" };

function parseKana(kanaText) {
    let nodes = [];
    for (let i = 0; i < kanaText.length; i++) {
        let chunk = kanaText[i];
        let next = kanaText[i+1];
        if (next && ['ゃ','ゅ','ょ','ぁ','ぃ','ぅ','ぇ','ぉ'].includes(next)) { 
            chunk += next; 
            i++; 
        }
        nodes.push({ 
            k: chunk, 
            opts: romajiTable[chunk] ? [...romajiTable[chunk]] : [chunk] 
        });
    }

    for (let i = 0; i < nodes.length; i++) {
        let n = nodes[i];
        if (n.k === 'っ' && i + 1 < nodes.length) {
            nodes[i+1].opts.forEach(opt => {
                let firstChar = opt[0];
                if (!['a','i','u','e','o','y','n'].includes(firstChar)) {
                    if (!n.opts.includes(firstChar)) n.opts.push(firstChar);
                }
            });
        }
        if (n.k === 'ん' && i + 1 < nodes.length) {
            let startsWithSpecial = nodes[i+1].opts.some(opt => ['a','i','u','e','o','y','n'].includes(opt[0]));
            if (!startsWithSpecial && !n.opts.includes('n')) n.opts.push('n');
        }
    }
    return nodes;
}

// ==========================================================
// 5. 画面制御 & UIマネージャー
// ==========================================================
const screens = {
    mode: document.getElementById("mode-selection"),
    diff: document.getElementById("difficulty-selection"),
    setup: document.getElementById("battle-setup"),
    wait: document.getElementById("battle-waiting"),
    game: document.getElementById("game-play-area"),
    result: document.getElementById("result-screen"),
    online: document.getElementById("online-selection"),
    onlinewait: document.getElementById("online-waiting"),
    editor: document.getElementById("custom-editor")
};

let currentScreenKey = "mode";

window.showScreen = (key) => {
    Object.keys(screens).forEach(k => {
        if (screens[k]) screens[k].classList.add("hidden");
    });
    
    if (screens[key]) {
        screens[key].classList.remove("hidden");
        currentScreenKey = key;
    }

    if (key === 'diff') {
        ["easy", "normal", "hard"].forEach(lv => {
            const el = document.getElementById("best-" + lv);
            if (el) el.innerText = localStorage.getItem(STORAGE_BEST + lv) || 0;
        });
    }
    
    const lobbyScreens = ['mode', 'diff', 'setup', 'wait', 'result', 'online', 'onlinewait', 'editor'];
    if (lobbyScreens.includes(key)) bgmBox.play('lobby');
};

// ==========================================================
// 6. メインゲームロジック
// ==========================================================
let battleTimer = null;

function startGame(time = 0) {
    GDM.score = 0; 
    GDM.combo = 0;
    GDM.isPlaying = true;
    showScreen("game");
    
    const lanes = document.getElementById("rival-lanes");
    const bHeader = document.getElementById("battle-header");
    const endBtn = document.getElementById("end-game-btn");

    if (GDM.isBattleMode) {
        bgmBox.play('battle');
        GDM.timeLeft = time;
        GDM.totalTime = time;
        if (bHeader) bHeader.classList.remove("hidden");
        if (lanes) lanes.classList.remove("hidden");
        if (endBtn) endBtn.innerText = "バトルから逃げる";
        updateTimerDisplay();
        
        battleTimer = setInterval(() => {
            GDM.timeLeft--;
            updateTimerDisplay();
            
            if (lanes && GDM.timeLeft < GDM.totalTime / 2) lanes.classList.add("fog");
            if (GDM.timeLeft <= 0) endBattle();
            
            if (GDM.curParty) {
                set(ref(db, `parties/${GDM.curParty}/battle/scores/${GDM.myCode}`), { 
                    name: GDM.myName, score: GDM.score, lastUpdate: serverTimestamp()
                });
            }
        }, 1000);
    } else {
        bgmBox.play('lobby');
        if (bHeader) bHeader.classList.add("hidden");
        if (lanes) lanes.classList.add("hidden");
        if (endBtn) endBtn.innerText = "中断してメインメニューへ";
    }
    nextWord();
}

function nextWord() {
    let pool;
    if (GDM.currentLevel === "custom") {
        pool = GDM.customTypingData.map(w => ({ k: w, kana: w, lv: "custom" }));
    } else {
        pool = words.filter(w => w.lv === GDM.currentLevel);
    }

    if (pool.length === 0) pool = [{ k: "データなし", kana: "でーたなし", lv: "easy" }];
    const target = pool[Math.floor(Math.random() * pool.length)];
    
    tState.nodes = parseKana(target.kana);
    tState.cIdx = 0;
    tState.typedInNode = "";
    tState.validOpts = [...tState.nodes[0].opts];
    tState.textDone = "";

    const wordEl = document.getElementById("japanese-word");
    if (wordEl) wordEl.innerText = target.k;
    updateDisplay();
}

function updateDisplay() {
    const doneEl = document.getElementById("char-done");
    const todoEl = document.getElementById("char-todo");
    const scoreEl = document.getElementById("score-count");
    const cbEl = document.getElementById("combo-display");
    
    if (doneEl) doneEl.innerText = tState.textDone;
    if (todoEl) {
        let hint = "";
        for (let i = 0; i < tState.nodes.length; i++) {
            if (i === tState.cIdx) {
                let bestOpt = [...tState.validOpts].sort((a,b) => a.length - b.length)[0];
                hint += bestOpt.substring(tState.typedInNode.length);
            } else if (i > tState.cIdx) {
                hint += [...tState.nodes[i].opts].sort((a,b) => a.length - b.length)[0];
            }
        }
        todoEl.innerText = hint;
    }
    if (scoreEl) scoreEl.innerText = GDM.score;
    if (cbEl) {
        cbEl.innerText = GDM.combo > 0 ? GDM.combo + " COMBO" : "";
        GDM.combo > 0 ? cbEl.classList.add("active") : cbEl.classList.remove("active");
    }
}

function updateTimerDisplay() {
    const timerEl = document.getElementById("timer-display");
    if (timerEl) timerEl.innerText = `TIME: ${GDM.timeLeft}`;
}

window.addEventListener("keydown", (e) => {
    if (!GDM.isPlaying) return;
    const key = e.key.toLowerCase();
    if (key.length > 1) return;

    let nextInput = tState.typedInNode + key;
    let matchingOpts = tState.validOpts.filter(opt => opt.startsWith(nextInput));

    if (matchingOpts.length > 0) {
        tState.typedInNode = nextInput;
        tState.validOpts = matchingOpts;
        tState.textDone += key;
        GDM.combo++;
        GDM.score += 10 + Math.floor(GDM.combo / 10);
        playSfx('sound-type');

        if (tState.validOpts.includes(tState.typedInNode)) {
            tState.cIdx++;
            tState.typedInNode = "";
            if (tState.cIdx < tState.nodes.length) {
                tState.validOpts = [...tState.nodes[tState.cIdx].opts];
            } else {
                playSfx('sound-success');
                playSfx('sound-sizzle');
                setTimeout(nextWord, 100);
            }
        }
    } else {
        GDM.combo = 0;
        playSfx('sound-error');
    }
    updateDisplay();
});

function endBattle() {
    GDM.isPlaying = false;
    clearInterval(battleTimer);
    playSfx('sound-success');
    if (GDM.isLeader && GDM.curParty) update(ref(db, `parties/${GDM.curParty}`), { status: "waiting" });
    GDM.saveScore(GDM.currentLevel, GDM.score);
    showScreen("result");
}

// ==========================================================
// 7. ボタンイベントリスナー (今回追加分含む)
// ==========================================================

// 難易度ボタン
document.querySelectorAll(".diff-btn").forEach(b => {
    if (b.hasAttribute('data-level')) {
        b.onclick = () => {
            playSfx('sound-click');
            GDM.currentLevel = b.dataset.level;
            GDM.isBattleMode = false;
            startGame();
        };
    }
});

// 自作プレイボタン
const customPlayBtn = document.getElementById("custom-play-btn");
if (customPlayBtn) {
    customPlayBtn.onclick = () => {
        playSfx('sound-click');
        if (GDM.customTypingData.length < 5) return alert("自作データが不足しています。");
        GDM.currentLevel = "custom";
        GDM.isBattleMode = false;
        startGame();
    };
}

// 名前更新
const nameBtn = document.getElementById("update-name-btn");
if (nameBtn) {
    nameBtn.onclick = () => {
        const n = document.getElementById("name-input").value.trim();
        if (n) {
            GDM.myName = n;
            localStorage.setItem(STORAGE_NAME, n);
            document.getElementById("display-name").innerText = n;
            update(ref(db, `users/${GDM.myCode}`), { name: n });
        }
    };
}

// エディター関連
window.addCustomWord = () => {
    if (GDM.customTypingData.length < 20) {
        GDM.customTypingData.push("あたらしいもじ");
        renderEditor();
    }
};

function renderEditor() {
    const list = document.getElementById("custom-word-list");
    if (!list) return;
    list.innerHTML = GDM.customTypingData.map((word, i) => `
        <div class="editor-row">
            <input type="text" value="${word}" onchange="GDM.customTypingData[${i}]=this.value.trim()">
            <button class="danger-btn" onclick="GDM.customTypingData.splice(${i},1);renderEditor()">削除</button>
        </div>
    `).join('');
}

// 初期実行
showScreen("mode");
// アンカーツール用(Chara)ダミー
const CharaAnchor = { status: "ready", owner: GDM.myCode };
