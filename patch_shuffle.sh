#!/bin/bash
sed -i '/if (upgrades >= 1 && word.length > 3) {/,/word = arr.join(.);/c\
    if (upgrades >= 1 && word.length > 1) {\
      const arr = word.split("");\
      for (let j = arr.length - 1; j > 0; j--) {\
        const k = Math.floor(Math.random() * (j + 1));\
        [arr[j], arr[k]] = [arr[k], arr[j]];\
      }\
      word = arr.join("");\
' frontend/src/lib/words.ts
