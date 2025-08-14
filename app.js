//load express and 
const express = require('express');
const app = express();
const { connectMongo } = require('./DB/mongo');

//read form data function
app.use(express.urlencoded({ extended: true }));

//extra functionality top page menu
function nav() {
  return `<nav>
    <a href="/">Home</a> |
    <a href="/students">Students</a> |
    <a href="/grades">Grades</a> |
    <a href="/lecturers">Lecturers</a>
  </nav><hr>`;
}

// Home page
app.get('/', (_req, res) => {
  res.send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Home</title></head>
<body>
  ${nav()}
  <h1>Luke Thornton (G00385679)</h1>
  <ul>
    <li><a href="/students">Students Page</a></li>
    <li><a href="/grades">Grades Page</a></li>
    <li><a href="/lecturers">Lecturers Page</a></li>
  </ul>
</body></html>`);
});

//routes
app.use('/students', require('./Routes/students'));
app.use('/grades', require('./Routes/grades'));
app.use('/lecturers', require('./Routes/lecturers'));

// Start server
(async () => {
  try {//connect to mongo
    await connectMongo();
    app.listen(3004, () => {
      console.log('Server running on http://localhost:3004');
    });
  } catch (err) {
    console.error('Startup error:', err.message);
    process.exit(1);
  }

})();
