const express = require('express');
const bcrypt = require('bcrypt');
const { db } = require('../config/firebaseAdmin');


const router = express.Router();

// Registro
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const userQuery = await db.collection('usuarios').where('username', '==', username).get();
    if (!userQuery.empty) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection('usuarios').add({
      username,
      password: hashedPassword
    });

    res.status(201).json({ message: 'Usuario registrado con éxito' });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const userQuery = await db.collection('usuarios').where('username', '==', username).limit(1).get();
    if (userQuery.empty) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const userData = userQuery.docs[0].data();
    const validPassword = await bcrypt.compare(password, userData.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    res.json({ message: 'Login exitoso', username: userData.username });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
