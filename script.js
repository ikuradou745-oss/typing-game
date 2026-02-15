// Firebaseの初期化（windowオブジェクト経由で取得）
const { initializeApp, getDatabase, ref, set, get, update, onValue, onDisconnect, remove } = window.firebaseDeps;

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

// --- データの初期化 (Safariのプライベートモード対策) ---
let myCode = "";
let myName = "";

try {
    myCode = localStorage.getItem("typing_friend_code");
    myName = localStorage.getItem("typing_user_name");
} catch (e) {
    console.warn("LocalStorage access denied:", e);
}

// コードがない場合は新規生成 (8桁数字)
if (!myCode) {
    myCode = Math.floor(10000000 + Math.random() * 90000000).toString();
    try { localStorage.setItem("typing_friend_code", myCode); } catch(e){}
}

// 名前がない場合は新規生成 (園名：数字12桁)
if (!myName) {
    const randomSuffix = Math.floor(Math.random() * 900000000000 + 100000000000).toString();
    myName = "園名：" + randomSuffix;
    try { localStorage.setItem("typing_user_name", myName); } catch(e){}
}

// 初期UI反映
document.getElementById("my-friend-code").innerText = myCode;
document.getElementById("display-name").innerText = myName;

// --- オンライン状態管理 ---
const myStatusRef = ref(db, `users/${myCode}`);
const connectedRef = ref(db, ".info/connected");

onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
        // オンライン設定
        update(myStatusRef, {
            name: myName,
            status: "online",
            lastSeen: Date.now()
        });
        // ブラウザを閉じた時のオフライン設定
        onDisconnect(myStatusRef).update({
            status: "offline",
            lastSeen: Date.now()
        });
    }
});

// --- 名前変更 ---
document.getElementById("update-name-btn").onclick = () => {
    const input = document.getElementById("name-input");
    const newName = input.value.trim();
    if (newName) {
        myName = newName;
        try { localStorage.setItem("typing_user_name", myName); } catch(e){}
        document.getElementById("display-name").innerText = myName;
        update(myStatusRef, { name: myName });
        input.value = "";
    }
};

// --- フレンド申請（即承認システム） ---
document.getElementById("send-request-btn").onclick = async () => {
    const targetCode = document.getElementById("target-code-input").value.trim();
    
    if (targetCode.length !== 8 || isNaN(targetCode)) {
        alert("8桁の数字を入力してください。");
        return;
    }
    if (targetCode === myCode) {
        alert("自分のコードです。");
        return;
    }

    const targetUserRef = ref(db, `users/${targetCode}`);
    const snapshot = await get(targetUserRef);

    if (snapshot.exists()) {
        // 相互にフレンド登録
        const updates = {};
        updates[`friends/${myCode}/${targetCode}`] = true;
        updates[`friends/${targetCode}/${myCode}`] = true;
        
        await update(ref(db), updates);
        alert(`${snapshot.val().name} さんとフレンドになりました！`);
        document.getElementById("target-code-input").value = "";
    } else {
        alert("相手が見つかりません。");
    }
};

// --- フレンドリストの監視 ---
const friendsRef = ref(db, `friends/${myCode}`);
onValue(friendsRef, (snapshot) => {
    const listUI = document.getElementById("friend-list");
    listUI.innerHTML = "";
    let count = 0;

    snapshot.forEach((child) => {
        count++;
        const friendId = child.key;
        renderFriendItem(friendId);
    });
    document.getElementById("friend-count").innerText = count;
});

function renderFriendItem(friendId) {
    const friendInfoRef = ref(db, `users/${friendId}`);
    onValue(friendInfoRef, (snap) => {
        const data = snap.val();
        if (!data) return;

        let item = document.getElementById(`friend-item-${friendId}`);
        if (!item) {
            item = document.createElement("li");
            item.id = `friend-item-${friendId}`;
            item.className = "friend-item";
            document.getElementById("friend-list").appendChild(item);
        }

        const isOnline = data.status === "online";
        const statusClass = isOnline ? "online-dot" : "offline-dot";
        const statusText = isOnline ? "オンライン" : "オフライン";

        item.innerHTML = `
            <div class="friend-top">
                <span class="friend-name">${data.name}</span>
                <button class="delete-btn" onclick="deleteFriend('${friendId}')">削除</button>
            </div>
            <div class="status-indicator">
                <span class="dot ${statusClass}"></span>
                <span>${statusText}</span>
            </div>
            <div style="font-size:0.65rem; color:#64748b; margin-top:4px;">ID: ${friendId}</div>
        `;
    });
}

// --- 削除機能 ---
window.deleteFriend = async (targetId) => {
    if (confirm("フレンドを削除しますか？")) {
        const updates = {};
        updates[`friends/${myCode}/${targetId}`] = null;
        updates[`friends/${targetId}/${myCode}`] = null;
        await update(ref(db), updates);
    }
};
