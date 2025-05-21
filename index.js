import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config"
import categoryRouter from "./routes/category-routes.js";
import productRouter from "./routes/product.js";
import adminRouter from "./routes/admin.js";
import userRouter from "./routes/user.js";
import orderRouter from "./routes/order.js";
import shippingRouter from "./routes/shipping.js";
import discountRounter from "./routes/discount.js";
import passwordRouter from "./routes/passwords.js";





await mongoose.connect(process.env.MONGO_URI);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


app.use((req, res, next) => {
   console.log("Request Path:", req.path);
  console.log("Request Method:", req.method);
  console.log("Content-Type:", req.headers['content-type']);
  console.log("Request Body:", req.body);
  next();
});
// app.use(productRouter);
app.use(userRouter);
app.use(adminRouter);
app.use(categoryRouter)
app.use(discountRounter)
app.use(productRouter);
app.use(passwordRouter)
app.use(shippingRouter);
app.use(orderRouter);






const port = process.env.PORT || 3000
app.listen(port, ()=> {
  console.log( `Server is listening on port ${port}`)
})

