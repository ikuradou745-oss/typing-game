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

// --- 初期設定 ---
let myCode = localStorage.getItem("user_friend_code") || Math.floor(10000000 + Math.random() * 90000000).toString();
localStorage.setItem("user_friend_code", myCode);
let myName = localStorage.getItem("user_display_name") || "園名：" + Math.floor(100000000000 + Math.random() * 900000000000).toString();
localStorage.setItem("user_display_name", myName);

document.getElementById("my-friend-code").innerText = myCode;
document.getElementById("display-name").innerText = myName;

let currentPartyId = null;

// --- オンライン・基本更新 ---
const myStatusRef = ref(db, `users/${myCode}`);
onValue(ref(db, ".info/connected"), (snap) => {
    if (snap.val() === true) {
        update(myStatusRef, { name: myName, status: "online", lastSeen: Date.now() });
        onDisconnect(myStatusRef).update({ status: "offline", lastSeen: Date.now() });
    }
});

// --- 名前更新 ---
document.getElementById("update-name-btn").onclick = () => {
    const input = document.getElementById("name-input");
    if (input.value.trim()) {
        myName = input.value.trim();
        localStorage.setItem("user_display_name", myName);
        document.getElementById("display-name").innerText = myName;
        update(myStatusRef, { name: myName });
        input.value = "";
    }
};

// --- フレンド申請 ---
document.getElementById("send-request-btn").onclick = async () => {
    const target = document.getElementById("target-code-input").value.trim();
    if (target.length === 8 && target !== myCode) {
        const snap = await get(ref(db, `users/${target}`));
        if (snap.exists()) {
            update(ref(db, `friends/${myCode}/${target}`), true);
            update(ref(db, `friends/${target}/${myCode}`), true);
            document.getElementById("target-code-input").value = "";
        }
    }
};

// --- フレンドリスト表示 ---
onValue(ref(db, `friends/${myCode}`), (snapshot) => {
    const listUI = document.getElementById("friend-list");
    listUI.innerHTML = "";
    let count = 0;
    snapshot.forEach((child) => {
        count++;
        const fid = child.key;
        onValue(ref(db, `users/${fid}`), (fSnap) => {
            const fData = fSnap.val();
            if (!fData) return;
            let li = document.getElementById(`li-${fid}`) || document.createElement("li");
            li.id = `li-${fid}`;
            li.className = "friend-item";
            li.innerHTML = `
                <div class="friend-info">
                    <strong>${fData.name}</strong> 
                    <span class="dot ${fData.status === 'online' ? 'online' : 'offline'}"></span>
                </div>
                <div class="friend-btns">
                    <button class="invite-btn" onclick="inviteToParty('${fid}', '${fData.name}')">パーティー招待</button>
                    <button class="small-del-btn" onclick="deleteFriend('${fid}')">削除</button>
                </div>
            `;
            listUI.appendChild(li);
        });
    });
    document.getElementById("friend-count-badge").innerText = count;
});

window.deleteFriend = (fid) => {
    remove(ref(db, `friends/${myCode}/${fid}`));
    remove(ref(db, `friends/${fid}/${myCode}`));
};

// --- パーティー招待・通知ロジック ---

// 招待を送る
window.inviteToParty = async (fid, fname) => {
    // パーティー未作成なら自分がリーダーで作成
    if (!currentPartyId) {
        currentPartyId = myCode; // 自分のIDをパーティーIDにする
        await set(ref(db, `parties/${currentPartyId}`), {
            leader: myCode,
            members: { [myCode]: myName }
        });
        update(myStatusRef, { partyId: currentPartyId });
    }
    // 相手に招待を送る
    set(ref(db, `invites/${fid}`), {
        fromId: myCode,
        fromName: myName,
        partyId: currentPartyId
    });
    alert(`${fname}さんに招待を送りました`);
};

// 招待の監視
onValue(ref(db, `invites/${myCode}`), (snap) => {
    const invite = snap.val();
    const notifyUI = document.getElementById("invite-notification");
    if (invite) {
        document.getElementById("inviter-name").innerText = invite.fromName;
        notifyUI.classList.remove("hidden");

        document.getElementById("accept-invite-btn").onclick = async () => {
            // パーティーに参加
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

// --- パーティーUIのリアルタイム更新 ---
onValue(myStatusRef, (snap) => {
    const data = snap.val();
    const partyInfoUI = document.getElementById("party-info");
    const noPartyUI = document.getElementById("no-party-msg");
    const memberListUI = document.getElementById("party-member-list");
    const controlsUI = document.getElementById("party-controls");

    if (data && data.partyId) {
        currentPartyId = data.partyId;
        noPartyUI.classList.add("hidden");
        partyInfoUI.classList.remove("hidden");

        onValue(ref(db, `parties/${currentPartyId}`), (pSnap) => {
            const pData = pSnap.val();
            if (!pData) {
                // パーティー解散時の処理
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
                    <span>${mid === pData.leader ? '<span class="leader-tag">L</span>' : ''}${mname}</span>
                    ${isLeader && mid !== myCode ? `<button class="danger-btn" style="padding:2px 5px; font-size:0.6rem" onclick="kickMember('${mid}')">キック</button>` : ''}
                `;
                memberListUI.appendChild(div);
            });

            controlsUI.innerHTML = isLeader 
                ? `<button class="danger-btn" style="width:100%" onclick="disbandParty()">パーティー解散</button>`
                : `<button class="danger-btn" style="width:100%" onclick="leaveParty()">パーティー脱退</button>`;
        });
    } else {
        partyInfoUI.classList.add("hidden");
        noPartyUI.classList.remove("hidden");
    }
});

// パーティー操作関数
window.disbandParty = () => {
    if (confirm("パーティーを解散しますか？")) {
        // 全メンバーのpartyIdを消す（今回は簡易的にパーティーデータ削除で対応）
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
