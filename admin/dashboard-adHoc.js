import { auth, db } from "./firebase-init.js";
import {
  collection, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const siteListEl   = document.getElementById("siteList");
const roundEl      = document.getElementById("roundSelect");
const tradeMainEl  = document.getElementById("tradeMainSelect");
const riskKeyEl    = document.getElementById("riskKeyword");
const improveKeyEl = document.getElementById("improveKeyword");
const resultBody   = document.getElementById("resultBody");

let currentSite = "";
let rawDocs = [];

/* ======================
   현장 목록 로드
====================== */
async function loadSites(){
  const snap = await getDocs(collection(db,"sites"));
  siteListEl.innerHTML = "";

  snap.forEach(doc=>{
    const d = doc.data();
    const div = document.createElement("div");
    div.className = "site-item";
    div.textContent = d.siteName;
    div.onclick = ()=>{
      document.querySelectorAll(".site-item")
        .forEach(el=>el.classList.remove("active"));
      div.classList.add("active");
      currentSite = d.siteId;
      loadAdHocData();
    };
    siteListEl.appendChild(div);
  });
}

/* ======================
   수시 데이터 로드
====================== */
async function loadAdHocData(){
  if(!currentSite) return;

  const q = query(
    collection(db,"riskAssessments","adHoc","items"),
    where("siteId","==",currentSite)
  );

  const snap = await getDocs(q);
  rawDocs = [];
  const rounds = new Set();
  const trades = new Set();

  snap.forEach(doc=>{
    const d = doc.data();
    rawDocs.push(d);
    if(d.round) rounds.add(d.round);
    if(d.tradeMain) trades.add(d.tradeMain);
  });

  // 회차
  roundEl.innerHTML = `<option value="">전체</option>`;
  [...rounds].sort().forEach(r=>{
    roundEl.innerHTML += `<option value="${r}">${r}회</option>`;
  });

  // 공종
  tradeMainEl.innerHTML = `<option value="">전체</option>`;
  [...trades].forEach(t=>{
    tradeMainEl.innerHTML += `<option>${t}</option>`;
  });

  render();
}

/* ======================
   렌더링
====================== */
function render(){
  const round = roundEl.value;
  const trade = tradeMainEl.value;
  const rk = riskKeyEl.value.trim();
  const ik = improveKeyEl.value.trim();

  const rows = rawDocs.filter(d=>{
    if(round && String(d.round) !== round) return false;
    if(trade && d.tradeMain !== trade) return false;
    if(rk && !d.riskContent?.includes(rk)) return false;
    if(ik && !d.improvement?.includes(ik)) return false;
    return true;
  });

  resultBody.innerHTML = "";
  rows.forEach(d=>{
    resultBody.innerHTML += `
      <tr>
        <td>${d.round || ""}</td>
        <td>${d.tradeMain || ""}</td>
        <td>${d.riskContent || ""}</td>
        <td>${d.improvement || ""}</td>
        <td>${d.remark || ""}</td>
      </tr>
    `;
  });
}

/* ======================
   이벤트
====================== */
document.getElementById("btnSearch").onclick = render;

/* ======================
   시작
====================== */
loadSites();
