import express from "express"
import { authenticate } from "../../middlewares/authenticate.js"
import { authorize } from "../../middlewares/authorization.middleware.js"
import { SHOP_PERMISSIONS } from "../../config/permissions.js"
import { createShopController } from "./controller.js"

const  routes = express.Router()

routes.post("/shop",authenticate,authorize(SHOP_PERMISSIONS.CREATE),createShopController)

export default routes