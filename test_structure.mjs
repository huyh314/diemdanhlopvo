import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eeiysbniiymmwvmtngkb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlaXlzYm5paXltbXd2bXRuZ2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDA4OTcsImV4cCI6MjA4OTY3Njg5N30.3oEWWWZYOlOvAo8_izFKJMh48vmvjN7HnYVTDqwqov0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const startDate = '2026-03-01';
    const endDate = '2026-04-01';

    console.log("Fetching actual data...");
    const { data, error } = await supabase
        .from('attendance')
        .select(`
            status,
            note,
            sessions!inner(session_date),
            students!inner(name, group_id)
        `)
        .gte('sessions.session_date', startDate)
        .lt('sessions.session_date', endDate)
        .order('session_date', { referencedTable: 'sessions', ascending: true })
        .limit(2);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Data structure:", JSON.stringify(data, null, 2));
    }
}

test();
