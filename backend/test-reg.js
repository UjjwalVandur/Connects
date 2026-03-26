import fetch from 'node-fetch';
import FormData from 'form-data';

async function run() {
  const form = new FormData();
  form.append('firstName', 'Test');
  form.append('lastName', 'User');
  form.append('email', 'test123456@example.com');
  form.append('password', 'password');
  form.append('location', 'Test');
  form.append('occupation', 'Test');

  const res = await fetch('http://localhost:3001/auth/register', {
    method: 'POST',
    body: form
  });
  console.log(res.status, await res.text());
}
run();
