import { useState, useEffect, useContext } from "react";
import { Form, Input, Button, Select, Divider } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import endpoints from "../../../utils/endpoints";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { Context } from "../../../utils/context";
import { useHospitalId, useHospitalBasePath } from "../../../utils/hospitalId";

const distritosPT = [
  "Aveiro",
  "Beja",
  "Braga",
  "Bragança",
  "Castelo Branco",
  "Coimbra",
  "Évora",
  "Faro",
  "Guarda",
  "Leiria",
  "Lisboa",
  "Portalegre",
  "Porto",
  "Santarém",
  "Setúbal",
  "Viana do Castelo",
  "Vila Real",
  "Viseu",
];

export default function ProfileForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const ID = useHospitalId(); // Para edição
  const basePath = useHospitalBasePath();
  const [isEditing, setIsEditing] = useState(false);
  const [hospitalName, setHospitalName] = useState("");

  // Carrega os dados se estiver em edição
  useEffect(() => {
    if (ID) {
      setIsEditing(true);
      axios
        .get(`${endpoints.hospital.readById}?id=${ID}`)
        .then((res) => {
          const data = res.data[0];

          // Normaliza distrito para combinar com Select
          if (data.distrito) {
            const match = distritosPT.find(
              (d) => d.toLowerCase() === data.distrito.toLowerCase()
            );
            data.distrito = match || undefined;
          }

          setHospitalName(data.nome);

          form.setFieldsValue(data);
        })
        .catch((err) => console.log(err));
    }
  }, [ID, form]);

  async function submitForm(values) {
    setLoading(true);
    try {
      if (isEditing) {
        await axios.post(endpoints.hospital.update, {
          data: { id: ID, ...values },
        });
      } else {
        await axios.post(endpoints.hospital.create, { data: values });
      }
      // Admin volta para a lista; adminHospital/repHospitalar voltam para o
      // seu próprio hub (não têm acesso à lista de instituições).
      navigate(isEditing && user.role !== "admin" ? basePath : "/app/hospital");
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    navigate(isEditing ? basePath : "/app/hospital");
  }

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex justify-between items-center">
        {isEditing ? (
          <>
            <p className="text-xl text-black">
              <span className="font-bold">Instituição</span> | {hospitalName}
            </p>
          </>
        ) : (
          <p className="text-xl text-black">
            <span className="font-bold">Criar Instituição</span>
          </p>
        )}

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

      <Form
        form={form}
        layout="vertical"
        onFinish={submitForm}
        className="mt-4"
      >
        <div className="py-8 px-10 rounded-[10px] shadow-[0px_10px_20px_#00000005] bg-white border border-2 border-[#EEEEEE]  ">
          <div className="grid grid-cols-2 gap-6">
            <Form.Item name="nome" label="Nome" className="mb-0!">
              <Input placeholder="Insira o nome do hospital" />
            </Form.Item>

            <Form.Item name="email" label="Email" className="mb-0!">
              <Input placeholder="Insira o email" />
            </Form.Item>

            <Form.Item name="telefone" label="Telefone" className="mb-0!">
              <Input placeholder="Insira o telefone" />
            </Form.Item>

            <Form.Item name="distrito" label="Distrito" className="mb-0!">
              <Select
                showSearch
                optionFilterProp="children"
                placeholder="Selecione um distrito"
                value={form.getFieldValue("distrito")}
              >
                {distritosPT.map((d) => (
                  <Select.Option key={d} value={d}>
                    {d}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </div>
      </Form>
    </div>
  );
}
