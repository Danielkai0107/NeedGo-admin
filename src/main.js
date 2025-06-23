import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/style/index.scss";
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// 全局錯誤處理
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

// 創建應用
const app = createApp(App);

// 使用路由
app.use(router);

// 全局錯誤處理
app.config.errorHandler = (err, vm, info) => {
  console.error("Vue Error:", err);
  console.error("Component:", vm);
  console.error("Info:", info);
};

// 掛載應用
app.mount("#app");
