// --- GLOBAL ECONOMY & STATE ---
let balance = parseFloat(localStorage.getItem("casinoBalance")) || 2000;
let debt = parseFloat(localStorage.getItem("casinoDebt")) || 0;
let unlocked = JSON.parse(localStorage.getItem("unlockedGames")) || ["slots"];
let prestige = parseInt(localStorage.getItem("prestigeLevel")) || 0;
let multiplier = 1 + (prestige * 0.5); // 50% bonus per prestige

// Update Header on Load
document.addEventListener("DOMContentLoaded", () => {
    updateHUD();
    
    // Check if on Lobby
    if(document.getElementById("lobby-container")) initLobby();
    
    // Check if on a Game Page (and if unlocked)
    let page = document.body.getAttribute("data-game");
    if(page && !unlocked.includes(page)) {
        alert("This game is locked!");
        window.location.href = "index.html";
    }
});

function updateHUD() {
    let balEl = document.getElementById("balanceDisplay");
    let debtEl = document.getElementById("debtDisplay");
    if(balEl) balEl.innerText = "$" + Math.floor(balance).toLocaleString();
    if(debtEl) debtEl.innerText = "Debt: $" + Math.floor(debt).toLocaleString();
    
    // Prestige Display
    let prestEl = document.getElementById("prestigeDisplay");
    if(prestEl && prestige > 0) {
        prestEl.innerText = `⭐ Prestige ${prestige} (${multiplier}x)`;
        prestEl.style.display = "block";
    }
}

function saveState() {
    localStorage.setItem("casinoBalance", balance);
    localStorage.setItem("casinoDebt", debt);
    localStorage.setItem("unlockedGames", JSON.stringify(unlocked));
    updateHUD();
}

function addWin(amount) {
    let finalWin = amount * multiplier;
    balance += finalWin;
    saveState();
    return finalWin;
}

// --- LOBBY LOGIC ---
function initLobby() {
    // Game Costs
    const costs = { "roulette": 5000, "blackjack": 20000, "reddog": 50000, "knockout": 100000, "crash": 500000 };
    
    for (let [game, cost] of Object.entries(costs)) {
        if (!unlocked.includes(game)) {
            let card = document.getElementById(`card-${game}`);
            let link = card.querySelector("a");
            
            // Disable Link
            link.href = "#";
            card.classList.add("locked");
            
            // Create Unlock Overlay
            let overlay = document.createElement("div");
            overlay.className = "unlock-overlay";
            overlay.innerHTML = `<div style="font-size:2rem;">🔒</div><button class="unlock-btn" onclick="unlockGame('${game}', ${cost})">Unlock: $${cost.toLocaleString()}</button>`;
            card.appendChild(overlay);
        }
    }

    // Prestige Button
    if(balance >= 20000000) {
        document.getElementById("prestige-btn").style.display = "block";
    }
}

window.unlockGame = function(game, cost) {
    if(balance >= cost) {
        balance -= cost;
        unlocked.push(game);
        saveState();
        location.reload();
    } else {
        alert("Not enough cash!");
    }
};

window.doPrestige = function() {
    if(!confirm("Reset progress for +50% permanent multiplier?")) return;
    localStorage.setItem("prestigeLevel", prestige + 1);
    localStorage.setItem("casinoBalance", 2000);
    localStorage.setItem("casinoDebt", 0);
    localStorage.setItem("unlockedGames", JSON.stringify(["slots"]));
    location.reload();
};

// --- BANK LOGIC ---
if(document.getElementById("takeLoanBtn")) {
    document.getElementById("takeLoanBtn").onclick = () => { balance += 5000; debt += 5000; saveState(); };
    document.getElementById("payLoanBtn").onclick = () => { if(balance >= 5000 && debt > 0) { balance -= 5000; debt -= 5000; saveState(); }};
}

// --- GAME ENGINES ---

// 1. SLOTS
if(document.body.getAttribute("data-game") === "slots") {
    const s = ["🍒","🍋","7️⃣","💎","🔔"];
    document.getElementById("spinBtn").onclick = () => {
        let bet = parseFloat(document.getElementById("bet").value);
        if(!bet || bet>balance) return;
        balance -= bet; saveState();
        let els = [1,2,3].map(i=>document.getElementById("s"+i));
        els.forEach(e => e.innerText = "🌀");
        setTimeout(() => {
            let res = els.map(e => { let v = s[Math.floor(Math.random()*5)]; e.innerText = v; return v; });
            let win = 0;
            if(res[0]===res[1] && res[1]===res[2]) win = res[0]==="7️⃣" ? bet*50 : bet*15;
            else if(res[0]===res[1] || res[0]===res[2] || res[1]===res[2]) win = bet*2;
            let final = addWin(win);
            document.getElementById("out").innerText = win > 0 ? `WIN: $${Math.floor(final)}` : "LOST";
        }, 500);
    };
}

// 2. ROULETTE
if(document.body.getAttribute("data-game") === "roulette") {
    document.getElementById("spinBtn").onclick = () => {
        let bet = parseFloat(document.getElementById("bet").value);
        let pick = parseInt(document.getElementById("pick").value);
        if(!bet || bet>balance || isNaN(pick)) return;
        balance -= bet; saveState();
        let land = Math.floor(Math.random()*37);
        document.getElementById("wheel").innerText = land;
        if(land === pick) {
            let w = addWin(bet*36);
            document.getElementById("out").innerText = `JACKPOT! +$${Math.floor(w)}`;
        } else {
            document.getElementById("out").innerText = `Landed ${land}. Lost.`;
        }
    };
}

// 3. BLACKJACK
if(document.body.getAttribute("data-game") === "blackjack") {
    let deck=[], p=[], d=[], b=0;
    document.getElementById("dealBtn").onclick = () => {
        b = parseFloat(document.getElementById("bet").value);
        if(!b || b>balance) return;
        balance -= b; saveState();
        deck=[2,3,4,5,6,7,8,9,10,10,10,10,11].flatMap(v=>[v,v,v,v]).sort(()=>Math.random()-.5);
        p=[deck.pop(),deck.pop()]; d=[deck.pop(),deck.pop()];
        document.getElementById("pHand").innerText = p.reduce((x,y)=>x+y);
        document.getElementById("dHand").innerText = d[0] + ", ?";
        document.getElementById("controls").style.display = "block";
        document.getElementById("dealBtn").style.display = "none";
        document.getElementById("out").innerText = "Hit or Stay?";
    };
    document.getElementById("hitBtn").onclick = () => {
        p.push(deck.pop());
        let sum = p.reduce((x,y)=>x+y);
        document.getElementById("pHand").innerText = sum;
        if(sum > 21) endBJ(0, "Bust!");
    };
    document.getElementById("stayBtn").onclick = () => {
        while(d.reduce((x,y)=>x+y) < 17) d.push(deck.pop());
        let pS = p.reduce((x,y)=>x+y), dS = d.reduce((x,y)=>x+y);
        if(dS > 21 || pS > dS) endBJ(b*2, "You Win!");
        else if(pS === dS) endBJ(b, "Push");
        else endBJ(0, "Dealer Wins");
    };
    function endBJ(w, m) {
        if(w>0) addWin(w); // Refund logic handled in addWin 
        document.getElementById("out").innerText = m;
        document.getElementById("controls").style.display = "none";
        document.getElementById("dealBtn").style.display = "inline";
    }
}

// 4. RED DOG
if(document.body.getAttribute("data-game") === "reddog") {
    let c1, c2, bet=0;
    document.getElementById("dealBtn").onclick = () => {
        bet = parseFloat(document.getElementById("bet").value);
        if(!bet || bet>balance) return;
        balance -= bet; saveState();
        document.querySelectorAll(".card-inner").forEach(c=>c.classList.remove("flipped"));
        c1=Math.floor(Math.random()*13)+1; c2=Math.floor(Math.random()*13)+1;
        if(c1>c2) [c1,c2]=[c2,c1];
        document.getElementById("v1").innerText = c1===1?"A":c1; document.getElementById("v2").innerText = c2===1?"A":c2;
        setTimeout(()=>{
            document.getElementById("c1").classList.add("flipped");
            document.getElementById("c2").classList.add("flipped");
            let spr = c2-c1-1;
            if(spr===-1) { addWin(bet); document.getElementById("out").innerText="Push"; }
            else {
                document.getElementById("actions").style.display="block";
                document.getElementById("dealBtn").style.display="none";
                document.getElementById("out").innerText = `Spread: ${spr}`;
            }
        },300);
    };
    document.getElementById("raiseBtn").onclick = () => { if(balance>=bet){balance-=bet; bet*=2; saveState(); finRD();} };
    document.getElementById("callBtn").onclick = () => finRD();
    function finRD() {
        document.getElementById("actions").style.display="none"; document.getElementById("dealBtn").style.display="inline";
        let c3 = Math.floor(Math.random()*13)+1;
        document.getElementById("v3").innerText = c3===1?"A":c3;
        document.getElementById("c3").classList.add("flipped");
        let spr=c2-c1-1, w=0;
        if(c3>c1 && c3<c2) w = bet * (spr==1?5 : spr==2?4 : spr==3?2 : 1) + bet;
        else if(spr==0 && c3==c1) w = bet*12;
        setTimeout(()=>{ if(w>0) addWin(w); document.getElementById("out").innerText=w>0?`WIN $${w}`:"LOSS"; }, 500);
    }
}

// --- 5. KNOCKOUT 52 (MULTI-TIER FIXED) ---
if (document.body.getAttribute("data-game") === "knockout") {
    const startBtn = document.getElementById("startBtn");
    
    if (startBtn) {
        startBtn.onclick = async function() {
            // 1. Grab all bets
            const t1 = parseFloat(document.getElementById("bet-1").value) || 0;
            const t2 = parseFloat(document.getElementById("bet-2").value) || 0;
            const t3 = parseFloat(document.getElementById("bet-3").value) || 0;
            const t4 = parseFloat(document.getElementById("bet-4").value) || 0;
            
            const tierBets = [t1, t2, t3, t4];
            const tierMults = [2.5, 4.0, 6.5, 12.0];
            const totalBet = t1 + t2 + t3 + t4;

            // 2. Validation
            if (totalBet <= 0) return alert("Place at least one bet!");
            if (totalBet > balance) return alert("Not enough cash!");

            // 3. Setup Game State
            balance -= totalBet;
            startBtn.disabled = true;
            document.querySelectorAll(".tier-bet").forEach(input => input.disabled = true);
            document.getElementById("out").style.color = "#00ff00";
            document.getElementById("out").innerText = "Dealing...";
            saveState();

            const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
            let isKO = false;

            // 4. The Loop
            for (let i = 1; i <= 52; i++) {
                let currentTier = Math.ceil(i / 13); // 1, 2, 3, or 4
                let rankIndex = (i - 1) % 13;
                let cardRank = ranks[rankIndex];

                // Update Visuals
                document.getElementById("cardDisplay").innerText = cardRank;
                document.getElementById("cardCount").innerText = i;
                
                // Highlight active tier
                document.querySelectorAll(".ko-tier-box").forEach(box => box.classList.remove("active-tier"));
                const activeBox = document.getElementById(`tier-${currentTier}`);
                if(activeBox) activeBox.classList.add("active-tier");

                await new Promise(r => setTimeout(r, 120));

                // 5. Check for Knockout (Match)
                // We use a random chance that mimics the 1/13 probability of a rank match
                if (Math.random() < 0.0769) { 
                    isKO = true;
                    let winningBet = tierBets[currentTier - 1];
                    
                    if (winningBet > 0) {
                        let prize = winningBet * tierMults[currentTier - 1];
                        let finalPrize = addWin(prize);
                        document.getElementById("out").innerText = `KO! Tier ${currentTier} pays $${Math.floor(finalPrize).toLocaleString()}`;
                    } else {
                        document.getElementById("out").style.color = "#ff4d4d";
                        document.getElementById("out").innerText = `KO in Tier ${currentTier} (No Bet placed)`;
                    }
                    break;
                }

                if (i === 52) {
                    document.getElementById("out").style.color = "#888";
                    document.getElementById("out").innerText = "Deck cleared. No Knockout.";
                }
            }

            // 6. Cleanup
            startBtn.disabled = false;
            document.querySelectorAll(".tier-bet").forEach(input => input.disabled = false);
            document.querySelectorAll(".ko-tier-box").forEach(box => box.classList.remove("active-tier"));
            saveState();
        };
    }
}

// 6. CRASH
if(document.body.getAttribute("data-game") === "crash") {
    let int, m=1, bet=0;
    document.getElementById("betBtn").onclick = () => {
        bet = parseFloat(document.getElementById("bet").value);
        if(!bet || bet>balance) return;
        balance -= bet; saveState();
        document.getElementById("betBtn").disabled=true; document.getElementById("cashBtn").disabled=false;
        m=1; document.getElementById("mult").style.color="#0f0";
        let crash = 0.99/(1-Math.random()); if(Math.random()<0.03) crash=1.0;
        if(crash<=1.0) { endCrash(true); return; }
        int = setInterval(() => {
            m += 0.02 + (m * (document.getElementById("spd").value/100));
            document.getElementById("mult").innerText = m.toFixed(2)+"x";
            let auto = parseFloat(document.getElementById("auto").value);
            if(auto && m>=auto) cashOut();
            if(m>=crash) endCrash(true);
        }, 60);
    };
    document.getElementById("cashBtn").onclick = cashOut;
    function cashOut() { if(int) { clearInterval(int); int=null; addWin(bet*m); endCrash(false); } }
    function endCrash(dead) {
        if(int) clearInterval(int);
        document.getElementById("mult").style.color = dead?"#f00":"#d4af37";
        document.getElementById("out").innerText = dead?"CRASHED":"CASHED OUT";
        document.getElementById("betBtn").disabled=false; document.getElementById("cashBtn").disabled=true;
    }
}
