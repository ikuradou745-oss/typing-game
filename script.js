import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, set, get, child, onValue } from "firebase/database";

// Firebaseの設定
const firebaseConfig = {
    apiKey: "AIzaSyBXnNXQ5khcR0EvRide4C0PjshJZpSF4oM",
    authDomain: "typing-game-28ed0.firebaseapp.com",
    projectId: "typing-game-28ed0",
    storageBucket: "typing-game-28ed0.firebasestorage.app",
    messagingSenderId: "963797267101",
    appId: "1:963797267101:web:0d5d700458fb1991021a74",
    measurementId: "G-CL4B6ZK0SC"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// --- ローカル変数の管理 ---
let myFriendCode = localStorage.getItem("myFriendCode");
let myName = localStorage.getItem("myName");

// --- 初期化処理 ---
window.onload = async () => {
    // 1. フレンドコードがなければ生成 (12桁)
    if (!myFriendCode) {
        myFriendCode = generateRandomId(12);
        localStorage.setItem("myFriendCode", myFriendCode);
    }
    
    // 2. 名前がなければ初期値設定
    if (!myName) {
        myName = "園名：" + generateRandomId(12, true); // 数字のみ
        localStorage.setItem("myName", myName);
    }

    // 画面表示更新
    document.getElementById("friend-code").innerText = myFriendCode;
    document.getElementById("display-name").innerText = myName;

    // 3. Firebase上の自分のデータを最新に保つ（または作成）
    updateUserInDatabase(myFriendCode, myName);

    // 4. フレンドリストの監視開始
    listenToFriends();
};

// --- 関数定義 ---

// ID生成関数
function generateRandomId(length, onlyNumbers = false) {
    let result = '';
    const characters = onlyNumbers 
        ? '0123456789' 
        : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// データベースのユーザー情報を更新
function updateUserInDatabase(code, name) {
    set(ref(db, 'users/' + code), {
        username: name,
        lastActive: Date.now()
    });
}

// 名前の変更処理
document.getElementById("update-name-btn").addEventListener("click", () => {
    const newName = document.getElementById("name-input").value.trim();
    if (newName === "") {
        alert("名前を入力してください");
        return;
    }

    myName = newName;
    localStorage.setItem("myName", myName);
    document.getElementById("display-name").innerText = myName;
    
    // Firebase更新
    updateUserInDatabase(myFriendCode, myName);
    document.getElementById("name-input").value = "";
    alert("名前を更新しました！");
});

// フレンド追加処理
document.getElementById("add-friend-btn").addEventListener("click", async () => {
    const targetCode = document.getElementById("friend-input").value.trim();
    
    if (targetCode === myFriendCode) {
        alert("自分をフレンドに追加することはできません");
        return;
    }

    // 相手がデータベースに存在するか確認
    const dbRef = ref(db);
    get(child(dbRef, `users/${targetCode}`)).then((snapshot) => {
        if (snapshot.exists()) {
            // 自分のフレンドリストに保存
            set(ref(db, `friends/${myFriendCode}/${targetCode}`), {
                addedAt: Date.now()
            });
            alert("フレンドを追加しました！");
            document.getElementById("friend-input").value = "";
        } else {
            alert("そのフレンドコードは見つかりませんでした");
        }
    }).catch((error) => {
        console.error(error);
    });
});

// フレンドリストのリアルタイム監視
function listenToFriends() {
    const friendsRef = ref(db, `friends/${myFriendCode}`);
    onValue(friendsRef, (snapshot) => {
        const listElement = document.getElementById("friend-list");
        listElement.innerHTML = ""; // 一旦クリア

        snapshot.forEach((childSnapshot) => {
            const friendId = childSnapshot.key;
            
            // 各フレンドの名前を取得
            get(ref(db, `users/${friendId}`)).then((uSnap) => {
                if (uSnap.exists()) {
                    const li = document.createElement("li");
                    li.className = "friend-item";
                    li.innerHTML = `<span>${uSnap.val().username}</span> <small>${friendId}</small>`;
                    listElement.appendChild(li);
                }
            });
        });
    });
}
