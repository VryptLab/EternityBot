import { generateMessageIDV2 } from 'baileys';
import pino from 'pino';

export const messId = generateMessageIDV2().slice(0, 4);

export const logger = pino({ level: 'fatal' }).child({ class: 'hisoka' });

export const BASE64_REGEX = /^data:.*?;base64,/i;
export const URL_REGEX = /^https?:\/\//;
export const PREFIX_REGEX = /^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/i;
export const MENTION_REGEX = /@(\d{5,16}|0)/g;

export const contentTypeCache = new WeakMap();