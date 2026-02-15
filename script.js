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

// --- サウンド再生 ---
const playSfx = (id) => { 
    const el = document.getElementById(id); 
    if(el){ el.currentTime=0; el.play().catch(()=>{}); } 
};

// --- 単語データ (ふりがな付きで大幅増量) ---
const words = [
    // かんたん (12個)
    { k: "林檎", kana: "りんご", lv: "easy" }, { k: "猫", kana: "ねこ", lv: "easy" }, { k: "犬", kana: "いぬ", lv: "easy" },
    { k: "本", kana: "ほん", lv: "easy" }, { k: "空", kana: "そら", lv: "easy" }, { k: "海", kana: "うみ", lv: "easy" },
    { k: "山", kana: "やま", lv: "easy" }, { k: "花", kana: "はな", lv: "easy" }, { k: "雨", kana: "あめ", lv: "easy" },
    { k: "お茶", kana: "おちゃ", lv: "easy" }, { k: "寿司", kana: "すし", lv: "easy" }, { k: "時計", kana: "とけい", lv: "easy" },
    
    // ちゅうきゅう (20個)
    { k: "学校", kana: "がっこう", lv: "normal" }, { k: "友達", kana: "ともだち", lv: "normal" }, { k: "先生", kana: "せんせい", lv: "normal" },
    { k: "勉強", kana: "べんきょう", lv: "normal" }, { k: "自転車", kana: "じてんしゃ", lv: "normal" }, { k: "携帯電話", kana: "けいたいでんわ", lv: "normal" },
    { k: "図書館", kana: "としょかん", lv: "normal" }, { k: "音楽", kana: "おんがく", lv: "normal" }, { k: "映画", kana: "えいが", lv: "normal" },
    { k: "挑戦", kana: "ちょうせん", lv: "normal" }, { k: "秘密", kana: "ひみつ", lv: "normal" }, { k: "希望", kana: "きぼう", lv: "normal" },
    { k: "動物園", kana: "どうぶつえん", lv: "normal" }, { k: "水族館", kana: "すいぞくかん", lv: "normal" }, { k: "遊園地", kana: "ゆうえんち", lv: "normal" },
    { k: "新聞紙", kana: "しんぶんし", lv: "normal" }, { k: "飛行機", kana: "ひこうき", lv: "normal" }, { k: "新幹線", kana: "しんかんせん", lv: "normal" },
    { k: "冷蔵庫", kana: "れいぞうこ", lv: "normal" }, { k: "洗濯機", kana: "せんたくき", lv: "normal" },
    
    // むずかしい (20個)
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

// かな文字列を「複数の入力パターンを持つノード」の配列に変換する
function parseKana(kanaText) {
    let nodes = [];
    for (let i = 0; i < kanaText.length; i++) {
        let chunk = kanaText[i];
        let next = kanaText[i+1];
        // ゃゅょ などが続く場合は結合する (例: し + ょ = しょ)
        if (next && ['ゃ','ゅ','ょ','ぁ','ぃ','ぅ','ぇ','ぉ'].includes(next)) {
            chunk += next;
            i++;
        }
        nodes.push({ k: chunk, opts: romajiTable[chunk] ? [...romajiTable[chunk]] : [chunk] });
    }

    // 「っ」と「ん」の特殊ルールを適用
    for (let i = 0; i < nodes.length; i++) {
        let n = nodes[i];
        // 小さい「っ」の次にくる子音を重ねる入力（kk, ss など）を許可
        if (n.k === 'っ' && i + 1 < nodes.length) {
            let nextOpts = nodes[i+1].opts;
            nextOpts.forEach(opt => {
                let firstChar = opt[0];
                if (!['a','i','u','e','o','y','n'].includes(firstChar) && !n.opts.includes(firstChar)) {
                    n.opts.push(firstChar);
                }
            });
        }
        // 「ん」の次に母音やや行が来ない場合は、単独の 'n' を許可
        if (n.k === 'ん') {
            if (i + 1 < nodes.length) {
                let nextOpts = nodes[i+1].opts;
                let startsWithVowelOrYorN = nextOpts.some(opt => ['a','i','u','e','o','y','n'].includes(opt[0]));
                if (!startsWithVowelOrYorN) {
                    n.opts.push('n');
                }
            }
        }
    }
    return nodes;
}

// --- ゲーム状態管理 ---
let tState = {
    nodes: [],
    cIdx: 0,
    typedInNode: "",
    validOpts: [],
    textDone: ""
};
let isPlaying = false;
let score = 0;
let combo = 0;
let currentLevel = "easy";

const screens = {
    mode: document.getElementById("mode-selection"),
    diff: document.getElementById("difficulty-selection"),
    game: document.getElementById("game-play-area")
};

// UIの重なりを完全に防ぐための画面遷移関数
function showScreen(key) {
    Object.values(screens).forEach(s => s.classList.add("hidden")); // 一旦全部消す
    screens[key].classList.remove("hidden"); // 指定したものだけ表示

    if (key === 'diff') {
        ["easy", "normal", "hard"].forEach(lv => {
            document.getElementById("best-" + lv).innerText = localStorage.getItem(STORAGE_BEST + lv) || 0;
        });
    }
}

document.getElementById("single-play-btn").onclick = () => { playSfx('sound-click'); showScreen("diff"); };
document.getElementById("back-to-mode").onclick = () => { playSfx('sound-click'); showScreen("mode"); };
document.getElementById("end-game-btn").onclick = () => { 
    playSfx('sound-click'); 
    isPlaying = false; 
    saveHighScore();
    showScreen("mode"); // ゲーム中断時は「メインメニュー（モード選択）」に直接戻るよう修正
};

document.querySelectorAll(".diff-btn").forEach(b => {
    b.onclick = () => {
        playSfx('sound-click');
        currentLevel = b.dataset.level;
        startGame();
    };
});

function saveHighScore() {
    let best = parseInt(localStorage.getItem(STORAGE_BEST + currentLevel)) || 0;
    if (score > best) {
        localStorage.setItem(STORAGE_BEST + currentLevel, score);
    }
}

function startGame() {
    score = 0; combo = 0;
    isPlaying = true;
    showScreen("game");
    nextWord();
}

function nextWord() {
    const pool = words.filter(w => w.lv === currentLevel);
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
            // 完了部分は含めない
        } else if (i === tState.cIdx) {
            // 現在のチャンクで、今まで打った文字から始まる一番短い選択肢を表示
            let bestOpt = tState.validOpts.sort((a,b) => a.length - b.length)[0] || tState.nodes[i].opts[0];
            hint += bestOpt.substring(tState.typedInNode.length);
        } else {
            // 未来のチャンクは一番短い選択肢（代表の打ち方）を表示
            hint += tState.nodes[i].opts.sort((a,b) => a.length - b.length)[0];
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
    // 特殊キー無視
    if(key.length > 1 && key !== "escape") return;

    let nextInput = tState.typedInNode + key;
    // 打った文字で始まるパターンの候補を探す
    let matchingOpts = tState.validOpts.filter(opt => opt.startsWith(nextInput));

    if (matchingOpts.length > 0) {
        // 正解！
        tState.typedInNode = nextInput;
        tState.validOpts = matchingOpts;
        tState.textDone += key;
        
        combo++;
        score += 10 + Math.floor(combo/10);
        playSfx('sound-type');

        // そのチャンクの入力が完了したか？（例: 'tyo' を打ち終わったか）
        if (tState.validOpts.includes(tState.typedInNode)) {
            tState.cIdx++;
            tState.typedInNode = "";
            if (tState.cIdx < tState.nodes.length) {
                tState.validOpts = [...tState.nodes[tState.cIdx].opts];
            } else {
                // 単語クリア！
                playSfx('sound-success');
                setTimeout(nextWord, 100);
            }
        }
    } else {
        // ミス！
        combo = 0;
        playSfx('sound-error');
    }
    updateDisplay();
});


// --- Firebase (フレンド・パーティー機能完全版) ---
// ※ updateのパス指定ミスによる書き込みエラーを修正し、setを使用するようにしました。

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
            // ここがバグの原因でした。特定パスの真偽値は set を使って書き込みます
            set(ref(db, `friends/${myCode}/${t}`), true);
            set(ref(db, `friends/${t}/${myCode}`), true);
            alert("フレンドを追加しました！");
            document.getElementById("target-code-input").value = "";
        } else {
            alert("ユーザーが見つかりません。");
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

window.delF = (fid) => { 
    if(confirm("削除しますか？")){
        remove(ref(db, `friends/${myCode}/${fid}`)); 
        remove(ref(db, `friends/${fid}/${myCode}`)); 
    }
};

// パーティー
let curParty = null;
window.invite = async (fid) => {
    if(!curParty){
        curParty = myCode;
        await set(ref(db, `parties/${curParty}`), { leader: myCode, members: {[myCode]: myName} });
        update(myRef, { partyId: curParty });
    }
    set(ref(db, `invites/${fid}`), { from: myName, pid: curParty });
    alert("招待を送信しました！");
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
                d.innerHTML = `<span>${mid===pd.leader?'<span class="leader-tag">LEADER</span>':''}${mname}</span>
                ${pd.leader===myCode && mid!==myCode ? `<button class="del-btn" style="padding:2px 5px;" onclick="kick('${mid}')">KICK</button>` : ''}`;
                list.appendChild(d);
            });
            ctrl.innerHTML = pd.leader===myCode ? `<button class="end-btn" style="width:100%" onclick="disband()">パーティー解散</button>` : `<button class="end-btn" style="width:100%" onclick="leave()">パーティー脱退</button>`;
        });
    } else { info.classList.add("hidden"); msg.classList.remove("hidden"); }
});

window.disband = () => { if(confirm("解散しますか？")) remove(ref(db, `parties/${curParty}`)); };
window.leave = () => { remove(ref(db, `parties/${curParty}/members/${myCode}`)); update(myRef, {partyId: null}); };
window.kick = (mid) => { remove(ref(db, `parties/${curParty}/members/${mid}`)); update(ref(db, `users/${mid}`), {partyId: null}); };
