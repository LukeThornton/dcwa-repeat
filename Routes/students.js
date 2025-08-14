const express = require('express');
const router = express.Router();
// import sql pool
const pool = require('../DB/mysql');

//html for menu
function page(title, body) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title></head>
<body>
<nav><a href="/">Home</a> | <a href="/students">Students</a> | <a href="/grades">Grades</a> | <a href="/lecturers">Lecturers</a></nav>
<main>${body}</main>
</body></html>`;
}

// list students 
//add/update links
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT sid, name, age FROM student ORDER BY sid ASC');
    let msg = _req.query.msg ? `<p>${_req.query.msg}</p>` : '';
    let html = `<h1>Students</h1>${msg}<p><a href="/students/add">Add Student</a></p>`;
    html += '<table border="1" cellpadding="6" cellspacing="0"><tr><th>SID</th><th>Name</th><th>Age</th><th></th></tr>';
    for (const r of rows) {
      html += `<tr>
        <td>${r.sid}</td>
        <td>${r.name}</td>
        <td>${r.age}</td>
        <td><a href="/students/edit/${encodeURIComponent(r.sid)}">Update</a></td>
      </tr>`;
    }
    html += '</table>';
    res.send(page('Students', html));
  } catch (err) {
    res.status(500).send(page('Error', `<h1>Error</h1><pre>${err.message}</pre>`));
  }
});

//add student form
function addForm(v = {}, e = {}) {
  return page('Add Student', `
    <h1>Add Student</h1>
    ${e.duplicate ? `<p style="color:red;">${e.duplicate}</p>` : ''}
    <form method="POST" action="/students/add" novalidate>
      <p>
        <label>Student ID (4 chars):<br>
          <input name="sid" value="${v.sid || ''}" maxlength="4">
        </label><br>${e.sid ? `<small style="color:red;">${e.sid}</small>` : ''}
      </p>
      <p>
        <label>Name (min 2 chars):<br>
          <input name="name" value="${v.name || ''}">
        </label><br>${e.name ? `<small style="color:red;">${e.name}</small>` : ''}
      </p>
      <p>
        <label>Age (>= 18):<br>
          <input name="age" value="${v.age || ''}">
        </label><br>${e.age ? `<small style="color:red;">${e.age}</small>` : ''}
      </p>
      <p>
        <button type="submit">Add</button> <a href="/students">Cancel</a>
      </p>
    </form>
  `);
}
router.get('/add', (req, res) => res.send(addForm()));

//add form validation and error handling
router.post('/add', async (req, res) => {
  try {
    const vals = {
      sid: (req.body.sid || '').trim(),
      name: (req.body.name || '').trim(),
      age: (req.body.age || '').trim()
    };
    const errors = {};
    if (vals.sid.length !== 4) errors.sid = 'Student ID must be exactly 4 characters.';
    if (vals.name.length < 2) errors.name = 'Name must be at least 2 characters.';
    const ageNum = Number(vals.age);
    if (!Number.isInteger(ageNum) || ageNum < 18) errors.age = 'Age must be an integer 18 or older.';
    if (Object.keys(errors).length) return res.status(400).send(addForm(vals, errors));

    const [dup] = await pool.query('SELECT COUNT(*) AS c FROM student WHERE sid = ?', [vals.sid]);
    if (dup[0].c > 0) {
      return res.status(409).send(addForm(vals, { duplicate: `Student with ID ${vals.sid} already exists` }));
    }

    await pool.query('INSERT INTO student (sid, name, age) VALUES (?, ?, ?)', [vals.sid, vals.name, ageNum]);
    res.redirect('/students?msg=' + encodeURIComponent(`Student ${vals.sid} added.`));
  } catch (err) {
    res.status(500).send(page('Error', `<h1>Error</h1><pre>${err.message}</pre>`));
  }
});

//edit studnet form / sid read only
function editForm(sid, v = {}, e = {}) {
  return page('Update Student', `
    <h1>Update Student</h1>
    <form method="POST" action="/students/edit/${encodeURIComponent(sid)}" novalidate>
      <p>
        <label>Student ID (read-only):<br>
          <input name="sid" value="${sid}" readonly>
        </label>
      </p>
      <p>
        <label>Name (min 2 chars):<br>
          <input name="name" value="${v.name || ''}">
        </label><br>${e.name ? `<small style="color:red;">${e.name}</small>` : ''}
      </p>
      <p>
        <label>Age (>= 18):<br>
          <input name="age" value="${v.age || ''}">
        </label><br>${e.age ? `<small style="color:red;">${e.age}</small>` : ''}
      </p>
      <p>
        <button type="submit">Update</button> <a href="/students">Cancel</a>
      </p>
    </form>
  `);
}

//find student by sid and show edit form
//if not found return 404
router.get('/edit/:sid', async (req, res) => {
  try {
    const sid = req.params.sid;
    const [rows] = await pool.query('SELECT name, age FROM student WHERE sid = ?', [sid]);
    if (!rows.length) return res.status(404).send(page('Not found', `<h1>Student ${sid} not found</h1><p><a href="/students">Back</a></p>`));
    res.send(editForm(sid, { name: rows[0].name, age: rows[0].age }));
  } catch (err) {
    res.status(500).send(page('Error', `<h1>Error</h1><pre>${err.message}</pre>`));
  }
});

//handle update form type fields
router.post('/edit/:sid', async (req, res) => {
  try {
    const sid = req.params.sid;
    const vals = { name: (req.body.name || '').trim(), age: (req.body.age || '').trim() };
    const errors = {};
    if (vals.name.length < 2) errors.name = 'Name must be at least 2 characters.';
    const ageNum = Number(vals.age);
    if (!Number.isInteger(ageNum) || ageNum < 18) errors.age = 'Age must be an integer 18 or older.';
    if (Object.keys(errors).length) return res.status(400).send(editForm(sid, vals, errors));

    //if student exists
    const [exists] = await pool.query('SELECT sid FROM student WHERE sid = ?', [sid]);
    if (!exists.length) return res.status(404).send(page('Not found', `<h1>Student ${sid} not found</h1><p><a href="/students">Back</a></p>`));

    //success msg
    await pool.query('UPDATE student SET name = ?, age = ? WHERE sid = ?', [vals.name, ageNum, sid]);
    res.redirect('/students?msg=' + encodeURIComponent(`Student ${sid} updated.`));
  } catch (err) {
    res.status(500).send(page('Error', `<h1>Error</h1><pre>${err.message}</pre>`));
  }
});

//return 
module.exports = router;
