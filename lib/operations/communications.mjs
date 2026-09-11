import {OperationError,uid} from './engine.mjs';
const body=(value,max)=>{if(typeof value!=='string'||!value.trim()||value.length>max)throw new OperationError(`Enter between 1 and ${max} characters.`);return value.trim();};
export function communicationCommand(s,c,actor,now){
 if(c.type==='message.send'){
  if(!s.people.some(p=>p.id===c.recipientId))throw new OperationError('Choose an active LayeredFX recipient.');
  const message={id:uid('dm'),senderId:actor.id,recipientId:c.recipientId,body:body(c.body,4000),createdAt:now};(s.directMessages||=[]).push(message);return message.id;
 }
 if(c.type==='note.save'){
  const notes=s.quickNotes||=[];let note=c.id?notes.find(n=>n.id===c.id):null;
  if(c.id&&(!note||note.ownerId!==actor.id))throw new OperationError('Note not found.',404);
  if(note&&c.expectedRevision!==(note.revision||0))throw new OperationError('This note changed. Reload it before saving.',409);
  if(!note){note={id:uid('note'),ownerId:actor.id};notes.push(note);}
  Object.assign(note,{title:body(c.title,150),body:body(c.body,10000),updatedAt:now,revision:(note.revision||0)+1});return note.id;
 }
 if(c.type==='note.delete'){const note=(s.quickNotes||[]).find(n=>n.id===c.id&&n.ownerId===actor.id);if(!note)throw new OperationError('Note not found.',404);s.quickNotes=s.quickNotes.filter(n=>n.id!==note.id);return note.id;}
 throw new OperationError('Unsupported communication command.');
}
