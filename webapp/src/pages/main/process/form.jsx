import { useState, useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import endpoints from "../../../utils/endpoints";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";

export default function RepHospitalForm() {
  const { hospitalId, respId } = useParams(); // respId só existe ao editar
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  // Carregar dados se estiver a editar
  useEffect(() => {
    if (respId) {
      setIsEditing(true);
      axios
        .get(`${endpoints.repHospital.readById}?id=${respId}`)
        .then((res) => form.setFieldsValue(res.data))
        .catch((err) => console.log(err));
    }
  }, [respId, form]);

  async function submitForm(values) {
    setLoading(true);
    try {
      const payload = { hospital_id: hospitalId, ...values };
      if (isEditing) {
        await axios.post(endpoints.repHospital.update, {
          data: { id: respId, ...values },
        });
      } else {
        await axios.post(endpoints.repHospital.create, { data: payload });
      }
      navigate(`/app/hospital/${hospitalId}/user`, {
        state: { success: true },
      });
    } catch (e) {
      if (e.response?.status == 409) {
        message.error(e.response.data.message);
      } else {
        message.error("Erro ao guardar representante");
      }
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    navigate(`/app/hospital/${hospitalId}/user`);
  }

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <p className="text-xl font-bold text-black">
          {isEditing ? "Editar representante" : "Criar representante"}
        </p>
      </div>

      <Form form={form} layout="vertical" onFinish={submitForm}>
        <div className="p-6 border-dashed border-2 border-[#8096A4] rounded-[10px] grid grid-cols-2 gap-4">
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

        <div className="flex justify-end mt-6 gap-2 items-center">
          <Button
            size="large"
            icon={<ArrowLeftOutlined />}
            type="alter"
            onClick={goBack}
          >
            Voltar
          </Button>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            className="!bg-[#F5702B] !rounded-[29px] !h-[40px] hover:!bg-transparent hover:!text-[#F5702B]"
            onClick={form.submit}
          >
            {isEditing ? "Atualizar representante" : "Criar representante"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
