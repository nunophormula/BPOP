import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Footer } from "antd/es/layout/layout";
import { Button, Checkbox, Form, Input, message } from "antd";

import { Context } from "../../utils/context";

import loginBg from "../../assets/login/Login-Background.png";
import logo from "../../assets/AstraZeneca.svg";
import espghan from "../../assets/ESPGHAN.svg";
import dayjs from "dayjs";
import axios from "axios";
import endpoints from "../../utils/endpoints";

function Login() {
  const { isLoggedIn, login, messageApi } = useContext(Context);
  const [isOpenLearnMore, setIsOpenLearnMore] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const navigate = useNavigate();

  const [form] = Form.useForm();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/app");
    }
  }, [isLoggedIn]);

  function closeLearnMore() {
    setIsOpenLearnMore(false);
  }

  function submit(values) {
    setIsButtonLoading(true);
    axios
      .post(endpoints.auth.login, { data: values })
      .then((res) => {
        if (res.data.user) {
          messageApi.open({
            type: "success",
            content: "Login efetuado com sucesso!",
          });
          login(res.data);
        } else {
          messageApi.open({
            type: "error",
            content: res.data.message,
          });
        }
        setIsButtonLoading(false);
      })
      .catch((err) => {
        console.log(err);
        messageApi.open({
          type: "error",
          content: "Ocorreu um erro ao efetuar o login. Tente novamente.",
        });
        setIsButtonLoading(false);
      });
  }

  return (
    <div
      className={`flex flex-col justify-center w-full min-h-screen bg-cover bg-center`}
      style={{ backgroundImage: `url(${loginBg})`, height: "100vh" }}
    >
      <div className="flex flex-col justify-center items-center min-h-[500px] w-full">
        <div className="max-w-[450px] bg-white rounded-[5px] shadow-[0px_3px_6px_#00000029]">
          <div className="w-full bg-black p-6 rounded-t-[5px] bg-blue">
            <p className="text-xl text-white font-semibold text-center">
              Plataforma de registo
            </p>
          </div>
          <div className="flex flex-col p-5">
            <p className="text-center font-semibold text-sm pt-2">
              Área de administração
            </p>
            <p className="text-center text-sm">
              Plataforma de Registo PD-L1 & HER-2
            </p>
            <div className="flex flex-col mt-6">
              <Form form={form} layout="vertical" onFinish={submit}>
                <p className="pb-2">Email</p>
                <Form.Item
                  className="mb-0"
                  name="username"
                  rules={[
                    { required: true, message: "This field is required" },
                  ]}
                >
                  <Input size="large" placeholder="johndoe" />
                </Form.Item>
                <div className="flex justify-between items-center pb-2">
                  <p>Password</p>
                  <a
                    className="text-xs text-[#F5702B]!"
                    onClick={() => navigate("/forgotPassword")}
                  >
                    <u>Esqueceu-se da password?</u>
                  </a>
                </div>
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: "This field is required" },
                  ]}
                >
                  <Input.Password size="large" placeholder="●●●●●●●" />
                </Form.Item>
                <Form.Item name="remember" valuePropName="checked">
                  <Checkbox
                    size="large"
                    className="text-sm !min-h-[37px] !flex !items-center"
                  >
                    Lembrar-me?
                  </Checkbox>
                </Form.Item>
                <Form.Item>
                  <Button
                    size="large"
                    type="primary"
                    className="w-full"
                    onClick={form.submit}
                    loading={isButtonLoading}
                  >
                    Entrar
                  </Button>
                </Form.Item>
              </Form>

              <p className="text-center text-xs pl-15 pr-15 pb-3">
                Caso esteja com problemas de acesso por favor entre em contacto
                com o nosso suporte <u>help@pdl1-her2.pt</u>
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-[450px] rounded-[5px]">
          <p className="text-xs text-white text-center mt-5">
            Um projecto com o apoio de:
            <img src={logo} className="w-full max-w-[200px] mt-1" />
          </p>
        </div>
      </div>
      {/* <Footer className="bg-transparent! max-w-[1600px] w-full mx-auto py-6 px-12">
        <div className="flex justify-between">
          <div className="w-2/3">
            <p className="text-xs text-white font-semibold">Project</p>
            <p className="text-xs text-white mt-2">
              This is a reserved site for professional use of members of the
              European Society for Pediatric Gastroenterology, Hepatology and
              Nutrition Working Group on Eosinophilic Esophagitis. If you wish
              to participate in the projects of this Group you must be a member
              of ESPGHAN. You may contact the Manager of the database: Salvatore
              Oliva - salvatore.oliva@uniroma1.it
            </p>
            <p
              className="text-xs text-white mt-6 underline cursor-pointer"
              onClick={() => setIsOpenLearnMore(true)}
            >
              Learn more
            </p>
          </div>
          <div className="1/3">
            <p className="text-xs text-white mb-2">Created by:</p>
            <img src={espghan} className="w-full max-w-[200px]" />
          </div>
        </div>
        <div className="flex justify-between mt-6">
          <div>
            <p className="text-xs text-white text-left">
              © {dayjs().format("YYYY")} European Society for Paediatric
              Gastroenterology, Hepatology and Nutrition. All rights reserved.
            </p>
          </div>
          <div>
            <p className="text-xs text-white text-right">
              Powered by Phormulagroup © {dayjs().format("YYYY")}
            </p>
          </div>
        </div>
      </Footer> */}
    </div>
  );
}

export default Login;
