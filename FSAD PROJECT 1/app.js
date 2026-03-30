// Shared Constants for Local Storage
const StorageKeyEvents = "eventify_events";
const StorageKeyBookings = "eventify_bookings";
const StorageKeyWaitlist = "eventify_waitlist";
const StorageKeyPromos = "eventify_promos";

// Seed initial data if localStorage is empty to show immediate WOW factor
function seedDemoData() {
    if (!localStorage.getItem(StorageKeyEvents)) {
        const demoEvents = [
            {
                id: 1711200000000,
                name: "Neon Symphony Night",
                category: "Music",
                date: "2026-05-15",
                time: "20:00",
                location: "Grand Arena, New York",
                price: 1500,
                quantity: 120,
                image: "concert_event_banner_v2_1774248947478.png"
            },
            {
                id: 1711200000001,
                name: "Tech Innovators Summit",
                category: "Tech",
                date: "2026-04-22",
                time: "09:00",
                location: "Silicon Valley Convention Center",
                price: 5000,
                quantity: 50,
                image: "tech_conference_banner_1774248808379.png"
            },
            {
                id: 1711200000002,
                name: "Local Art Workshop",
                category: "Art",
                date: "2026-06-10",
                time: "14:00",
                location: "Creative Studios, Downtown",
                price: 500,
                quantity: 15,
                image: "art_workshop_banner_1774248916812.png"
            }
        ];
        localStorage.setItem(StorageKeyEvents, JSON.stringify(demoEvents));
    }
}

// Run seeder
seedDemoData();

// App State
const StorageKeyUsers = "eventify_users";
let usersDB = JSON.parse(localStorage.getItem(StorageKeyUsers)) || [];
let currentUser = sessionStorage.getItem('eventify_current_user') || null;

let events = JSON.parse(localStorage.getItem(StorageKeyEvents)) || [];
let bookings = JSON.parse(localStorage.getItem(StorageKeyBookings)) || [];
let waitlist = JSON.parse(localStorage.getItem(StorageKeyWaitlist)) || [];
let promos = JSON.parse(localStorage.getItem(StorageKeyPromos)) || [];
let currentDiscount = 0;
let appliedPromoCode = "";

// Logic to ensure all events have a category and image (Migration)
let dataChanged = false;
events.forEach(e => {
    if (!e.category) {
        e.category = "General";
        dataChanged = true;
    }
    if (!e.image) {
        e.image = getDefaultImage(e.category);
        dataChanged = true;
    }
});
if (dataChanged) {
    localStorage.setItem(StorageKeyEvents, JSON.stringify(events));
}

function getDefaultImage(category) {
    const defaults = {
        'Music': 'concert_event_banner_v2_1774248947478.png',
        'Tech': 'tech_conference_banner_1774248808379.png',
        'Art': 'art_workshop_banner_1774248916812.png',
        'Food': 'food_festival_banner_1774249330539.png',
        'Games': 'gaming_event_banner_1774250196325.png'
    };
    
    if (defaults[category]) return defaults[category];
    
    // Dynamic fallback for custom categories
    return `https://loremflickr.com/800/450/${category.toLowerCase()},event?lock=${Math.floor(Math.random()*1000)}`;
}

// DOM Elements
const eventList = document.getElementById("eventList");
const bookingModal = document.getElementById("bookingModal");
const bookingForm = document.getElementById("bookingForm");
const ticketCountInput = document.getElementById("ticketCount");
const totalPriceSpan = document.getElementById("totalPrice");

let currentSelectedEvent = null;

// Search Logic
const searchInput = document.getElementById('searchInput');
if(searchInput) {
    searchInput.addEventListener('input', (e) => {
        renderEvents(e.target.value);
    });
}

let currentFilterCategory = "All";

function renderEvents(filterText = "") {
    eventList.innerHTML = "";

    const availableEvents = events.filter(e => 
        (e.name.toLowerCase().includes(filterText.toLowerCase()) || 
         e.location.toLowerCase().includes(filterText.toLowerCase())) &&
        (currentFilterCategory === "All" || e.category === currentFilterCategory)
    );

    if (availableEvents.length === 0) {
        eventList.innerHTML = `
            <div class="empty-state">
                <h3>No upcoming events right now</h3>
                <p>Check back later or visit the admin dashboard to create some.</p>
            </div>
        `;
        return;
    }

    availableEvents.forEach(event => {
        // Date formatting
        const dateObj = new Date(event.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        
        // Time formatting (24 to 12)
        let [hours, minutes] = event.time.split(":");
        hours = parseInt(hours);
        let ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedTime = `${hours}:${minutes} ${ampm}`;

        const card = document.createElement("div");
        card.className = "event-card";

        card.innerHTML = `
            <div class="event-image-container">
                <img src="${event.image || 'https://via.placeholder.com/400x225?text=Event'}" alt="${event.name}" class="event-image">
                <span class="category-tag">${event.category || 'General'}</span>
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.name}</h3>
                <div class="event-meta">
                    <span>📅 ${formattedDate} | 🕒 ${formattedTime}</span>
                    <span>📍 ${event.location}</span>
                </div>
                <div class="event-price-qty">
                    <span class="price">₹${event.price}</span>
                    <span class="qty">${event.quantity > 0 ? event.quantity + ' Tickets Left' : '<span style="color:var(--danger)">Sold Out</span>'}</span>
                </div>
                ${event.quantity > 0 
                    ? `<button class="primary-btn" onclick="openModal(${event.id})">Book Ticket</button>`
                    : `<button class="primary-btn" onclick="openWaitlistModal(${event.id})" style="background:var(--accent-2);border-color:var(--accent-2);">Join Waitlist</button>`
                }
            </div>
        `;

        eventList.appendChild(card);
    });
}

// Modal Logic
window.openModal = function(eventId) {
    if(!currentUser) {
        showToast("You must be logged in to book a ticket.", "error");
        openAuthModal();
        return;
    }

    currentSelectedEvent = events.find(e => e.id === eventId);
    if (!currentSelectedEvent) return;

    document.getElementById("modalEventName").innerText = currentSelectedEvent.name;
    
    // Formatting for modal details
    const dateObj = new Date(currentSelectedEvent.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById("modalEventDetails").innerText = `${formattedDate} • ${currentSelectedEvent.location} • ₹${currentSelectedEvent.price} per ticket`;
    
    document.getElementById("modalEventId").value = eventId;
    document.getElementById("userName").value = currentUser;
    ticketCountInput.value = 1;
    ticketCountInput.max = currentSelectedEvent.quantity;
    
    // Reset promo state
    currentDiscount = 0;
    appliedPromoCode = "";
    document.getElementById("promoInput").value = "";
    document.getElementById("promoStatus").innerText = "";
    document.getElementById("discountInfo").style.display = "none";
    
    updateTotalPrice();

    bookingModal.classList.add("active");
};

window.applyPromo = function() {
    const codeInput = document.getElementById("promoInput").value.trim().toUpperCase();
    const status = document.getElementById("promoStatus");
    
    if(!codeInput) {
        status.innerText = "";
        currentDiscount = 0;
        appliedPromoCode = "";
        updateTotalPrice();
        return;
    }

    const promo = promos.find(p => p.code === codeInput);
    if (!promo) {
        status.innerText = "❌ Invalid Code";
        status.style.color = "var(--danger)";
        currentDiscount = 0;
        appliedPromoCode = "";
    } else {
        // Check expiry (simple string comparison for "YYYY-MM-DD")
        const today = new Date().toISOString().split('T')[0];
        if (promo.expiry < today) {
            status.innerText = "❌ Code Expired";
            status.style.color = "var(--danger)";
            currentDiscount = 0;
            appliedPromoCode = "";
        } else {
            status.innerText = `✅ Applied (${promo.discount}% Off)`;
            status.style.color = "var(--accent-1)";
            currentDiscount = promo.discount;
            appliedPromoCode = codeInput;
        }
    }
    updateTotalPrice();
};

window.closeModal = function() {
    bookingModal.classList.remove("active");
    bookingForm.reset();
    currentSelectedEvent = null;
};

// Waitlist Modal Logic
window.openWaitlistModal = function(eventId) {
    if(!currentUser) {
        showToast("You must be logged in to join a waitlist.", "error");
        openAuthModal();
        return;
    }

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    document.getElementById("waitlistEventName").innerText = `Waitlist: ${event.name}`;
    document.getElementById("waitlistEventId").value = eventId;
    document.getElementById("waitlistUserName").value = currentUser;

    document.getElementById("waitlistModal").classList.add("active");
};

window.closeWaitlistModal = function() {
    document.getElementById("waitlistModal").classList.remove("active");
    document.getElementById("waitlistForm").reset();
};

document.getElementById("waitlistForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const eventId = parseInt(document.getElementById("waitlistEventId").value);
    const userName = document.getElementById("waitlistUserName").value;

    const event = events.find(ev => ev.id === eventId);
    
    // Check if already on waitlist
    const existing = waitlist.find(w => w.eventId === eventId && w.user === userName);
    if (existing) {
        showToast("You are already on the waitlist for this event!", "error");
        closeWaitlistModal();
        return;
    }

    const newWaitlistEntry = {
        id: Date.now(),
        eventId: eventId,
        eventName: event.name,
        user: userName,
        date: new Date().toLocaleDateString()
    };

    waitlist.push(newWaitlistEntry);
    localStorage.setItem(StorageKeyWaitlist, JSON.stringify(waitlist));

    showToast(`You've been added to the waitlist for ${event.name}!`, "success");
    closeWaitlistModal();
});

// Calculate total dynamically on input change
function updateTotalPrice() {
    if (!currentSelectedEvent) return;
    const count = parseInt(ticketCountInput.value) || 0;
    let total = count * currentSelectedEvent.price;
    
    const discountInfo = document.getElementById("discountInfo");
    if (currentDiscount > 0) {
        const discountAmount = (total * currentDiscount) / 100;
        total -= discountAmount;
        discountInfo.innerText = `Discount Applied: -₹${discountAmount.toLocaleString('en-IN')}`;
        discountInfo.style.display = "block";
    } else {
        discountInfo.style.display = "none";
    }

    totalPriceSpan.innerText = `₹${total.toLocaleString('en-IN')}`;
}

ticketCountInput.addEventListener("input", updateTotalPrice);

// Close modal when clicking outside of it
window.addEventListener("click", (e) => {
    if (e.target === bookingModal) {
        closeModal();
    }
});

// Handle Booking Submission
bookingForm.addEventListener("submit", function(e) {
    e.preventDefault();
    
    const userName = document.getElementById("userName").value.trim();
    const tickets = parseInt(ticketCountInput.value);

    if (!userName || isNaN(tickets) || tickets <= 0) {
        showToast("Please enter valid details.", "error");
        return;
    }

    if (tickets > currentSelectedEvent.quantity) {
        showToast("Not enough tickets available!", "error");
        return;
    }

    // Process the booking and decrease quantity
    const eventIndex = events.findIndex(ev => ev.id === currentSelectedEvent.id);
    if (eventIndex !== -1) {
        // Decrease quantity
        events[eventIndex].quantity -= tickets;
        
        // Save back to events list in LocalStorage
        localStorage.setItem(StorageKeyEvents, JSON.stringify(events));

        // Create booking record details
        const dateObj = new Date(currentSelectedEvent.date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        
        let [hours, minutes] = currentSelectedEvent.time.split(":");
        hours = parseInt(hours);
        let ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedTime = `${hours}:${minutes} ${ampm}`;

        // Calculate final amount with discount
        const baseAmount = tickets * currentSelectedEvent.price;
        const finalAmount = currentDiscount > 0 ? baseAmount * (1 - currentDiscount/100) : baseAmount;

        const newBooking = {
            id: Date.now(),
            user: userName,
            event: currentSelectedEvent.name,
            tickets: tickets,
            amount: finalAmount,
            promoCode: appliedPromoCode,
            date: dateObj.toLocaleDateString('en-US', {day:'2-digit', month:'2-digit', year:'numeric'}),
            time: formattedTime,
            day: dayName
        };

        // Add to bookings array in LocalStorage
        bookings.push(newBooking);
        localStorage.setItem(StorageKeyBookings, JSON.stringify(bookings));

        showToast(`Success! ${tickets} ticket(s) booked for ${currentSelectedEvent.name}. Total paid: ₹${(tickets * currentSelectedEvent.price).toLocaleString('en-IN')}`, "success");
        
        closeModal();
        renderEvents(); // refresh UI with updated ticket quantities
        renderMyTickets();
    }
});

// Toast Notification System
if(!document.getElementById('toastContainer')) {
    const tc = document.createElement('div');
    tc.id = 'toastContainer';
    tc.className = 'toast-container';
    document.body.appendChild(tc);
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    document.getElementById('toastContainer').appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// User Auth System logic
const navLinks = document.getElementById('navLinks');
function renderUserContext() {
    if (currentUser) {
        navLinks.innerHTML = `
            <span style="font-weight: 600; color: var(--text-muted); font-size:0.95rem;">Welcome, <span style="color:white;">${currentUser}</span></span>
            <button class="danger-btn" onclick="logoutUser()">Logout</button>
            <a href="admin.html" class="admin-link">Admin Dashboard</a>
        `;
        document.getElementById('myBookingsSection').style.display = 'block';
        renderMyTickets();
    } else {
        navLinks.innerHTML = `
            <button class="primary-btn" style="padding: 0.6rem 1.2rem;" onclick="openAuthModal()">Login / Register</button>
            <a href="admin.html" class="admin-link">Admin Dashboard</a>
        `;
        document.getElementById('myBookingsSection').style.display = 'none';
    }
}

window.openAuthModal = function() {
    document.getElementById('authModal').classList.add('active');
};
window.closeAuthModal = function() {
    document.getElementById('authModal').classList.remove('active');
};
window.switchAuthTab = function(tab) {
    document.getElementById('tabLogin').classList.remove('active');
    document.getElementById('tabRegister').classList.remove('active');
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    if(tab === 'login') {
        document.getElementById('tabLogin').classList.add('active');
        document.getElementById('loginForm').style.display = 'block';
    } else {
        document.getElementById('tabRegister').classList.add('active');
        document.getElementById('registerForm').style.display = 'block';
    }
};

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const valid = usersDB.find(u => u.username.toLowerCase() === user.toLowerCase() && u.password === pass);
    if(valid) {
        currentUser = valid.username;
        sessionStorage.setItem('eventify_current_user', currentUser);
        showToast("Logged in successfully!", "success");
        closeAuthModal();
        renderUserContext();
    } else {
        showToast("Invalid credentials. Please register or try again.", "error");
    }
});

document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('regUser').value.trim();
    const pass = document.getElementById('regPass').value;
    if(usersDB.find(u => u.username.toLowerCase() === user.toLowerCase())) {
        showToast("Username already taken!", "error");
        return;
    }
    usersDB.push({ username: user, password: pass });
    localStorage.setItem(StorageKeyUsers, JSON.stringify(usersDB));
    currentUser = user;
    sessionStorage.setItem('eventify_current_user', currentUser);
    showToast("Registration successful! You are now logged in.", "success");
    closeAuthModal();
    renderUserContext();
});

window.logoutUser = function() {
    currentUser = null;
    sessionStorage.removeItem('eventify_current_user');
    showToast("Logged out.", "success");
    renderUserContext();
};

function renderMyTickets() {
    const list = document.getElementById('myTicketList');
    list.innerHTML = "";
    const myTix = bookings.filter(b => b.user === currentUser);
    
    if(myTix.length === 0) {
        list.innerHTML = `<div class="empty-state" style="padding: 2rem;">No tickets booked yet. Book an event above!</div>`;
        return;
    }
    
    [...myTix].reverse().forEach(b => {
        const qrContent = b.id + "_" + b.user.substring(0, 3).toUpperCase();
        list.innerHTML += `
            <div class="ticket-card">
                <div class="ticket-info">
                    <h3 style="color:white;margin-bottom:0.5rem;">${b.event}</h3>
                    <div style="color:var(--text-muted);font-size:0.9rem;margin-bottom:1rem;">
                        📅 ${b.date} | 🕒 ${b.time}
                    </div>
                    <div style="display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.05);padding-top:1rem;">
                        <span style="font-weight:600;color:var(--accent-1);">${b.tickets}x Ticket(s)</span>
                        <span style="font-weight:700;color:white;">Paid: ₹${b.amount.toLocaleString('en-IN')}</span>
                    </div>
                </div>
                <div class="ticket-qr">
                    <div class="qr-code">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrContent}" alt="QR Code">
                    </div>
                    <span class="qr-text">${qrContent}</span>
                </div>
            </div>
        `;
    });
}

window.filterByCategory = function(category, element) {
    currentFilterCategory = category;
    
    // Update active state in UI
    document.querySelectorAll('.cat-filter').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    
    renderEvents(document.getElementById('searchInput').value);
};

// Initializations
renderUserContext();
renderEvents();