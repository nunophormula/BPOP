import { useState, useEffect, useContext } from "react";
import { Form, Input, Button, Upload, Space, message } from "antd";
import {
  UploadOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import endpoints from "../../utils/endpoints";
import { Context } from "../../utils/context";

export default function UserProfileForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [fileList, setFileList] = useState([]);
  const navigate = useNavigate();
  const { ID } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const { user, setUser } = useContext(Context);
  const [messageApi, contextHolder] = message.useMessage();

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/svg+xml",
  ];

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        nome: user.nome,
        email: user.email,
        cargo: user.cargo,
        telefone: user.telefone,
        is_admin: user.is_admin == 1,
      });
      if (user.avatar) {
        setFileList([
          {
            uid: "-1",
            name: "avatar.png",
            status: "done",
            url: `http://localhost:4000${user.avatar}`, // URL completa do backend
          },
        ]);
      }
      setIsEditing(true);
    }
  }, [user, form]);

  const handleAvatarChange = ({ file }) => {
    if (file.status !== "uploading") {
      setAvatarFile(file);
    }
  };

  const handleBeforeUpload = (file) => {
    const isValidType = allowedTypes.includes(file.type);

    if (!isValidType) {
      message.error("Apenas imagens SVG, PNG ou JPG são permitidas.");
      return Upload.LIST_IGNORE;
    }

    return false; // mantém upload manual
  };

  async function submitForm(values) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("nome", values.nome);
      formData.append("email", values.email);
      formData.append("password", values.password || "");
      formData.append("cargo", values.cargo || "");
      formData.append("telefone", values.telefone || "");
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }
      formData.append("id", user.id);
      const response = await axios.post(endpoints.auth.update, formData);
      console.log(response);
      if (response.data.updated) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        messageApi.open({
          type: "success",
          content: "Perfil atualizado com sucesso",
        });
      } else {
        message.error(response.data.message || "Erro ao atualizar usuário");
      }
    } catch (e) {
      console.error(e);
      message.error("Erro ao salvar os dados");
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    navigate(-1);
  }

  return (
    <>
      {contextHolder}
      <div className="flex flex-col gap-6 p-2">
        <div className="flex justify-between items-center">
          <p className="text-xl font-bold text-black">
            {isEditing ? "Editar Perfil" : "Criar utilizador"}
          </p>

          <div className="flex gap-3">
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
          autoComplete="off"
        >
          <div className="py-8 px-10 rounded-[10px] shadow-[0px_10px_20px_#00000005] bg-white border border-2 border-[#EEEEEE]  ">
            <div className="grid grid-cols-2 gap-6">
              <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
                <Input placeholder="Insira o nome" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, type: "email" }]}
              >
                <Input placeholder="Insira o email" />
              </Form.Item>

              <Form.Item name="cargo" label="Cargo">
                <Input placeholder="Insira o cargo" />
              </Form.Item>

              <Form.Item name="telefone" label="Telefone">
                <Input placeholder="Insira o telefone" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                autoComplete="off"
                rules={[{ required: !isEditing }]}
              >
                <Input.Password
                  placeholder={isEditing ? "Introduza a password" : ""}
                  autoComplete="new-password"
                />
              </Form.Item>
              <Form.Item name="avatar" label="Avatar">
                <Upload
                  maxCount={1}
                  accept=".png,.jpg,.jpeg,.svg"
                  listType="picture"
                  style={{ width: "100%" }}
                  beforeUpload={() => false} // impede upload automático
                  fileList={fileList}
                  onChange={({ file, fileList: newFileList }) => {
                    // Atualiza o fileList do Upload
                    setFileList(newFileList);

                    // Atualiza o arquivo real para envio
                    if (file) {
                      setAvatarFile(file);
                    } else {
                      setAvatarFile(null);
                    }
                  }}
                  onRemove={(file) => {
                    setAvatarFile(null);
                    setFileList([]);
                  }}
                  showUploadList={{
                    showPreviewIcon: true,
                    showRemoveIcon: true,
                  }}
                >
                  <Button icon={<UploadOutlined />} style={{ width: "100%" }}>
                    Selecionar imagem
                  </Button>
                </Upload>
              </Form.Item>
            </div>
          </div>
        </Form>
      </div>
    </>
  );
}
