'use client';

import { useState } from 'react';
import ScoreModal from './ScoreModal';

import { useSoundEffects } from '@/hooks/useSoundEffects';

interface ScoreButtonProps {
    studentId: string;
    studentName: string;
    weekKey: string;
    autoChuyenCan: number;
}

export default function ScoreButton({ studentId, studentName, weekKey, autoChuyenCan }: ScoreButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { playClick } = useSoundEffects();

    return (
        <>
            <button
                onClick={() => {
                    playClick();
                    setIsOpen(true);
                }}
                className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg transition-colors shadow-[var(--glass-shadow)] text-xs font-semibold uppercase tracking-wide"
            >
                Chấm Điểm
            </button>

            {isOpen && (
                <ScoreModal
                    studentId={studentId}
                    studentName={studentName}
                    weekKey={weekKey}
                    autoChuyenCan={autoChuyenCan}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
