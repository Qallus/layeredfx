import 'server-only';
import twilio from 'twilio';
import {OperationError} from '@/lib/operations/engine.mjs';
import type {Actor} from '@/lib/operations/types';
export function capabilities(){const sms=Boolean(process.env.LFX_TWILIO_ACCOUNT_SID&&process.env.LFX_TWILIO_AUTH_TOKEN&&process.env.LFX_TWILIO_PHONE_NUMBER);return {sms,voice:sms&&Boolean(process.env.LFX_TWILIO_API_KEY_SID&&process.env.LFX_TWILIO_API_KEY_SECRET&&process.env.LFX_TWILIO_TWIML_APP_SID&&process.env.LFX_TWILIO_VOICE_WEBHOOK_URL),from:sms?process.env.LFX_TWILIO_PHONE_NUMBER!:''};}
export function phone(value:unknown){if(typeof value!=='string'||!/^\+[1-9]\d{7,14}$/.test(value))throw new OperationError('Use a phone number with country code, such as +14805550123.');return value;}
export const voiceIdentity=(actor:Actor)=>`lfx_${actor.id.replace(/[^a-zA-Z0-9_]/g,'')}`;
export function twilioConfig(){if(!capabilities().sms)throw new OperationError('Twilio is not configured for LayeredFX. No call or message was sent.',503);return {sid:process.env.LFX_TWILIO_ACCOUNT_SID!,secret:process.env.LFX_TWILIO_AUTH_TOKEN!,from:phone(process.env.LFX_TWILIO_PHONE_NUMBER)};}
export function twilioClient(){const config=twilioConfig();return twilio(config.sid,config.secret,{autoRetry:false,timeout:10000});}
export function voiceToken(actor:Actor){if(!capabilities().voice)throw new OperationError('LayeredFX Twilio Voice setup is incomplete.',503);const token=new twilio.jwt.AccessToken(process.env.LFX_TWILIO_ACCOUNT_SID!,process.env.LFX_TWILIO_API_KEY_SID!,process.env.LFX_TWILIO_API_KEY_SECRET!,{identity:voiceIdentity(actor),ttl:600});token.addGrant(new twilio.jwt.AccessToken.VoiceGrant({outgoingApplicationSid:process.env.LFX_TWILIO_TWIML_APP_SID!,incomingAllow:false}));return token.toJwt();}
const attempts=new Map<string,{start:number;count:number}>();
export function throttle(actor:Actor){const now=Date.now();for(const[key,v]of attempts)if(now-v.start>60000)attempts.delete(key);const bucket=attempts.get(actor.id)||{start:now,count:0};if(bucket.count>=10)throw new OperationError('Please wait a minute before another communication action.',429);bucket.count++;attempts.set(actor.id,bucket);}
export function providerFailure(error:unknown){if(error instanceof OperationError)return error;return new OperationError('Twilio did not confirm success. Check the history before retrying.',502);}
