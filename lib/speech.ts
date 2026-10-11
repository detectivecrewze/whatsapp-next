import type { Message } from '@/types';
import { stripAudioTags } from './utils';

// URLs and bare domains are visual information in a chat bubble, not dialogue.
// Keep any human-written sentence around them, but never send the address to TTS.
const WEB_ADDRESS_PATTERN = /(?:https?:\/\/|www\.)\S+|\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|id|net|org|co|io|me|app|site|xyz|dev)(?:\/\S*)?/gi;

export function cleanSpeechText(value?: string): string {
  if (!value) return '';

  return stripAudioTags(value)
    .replace(WEB_ADDRESS_PATTERN, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function getMessageSpeakableText(message: Message): string | undefined {
  if (message.type === 'text') {
    return cleanSpeechText(message.text) || undefined;
  }

  if (message.type === 'link') {
    // A link card may speak its manually written intro/caption only. Its URL,
    // generated page title and description must remain silent.
    return cleanSpeechText(message.text) || cleanSpeechText(message.caption) || undefined;
  }

  if (message.type === 'image' || message.type === 'view_once') {
    return cleanSpeechText(message.caption) || cleanSpeechText(message.text) || undefined;
  }

  if (message.type === 'notification') {
    return (
      cleanSpeechText(message.text) ||
      cleanSpeechText(message.caption) ||
      cleanSpeechText(`${message.notifSender || 'Notifikasi'}: ${message.notifTitle || 'Pesan baru'}`) ||
      undefined
    );
  }

  if (['transfer', 'location', 'contact'].includes(message.type)) {
    return cleanSpeechText(message.text) || cleanSpeechText(message.caption) || undefined;
  }

  return undefined;
}
