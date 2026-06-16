fetch("http://localhost:5000/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ fullName: "Test User", email: "test8@test.com", password: "Test@123" })
}).then(res => res.text()).then(console.log).catch(console.error);
