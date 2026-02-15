// --- INITIAL DATA & ECONOMY ---
let balance = parseFloat(localStorage.getItem("casinoBalance")) || 20000;
let debt = parseFloat(localStorage.getItem("casinoDebt")) || 0;
let lastVisit = localStorage.getItem("lastVisitDate");
let today = new Date().toDateString();

if (lastVisit !== today) {
    const interest = balance > 0 ? balance * 0.10 : 0;
    const debtInt = debt * 0.15;
    debt += debtInt;
    balance += (interest + 1500);
    localStorage.setItem("lastVisitDate", today);
    alert(`The Bank of Wes has Rewarded you!\nGift: +$1,500\nSavings Interest: +$${Math.floor(interest)}\nDebt Interest: -$${Math.floor(debtInt)}`);
    saveState();
}

function saveState() {
    localStorage.setItem("casinoBalance", balance);
    localStorage.setItem("casinoDebt", debt);
    document.getElementById("balance-display").innerText = "Balance: $" + Math.floor(balance).toLocaleString();
    document.getElementById("debt-display").innerText = "Debt: $" + Math.floor(debt).toLocaleString();
    document.getElementById("balance-display").style.color = balance < 0 ? "#ff4d4d" : "#00ff00";
}

function checkCollector() {
    if (debt >= 50000 && Math.random() < 0.10) {
        const take = Math.floor(balance * 0.5);
        if (take > 0) {
            balance -= take;
            debt -= take;
            alert(`⚠️ DEBT COLLECTOR! ⚠️\nWes's goons took 50% ($${take.toLocaleString()}) of your balance.`);
            saveState();
        }
    }
}

// --- BANKING ---
document.getElementById("takeLoanBtn").addEventListener("click", () => {
    if (debt >= 100000) return alert("Wes: You're too high-risk!");
    balance += 5000; debt += 5000; saveState();
});
document.getElementById("payLoanBtn").addEventListener("click", () => {
    if (debt <= 0) return alert("No debt!");
    if (balance < 5000) return alert("Need $5k!");
    balance -= 5000; debt -= 5000; saveState();
});

// --- SLOTS ---
const symbols = ["🍒", "🍋", "🔔", "💎", "7️⃣"];
document.getElementById("spinSlotsBtn").addEventListener("click", function() {
    const bet = parseFloat(document.getElementById("slotBet").value) || 0;
    if (bet <= 0 || bet > balance) return alert("Invalid bet!");
    balance -= bet; saveState(); this.disabled = true;
    const sEls = [document.getElementById("s1"), document.getElementById("s2"), document.getElementById("s3")];
    sEls.forEach(el => el.classList.add("spinning"));

    setTimeout(() => {
        sEls.forEach(el => el.classList.remove("spinning"));
        const res = [symbols[Math.floor(Math.random()*5)], symbols[Math.floor(Math.random()*5)], symbols[Math.floor(Math.random()*5)]];
        sEls.forEach((el, i) => el.innerText = res[i]);
        let win = 0;
        if (res[0] === res[1] && res[1] === res[2]) win = res[0] === "7️⃣" ? bet * 50 : bet * 15;
        else if (res[0] === res[1] || res[1] === res[2] || res[0] === res[2]) win = bet * 2;
        balance += win; document.getElementById("slotOutput").innerText = win > 0 ? `WIN $${win}!` : "LOSE";
        this.disabled = false; saveState(); checkCollector();
    }, 1200);
});

// --- ROULETTE ---
document.getElementById("spinButton").addEventListener("click", function() {
    const nBet = parseFloat(document.getElementById("numberBet").value) || 0;
    const eoBet = parseFloat(document.getElementById("evenBet").value) || 0;
    const cBet = parseFloat(document.getElementById("colorBet").value) || 0;
    const total = nBet + eoBet + cBet;
    if (total <= 0 || total > balance) return alert("Invalid bet!");
    balance -= total; saveState(); this.disabled = true;
    const wheel = document.getElementById("roulette-wheel"); wheel.classList.add("wheel-spin");

    setTimeout(() => {
        wheel.classList.remove("wheel-spin");
        const res = Math.floor(Math.random() * 38);
        const reds = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
        let color = (res === 0 || res === 37) ? "Green" : (reds.includes(res) ? "Red" : "Black");
        wheel.innerText = res === 37 ? "00" : res;
        wheel.style.borderColor = color === "Red" ? "#ff4d4d" : (color === "Black" ? "#fff" : "#00ff00");
        let win = 0;
        if ((document.getElementById("numberInput").value === "00" && res === 37) || parseInt(document.getElementById("numberInput").value) === res) win += nBet * 36;
        if (res !== 0 && res !== 37) {
            let choice = document.getElementById("evenInput").value;
            if (((res % 2 === 0) && choice === "Even") || ((res % 2 !== 0) && choice === "Odd")) win += eoBet * 2;
            if (document.getElementById("colorInput").value === color) win += cBet * 2;
        }
        balance += win; document.getElementById("rouletteOutput").innerText = `Landed ${color} ${res === 37 ? '00' : res}!`;
        this.disabled = false; saveState(); checkCollector();
    }, 1500);
});

// --- BLACKJACK ---
let deck = [], pHand = [], dHand = [], bjBet = 0;
function createDeck() {
    const suits = ["♠", "♥", "♦", "♣"], vals = [{n:"A", v:11}, {n:"2", v:2}, {n:"3", v:3}, {n:"4", v:4}, {n:"5", v:5}, {n:"6", v:6}, {n:"7", v:7}, {n:"8", v:8}, {n:"9", v:9}, {n:"10", v:10}, {n:"J", v:10}, {n:"Q", v:10}, {n:"K", v:10}];
    deck = []; for (let s of suits) for (let v of vals) deck.push({ name: v.n + s, value: v.v });
    deck.sort(() => Math.random() - 0.5);
}
function getScore(hand) {
    let s = 0, a = 0; for (let c of hand) { s += c.value; if(c.name.includes("A")) a++; }
    while (s > 21 && a > 0) { s -= 10; a--; } return s;
}
document.getElementById("dealBtn").addEventListener("click", () => {
    bjBet = parseFloat(document.getElementById("bjBet").value) || 0;
    if (bjBet <= 0 || bjBet > balance) return alert("Invalid bet!");
    balance -= bjBet; createDeck();
    pHand = [deck.pop(), deck.pop()]; dHand = [deck.pop(), deck.pop()];
    updateBjUI(false); document.getElementById("dealBtn").disabled = true;
    document.getElementById("hitBtn").disabled = false; document.getElementById("stayBtn").disabled = false;
    document.getElementById("blackjackOutput").innerText = "Hit or Stay?"; saveState();
});
document.getElementById("hitBtn").addEventListener("click", () => {
    pHand.push(deck.pop()); updateBjUI(false);
    if (getScore(pHand) > 21) { document.getElementById("blackjackOutput").innerText = "Bust!"; endBj(0); }
});
document.getElementById("stayBtn").addEventListener("click", () => {
    while (getScore(dHand) < 17) dHand.push(deck.pop()); updateBjUI(true);
    let pS = getScore(pHand), dS = getScore(dHand);
    if (dS > 21 || pS > dS) endBj(bjBet * 2); else if (pS === dS) endBj(bjBet); else endBj(0);
});
function updateBjUI(show) {
    document.getElementById("player-hand").innerText = "Player: " + pHand.map(c=>c.name).join(", ") + " ("+getScore(pHand)+")";
    document.getElementById("dealer-hand").innerText = "Dealer: " + (show ? dHand.map(c=>c.name).join(", ") + " ("+getScore(dHand)+")" : dHand[0].name + ", [Hidden]");
}
function endBj(pay) {
    balance += pay; document.getElementById("blackjackOutput").innerText = pay > bjBet ? "Win!" : (pay === bjBet ? "Push" : "Loss");
    document.getElementById("dealBtn").disabled = false; document.getElementById("hitBtn").disabled = true; document.getElementById("stayBtn").disabled = true;
    saveState(); checkCollector();
}

// --- RED DOG ---
document.getElementById("rdDealBtn").addEventListener("click", function() {
    let bet = parseFloat(document.getElementById("rdBet").value) || 0;
    if (bet <= 0 || bet > balance) return alert("Invalid bet!");
    balance -= bet; saveState();
    
    const draw = () => Math.floor(Math.random() * 13) + 1;
    let c1 = draw(), c2 = draw(), c3 = draw();
    const names = {11:"J", 12:"Q", 13:"K", 1:"A"};
    const getName = (v) => names[v] || v;

    if (c1 > c2) [c1, c2] = [c2, c1];
    let spread = c2 - c1 - 1;
    let output = document.getElementById("rd-cards");
    
    if (spread === -1) { // Consecutive
        balance += bet;
        output.innerText = `${getName(c1)} & ${getName(c2)}: Consecutive! Push.`;
    } else if (spread === 0) { // Pair
        if (c3 === c1) { balance += bet * 12; output.innerText = `Triple ${getName(c3)}! WIN 11:1`; }
        else { balance += bet; output.innerText = `Pair ${getName(c1)}: Push.`; }
    } else {
        output.innerText = `${getName(c1)} & ${getName(c2)} ... Draw: ${getName(c3)}`;
        if (c3 > c1 && c3 < c2) {
            let mult = spread === 1 ? 5 : (spread === 2 ? 4 : (spread === 3 ? 2 : 1));
            balance += bet + (bet * mult);
            document.getElementById("rdOutput").innerText = `WIN! Paid ${mult}:1`;
        } else {
            document.getElementById("rdOutput").innerText = "LOST!";
        }
    }
    saveState(); checkCollector();
});

// --- KNOCKOUT 52 ---
document.getElementById("koStartBtn").addEventListener("click", async function() {
    let bet = parseFloat(document.getElementById("koBet").value) || 0;
    let range = parseInt(document.getElementById("koRange").value);
    if (bet <= 0 || bet > balance) return alert("Invalid bet!");

    balance -= bet; this.disabled = true; saveState();
    let ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
    let win = false;

    for (let i = 1500; i <= 52; i++) {
        let card = ranks[(i-1) % 13];
        document.getElementById("ko-card-display").innerText = card;
        await new Promise(r => setTimeout(r, 100));

        if (Math.random() < 0.076) { 
            document.getElementById("koOutput").innerText = `KO at card ${i}!`;
            if (i <= range && i > (range - 13)) {
                let mults = {13: 2, 26: 3, 39: 4, 52: 5};
                balance += bet * mults[range]; win = true;
            }
            break;
        }
        if (i === 52) document.getElementById("koOutput").innerText = "No Knockout!";
    }
    this.disabled = false; saveState(); checkCollector();
});

// --- CRASH ---
let crashInt, mult = 1.0, cBet = 0;
document.getElementById("crashBtn").addEventListener("click", function() {
    cBet = parseFloat(document.getElementById("crashBet").value) || 0;
    if (cBet <= 0 || cBet > balance) return alert("Invalid bet!");
    
    balance -= cBet; 
    saveState(); 
    this.disabled = true;
    document.getElementById("cashOutBtn").disabled = false;
    document.getElementById("crashOutput").innerText = "Fly for the moon!";
    
    mult = 1.0; 
    document.getElementById("crash-multiplier").style.color = "#00ff00";
    document.getElementById("crash-multiplier").innerText = "1.00x";

    // 1. Calculate the crash point
    let randomNum = Math.random();
    let crashAt = 0.98 / (1 - randomNum); 
    if (crashAt > 100) crashAt = 100;

    // 2. 3% House Edge - Force instant crash
    if (Math.random() < 0.03) crashAt = 1.00;

    // 3. SAFETY CHECK: If crash is 1.00, end game immediately before starting timer
    if (crashAt <= 1.0) {
        document.getElementById("crash-multiplier").style.color = "#ff4d4d";
        document.getElementById("crashOutput").innerText = "INSTANT CRASH!";
        document.getElementById("cashOutBtn").disabled = true;
        document.getElementById("crashBtn").disabled = false;
        saveState(); 
        checkCollector();
        return; // This exits the function so the setInterval never starts
    }

    // 4. Start the game loop
    crashInt = setInterval(() => {
        mult += 0.01+(mult*0.003);
        document.getElementById("crash-multiplier").innerText = mult.toFixed(2) + "x";
        
        // Visual flair: turn gold at 50x
        if (mult >= 50) {
            document.getElementById("crash-multiplier").style.color = "#d4af37";
        }

        if (mult >= crashAt) {
            clearInterval(crashInt);
            document.getElementById("crash-multiplier").style.color = "#ff4d4d";
            document.getElementById("crash-multiplier").innerText = crashAt.toFixed(2) + "x"; // Show exact crash point
            document.getElementById("crashOutput").innerText = "CRASHED!";
            document.getElementById("cashOutBtn").disabled = true;
            document.getElementById("crashBtn").disabled = false;
            saveState(); 
            checkCollector();
        }
    }, 80);
});

document.getElementById("cashOutBtn").addEventListener("click", function() {
    clearInterval(crashInt);
    let win = cBet * mult;
    balance += win;
    document.getElementById("crashOutput").innerText = `Out at ${mult.toFixed(2)}x! +$${Math.floor(win)}`;
    document.getElementById("crashBtn").disabled = false;
    this.disabled = true; saveState();
});

saveState();
