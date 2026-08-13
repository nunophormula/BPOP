import { useState, useEffect } from "react";
import { Form, Input, Select, Button, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import endpoints from "../../../utils/endpoints";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { useHospitalId, useHospitalBasePath } from "../../../utils/hospitalId";

export default function RepHospitalForm() {
  const { respId } = useParams();
  const hospitalId = useHospitalId();
  const basePath = useHospitalBasePath();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  // 2026/xxx
  // H(ano)/xxxx
  // B(ano)/xxxx
  // H(ano)0xxx
  // xxx/H(ano)

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
      navigate(`${basePath}/user`, {
        state: { success: true },
      });
    } catch (e) {
      if (e.response?.status == 409) {
        message.error(e.response.data.message);
      } else {
        message.error("Erro ao guardar utilizador");
      }
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    navigate(`${basePath}/user`);
  }

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex justify-between items-center">
        <p className="text-xl font-bold text-black">
          {isEditing ? "Editar utilizador" : "Criar utilizador"}
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
            {" "}
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
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: "Selecione o role" }]}
            >
              <Select
                placeholder="Selecionar role"
                options={[
                  { label: "Admin", value: "adminHospital" },
                  { label: "Representante", value: "repHospitalar" },
                ]}
              />
            </Form.Item>
          </div>
        </div>
      </Form>
    </div>
  );
}
