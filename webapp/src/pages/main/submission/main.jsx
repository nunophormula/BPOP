import axios from "axios";
import { useContext, useEffect, useState } from "react";
import endpoints from "../../../utils/endpoints";
import { Context } from "../../../utils/context";
import {
  Button,
  Table,
  Space,
  Avatar,
  Tooltip,
  Input,
  Switch,
  Modal,
  Form,
  Select,
  message,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import SubmissionDetailsDrawer from "../../../components/submission/detailsDrawer";

export default function Submission() {
  const { user } = useContext(Context);
  const [tableData, setTableData] = useState([]);
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [onlyMine, setOnlyMine] = useState(false);

  const [editForm] = Form.useForm();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    getData();
  }, []);

  function openDrawer(record) {
    console.log(record);
    setSelectedSubmission(record);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedSubmission(null);
  }

  function openEditModal(record) {
    setEditingSubmission(record);
    editForm.setFieldsValue({
      produto: record.produto,
      resultado: record.resultado,
      topografia: record.topografia,
      plataforma: record.plataforma,
      anticorpo: record.anticorpo,
    });
    setEditModalOpen(true);
  }

  async function handleEditSubmit(values) {
    setSavingEdit(true);
    try {
      await axios.post(endpoints.submissionHer.update, {
        id: editingSubmission.id,
        ...values,
      });
      message.success("Submissão atualizada com sucesso.");
      setEditModalOpen(false);
      getData();
    } catch (e) {
      message.error(
        e?.response?.data?.error || "Erro ao atualizar submissão."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Pesquisar ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: "block" }}
        />

        <Space>
          <Button type="primary" size="small" onClick={() => confirm()}>
            Pesquisar
          </Button>

          <Button
            size="small"
            onClick={() => {
              clearFilters?.();
              confirm();
            }}
          >
            Limpar
          </Button>
        </Space>
      </div>
    ),

    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? "#F5702B" : undefined,
        }}
      />
    ),

    onFilter: (value, record) =>
      String(record[dataIndex] ?? "")
        .toLowerCase()
        .includes(String(value).toLowerCase()),
  });

  function getData() {
    axios
      .get(endpoints.submissionHer.read)
      .then((res) => {
        setTableData(res.data);
      })
      .catch((err) => console.log(err));
  }

  const filteredData = onlyMine
    ? tableData.filter((item) => Number(item.login_id) === Number(user.id))
    : tableData;

  return (
    <>
      <div className="flex flex-col gap-6 p-2">
        <div className="flex justify-between items-center">
          <p className="text-xl font-bold text-black">Últimas submissões</p>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 px-4 rounded-[29px]">
              <Switch checked={onlyMine} onChange={setOnlyMine} />
              <span className="!text-[#F5702B]">
                Apenas as minhas submissões
              </span>
            </div>

            <Button
              type="primary"
              className="!text-[#F5702B] !bg-transparent !rounded-[29px] !h-[40px] hover:!bg-[#F5702B] hover:!text-[#fff]"
              onClick={() => navigate("/app/hospital/create")}
              icon={<ArrowLeftOutlined />}
            >
              Voltar
            </Button>
          </div>
        </div>

        <Table
          dataSource={filteredData}
          rowKey="id"
          columns={[
            {
              title: "Nº Processo",
              dataIndex: "patient",

              ...getColumnSearchProps("patient"),
            },
            {
              title: "Hospital",
              dataIndex: "hospital_nome",

              filters: [
                ...new Set(filteredData.map((item) => item.hospital_nome)),
              ].map((hospital) => ({
                text: hospital,
                value: hospital,
              })),

              onFilter: (value, record) => record.hospital_nome === value,
            },
            {
              title: "Rep. Hospitalar",

              render: (_, record) => (
                <Space>
                  <Avatar src={record.login_avatar} icon={<UserOutlined />}>
                    {!record.login_avatar && record.login_nome?.charAt(0)}
                  </Avatar>

                  <span>{record.login_nome}</span>
                </Space>
              ),

              filters: [
                ...new Set(
                  filteredData.map((item) => item.login_nome).filter(Boolean)
                ),
              ].map((nome) => ({
                text: nome,
                value: nome,
              })),

              filterSearch: (input, record) =>
                record.text.toLowerCase().includes(input.toLowerCase()),

              filterSearchPlaceholder: "Pesquisar representante", // não funciona em versões mais antigas

              onFilter: (value, record) => record.login_nome === value,
            },
            {
              title: "Biomarcador",
              dataIndex: "biomarcador",
            },
            {
              title: "Modelo Tumoral",
              dataIndex: "topografia",

              filters: [
                ...new Set(
                  filteredData.map((item) => item.topografia).filter(Boolean)
                ),
              ].map((topografia) => ({
                text: topografia,
                value: topografia,
              })),

              onFilter: (value, record) => record.topografia === value,
            },
            {
              title: "Resultado",
              dataIndex: "resultado",

              filters: [
                ...new Set(
                  filteredData.map((item) => item.resultado).filter(Boolean)
                ),
              ].map((resultado) => ({
                text: resultado,
                value: resultado,
              })),

              onFilter: (value, record) => record.resultado === value,
            },
            {
              title: "Ações",
              render: (_, record) => (
                <Space>
                  <Tooltip title="Ver submissão">
                    <Button
                      size="medium"
                      type="primary"
                      className="!text-[#F5702B] border border-[#F5702B] !bg-transparent !rounded-[50px] !h-[40px] !w-[40px] hover:!bg-[#F5702B] hover:!text-[#FFF]"
                      icon={<EyeOutlined />}
                      onClick={() => openDrawer(record)}
                    ></Button>
                  </Tooltip>

                  {Number(record.login_id) === Number(user.id) && (
                    <Tooltip title="Editar submissão">
                      <Button
                        size="medium"
                        type="primary"
                        className="!text-[#FFF] border border-[#F5702B] !bg-[#F5702B] !rounded-[50px] !h-[40px] !w-[40px] hover:!bg-transparent hover:!text-[#F5702B]"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(record)}
                      ></Button>
                    </Tooltip>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </div>

      <SubmissionDetailsDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        submission={selectedSubmission}
      />

      <Modal
        title={`Editar submissão${
          editingSubmission?.patient ? ` - ${editingSubmission.patient}` : ""
        }`}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={editForm.submit}
        confirmLoading={savingEdit}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="topografia" label="Modelo Tumoral">
            <Select
              placeholder="Selecionar modelo tumoral"
              options={[
                { label: "Mama", value: "Mama" },
                { label: "Estômago", value: "Estômago" },
                { label: "Gânglio", value: "Gânglio" },
                { label: "Cólon e recto", value: "Cólon e recto" },
                { label: "Endométrio", value: "Endométrio" },
                { label: "Ovário", value: "Ovário" },
              ]}
              allowClear
            />
          </Form.Item>

          <Form.Item name="plataforma" label="Plataforma">
            <Input placeholder="Plataforma IHQ" />
          </Form.Item>

          <Form.Item name="anticorpo" label="Anticorpo">
            <Input placeholder="Clone / anticorpo" />
          </Form.Item>

          <Form.Item name="produto" label="Produto">
            <Input placeholder="Tipo de amostra" />
          </Form.Item>

          <Form.Item name="resultado" label="Resultado">
            <Input placeholder="Resultado" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
