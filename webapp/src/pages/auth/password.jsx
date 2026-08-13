import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Form, Input } from "antd";
import axios from "axios";

import loginBg from "../../assets/login/Login-Background.png";
import logo from "../../assets/AstraZeneca.svg";
import endpoints from "../../utils/endpoints";

function ForgotPassword() {
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const token = searchParams.get("token");
  const isResetMode = !!token;

  useEffect(() => {
    if (isResetMode) {
      form.setFieldsValue({ token });
    }
  }, [token]);

  function submit(values) {
    setIsButtonLoading(true);

    console.log(isResetMode);

    const request = isResetMode
      ? axios.post(endpoints.auth.resetPassword, {
          token,
          password: values.password,
        })
      : axios.post(endpoints.auth.forgotPassword, {
          email: values.email,
        });

    request
      .then(() => {
        form.resetFields();
        alert(
          isResetMode
            ? "Password alterada com sucesso."
            : "Email de recuperação enviado com sucesso."
        );

        if (isResetMode) navigate("/login");
        setIsButtonLoading(false);
      })
      .catch(() => {
        alert(
          isResetMode
            ? "Erro ao redefinir password."
            : "Erro ao enviar email de recuperação."
        );
        setIsButtonLoading(false);
      });
  }

  return (
    <div
      className="flex flex-col justify-center w-full min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBg})`, height: "100vh" }}
    >
      <div className="flex flex-col justify-center items-center min-h-[500px] w-full">
        <div className="max-w-[450px] bg-white rounded-[5px] shadow-[0px_3px_6px_#00000029]">
          <div className="w-full p-6 rounded-t-[5px] bg-blue">
            <p className="text-xl text-white font-semibold text-center">
              {isResetMode ? "Redefinir password" : "Recuperar password"}
            </p>
          </div>

          <div className="flex flex-col p-5">
            <p className="text-center text-sm mb-6">
              {isResetMode
                ? "Defina uma nova password para a sua conta"
                : "Insira o seu email para receber as instruções de recuperação"}
            </p>

            <Form form={form} layout="vertical" onFinish={submit}>
              {!isResetMode && (
                <>
                  <p className="pb-2">Email</p>
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: "Este campo é obrigatório" },
                      { type: "email", message: "Email inválido" },
                    ]}
                  >
                    <Input size="large" placeholder="johndoe@email.com" />
                  </Form.Item>
                </>
              )}

              {isResetMode && (
                <>
                  <p className="pb-2">Nova password</p>
                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: "Password obrigatória" },
                      { min: 8, message: "Mínimo 8 caracteres" },
                    ]}
                  >
                    <Input.Password size="large" />
                  </Form.Item>

                  <p className="pb-2">Confirmar password</p>
                  <Form.Item
                    name="confirm"
                    dependencies={["password"]}
                    rules={[
                      { required: true, message: "Confirme a password" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("As passwords não coincidem")
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password size="large" />
                  </Form.Item>
                </>
              )}

              <Form.Item>
                <Button
                  size="large"
                  type="primary"
                  className="w-full"
                  onClick={form.submit}
                  loading={isButtonLoading}
                >
                  {isResetMode ? "Alterar password" : "Recuperar password"}
                </Button>
              </Form.Item>
            </Form>

            <p
              className="text-center text-xs text-[#F5702B] cursor-pointer"
              onClick={() => navigate("/login")}
            >
              <u>Voltar ao login</u>
            </p>
          </div>
        </div>

        <div className="max-w-[450px] rounded-[5px] shadow-[0px_3px_6px_#00000029]">
          <p className="text-xs text-white text-center mt-5">
            Um projecto com o apoio de:
            <img src={logo} className="w-full max-w-[200px] mt-1 mx-auto" />
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
