import { Router } from "express";
import { addCategory, deleteCategory, getCategories, patchCategory } from "../controllers/category-cont.js";
import { isAuthenticated, normalizeAuth, authorizeRole } from "../middlewares/auth.js";

const categoryRouter = Router();

// Apply authentication middleware before role authorization
categoryRouter.post('/categories', isAuthenticated, normalizeAuth, authorizeRole(["admin"]), addCategory);
categoryRouter.get('/categories', isAuthenticated, normalizeAuth, authorizeRole(["admin"]), getCategories);
categoryRouter.patch('/categories/:id', isAuthenticated, normalizeAuth, authorizeRole(["admin"]), patchCategory);
categoryRouter.delete('/categories/:id', isAuthenticated, normalizeAuth, authorizeRole(["admin"]), deleteCategory);

export default categoryRouter;