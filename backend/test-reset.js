import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

async function run() {
  try {
    // 1. register
    try {
      await api.post('/auth/register', { username: 'test1', email: 'test1@test.com', password: 'password123' });
      console.log('Registered');
    } catch(e) {
      console.log('Already registered');
    }

    // 2. login
    let res = await api.post('/auth/login', { email: 'test1@test.com', password: 'password123' });
    console.log('Login 1 success:', res.data.username);

    // 3. get OTP (skip email, we will just read DB)
  } catch(e) {
    console.error(e.response?.data || e.message);
  }
}
run();
