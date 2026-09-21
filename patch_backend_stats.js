const fs = require('fs');
const path = 'backend/src/services/socketService.ts';
let code = fs.readFileSync(path, 'utf8');

const oldSig = "updateRankedProgress', (data: { matchId: string; progress: number; wpm: number; typedText?: string; activeKeys?: string[]; targetText?: string; cia?: {c: number, i: number, a: number}; charge?: number })";
const newSig = "updateRankedProgress', (data: { matchId: string; progress: number; wpm: number; typedText?: string; activeKeys?: string[]; targetText?: string; cia?: {c: number, i: number, a: number}; charge?: number; bestLetter?: string; worstLetter?: string })";

code = code.replace(oldSig, newSig);

const oldEmit = `          socket.to(data.matchId).emit('rankedOpponentProgress', {
            charge: data.charge, 
            progress: data.progress, 
            wpm: data.wpm, 
            typedText: data.typedText, 
            activeKeys: data.activeKeys,
            targetText: data.targetText,
            cia: data.cia
          });`;

const newEmit = `          socket.to(data.matchId).emit('rankedOpponentProgress', {
            charge: data.charge, 
            progress: data.progress, 
            wpm: data.wpm, 
            typedText: data.typedText, 
            activeKeys: data.activeKeys,
            targetText: data.targetText,
            cia: data.cia,
            bestLetter: data.bestLetter,
            worstLetter: data.worstLetter
          });`;

code = code.replace(oldEmit, newEmit);
fs.writeFileSync(path, code);
