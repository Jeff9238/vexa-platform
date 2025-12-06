'use client'

import { useEffect } from 'react';
import { markChatAsRead } from '@/app/actions';

export default function ChatReadMarker({ chatId }: { chatId: string }) {
  useEffect(() => {
    // This triggers the server action safely from the client
    markChatAsRead(chatId);
  }, [chatId]);

  return null; // This component renders nothing visually
}