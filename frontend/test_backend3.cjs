const io = require('socket.io-client');

const socket1 = io('http://localhost:5000');
const socket2 = io('http://localhost:5000');

socket1.on('connect', () => {
  console.log('Socket 1 connected');
  socket1.emit('joinRankedQueue', {
    userId: '1', username: 'player1', elo: 10, language: 'english',
    fullTheme: 'serika dark'
  });
});

socket2.on('connect', () => {
  console.log('Socket 2 connected');
  socket2.emit('joinRankedQueue', {
    userId: '2', username: 'player2', elo: 10, language: 'english',
    fullTheme: 'dracula'
  });
});

socket1.on('rankedMatchFound', (data) => {
  console.log('Socket 1 Match Found:', data);
});

socket2.on('rankedMatchFound', (data) => {
  console.log('Socket 2 Match Found:', data);
  process.exit(0);
});

setTimeout(() => {
  console.log('Timeout - match not found');
  process.exit(1);
}, 5000);
