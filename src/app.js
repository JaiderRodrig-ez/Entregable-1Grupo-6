import express from 'express';
import usersRouter from './routes/users.router.js';


const app = express()
const port = 8080



app.get('/', (req, res) => {
  res.send('Hello World!')
})



app.use("/users", usersRouter)


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
