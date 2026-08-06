const email = 'test_reset_1@test.com';
const oldPass = 'password123';
const newPass = 'password456';

(async () => {
  // 1. Register
  await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'test_reset_1', email, password: oldPass })
  });

  // 2. Generate OTP
  await fetch('http://localhost:5000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

})();
