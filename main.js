fetch('http://127.0.0.1:5000/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'aku capek tapi semangat' })
})
.then(res => res.json())
.then(data => console.log(data))
