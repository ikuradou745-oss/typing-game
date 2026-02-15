import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue, onDisconnect, remove, off } from "firebase/database";

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

// --- ユーザーデータ初期化 ---
const STORAGE_ID = "TYPING_USER_ID_8";
const STORAGE_NAME = "TYPING_USER_NAME_8";
const STORAGE_BEST = "TYPING_BEST_";

let myCode = localStorage.getItem(STORAGE_ID) || Math.floor(10000000 + Math.random() * 90000000).toString();
let myName = localStorage.getItem(STORAGE_NAME) || "プレイヤー" + Math.floor(Math.random()*1000);
localStorage.setItem(STORAGE_ID, myCode);
localStorage.setItem(STORAGE_NAME, myName);

document.getElementById("my-friend-code").innerText = myCode;
document.getElementById("display-name").innerText = myName;

// --- サウンド再生制御 ---
const playSfx = (id) => { 
    const el = document.getElementById(id); 
    if(el){ 
        el.currentTime = 0; 
        el.play().catch(()=>{}); 
        
        // 【修正】「じゅー」という音（sound-sizzle）は3秒で強制ストップ
        if(id === 'sound-sizzle') {
            setTimeout(() => {
                el.pause();
                el.currentTime = 0;
            }, 3000);
        }
    } 
};

const bgmBox = {
    lobby: document.getElementById("bgm-lobby"),
    battle: document.getElementById("bgm-battle"),
    play: function(type) {
        this.lobby.pause(); this.battle.pause();
        if(type === 'lobby') { this.lobby.currentTime=0; this.lobby.play().catch(()=>{}); }
        if(type === 'battle') { this.battle.currentTime=0; this.battle.play().catch(()=>{}); }
    },
    stopAll: function() { this.lobby.pause(); this.battle.pause(); }
};
// 初回クリックなどでBGM開始を許可するため
document.addEventListener("click", () => {
    if(bgmBox.lobby.paused && !isPlaying && currentScreen === "mode") bgmBox.play('lobby');
}, {once: true});

// --- 単語データ ---
const words = [
    { k: "林檎", kana: "りんご", lv: "easy" }, { k: "猫", kana: "ねこ", lv: "easy" }, { k: "犬", kana: "いぬ", lv: "easy" },
    { k: "本", kana: "ほん", lv: "easy" }, { k: "空", kana: "そら", lv: "easy" }, { k: "海", kana: "うみ", lv: "easy" },
    { k: "山", kana: "やま", lv: "easy" }, { k: "花", kana: "はな", lv: "easy" }, { k: "雨", kana: "あめ", lv: "easy" },
    { k: "お茶", kana: "おちゃ", lv: "easy" }, { k: "寿司", kana: "すし", lv: "easy" }, { k: "時計", kana: "とけい", lv: "easy" },
    
    { k: "学校", kana: "がっこう", lv: "normal" }, { k: "友達", kana: "ともだち", lv: "normal" }, { k: "先生", kana: "せんせい", lv: "normal" },
    { k: "勉強", kana: "べんきょう", lv: "normal" }, { k: "自転車", kana: "じてんしゃ", lv: "normal" }, { k: "携帯電話", kana: "けいたいでんわ", lv: "normal" },
    { k: "図書館", kana: "としょかん", lv: "normal" }, { k: "音楽", kana: "おんがく", lv: "normal" }, { k: "映画", kana: "えいが", lv: "normal" },
    { k: "挑戦", kana: "ちょうせん", lv: "normal" }, { k: "秘密", kana: "ひみつ", lv: "normal" }, { k: "希望", kana: "きぼう", lv: "normal" },
    { k: "動物園", kana: "どうぶつえん", lv: "normal" }, { k: "水族館", kana: "すいぞくかん", lv: "normal" }, { k: "遊園地", kana: "ゆうえんち", lv: "normal" },
    { k: "新聞紙", kana: "しんぶんし", lv: "normal" }, { k: "飛行機", kana: "ひこうき", lv: "normal" }, { k: "新幹線", kana: "しんかんせん", lv: "normal" },
    { k: "冷蔵庫", kana: "れいぞうこ", lv: "normal" }, { k: "洗濯機", kana: "せんたくき", lv: "normal" },
    
    { k: "一生懸命", kana: "いっしょうけんめい", lv: "hard" }, { k: "温故知新", kana: "おんこちしん", lv: "hard" }, { k: "試行錯誤", kana: "しこうさくご", lv: "hard" },
    { k: "プログラミング", kana: "ぷろぐらみんぐ", lv: "hard" }, { k: "自分自身", kana: "じぶんじしん", lv: "hard" }, { k: "宇宙旅行", kana: "うちゅうりょこう", lv: "hard" },
    { k: "最高速度", kana: "さいこうそくど", lv: "hard" }, { k: "勇猛果敢", kana: "ゆうもうかかん", lv: "hard" }, { k: "一石二鳥", kana: "いっせきにちょう", lv: "hard" },
    { k: "四字熟語", kana: "よじじゅくご", lv: "hard" }, { k: "春夏秋冬", kana: "しゅんかしゅうとう", lv: "hard" }, { k: "起死回生", kana: "きしかいせい", lv: "hard" },
    { k: "以心伝心", kana: "いしんでんしん", lv: "hard" }, { k: "完全無欠", kana: "かんぜんむけつ", lv: "hard" }, { k: "自業自得", kana: "じごうじとく", lv: "hard" },
    { k: "前代未聞", kana: "ぜんだいみもん", lv: "hard" }, { k: "臨機応変", kana: "りんきおうへん", lv: "hard" }, { k: "天真爛漫", kana: "てんしんらんまん", lv: "hard" },
    { k: "七転八起", kana: "しちてんはっき", lv: "hard" }, { k: "電光石火", kana: "でんこうせっか", lv: "hard" }
];

// --- 究極のローマ字判定エンジン ---
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

function parseKana(kanaText) {
    let nodes = [];
    for (let i = 0; i < kanaText.length; i++) {
        let chunk = kanaText[i];
        let next = kanaText[i+1];
        if (next && ['ゃ','ゅ','ょ','ぁ','ぃ','ぅ','ぇ','ぉ'].includes(next)) { chunk += next; i++; }
        nodes.push({ k: chunk, opts: romajiTable[chunk] ? [...romajiTable[chunk]] : [chunk] });
    }
    for (let i = 0; i < nodes.length; i++) {
        let n = nodes[i];
        if (n.k === 'っ' && i + 1 < nodes.length) {
            let nextOpts = nodes[i+1].opts;
            nextOpts.forEach(opt => {
                let firstChar = opt[0];
                if (!['a','i','u','e','o','y','n'].includes(firstChar) && !n.opts.includes(firstChar)) n.opts.push(firstChar);
            });
        }
        if (n.k === 'ん') {
            if (i + 1 < nodes.length) {
                let startsWithVowelOrYorN = nodes[i+1].opts.some(opt => ['a','i','u','e','o','y','n'].includes(opt[0]));
                if (!startsWithVowelOrYorN) n.opts.push('n');
            }
        }
    }
    return nodes;
}

// --- ゲーム状態管理 ---
let tState = { nodes: [], cIdx: 0, typedInNode: "", validOpts: [], textDone: "" };
let isPlaying = false, isBattleMode = false, score = 0, combo = 0, currentLevel = "easy";
let battleTimer = null, timeLeft = 0, totalTime = 0;
let currentScreen = "mode";

const screens = {
    mode: document.getElementById("mode-selection"),
    diff: document.getElementById("difficulty-selection"),
    setup: document.getElementById("battle-setup"),
    wait: document.getElementById("battle-waiting"),
    game: document.getElementById("game-play-area"),
    result: document.getElementById("result-screen"),
    // 追加画面
    online: document.getElementById("online-selection"),
    onlinewait: document.getElementById("online-waiting"),
    editor: document.getElementById("custom-editor")
};

window.showScreen = (key) => {
    Object.values(screens).forEach(s => s.classList.add("hidden"));
    screens[key].classList.remove("hidden");
    currentScreen = key;

    if (key === 'diff') {
        ["easy", "normal", "hard"].forEach(lv => {
            document.getElementById("best-" + lv).innerText = localStorage.getItem(STORAGE_BEST + lv) || 0;
        });
    }
    
    // BGM管理
    if (['mode', 'diff', 'setup', 'wait', 'result', 'online', 'onlinewait', 'editor'].includes(key)) {
        bgmBox.play('lobby');
    }
};

// 一人プレイ
document.getElementById("single-play-btn").onclick = () => { playSfx('sound-click'); showScreen("diff"); };
document.getElementById("back-to-mode").onclick = () => { playSfx('sound-click'); showScreen("mode"); };

document.querySelectorAll(".diff-btn").forEach(b => {
    if(b.hasAttribute('data-level')) {
        b.onclick = () => {
            playSfx('sound-click');
            currentLevel = b.dataset.level;
            isBattleMode = false;
            startGame();
        };
    }
});

document.getElementById("end-game-btn").onclick = () => { 
    playSfx('sound-click'); 
    isPlaying = false;
    clearInterval(battleTimer);
    saveHighScore();
    
    if(isBattleMode && curParty) {
        set(ref(db, `parties/${curParty}/battle/scores/${myCode}`), { name: myName, score: 0 });
    }
    showScreen("mode"); 
};

function saveHighScore() {
    if(isBattleMode || currentLevel === "custom") return;
    let best = parseInt(localStorage.getItem(STORAGE_BEST + currentLevel)) || 0;
    if (score > best) localStorage.setItem(STORAGE_BEST + currentLevel, score);
}

function startGame(time = 0) {
    score = 0; combo = 0;
    isPlaying = true;
    showScreen("game");
    
    if(isBattleMode) {
        bgmBox.play('battle');
        timeLeft = time;
        totalTime = time;
        document.getElementById("battle-header").classList.remove("hidden");
        document.getElementById("rival-lanes").classList.remove("hidden");
        document.getElementById("end-game-btn").innerText = "バトルから逃げる";
        updateTimerDisplay();
        
        battleTimer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            const lanes = document.getElementById("rival-lanes");
            if(timeLeft < totalTime / 2) { lanes.classList.add("fog"); }
            else { lanes.classList.remove("fog"); }

            if(timeLeft <= 0) endBattle();
            
            set(ref(db, `parties/${curParty}/battle/scores/${myCode}`), { name: myName, score: score });
        }, 1000);
    } else {
        bgmBox.play('lobby');
        document.getElementById("battle-header").classList.add("hidden");
        document.getElementById("rival-lanes").classList.add("hidden");
        document.getElementById("end-game-btn").innerText = "中断してメインメニューへ";
    }

    nextWord();
}

function updateTimerDisplay() {
    document.getElementById("timer-display").innerText = `TIME: ${timeLeft}`;
}

function nextWord() {
    let pool;
    if (currentLevel === "custom") {
        // 自作モードの場合はカスタムデータを使う
        pool = customTypingData.map(w => ({ k: w, kana: w, lv: "custom" }));
    } else {
        pool = words.filter(w => w.lv === currentLevel);
    }

    let target = pool[Math.floor(Math.random() * pool.length)];
    
    tState.nodes = parseKana(target.kana);
    tState.cIdx = 0;
    tState.typedInNode = "";
    tState.validOpts = [...tState.nodes[0].opts];
    tState.textDone = "";

    document.getElementById("japanese-word").innerText = target.k;
    updateDisplay();
}

function getHintString() {
    let hint = "";
    for (let i = 0; i < tState.nodes.length; i++) {
        if (i < tState.cIdx) {
            // done
        } else if (i === tState.cIdx) {
            let bestOpt = [...tState.validOpts].sort((a,b) => a.length - b.length)[0] || tState.nodes[i].opts[0];
            hint += bestOpt.substring(tState.typedInNode.length);
        } else {
            hint += [...tState.nodes[i].opts].sort((a,b) => a.length - b.length)[0];
        }
    }
    return hint;
}

function updateDisplay() {
    document.getElementById("char-done").innerText = tState.textDone;
    document.getElementById("char-todo").innerText = getHintString();
    document.getElementById("score-count").innerText = score;
    const cb = document.getElementById("combo-display");
    cb.innerText = combo > 0 ? combo + " COMBO" : "";
    if(combo > 0) cb.classList.add("active"); else cb.classList.remove("active");
}

window.addEventListener("keydown", (e) => {
    if(!isPlaying) return;
    const key = e.key.toLowerCase();
    if(key.length > 1 && key !== "escape") return;

    let nextInput = tState.typedInNode + key;
    let matchingOpts = tState.validOpts.filter(opt => opt.startsWith(nextInput));

    if (matchingOpts.length > 0) {
        tState.typedInNode = nextInput;
        tState.validOpts = matchingOpts;
        tState.textDone += key;
        
        combo++;
        score += 10 + Math.floor(combo/10);
        playSfx('sound-type');

        if (tState.validOpts.includes(tState.typedInNode)) {
            tState.cIdx++;
            tState.typedInNode = "";
            if (tState.cIdx < tState.nodes.length) {
                tState.validOpts = [...tState.nodes[tState.cIdx].opts];
            } else {
                playSfx('sound-success');
                playSfx('sound-sizzle'); // ★クリア時に「じゅー」を鳴らす（3秒で止まる設定済み）
                setTimeout(nextWord, 100);
            }
        }
    } else {
        combo = 0;
        playSfx('sound-error');
    }
    updateDisplay();
});


// ==========================================================
// カスタムタイピングエディター (タイピングを作る・遊ぶ)
// ==========================================================
let customTypingData = JSON.parse(localStorage.getItem("CUSTOM_TYPING_LIST")) || [
    "あいうえお", "かきくけこ", "さしすせそ", "たちつてと", "なにぬねの"
];

document.getElementById("open-editor-btn").onclick = () => {
    playSfx('sound-click');
    if (curParty) {
        alert("パーティーに入っているときは利用できません。");
        return;
    }
    showScreen("editor");
    renderEditor();
};

document.getElementById("custom-play-btn").onclick = () => {
    playSfx('sound-click');
    if(customTypingData.length < 5) {
        alert("自作データが足りません。エディターで作ってください。");
        return;
    }
    currentLevel = "custom";
    isBattleMode = false;
    startGame();
};

function renderEditor() {
    const list = document.getElementById("custom-word-list");
    list.innerHTML = "";
    customTypingData.forEach((word, i) => {
        const div = document.createElement("div");
        div.className = "editor-row";
        div.innerHTML = `
            <input type="text" value="${word}" onchange="updateCustomWord(${i}, this.value)" placeholder="ひらがなで入力">
            <button class="danger-btn" onclick="removeCustomWord(${i})">削除</button>
        `;
        list.appendChild(div);
    });
    document.getElementById("custom-count").innerText = customTypingData.length;
}

window.updateCustomWord = (i, val) => {
    customTypingData[i] = val.trim();
};

window.addCustomWord = () => {
    playSfx('sound-click');
    if(customTypingData.length < 20) {
        customTypingData.push("あたらしいもじ");
        renderEditor();
    } else {
        alert("最高20個までです。");
    }
};

window.removeCustomWord = (i) => {
    playSfx('sound-click');
    if(customTypingData.length > 5) {
        customTypingData.splice(i, 1);
        renderEditor();
    } else {
        alert("最低5つは必要です。");
    }
};

window.saveCustomWords = () => {
    playSfx('sound-click');
    if(customTypingData.length < 5 || customTypingData.length > 20) {
        return alert("条件を満たしていません（5〜20個必要です）");
    }
    for(let i=0; i<customTypingData.length; i++) {
        let w = customTypingData[i];
        if(w.length < 2 || w.length > 15) {
            return alert(`${i+1}番目の内容が条件（2〜15文字）を満たしていません。`);
        }
    }
    localStorage.setItem("CUSTOM_TYPING_LIST", JSON.stringify(customTypingData));
    alert("保存しました！「作ったものを遊ぶ」から一人プレイで遊べます。");
    showScreen("mode");
};

// ==========================================================
// Firebase (フレンド・パーティー・バトル機能・オンラインマッチ)
// ==========================================================
let curParty = null;
let isLeader = false;
let partyMembersMemory = {}; 

const myRef = ref(db, `users/${myCode}`);
onValue(ref(db, ".info/connected"), (s) => {
    if(s.val()){
        update(myRef, { name: myName, status: "online" });
        onDisconnect(myRef).update({ status: "offline" });
    }
});

document.getElementById("update-name-btn").onclick = () => {
    playSfx('sound-click');
    const n = document.getElementById("name-input").value.trim();
    if(n){
        myName = n; localStorage.setItem(STORAGE_NAME, n);
        document.getElementById("display-name").innerText = n;
        update(myRef, { name: n });
    }
};

document.getElementById("send-request-btn").onclick = async () => {
    playSfx('sound-click');
    const t = document.getElementById("target-code-input").value.trim();
    if(t.length === 8 && t !== myCode){
        const s = await get(ref(db, `users/${t}`));
        if(s.exists()){
            set(ref(db, `friends/${myCode}/${t}`), true);
            set(ref(db, `friends/${t}/${myCode}`), true);
            alert("フレンドを追加しました！");
            document.getElementById("target-code-input").value = "";
        } else {
            alert("ユーザーが見つかりません。");
        }
    }
};

// --- フレンド機能 ---
let friendListeners = {}; 
onValue(ref(db, `friends/${myCode}`), (s) => {
    const list = document.getElementById("friend-list");
    
    const currentFriends = s.val() || {};
    Object.keys(friendListeners).forEach(fid => {
        if(!currentFriends[fid]) {
            const li = document.getElementById(`li-${fid}`);
            if(li) li.remove();
            friendListeners[fid](); 
            delete friendListeners[fid];
        }
    });

    s.forEach(child => {
        const fid = child.key;
        if(!friendListeners[fid]) {
            let li = document.createElement("li");
            li.id = `li-${fid}`; li.className = "friend-item";
            list.appendChild(li);

            // 前回途切れていた部分の修復完了
            const unsub = onValue(ref(db, `users/${fid}`), (fs) => {
                const fd = fs.val(); if(!fd) return;
                li.innerHTML = `
                    <div class="friend-info">
                        <strong>${fd.name}</strong>
                        <span class="dot ${fd.status==='online'?'online':'offline'}"></span>
                    </div>
                    <div class="friend-btns">
                        <button class="invite-btn" onclick="inviteFriend('${fid}')">招待</button>
                        <button class="del-btn" onclick="removeFriend('${fid}')">削除</button>
                    </div>
                `;
            });
            friendListeners[fid] = unsub;
        }
    });
});

window.inviteFriend = (targetCode) => {
    if(!curParty) createParty();
    set(ref(db, `invites/${targetCode}/${myCode}`), { name: myName, time: Date.now() });
    alert("招待を送信しました！");
};

window.removeFriend = (targetCode) => {
    if(confirm("フレンドを削除しますか？")) {
        remove(ref(db, `friends/${myCode}/${targetCode}`));
        remove(ref(db, `friends/${targetCode}/${myCode}`));
    }
};

// 招待受け取り
onValue(ref(db, `invites/${myCode}`), (s) => {
    const data = s.val();
    if(data) {
        const inviterCode = Object.keys(data)[0];
        const inviterName = data[inviterCode].name;
        document.getElementById("inviter-name").innerText = inviterName;
        document.getElementById("invite-notification").classList.remove("hidden");
        
        document.getElementById("accept-invite-btn").onclick = () => {
            remove(ref(db, `invites/${myCode}`));
            joinParty(inviterCode);
            document.getElementById("invite-notification").classList.add("hidden");
        };
        document.getElementById("decline-invite-btn").onclick = () => {
            remove(ref(db, `invites/${myCode}`));
            document.getElementById("invite-notification").classList.add("hidden");
        };
    }
});

// パーティー管理
function createParty() {
    curParty = myCode;
    isLeader = true;
    set(ref(db, `parties/${myCode}`), { leader: myCode, status: "waiting", members: { [myCode]: myName } });
    onDisconnect(ref(db, `parties/${myCode}`)).remove();
    listenToParty(myCode);
}

function joinParty(leaderCode) {
    if(curParty) return;
    curParty = leaderCode;
    isLeader = false;
    update(ref(db, `parties/${leaderCode}/members`), { [myCode]: myName });
    onDisconnect(ref(db, `parties/${leaderCode}/members/${myCode}`)).remove();
    listenToParty(leaderCode);
}

function listenToParty(partyId) {
    onValue(ref(db, `parties/${partyId}`), (s) => {
        const p = s.val();
        if(!p) {
            // 解散
            curParty = null;
            isLeader = false;
            document.getElementById("no-party-msg").classList.remove("hidden");
            document.getElementById("party-info").classList.add("hidden");
            if(isPlaying) showScreen("mode");
            return;
        }

        document.getElementById("no-party-msg").classList.add("hidden");
        document.getElementById("party-info").classList.remove("hidden");
        
        // メンバーリスト更新
        let mHtml = "";
        Object.keys(p.members).forEach(uid => {
            mHtml += `<div class="party-member">
                        <span>${uid === p.leader ? '<span class="leader-tag">LEADER</span>' : ''}${p.members[uid]}</span>
                        ${isLeader && uid !== myCode ? `<button class="del-btn" onclick="kickMember('${uid}')">キック</button>` : ''}
                      </div>`;
        });
        document.getElementById("party-member-list").innerHTML = mHtml;

        // コントロールボタン
        if(isLeader) {
            document.getElementById("party-controls").innerHTML = `<button class="danger-btn" onclick="leaveParty()" style="width:100%">パーティー解散</button>`;
        } else {
            document.getElementById("party-controls").innerHTML = `<button class="danger-btn" onclick="leaveParty()" style="width:100%">パーティーを抜ける</button>`;
        }

        // 状態検知
        if(p.status === "setup" && !isLeader && currentScreen !== "wait") {
            showScreen("wait");
        } else if(p.status === "playing" && !isPlaying) {
            isBattleMode = true;
            startGame(p.battle.time || 30);
        }

        // バトル中のスコア同期
        if(p.status === "playing" && p.battle && p.battle.scores) {
            updateBattleLanes(p.battle.scores);
        }
    });
}

window.leaveParty = () => {
    if(isLeader) {
        remove(ref(db, `parties/${myCode}`));
    } else {
        remove(ref(db, `parties/${curParty}/members/${myCode}`));
    }
    curParty = null;
};

window.kickMember = (uid) => {
    remove(ref(db, `parties/${curParty}/members/${uid}`));
};

document.getElementById("friend-play-btn").onclick = () => {
    playSfx('sound-click');
    if(!curParty) {
        alert("パーティーを作成するか、招待を受けてください。");
        return;
    }
    if(!isLeader) {
        alert("リーダーのみが設定できます。");
        return;
    }
    update(ref(db, `parties/${curParty}`), { status: "setup" });
    showScreen("setup");
};

// バトルスタート
document.getElementById("start-battle-trigger").onclick = () => {
    playSfx('sound-start');
    const t = parseInt(document.getElementById("battle-time-range").value);
    const d = document.getElementById("battle-diff-select").value;
    currentLevel = d;
    update(ref(db, `parties/${curParty}`), { 
        status: "playing",
        battle: { time: t, scores: {} }
    });
    isBattleMode = true;
    startGame(t);
};

// リアルタイムレーン更新
function updateBattleLanes(scores) {
    const lanes = document.getElementById("rival-lanes");
    let html = "";
    
    // 最大スコアを計算（バーの長さの基準）
    let maxS = 100;
    Object.values(scores).forEach(s => { if(s.score > maxS) maxS = s.score; });

    Object.keys(scores).forEach(uid => {
        const d = scores[uid];
        const pct = Math.min(100, (d.score / maxS) * 100);
        html += `
            <div class="lane">
                <div class="lane-name">${d.name}</div>
                <div class="lane-bar-bg">
                    <div class="lane-bar-fill" style="width: ${pct}%"></div>
                </div>
                <div class="lane-score">${d.score}</div>
            </div>
        `;
    });
    lanes.innerHTML = html;
}

// バトル終了時
function endBattle() {
    isPlaying = false;
    clearInterval(battleTimer);
    playSfx('sound-success');
    
    // リーダーが状態を終了に
    if(isLeader) {
        update(ref(db, `parties/${curParty}`), { status: "waiting" });
    }
    
    // スコアを集計してリザルト画面へ
    get(ref(db, `parties/${curParty}/battle/scores`)).then(s => {
        const scores = s.val() || {};
        const arr = Object.values(scores).sort((a,b) => b.score - a.score);
        
        let rHtml = "";
        arr.forEach((d, i) => {
            rHtml += `<div class="rank-item rank-${i+1}">
                        <span>${i+1}位: ${d.name}</span>
                        <span>${d.score} pt</span>
                      </div>`;
        });
        document.getElementById("ranking-list").innerHTML = rHtml;
        showScreen("result");
    });
}

// ==========================================================
// オンライン対戦（マッチメイキング機能）
// ==========================================================
document.getElementById("online-play-btn").onclick = () => {
    playSfx('sound-click');
    if (curParty) {
        alert("パーティーに参加している状態ではオンライン対戦はできません。パーティーを抜けてください。");
        return;
    }
    showScreen("online");
};

let matchQueueRef = null;

window.joinMatchmaking = (playerCount) => {
    playSfx('sound-click');
    showScreen("onlinewait");
    
    // キューに参加
    const qPath = `matchmaking/${playerCount}/${myCode}`;
    set(ref(db, qPath), { name: myName, time: Date.now() });
    matchQueueRef = ref(db, `matchmaking/${playerCount}`);

    // 人数が揃うのを監視
    onValue(matchQueueRef, (snap) => {
        if(!snap.exists()) return;
        const players = snap.val();
        const keys = Object.keys(players).sort((a,b) => players[a].time - players[b].time);
        
        document.getElementById("online-wait-count").innerText = `${keys.length} / ${playerCount}`;

        // 人数が満たし、かつ自分がそのマッチに含まれている場合
        if (keys.length >= playerCount && keys.slice(0, playerCount).includes(myCode)) {
            off(matchQueueRef); // 監視停止
            remove(ref(db, qPath)); // キューから自分を消す
            
            const leader = keys[0];
            curParty = leader;
            isLeader = (myCode === leader);

            if (isLeader) {
                // リーダーが強制的に試合部屋（パーティー）を作成しスタート状態にする
                let members = {};
                keys.slice(0, playerCount).forEach(k => members[k] = players[k].name);
                set(ref(db, `parties/${leader}`), {
                    leader: leader,
                    status: "playing",
                    members: members,
                    battle: { time: 40, scores: {} } // 40秒で固定
                });
                
                // リーダー自身はすぐにゲーム開始
                setTimeout(() => {
                    currentLevel = "normal"; // オンラインはノーマル固定
                    isBattleMode = true;
                    startGame(40);
                }, 1500);
            } else {
                // リーダー以外は部屋ができて「playing」になるのを待つ
                const pRef = ref(db, `parties/${leader}`);
                onValue(pRef, (pSnap) => {
                    const pData = pSnap.val();
                    if(pData && pData.status === "playing") {
                        off(pRef);
                        currentLevel = "normal";
                        isBattleMode = true;
                        startGame(pData.battle.time || 40);
                        listenToParty(leader); // 通常のパーティー監視も付与
                    }
                });
            }
        }
    });
};

window.cancelMatchmaking = () => {
    playSfx('sound-click');
    if (matchQueueRef) {
        off(matchQueueRef);
        // 全人数用のキューから自分を削除
        remove(ref(db, `matchmaking/2/${myCode}`));
        remove(ref(db, `matchmaking/3/${myCode}`));
        remove(ref(db, `matchmaking/4/${myCode}`));
    }
    showScreen("mode");
};
