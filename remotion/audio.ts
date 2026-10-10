import type { Message } from '@/types';
import type { WhatsAppVideoProps } from './videoTypes';

export function getVoiceSource(
  props: Pick<WhatsAppVideoProps, 'enableTts' | 'ttsAudioMap'>,
  message: Message,
  index: number
) {
  if (!props.enableTts) return null;

  return (
    message.audioDataUrl ||
    props.ttsAudioMap[message.id] ||
    props.ttsAudioMap[index] ||
    props.ttsAudioMap[String(index)] ||
    null
  );
}

export function getMessageSoundSource(
  props: Pick<WhatsAppVideoProps, 'useSoundIn' | 'useSoundOut'>,
  message: Message
) {
  if (message.direction === 'incoming') {
    return props.useSoundIn ? 'sounds/notification.mp3' : null;
  }

  return props.useSoundOut ? 'sounds/sfx-out.mp3' : null;
}
