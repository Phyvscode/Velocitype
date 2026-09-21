#!/bin/bash
sed -i '/<div className="font-mono text-sm text-slate-300">Available Charge/a\
            <div className="flex w-full justify-between gap-8 mb-4">\
              <div className="flex-1 border border-slate-700 p-4 rounded bg-slate-800/50">\
                <div className="text-[var(--hot)] text-xs font-mono uppercase mb-2">You</div>\
                <div className="flex justify-between text-xs font-mono text-slate-300">\
                  <span>Best: <span className="text-emerald-400">{myBestLetter || "-"}</span></span>\
                  <span>Worst: <span className="text-red-400">{myWorstLetter || "-"}</span></span>\
                </div>\
              </div>\
              <div className="flex-1 border border-slate-700 p-4 rounded bg-slate-800/50">\
                <div className="text-red-400 text-xs font-mono uppercase mb-2">Opponent</div>\
                <div className="flex justify-between text-xs font-mono text-slate-300">\
                  <span>Best: <span className="text-emerald-400">{oppBestLetter || "-"}</span></span>\
                  <span>Worst: <span className="text-red-400">{oppWorstLetter || "-"}</span></span>\
                </div>\
              </div>\
            </div>\
' frontend/src/components/RankedMode.tsx
