import React from 'react';

export default function TypingIndicator({ username }) {
    return (
        <p className="text-sm text-gray-400 mt-2 h-5 animate-pulse">
            {username ? `${username} is typing...` : ''}
        </p>
    );
};
