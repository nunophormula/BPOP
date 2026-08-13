import axios from "axios";
import { message } from "antd";
import config from "./config";

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;

    if (status === 401) {
      localStorage.removeItem("token");
      window.location.assign("/login");
    } else if (status === 403) {
      message.error(
        err.response?.data?.message || "Não tem permissão para aceder a este recurso."
      );
      window.location.assign("/app");
    }

    return Promise.reject(err);
  }
);

const api = {
  init: () => {
    return new Promise((resolve, reject) => {
      axios.defaults.baseURL = config.server_ip;
      axios
        .get("/")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  },

  token: (token) => {
    return new Promise((resolve, reject) => {
      if (token) {
        axios.defaults.headers.common["Authorization"] = token;
        resolve(token);
      } else {
        reject("No token!");
      }
    });
  },
};

export default api;
