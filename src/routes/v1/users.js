const express = require('express');
const Joi = require('joi');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

const isLoggedIn = require('../../middleware/auth');
const { mysqlConfig, jwtSecret } = require('../../config');
const validation = require('../../middleware/validation');

const router = express.Router();

const registrationSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(16).required(),
});

router.post('/register', validation(registrationSchema), async (req, res) => {
  try {
    const hash = bcrypt.hashSync(req.body.password, 10);

    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
      INSERT INTO users (name, email, password)
      VALUES (${mysql.escape(req.body.name)}, ${mysql.escape(req.body.email)}, '${hash}')
    `);
    await con.end();

    if (!data.insertId || data.affectedRows !== 1) {
      // console.log(data);
      return res.status(500).send({ err: 'Server issue occurred. Please try again later.' });
    }

    return res.send({ msg: 'Successfully created account', accountId: data.insertId });
  } catch (err) {
    // console.log(err);
    return res.status(500).send({ err: 'Server issue occurred. Please try again later.' });
  }
});

router.post('/login', validation(loginSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
      SELECT id, email, password
      FROM users
      WHERE email = ${mysql.escape(req.body.email)}
      LIMIT 1
    `);
    await con.end();

    if (data.length === 0) {
      return res.status(400).send({ err: 'User not found' });
    }

    if (!bcrypt.compareSync(req.body.password, data[0].password)) {
      return res.status(400).send({ err: 'Incorrect password' });
    }

    const token = jsonwebtoken.sign({ accountId: data[0].id }, jwtSecret);

    return res.send({
      msg: 'Successfully logged in',
      token,
    });
  } catch (err) {
    // console.log(err);
    return res.status(500).send({ err: 'Server issue occurred. Please try again later.' });
  }
});
// change psw

router.post('/change-password', isLoggedIn, validation(changePasswordSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
      SELECT id, email, password
      FROM users
      WHERE id = ${mysql.escape(req.user.accountId)}
      LIMIT 1
    `);

    console.log(data);
    const checkHash = bcrypt.compareSync(req.body.oldPassword, data[0].password);

    if (!checkHash) {
      await con.end();
      return res.status(400).send({ err: 'Incorrect old password' });
    }

    const newPasswordHash = bcrypt.hashSync(req.body.newPassword, 10);

    const changePasswordDBRes = await con.execute(
      `UPDATE users SET password = ${mysql.escape(newPasswordHash)} WHERE id = ${mysql.escape(req.user.accountId)}`,
    );

    console.log(changePasswordDBRes);
    await con.end();
    return res.send({ msg: 'Password has been changed' });
  } catch (err) {
    return res.status(500).send({ err: 'Server issue occurred. Please try again later.' });
  }
});

module.exports = router;
