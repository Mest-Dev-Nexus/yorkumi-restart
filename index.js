import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config"
import categoryRouter from "./routes/category-routes.js";
import productRouter from "./routes/product.js";
import vendorRouter from "./routes/vendor.js";
import userRouter from "./routes/user.js";
import orderRouter from "./routes/order.js";
import shippingRouter from "./routes/shipping.js";





await mongoose.connect(process.env.MONGO_URI);

const app = express();
app.use(express.json());
app.use(cors());

// app.use(productRouter);
app.use(categoryRouter)
app.use(productRouter);
app.use(vendorRouter);
app.use(userRouter);
app.use(shippingRouter)
app.use(orderRouter)



const port = process.env.PORT || 3000
app.listen(port, ()=> {
  console.log( `Server is listening on port ${port}`)
})

