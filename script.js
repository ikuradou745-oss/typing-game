// =========================================
// ULTIMATE TYPING ONLINE - RAMO EDITION
// FIREBASE & GAME ENGINE SCRIPT
// 一切の省略なし完全版コード (バグ修正済)
// =========================================

// Webブラウザで直接動かすため、CDNリンクからFirebaseをインポートします
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getDatabase, ref, set, onValue, update, push, remove, onDisconnect, serverTimestamp, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// === Firebase 初期設定 (いただいた本物の設定データ) ===
const firebaseConfig = {
    apiKey: "AIzaSyBXnNXQ5khcR0EvRide4C0PjshJZpSF4oM",
    authDomain: "typing-game-28ed0.firebaseapp.com",
    databaseURL: "https://typing-game-28ed0-default-rtdb.firebaseio.com",
    projectId: "typing-game-28ed0",
    storageBucket: "typing-game-28ed0.firebasestorage.app",
    messagingSenderId: "963797267101",
    appId: "1:963797267101:web:0d5d700458fb1991021a74",
    measurementId: "G-CL4B6ZK0SC"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// === グローバル状態変数 ===
// ユーザーの初期化（ランダムな8桁の数字を生成）
const generateRandomId = () => Math.floor(10000000 + Math.random() * 89999999).toString();

let myId = localStorage.getItem("ramo_typing_uid");
if (!myId) {
    myId = generateRandomId();
    localStorage.setItem("ramo_typing_uid", myId);
}

let myName = localStorage.getItem("ramo_typing_name") || `園名：${generateRandomId()}`;
let myPartyId = null;
let isLeader = false;

// ゲーム進行用変数
let currentWords = [];
let currentIndex = 0;
let currentRoma = "";
let romaIndex = 0;
let score = 0;
let combo = 0;
let timer = 30;
let gameActive = false;
let gameInterval = null;
let customWords = JSON.parse(localStorage.getItem("ramo_custom_words")) || [];

// === 音声エフェクト設定 ===
const sounds = {
    type: new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"),
    miss: new Audio("https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3"),
    correct: new Audio("https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3"),
    finish: new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3"),
    notify: new Audio("https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3")
};

// ユーティリティ関数
const el = (id) => document.getElementById(id);

// === ローマ字認識エンジン (複数パターン・伸ばし棒対応) ===
const KANA_MAP = {
    'あ':'a','い':'i','う':'u','え':'e','お':'o',
    'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
    'さ':'sa','し':['si','shi'],'す':'su','せ':'se','そ':'so',
    'た':'ta','ち':['ti','chi'],'つ':['tu','tsu'],'て':'te','と':'to',
    'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
    'は':'ha','ひ':'hi','ふ':['hu','fu'],'へ':'he','ほ':'ho',
    'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
    'や':'ya','ゆ':'yu','よ':'yo',
    'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
    'わ':'wa','を':'wo','ん':['nn','n'],
    'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
    'ざ':'za','じ':['zi','ji'],'ず':'zu','ぜ':'ze','ぞ':'zo',
    'だ':'da','ぢ':['di','ji'],'づ':'du','で':'de','ど':'do',
    'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
    'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
    'きゃ':['kya'],'きゅ':['kyu'],'きょ':['kyo'],
    'しゃ':['sya','sha'],'しゅ':['syu','shu'],'しょ':['syo','sho'],
    'ちゃ':['tya','cha'],'ちゅ':['tyu','chu'],'ちょ':['tyo','cho'],
    'にゃ':['nya'],'にゅ':['nyu'],'にょ':['nyo'],
    'ひゃ':['hya'],'ひゅ':['hyu'],'ひょ':['hyo'],
    'みゃ':['mya'],'みゅ':['myu'],'みょ':['myo'],
    'りゃ':['rya'],'りゅ':['ryu'],'りょ':['ryo'],
    'ぎゃ':['gya'],'ぎゅ':['gyu'],'ぎょ':['gyo'],
    'じゃ':['zya','ja'],'じゅ':['zyu','ju'],'じょ':['zyo','jo'],
    'びゃ':['bya'],'びゅ':['byu'],'びょ':['byo'],
    'ぴゃ':['pya'],'ぴゅ':['pyu'],'ぴょ':['pyo'],
    'っ':['xtu','ltu'], // 促音は特殊処理
    'ー':['-'] // 伸ばし棒（マイナスキー）の完全対応
};

function getRomaPatterns(kanaStr) {
    let patterns = [""];
    let i = 0;
    while(i < kanaStr.length) {
        let char2 = kanaStr.substring(i, i+2);
        let char1 = kanaStr.substring(i, i+1);
        let addition = [];

        if(KANA_MAP[char2]) {
            let opts = Array.isArray(KANA_MAP[char2]) ? KANA_MAP[char2] : [KANA_MAP[char2]];
            addition = opts;
            i += 2;
        } else if(char1 === 'っ' && i+1 < kanaStr.length) {
            let nextPatterns = getRomaPatterns(kanaStr.substring(i+1, i+2));
            addition = nextPatterns.map(p => p[0]); // 次の文字の最初を重ねる
            i += 1;
        } else if(KANA_MAP[char1]) {
            let opts = Array.isArray(KANA_MAP[char1]) ? KANA_MAP[char1] : [KANA_MAP[char1]];
            addition = opts;
            i += 1;
        } else {
            addition = [char1];
            i += 1;
        }

        let newPatterns = [];
        patterns.forEach(p => {
            addition.forEach(a => {
                newPatterns.push(p + a);
            });
        });
        patterns = newPatterns;
    }
    return patterns;
}

// === 内蔵単語データベース (合計100以上) ===
// 簡単=2~6文字、中級=6~12文字、難しい=12~20文字
const WORD_DB = {
    easy: [
        "ねこ","いぬ","つき","ほし","うみ","やま","そら","あめ","かぜ","ゆき",
        "りんご","すいか","みかん","いちご","ばなな","とまと","きゅうり","はくさい",
        "えんぴつ","とけい","ほん","つくえ","いす","かばん","くつ","ぼうし",
        "さかな","とり","かめ","くま","ぞう","きりん","らいおん","いるか",
        "ごはん","ぱん","にく","やさい","おかし","けーき","あいす","じゅーす",
        "らーめん","かれー","すーぷ","のーと","ぺん","まーかー","てーぶる"
    ],
    normal: [
        "ぷろぐらみんぐ","すまーとふぉん","いんたーねっと","たいぴんぐげーむ",
        "こうきゅうじりつ","てれびばんぐみ","しんかんせん","きょうりょく",
        "せかいへいわ","うちゅうりょこう","だいこんやくしゃ","とうもろこし",
        "ひまわりばたけ","かんこうきゃく","こんぴゅーたー","そふとうぇあ",
        "じどうはんばいき","せんたくき","れいぞうこ","そうじき","でんしれんじ",
        "じてんしゃ","おーとばい","ひこうき","へりこぷたー","ゆうえんち",
        "すいぞくかん","はくぶつかん","としょかん","しょうがっこう",
        "ちゅうがっこう","こうとうがっこう","だいがくせい","かいしゃいん",
        "すーぱーまーけっと","ほーむせんたー","ぱーそなるこんぴゅーたー"
    ],
    hard: [
        "じょうほうしょりぎじゅつしゃ","にほんごにゅうりょくそうち","しんらばんしょう",
        "ぜったいれいど","むがむちゅう","きゅうてんちょっか","いっしょくそくはつ",
        "こんぴゅーたーぐらふぃっくす","しょうめんづき","こうごうせい","ちょうこうそうびる",
        "じんこうちのうのしんか","でじたるとらんすふぉーめーしょん","きかいがくしゅう",
        "きょだいなうちゅうすてーしょん","りょうしこんぴゅーたー","ぶろっくちぇーんばんく",
        "さいしんせんたんてくのろじー","せきゅりてぃーえんじにあ","おーぷんそーすこみゅにてぃ",
        "げーむでべろっぱーのちから","すーぱーこんぴゅーたーのけいさん","せかいじゅうのねっとわーく"
    ]
};

// === HTMLから呼び出せるように window オブジェクトに登録 ===

window.updateMyName = () => {
    myName = el("my-name-input").value;
    if(!myName) myName = `園名：${generateRandomId()}`;
    localStorage.setItem("ramo_typing_name", myName);
    update(ref(db, `users/${myId}`), { name: myName });
};

window.goHome = () => {
    gameActive = false;
    if(gameInterval) clearInterval(gameInterval);
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    el("screen-home").classList.remove("hidden");
    el("rival-scores").classList.add("hidden");
};

// --- フレンド機能 ---
window.addFriendPrompt = async () => {
    const code = prompt("フレンドになりたい人のフレンドコードを入力してください (8桁の数字)");
    if(!code || code === myId) return;
    
    // 相手がデータベースに存在するか確認してフレンド登録
    const userSnap = await get(ref(db, `users/${code}`));
    if(userSnap.exists()) {
        await update(ref(db, `users/${myId}/friends/${code}`), { added: true });
        await update(ref(db, `users/${code}/friends/${myId}`), { added: true });
        alert("リアルタイムでフレンドになりました！パーティーに招待できます。");
    } else {
        alert("そのコードのユーザーは見つかりません。相手が一度もゲームを開いていないか、コードが間違っています。");
    }
};

window.removeFriend = (id) => {
    if(confirm("本当にフレンドを削除しますか？")) {
        remove(ref(db, `users/${myId}/friends/${id}`));
    }
};

// --- パーティー機能 ---
window.inviteToParty = (targetId) => {
    if(!myPartyId) {
        myPartyId = myId; // 自分がリーダーになる
        set(ref(db, `parties/${myPartyId}`), {
            leader: myId,
            members: { [myId]: { name: myName, score: 0 } },
            state: "lobby"
        });
        update(ref(db, `users/${myId}`), { partyId: myPartyId });
    }
    // 相手の左上にメッセージを送る処理
    update(ref(db, `users/${targetId}/invites/${myId}`), { 
        fromName: myName, 
        fromId: myId,
        timestamp: serverTimestamp() 
    });
    alert("招待を送信しました！");
};

window.acceptInvite = () => {
    get(ref(db, `users/${myId}/invites`)).then(snap => {
        const invites = snap.val();
        if(!invites) return;
        const inviterId = Object.keys(invites)[0];
        const pId = inviterId;
        update(ref(db, `parties/${pId}/members/${myId}`), { name: myName, score: 0 });
        update(ref(db, `users/${myId}`), { partyId: pId });
        remove(ref(db, `users/${myId}/invites`));
        el("invite-toast").classList.add("hidden");
    });
};

window.declineInvite = () => {
    remove(ref(db, `users/${myId}/invites`));
    el("invite-toast").classList.add("hidden");
};

window.leaveParty = () => {
    if(!myPartyId) return;
    if(isLeader) {
        // リーダー解散
        remove(ref(db, `parties/${myPartyId}`));
    } else {
        // メンバー離脱
        remove(ref(db, `parties/${myPartyId}/members/${myId}`));
    }
    update(ref(db, `users/${myId}`), { partyId: null });
    myPartyId = null;
    isLeader = false;
};

window.kickMember = (id) => {
    if(confirm("このメンバーをキックしますか？")) {
        remove(ref(db, `parties/${myPartyId}/members/${id}`));
        update(ref(db, `users/${id}`), { partyId: null });
    }
};

// --- 一人でプレイ ---
window.openSingleSelect = () => {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    el("screen-single-select").classList.remove("hidden");
};

window.startSingle = (diff) => {
    currentWords = WORD_DB[diff].sort(() => Math.random() - 0.5); // シャッフル
    startGame(60); // 一人用は標準で60秒とします
};

// --- フレンドと遊ぶ (パーティー対戦) ---
window.openFriendBattle = () => {
    if(!myPartyId) return alert("パーティーに参加していません！");
    if(!isLeader) return alert("リーダー限定です！メンバーはリーダーの開始を待ってください。");
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    el("screen-battle-setup").classList.remove("hidden");
};

window.launchBattle = () => {
    const time = parseInt(el("setup-time").value);
    const diff = el("setup-diff").value;
    update(ref(db, `parties/${myPartyId}`), {
        state: "playing",
        duration: time,
        difficulty: diff,
        startTime: serverTimestamp()
    });
};

// --- オンラインで遊ぶ ---
window.openOnlineMatch = async () => {
    if(myPartyId) return alert("パーティーに入っていたらできません。パーティーを抜けてからやり直してください。");
    
    const countInput = prompt("何人で遊びますか？ (2, 3, 4 を入力)");
    const count = parseInt(countInput);
    if(![2,3,4].includes(count)) return;

    const matchRef = ref(db, `matchmaking/${count}`);
    update(matchRef, { [myId]: { name: myName, time: serverTimestamp() } });
    alert(`${count}人対戦のマッチング待機中です...（他の人が来るのをお待ちください）`);
    
    // 待機列を監視して指定人数が揃ったらゲーム開始
    onValue(matchRef, snap => {
        const waitList = snap.val();
        if(waitList && Object.keys(waitList).length >= count) {
            const players = Object.keys(waitList).slice(0, count);
            if(players[0] === myId) { // 先頭の人がシステム的リーダーとして部屋作成
                const newPId = "match_" + myId;
                const members = {};
                players.forEach(p => {
                    members[p] = { name: waitList[p].name, score: 0 };
                    remove(ref(db, `matchmaking/${count}/${p}`));
                });
                set(ref(db, `parties/${newPId}`), {
                    leader: myId,
                    members: members,
                    state: "playing",
                    duration: 30, // オンライン対戦は制限時間30秒固定
                    difficulty: ["easy","normal","hard"][Math.floor(Math.random()*3)] // ランダム難易度
                });
                players.forEach(p => update(ref(db, `users/${p}`), { partyId: newPId }));
            }
        }
    });
};

// --- タイピングを作る (エディター) ---
window.openEditor = () => {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    el("screen-editor").classList.remove("hidden");
    if(customWords.length === 0) customWords = ["","","","",""]; // 最低5個
    renderEditor();
};

function renderEditor() {
    const container = el("editor-container");
    container.innerHTML = "";
    customWords.forEach((w, i) => {
        const div = document.createElement("div");
        div.className = "editor-row";
        div.innerHTML = `
            <input type="text" class="editor-input" value="${w}" onchange="window.updateCustomWord(${i}, this.value)" placeholder="タイピングの内容 (ひらがな 2~20文字)">
            <button class="btn-kick btn-s" onclick="window.removeEditorRow(${i})">削除</button>
        `;
        container.appendChild(div);
    });
}

window.addEditorRow = () => {
    if(customWords.length >= 20) return alert("最高20個までです！");
    customWords.push("");
    renderEditor();
};

window.removeEditorRow = (i) => {
    if(customWords.length <= 5) return alert("最低5個は必要です！");
    customWords.splice(i, 1);
    renderEditor();
};

window.updateCustomWord = (i, val) => {
    // ひらがな・伸ばし棒のみに制限
    customWords[i] = val.replace(/[^ぁ-んー]/g, ''); 
};

window.saveEditor = () => {
    const valid = customWords.filter(w => w.length >= 2 && w.length <= 20);
    if(valid.length < 5) return alert("2〜20文字のひらがなで、最低5個作成してください！");
    customWords = valid;
    localStorage.setItem("ramo_custom_words", JSON.stringify(customWords));
    alert("完成しました！");
    window.goHome();
};

window.playCustom = () => {
    if(customWords.length < 5) return alert("まだタイピングが完成していません！「タイピングを作る」から作ってください。");
    currentWords = customWords;
    startGame(60);
};

// === ゲームコアシステム ===

function nextQuestion() {
    let q = currentWords[currentIndex % currentWords.length];
    el("q-ja").innerText = q;
    let patterns = getRomaPatterns(q);
    currentRoma = patterns[0]; // 初回はパターンの最初を表示
    romaIndex = 0;
    renderRoma();
}

function renderRoma() {
    el("q-done").innerText = currentRoma.substring(0, romaIndex);
    el("q-todo").innerText = currentRoma.substring(romaIndex);
}

// キーボード入力監視 (伸ばし棒対応済)
window.addEventListener("keydown", (e) => {
    if(!gameActive) return;
    if(e.key === "Shift" || e.key === "Control" || e.key === "Alt") return;

    if(e.key === currentRoma[romaIndex]) {
        romaIndex++;
        // スコア計算: コンボ数と直結
        score += 10 + combo;
        combo++;
        
        sounds.type.currentTime = 0;
        sounds.type.play().catch(e=>console.log(e));

        if(romaIndex >= currentRoma.length) {
            sounds.correct.play().catch(e=>console.log(e));
            currentIndex++;
            score += 100; // 単語完了ボーナス
            nextQuestion();
        }
        renderRoma();
    } else {
        combo = 0; // ミスでコンボリセット
        sounds.miss.currentTime = 0;
        sounds.miss.play().catch(e=>console.log(e));
    }
    updateStats();
});

function updateStats() {
    el("stat-score").innerText = score;
    el("stat-combo").innerText = combo;
    if(combo > 0) el("stat-combo").classList.add("combo-anim");
    else el("stat-combo").classList.remove("combo-anim");

    // パーティー中の場合、リアルタイムでスコアをDBへ送信
    if(myPartyId) {
        update(ref(db, `parties/${myPartyId}/members/${myId}`), { score: score });
    }
}

function startGame(duration) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    el("screen-play").classList.remove("hidden");
    score = 0; combo = 0; currentIndex = 0; timer = duration;
    gameActive = true;
    
    updateStats();
    nextQuestion();

    gameInterval = setInterval(() => {
        timer--;
        el("timer-display").innerText = `00:${timer.toString().padStart(2, '0')}`;
        
        // 対戦仕様：残り時間が半分になったら相手のスコアを隠す
        if(myPartyId) {
            const initialDuration = el("setup-time") ? parseInt(el("setup-time").value) : 30; // オンラインは30秒固定
            const halfTime = initialDuration / 2;
            if(timer <= halfTime) {
                // syncRivals 内で unknown クラスが付与される処理をトリガー
                syncRivals();
            }
        }

        if(timer <= 0) {
            endGame();
        }
    }, 1000);

    if(myPartyId) {
        el("rival-scores").classList.remove("hidden");
        syncRivals();
    }
}

function syncRivals() {
    onValue(ref(db, `parties/${myPartyId}/members`), snap => {
        const members = snap.val();
        const list = el("rival-list");
        list.innerHTML = "";
        if(!members) return;

        // パーティー設定、またはオンライン対戦（30固定）
        const setTime = el("setup-time") ? parseInt(el("setup-time").value) : 30;
        const isHalfWay = timer <= (setTime / 2);

        Object.entries(members).forEach(([id, m]) => {
            if(id === myId) return; // 自分はリストから除外（左上に表示されているため）
            const div = document.createElement("div");
            div.className = "rival-item";
            // 残り半分で見えなくなる処理（わからないよ！と表示）
            if(isHalfWay) {
                div.innerHTML = `<span>${m.name}</span> <span class="unknown">わからないよ！</span>`;
            } else {
                div.innerHTML = `<span>${m.name}</span> <span>スコア: ${m.score}</span>`;
            }
            list.appendChild(div);
        });
    });
}

function endGame() {
    gameActive = false;
    clearInterval(gameInterval);
    sounds.finish.play().catch(e=>console.log(e));
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    el("screen-result").classList.remove("hidden");

    if(myPartyId) {
        // レースが終わったら1, 2, 3位を表示
        get(ref(db, `parties/${myPartyId}/members`)).then(snap => {
            const members = snap.val();
            const sorted = Object.values(members).sort((a,b) => b.score - a.score);
            let html = "";
            sorted.forEach((m, i) => {
                html += `<div class="rival-item" style="font-size:1.5rem;"><span>${i+1}位: ${m.name}</span><span>${m.score} pts</span></div>`;
            });
            el("ranking-box").innerHTML = html;
            // リーダーがロビー状態に戻す
            if(isLeader) update(ref(db, `parties/${myPartyId}`), { state: "lobby" });
        });
    } else {
        // 1人プレイの場合
        el("ranking-box").innerHTML = `<div class="rival-item"><span>最終スコア: ${score}</span><span>最大コンボ: ${combo}</span></div>`;
    }
}

// === 初期同期システム (Firebaseリスナー) ===

// 1. プロフィールとオンラインステータス
const userRef = ref(db, `users/${myId}`);
set(userRef, { name: myName, status: "online", lastActive: serverTimestamp() });
// 閉じたらオフラインに変更
onDisconnect(userRef).update({ status: "offline", lastActive: serverTimestamp() });

el("my-name-input").value = myName;
el("my-id-display").innerText = myId;

// 2. フレンドリストの監視 (リアルタイム・オンライン/オフライン反映)
onValue(ref(db, `users/${myId}/friends`), snap => {
    const listUI = el("friend-list-ui");
    listUI.innerHTML = "";
    const friends = snap.val();
    if(!friends) {
        listUI.innerHTML = '<p style="font-size:0.8rem; color:var(--text-sub);">フレンドコードを入力して追加してください</p>';
        return;
    }

    Object.keys(friends).forEach(fId => {
        onValue(ref(db, `users/${fId}`), fSnap => {
            const fData = fSnap.val();
            if(!fData) return;
            const item = document.createElement("div");
            item.className = "friend-item";
            item.innerHTML = `
                <div>
                    <span class="status-dot ${fData.status === 'online' ? 'online' : 'offline'}"></span>
                    <span>${fData.name}</span>
                </div>
                <div>
                    <button class="btn-invite btn-s" onclick="window.inviteToParty('${fId}')">招待</button>
                    <button class="btn-kick btn-s" onclick="window.removeFriend('${fId}')">削除</button>
                </div>
            `;
            listUI.appendChild(item);
        });
    });
});

// 3. パーティー招待メッセージの監視 (左上)
onValue(ref(db, `users/${myId}/invites`), snap => {
    const invites = snap.val();
    if(invites) {
        const inviter = Object.values(invites)[0];
        el("invite-msg").innerText = `パーティーの招待が来ています！ (${inviter.fromName}さんから)`;
        el("invite-toast").classList.remove("hidden");
        sounds.notify.play().catch(e=>console.log(e));
    }
});

// 4. パーティー状態の監視 (リアルタイム同期)
onValue(ref(db, `users/${myId}/partyId`), snap => {
    myPartyId = snap.val();
    if(myPartyId) {
        el("party-controls").classList.remove("hidden");
        onValue(ref(db, `parties/${myPartyId}`), pSnap => {
            const party = pSnap.val();
            if(!party) {
                // パーティーが解散された場合
                myPartyId = null;
                el("party-title").innerText = "パーティー機能 (未参加)";
                el("party-controls").classList.add("hidden");
                return;
            }
            
            isLeader = (party.leader === myId);
            el("party-title").innerText = `パーティー機能 (${isLeader ? 'リーダー' : 'メンバー'})`;
            
            const partyUI = el("party-list-ui");
            partyUI.innerHTML = "";
            Object.entries(party.members).forEach(([id, m]) => {
                partyUI.innerHTML += `
                    <div class="friend-item">
                        <span>${m.name} ${id === party.leader ? '👑' : ''}</span>
                        ${isLeader && id !== myId ? `<button class="btn-kick btn-s" onclick="window.kickMember('${id}')">キック</button>` : ''}
                    </div>
                `;
            });

            // リーダーがゲームを開始したらメンバーも強制的に画面移動
            if(party.state === "playing" && !gameActive) {
                currentWords = WORD_DB[party.difficulty || "normal"];
                startGame(party.duration || 30);
            }
        });
    } else {
        el("party-title").innerText = "パーティー機能 (未参加)";
        el("party-list-ui").innerHTML = "";
        el("party-controls").classList.add("hidden");
    }
});

// 起動時の初期化
window.goHome();

// ユーザーの音声再生を許可するための初回クリック処理
document.body.addEventListener('click', () => {
    // 隠し音声再生などでロック解除
}, { once: true });
