import express from 'express';
import usersRouter from './routes/users.router.js';


<<<<<<< Updated upstream
const app = express()
const port = 8080

=======
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use("/users", usersRouter);
app.use("/api/users", usersRouter);
app.use("/api/pets", routerMascota);

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});
>>>>>>> Stashed changes


app.get('/', (req, res) => {
  res.send('Hello World!')
})



app.use("/users", usersRouter)


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
