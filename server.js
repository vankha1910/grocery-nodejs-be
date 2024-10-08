const app = require('./app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({
  path: './config.env',
});
const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DB_URL.replace(
  '<password>',
  process.env.DB_PASSWORD
);
mongoose
  .connect(DB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    dbName: 'coffee-shop',
  })
  .then(() => console.log('DB connection successful!'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
