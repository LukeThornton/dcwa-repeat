const express = require('express');
const router = express.Router();
//imp sql
const pool = require('../DB/mysql');
//get mongo db
const { getDb } = require('../DB/mongo');

//top menu 
function page(title, body) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title></head>
<body>
<nav><a href="/">Home</a> | <a href="/students">Students</a> | <a href="/grades">Grades</a> | <a href="/lecturers">Lecturers</a></nav>
<main>${body}</main>
</body></html>`;
}

//
router.get('/', async (req, res) => {
  try {
    //mongo db lecturers
    const db = getDb();
    //convert lecturers to array
    const lecturers = await db.collection('lecturers').find().sort({_id: 1}).toArray();

    //show message after delete 
    let msg = '';
    if (req.query.msg) msg = `<p>${req.query.msg}</p>`;

    //lecturers table
    let html = '<h1>Lecturers</h1>' + msg;
    html += '<table border="1" cellpadding="6" cellspacing="0">';
    html += '<tr><th>LID</th><th>Name</th><th>Dept</th><th></th></tr>';
    for (const l of lecturers) {
      html += `<tr>
        <td>${l._id}</td>
        <td>${l.name}</td>
        <td>${l.did}</td>
        <td><a href="/lecturers/delete/${encodeURIComponent(l._id)}">Delete</a></td>
      </tr>`;
    }
    html += '</table>';

    res.send(page('Lecturers', html));
  } catch (err) {
    res.status(500).send(page('Error', `<h1>Error</h1><pre>${err.message}</pre>`));
  }
});

//get lectuer id
router.get('/delete/:lid', async (req, res) => {
  try {
    const lid = req.params.lid;

    // check if lecturer teaches modules
    const [rows] = await pool.query('SELECT COUNT(*) AS c FROM module WHERE lecturer = ?', [lid]);
    if (rows[0].c > 0) {
      return res.redirect('/lecturers?msg=' + encodeURIComponent(`Cannot delete Lecturer ${lid} as they have associated modules.`));
    }

    // delete lecturer from mongo
    const db = getDb();
    await db.collection('lecturers').deleteOne({ _id: lid });

    //success message
    res.redirect('/lecturers?msg=' + encodeURIComponent(`Lecturer ${lid} deleted.`));
  } catch (err) {
    res.status(500).send(page('Error', `<h1>Error</h1><pre>${err.message}</pre>`));
  }
});

//return
module.exports = router;
