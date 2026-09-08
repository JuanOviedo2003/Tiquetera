import express from "express"
import cors from "cors"

const app = express();
app.use(cors());


app.get((req, res) => {
    console.log("Hello world")
})





app.listen(3000, () => {
    console.log("App listening in port: http://localhost:3000/")
})