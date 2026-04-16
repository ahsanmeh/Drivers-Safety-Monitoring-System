import { useEffect, useState } from 'react';

export const useTimeAgo = (timestamp: Date | string): string => {
    const [timeAgo, setTimeAgo] = useState('');

    useEffect(() => {
        const calculateTimeAgo = () => {
            const now = new Date().getTime();
            const past = new Date(timestamp).getTime();
            const diffInSeconds = Math.floor((now - past) / 1000);

            if (diffInSeconds < 60) {
                return 'just now';
            } else if (diffInSeconds < 3600) {
                const minutes = Math.floor(diffInSeconds / 60);
                return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            } else if (diffInSeconds < 86400) {
                const hours = Math.floor(diffInSeconds / 3600);
                return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            } else {
                const days = Math.floor(diffInSeconds / 86400);
                return `${days} day${days > 1 ? 's' : ''} ago`;
            }
        };

        setTimeAgo(calculateTimeAgo());

        // Update every minute
        const interval = setInterval(() => {
            setTimeAgo(calculateTimeAgo());
        }, 60000);

        return () => clearInterval(interval);
    }, [timestamp]);

    return timeAgo;
};
