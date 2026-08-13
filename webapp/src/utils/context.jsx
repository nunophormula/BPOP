import React, { useContext, useEffect, useState } from "react";
import { createContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import endpoints from "./endpoints";
import api from "./api";
import { message } from "antd";

export const Context = createContext();

api.init();

function landingPathFor(user) {
  return user?.role === "admin" ? "/app" : "/app/meu-hospital";
}

const ContextProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({});
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    handleGetData();
  }, []);

  const navigate = useNavigate();

  function handleGetData() {
    let token = localStorage.getItem("token");
    if (token) {
      axios
        .post(endpoints.auth.verifyToken, {
          data: token,
        })
        .then((res) => {
          console.log(res);
          if (res.data.token_valid) {
            api.token(res.data.token);
            setUser(res.data.user);
            setIsLoggedIn(true);
            if (window.location.pathname === "/" || window.location.pathname === "/app") {
              navigate(landingPathFor(res.data.user));
            } else {
              navigate(window.location);
            }
          } else {
            setIsLoggedIn(false);
            navigate("/login");
          }
          setTimeout(() => {
            setIsLoading(false);
          }, 1500);
        })
        .catch((err) => {
          console.log(err);
          setTimeout(() => {
            setIsLoading(false);
          }, 1500);
        });
    } else {
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    const auxUser = JSON.parse(JSON.stringify(user));
    setIsLoggedIn(false);
    setIsLoading(true);
    setUser({});
    navigate("/login");
    handleCreateLog(auxUser, "logout");
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }

  function login(res) {
    localStorage.setItem("token", res.token);
    api.token(res.token);
    setUser(res.user);
    setIsLoggedIn(true);
    navigate(landingPathFor(res.user));
  }

  function handleCreateLog(objUser, action) {
    if (objUser.id) {
      axios
        .post(endpoints.logs.create, { data: { action } })
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }

  return (
    <Context.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        user,
        setUser,
        login,
        logout,
        isLoading,
        setIsLoading,
        messageApi,
      }}
    >
      {contextHolder}
      {children}
    </Context.Provider>
  );
};

export default ContextProvider;
