/**
 * Typing Game - Professional Online Edition
 * * [強化項目]
 * - Firebase Database 実装 (v9 modular)
 * - マルチプレイ・マッチメイキング
 * - カスタムワードエディター
 * - 高度なローマ字解析エンジン
 */

import { initializeApp } from "firebase/app";
import { 
    getDatabase, ref, set, get, update, onValue, 
    onDisconnect, remove, off, push, serverTimestamp 
} from "firebase/database";

// ==========================================================
// 1. Firebase 初期設定 & インスタンス化
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
// 2. ユーザーデータ・ストレージ管理
// ==========================================================
const STORAGE_ID = "TYPING_USER_ID_8";
const STORAGE_NAME = "TYPING_USER_NAME_8";
const STORAGE_BEST = "TYPING_BEST_";
const STORAGE_CUSTOM = "CUSTOM_TYPING_LIST";

let myCode = localStorage.getItem(STORAGE_ID);
if (!myCode) {
    myCode = Math.floor(10000000 + Math.random() * 90000000).toString();
    localStorage.setItem(STORAGE_ID, myCode);
}

let myName = localStorage.getItem(STORAGE_NAME);
if (!myName) {
    myName = "プレイヤー" + Math.floor(Math.random() * 1000);
    localStorage.setItem(STORAGE_NAME, myName);
}

// UI初期反映
document.getElementById("my-friend-code").innerText = myCode;
document.getElementById("display-name").innerText = myName;
const nameInput = document.getElementById("name-input");
if (nameInput) nameInput.value = myName;

// ==========================================================
// 3. サウンドエンジン (BGM & SFX)
// ==========================================================
const playSfx = (id) => { 
    const el = document.getElementById(id); 
    if (el) { 
        el.currentTime = 0; 
        el.play().catch((err) => {
            console.warn("Audio play blocked by browser:", err);
        }); 
        
        // 「じゅー」という音（sound-sizzle）の特殊制御
        if (id === 'sound-sizzle') {
            setTimeout(() => {
                if (!el.paused) {
                    el.pause();
                    el.currentTime = 0;
                }
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

// 初回インタラクションでのBGM開始許可
document.addEventListener("click", () => {
    if (bgmBox.lobby && bgmBox.lobby.paused && !isPlaying && currentScreen === "mode") {
        bgmBox.play('lobby');
    }
}, { once: true });

// ==========================================================
// 4. 単語データ & ローマ字定義
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
    { k: "図書館", kana: "としょかん", lv: "normal" }, { k: "音楽", kana: "おんがく", lv: "normal" }, 
    { k: "映画", kana: "えいが", lv: "normal" }, { k: "挑戦", kana: "ちょうせん", lv: "normal" }, 
    { k: "秘密", kana: "ひみつ", lv: "normal" }, { k: "希望", kana: "きぼう", lv: "normal" },
    { k: "動物園", kana: "どうぶつえん", lv: "normal" }, { k: "水族館", kana: "すいぞくかん", lv: "normal" }, 
    { k: "遊園地", kana: "ゆうえんち", lv: "normal" }, { k: "新聞紙", kana: "しんぶんし", lv: "normal" }, 
    { k: "飛行機", kana: "ひこうき", lv: "normal" }, { k: "新幹線", kana: "しんかんせん", lv: "normal" },
    { k: "冷蔵庫", kana: "れいぞうこ", lv: "normal" }, { k: "洗濯機", kana: "せんたくき", lv: "normal" },
    
    { k: "一生懸命", kana: "いっしょうけんめい", lv: "hard" }, { k: "温故知新", kana: "おんこちしん", lv: "hard" }, 
    { k: "試行錯誤", kana: "しこうさくご", lv: "hard" }, { k: "プログラミング", kana: "ぷろぐらみんぐ", lv: "hard" }, 
    { k: "自分自身", kana: "じぶんじしん", lv: "hard" }, { k: "宇宙旅行", kana: "うちゅうりょこう", lv: "hard" },
    { k: "最高速度", kana: "さいこうそくど", lv: "hard" }, { k: "勇猛果敢", kana: "ゆうもうかかん", lv: "hard" }, 
    { k: "一石二鳥", kana: "いっせきにちょう", lv: "hard" }, { k: "四字熟語", kana: "よじじゅくご", lv: "hard" }, 
    { k: "春夏秋冬", kana: "しゅんかしゅうとう", lv: "hard" }, { k: "起死回生", kana: "きしかいせい", lv: "hard" },
    { k: "以心伝心", kana: "いしんでんしん", lv: "hard" }, { k: "完全無欠", kana: "かんぜんむけつ", lv: "hard" }, 
    { k: "自業自得", kana: "じごうじとく", lv: "hard" }, { k: "前代未聞", kana: "ぜんだいみもん", lv: "hard" }, 
    { k: "臨機応変", kana: "りんきおうへん", lv: "hard" }, { k: "天真爛漫", kana: "てんしんらんまん", lv: "hard" },
    { k: "七転八起", kana: "しちてんはっき", lv: "hard" }, { k: "電光石火", kana: "でんこうせっか", lv: "hard" }
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

// ==========================================================
// 5. ローマ字解析ロジック
// ==========================================================
function parseKana(kanaText) {
    let nodes = [];
    for (let i = 0; i < kanaText.length; i++) {
        let chunk = kanaText[i];
        let next = kanaText[i+1];
        // 拗音・小さい文字の結合
        if (next && ['ゃ','ゅ','ょ','ぁ','ぃ','ぅ','ぇ','ぉ'].includes(next)) { 
            chunk += next; 
            i++; 
        }
        nodes.push({ 
            k: chunk, 
            opts: romajiTable[chunk] ? [...romajiTable[chunk]] : [chunk] 
        });
    }

    // 「っ」や「ん」の動的補完
    for (let i = 0; i < nodes.length; i++) {
        let n = nodes[i];
        if (n.k === 'っ' && i + 1 < nodes.length) {
            let nextOpts = nodes[i+1].opts;
            nextOpts.forEach(opt => {
                let firstChar = opt[0];
                // 母音、y、n以外で始まる場合、子音重ねを許可
                if (!['a','i','u','e','o','y','n'].includes(firstChar)) {
                    if (!n.opts.includes(firstChar)) n.opts.push(firstChar);
                }
            });
        }
        if (n.k === 'ん') {
            if (i + 1 < nodes.length) {
                let startsWithSpecial = nodes[i+1].opts.some(opt => ['a','i','u','e','o','y','n'].includes(opt[0]));
                if (!startsWithSpecial) {
                    if (!n.opts.includes('n')) n.opts.push('n');
                }
            } else {
                // 文末の「ん」は nn 必須が一般的だが、許容設定も可能
            }
        }
    }
    return nodes;
}

// ==========================================================
// 6. ゲーム状態管理 & スクリーン遷移
// ==========================================================
let tState = { nodes: [], cIdx: 0, typedInNode: "", validOpts: [], textDone: "" };
let isPlaying = false;
let isBattleMode = false;
let score = 0;
let combo = 0;
let currentLevel = "easy";
let battleTimer = null;
let timeLeft = 0;
let totalTime = 0;
let currentScreen = "mode";

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

window.showScreen = (key) => {
    // 全画面を隠す
    Object.keys(screens).forEach(k => {
        if (screens[k]) screens[k].classList.add("hidden");
    });
    
    // 対象画面を表示
    if (screens[key]) {
        screens[key].classList.remove("hidden");
        currentScreen = key;
    }

    // 画面固有の処理
    if (key === 'diff') {
        ["easy", "normal", "hard"].forEach(lv => {
            const el = document.getElementById("best-" + lv);
            if (el) el.innerText = localStorage.getItem(STORAGE_BEST + lv) || 0;
        });
    }
    
    // BGMの切り替え
    const lobbyScreens = ['mode', 'diff', 'setup', 'wait', 'result', 'online', 'onlinewait', 'editor'];
    if (lobbyScreens.includes(key)) {
        bgmBox.play('lobby');
    }
};

// ==========================================================
// 7. メインゲームロジック (タイピング動作)
// ==========================================================
function startGame(time = 0) {
    score = 0; 
    combo = 0;
    isPlaying = true;
    showScreen("game");
    
    const lanes = document.getElementById("rival-lanes");
    const bHeader = document.getElementById("battle-header");
    const endBtn = document.getElementById("end-game-btn");

    if (isBattleMode) {
        bgmBox.play('battle');
        timeLeft = time;
        totalTime = time;
        if (bHeader) bHeader.classList.remove("hidden");
        if (lanes) lanes.classList.remove("hidden");
        if (endBtn) endBtn.innerText = "バトルから逃げる";
        updateTimerDisplay();
        
        // バトルタイマー開始
        battleTimer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            // 演出: 半分経過で霧を出すなど
            if (lanes && timeLeft < totalTime / 2) { 
                lanes.classList.add("fog"); 
            } else if (lanes) { 
                lanes.classList.remove("fog"); 
            }

            if (timeLeft <= 0) {
                endBattle();
            }
            
            // Firebaseに自分の最新スコアを同期
            if (curParty) {
                set(ref(db, `parties/${curParty}/battle/scores/${myCode}`), { 
                    name: myName, 
                    score: score,
                    lastUpdate: serverTimestamp()
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
    if (currentLevel === "custom") {
        pool = customTypingData.map(w => ({ k: w, kana: w, lv: "custom" }));
    } else {
        pool = words.filter(w => w.lv === currentLevel);
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

function getHintString() {
    let hint = "";
    for (let i = 0; i < tState.nodes.length; i++) {
        if (i < tState.cIdx) {
            // 入力済みノード
        } else if (i === tState.cIdx) {
            // 現在入力中のノード: 最短の選択肢を表示
            let bestOpt = [...tState.validOpts].sort((a,b) => a.length - b.length)[0] || tState.nodes[i].opts[0];
            hint += bestOpt.substring(tState.typedInNode.length);
        } else {
            // 未来のノード: デフォルトの最短を表示
            hint += [...tState.nodes[i].opts].sort((a,b) => a.length - b.length)[0];
        }
    }
    return hint;
}

function updateDisplay() {
    const doneEl = document.getElementById("char-done");
    const todoEl = document.getElementById("char-todo");
    const scoreEl = document.getElementById("score-count");
    const cbEl = document.getElementById("combo-display");

    if (doneEl) doneEl.innerText = tState.textDone;
    if (todoEl) todoEl.innerText = getHintString();
    if (scoreEl) scoreEl.innerText = score;
    
    if (cbEl) {
        cbEl.innerText = combo > 0 ? combo + " COMBO" : "";
        if (combo > 0) cbEl.classList.add("active"); else cbEl.classList.remove("active");
    }
}

function updateTimerDisplay() {
    const timerEl = document.getElementById("timer-display");
    if (timerEl) timerEl.innerText = `TIME: ${timeLeft}`;
}

// キーボード入力ハンドラ
window.addEventListener("keydown", (e) => {
    if (!isPlaying) return;
    const key = e.key.toLowerCase();
    
    // 特殊キーの除外
    if (key.length > 1 && key !== "escape") return;

    let nextInput = tState.typedInNode + key;
    let matchingOpts = tState.validOpts.filter(opt => opt.startsWith(nextInput));

    if (matchingOpts.length > 0) {
        // 正解
        tState.typedInNode = nextInput;
        tState.validOpts = matchingOpts;
        tState.textDone += key;
        
        combo++;
        score += 10 + Math.floor(combo / 10); // コンボボーナス
        playSfx('sound-type');

        // ノード（一文字分）が確定したか確認
        if (tState.validOpts.includes(tState.typedInNode)) {
            tState.cIdx++;
            tState.typedInNode = "";
            
            if (tState.cIdx < tState.nodes.length) {
                tState.validOpts = [...tState.nodes[tState.cIdx].opts];
            } else {
                // 単語クリア
                playSfx('sound-success');
                playSfx('sound-sizzle');
                setTimeout(nextWord, 100);
            }
        }
    } else {
        // ミス
        combo = 0;
        playSfx('sound-error');
    }
    updateDisplay();
});

// ==========================================================
// 8. カスタムタイピングエディター
// ==========================================================
let customTypingData = JSON.parse(localStorage.getItem(STORAGE_CUSTOM)) || [
    "あいうえお", "かきくけこ", "さしすせそ", "たちつてと", "なにぬねの"
];

const openEditorBtn = document.getElementById("open-editor-btn");
if (openEditorBtn) {
    openEditorBtn.onclick = () => {
        playSfx('sound-click');
        if (curParty) {
            alert("パーティー参加中はエディターを開けません。");
            return;
        }
        showScreen("editor");
        renderEditor();
    };
}

function renderEditor() {
    const list = document.getElementById("custom-word-list");
    const countEl = document.getElementById("custom-count");
    if (!list) return;

    list.innerHTML = "";
    customTypingData.forEach((word, i) => {
        const div = document.createElement("div");
        div.className = "editor-row";
        div.innerHTML = `
            <input type="text" value="${word}" onchange="window.updateCustomWord(${i}, this.value)" placeholder="ひらがなで入力">
            <button class="danger-btn" onclick="window.removeCustomWord(${i})">削除</button>
        `;
        list.appendChild(div);
    });
    if (countEl) countEl.innerText = customTypingData.length;
}

window.updateCustomWord = (i, val) => {
    customTypingData[i] = val.trim();
};

window.addCustomWord = () => {
    playSfx('sound-click');
    if (customTypingData.length < 20) {
        customTypingData.push("あたらしいもじ");
        renderEditor();
    } else {
        alert("最大20個まで登録可能です。");
    }
};

window.removeCustomWord = (i) => {
    playSfx('sound-click');
    if (customTypingData.length > 5) {
        customTypingData.splice(i, 1);
        renderEditor();
    } else {
        alert("最低5つの単語が必要です。");
    }
};

window.saveCustomWords = () => {
    playSfx('sound-click');
    // バリデーション
    if (customTypingData.length < 5) return alert("5つ以上の単語を入力してください。");
    
    for (let i = 0; i < customTypingData.length; i++) {
        let w = customTypingData[i];
        if (w.length < 2 || w.length > 15) {
            return alert(`${i+1}番目の単語が短すぎるか長すぎます（2〜15文字）。`);
        }
        if (!/^[ぁ-んー]*$/.test(w)) {
            return alert(`${i+1}番目の単語にひらがな以外が含まれています。`);
        }
    }

    localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(customTypingData));
    alert("保存しました！一人プレイの「作ったものを遊ぶ」からプレイ可能です。");
    showScreen("mode");
};

// ==========================================================
// 9. Firebase 通信: フレンド & パーティー機能
// ==========================================================
let curParty = null;
let isLeader = false;
let friendListeners = {}; 

// オンライン状態監視
const myRef = ref(db, `users/${myCode}`);
onValue(ref(db, ".info/connected"), (snapshot) => {
    if (snapshot.val()) {
        update(myRef, { name: myName, status: "online", lastSeen: serverTimestamp() });
        onDisconnect(myRef).update({ status: "offline", lastSeen: serverTimestamp() });
    }
});

// 名前更新
const nameBtn = document.getElementById("update-name-btn");
if (nameBtn) {
    nameBtn.onclick = () => {
        playSfx('sound-click');
        const n = document.getElementById("name-input").value.trim();
        if (n) {
            myName = n;
            localStorage.setItem(STORAGE_NAME, n);
            document.getElementById("display-name").innerText = n;
            update(myRef, { name: n });
            if (curParty) {
                update(ref(db, `parties/${curParty}/members/${myCode}`), n);
            }
        }
    };
}

// フレンド申請
const reqBtn = document.getElementById("send-request-btn");
if (reqBtn) {
    reqBtn.onclick = async () => {
        playSfx('sound-click');
        const t = document.getElementById("target-code-input").value.trim();
        if (t.length === 8 && t !== myCode) {
            const snap = await get(ref(db, `users/${t}`));
            if (snap.exists()) {
                set(ref(db, `friends/${myCode}/${t}`), true);
                set(ref(db, `friends/${t}/${myCode}`), true);
                alert("フレンド登録が完了しました！");
                document.getElementById("target-code-input").value = "";
            } else {
                alert("指定されたコードのユーザーは存在しません。");
            }
        }
    };
}

// フレンドリストの動的表示
onValue(ref(db, `friends/${myCode}`), (snapshot) => {
    const list = document.getElementById("friend-list");
    if (!list) return;

    const currentFriends = snapshot.val() || {};
    
    // 削除されたフレンドのリスナー解除
    Object.keys(friendListeners).forEach(fid => {
        if (!currentFriends[fid]) {
            const li = document.getElementById(`li-${fid}`);
            if (li) li.remove();
            if (typeof friendListeners[fid] === 'function') friendListeners[fid]();
            delete friendListeners[fid];
        }
    });

    // 新規・更新フレンドの監視
    snapshot.forEach(child => {
        const fid = child.key;
        if (!friendListeners[fid]) {
            let li = document.createElement("li");
            li.id = `li-${fid}`;
            li.className = "friend-item";
            list.appendChild(li);

            const unsub = onValue(ref(db, `users/${fid}`), (fSnap) => {
                const fd = fSnap.val();
                if (!fd) return;
                li.innerHTML = `
                    <div class="friend-info">
                        <strong>${fd.name}</strong>
                        <span class="dot ${fd.status === 'online' ? 'online' : 'offline'}"></span>
                    </div>
                    <div class="friend-btns">
                        <button class="invite-btn" onclick="window.inviteFriend('${fid}')">招待</button>
                        <button class="del-btn" onclick="window.removeFriend('${fid}')">削除</button>
                    </div>
                `;
            });
            friendListeners[fid] = unsub;
        }
    });
});

window.inviteFriend = (targetCode) => {
    if (!curParty) createParty();
    set(ref(db, `invites/${targetCode}/${myCode}`), { 
        name: myName, 
        time: serverTimestamp() 
    });
    alert("招待を送信しました。相手の承認を待っています。");
};

window.removeFriend = (targetCode) => {
    if (confirm("このフレンドを削除しますか？")) {
        remove(ref(db, `friends/${myCode}/${targetCode}`));
        remove(ref(db, `friends/${targetCode}/${myCode}`));
    }
};

// 招待通知の受信
onValue(ref(db, `invites/${myCode}`), (snapshot) => {
    const data = snapshot.val();
    const notifyBox = document.getElementById("invite-notification");
    if (data && notifyBox) {
        const inviterCode = Object.keys(data)[0];
        const inviterName = data[inviterCode].name;
        document.getElementById("inviter-name").innerText = inviterName;
        notifyBox.classList.remove("hidden");
        
        document.getElementById("accept-invite-btn").onclick = () => {
            remove(ref(db, `invites/${myCode}`));
            joinParty(inviterCode);
            notifyBox.classList.add("hidden");
        };
        document.getElementById("decline-invite-btn").onclick = () => {
            remove(ref(db, `invites/${myCode}`));
            notifyBox.classList.add("hidden");
        };
    }
});

// パーティー制御関数
function createParty() {
    curParty = myCode;
    isLeader = true;
    set(ref(db, `parties/${myCode}`), { 
        leader: myCode, 
        status: "waiting", 
        members: { [myCode]: myName },
        createdAt: serverTimestamp()
    });
    onDisconnect(ref(db, `parties/${myCode}`)).remove();
    listenToParty(myCode);
}

function joinParty(leaderCode) {
    if (curParty) leaveParty();
    curParty = leaderCode;
    isLeader = false;
    update(ref(db, `parties/${leaderCode}/members`), { [myCode]: myName });
    onDisconnect(ref(db, `parties/${leaderCode}/members/${myCode}`)).remove();
    listenToParty(leaderCode);
}

function listenToParty(partyId) {
    const partyRef = ref(db, `parties/${partyId}`);
    onValue(partyRef, (snapshot) => {
        const p = snapshot.val();
        if (!p) {
            // パーティー解散時のクリーンアップ
            curParty = null;
            isLeader = false;
            document.getElementById("no-party-msg").classList.remove("hidden");
            document.getElementById("party-info").classList.add("hidden");
            if (isPlaying) {
                isPlaying = false;
                clearInterval(battleTimer);
                showScreen("mode");
            }
            return;
        }

        document.getElementById("no-party-msg").classList.add("hidden");
        document.getElementById("party-info").classList.remove("hidden");
        
        // メンバーリストの構築
        const mList = document.getElementById("party-member-list");
        if (mList) {
            let mHtml = "";
            Object.keys(p.members).forEach(uid => {
                const isMe = (uid === myCode);
                const isThisLeader = (uid === p.leader);
                mHtml += `
                    <div class="party-member">
                        <span>${isThisLeader ? '<span class="leader-tag">LEADER</span>' : ''}${p.members[uid]} ${isMe ? '(自分)' : ''}</span>
                        ${isLeader && !isMe ? `<button class="del-btn" onclick="window.kickMember('${uid}')">キック</button>` : ''}
                    </div>
                `;
            });
            mList.innerHTML = mHtml;
        }

        // リーダーか否かでボタンを出し分け
        const ctrl = document.getElementById("party-controls");
        if (ctrl) {
            ctrl.innerHTML = `<button class="danger-btn" onclick="window.leaveParty()" style="width:100%">${isLeader ? 'パーティー解散' : 'パーティーを抜ける'}</button>`;
        }

        // バトル開始検知
        if (p.status === "setup" && !isLeader && currentScreen !== "wait") {
            showScreen("wait");
        } else if (p.status === "playing" && !isPlaying) {
            isBattleMode = true;
            startGame(p.battle.time || 30);
        }

        // リアルタイムスコア同期
        if (p.status === "playing" && p.battle && p.battle.scores) {
            updateBattleLanes(p.battle.scores);
        }
    });
}

window.leaveParty = () => {
    if (!curParty) return;
    if (isLeader) {
        remove(ref(db, `parties/${myCode}`));
    } else {
        remove(ref(db, `parties/${curParty}/members/${myCode}`));
    }
    curParty = null;
    isLeader = false;
};

window.kickMember = (uid) => {
    if (isLeader && curParty) {
        remove(ref(db, `parties/${curParty}/members/${uid}`));
    }
};

// バトル設定画面へ
const friendPlayBtn = document.getElementById("friend-play-btn");
if (friendPlayBtn) {
    friendPlayBtn.onclick = () => {
        playSfx('sound-click');
        if (!curParty) return alert("パーティーを作成するか、招待を受けてください。");
        if (!isLeader) return alert("リーダーのみがバトル設定を行えます。");
        
        update(ref(db, `parties/${curParty}`), { status: "setup" });
        showScreen("setup");
    };
}

// バトル開始トリガー
const startBattleBtn = document.getElementById("start-battle-trigger");
if (startBattleBtn) {
    startBattleBtn.onclick = () => {
        playSfx('sound-start');
        const timeVal = parseInt(document.getElementById("battle-time-range").value);
        const diffVal = document.getElementById("battle-diff-select").value;
        
        currentLevel = diffVal;
        update(ref(db, `parties/${curParty}`), { 
            status: "playing",
            battle: { 
                time: timeVal, 
                scores: { [myCode]: { name: myName, score: 0 } } 
            }
        });
        isBattleMode = true;
        startGame(timeVal);
    };
}

// 競合他プレイヤーのプログレス表示
function updateBattleLanes(scores) {
    const lanes = document.getElementById("rival-lanes");
    if (!lanes) return;

    let html = "";
    let maxS = 100;
    Object.values(scores).forEach(s => { if (s.score > maxS) maxS = s.score; });

    // スコア順に並び替え
    const sortedIds = Object.keys(scores).sort((a,b) => scores[b].score - scores[a].score);

    sortedIds.forEach(uid => {
        const d = scores[uid];
        const pct = Math.min(100, (d.score / maxS) * 100);
        const isMe = (uid === myCode);
        html += `
            <div class="lane ${isMe ? 'me' : ''}">
                <div class="lane-name">${d.name}</div>
                <div class="lane-bar-bg">
                    <div class="lane-bar-fill" style="width: ${pct}%"></div>
                </div>
                <div class="lane-score">${d.score} pt</div>
            </div>
        `;
    });
    lanes.innerHTML = html;
}

function endBattle() {
    isPlaying = false;
    clearInterval(battleTimer);
    playSfx('sound-success');
    
    if (isLeader && curParty) {
        update(ref(db, `parties/${curParty}`), { status: "waiting" });
    }
    
    // リザルト集計
    get(ref(db, `parties/${curParty}/battle/scores`)).then(snapshot => {
        const scores = snapshot.val() || {};
        const arr = Object.values(scores).sort((a, b) => b.score - a.score);
        
        let rHtml = "";
        arr.forEach((d, i) => {
            rHtml += `
                <div class="rank-item rank-${i+1}">
                    <span>${i+1}位: ${d.name}</span>
                    <span>${d.score} pt</span>
                </div>`;
        });
        const listEl = document.getElementById("ranking-list");
        if (listEl) listEl.innerHTML = rHtml;
        showScreen("result");
    });
}

// ==========================================================
// 10. オンライン・マッチメイキング
// ==========================================================
let matchQueueRef = null;

const onlinePlayBtn = document.getElementById("online-play-btn");
if (onlinePlayBtn) {
    onlinePlayBtn.onclick = () => {
        playSfx('sound-click');
        if (curParty) return alert("パーティーを抜けてからオンライン対戦に参加してください。");
        showScreen("online");
    };
}

window.joinMatchmaking = (playerCount) => {
    playSfx('sound-click');
    showScreen("onlinewait");
    
    const qPath = `matchmaking/${playerCount}/${myCode}`;
    set(ref(db, qPath), { 
        name: myName, 
        time: serverTimestamp() 
    });
    
    matchQueueRef = ref(db, `matchmaking/${playerCount}`);
    onValue(matchQueueRef, (snap) => {
        if (!snap.exists()) return;
        
        const players = snap.val();
        const keys = Object.keys(players).sort((a,b) => players[a].time - players[b].time);
        
        const countDisplay = document.getElementById("online-wait-count");
        if (countDisplay) countDisplay.innerText = `${keys.length} / ${playerCount}`;

        // 人数が揃った
        if (keys.length >= playerCount && keys.slice(0, playerCount).includes(myCode)) {
            off(matchQueueRef);
            remove(ref(db, qPath));
            
            const leaderId = keys[0];
            curParty = leaderId;
            isLeader = (myCode === leaderId);

            if (isLeader) {
                // リーダーが部屋を作成
                let members = {};
                keys.slice(0, playerCount).forEach(k => members[k] = players[k].name);
                
                set(ref(db, `parties/${leaderId}`), {
                    leader: leaderId,
                    status: "playing",
                    members: members,
                    battle: { time: 40, scores: {} },
                    isAutoMatch: true
                });
                
                setTimeout(() => {
                    currentLevel = "normal";
                    isBattleMode = true;
                    startGame(40);
                }, 2000);
            } else {
                // メンバーは部屋の成立を待つ
                const pRef = ref(db, `parties/${leaderId}`);
                onValue(pRef, (pSnap) => {
                    const pData = pSnap.val();
                    if (pData && pData.status === "playing") {
                        off(pRef);
                        currentLevel = "normal";
                        isBattleMode = true;
                        startGame(40);
                        listenToParty(leaderId);
                    }
                });
            }
        }
    });
};

window.cancelMatchmaking = () => {
    playSfx('sound-click');
    if (matchQueueRef) off(matchQueueRef);
    remove(ref(db, `matchmaking/2/${myCode}`));
    remove(ref(db, `matchmaking/3/${myCode}`));
    remove(ref(db, `matchmaking/4/${myCode}`));
    showScreen("mode");
};

// ==========================================================
// 11. その他 UI ボタン
// ==========================================================
const singleBtn = document.getElementById("single-play-btn");
if (singleBtn) singleBtn.onclick = () => { playSfx('sound-click'); showScreen("diff"); };

const backBtn = document.getElementById("back-to-mode");
if (backBtn) backBtn.onclick = () => { playSfx('sound-click'); showScreen("mode"); };

const endBtn = document.getElementById("end-game-btn");
if (endBtn) {
    endBtn.onclick = () => { 
        playSfx('sound-click'); 
        isPlaying = false;
        clearInterval(battleTimer);
        
        if (!isBattleMode && currentLevel !== "custom") {
            let best = parseInt(localStorage.getItem(STORAGE_BEST + currentLevel)) || 0;
            if (score > best) localStorage.setItem(STORAGE_BEST + currentLevel, score);
        }
        
        if (isBattleMode && curParty) {
            // スコアを0にして離脱を通知
            set(ref(db, `parties/${curParty}/battle/scores/${myCode}`), { name: myName, score: 0 });
        }
        showScreen("mode"); 
    };
}

document.querySelectorAll(".diff-btn").forEach(b => {
    if (b.hasAttribute('data-level')) {
        b.onclick = () => {
            playSfx('sound-click');
            currentLevel = b.dataset.level;
            isBattleMode = false;
            startGame();
        };
    }
});

const customPlayBtn = document.getElementById("custom-play-btn");
if (customPlayBtn) {
    customPlayBtn.onclick = () => {
        playSfx('sound-click');
        if (customTypingData.length < 5) return alert("自作データが不足しています。");
        currentLevel = "custom";
        isBattleMode = false;
        startGame();
    };
}

// 初期画面表示
showScreen("mode");
