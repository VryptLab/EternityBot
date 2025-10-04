import { extractMessageContent } from 'baileys';
import { contentTypeCache } from './constants.js';

export const getContentType = content => {
  if (!content) return undefined;
  
  if (contentTypeCache.has(content)) {
    return contentTypeCache.get(content);
  }
  
  const type = Object.keys(content).find(
    k => (k === 'conversation' || k.endsWith('Message') || /V[23]/.test(k)) && k !== 'senderKeyDistributionMessage'
  );
  
  contentTypeCache.set(content, type);
  return type;
};

export function parseMessage(content) {
  content = extractMessageContent(content);

  if (content?.viewOnceMessageV2Extension) {
    content = content.viewOnceMessageV2Extension.message;
  }
  if (content?.protocolMessage?.type === 14) {
    content = content.protocolMessage[getContentType(content.protocolMessage)];
  }
  if (content?.message) {
    content = content.message[getContentType(content.message)];
  }

  return content;
}

export const parseMention = text => {
  const MENTION_REGEX = /@(\d{5,16}|0)/g;
  const matches = text.matchAll(MENTION_REGEX);
  return Array.from(matches, m => m[1] + '@s.whatsapp.net');
};