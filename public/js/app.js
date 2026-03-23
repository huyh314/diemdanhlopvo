let db = { students: [], attendance_history: [] };
let todayStr = new Date().toLocaleDateString('vi-VN');
let currentGroup = 'nhom_1';
let isEditMode = false;
let selectedIds = new Set();
let currentPage = 1;
const ITEMS_PER_PAGE = 50;

// Day filter: null = all, 2-7 = Thu 2-7 (JS weekday: Mon=1...Sun=0, we use 2=T2...7=T7)
let currentDayFilter = null;

// ⚡ OPTIMIZATION: Memoization Cache
let filteredStudentsCache = null;
let lastCacheKey = null;

function getCacheKey(filterText) {
    return `${currentGroup}|${filterText}|${currentFilterMode}|${isSorted}|${currentDayFilter}`;
}

// ⚡ OPTIMIZATION: Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedRender = debounce((text) => {
    currentPage = 1;
    renderGrid(text);
}, 300);

// Theme state
const getStorageItem = (key, fallback) => {
    try {
        return localStorage.getItem(key) || fallback;
    } catch (e) {
        console.warn(`LocalStorage access failed for ${key}`, e);
        return fallback;
    }
};

let currentThemeMode = getStorageItem('themeMode', 'dark');
let currentThemeColor = getStorageItem('themeColor', 'blue');

// Status Map
const STATUS = {
    ABSENT: 'absent',
    PRESENT: 'present',
    EXCUSED: 'excused'
};

const STATUS_CONFIG = {
    [STATUS.ABSENT]: { color: 'border-red-500/20 bg-red-500/5', icon: '🔴', label: 'Vắng' },
    [STATUS.PRESENT]: { color: 'border-green-500/50 bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]', icon: '🟢', label: 'Có mặt' },
    [STATUS.EXCUSED]: { color: 'border-yellow-500/50 bg-yellow-500/20', icon: '🟡', label: 'Có phép' }
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load theme first
        loadTheme();

        const dateEl = document.getElementById('current-date');
        if (dateEl) dateEl.textContent = `Hôm nay: ${todayStr}`;

        await loadData();

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                debouncedRender(e.target.value);
            });
        }

        // Close export dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const wrap = document.getElementById('export-dropdown-wrap');
            const menu = document.getElementById('export-menu');
            if (wrap && menu && !wrap.contains(e.target)) {
                menu.classList.add('hidden');
            }
        });

        // ⚡ OPTIMIZATION: Event Delegation for Student Cards
        const grid = document.getElementById('student-grid');
        if (grid) {
            grid.addEventListener('click', (e) => {
                const card = e.target.closest('.glass-card');
                if (!card || !card.dataset.studentId) return;

                const studentId = card.dataset.studentId;

                // Handle sub-buttons first
                if (e.target.closest('.edit-action')) {
                    openEditStudent(studentId);
                    return;
                }
                if (e.target.closest('.point-action')) {
                    openPointsModal(studentId);
                    return;
                }

                // Handle main status toggle or selection
                if (isEditMode) {
                    toggleSelection(studentId);
                } else {
                    toggleStatus(studentId);
                }
            });
        }
    } catch (e) {
        console.error("Initialization failed", e);
        showToast("❌ Lỗi khởi động ứng dụng!");
    }
});

async function loadData() {
    try {
        // 1. Initialise Supabase from local storage
        const savedUrl = getStorageItem('supabaseUrl', null);
        const savedKey = getStorageItem('supabaseKey', null);
        let useSupabase = false;

        if (savedUrl && savedKey) {
            useSupabase = initSupabase(savedUrl, savedKey);
        }

        // 2. Fetch data
        if (useSupabase) {
            try {
                const cloudData = await loadFromSupabase();
                if (cloudData && Array.isArray(cloudData.students)) {
                    db = cloudData;
                    console.log("Loaded data from Supabase");

                    try {
                        localStorage.setItem('local_db_cache', JSON.stringify(db));
                    } catch (sErr) { }
                }
            } catch (cloudErr) {
                console.warn("Could not fetch from Supabase, using local data", cloudErr);
                showToast("Offline: Đang dùng dữ liệu máy");

                // Fallback to local
                const cachedDb = getStorageItem('local_db_cache', null);
                if (cachedDb) {
                    try { db = JSON.parse(cachedDb); } catch (e) { }
                }
            }
        } else {
            console.log("No Supabase connection. Trying Local API & Cache");
            // Local fallback
            try {
                const apiRes = await fetch('/api/db');
                if (apiRes.ok) {
                    const apiDb = await apiRes.json();
                    if (apiDb && Array.isArray(apiDb.students)) db = apiDb;
                }
            } catch (apiErr) {
                const cachedDb = getStorageItem('local_db_cache', null);
                if (cachedDb) {
                    try { db = JSON.parse(cachedDb); } catch (pErr) { }
                }
            }
        }

        // Setup default if empty
        if (!db.students) db.students = [];
        if (!db.attendance_history) db.attendance_history = [];
        if (!db.weekly_snapshots) db.weekly_snapshots = [];

        // Data Migration check
        let migrated = false;
        db.students.forEach(s => {
            if (!s.group) {
                s.group = 'nhom_1';
                migrated = true;
            }
            if (!s.points) {
                s.points = {
                    current: 30,
                    chuyenCan: 0,
                    yThuc: 0,
                    trinhDo: 0
                };
                migrated = true;
            }
            if (!s.schedule) {
                s.schedule = []; // Default empty schedule
                migrated = true;
            }
        });

        // NEW: Check Day Reset
        // Compare db.date vs todayStr. If different -> Reset Status
        if (!db.date || db.date !== todayStr) {
            console.log(`New Day Detected: Old(${db.date}) vs New(${todayStr}). Resetting attendance.`);
            db.students.forEach(s => {
                s.status = STATUS.ABSENT;
                // DO NOT reset s.schedule! This was the bug causing data loss.
            });
            db.date = todayStr;
            migrated = true;
            // Show notification to user
            showToast("🗓️ Ngày mới! Đã reset điểm danh.");
        }

        if (migrated) await saveData(true);

        // Auto-save snapshot tuần nếu chưa có (chạy ngầm, không block UI)
        saveWeeklySnapshot();

        updateStats();
        renderGrid();

        // Auto-select ngày hôm nay cho bộ lọc (1=CN->null, 1=T2...7=T7)
        const jsDay = new Date().getDay(); // 0=Sun, 1=Mon... 6=Sat
        // Chuyển sang hệ T2=2...T7=7, CN=null
        const todayDayNum = jsDay === 0 ? null : jsDay + 1;
        if (todayDayNum !== null && todayDayNum >= 2 && todayDayNum <= 7) {
            setDayFilter(todayDayNum);
        }

    } catch (e) {
        console.error("Failed to load data", e);
        showToast("Lỗi tải dữ liệu!");
    }
}

function switchTab(group) {
    currentGroup = group;
    // Update Tab UI
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-blue-500/20', 'text-blue-300', 'border-blue-500/30');
        btn.classList.add('bg-gray-800', 'text-gray-400', 'border-transparent');
    });
    // Highlight active
    const activeBtn = document.querySelector(`button[onclick="switchTab('${group}')"]`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-gray-800', 'text-gray-400', 'border-transparent');
        activeBtn.classList.add('active', 'bg-blue-500/20', 'text-blue-300', 'border-blue-500/30');
    }

    // Clear selection when switching tabs? No, keep it.
    currentPage = 1; // Reset pagination
    renderGrid(document.getElementById('search-input').value);
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    const btn = document.getElementById('edit-mode-btn');
    const bulkBar = document.getElementById('bulk-actions');

    if (isEditMode) {
        btn.classList.add('bg-red-500/20', 'text-red-400');
        btn.classList.remove('bg-gray-700', 'text-gray-300');
        bulkBar.classList.remove('hidden');
    } else {
        btn.classList.remove('bg-red-500/20', 'text-red-400');
        btn.classList.add('bg-gray-700', 'text-gray-300');
        bulkBar.classList.add('hidden');
        selectedIds.clear();
        updateSelectionUI();
    }
    currentPage = 1; // Reset pagination
    renderGrid(document.getElementById('search-input').value);
}



function playSound(type) {
    const audio = document.getElementById('success-sound');
    if (audio && type === 'success') {
        audio.currentTime = 0;
        audio.play().catch(e => console.log("Audio play failed interaction required", e));
    }
}

// Sort Mode
let isSorted = false;

function toggleSort() {
    isSorted = !isSorted;
    const btn = document.getElementById('sort-btn');

    if (isSorted) {
        btn.classList.add('bg-blue-500/20', 'text-blue-300', 'border-blue-500/30');
        btn.classList.remove('bg-gray-800', 'text-gray-400', 'border-gray-700');
    } else {
        btn.classList.remove('bg-blue-500/20', 'text-blue-300', 'border-blue-500/30');
        btn.classList.add('bg-gray-800', 'text-gray-400', 'border-gray-700');
    }

    currentPage = 1; // Reset pagination
    renderGrid(document.getElementById('search-input').value);
}

function getFilteredAndSortedStudents(filterText = '', forceUpdate = false) {
    const key = getCacheKey(filterText);
    if (!forceUpdate && lastCacheKey === key && filteredStudentsCache) {
        return filteredStudentsCache;
    }

    const filterLower = filterText.toLowerCase();

    let filtered = db.students.filter(s => {
        const matchesGroup = (s.group || 'nhom_1') === currentGroup;
        const matchesName = s.name.toLowerCase().includes(filterLower);

        let matchesFilterMode = true;
        if (currentFilterMode === 'absent') {
            matchesFilterMode = (!s.status || s.status === STATUS.ABSENT);
        } else if (currentFilterMode === 'present') {
            matchesFilterMode = (s.status === STATUS.PRESENT);
        }

        return matchesGroup && matchesName && matchesFilterMode;
    });

    // Filter by day-of-week schedule
    if (currentDayFilter !== null) {
        filtered = filtered.filter(s => {
            const sched = s.schedule;
            // No schedule = show in all days
            if (!sched || sched.length === 0) return true;
            return sched.includes(currentDayFilter);
        });
    }

    if (isSorted) {
        filtered = [...filtered].sort((a, b) => {
            const getNamePart = (name) => {
                const parts = name.trim().split(" ");
                return parts[parts.length - 1].toLowerCase();
            };
            return getNamePart(a.name).localeCompare(getNamePart(b.name), 'vi');
        });
    }

    filteredStudentsCache = filtered;
    lastCacheKey = key;
    return filtered;
}

function renderGrid(filterText = '', isAppend = false) {
    const grid = document.getElementById('student-grid');
    if (!grid) return;

    if (!isAppend) {
        grid.innerHTML = '';
        currentPage = 1;
    }

    const filteredStudents = getFilteredAndSortedStudents(filterText, !isAppend);

    // Paginate
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedStudents = filteredStudents.slice(0, currentPage * ITEMS_PER_PAGE);

    paginatedStudents.slice(startIndex).forEach((student, idx) => {
        const status = student.status || STATUS.ABSENT;
        // Use simpler logic for hierarchy class
        let statusClass = 'card-absent'; // Default
        if (status === STATUS.PRESENT) statusClass = 'card-present';
        else if (status === STATUS.EXCUSED) statusClass = 'card-excused';

        const isSelected = selectedIds.has(student.id);

        const card = document.createElement('div');

        // Base classes
        let classes = `glass-card p-4 rounded-xl cursor-pointer select-none flex flex-col items-center justify-center gap-2 relative overflow-hidden group transition duration-200 ${statusClass} `;

        if (isEditMode) {
            classes += isSelected ? 'border-red-500 bg-red-500/20 ring-2 ring-red-500' : 'hover:border-red-500/50';
        }

        card.className = classes;
        card.dataset.studentId = student.id;
        // Stagger animation index
        card.style.setProperty('--i', idx);

        // REMOVED individual card.onclick - handled by Event Delegation in DOMContentLoaded

        // Icon Logic - ONLY show checkmark in visual hierarchy model
        let iconHtml = '';
        if (isEditMode) {
            iconHtml = isSelected
                ? `<div class="absolute top-2 right-2 text-red-400">✅</div>`
                : `<div class="absolute top-2 right-2 text-gray-600">⬜</div>`;
        }
        // No default icon for Present/Absent, use Color/Glow instead for cleaner look

        // Avatar Logic
        let avatarHtml = '';
        let avatarClass = '';

        if (student.avatar) {
            avatarHtml = `<img src="${student.avatar}" class="avatar-img rounded-full">`;
            avatarClass = "border-white/20";
        } else {
            avatarHtml = getInitials(student.name);
            // Dynamic Gradient
            avatarClass = getAvatarGradient(student.name) + " text-white text-shadow-sm";
        }

        // Subtitle for duplicate name differentiation
        let subtitleHtml = '';
        if (student.birthYear) {
            subtitleHtml = `<div class="text-[10px] text-gray-500 mt-0.5">(${student.birthYear})</div>`;
        } else if (student.phone) {
            // Show last 4 digits if has phone
            const lastDigits = student.phone.slice(-4);
            subtitleHtml = `<div class="text-[10px] text-gray-500 mt-0.5">...${lastDigits}</div>`;
        }

        // Điểm thi đua HTML
        let pointsHtml = '';
        if (student.points) {
            pointsHtml = `
            <div class="absolute bottom-2 left-2 bg-yellow-500/20 text-yellow-300 font-bold px-1.5 py-0.5 rounded text-[10px] border border-yellow-500/30 point-action flex items-center gap-1 transition hover:bg-yellow-500/40 hover:scale-105" title="Chấm điểm thi đua">
                ⭐ ${student.points.current}
            </div>`;
        }

        card.innerHTML = `
            ${iconHtml}
            
            <div class="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-lg md:text-xl font-bold shadow-inner mb-1 ${!isEditMode && 'group-hover:scale-105'} transition overflow-hidden border border-white/10 ${avatarClass}">
                ${avatarHtml}
            </div>
            
            <h3 class="name-label text-center font-semibold text-sm md:text-base leading-tight text-gray-100 line-clamp-2"></h3>
            ${subtitleHtml}
            ${pointsHtml}
            
            <div class="edit-btn absolute top-2 left-2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white edit-action transition backdrop-blur-md" 
                title="Sửa">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            </div>
        `;

        // XSS Protection: Set name via textContent
        card.querySelector('.name-label').textContent = student.name;

        grid.appendChild(card);
    });

    // ⚡ OPTIMIZATION: Lazy Reveal with Intersection Observer
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        grid.querySelectorAll('.glass-card').forEach(card => observer.observe(card));
    }

    // Add pagination controls
    renderPaginationControls(filteredStudents.length);
}

function renderPaginationControls(totalCount) {
    const grid = document.getElementById('student-grid');

    // Remove existing load more if any
    const existingBtn = document.getElementById('load-more-btn');
    if (existingBtn) existingBtn.remove();

    if (totalCount > currentPage * ITEMS_PER_PAGE) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.id = 'load-more-btn';
        loadMoreBtn.className = "col-span-full py-4 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl border border-gray-700 transition font-bold mt-4";
        loadMoreBtn.textContent = "Xem thêm học sinh...";
        loadMoreBtn.onclick = () => {
            currentPage++;
            renderGrid(document.getElementById('search-input').value, true);
        };
        grid.appendChild(loadMoreBtn);
    }
}

function toggleSelection(id) {
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
    updateSelectionUI();
    renderGrid(document.getElementById('search-input').value);
}

function updateSelectionUI() {
    document.getElementById('selected-count').textContent = selectedIds.size;
}

async function deleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Xóa ${selectedIds.size} học sinh đã chọn?`)) return;

    try {
        // We do Client-side delete then save, as we have Bulk API need or just reuse Save?
        // Reuse saveData() logic is safer for single file consistency, but we have /api/delete_student.
        // Actually, easiest is: Filter out in Client -> Save Whole DB. 
        // This is much faster than N calls to delete endpoint.
        // But backend.py currently only has 'save whole db' or 'delete one'. 
        // Let's use 'Save Whole DB' (/api/save) for bulk actions.

        db.students = db.students.filter(s => !selectedIds.has(s.id));

        await saveData(true); // Silent save

        selectedIds.clear();
        toggleEditMode(); // Exit edit mode
        showToast("Đã xóa xong!");
        updateStats();
        renderGrid();

    } catch (e) {
        alert("Lỗi xóa: " + e.message);
    }
}

function toggleStatus(id) {
    const student = db.students.find(s => s.id === id);
    if (!student) return;

    if (student.status === STATUS.ABSENT) student.status = STATUS.PRESENT;
    else if (student.status === STATUS.PRESENT) student.status = STATUS.EXCUSED;
    else student.status = STATUS.ABSENT;

    // Play Sound
    if (student.status !== STATUS.ABSENT) playSound('success');

    // No auto-save to keep fast
    updateStats();
    // Re-render
    const filter = document.getElementById('search-input').value;
    renderGrid(filter);
}


// IMAGE HANDLING
function handleImagePreview(input, previewId, placeholderId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // Compress Image before showing/saving
            resizeImage(e.target.result, 150, 150, (resizedBase64) => {
                const preview = document.getElementById(previewId);
                const placeholder = document.getElementById(placeholderId);

                preview.src = resizedBase64;
                preview.classList.remove('hidden');
                placeholder.classList.add('hidden');

                // Store resized data on the input element itself for later retrieval
                input.dataset.base64 = resizedBase64;
            });
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function resizeImage(base64Str, maxWidth, maxHeight, callback) {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
        let canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width *= maxHeight / height;
                height = maxHeight;
            }
        }

        canvas.width = width;
        canvas.height = height;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Output as Data URL (JPEG low quality for small size)
        callback(canvas.toDataURL('image/jpeg', 0.6));
    };
}


// MODAL & ADD
function toggleAddModal() {
    const modal = document.getElementById('add-modal');
    const content = document.getElementById('add-modal-content');

    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
        }, 10);
        document.getElementById('new-student-name').focus();
    } else {
        modal.classList.add('opacity-0');
        content.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);

        // Reset Inputs
        setTimeout(() => {
            document.getElementById('new-student-name').value = '';
            document.getElementById('add-avatar-input').value = '';
            document.getElementById('add-avatar-input').dataset.base64 = '';
            document.getElementById('add-avatar-preview').classList.add('hidden');
            document.getElementById('add-avatar-placeholder').classList.remove('hidden');
        }, 300);
    }
}

function handleEnter(e) {
    if (e.key === 'Enter') addStudent();
}

async function addStudent() {
    const nameInput = document.getElementById('new-student-name');
    const groupInput = document.getElementById('new-student-group');
    const avatarInput = document.getElementById('add-avatar-input'); // Image Input

    const name = nameInput.value.trim();
    if (!name) {
        showToast("❌ Tên không thể để trống");
        return;
    }

    if (name.length > 100) {
        showToast("❌ Tên quá dài (max 100 ký tự)");
        return;
    }

    // Basic regex for Vietnamese names and common characters
    const nameRegex = /^[a-zA-Z0-9\sàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ'-]+$/i;
    if (!nameRegex.test(name)) {
        showToast("❌ Tên chứa ký tự không hợp lệ");
        return;
    }

    const group = groupInput.value || 'nhom_1';
    const avatar = avatarInput.dataset.base64 || '';

    const newStudent = {
        id: `st_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: name,
        group: group,
        avatar: avatar,
        birthYear: '',
        phone: '',
        status: 'absent',
        points: {
            current: 30, // Default 30 points
            chuyenCan: 0,
            yThuc: 0,
            trinhDo: 0
        }
    };

    db.students.unshift(newStudent);
    await saveData(true); // Auto save creation

    // Reset handled in toggleAddModal logic or here if we kept it open (we close it)
    toggleAddModal();

    // Switch to that group
    switchTab(group);

    showToast(`Đã thêm: ${name}`);
    updateStats();
    playSound('success'); // Feedback
}


// EDIT STUDENT
let currentEditingId = null;

function openEditStudent(id) {
    const student = db.students.find(s => s.id === id);
    if (!student) return;

    currentEditingId = id;

    // Fill Data
    document.getElementById('edit-student-id').value = id;
    document.getElementById('edit-student-name').value = student.name;
    document.getElementById('edit-student-group').value = (student.group || 'nhom_1');
    document.getElementById('edit-student-birthyear').value = (student.birthYear || '');
    document.getElementById('edit-student-phone').value = (student.phone || '');

    const preview = document.getElementById('edit-avatar-preview');
    const placeholder = document.getElementById('edit-avatar-placeholder');
    const input = document.getElementById('edit-avatar-input');

    if (student.avatar) {
        preview.src = student.avatar;
        preview.classList.remove('hidden');
        placeholder.classList.add('hidden');
        input.dataset.base64 = student.avatar; // Keep existing
    } else {
        preview.src = '';
        preview.classList.add('hidden');
        placeholder.classList.remove('hidden');
        input.dataset.base64 = '';
    }

    // Populate schedule checkboxes
    const schedule = student.schedule || [];
    document.querySelectorAll('#edit-schedule-checkboxes .schedule-cb').forEach(cb => {
        cb.checked = schedule.includes(parseInt(cb.value));
    });

    toggleEditModal();
}

function toggleEditModal() {
    const modal = document.getElementById('edit-modal');
    const content = document.getElementById('edit-modal-content');

    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
        }, 10);
    } else {
        modal.classList.add('opacity-0');
        content.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

async function saveStudentDetails() {
    if (!currentEditingId) return;

    const name = document.getElementById('edit-student-name').value.trim();
    if (!name) {
        showToast("❌ Tên không thể để trống");
        return;
    }

    if (name.length > 100) {
        showToast("❌ Tên quá dài (max 100 ký tự)");
        return;
    }

    const nameRegex = /^[a-zA-Z0-9\sàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ'-]+$/i;
    if (!nameRegex.test(name)) {
        showToast("❌ Tên chứa ký tự không hợp lệ");
        return;
    }

    const group = document.getElementById('edit-student-group').value;
    const birthYear = document.getElementById('edit-student-birthyear').value;
    const phone = document.getElementById('edit-student-phone').value;
    const avatar = document.getElementById('edit-avatar-input').dataset.base64 || '';
    // Collect schedule checkboxes
    const schedule = [];
    document.querySelectorAll('#edit-schedule-checkboxes .schedule-cb').forEach(cb => {
        if (cb.checked) schedule.push(parseInt(cb.value));
    });

    // Find and Update
    const studentIdx = db.students.findIndex(s => s.id === currentEditingId);
    if (studentIdx > -1) {
        db.students[studentIdx].name = name;
        db.students[studentIdx].group = group;
        db.students[studentIdx].birthYear = birthYear;
        db.students[studentIdx].phone = phone;
        db.students[studentIdx].avatar = avatar;
        db.students[studentIdx].schedule = schedule;

        await saveData(true); // Save

        toggleEditModal();
        renderGrid(document.getElementById('search-input').value); // Refresh
        showToast("Đã cập nhật thông tin!");
    }
}

async function deleteSingleStudent() {
    if (!currentEditingId) return;
    if (!confirm("Bạn chắc chắn muốn xóa học sinh này chứ?")) return;

    db.students = db.students.filter(s => s.id !== currentEditingId);

    await saveData(true);

    toggleEditModal();
    renderGrid();
    showToast("Đã xóa học sinh!");
}

// GROUP CHANGE LOGIC (BULK)

function toggleGroupModal() {
    if (selectedIds.size === 0) {
        showToast("Chưa chọn học sinh nào!");
        return;
    }

    const modal = document.getElementById('group-modal');
    const content = document.getElementById('group-modal-content');

    document.getElementById('group-modal-count').textContent = selectedIds.size;

    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
        }, 10);
    } else {
        modal.classList.add('opacity-0');
        content.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

async function confirmChangeGroup() {
    const targetGroup = document.getElementById('target-group').value;

    // Update local data
    db.students.forEach(s => {
        if (selectedIds.has(s.id)) {
            s.group = targetGroup;
        }
    });

    await saveData(true); // Auto save

    selectedIds.clear();
    toggleEditMode(); // Exit edit mode
    toggleGroupModal(); // Close modal

    showToast(`Đã chuyển sang nhóm: ${targetGroup}`);
    switchTab(targetGroup); // Jump to that group to see results
}

// ... existing code ...

// CLOUD SETTINGS LOGIC - SUPABASE

function toggleSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const content = document.getElementById('settings-modal-content');
    const urlInput = document.getElementById('supabase-url');
    const keyInput = document.getElementById('supabase-key');

    // Load current URL
    urlInput.value = localStorage.getItem('supabaseUrl') || '';
    keyInput.value = localStorage.getItem('supabaseKey') || '';

    const statusDiv = document.getElementById('sync-status');
    if (localStorage.getItem('supabaseUrl')) {
        statusDiv.innerHTML = "✅ <b>Đã lưu cấu hình.</b> (Bấm 'Kiểm tra' để test lại)";
        statusDiv.className = "text-xs text-emerald-400";
    } else {
        statusDiv.textContent = "Chưa kết nối Supabase";
        statusDiv.className = "text-xs text-gray-500";
    }

    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
        }, 10);
    } else {
        modal.classList.add('opacity-0');
        content.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

async function testSupabaseConnectionUI() {
    const url = document.getElementById('supabase-url').value.trim();
    const key = document.getElementById('supabase-key').value.trim();
    if (!url || !key) {
        showToast("Vui lòng nhập cả Supabase URL và Anon Key!");
        return;
    }

    const statusDiv = document.getElementById('sync-status');
    statusDiv.textContent = "⏳ Đang kết nối Supabase...";
    statusDiv.className = "text-xs text-yellow-400";

    try {
        const isInit = initSupabase(url, key);
        if (!isInit) throw new Error("URL hoặc Key không hợp lệ.");

        const cloudData = await loadFromSupabase();

        statusDiv.innerHTML = `✅ <b>Kết nối thành công!</b>`;
        statusDiv.className = "text-xs text-emerald-400";

        if (cloudData && cloudData.students && cloudData.students.length > 0) {
            db = cloudData;
            showToast(`Đã đồng bộ ${db.students.length} học sinh từ Supabase!`);
        } else {
            // First time setup: Push local data to Supabase
            statusDiv.innerHTML += `<br>Supabase đang trống. Đang đẩy dữ liệu lên...`;
            await syncToSupabase(db);
            showToast("Đã đẩy dữ liệu local lên bản lưu trên Supabase.");
        }

        updateStats(); // Update UI count
        renderGrid(document.getElementById('search-input').value);

        // Save settings locally
        localStorage.setItem('supabaseUrl', url);
        localStorage.setItem('supabaseKey', key);
        localStorage.setItem('local_db_cache', JSON.stringify(db));

        setTimeout(() => toggleSettingsModal(), 1500);
    } catch (e) {
        console.error("Test connection err:", e);
        statusDiv.innerHTML = "❌ <b>Lỗi Kết Nối!</b><br>" + e.message;
        statusDiv.className = "text-xs text-red-400";
    }
}

async function saveData(silent = false) {
    const btn = document.getElementById('save-btn');
    if (!silent && btn) {
        btn.innerHTML = '<span>⏳...</span>';
        btn.disabled = true;
    }

    try {
        if (!silent) {
            recordAttendanceLog();
        }

        // 1. Save to Local Cache (Browser)
        try {
            localStorage.setItem('local_db_cache', JSON.stringify(db));
        } catch (sErr) { }

        // 2. Sync to Supabase
        if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
            await syncToSupabase(db);
            if (!silent) showToast("Đã lưu (Supabase)!");
        } else {
            if (!silent) showToast("Đã lưu (Máy này)");
        }
    } catch (e) {
        alert('Lỗi lưu: ' + e.message);
    } finally {
        if (!silent && btn) {
            btn.innerHTML = '<span>💾 Lưu</span>';
            btn.disabled = false;
        }
    }
}

// Filter Mode
let currentFilterMode = 'all'; // 'all', 'absent', 'present'

function setFilterMode(mode) {
    currentFilterMode = mode;

    // Update UI Buttons
    const btnAll = document.getElementById('filter-all');
    const btnPresent = document.getElementById('filter-present');
    const btnAbsent = document.getElementById('filter-absent');

    // Reset defaults (inactive state)
    const baseClass = 'px-3 py-2 rounded-lg text-xs font-bold transition';
    const inactiveClass = `${baseClass} text-gray-400 hover:text-white`;

    btnAll.className = inactiveClass;
    if (btnPresent) btnPresent.className = inactiveClass;
    btnAbsent.className = inactiveClass;

    // Active State
    if (mode === 'all') {
        btnAll.className = `${baseClass} bg-gray-600 text-white shadow-sm`;
    } else if (mode === 'present') {
        if (btnPresent) btnPresent.className = `${baseClass} bg-green-500/20 text-green-300 border border-green-500/30 shadow-sm`;
    } else if (mode === 'absent') {
        btnAbsent.className = `${baseClass} bg-red-500/20 text-red-300 border border-red-500/30 shadow-sm`;
    }

    renderGrid(document.getElementById('search-input').value);
}

function updateStats() {
    const total = db.students.length;
    const present = db.students.filter(s => s.status === STATUS.PRESENT).length;

    document.getElementById('total-count').textContent = total;
    const presentEl = document.getElementById('present-count');
    if (presentEl) presentEl.textContent = present;
}

function getAvatarGradient(name) {
    // Generate a consistent pseudo-random gradient based on name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hues = [
        ['from-red-500', 'to-orange-500'],
        ['from-orange-500', 'to-yellow-500'],
        ['from-yellow-400', 'to-lime-500'],
        ['from-green-500', 'to-emerald-500'],
        ['from-teal-500', 'to-cyan-500'],
        ['from-sky-500', 'to-blue-500'],
        ['from-indigo-500', 'to-violet-500'],
        ['from-purple-500', 'to-fuchsia-500'],
        ['from-pink-500', 'to-rose-500']
    ];

    const pair = hues[Math.abs(hash) % hues.length];
    return `bg-gradient-to-br ${pair[0]} ${pair[1]}`;
}

function getInitials(name) {
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0][0];
    return parts[parts.length - 1][0] || '?';
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 2000);
}

// ===================================================================
// POINTS (THI ĐUA) MANAGEMENT
// ===================================================================
let activePointsStudentId = null;
let tempPoints = null;

function openPointsModal(id) {
    const student = db.students.find(s => s.id === id);
    if (!student) return;

    activePointsStudentId = id;

    // Load existing data or defaults
    const existing = student.points || {};
    tempPoints = {
        violations: JSON.parse(JSON.stringify(existing.violations || { '1-1': [], '1-2': [] })),
        scores: Object.assign({ '2-1': 0, '2-2': 0, '2-3': 0, '3-1': 0, '3-2': 0, '3-3': 0, '3-4': 0 }, existing.scores || {})
    };

    document.getElementById('points-student-id').value = id;
    document.getElementById('points-student-name').textContent = student.name;

    // Reset sliders & displays
    ['2-1', '2-2', '2-3', '3-1', '3-2', '3-3', '3-4'].forEach(k => {
        const slider = document.getElementById('sc-slider' + k);
        const val = tempPoints.scores[k] || 0;
        if (slider) slider.value = val;
        const display = document.getElementById('sc-sdisplay' + k);
        if (display) display.textContent = val + '/10';
        const valEl = document.getElementById('sc-val' + k);
        if (valEl) valEl.textContent = val;
    });

    // Reset accordion
    [1, 2, 3].forEach(i => {
        const body = document.getElementById('sc-body' + i);
        const arrow = document.getElementById('sc-arrow' + i);
        if (body) body.style.maxHeight = '0';
        if (arrow) arrow.style.transform = '';
    });
    ['1-1', '1-2', '2-1', '2-2', '2-3', '3-1', '3-2', '3-3', '3-4'].forEach(k => {
        const el = document.getElementById('sc-crit' + k);
        if (el) el.style.maxHeight = '0';
    });

    // Render violations
    renderScoringViolations('1-1', 'Nghỉ có phép', 5);
    renderScoringViolations('1-2', 'Nghỉ không phép', 10);

    // Load ghi chú
    const notesEl = document.getElementById('sc-notes');
    if (notesEl) notesEl.value = (existing.notes || '');

    updateScoringDisplay();

    const modal = document.getElementById('points-modal');
    const content = document.getElementById('points-modal-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    }, 10);
}

function closePointsModal() {
    const modal = document.getElementById('points-modal');
    const content = document.getElementById('points-modal-content');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// Toggle accordion danh mục
function toggleScoringCat(num) {
    const body = document.getElementById('sc-body' + num);
    const arrow = document.getElementById('sc-arrow' + num);
    const isOpen = body.style.maxHeight !== '0px' && body.style.maxHeight !== '';
    // Close all
    [1, 2, 3].forEach(i => {
        const b = document.getElementById('sc-body' + i);
        const a = document.getElementById('sc-arrow' + i);
        if (b) b.style.maxHeight = '0';
        if (a) a.style.transform = '';
    });
    if (!isOpen) {
        body.style.maxHeight = '600px';
        arrow.style.transform = 'rotate(180deg)';
    }
}

// Toggle tiêu chí con
function toggleScoringCriteria(criteriaId) {
    const el = document.getElementById('sc-crit' + criteriaId);
    if (!el) return;
    const isOpen = el.style.maxHeight !== '0px' && el.style.maxHeight !== '';
    el.style.maxHeight = isOpen ? '0' : '400px';
}

// Render danh sách vi phạm
function renderScoringViolations(criteriaId, label, points) {
    const container = document.getElementById('sc-vlist' + criteriaId);
    if (!container) return;
    const list = (tempPoints.violations || {})[criteriaId] || [];
    container.innerHTML = list.map((v, idx) => `
        <div style="background:rgba(255,193,7,.08); border:1px solid rgba(255,193,7,.2); border-radius:6px; padding:7px 10px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; font-size:12px;">
            <div>
                <div style="color:#e0e0e0;">${label} – Lần ${idx + 1}</div>
                <div style="color:#90a4ae; font-size:11px;">${v.time}</div>
            </div>
            <button onclick="removeScoringViolation(event,'${criteriaId}',${v.id},'${label}',${points})" style="background:rgba(239,83,80,.2); border:none; color:#ef5350; width:22px; height:22px; border-radius:4px; cursor:pointer; font-size:13px;">✕</button>
        </div>
    `).join('');
    // Update count display
    const valEl = document.getElementById('sc-val' + criteriaId);
    if (valEl) valEl.textContent = list.length;
}

// Thêm vi phạm
function addScoringViolation(event, criteriaId, points, label) {
    event.preventDefault();
    event.stopPropagation();
    if (!tempPoints.violations[criteriaId]) tempPoints.violations[criteriaId] = [];
    tempPoints.violations[criteriaId].push({
        id: Date.now(),
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    });
    renderScoringViolations(criteriaId, label, points);
    updateScoringDisplay();
}

// Xóa vi phạm
function removeScoringViolation(event, criteriaId, violationId, label, points) {
    event.preventDefault();
    event.stopPropagation();
    tempPoints.violations[criteriaId] = (tempPoints.violations[criteriaId] || []).filter(v => v.id !== violationId);
    renderScoringViolations(criteriaId, label, points);
    updateScoringDisplay();
}

// Cập nhật slider
function updateScoringSlider(criteriaId, max) {
    const slider = document.getElementById('sc-slider' + criteriaId);
    if (!slider) return;
    const val = parseInt(slider.value);
    tempPoints.scores[criteriaId] = val;
    const display = document.getElementById('sc-sdisplay' + criteriaId);
    if (display) display.textContent = val + '/' + max;
    const valEl = document.getElementById('sc-val' + criteriaId);
    if (valEl) valEl.textContent = val;
    updateScoringDisplay();
}

// Tính và cập nhật hiển thị điểm
function updateScoringDisplay() {
    const v = tempPoints.violations || {};
    const s = tempPoints.scores || {};

    // Cat1 = 30 - violations
    const cat1 = Math.max(0, 30 - ((v['1-1'] || []).length * 5) - ((v['1-2'] || []).length * 10));
    // Cat2 = sum sliders
    const cat2 = Math.min(30, (s['2-1'] || 0) + (s['2-2'] || 0) + (s['2-3'] || 0));
    // Cat3 = sum sliders
    const cat3 = Math.min(40, (s['3-1'] || 0) + (s['3-2'] || 0) + (s['3-3'] || 0) + (s['3-4'] || 0));
    const total = cat1 + cat2 + cat3;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('sc-total', total);
    set('sc-cat1', cat1); set('sc-score1', cat1);
    set('sc-cat2', cat2); set('sc-score2', cat2);
    set('sc-cat3', cat3); set('sc-score3', cat3);
}

// Reset toàn bộ
function resetScoring() {
    tempPoints.violations = { '1-1': [], '1-2': [] };
    tempPoints.scores = { '2-1': 0, '2-2': 0, '2-3': 0, '3-1': 0, '3-2': 0, '3-3': 0, '3-4': 0 };
    ['2-1', '2-2', '2-3', '3-1', '3-2', '3-3', '3-4'].forEach(k => {
        const slider = document.getElementById('sc-slider' + k);
        if (slider) slider.value = 0;
        const display = document.getElementById('sc-sdisplay' + k);
        if (display) display.textContent = '0/10';
        const valEl = document.getElementById('sc-val' + k);
        if (valEl) valEl.textContent = 0;
    });
    renderScoringViolations('1-1', 'Nghỉ có phép', 5);
    renderScoringViolations('1-2', 'Nghỉ không phép', 10);
    updateScoringDisplay();
}

async function savePoints() {
    if (!activePointsStudentId || !tempPoints) {
        closePointsModal();
        return;
    }
    const v = tempPoints.violations || {};
    const s = tempPoints.scores || {};
    const cat1 = Math.max(0, 30 - ((v['1-1'] || []).length * 5) - ((v['1-2'] || []).length * 10));
    const cat2 = Math.min(30, (s['2-1'] || 0) + (s['2-2'] || 0) + (s['2-3'] || 0));
    const cat3 = Math.min(40, (s['3-1'] || 0) + (s['3-2'] || 0) + (s['3-3'] || 0) + (s['3-4'] || 0));
    const total = cat1 + cat2 + cat3;

    const student = db.students.find(s => s.id === activePointsStudentId);
    if (student) {
        student.points = {
            current: total,
            violations: tempPoints.violations,
            scores: tempPoints.scores,
            notes: (document.getElementById('sc-notes') || {}).value || ''
        };

        // Cập nhật snapshot hiện tại để khi xuất báo cáo thi đua không bị mất điểm
        const currentWeekStr = getISOWeek(new Date());
        if (db.weekly_snapshots) {
            const currentSnap = db.weekly_snapshots.find(snap => snap.week === currentWeekStr);
            if (currentSnap) {
                currentSnap.scores[student.id] = calcStudentScores(student);
            }
        }

        await saveData(true);
        renderGrid(document.getElementById('search-input').value);
        showToast('Đã lưu điểm: ' + total + '/100');
        playSound('success');
    }
    closePointsModal();
}

// ===================================================================
// THEME MANAGEMENT
// ===================================================================

function loadTheme() {
    // Apply theme to document
    const themeName = `${currentThemeMode}-${currentThemeColor}`;
    document.documentElement.setAttribute('data-theme', themeName);

    // Update UI state
    updateThemeUI();
}

function setThemeMode(mode) {
    currentThemeMode = mode;
    localStorage.setItem('themeMode', mode);

    // Update button states
    document.getElementById('mode-dark').classList.toggle('active', mode === 'dark');
    document.getElementById('mode-light').classList.toggle('active', mode === 'light');

    // Apply theme
    loadTheme();

    const modeText = mode === 'dark' ? 'Tối' : 'Sáng';
    showToast(`Đã chuyển sang chế độ ${modeText}`);
}

function setThemeColor(color) {
    currentThemeColor = color;
    localStorage.setItem('themeColor', color);

    // Update active state on theme cards
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.toggle('active', card.dataset.theme === color);
    });

    // Apply theme
    loadTheme();

    const colorNames = {
        'blue': 'Xanh Dương',
        'purple': 'Tím',
        'green': 'Xanh Lá',
        'red': 'Đỏ'
    };
    showToast(`Đã đổi màu: ${colorNames[color]}`);
}

function updateThemeUI() {
    // Update mode toggle
    document.getElementById('mode-dark')?.classList.toggle('active', currentThemeMode === 'dark');
    document.getElementById('mode-light')?.classList.toggle('active', currentThemeMode === 'light');

    // Update theme cards
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.toggle('active', card.dataset.theme === currentThemeColor);
    });
}

function toggleThemeModal() {
    const modal = document.getElementById('theme-modal');
    const content = document.getElementById('theme-modal-content');

    if (modal.classList.contains('hidden')) {
        // Update UI before showing
        updateThemeUI();

        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
        }, 10);
    } else {
        modal.classList.add('opacity-0');
        content.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

// ==========================================
// WEEKLY SNAPSHOT SYSTEM
// ==========================================

/** Trả về chuỗi ISO week: "2026-W09" */
function getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Tính điểm từ student.points object */
function calcStudentScores(s) {
    const p = s.points || {};
    let cat1 = 30, cat2 = 0, cat3 = 0;
    if (p.violations || p.scores) {
        const v = p.violations || {};
        const sc = p.scores || {};
        cat1 = Math.max(0, 30 - ((v['1-1'] || []).length * 5) - ((v['1-2'] || []).length * 10));
        cat2 = Math.min(30, (sc['2-1'] || 0) + (sc['2-2'] || 0) + (sc['2-3'] || 0));
        cat3 = Math.min(40, (sc['3-1'] || 0) + (sc['3-2'] || 0) + (sc['3-3'] || 0) + (sc['3-4'] || 0));
    } else if (typeof p.current === 'number') {
        cat1 = Math.max(0, 30 + (p.chuyenCan || 0));
        cat2 = Math.max(0, p.yThuc || 0);
        cat3 = Math.max(0, p.trinhDo || 0);
    }
    const total = cat1 + cat2 + cat3;
    return { total, cat1, cat2, cat3 };
}

/** Tự động lưu snapshot tuần nếu chưa có */
async function saveWeeklySnapshot() {
    if (!db || !db.students) return;
    const now = new Date();
    const currentWeek = getISOWeek(now);
    const dateStr = now.toLocaleDateString('vi-VN');

    // Kiểm tra đã có snapshot tuần này chưa
    if (!db.weekly_snapshots) db.weekly_snapshots = [];
    const exists = db.weekly_snapshots.some(snap => snap.week === currentWeek);
    if (exists) return; // Đã lưu tuần này rồi

    // Tạo snapshot mới
    const scores = {};
    db.students.forEach(s => {
        scores[s.id] = calcStudentScores(s);
    });

    db.weekly_snapshots.push({ week: currentWeek, date: dateStr, scores });

    // Giữ tối đa 15 tháng (60 tuần)
    if (db.weekly_snapshots.length > 60) {
        db.weekly_snapshots = db.weekly_snapshots.slice(-60);
    }

    await saveData(true);
    console.log(`[Snapshot] Đã lưu tuần ${currentWeek} (${dateStr})`);
}

// ==========================================
// XUẤT BÁO CÁO ĐIỂM THI ĐUA
// ==========================================
function exportScoreReport(months) {
    if (!db || !db.students || db.students.length === 0) {
        showToast('Không có dữ liệu học sinh!');
        return;
    }

    const groupMap = { nhom_1: 'Nhom 1', nhom_2: 'Nhom 2', nhom_3: 'Nhom 3' };
    const nowDate = new Date();
    let rows = [];
    let reportTitle = '';
    let weekCount = 0;

    if (months && db.weekly_snapshots && db.weekly_snapshots.length > 0) {
        // --- TÍNH ĐIỂM TRUNG BÌNH CÁC TUẦN ---
        const cutoff = new Date(nowDate);
        cutoff.setMonth(cutoff.getMonth() - months);

        const relevantSnaps = db.weekly_snapshots.filter(snap => {
            // Parse date "DD/MM/YYYY"
            const parts = snap.date.split('/');
            if (parts.length < 3) return false;
            const snapDate = new Date(parts[2], parts[1] - 1, parts[0]);
            return snapDate >= cutoff;
        });

        weekCount = relevantSnaps.length;

        if (weekCount === 0) {
            showToast('Chua co du lieu trong khoang thoi gian nay!');
            return;
        }

        reportTitle = months + ' Thang Gan Nhat (' + weekCount + ' tuan)';

        // Gom điểm từng tuần theo student ID
        const studentTotals = {};
        relevantSnaps.forEach(snap => {
            Object.keys(snap.scores || {}).forEach(sid => {
                if (!studentTotals[sid]) studentTotals[sid] = { sumTotal: 0, sumCat1: 0, sumCat2: 0, sumCat3: 0, count: 0 };
                const sc = snap.scores[sid];
                studentTotals[sid].sumTotal += sc.total || 0;
                studentTotals[sid].sumCat1 += sc.cat1 || 0;
                studentTotals[sid].sumCat2 += sc.cat2 || 0;
                studentTotals[sid].sumCat3 += sc.cat3 || 0;
                studentTotals[sid].count++;
            });
        });

        rows = db.students.map(s => {
            const agg = studentTotals[s.id];
            let total = 0, cat1 = 0, cat2 = 0, cat3 = 0;
            if (agg && agg.count > 0) {
                total = Math.round(agg.sumTotal / agg.count);
                cat1 = Math.round(agg.sumCat1 / agg.count);
                cat2 = Math.round(agg.sumCat2 / agg.count);
                cat3 = Math.round(agg.sumCat3 / agg.count);
            }
            let rank = total >= 90 ? 'Xuat Sac' : total >= 75 ? 'Tot' : total >= 60 ? 'Kha' : total >= 45 ? 'Trung Binh' : 'Yeu';
            return { name: s.name, group: groupMap[s.group] || s.group || 'Nhom 1', total, cat1, cat2, cat3, rank };
        });

    } else {
        // --- DÙNG ĐIỂM HIỆN TẠI (không có snapshot) ---
        reportTitle = 'Hien Tai';
        rows = db.students.map(s => {
            const sc = calcStudentScores(s);
            let rank = sc.total >= 90 ? 'Xuat Sac' : sc.total >= 75 ? 'Tot' : sc.total >= 60 ? 'Kha' : sc.total >= 45 ? 'Trung Binh' : 'Yeu';
            return { name: s.name, group: groupMap[s.group] || s.group || 'Nhom 1', ...sc, rank };
        });
    }

    rows.sort((a, b) => b.total - a.total);
    rows.forEach((r, i) => { r.stt = i + 1; });

    const BOM = '\uFEFF';
    const dateStr = nowDate.toLocaleDateString('vi-VN');
    const m = nowDate.getMonth() + 1;
    const y = nowDate.getFullYear();

    const subHeader = weekCount > 0
        ? 'Diem trung binh ' + weekCount + ' tuan trong ' + months + ' thang gan nhat'
        : 'Diem hien tai (chua co du lieu theo tuan)';

    const csvLines = [
        'Bao Cao Diem Thi Dua - ' + dateStr,
        subHeader,
        '',
        'STT,Ho Ten,Nhom,Chuyen Can (/30),Y Thuc (/30),Chuyen Mon (/40),Trung Binh (/100),Xep Loai',
        ...rows.map(r => [
            r.stt,
            '"' + r.name + '"',
            r.group,
            r.cat1,
            r.cat2,
            r.cat3,
            r.total,
            r.rank
        ].join(','))
    ];

    const csvContent = BOM + csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'BaoCaoThiDua_' + reportTitle.replace(/ /g, '_') + '_T' + m + '-' + y + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Da xuat ' + rows.length + ' HS - ' + reportTitle);
    playSound('success');
}

// ==========================================
// XUẤT TOÀN BỘ DANH SÁCH (DỮ LIỆU GỐC)
// ==========================================
function exportDatabaseCSV() {
    if (!db || !db.students || db.students.length === 0) {
        showToast('Không có dữ liệu học sinh!');
        return;
    }

    const groupMap = { nhom_1: 'Nhóm 1', nhom_2: 'Nhóm 2', nhom_3: 'Nhóm 3' };
    const nowDate = new Date();
    const dateStr = nowDate.toLocaleDateString('vi-VN').replace(/\//g, '-');
    const BOM = '\uFEFF';

    const csvLines = [
        'Danh Sach Hoc Sinh Vo Duong - ' + dateStr,
        '',
        'STT,ID,Ho Ten,Nhom,Nam Sinh,So Dien Thoai,Trang Thai'
    ];

    db.students.forEach((s, idx) => {
        const groupName = groupMap[s.group] || s.group || 'Nhóm 1';
        const statusStr = s.status === 'present' ? 'Co mat' : (s.status === 'absent' ? 'Vang' : 'Vang co phep');
        csvLines.push([
            idx + 1,
            s.id,
            '"' + s.name + '"',
            groupName,
            s.birth_year || '',
            '="' + (s.phone || '') + '"', // Format for Excel to preserve leading zero
            statusStr
        ].join(','));
    });

    const csvContent = BOM + csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DanhSachHocSinh_' + dateStr + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Đã xuất ' + db.students.length + ' HS ra file CSV!');
    playSound('success');
}

// ==========================================
// DAY FILTER SYSTEM
// ==========================================

function setDayFilter(day) {
    currentDayFilter = day;
    updateDayFilterUI();
    filteredStudentsCache = null; // Invalidate cache
    currentPage = 1;
    renderGrid(document.getElementById('search-input').value);
}

function updateDayFilterUI() {
    const activeClass = ['bg-purple-500/20', 'text-purple-300', 'border-purple-500/40'];
    const inactiveClass = ['bg-gray-800', 'text-gray-400', 'border-gray-700'];

    const allDays = [null, 2, 3, 4, 5, 6, 7];
    const ids = ['day-btn-all', 'day-btn-2', 'day-btn-3', 'day-btn-4', 'day-btn-5', 'day-btn-6', 'day-btn-7'];

    ids.forEach((id, i) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const isActive = allDays[i] === currentDayFilter;
        if (isActive) {
            btn.classList.remove(...inactiveClass);
            btn.classList.add(...activeClass);
        } else {
            btn.classList.remove(...activeClass);
            btn.classList.add(...inactiveClass);
        }
    });

    // Update button text with count
    const days = [2, 3, 4, 5, 6, 7];
    days.forEach(d => {
        const btn = document.getElementById('day-btn-' + d);
        if (!btn) return;
        if (!db || !db.students) return;
        const count = db.students.filter(s => {
            if ((s.group || 'nhom_1') !== currentGroup) return false;
            const sched = s.schedule;
            if (!sched || sched.length === 0) return false;
            return sched.includes(d);
        }).length;
        const dayNames = { 2: 'Thu 2', 3: 'Thu 3', 4: 'Thu 4', 5: 'Thu 5', 6: 'Thu 6', 7: 'Thu 7' };
        btn.textContent = count > 0 ? dayNames[d] + ' (' + count + ')' : dayNames[d];
    });
}

// ==========================================
// BULK SCHEDULE MODAL
// ==========================================

function openBulkScheduleModal() {
    if (selectedIds.size === 0) {
        showToast('Chua chon hoc sinh nao!');
        return;
    }
    document.getElementById('bulk-schedule-count').textContent = selectedIds.size;
    // Reset checkboxes
    document.querySelectorAll('.bulk-sch-cb').forEach(cb => cb.checked = false);

    const modal = document.getElementById('bulk-schedule-modal');
    const content = document.getElementById('bulk-schedule-modal-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    }, 10);
}

function closeBulkScheduleModal() {
    const modal = document.getElementById('bulk-schedule-modal');
    const content = document.getElementById('bulk-schedule-modal-content');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function confirmBulkSchedule() {
    const days = [];
    document.querySelectorAll('.bulk-sch-cb').forEach(cb => {
        if (cb.checked) days.push(parseInt(cb.value));
    });

    db.students.forEach(s => {
        if (selectedIds.has(s.id)) {
            s.schedule = [...days];
        }
    });

    await saveData(true);
    closeBulkScheduleModal();
    selectedIds.clear();
    toggleEditMode();
    updateDayFilterUI();
    showToast('Da gan lich: ' + (days.length > 0 ? days.map(d => 'Thu ' + d).join(', ') : 'Tat ca ngay'));
    playSound('success');
}

// ==========================================
// HỆ THỐNG BÁO CÁO ĐIỂM DANH
// ==========================================

/**
 * Ghi một bản ghi điểm danh vào attendance_log.
 * Mỗi lần LƯU thủ công sẽ tạo/cập nhật bản ghi của ngày hôm nay.
 */
function recordAttendanceLog() {
    if (!db.students || db.students.length === 0) return;

    if (!db.attendance_history) db.attendance_history = [];

    const today = new Date();
    // Chuẩn hoá ngày thành YYYY-MM-DD để dễ so sánh và sort
    const dateKey = today.toISOString().slice(0, 10); // "2026-03-01"
    const displayDate = today.toLocaleDateString('vi-VN'); // "01/03/2026"

    // Tạo bản ghi điểm danh hôm nay
    const records = {};
    db.students.forEach(s => {
        records[s.id] = s.status || 'absent';
    });

    // Tìm và cập nhật nếu đã có record hôm nay, hoặc tạo mới
    const existingIdx = db.attendance_history.findIndex(r => r.dateKey === dateKey);
    const logEntry = {
        dateKey,
        date: displayDate,
        timestamp: today.toISOString(),
        records
    };

    if (existingIdx >= 0) {
        db.attendance_history[existingIdx] = logEntry;
    } else {
        db.attendance_history.push(logEntry);
    }

    // Giới hạn tối đa 400 bản ghi (~1 năm rưỡi nếu học 5 buổi/tuần)
    if (db.attendance_history.length > 400) {
        db.attendance_history = db.attendance_history.slice(-400);
    }

    console.log(`[Attendance Log] Đã ghi buổi ${displayDate} (${Object.values(records).filter(v => v === 'present').length} có mặt)`);
}

// --- Biến trạng thái cho modal báo cáo ---
let _attReportData = []; // Dữ liệu báo cáo hiện tại để xuất CSV
let _attCurrentPreset = 1; // Preset đang chọn (0=custom, 1,2,3=months)
let _attFromDate = null;
let _attToDate = null;

/**
 * Mở modal báo cáo điểm danh, load preset theo số tháng (0 = tùy chọn)
 */
function openAttendanceReportModal(months) {
    const modal = document.getElementById('attendance-report-modal');
    const content = document.getElementById('attendance-report-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    }, 10);

    // Thiết lập preset
    setAttendancePreset(months);
}

function closeAttendanceReportModal() {
    const modal = document.getElementById('attendance-report-modal');
    const content = document.getElementById('attendance-report-content');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

/**
 * Chọn preset thời gian (0=tùy chọn, 1/2/3=tháng)
 */
function setAttendancePreset(months) {
    _attCurrentPreset = months;

    // Cập nhật UI nút preset
    [0, 1, 2, 3].forEach(m => {
        const btn = document.getElementById('att-preset-' + m);
        if (!btn) return;
        if (m === months) {
            btn.className = 'att-preset-btn px-3 py-1.5 rounded-lg text-xs font-bold border transition bg-blue-500/20 text-blue-300 border-blue-500/40';
        } else {
            btn.className = 'att-preset-btn px-3 py-1.5 rounded-lg text-xs font-bold border transition bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700';
        }
    });

    const customDiv = document.getElementById('att-custom-date');

    if (months === 0) {
        // Hiện ô nhập tùy chọn
        customDiv.classList.remove('hidden');
        // Set default: từ đầu tháng đến hôm nay
        const now = new Date();
        const toStr = now.toISOString().slice(0, 10);
        const fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const fromStr = fromDate.toISOString().slice(0, 10);
        document.getElementById('att-from-date').value = fromStr;
        document.getElementById('att-to-date').value = toStr;
        document.getElementById('att-summary-line').textContent = 'Chọn khoảng ngày rồi nhấn "Xem Báo Cáo"';
        // Không tự generate, chờ user nhấn nút
    } else {
        customDiv.classList.add('hidden');
        // Tính khoảng ngày tự động
        const now = new Date();
        const fromDate = new Date(now);
        fromDate.setMonth(fromDate.getMonth() - months);
        _attFromDate = fromDate;
        _attToDate = now;
        generateAttendanceReport();
    }
}

/**
 * Tính số tuần vắng và tổng buổi thiếu theo quy tắc:
 * Mỗi tuần cần đi tối thiểu 3 buổi. Đi < 3 buổi → vắng tuần đó.
 * shortfall = 3 - (present + excused) nếu < 3, else 0
 */
function calculateAbsenceStats(logs) {
    // weekMap[studentId][isoWeek] = số buổi đi học
    const weekMap = {};

    logs.forEach(log => {
        const dateKey = log.dateKey; // "YYYY-MM-DD"
        const week = getISOWeek(new Date(dateKey + 'T12:00:00'));

        Object.entries(log.records || {}).forEach(([sid, status]) => {
            if (!weekMap[sid]) weekMap[sid] = {};
            if (!weekMap[sid][week]) weekMap[sid][week] = 0;
            if (status === 'present' || status === 'excused') {
                weekMap[sid][week]++;
            }
        });
    });

    // Tổng hợp theo học sinh
    const result = {};
    Object.entries(weekMap).forEach(([sid, weeksObj]) => {
        let weeksAbsent = 0;
        let shortfallSessions = 0;
        Object.values(weeksObj).forEach(attended => {
            if (attended < 3) {
                weeksAbsent++;
                shortfallSessions += (3 - attended);
            }
        });
        result[sid] = { weeksAbsent, shortfallSessions, totalWeeks: Object.keys(weeksObj).length };
    });
    return result;
}

/**
 * Tạo và hiển thị báo cáo trong bảng
 */
function generateAttendanceReport() {
    // Nếu là tùy chọn, đọc từ input
    if (_attCurrentPreset === 0) {
        const fromVal = document.getElementById('att-from-date').value;
        const toVal = document.getElementById('att-to-date').value;
        if (!fromVal || !toVal) {
            showToast('Vui lòng chọn đầy đủ ngày từ/đến!');
            return;
        }
        _attFromDate = new Date(fromVal + 'T00:00:00');
        _attToDate = new Date(toVal + 'T23:59:59');
    }

    if (!db.attendance_history || db.attendance_history.length === 0) {
        showEmptyAttendanceReport('Chưa có dữ liệu. Hãy điểm danh và nhấn 💾 LƯU ít nhất một lần.');
        return;
    }

    // Lọc các bản ghi trong khoảng thời gian
    const relevantLogs = db.attendance_history.filter(log => {
        const logDate = new Date(log.dateKey + 'T00:00:00');
        return logDate >= _attFromDate && logDate <= _attToDate;
    });

    if (relevantLogs.length === 0) {
        showEmptyAttendanceReport(null);
        return;
    }

    // Đếm cho từng học sinh
    const studentStats = {};
    db.students.forEach(s => {
        studentStats[s.id] = { present: 0, excused: 0, absent: 0, total: 0 };
    });

    relevantLogs.forEach(log => {
        Object.entries(log.records || {}).forEach(([sid, status]) => {
            if (!studentStats[sid]) return;
            studentStats[sid].total++;
            if (status === 'present') studentStats[sid].present++;
            else if (status === 'excused') studentStats[sid].excused++;
            else studentStats[sid].absent++;
        });
    });

    // Tính thống kê vắng theo tuần
    const absenceStats = calculateAbsenceStats(relevantLogs);

    // Tạo dữ liệu và sort theo tên
    const groupMap = { nhom_1: 'Nhóm 1', nhom_2: 'Nhóm 2', nhom_3: 'Nhóm 3' };
    _attReportData = db.students
        .filter(s => (studentStats[s.id] && studentStats[s.id].total > 0))
        .map(s => {
            const st = studentStats[s.id];
            const abs = absenceStats[s.id] || { weeksAbsent: 0, shortfallSessions: 0, totalWeeks: 0 };
            const attended = st.present + st.excused;
            const pct = st.total > 0 ? Math.round((attended / st.total) * 100) : 0;
            return {
                id: s.id,
                name: s.name,
                group: groupMap[s.group] || s.group || 'Nhóm 1',
                present: st.present,
                excused: st.excused,
                absent: st.absent,
                total: st.total,
                pct,
                weeksAbsent: abs.weeksAbsent,
                shortfallSessions: abs.shortfallSessions,
                totalWeeks: abs.totalWeeks
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    if (_attReportData.length === 0) {
        showEmptyAttendanceReport(null);
        return;
    }

    // Cập nhật summary
    const fromStr = _attFromDate.toLocaleDateString('vi-VN');
    const toStr = _attToDate.toLocaleDateString('vi-VN');
    document.getElementById('att-summary-line').innerHTML =
        `<span class="text-blue-300 font-semibold">${relevantLogs.length} buổi học</span> từ <b>${fromStr}</b> đến <b>${toStr}</b> — ${_attReportData.length} học sinh có dữ liệu`;

    // Render bảng
    const tbody = document.getElementById('att-report-tbody');
    tbody.innerHTML = _attReportData.map((r, i) => {
        const pctColor = r.pct >= 80 ? 'text-emerald-400' : r.pct >= 60 ? 'text-yellow-400' : 'text-red-400';
        const wkColor = r.weeksAbsent === 0 ? 'text-emerald-400' : r.weeksAbsent <= 2 ? 'text-yellow-400' : 'text-red-400';
        const sfColor = r.shortfallSessions === 0 ? 'text-emerald-400' : r.shortfallSessions <= 3 ? 'text-yellow-400' : 'text-red-400';
        return `<tr class="hover:bg-white/5 transition">
            <td class="py-2 pr-3 text-gray-500 text-xs">${i + 1}</td>
            <td class="py-2 pr-3 font-medium text-white">${r.name}</td>
            <td class="py-2 pr-3 text-xs text-gray-400">${r.group}</td>
            <td class="py-2 text-center text-emerald-400 font-bold">${r.present}</td>
            <td class="py-2 text-center text-yellow-400 font-bold">${r.excused}</td>
            <td class="py-2 text-center text-red-400 font-bold">${r.absent}</td>
            <td class="py-2 text-center text-gray-300">${r.total}</td>
            <td class="py-2 text-center font-bold ${pctColor}">${r.pct}%</td>
            <td class="py-2 text-center font-bold ${wkColor}" title="Số tuần đi < 3 buổi / ${r.totalWeeks} tuần">${r.weeksAbsent > 0 ? r.weeksAbsent + ' tuần' : '✓'}</td>
            <td class="py-2 text-center font-bold ${sfColor}" title="Tổng số buổi thiếu trong kỳ">${r.shortfallSessions > 0 ? r.shortfallSessions + ' buổi' : '✓'}</td>
        </tr>`;
    }).join('');

    document.getElementById('att-report-table').classList.remove('hidden');
    document.getElementById('att-report-empty').classList.add('hidden');
    document.getElementById('att-export-btn').disabled = false;
}

function showEmptyAttendanceReport(msg) {
    document.getElementById('att-report-table').classList.add('hidden');
    const emptyEl = document.getElementById('att-report-empty');
    emptyEl.classList.remove('hidden');
    if (msg) {
        emptyEl.innerHTML = `<p class="text-2xl mb-2">📭</p><p>${msg}</p>`;
    }
    _attReportData = [];
    document.getElementById('att-summary-line').textContent = '';
    document.getElementById('att-export-btn').disabled = true;
}

/**
 * Xuất báo cáo điểm danh ra file CSV
 */
function exportAttendanceCsv() {
    if (!_attReportData || _attReportData.length === 0) {
        showToast('Không có dữ liệu để xuất!');
        return;
    }

    const fromStr = _attFromDate ? _attFromDate.toLocaleDateString('vi-VN') : '';
    const toStr = _attToDate ? _attToDate.toLocaleDateString('vi-VN') : '';
    const now = new Date();

    const BOM = '\uFEFF';
    const csvLines = [
        `Bao Cao Diem Danh - Tu ${fromStr} den ${toStr}`,
        `Xuat ngay: ${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN')}`,
        'Quy tac: moi tuan can di >= 3 buoi. Di < 3 buoi thi tinh la tuan vang.',
        '',
        'STT,Ho Ten,Nhom,Co Mat,Co Phep,Vang,Tong Buoi,% Di Hoc,Tuan Vang,Buoi Thieu'
    ];

    _attReportData.forEach((r, i) => {
        csvLines.push([
            i + 1,
            `"${r.name}"`,
            r.group,
            r.present,
            r.excused,
            r.absent,
            r.total,
            r.pct + '%',
            r.weeksAbsent || 0,
            r.shortfallSessions || 0
        ].join(','));
    });

    const csvContent = BOM + csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    a.download = `BaoCaoDiemDanh_T${m}-${y}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Đã xuất ${_attReportData.length} học sinh!`);
    playSound('success');
}

// ==========================================
// MODAL XUẤT PDF HÀNG LOẠT (CHỌN HỌC SINH)
// ==========================================

let _bulkPdfGroupFilter = 'all';
const _bulkPdfSelected = new Set(); // Set of student IDs

function openBulkPdfModal() {
    _bulkPdfGroupFilter = 'all';
    _bulkPdfSelected.clear();

    const modal = document.getElementById('bulk-pdf-modal');
    const content = document.getElementById('bulk-pdf-modal-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    }, 10);

    // Reset search
    const searchEl = document.getElementById('bulk-pdf-search');
    if (searchEl) searchEl.value = '';

    // Reset group filter UI
    setBulkPdfGroupFilter('all');
    renderBulkPdfList();
}

function closeBulkPdfModal() {
    const modal = document.getElementById('bulk-pdf-modal');
    const content = document.getElementById('bulk-pdf-modal-content');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function setBulkPdfGroupFilter(group) {
    _bulkPdfGroupFilter = group;
    const groups = ['all', 'nhom_1', 'nhom_2', 'nhom_3'];
    groups.forEach(g => {
        const btn = document.getElementById('bpdf-g-' + g);
        if (!btn) return;
        if (g === group) {
            btn.className = 'px-3 py-1 rounded-lg text-xs font-bold transition border bg-orange-500/20 text-orange-300 border-orange-500/40';
        } else {
            btn.className = 'px-3 py-1 rounded-lg text-xs font-bold transition border bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700';
        }
    });
    renderBulkPdfList();
}

function renderBulkPdfList() {
    const searchEl = document.getElementById('bulk-pdf-search');
    const query = (searchEl ? searchEl.value : '').toLowerCase().trim();
    const container = document.getElementById('bulk-pdf-list');
    if (!container || !db || !db.students) return;

    const groupNames = { nhom_1: 'Nhóm 1', nhom_2: 'Nhóm 2', nhom_3: 'Nhóm 3' };

    const filtered = db.students.filter(s => {
        const matchGroup = _bulkPdfGroupFilter === 'all' || (s.group || 'nhom_1') === _bulkPdfGroupFilter;
        const matchSearch = !query || s.name.toLowerCase().includes(query);
        return matchGroup && matchSearch;
    }).sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">Không tìm thấy học sinh nào.</p>';
        return;
    }

    container.innerHTML = filtered.map(s => {
        const sc = calcStudentScores(s);
        const grp = groupNames[s.group] || 'Nhóm 1';
        const checked = _bulkPdfSelected.has(s.id) ? 'checked' : '';
        const scoreColor = sc.total >= 75 ? 'text-emerald-400' : sc.total >= 50 ? 'text-yellow-400' : 'text-red-400';
        return `<label class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition select-none border border-transparent hover:border-orange-500/20">
            <input type="checkbox" data-student-id="${s.id}" ${checked}
                onchange="toggleBulkPdfStudent('${s.id}', this.checked)"
                class="w-4 h-4 rounded accent-orange-500 cursor-pointer">
            <div class="w-8 h-8 rounded-full ${getAvatarGradient(s.name)} flex items-center justify-center text-white font-bold text-sm shrink-0">
                ${getInitials(s.name)}
            </div>
            <div class="flex-1 min-w-0">
                <div class="font-medium text-white text-sm truncate">${s.name}</div>
                <div class="text-xs text-gray-500">${grp}</div>
            </div>
            <div class="text-right shrink-0">
                <div class="text-xs font-bold ${scoreColor}">⭐ ${sc.total}/100</div>
            </div>
        </label>`;
    }).join('');

    updateBulkPdfCounter();
}

function toggleBulkPdfStudent(id, checked) {
    if (checked) {
        _bulkPdfSelected.add(id);
    } else {
        _bulkPdfSelected.delete(id);
    }
    updateBulkPdfCounter();
}

function selectAllBulkPdf(select) {
    // Only toggle visible/filtered students
    const checkboxes = document.querySelectorAll('#bulk-pdf-list input[type="checkbox"]');
    checkboxes.forEach(cb => {
        const id = cb.dataset.studentId;
        cb.checked = select;
        if (select) {
            _bulkPdfSelected.add(id);
        } else {
            _bulkPdfSelected.delete(id);
        }
    });
    updateBulkPdfCounter();
}

function updateBulkPdfCounter() {
    const countEl = document.getElementById('bulk-pdf-count');
    if (countEl) countEl.textContent = _bulkPdfSelected.size;
    const exportBtn = document.getElementById('bulk-pdf-export-btn');
    if (exportBtn) exportBtn.disabled = _bulkPdfSelected.size === 0;
}

function triggerBulkPdfExport() {
    if (_bulkPdfSelected.size === 0) {
        showToast('⚠️ Vui lòng chọn ít nhất 1 học sinh!');
        return;
    }
    const students = db.students
        .filter(s => _bulkPdfSelected.has(s.id))
        .map(mapStudentToExportFormat);

    closeBulkPdfModal();
    showToast(`⏳ Đang tạo ${students.length} PDF... Vui lòng đợi.`);
    exportMultipleStudentsToPDF(students);
}

// ==========================================


/**
 * Chuyển đổi cấu trúc dữ liệu học sinh của app sang định dạng mà pdfExporter.js cần.
 * App lưu: student.points.violations / student.points.scores (nested)
 * pdfExporter cần: student.absentWithPermission, student.skill1, ... (flat)
 */
function mapStudentToExportFormat(s) {
    const p = s.points || {};
    const v = p.violations || {};
    const sc = p.scores || {};

    // Chuyên Cần
    const absentWithPermission = (v['1-1'] || []).length;
    const absentWithoutPermission = (v['1-2'] || []).length;

    // Ý Thức – Kỷ Luật
    const conscience1 = sc['2-1'] || 0;
    const conscience2 = sc['2-2'] || 0;
    const conscience3 = sc['2-3'] || 0;

    // Chuyên Môn
    const skill1 = sc['3-1'] || 0;
    const skill2 = sc['3-2'] || 0;
    const skill3 = sc['3-3'] || 0;
    const skill4 = sc['3-4'] || 0;

    const groupNames = { nhom_1: 'Nhóm 1', nhom_2: 'Nhóm 2', nhom_3: 'Nhóm 3' };

    return {
        name: s.name || 'N/A',
        birthYear: s.birthYear || '',
        group: groupNames[s.group] || s.group || 'Nhóm 1',
        phone: s.phone || '',
        fromDate: null,
        toDate: null,
        absentWithPermission,
        absentWithoutPermission,
        conscience1,
        conscience2,
        conscience3,
        skill1,
        skill2,
        skill3,
        skill4,
        notes: s.notes || ''
    };
}

/**
 * Hàm wrapper: được gọi bởi nút "📄 PDF" trong Bảng Điểm Thị Đua Modal.
 * Lấy học sinh đang mở modal và xuất PDF.
 */
function getCurrentStudentData() {
    if (!activePointsStudentId) return null;
    const s = db.students.find(s => s.id === activePointsStudentId);
    if (!s) return null;
    return mapStudentToExportFormat(s);
}

/**
 * Hàm wrapper: được gọi bởi nút "📦 Xuất PDF" trong thanh Bulk Actions.
 * Lấy danh sách học sinh đang được chọn và xuất file ZIP.
 */
function getSelectedStudents() {
    return db.students
        .filter(s => selectedIds.has(s.id))
        .map(mapStudentToExportFormat);
}

/**
 * Khởi tạo tuần mới: Xóa toàn bộ điểm thi đua của tất cả học sinh
 * Thực hiện lưu snapshot trước khi xóa để sao lưu.
 */
async function resetWeeklyPoints() {
    if (!confirm('⚠️ CẢNH BÁO: Bạn có muốn KHỞI TẠO TUẦN MỚI không?\n\nHành động này sẽ mang ĐIỂM THI ĐUA CỦA TẤT CẢ TỪNG HỌC SINH về mặc định. (Chuyên cần: 30, các điểm khác: 0).\n\nHệ thống sẽ tự động sao lưu điểm hiện tại vào lịch sử tuần để bạn có thể xem lại trong báo cáo.')) {
        return;
    }

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) saveBtn.innerHTML = '<span>⏳...</span>', saveBtn.disabled = true;

    try {
        showToast('Đang lưu dữ liệu tuần cũ...');

        if (!db || !db.students) return;

        // Lưu snapshot tuần cũ
        await saveWeeklySnapshot();

        showToast('Đang xóa điểm thi đua...');

        // Reset điểm của tất cả học sinh
        db.students.forEach(s => {
            s.points = {
                current: 30, // Chuyên cần về định dạng
                violations: { '1-1': [], '1-2': [] },
                scores: { '2-1': 0, '2-2': 0, '2-3': 0, '3-1': 0, '3-2': 0, '3-3': 0, '3-4': 0 },
                notes: ''
            };
        });

        // Ghi đè file db.json. saveData(false) để đồng bộ và hiện tuỳ chọn Toast.
        await saveData(false);

        // Cập nhật lại list ở UI
        renderGrid(document.getElementById('search-input').value);
        showToast('✅ Đã khởi tạo tuần mới thành công!');
        playSound('success');

    } catch (e) {
        console.error(e);
        alert('Lỗi khi khởi tạo tuần mới: ' + e.message);
    } finally {
        if (saveBtn) saveBtn.innerHTML = '<span>💾 Lưu</span>', saveBtn.disabled = false;
    }
}

/**
 * Xuất PDF của học sinh đang mở trong modal điểm.
 * Gọi hàm từ pdfExporter.js.
 */
function exportCurrentStudentPDF() {
    const studentData = getCurrentStudentData();
    if (!studentData) {
        showToast('⚠️ Không tìm thấy dữ liệu học sinh.');
        return;
    }

    const now = new Date();
    const period = `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;

    // Gọi hàm từ pdfExporter.js
    exportStudentScoreToPDF(studentData, period);
}

/**
 * Xuất PDF hàng loạt cho các học sinh đang được chọn (Bulk Mode).
 * Kết quả đóng gói vào file ZIP. Gọi hàm từ pdfExporter.js.
 */
function exportSelectedStudentsPDF() {
    const students = getSelectedStudents();
    if (!students || students.length === 0) {
        showToast('⚠️ Vui lòng chọn ít nhất 1 học sinh.');
        return;
    }
    exportMultipleStudentsToPDF(students);
}
