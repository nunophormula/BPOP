import { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  message,
  Modal,
  Radio,
  Input,
  Space,
  Tooltip,
} from "antd";
import { useLocation } from "react-router-dom";
import {
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  LockOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import endpoints from "../../../utils/endpoints";

export default function Admin() {
  const { hospitalId } = useParams();
  const [data, setData] = useState([]);
  const [hospital, setHospital] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedResp, setSelectedResp] = useState(null);
  const [option, setOption] = useState("show");
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.success) {
      message.success("Representante salvo com sucesso!");
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    getResponsaveis();
  }, [hospitalId]);

  function getResponsaveis() {
    axios
      .get(endpoints.admin.read)
      .then((res) => {
        console.log(res.data);
        setData(res.data.admins);
      })
      .catch((err) => console.log(err));
  }

  function openModal(resp) {
    setSelectedResp(resp);
    setOption("show");
    setModalVisible(true);
  }

  async function handleGeneratePassword() {
    if (!selectedResp) return;
    setLoading(true);

    try {
      const response = await axios.post(
        endpoints.repHospital.generatePassword,
        {
          respId: selectedResp.id,
          sendEmail: option === "email",
        }
      );

      if (option === "show") {
        setGeneratedPassword(response.data.password);
      } else {
        message.success("Nova senha enviada por email com sucesso!");
        setModalVisible(false);
      }
    } catch (e) {
      console.error(e);
      message.error("Erro ao gerar a senha");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setGeneratedPassword("");
    setModalVisible(false);
  }

  // Função auxiliar para criar filtros por coluna
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Procurar ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            size="small"
            style={{ width: 90 }}
          >
            Pesquisar
          </Button>
          <Button
            onClick={() => handleReset(clearFilters, confirm, dataIndex)}
            size="small"
            style={{ width: 90 }}
          >
            Limpar
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase())
        : false,
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) setTimeout(() => searchInput.current?.select(), 100);
    },
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters, confirm, dataIndex) => {
    clearFilters();
    setSearchText("");
    handleSearch([], confirm, dataIndex);
  };

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex justify-between items-center">
        <p>
          <span className="text-xl font-bold text-black">Administradores</span>
        </p>
        <div className="gap-2 flex">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="!bg-[#F5702B] !rounded-[29px] !h-[40px] hover:!bg-transparent hover:!text-[#F5702B]"
            onClick={() => navigate(`/app/admin/create`)}
          >
            Criar administrador
          </Button>
        </div>
      </div>

      <Table
        dataSource={data}
        rowKey="ID"
        columns={[
          {
            title: "Nome",
            dataIndex: "nome",
            key: "nome",
            ...getColumnSearchProps("nome"),
          },
          {
            title: "Email",
            dataIndex: "email",
            key: "email",
            ...getColumnSearchProps("email"),
          },
          { title: "Telefone", dataIndex: "telefone", key: "telefone" },
          { title: "Cargo", dataIndex: "cargo", key: "cargo" },
          {
            title: "Ações",
            key: "acoes",
            render: (_, record) => (
              <div className="flex gap-2">
                <Tooltip title="Gerar password">
                  <Button
                    size="medium"
                    type="dashed"
                    icon={<LockOutlined />}
                    className="!text-[#F5702B] !border-dashed !border-[#F5702B] !bg-transparent !rounded-[50px] !h-[40px] !w-[40px] hover:!bg-[#F5702B] hover:!text-[#FFF]"
                    onClick={() => openModal(record)}
                  ></Button>
                </Tooltip>
                <Tooltip title="Ver detalhes">
                  <Button
                    size="medium"
                    type="primary"
                    icon={<EyeOutlined />}
                    className="!text-[#F5702B] border border-[#F5702B] !bg-transparent !rounded-[50px] !h-[40px] !w-[40px] hover:!bg-[#F5702B] hover:!text-[#FFF]"
                    onClick={() => {}}
                  ></Button>
                </Tooltip>
                <Tooltip title="Editar">
                  <Button
                    size="medium"
                    type="primary"
                    className="!text-[#FFF] border border-[#F5702B] !bg-[#F5702B] !rounded-[50px] !h-[40px] !w-[40px] hover:!bg-transparent hover:!text-[#F5702B]"
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/app/admin/${record.id}`)}
                  ></Button>
                </Tooltip>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={
          generatedPassword
            ? `Password gerada para ${selectedResp?.nome}`
            : `Gerar password para ${selectedResp?.nome}`
        }
        open={modalVisible}
        onCancel={handleClose}
        footer={
          generatedPassword ? (
            <Button type="primary" onClick={handleClose}>
              Fechar
            </Button>
          ) : (
            [
              <Button key="cancel" onClick={handleClose}>
                Cancelar
              </Button>,
              <Button
                key="generate"
                type="primary"
                loading={loading}
                onClick={handleGeneratePassword}
              >
                Gerar
              </Button>,
            ]
          )
        }
      >
        {generatedPassword ? (
          <div
            style={{
              padding: "10px",
              background: "#F3F4F6",
              borderRadius: "5px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {generatedPassword}
          </div>
        ) : (
          <Radio.Group
            value={option}
            onChange={(e) => setOption(e.target.value)}
          >
            <Radio value="show">Mostrar password gerada</Radio>
            <Radio value="email">Enviar password por email</Radio>
          </Radio.Group>
        )}
      </Modal>
    </div>
  );
}
