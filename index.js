import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config"
// import productRouter from "./routes/products-routes.js";
import categoryRouter from "./routes/category-routes.js";
// import currencyRouter from "./routes/currency-routes.js";




await mongoose.connect(process.env.MONGO_URI);

const app = express();
app.use(express.json());
app.use(cors());

// app.use(productRouter);
app.use(categoryRouter)



const port = process.env.PORT || 3000
app.listen(port, ()=> {
  console.log( `Server is listening on port ${port}`)
})

