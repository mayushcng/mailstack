// =============================================================================
// Leaderboard Component - Professional Podium Style
// =============================================================================

import React from 'react';
import type { LeaderboardEntry } from '../../api/types';
import { formatCurrency } from '../../utils/formatters';
import { Icon, Icons } from '../Icon';

// Default avatars for leaderboard entries (diverse, professional photos)
const DEFAULT_AVATARS = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=96&h=96&fit=crop&crop=face',
];

interface LeaderboardProps {
    entries: LeaderboardEntry[];
    loading?: boolean;
}

// Crown SVG icon for 1st place
const CrownIcon: React.FC = () => (
    <svg className="podium-crown" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
);

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, loading = false }) => {
    if (loading) {
        return (
            <div className="podium-leaderboard">
                <div className="podium-header">
                    <span className="podium-trophy"><Icon name={Icons.trophy} size="lg" /></span>
                    <span>Top Earners</span>
                </div>
                <div className="podium-container">
                    <div className="podium-item podium-second">
                        <div className="podium-avatar-container">
                            <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%' }} />
                        </div>
                        <div className="skeleton" style={{ width: 60, height: 14, marginTop: 8 }} />
                        <div className="skeleton" style={{ width: 50, height: 18, marginTop: 4 }} />
                    </div>
                    <div className="podium-item podium-first">
                        <div className="podium-avatar-container">
                            <div className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%' }} />
                        </div>
                        <div className="skeleton" style={{ width: 70, height: 16, marginTop: 8 }} />
                        <div className="skeleton" style={{ width: 60, height: 22, marginTop: 4 }} />
                    </div>
                    <div className="podium-item podium-third">
                        <div className="podium-avatar-container">
                            <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%' }} />
                        </div>
                        <div className="skeleton" style={{ width: 60, height: 14, marginTop: 8 }} />
                        <div className="skeleton" style={{ width: 50, height: 18, marginTop: 4 }} />
                    </div>
                </div>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="podium-leaderboard">
                <div className="podium-header">
                    <span className="podium-trophy"><Icon name={Icons.trophy} size="lg" /></span>
                    <span>Top Earners</span>
                </div>
                <div className="text-center text-tertiary py-6">
                    No data available yet
                </div>
            </div>
        );
    }

    // Pad to 3 entries if needed
    const paddedEntries = [...entries];
    while (paddedEntries.length < 3) {
        paddedEntries.push({
            rank: paddedEntries.length + 1,
            supplierId: '',
            supplierName: '-',
            totalEarnings: 0,
        });
    }

    const first = paddedEntries.find(e => e.rank === 1)!;
    const second = paddedEntries.find(e => e.rank === 2)!;
    const third = paddedEntries.find(e => e.rank === 3)!;

    const renderPodiumItem = (entry: typeof first, position: 'first' | 'second' | 'third') => (
        <div className={`podium-item podium-${position}`}>
            {position === 'first' && (
                <div className="podium-crown-wrapper">
                    <CrownIcon />
                </div>
            )}
            <div className="podium-avatar-container">
                <div className={`podium-avatar-ring podium-ring-${position}`}>
                    <div className="podium-avatar-inner">
                        {entry.profilePicture ? (
                            <img src={entry.profilePicture} alt={entry.supplierName} />
                        ) : (
                            <img src={DEFAULT_AVATARS[entry.rank % DEFAULT_AVATARS.length]} alt={entry.supplierName} />
                        )}
                    </div>
                </div>
                <div className={`podium-badge podium-badge-${position}`}>
                    {entry.rank}
                </div>
            </div>
            <div className="podium-info">
                <div className="podium-player-name">{entry.supplierName}</div>
                <div className={`podium-player-score podium-score-${position}`}>
                    {entry.totalEarnings > 0 ? formatCurrency(entry.totalEarnings) : '-'}
                </div>
                <div className="podium-player-handle">@supplier</div>
            </div>
        </div>
    );

    return (
        <div className="podium-leaderboard">
            <div className="podium-header">
                <span className="podium-trophy"><Icon name={Icons.trophy} size="lg" /></span>
                <span>Top Earners</span>
            </div>
            <div className="podium-container">
                {renderPodiumItem(second, 'second')}
                {renderPodiumItem(first, 'first')}
                {renderPodiumItem(third, 'third')}
            </div>
        </div>
    );
};
