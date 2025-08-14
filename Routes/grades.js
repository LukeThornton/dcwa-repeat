const express = require('express');
const router = express.Router();
//import sql pool
const pool = require('../DB/mysql');

//top menu
function page(title, body) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title></head>
<body>
<nav><a href="/">Home</a> | <a href="/students">Students</a> | <a href="/grades">Grades</a> | <a href="/lecturers">Lecturers</a></nav>
<main>${body}</main>
</body></html>`;
}

// handle request to /grades
router.get('/', async (_req, res) => {
  try {
    //join student, module, and grade tables
    const [rows] = await pool.query(`
      SELECT s.sid, s.name AS sname, m.name AS mname, g.grade
      FROM student s
      LEFT JOIN grade g ON s.sid = g.sid
      LEFT JOIN module m ON g.mid = m.mid
      ORDER BY s.name ASC, g.grade ASC
    `);
    
    let html = '<h1>Grades</h1>';
    let currentSid = null;
    // see if we start bullet p
    let listOpen = false;
    
    // loop through rows
    // if new student start new bullet p
    for (const r of rows) {
      // new student
      if (r.sid !== currentSid) {
        if (listOpen) { html += '</ul>'; listOpen = false; }
        html += `<h2>${r.sname}</h2>`;
        currentSid = r.sid;
      }
      //if null modules print name
      if (r.mname && r.grade !== null && r.grade !== undefined) {
        if (!listOpen) { html += '<ul>'; listOpen = true; }
        html += `<li>${r.mname}: <strong>${r.grade}</strong></li>`;
      }
    }
    //close list
    if (listOpen) html += '</ul>';

    //send to browser
    res.send(page('Grades', html));
  } catch (err) {
    res.status(500).send(page('Error', `<h1>Error</h1><pre>${err.message}</pre>`));
  }
});
//return
module.exports = router;
