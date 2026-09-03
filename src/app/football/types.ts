export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW';

export interface Player {
    id: string;
    name: string;
    jerseyNumber: number;
    position: PlayerPosition;
    preferredFoot: 'Phải' | 'Trái' | 'Hai chân';
    parentPhone: string;
    remainingSessions: number;
    totalSessionsPack: number;
    notes?: string;
    avatar?: string;
    rating?: number;
}

export interface AttendanceRecord {
    date: string; // YYYY-MM-DD
    presentPlayerIds: string[];
    excusedPlayerIds: string[];
    mvpPlayerId?: string;
    matchScore?: {
        orangeTeamScore: number;
        blueTeamScore: number;
    };
    practiceNotes?: string;
}

export interface TeamSplit {
    orangeTeam: Player[];
    blueTeam: Player[];
}
