import { Router } from "express";
import { addCategory, getCategories, patchCategory } from "../controllers/category-cont.js";

const categoryRouter = Router();


categoryRouter.post('/categories', addCategory);
categoryRouter.get('/categories', getCategories);
categoryRouter.patch('/categories/:id', patchCategory);

export default categoryRouter;