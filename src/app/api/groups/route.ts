import { getGroups } from '@/lib/groups';

export async function GET() {
    try {
        return Response.json(await getGroups(), { headers: { 'Cache-Control': 'no-store' } });
    } catch {
        return Response.json({ error: 'Chưa tải được danh sách nhóm.' }, { status: 503 });
    }
}
