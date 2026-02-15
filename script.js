import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child, onValue, onDisconnect, remove, update } from "firebase/database";

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

// --- 変数管理 ---
let myFriendCode = localStorage.getItem("myFriendCode");
let myName = localStorage.getItem("myName");

// --- ページ読み込み時の処理 ---
window.onload = async () => {
    // 1. フレンドコード(数字8桁)生成
    if (!myFriendCode) {
        myFriendCode = Math.floor(10000000 + Math.random() * 90000000).toString();
        localStorage.setItem("myFriendCode", myFriendCode);
    }
    
    // 2. 名前初期値(12桁数字)
    if (!myName) {
        const randomNum = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
        myName = "園名：" + randomNum;
        localStorage.setItem("myName", myName);
    }

    document.getElementById("friend-code").innerText = myFriendCode;
    document.getElementById("display-name").innerText = myName;

    // 3. オンライン状態の管理
    setupPresence();

    // 4. フレンドリストのリアルタイム監視
    listenToFriends();
};

// オンライン状態システムのセットアップ
function setupPresence() {
    const myStatusRef = ref(db, 'users/' + myFriendCode);
    const connectedRef = ref(db, '.info/connected');

    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            // 接続されたらオンラインに
            update(myStatusRef, {
                username: myName,
                status: "online",
                lastChanged: Date.now()
            });

            // 切断時の処理を予約
            onDisconnect(myStatusRef).update({
                status: "offline",
                lastChanged: Date.now()
            });

            // UI更新
            document.getElementById("my-status-indicator").className = "status-dot status-online";
            document.getElementById("my-status-text").innerText = "オンライン";
        }
    });
}

// 名前の更新
document.getElementById("update-name-btn").addEventListener("click", () => {
    const newName = document.getElementById("name-input").value.trim();
    if (newName === "") return;

    myName = newName;
    localStorage.setItem("myName", myName);
    document.getElementById("display-name").innerText = myName;
    
    update(ref(db, 'users/' + myFriendCode), { username: myName });
    document.getElementById("name-input").value = "";
    alert("名前を変更しました。");
});

// フレンド申請（即承認システム）
document.getElementById("add-friend-btn").addEventListener("click", async () => {
    const targetCode = document.getElementById("friend-input").value.trim();
    
    if (targetCode.length !== 8 || isNaN(targetCode)) {
        alert("8桁の数字を入力してください");
        return;
    }
    if (targetCode === myFriendCode) {
        alert("自分自身は追加できません");
        return;
    }

    // 相手が存在するかチェック
    const targetRef = ref(db, 'users/' + targetCode);
    const snapshot = await get(targetRef);

    if (snapshot.exists()) {
        // 相互にフレンド登録を行う
        const updates = {};
        updates[`friends/${myFriendCode}/${targetCode}`] = true;
        updates[`friends/${targetCode}/${myFriendCode}`] = true;
        
        update(ref(db), updates);
        alert(`${snapshot.val().username} とフレンドになりました！`);
        document.getElementById("friend-input").value = "";
    } else {
        alert("そのコードのユーザーは存在しません");
    }
});

// フレンドリストの監視と表示
function listenToFriends() {
    const myFriendsRef = ref(db, `friends/${myFriendCode}`);
    
    onValue(myFriendsRef, (snapshot) => {
        const listElement = document.getElementById("friend-list");
        listElement.innerHTML = "";
        let count = 0;

        snapshot.forEach((childSnapshot) => {
            count++;
            const friendId = childSnapshot.key;
            const friendDataRef = ref(db, `users/${friendId}`);

            // フレンドの情報を取得
            onValue(friendDataRef, (uSnap) => {
                if (uSnap.exists()) {
                    const data = uSnap.val();
                    updateFriendUI(friendId, data);
                }
            });
        });
        document.getElementById("friend-count").innerText = count;
    });
}

// フレンドUIの作成/更新
function updateFriendUI(id, data) {
    let li = document.getElementById(`friend-${id}`);
    if (!li) {
        li = document.createElement("li");
        li.id = `friend-${id}`;
        li.className = "friend-item";
        document.getElementById("friend-list").appendChild(li);
    }

    const statusClass = data.status === "online" ? "status-online" : "status-offline";
    const statusText = data.status === "online" ? "オンライン" : "オフライン";

    li.innerHTML = `
        <div class="friend-item-header">
            <strong>${data.username}</strong>
            <button class="remove-btn" onclick="removeFriend('${id}')">削除</button>
        </div>
        <div>
            <span class="status-dot ${statusClass}"></span>
            <small>${statusText}</small>
        </div>
        <div style="font-size:0.6rem; color:#666; margin-top:5px;">ID: ${id}</div>
    `;
}

// フレンド削除
window.removeFriend = (targetId) => {
    if (confirm("本当にフレンドを削除しますか？")) {
        const updates = {};
        updates[`friends/${myFriendCode}/${targetId}`] = null;
        updates[`friends/${targetId}/${myFriendCode}`] = null;
        update(ref(db), updates);
    }
};
