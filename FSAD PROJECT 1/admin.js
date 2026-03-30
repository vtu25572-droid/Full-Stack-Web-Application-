// Constants matching User App
const StorageKeyEvents = "eventify_events";
const StorageKeyBookings = "eventify_bookings";
const StorageKeyWaitlist = "eventify_waitlist";
const StorageKeyPromos = "eventify_promos";
const StorageKeyUsers = "eventify_users";

// Global Admin State
let events = JSON.parse(localStorage.getItem(StorageKeyEvents)) || [];
let bookings = JSON.parse(localStorage.getItem(StorageKeyBookings)) || [];
let waitlist = JSON.parse(localStorage.getItem(StorageKeyWaitlist)) || [];
let promos = JSON.parse(localStorage.getItem(StorageKeyPromos)) || [];
let usersDB = JSON.parse(localStorage.getItem(StorageKeyUsers)) || [];

// Seeding logic (must match app.js)
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

seedDemoData();

// Re-fetch after seeding if necessary
events = JSON.parse(localStorage.getItem(StorageKeyEvents)) || [];

// DOM Elements
const totalEventsVal = document.getElementById("totalEventsVal");
const totalRevenueVal = document.getElementById("totalRevenueVal");
const totalTicketsVal = document.getElementById("totalTicketsVal");
const recentBookingsTable = document.getElementById("recentBookingsTable");
const eventsTableBody = document.getElementById("eventsTableBody");
const allBookingsTableBody = document.getElementById("allBookingsTableBody");
const pageTitle = document.getElementById("pageTitle");

const eventModal = document.getElementById("eventModal");
const createEventForm = document.getElementById("createEventForm");

// Tab Switch Logic
window.switchTab = function(tabId) {
    // Determine title
    let title = "Overview";
    if(tabId === 'events') title = "Manage Events";
    if(tabId === 'bookings') title = "All Bookings";
    if(tabId === 'promos') title = "Manage Promo Codes";
    if(tabId === 'users_list') title = "User Directory";
    pageTitle.innerText = title;

    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Un-highlight all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show target tab
    document.getElementById(tabId).classList.add('active');
    
    // Highlight correct nav item based on onclick attribute comparison
    const targetNav = Array.from(document.querySelectorAll('.nav-item')).find(el => el.getAttribute('onclick').includes(tabId));
    if(targetNav) targetNav.classList.add('active');

    // Trigger specific renders
    if(tabId === 'dashboard') updateDashboard();
    if(tabId === 'events') renderManageEvents();
    if(tabId === 'bookings') renderAllBookings();
    if(tabId === 'promos') renderPromos();
    if(tabId === 'users_list') renderUsers();
};

// Modal Operations
window.openEventModal = function() {
    eventModal.classList.add('active');
};
window.closeEventModal = function() {
    eventModal.classList.remove('active');
    createEventForm.reset();
};

window.onclick = function(event) {
    if (event.target === eventModal) closeModal();
    if (event.target === editEventModal) closeEditModal();
    if (event.target === document.getElementById('promoModal')) closePromoModal();
    if (event.target === document.getElementById('waitlistDetailModal')) closeWaitlistDetailModal();
};

// Promo Modal Operations
window.openPromoModal = function() {
    document.getElementById('promoModal').classList.add('active');
};
window.closePromoModal = function() {
    document.getElementById('promoModal').classList.remove('active');
    document.getElementById('createPromoForm').reset();
};

// Create Event
createEventForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('eventName').value.trim();
    const category = document.getElementById('eventCategory').value;
    const imageUrl = document.getElementById('eventImageUrl').value.trim();
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const location = document.getElementById('eventLocation').value.trim();
    const price = parseInt(document.getElementById('eventPrice').value);
    const qty = parseInt(document.getElementById('eventQty').value);

    // Basic Validation
    if(!name || !date || !time || !location || isNaN(price) || isNaN(qty)) {
        showToast("Please provide valid details for all fields.", "error");
        return;
    }

    const newEvent = {
        id: Date.now(),
        name: name,
        category: category,
        image: imageUrl || getDefaultImage(category),
        date: date,
        time: time,
        location: location,
        price: price,
        quantity: qty
    };

    events.push(newEvent);
    // Explicit sync with localStorage
    localStorage.setItem(StorageKeyEvents, JSON.stringify(events));

    closeEventModal();
    renderManageEvents(); 
    updateDashboard();   
    showToast("Event created successfully!", "success");
});

// Create Promo Code
document.getElementById('createPromoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const code = document.getElementById('promoCode').value.trim().toUpperCase();
    const discount = parseInt(document.getElementById('promoDiscount').value);
    const expiry = document.getElementById('promoExpiry').value;

    if (promos.find(p => p.code === code)) {
        showToast("Promo code already exists!", "error");
        return;
    }

    const newPromo = { code, discount, expiry };
    promos.push(newPromo);
    localStorage.setItem(StorageKeyPromos, JSON.stringify(promos));
    
    closePromoModal();
    renderPromos();
    showToast("Promo code created!", "success");
});

window.deletePromo = function(code) {
    if(confirm("Delete this promo code?")) {
        promos = promos.filter(p => p.code !== code);
        localStorage.setItem(StorageKeyPromos, JSON.stringify(promos));
        renderPromos();
        showToast("Promo deleted.", "success");
    }
};

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

// Delete Event
window.deleteEvent = function(id) {
    if(confirm("Are you entirely sure you want to delete this event? This action gets propagated to the customer side instantly.")) {
        events = events.filter(e => e.id !== id);
        localStorage.setItem(StorageKeyEvents, JSON.stringify(events));
        renderManageEvents();
        updateDashboard();
        showToast("Event deleted successfully.", "success");
    }
};

// Edit Event Logic
const editEventModal = document.getElementById('editEventModal');
const editEventForm = document.getElementById('editEventForm');

window.openEditModal = function(id) {
    const event = events.find(e => e.id === id);
    if (!event) return;

    document.getElementById('editEventId').value = event.id;
    document.getElementById('editEventName').value = event.name;
    document.getElementById('editEventCategory').value = event.category || "General";
    document.getElementById('editEventImageUrl').value = event.image || "";
    document.getElementById('editEventDate').value = event.date;
    document.getElementById('editEventTime').value = event.time;
    document.getElementById('editEventLocation').value = event.location;
    document.getElementById('editEventPrice').value = event.price;
    document.getElementById('editEventQty').value = event.quantity;

    editEventModal.classList.add('active');
};

window.closeEditModal = function() {
    editEventModal.classList.remove('active');
};

if(editEventForm) {
    editEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('editEventId').value);
        const index = events.findIndex(event => event.id === id);
        
        if (index !== -1) {
            const category = document.getElementById('editEventCategory').value;
            const imageUrl = document.getElementById('editEventImageUrl').value.trim();
            
            events[index] = {
                ...events[index],
                name: document.getElementById('editEventName').value.trim(),
                category: category,
                image: imageUrl || getDefaultImage(category),
                date: document.getElementById('editEventDate').value,
                time: document.getElementById('editEventTime').value,
                location: document.getElementById('editEventLocation').value.trim(),
                price: parseInt(document.getElementById('editEventPrice').value),
                quantity: parseInt(document.getElementById('editEventQty').value)
            };

            localStorage.setItem(StorageKeyEvents, JSON.stringify(events));
            closeEditModal();
            renderManageEvents();
            updateDashboard();
            showToast("Event updated successfully!", "success");
        }
    });
}

// Rendering Functions
function updateDashboard() {
    // Compute Stats
    totalEventsVal.innerText = events.length;
    
    let rev = 0;
    let tix = 0;
     bookings.forEach(b => {
        rev += b.amount;
        tix += b.tickets;
    });

    totalRevenueVal.innerText = `₹${rev.toLocaleString('en-IN')}`;
    totalTicketsVal.innerText = tix.toLocaleString('en-IN');

    renderCharts();

    // Recent Bookings (Last 5, Reverse Order)
    recentBookingsTable.innerHTML = "";
    const recent = [...bookings].reverse().slice(0, 5);
    
    if(recent.length === 0) {
        recentBookingsTable.innerHTML = `<tr><td colspan="5" class="empty-row">No bookings found yet.</td></tr>`;
    } else {
        recent.forEach(b => {
            recentBookingsTable.innerHTML += `
                <tr>
                    <td><strong>${b.user}</strong></td>
                    <td>${b.event}</td>
                    <td><span style="background:#e0e7ff;color:#4338ca;padding:0.2rem 0.5rem;border-radius:12px;font-size:0.8rem;font-weight:600;">${b.tickets}</span></td>
                    <td>₹${b.amount.toLocaleString('en-IN')}</td>
                    <td style="color:var(--text-muted);">${b.date}</td>
                </tr>
            `;
        });
    }
}

function renderManageEvents() {
    eventsTableBody.innerHTML = "";

    if (events.length === 0) {
        eventsTableBody.innerHTML = `<tr><td colspan="6" class="empty-row">Your event list is currently empty. Click the 'Create New Event' button to get started.</td></tr>`;
        return;
    }

    events.forEach(e => {
        // Humanize Date
        let dateObj = new Date(e.date);
        let datePrinted = dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year:'numeric' });
        
        // Humanize Time
        let [hh, mm] = e.time.split(":");
        hh = parseInt(hh);
        let ampm = hh >= 12 ? "PM" : "AM";
        hh = hh % 12 || 12;
        let timePrinted = `${hh}:${mm} ${ampm}`;

        eventsTableBody.innerHTML += `
            <tr>
                <td><strong>${e.name}</strong></td>
                <td>${datePrinted} <br><span style="color:var(--text-muted);font-size:0.85em;">${timePrinted}</span></td>
                <td>${e.location}</td>
                <td><strong>₹${e.price.toLocaleString('en-IN')}</strong></td>
                <td>
                    ${e.quantity <= 0 
                        ? '<span style="color:var(--danger);font-weight:700;background:#fee2e2;padding:0.2rem 0.5rem;border-radius:4px;">0 (Sold Out)</span>' 
                        : `<span style="font-weight:600">${e.quantity}</span>`}
                </td>
                <td>
                    <button class="primary-btn" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background: var(--accent-2); border-color: var(--accent-2);" 
                            onclick="viewWaitlist(${e.id})">
                        ${waitlist.filter(w => w.eventId === e.id).length} People
                    </button>
                </td>
                <td style="display:flex; gap: 0.5rem;">
                    <button class="primary-btn" style="padding: 0.5rem; font-size: 0.8rem;" onclick="openEditModal(${e.id})">Edit</button>
                    <button class="danger-btn" style="padding: 0.5rem; font-size: 0.8rem;" onclick="deleteEvent(${e.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}

function renderAllBookings() {
    allBookingsTableBody.innerHTML = "";

    if (bookings.length === 0) {
        allBookingsTableBody.innerHTML = `<tr><td colspan="6" class="empty-row">No tickets have been booked across all events yet.</td></tr>`;
        return;
    }

    [...bookings].reverse().forEach(b => {
        allBookingsTableBody.innerHTML += `
            <tr>
                <td><span style="color:var(--text-muted);font-family:monospace;background:rgba(0,0,0,0.05);padding:0.3rem 0.5rem;border-radius:6px;">#${b.id.toString().slice(-6)}</span></td>
                <td><strong>${b.user}</strong></td>
                <td>${b.event}</td>
                <td>${b.tickets}</td>
                <td><strong>₹${b.amount.toLocaleString('en-IN')}</strong></td>
                <td>${b.date} <br><span style="color:var(--text-muted);font-size:0.85em;">${b.time}</span></td>
            </tr>
        `;
    });
}

window.exportBookingsToCSV = function() {
    if (bookings.length === 0) {
        showToast("No bookings available to export.", "error");
        return;
    }

    const headers = ["Booking ID", "Customer Name", "Event", "Tickets", "Amount Paid", "Date", "Time"];
    
    // Helper to escape CSV fields
    const escapeCSV = (val) => {
        let str = val ? val.toString() : "";
        // If string contains comma, quotes or newlines, wrap in quotes and escape internal quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    };

    const csvRows = [];
    // Add header row
    csvRows.push(headers.join(","));

    // Add data rows
    bookings.forEach(b => {
        const row = [
            `#${b.id.toString().slice(-6)}`,
            escapeCSV(b.user),
            escapeCSV(b.event),
            b.tickets,
            b.amount,
            b.date,
            b.time
        ];
        csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\r\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `eventify_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    showToast("Bookings exported successfully!", "success");
};

window.viewWaitlist = function(eventId) {
    const list = waitlist.filter(w => w.eventId === eventId);
    const event = events.find(e => e.id === eventId);
    
    document.getElementById("waitlistDetailTitle").innerText = `Waitlist for: ${event.name}`;
    const listContainer = document.getElementById("waitlistDetailList");
    listContainer.innerHTML = "";
    
    if (list.length === 0) {
        listContainer.innerHTML = `<div style="padding: 1rem; color: var(--text-muted);">No customers on waitlist for this event.</div>`;
    } else {
        list.forEach((w, index) => {
            listContainer.innerHTML += `
                <div style="display: flex; justify-content: space-between; padding: 0.8rem; border-bottom: 1px solid rgba(0,0,0,0.05);">
                    <span>#${index+1} <strong>${w.user}</strong></span>
                    <span style="color: var(--text-muted); font-size: 0.85rem;">Joined: ${w.date}</span>
                </div>
            `;
        });
    }
    
    document.getElementById("waitlistDetailModal").classList.add("active");
};

window.closeWaitlistDetailModal = function() {
    document.getElementById("waitlistDetailModal").classList.remove("active");
};

// New rendering functions for Analytics & Promos
function renderPromos() {
    const tbody = document.getElementById('promosTableBody');
    tbody.innerHTML = "";
    if (promos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No promo codes created yet.</td></tr>';
        return;
    }
    promos.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td><strong style="color:var(--accent-1);">${p.code}</strong></td>
                <td>${p.discount}%</td>
                <td>${p.expiry}</td>
                <td><button class="danger-btn" style="padding:0.4rem;" onclick="deletePromo('${p.code}')">Delete</button></td>
            </tr>
        `;
    });
}

function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = "";
    if (usersDB.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No users registered yet.</td></tr>';
        return;
    }

    usersDB.forEach(u => {
        const userBookings = bookings.filter(b => b.user.toLowerCase() === u.username.toLowerCase());
        const totalSpent = userBookings.reduce((sum, b) => sum + b.amount, 0);
        const lastBooking = userBookings.length > 0 ? userBookings[userBookings.length - 1].date : "Never";

        tbody.innerHTML += `
            <tr>
                <td><strong>${u.username}</strong></td>
                <td>${userBookings.length}</td>
                <td>₹${totalSpent.toLocaleString('en-IN')}</td>
                <td>${lastBooking}</td>
            </tr>
        `;
    });
}

let revChartInstance = null;
let tixChartInstance = null;

function renderCharts() {
    // Revenue by Category
    const catData = {};
    bookings.forEach(b => {
        const event = events.find(e => e.name === b.event);
        const cat = event ? (event.category || "General") : "General";
        catData[cat] = (catData[cat] || 0) + b.amount;
    });

    const revCtx = document.getElementById('revenueChart').getContext('2d');
    if(revChartInstance) revChartInstance.destroy();
    revChartInstance = new Chart(revCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(catData),
            datasets: [{
                data: Object.values(catData),
                backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
            }]
        },
        options: { maintainAspectRatio: false }
    });

    // Tickets Sold per Event
    const tixData = {};
    bookings.forEach(b => {
        tixData[b.event] = (tixData[b.event] || 0) + b.tickets;
    });

    const tixCtx = document.getElementById('ticketsChart').getContext('2d');
    if(tixChartInstance) tixChartInstance.destroy();
    tixChartInstance = new Chart(tixCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(tixData),
            datasets: [{
                label: 'Tickets Sold',
                data: Object.values(tixData),
                backgroundColor: '#6366f1'
            }]
        },
        options: { 
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

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

// Auth Logic
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');

function checkAuth() {
    if (sessionStorage.getItem('eventify_admin_auth') === 'true') {
        if(loginOverlay) loginOverlay.classList.add('hidden');
        document.body.style.overflow = 'auto';
    } else {
        if(loginOverlay) loginOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

if(loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('adminUsername').value;
        const pass = document.getElementById('adminPassword').value;

        if (user === 'admin' && pass === 'password123') {
            sessionStorage.setItem('eventify_admin_auth', 'true');
            showToast("Welcome to the Admin Dashboard!", "success");
            checkAuth();
        } else {
            showToast("Invalid credentials! Try admin / password123", "error");
        }
    });
}

window.logoutAdmin = function() {
    sessionStorage.removeItem('eventify_admin_auth');
    checkAuth();
    showToast("Logged out successfully.", "success");
};

// Initial Call
updateDashboard();
checkAuth();
// Data Health & Sustainability Logic
function checkDataOrigin() {
    const currentOrigin = window.location.origin === 'null' ? 'Local File' : window.location.origin;
    const currentPath = window.location.pathname;
    const storedOrigin = localStorage.getItem('eventify_last_origin');
    const storedPath = localStorage.getItem('eventify_last_path');
    
    const indicator = document.getElementById('dataIndicator');
    if(indicator) {
        indicator.innerText = currentOrigin;
    }

    if ((storedOrigin && (storedOrigin !== currentOrigin)) || (storedPath && (storedPath !== currentPath))) {
        showToast(`⚠️ Storage Shift: You are at a different location/path. Your old data may be in a different storage node.`, 'error');
    }
    localStorage.setItem('eventify_last_origin', currentOrigin);
    localStorage.setItem('eventify_last_path', currentPath);
}

window.resetToDefaults = function() {
    if(confirm('DANGER: This will delete ALL created data and restore demo events. Continue?')) {
        localStorage.clear();
        location.reload();
    }
};

checkDataOrigin();
