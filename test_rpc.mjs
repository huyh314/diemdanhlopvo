import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eeiysbniiymmwvmtngkb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlaXlzYm5paXltbXd2bXRuZ2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDA4OTcsImV4cCI6MjA4OTY3Njg5N30.3oEWWWZYOlOvAo8_izFKJMh48vmvjN7HnYVTDqwqov0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing getGroupSummary...");
    let res = await supabase.rpc('fn_group_attendance_summary');
    if (res.error) console.error("Error in getGroupSummary:", res.error);
    else console.log("getGroupSummary success. Rows:", res.data?.length);

    console.log("Testing getStudentRankings...");
    res = await supabase.rpc('fn_student_rankings');
    if (res.error) console.error("Error in getStudentRankings:", res.error);
    else console.log("getStudentRankings success. Rows:", res.data?.length);

    console.log("Testing getAverageRankings...");
    res = await supabase.rpc('fn_student_average_rankings', { p_weeks: 4 });
    if (res.error) console.error("Error in getAverageRankings:", res.error);
    else console.log("getAverageRankings success. Rows:", res.data?.length);
}

test();
