import React, { useContext, useEffect, useState, useMemo } from "react";
import {
  CloseOutlined,
  DashboardOutlined,
  DashOutlined,
  DatabaseOutlined,
  DownOutlined,
  FileOutlined,
  HistoryOutlined,
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined,
  MenuOutlined,
  ProfileOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Divider,
  Drawer,
  Dropdown,
  Layout,
  Menu,
} from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import logo from "../assets/Logo-bpop.svg";
import config from "../utils/config";
import endpoints from "../utils/endpoints";
import { Context } from "../utils/context";
import Logout from "../components/logout";

const { Header, Content, Sider } = Layout;

const Main = () => {
  const { user, logout, isLoggedIn } = useContext(Context);
  const location = useLocation();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("/app");
  const [isOpenDrawerMenu, setIsOpenDrawerMenu] = useState(false);
  const [isOpenLogout, setIsOpenLogout] = useState(false);

  const [windowDimension, setWindowDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [pendingCount, setPendingCount] = useState(0);

  // Função para criar itens de menu
  function getItem(label, key, icon, children, extra) {
    return { key, icon, children, label, extra };
  }

  // Menu dinâmico baseado no role
  const items = useMemo(() => {
    const baseItems = [getItem("Dashboard", "/app", <DashboardOutlined />)];

    // Badge com o nº de plataformas/anticorpos pendentes — o texto dentro
    // do Badge não herda a cor do CSS do menu, por isso a cor é calculada
    // aqui à mão (branco normalmente, laranja quando selecionado, tal como
    // os restantes itens).
    const dataManagementItem = getItem(
      pendingCount > 0 ? (
        <Badge count={pendingCount} size="small" offset={[10, 0]}>
          <span
            style={{
              color: current === "/app/data-management" ? "#F5702B" : "#fff",
            }}
          >
            Gestão de dados
          </span>
        </Badge>
      ) : (
        "Gestão de dados"
      ),
      "/app/data-management",
      <DatabaseOutlined />
    );

    if (user?.role === "admin") {
      return [
        ...baseItems,
        getItem("Instituições", "/app/hospital", <HomeOutlined />),
        getItem("Submissões", "/app/submission", <FileOutlined />),
        getItem("Administradores", "/app/admin", <UserOutlined />),
        dataManagementItem,
        getItem("Logs", "/app/logs", <HistoryOutlined />),
        getItem("Meu perfil", "/app/profile", <SettingOutlined />),
        getItem("Sair", "/app/logout", <LogoutOutlined />),
      ];
    }

    if (user?.role === "adminHospital") {
      return [
        ...baseItems,
        dataManagementItem,
        getItem("Logs", "/app/logs", <HistoryOutlined />),
        getItem("Meu perfil", "/app/profile", <SettingOutlined />),
        getItem("Sair", "/app/logout", <LogoutOutlined />),
      ];
    }

    if (user?.role === "repHospitalar") {
      return [
        ...baseItems,
        dataManagementItem,
        getItem("Meu perfil", "/app/profile", <SettingOutlined />),
        getItem("Sair", "/app/logout", <LogoutOutlined />),
      ];
    }

    return baseItems;
  }, [user, pendingCount, current]);

  // Redireciona se não estiver logado
  useEffect(() => {
    if (!isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate]);

  // Contagem de sugestões pendentes (plataforma/anticorpo) para o badge do
  // menu — admin vê o total global, adminHospital/repHospitalar só as
  // sugestões da própria instituição (endpoint já faz esse scoping).
  useEffect(() => {
    if (!["admin", "adminHospital", "repHospitalar"].includes(user?.role)) {
      return;
    }

    axios
      .get(endpoints.dataManagement.pendingCount)
      .then((res) => setPendingCount(res.data.pending || 0))
      .catch(() => {});
  }, [user, location.pathname]);

  // Atualiza o menu selecionado
  useEffect(() => {
    const pathname = location.pathname.split("/");
    if (pathname.length > 2) {
      setCurrent(`/${pathname[1]}/${pathname[2]}`);
    } else {
      setCurrent(`/${pathname[pathname.length - 1]}`);
    }
  }, [location]);

  // Detecta resize da janela
  useEffect(() => {
    const detectSize = () => {
      setWindowDimension({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", detectSize);
    return () => window.removeEventListener("resize", detectSize);
  }, []);

  // Ao clicar no menu
  function handleClickMenu(e) {
    if (e.key === "logout") {
      logout();
    } else {
      navigate(e.key);
      setIsOpenDrawerMenu(false);
    }
  }

  return (
    <Layout>
      <Logout
        open={isOpenLogout}
        close={() => setIsOpenLogout(false)}
        submit={logout}
      />

      <Layout>
        {windowDimension.width > 1080 ? (
          <Sider width={250} className="!bg-[#F5702B]">
            <div className="flex flex-col h-full p-4">
              <img src={logo} className="max-w-[200px] mx-auto pt-2" />
              <div className="mt-[40px]">
                <Menu
                  className="principal-menu"
                  selectedKeys={[current]}
                  mode="inline"
                  items={items}
                  onClick={handleClickMenu}
                />
              </div>
            </div>
          </Sider>
        ) : (
          <Drawer
            className="menu-drawer"
            width={400}
            open={isOpenDrawerMenu}
            onClose={() => setIsOpenDrawerMenu(false)}
            maskClosable={true}
            closable={false}
          >
            <Button
              type="text"
              className="absolute right-[20px] top-[20px] font-bold"
              onClick={() => setIsOpenDrawerMenu(false)}
            >
              <CloseOutlined className="text-[#0c3c61]" />
            </Button>

            <div
              className="bg-[#F5702B] flex p-[60px_20px_20px_20px] gap-3 items-center"
              onClick={() => handleClickMenu({ key: "/app/profile" })}
            >
              <Avatar
                className="w-[100px] h-[100px] mr-2"
                size={"large"}
                src={`http://localhost:4000${user.avatar}`}
              />
              <div className="flex flex-col">
                <p className="text-[#fff] text-[16px]">Olá,</p>
                <p className="text-[#fff] text-[16px]">{user.nome}</p>
              </div>
            </div>

            <div className="flex flex-col justify-start items-center">
              <Menu
                className="principal-menu"
                selectedKeys={[current]}
                mode="inline"
                items={items}
                onClick={handleClickMenu}
              />
              <Divider className="text-white" />
              <a
                className={`dropdown-item flex items-center w-full min-h-[45px] pl-[44px] text-[#fff]`}
                onClick={() => setIsOpenLogout(true)}
              >
                <LoginOutlined className="mr-2" style={{ color: "#fff" }} />{" "}
                <span className="text-[#fff]">Sair</span>
              </a>
            </div>
          </Drawer>
        )}

        <Layout>
          <Header className="!bg-white shadow-[0px_4px_16px_#A7AFB754] flex justify-end items-center">
            <div className="flex justify-end items-center">
              {windowDimension.width > 1080 ? (
                <Dropdown
                  menu={{
                    items: [
                      {
                        label: (
                          <a
                            className="dropdown-item flex items-center"
                            onClick={() => navigate("/app/profile")}
                          >
                            <ProfileOutlined className="mr-2" /> Perfil
                          </a>
                        ),
                        key: "0",
                      },
                      {
                        label: (
                          <a
                            className="dropdown-item flex items-center"
                            onClick={() => setIsOpenLogout(true)}
                          >
                            <LoginOutlined className="mr-2" /> Sair
                          </a>
                        ),
                        key: "2",
                      },
                    ],
                  }}
                  trigger={["click"]}
                >
                  <div className="flex justify-center items-center mr-2 cursor-pointer">
                    <Avatar
                      src={`${config.server_ip}${
                        user.avatar ?? "User-default.svg"
                      }`}
                    />
                    <p className="text-[12px] ml-2 mr-2">{user.PESSOA}</p>
                    <DownOutlined />
                  </div>
                </Dropdown>
              ) : (
                <MenuOutlined onClick={() => setIsOpenDrawerMenu(true)} />
              )}
            </div>
          </Header>

          <Content className="p-6 h-[calc(100vh-64px)] overflow-auto">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Main;
