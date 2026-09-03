import type { Metadata } from 'next';
import FootballClient from './FootballClient';

export const metadata: Metadata = {
    title: 'Điểm Danh Lớp Bóng Đá — Football Squad Manager',
    description: 'Ứng dụng điểm danh, chia 2 đội đối kháng và báo cáo Zalo tức thì cho lớp bóng đá',
};

export default function FootballPage() {
    return <FootballClient />;
}
