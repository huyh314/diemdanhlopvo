// =============================================
// SUPABASE CONFIG & HELPER FUNCTIONS
// Thay thế Google Sheets sync bằng Supabase
// =============================================

// Supabase client instance (initialized khi user config)
let supabaseClient = null;
let supabaseUrl = '';
let supabaseKey = '';

/**
 * Khởi tạo Supabase client
 */
function initSupabase(url, key) {
    if (!url || !key) return false;
    try {
        supabaseClient = supabase.createClient(url, key);
        supabaseUrl = url;
        supabaseKey = key;
        console.log('✅ Supabase client initialized:', url);
        return true;
    } catch (e) {
        console.error('❌ Failed to init Supabase:', e);
        return false;
    }
}

/**
 * Test kết nối Supabase
 */
async function testSupabaseConnection() {
    if (!supabaseClient) throw new Error('Supabase chưa được khởi tạo');

    // Try to query students table
    const { data, error } = await supabaseClient
        .from('students')
        .select('id')
        .limit(1);

    if (error) throw new Error('Lỗi kết nối: ' + error.message);
    return true;
}

// =============================================
// LOAD DATA FROM SUPABASE
// =============================================

/**
 * Load toàn bộ dữ liệu từ Supabase
 * Trả về object giống cấu trúc database.json
 */
async function loadFromSupabase() {
    if (!supabaseClient) return null;

    try {
        // Load students
        const { data: students, error: studentsErr } = await supabaseClient
            .from('students')
            .select('*')
            .order('created_at', { ascending: true });

        if (studentsErr) throw studentsErr;

        // Load attendance logs
        const { data: logs, error: logsErr } = await supabaseClient
            .from('attendance_logs')
            .select('*')
            .order('date_key', { ascending: true });

        if (logsErr) throw logsErr;

        // Load weekly snapshots
        const { data: snapshots, error: snapshotsErr } = await supabaseClient
            .from('weekly_snapshots')
            .select('*')
            .order('week_key', { ascending: true });

        if (snapshotsErr) throw snapshotsErr;

        // Load app config
        const { data: configRows, error: configErr } = await supabaseClient
            .from('app_config')
            .select('*');

        if (configErr) throw configErr;

        // Convert config rows to object
        const config = {};
        (configRows || []).forEach(row => {
            config[row.key] = row.value;
        });

        // Convert students from DB format to app format
        const appStudents = (students || []).map(s => ({
            id: s.id,
            name: s.name,
            group: s.group,
            avatar: s.avatar || '',
            birthYear: s.birth_year || '',
            phone: s.phone || '',
            status: s.status || 'absent',
            points: s.points || { current: 10 },
            schedule: s.schedule || []
        }));

        // Convert attendance logs from DB format
        const appLogs = (logs || []).map(l => ({
            dateKey: l.date_key,
            date: l.date_display,
            timestamp: l.recorded_at,
            records: l.records || {}
        }));

        // Convert snapshots
        const appSnapshots = (snapshots || []).map(s => ({
            week: s.week_key,
            data: s.snapshot_data || []
        }));

        return {
            students: appStudents,
            attendance_log: appLogs,
            weekly_snapshots: appSnapshots,
            date: config.current_date ? config.current_date.value : null,
            _source: 'supabase'
        };
    } catch (e) {
        console.error('❌ loadFromSupabase error:', e);
        throw e;
    }
}

// =============================================
// SYNC DATA TO SUPABASE
// =============================================

/**
 * Sync toàn bộ dữ liệu lên Supabase (upsert)
 * @param {Object} dbData - Dữ liệu app (cấu trúc database.json)
 */
async function syncToSupabase(dbData) {
    if (!supabaseClient) throw new Error('Supabase chưa được khởi tạo');

    try {
        // 1. Upsert students
        if (dbData.students && dbData.students.length > 0) {
            const dbStudents = dbData.students.map(s => ({
                id: s.id,
                name: s.name,
                group: s.group || 'nhom_1',
                avatar: s.avatar || '',
                birth_year: s.birthYear || '',
                phone: s.phone || '',
                status: s.status || 'absent',
                points: s.points || { current: 10 },
                schedule: s.schedule || []
            }));

            const { error: studentsErr } = await supabaseClient
                .from('students')
                .upsert(dbStudents, { onConflict: 'id' });

            if (studentsErr) throw new Error('Lỗi sync students: ' + studentsErr.message);

            // Delete students that are no longer in local DB
            const localIds = dbData.students.map(s => s.id);
            const { data: remoteStudents } = await supabaseClient
                .from('students')
                .select('id');

            if (remoteStudents) {
                const toDelete = remoteStudents
                    .filter(rs => !localIds.includes(rs.id))
                    .map(rs => rs.id);

                if (toDelete.length > 0) {
                    await supabaseClient
                        .from('students')
                        .delete()
                        .in('id', toDelete);
                }
            }
        }

        // 2. Upsert attendance logs
        const logs = dbData.attendance_log || [];
        if (logs.length > 0) {
            const dbLogs = logs.map(l => ({
                date_key: l.dateKey,
                date_display: l.date,
                recorded_at: l.timestamp || new Date().toISOString(),
                records: l.records || {}
            }));

            const { error: logsErr } = await supabaseClient
                .from('attendance_logs')
                .upsert(dbLogs, { onConflict: 'date_key' });

            if (logsErr) throw new Error('Lỗi sync attendance: ' + logsErr.message);
        }

        // 3. Upsert weekly snapshots
        const snapshots = dbData.weekly_snapshots || [];
        if (snapshots.length > 0) {
            const dbSnapshots = snapshots.map(s => ({
                week_key: s.week,
                snapshot_data: s.data || []
            }));

            const { error: snapErr } = await supabaseClient
                .from('weekly_snapshots')
                .upsert(dbSnapshots, { onConflict: 'week_key' });

            if (snapErr) throw new Error('Lỗi sync snapshots: ' + snapErr.message);
        }

        // 4. Save app config
        if (dbData.date) {
            const { error: configErr } = await supabaseClient
                .from('app_config')
                .upsert({
                    key: 'current_date',
                    value: { value: dbData.date }
                }, { onConflict: 'key' });

            if (configErr) console.warn('Config save warning:', configErr.message);
        }

        console.log('✅ Synced to Supabase successfully');
        return true;
    } catch (e) {
        console.error('❌ syncToSupabase error:', e);
        throw e;
    }
}

/**
 * Sync một bản ghi attendance log đơn lẻ
 */
async function syncAttendanceLogToSupabase(logEntry) {
    if (!supabaseClient) return;

    try {
        const { error } = await supabaseClient
            .from('attendance_logs')
            .upsert({
                date_key: logEntry.dateKey,
                date_display: logEntry.date,
                recorded_at: logEntry.timestamp || new Date().toISOString(),
                records: logEntry.records || {}
            }, { onConflict: 'date_key' });

        if (error) console.warn('Attendance log sync warning:', error.message);
    } catch (e) {
        console.warn('Failed to sync attendance log:', e);
    }
}
