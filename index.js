const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');

const verifyToken = require('./middlewares/verifyToken');
const authRoutes = require('./routes/auth');
const { db } = require('./config/firebaseAdmin'); // Importa Firestore desde el archivo que creaste


// La inicialización de Firebase Admin se realiza en config/firebaseAdmin.js

const app = express(); // Definir la instancia de Express

// Middlewares globales
app.use(express.json()); // Parseo de JSON

// Configurar CORS antes de las rutas

app.use(cors({
  origin: ['https://www.hotandcold.cl', 'https://hotandcold.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Responder manualmente a las solicitudes OPTIONS (preflight)
app.options('*', cors({
  origin: ['https://www.hotandcold.cl', 'https://hotandcold.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));


app.use('/api', authRoutes);

app.post('/api/contact', async (req, res) => {
  const { nombre, apellido, email, telefono, direccion, rol } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Formulario Web" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: 'Nueva Cotización desde el formulario',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="background-color: #8ad1da; padding: 10px; border-radius: 5px; color: white;">
            📩 Nueva Cotización Recibida
          </h2>
          <p>Se ha recibido una nueva solicitud de cotización con los siguientes datos:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              <tr>
                <td style="padding: 8px; border: 1px solid #ccc;"><strong>Nombre:</strong></td>
                <td style="padding: 8px; border: 1px solid #ccc;">${nombre} ${apellido}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ccc;"><strong>Email:</strong></td>
                <td style="padding: 8px; border: 1px solid #ccc;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ccc;"><strong>Teléfono:</strong></td>
                <td style="padding: 8px; border: 1px solid #ccc;">${telefono}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ccc;"><strong>Dirección:</strong></td>
                <td style="padding: 8px; border: 1px solid #ccc;">${direccion}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ccc;"><strong>Rol:</strong></td>
                <td style="padding: 8px; border: 1px solid #ccc;">${rol}</td>
              </tr>
            </tbody>
          </table>
          <p style="font-size: 0.9rem; color: #555; margin-top: 20px;">
            Este mensaje fue enviado automáticamente desde el formulario de contacto de tu sitio web.
          </p>
        </div>
      `
    });

    // Guardar cotización en Firestore
    await db.collection('cotizaciones').add({
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      rol,
      fecha: new Date()
    });

    res.status(200).json({ message: 'Mensaje enviado y cotización guardada correctamente' });
  } catch (error) {
    console.error('Error al enviar el mensaje o guardar la cotización:', error);
    res.status(500).json({ message: 'Error al enviar el mensaje o guardar la cotización' });
  }
});



app.post('/api/contact-footer', async (req, res) => {
  const { nombre, apellido, telefono, email, mensaje } = req.body;

  try {
    // 1. Guardar en Firestore
    await db.collection('mensajes-contacto').add({
      nombre,
      apellido,
      telefono,
      email,
      mensaje,
      timestamp: new Date(),
    });

    // 2. Enviar correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
  from: `"Formulario Web" <${process.env.EMAIL_USER}>`,
  to: process.env.EMAIL_TO,
  subject: 'Nuevo Mensaje desde el Formulario de Contacto (Footer)',
  html: `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="background-color: #8ad1da; padding: 10px; border-radius: 5px; color: white;">
        📬 Nuevo Mensaje de Contacto
      </h2>
      <p>Se ha recibido un nuevo mensaje desde el formulario de contacto ubicado en el footer del sitio:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc;"><strong>Nombre:</strong></td>
            <td style="padding: 8px; border: 1px solid #ccc;">${nombre} ${apellido}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc;"><strong>Email:</strong></td>
            <td style="padding: 8px; border: 1px solid #ccc;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc;"><strong>Teléfono:</strong></td>
            <td style="padding: 8px; border: 1px solid #ccc;">${telefono}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc;"><strong>Mensaje:</strong></td>
            <td style="padding: 8px; border: 1px solid #ccc;">${mensaje}</td>
          </tr>
        </tbody>
      </table>
      <p style="font-size: 0.9rem; color: #555; margin-top: 20px;">
        Este mensaje fue enviado automáticamente desde el formulario de contacto ubicado en el footer del sitio web.
      </p>
    </div>
  `
});


    res.status(200).json({ message: 'Mensaje guardado y enviado correctamente' });
  } catch (error) {
    console.error('Error al procesar el mensaje:', error);
    res.status(500).json({ message: 'Error al enviar o guardar el mensaje' });
  }
});



app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
