const express = require('express');
const cors = require('cors');
const UserRoutes = require('./routes/v1/users');
const PetsRoutes = require('./routes/v1/pets');
const LogsRoutes = require('./routes/v1/logs');

const { serverPort } = require('./config');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send({ msg: 'Server is running' });
});

app.use('/v1/users/', UserRoutes);
app.use('/v1/pets/', PetsRoutes);
app.use('/v1/logs/', LogsRoutes);

// Delete

// app.post('/delete',(req, res) => {
//   let q = "DELETE FROM logs WHERE id=?";
//   let x = [req.body.id];
//   connection.query(q,x,function(err,results){
//       if(err) throw err;
//       res.redirect("/v1/logs/");
// });

//

app.all('*', (req, res) => {
  res.status(404).send({ err: 'Page not found' });
});

app.listen(serverPort, () => console.log(`Server is running on port ${serverPort}`));
