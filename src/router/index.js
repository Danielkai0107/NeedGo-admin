import { createRouter, createWebHistory } from "vue-router";
import BackView from "../views/BackView.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: BackView,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: BackView, // 暫時都指向 BackView
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;