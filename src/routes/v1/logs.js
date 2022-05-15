const express = require('express');
const mysql = require('mysql2/promise');
const Joi = require('joi');

const isLoggedIn = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const { mysqlConfig } = require('../../config');

const router = express.Router();

const setSchema = Joi.object({
  name: Joi.required(),
  prescription: Joi.required(),
  description: Joi.required(),
  date: Joi.required(),
  pets_id: Joi.required(),
});

router.get('/', isLoggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`SELECT * FROM logs WHERE user_id = ${req.user.accountId}`);
    await con.end();

    return res.send(data);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ err: 'Server issue occurred. Please try again later.' });
  }
});

router.post('/', isLoggedIn, validation(setSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
        INSERT INTO logs (name, prescription, description, date, user_id, pets_id)
        VALUES (${mysql.escape(req.body.name)}, ${mysql.escape(req.body.prescription)},
        ${mysql.escape(req.body.description)}, ${mysql.escape(req.body.date)},
        ${mysql.escape(req.user.accountId)}, ${mysql.escape(req.body.pets_id)})`);
    await con.end();

    if (!data.insertId) {
      return res.status(500).send({ err: 'Please try again' });
    }
    return res.send({ msg: 'Successfully added a log' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ err: 'Server issue occurred. Please try again later.' });
  }
});

module.exports = router;
