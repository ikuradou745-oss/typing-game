import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue, onDisconnect, remove } from "firebase/database";

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

// --- データのキーを完全に固定 ---
const STORAGE_KEY_ID = "TYPING_GAME_USER_ID_8DIGITS";
const STORAGE_KEY_NAME = "TYPING_GAME_USER_NAME_PERSISTENT";

let myCode = localStorage.getItem(STORAGE_KEY_ID);
let myName = localStorage.getItem(STORAGE_KEY_NAME);

// なければ新規作成
if (!myCode) {
    myCode = Math.floor(10000000 + Math.random() * 90000000).toString();
    localStorage.setItem(STORAGE_KEY_ID, myCode);
}
if (!myName) {
    const rand12 = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    myName = "園名：" + rand12;
    localStorage.setItem(STORAGE_KEY_NAME, myName);
}

// UI初期表示
document.getElementById("my-friend-code").innerText = myCode;
document.getElementById("display-name").innerText = myName;

let currentPartyId = null;

// --- 1. ユーザー登録とオンライン監視 ---
const myStatusRef = ref(db, `users/${myCode}`);
onValue(ref(db, ".info/connected"), (snap) => {
    if (snap.val() === true) {
        // ここで自分の情報を必ず登録する（これでフレンド追加バグを防ぐ）
        update(myStatusRef, {
            name: myName,
            status: "online",
            lastSeen: Date.now()
        });
        onDisconnect(myStatusRef).update({
            status: "offline",
            lastSeen: Date.now()
        });
    }
});

// 名前変更
document.getElementById("update-name-btn").onclick = () => {
    const input = document.getElementById("name-input");
    if (input.value.trim()) {
        myName = input.value.trim();
        localStorage.setItem(STORAGE_KEY_NAME, myName);
        document.getElementById("display-name").innerText = myName;
        update(myStatusRef, { name: myName });
        input.value = "";
    }
};

// --- 2. フレンド機能 (リアルタイム) ---
document.getElementById("send-request-btn").onclick = async () => {
    const target = document.getElementById("target-code-input").value.trim();
    if (target.length !== 8 || target === myCode) {
        alert("無効なコードです");
        return;
    }

    const snap = await get(ref(db, `users/${target}`));
    if (snap.exists()) {
        const updates = {};
        updates[`friends/${myCode}/${target}`] = true;
        updates[`friends/${target}/${myCode}`] = true;
        await update(ref(db), updates);
        alert(`${snap.val().name} さんをフレンドに追加しました！`);
        document.getElementById("target-code-input").value = "";
    } else {
        alert("ユーザーが見つかりませんでした。相手が一度もこのサイトを開いていない可能性があります。");
    }
};

// フレンドリスト監視
onValue(ref(db, `friends/${myCode}`), (snapshot) => {
    const listUI = document.getElementById("friend-list");
    listUI.innerHTML = "";
    let count = 0;
    
    snapshot.forEach((child) => {
        count++;
        const fid = child.key;
        // フレンドの情報を取得
        onValue(ref(db, `users/${fid}`), (fSnap) => {
            const fData = fSnap.val();
            if (!fData) return;
            
            let li = document.getElementById(`li-${fid}`);
            if (!li) {
                li = document.createElement("li");
                li.id = `li-${fid}`;
                li.className = "friend-item";
                listUI.appendChild(li);
            }
            
            li.innerHTML = `
                <div class="friend-info">
                    <strong>${fData.name}</strong>
                    <span><span class="dot ${fData.status === 'online' ? 'online' : 'offline'}"></span>${fData.status === 'online' ? 'オンライン' : 'オフライン'}</span>
                </div>
                <div class="friend-btns">
                    <button class="invite-btn" onclick="inviteToParty('${fid}', '${fData.name}')">パーティー招待</button>
                    <button class="del-btn" onclick="deleteFriend('${fid}')">削除</button>
                </div>
            `;
        });
    });
    document.getElementById("friend-count-badge").innerText = count;
});

window.deleteFriend = (fid) => {
    if (confirm("削除しますか？")) {
        remove(ref(db, `friends/${myCode}/${fid}`));
        remove(ref(db, `friends/${fid}/${myCode}`));
    }
};

// --- 3. パーティー招待ロジック ---
window.inviteToParty = async (fid, fname) => {
    if (!currentPartyId) {
        currentPartyId = myCode; 
        await set(ref(db, `parties/${currentPartyId}`), {
            leader: myCode,
            members: { [myCode]: myName }
        });
        update(myStatusRef, { partyId: currentPartyId });
    }
    set(ref(db, `invites/${fid}`), {
        fromId: myCode, fromName: myName, partyId: currentPartyId
    });
    alert(`${fname} さんに招待を送りました`);
};

// 招待通知の監視
onValue(ref(db, `invites/${myCode}`), (snap) => {
    const invite = snap.val();
    const notifyUI = document.getElementById("invite-notification");
    if (invite) {
        document.getElementById("inviter-name").innerText = invite.fromName;
        notifyUI.classList.remove("hidden");
        
        document.getElementById("accept-invite-btn").onclick = async () => {
            await update(ref(db, `parties/${invite.partyId}/members`), { [myCode]: myName });
            update(myStatusRef, { partyId: invite.partyId });
            remove(ref(db, `invites/${myCode}`));
            notifyUI.classList.add("hidden");
        };
        document.getElementById("decline-invite-btn").onclick = () => {
            remove(ref(db, `invites/${myCode}`));
            notifyUI.classList.add("hidden");
        };
    } else {
        notifyUI.classList.add("hidden");
    }
});

// パーティー状態の監視
onValue(myStatusRef, (snap) => {
    const pId = snap.val()?.partyId;
    const infoUI = document.getElementById("party-info");
    const msgUI = document.getElementById("no-party-msg");
    const memberListUI = document.getElementById("party-member-list");
    const controlsUI = document.getElementById("party-controls");

    if (pId) {
        currentPartyId = pId;
        msgUI.classList.add("hidden");
        infoUI.classList.remove("hidden");

        onValue(ref(db, `parties/${pId}`), (pSnap) => {
            const pData = pSnap.val();
            if (!pData) {
                update(myStatusRef, { partyId: null });
                currentPartyId = null;
                return;
            }
            memberListUI.innerHTML = "";
            const isLeader = pData.leader === myCode;
            Object.entries(pData.members).forEach(([mid, mname]) => {
                const div = document.createElement("div");
                div.className = "party-member";
                div.innerHTML = `
                    <span>${mid === pData.leader ? '<span class="leader-tag">LEADER</span>' : ''}${mname}</span>
                    ${isLeader && mid !== myCode ? `<button class="danger-btn" style="padding:4px 8px; font-size:0.7rem;" onclick="kickMember('${mid}')">KICK</button>` : ''}
                `;
                memberListUI.appendChild(div);
            });
            controlsUI.innerHTML = isLeader 
                ? `<button class="danger-btn" style="width:100%" onclick="disbandParty()">パーティー解散</button>`
                : `<button class="danger-btn" style="width:100%" onclick="leaveParty()">パーティーを抜ける</button>`;
        });
    } else {
        infoUI.classList.add("hidden");
        msgUI.classList.remove("hidden");
    }
});

window.disbandParty = () => {
    if (confirm("パーティーを解散しますか？")) {
        remove(ref(db, `parties/${currentPartyId}`));
    }
};

window.leaveParty = () => {
    remove(ref(db, `parties/${currentPartyId}/members/${myCode}`));
    update(myStatusRef, { partyId: null });
};

window.kickMember = (mid) => {
    remove(ref(db, `parties/${currentPartyId}/members/${mid}`));
    update(ref(db, `users/${mid}`), { partyId: null });
};
