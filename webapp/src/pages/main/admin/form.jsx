import { useState, useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import endpoints from "../../../utils/endpoints";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";

export default function AdminForm() {
  const { ID } = useParams(); // respId só existe ao editar
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  // Carregar dados se estiver a editar
  useEffect(() => {
    if (ID) {
      setIsEditing(true);
      axios
        .get(`${endpoints.admin.readById}?id=${ID}`)
        .then((res) => form.setFieldsValue(res.data))
        .catch((err) => console.log(err));
    }
  }, [ID, form]);

  async function submitForm(values) {
    setLoading(true);
    try {
      const payload = { ...values };
      if (isEditing) {
        await axios.post(endpoints.admin.update, {
          data: { id: ID, ...values },
        });
      } else {
        await axios.post(endpoints.admin.create, { data: payload });
      }
      navigate(`/app/admin`, {
        state: { success: true },
      });
    } catch (e) {
      if (e.response?.status == 409) {
        message.error(e.response.data.message);
      } else {
        message.error("Erro ao guardar administrador");
      }
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    navigate(`/app/admin`);
  }

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex justify-between items-center">
        <p className="text-xl font-bold text-black">
          {isEditing ? "Editar administrador" : "Criar administrador"}
        </p>

        <div className="flex gap-3">
          <Button
            size="large"
            type="alter"
            className="!text-[#F5702B] !border !border-[#F5702B] !bg-transparent !rounded-[29px] !h-[40px] hover:!bg-[#fe935d] hover:!text-[#fff]"
            icon={<ArrowLeftOutlined />}
            onClick={goBack}
          >
            Voltar
          </Button>

          <Button
            type="primary"
            className="!bg-[#F5702B] !rounded-[29px] !h-[40px] hover:!bg-transparent hover:!text-[#F5702B]"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={form.submit}
          >
            Guardar
          </Button>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={submitForm}>
        <div className="py-8 px-10 rounded-[10px] shadow-[0px_10px_20px_#00000005] bg-white border border-2 border-[#EEEEEE]  ">
          <div className="grid grid-cols-2 gap-6">
            <Form.Item
              name="nome"
              label="Nome"
              rules={[{ required: true, message: "Por favor insira o nome" }]}
            >
              <Input placeholder="Insira o nome" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                {
                  required: true,
                  type: "email",
                  message: "Por favor insira um email válido",
                },
              ]}
            >
              <Input placeholder="Insira o email" />
            </Form.Item>

            <Form.Item name="telefone" label="Telefone">
              <Input placeholder="Insira o telefone" />
            </Form.Item>

            <Form.Item name="cargo" label="Cargo">
              <Input placeholder="Insira o cargo" />
            </Form.Item>
          </div>
        </div>
      </Form>
    </div>
  );
}
