import { useContext, useEffect, useState } from "react";
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Divider,
  Tag,
  message,
  Popconfirm,
  Tooltip,
  Badge,
  Segmented,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import axios from "axios";

import endpoints from "../../../utils/endpoints";
import { Context } from "../../../utils/context";

const TABS = {
  platform: {
    key: "platform",
    tabLabel: "Plataforma",
    entityLabel: "plataforma",
    createLabel: "Criar nova plataforma",
    columnLabel: "Plataforma",
    placeholder: "Nome da plataforma (marca/modelo)",
  },
  antibody: {
    key: "antibody",
    tabLabel: "Anticorpo",
    entityLabel: "anticorpo",
    createLabel: "Criar novo anticorpo",
    columnLabel: "Anticorpo",
    placeholder: "Nome do anticorpo / clone",
  },
};

export default function DataManagement() {
  const { user } = useContext(Context);
  const canManage = user?.role === "admin";
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [activeTab, setActiveTab] = useState("platform");
  // activeTab também pode ser "pending" (a Tabs inclui esse separador), que
  // não existe em TABS — cai para "platform" nesse caso porque tudo o que
  // usa currentTab (colunas, modal, export) só é renderizado/aberto fora do
  // separador de pendentes.
  const currentTab = TABS[activeTab] || TABS.platform;
  const [data, setData] = useState({ platform: [], antibody: [] });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    platforms: 0,
    antibodies: 0,
    loadsToday: 0,
    total: 0,
    pending: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);

  const [reviewData, setReviewData] = useState({ pending: [], rejected: [] });
  const [reviewView, setReviewView] = useState("pending");
  const [reviewLoading, setReviewLoading] = useState(false);

  const [biomarkerForm] = Form.useForm();
  const [biomarkers, setBiomarkers] = useState([]);
  const [biomarkersLoading, setBiomarkersLoading] = useState(false);
  const [biomarkerModalOpen, setBiomarkerModalOpen] = useState(false);
  const [editingBiomarker, setEditingBiomarker] = useState(null);
  const [savingBiomarker, setSavingBiomarker] = useState(false);

  useEffect(() => {
    loadData("platform");
    loadData("antibody");
    loadBiomarkers();

    if (canManage) {
      loadStats();
      loadReview("rejected");
    }

    // Não-admin só vê o estado das próprias sugestões pendentes (o backend
    // já limita a resposta a created_by = utilizador atual).
    loadReview("pending");
  }, []);

  async function loadBiomarkers() {
    try {
      setBiomarkersLoading(true);
      const res = await axios.get(endpoints.biomarkers.read);
      setBiomarkers(res.data);
    } catch (e) {
      console.log(e);
    } finally {
      setBiomarkersLoading(false);
    }
  }

  async function loadStats() {
    try {
      const res = await axios.get(endpoints.dataManagement.stats);
      setStats(res.data);
    } catch (e) {
      console.log(e);
    }
  }

  async function loadData(type) {
    try {
      setLoading(true);
      const res = await axios.get(
        `${endpoints.dataManagement.read}?type=${type}`
      );
      setData((prev) => ({ ...prev, [type]: res.data }));
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadReview(status) {
    try {
      setReviewLoading(true);
      const [plats, antis] = await Promise.all([
        axios.get(
          `${endpoints.dataManagement.read}?type=platform&status=${status}`
        ),
        axios.get(
          `${endpoints.dataManagement.read}?type=antibody&status=${status}`
        ),
      ]);
      const merged = [
        ...plats.data.map((r) => ({
          ...r,
          tipo: "Plataforma",
          tipoKey: "platform",
        })),
        ...antis.data.map((r) => ({
          ...r,
          tipo: "Anticorpo",
          tipoKey: "antibody",
        })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setReviewData((prev) => ({ ...prev, [status]: merged }));
    } catch (e) {
      console.log(e);
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleApprove(record) {
    try {
      await axios.post(endpoints.dataManagement.approve, {
        type: record.tipoKey,
        id: record.id,
      });
      messageApi.success("Sugestão aprovada com sucesso.");
      loadReview("pending");
      loadStats();
      loadData(record.tipoKey);
    } catch (e) {
      messageApi.error(
        e?.response?.data?.message || "Erro ao aprovar sugestão."
      );
    }
  }

  async function handleReject(record) {
    try {
      await axios.post(endpoints.dataManagement.reject, {
        type: record.tipoKey,
        id: record.id,
      });
      messageApi.success("Sugestão rejeitada.");
      loadReview("pending");
      loadReview("rejected");
      loadStats();
    } catch (e) {
      messageApi.error(
        e?.response?.data?.message || "Erro ao rejeitar sugestão."
      );
    }
  }

  function openCreateModal() {
    setEditingRecord(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingRecord(record);
    form.setFieldsValue({ nome: record.nome });
    setModalOpen(true);
  }

  async function handleSubmit(values) {
    setSaving(true);
    try {
      if (editingRecord) {
        await axios.post(endpoints.dataManagement.update, {
          type: activeTab,
          id: editingRecord.id,
          nome: values.nome,
        });
        messageApi.success("Registo atualizado com sucesso.");
      } else {
        await axios.post(endpoints.dataManagement.create, {
          type: activeTab,
          nome: values.nome,
          admin_id: user?.id,
        });
        messageApi.success("Registo criado com sucesso.");
      }

      setModalOpen(false);
      loadData(activeTab);
      loadStats();
    } catch (e) {
      messageApi.error(
        e?.response?.data?.message || "Ocorreu um erro ao guardar o registo."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record) {
    try {
      await axios.post(endpoints.dataManagement.delete, {
        type: activeTab,
        id: record.id,
      });
      messageApi.success("Registo eliminado com sucesso.");
      loadData(activeTab);
      loadStats();
    } catch (e) {
      messageApi.error(
        e?.response?.data?.message || "Erro ao eliminar registo."
      );
    }
  }

  function openCreateBiomarkerModal() {
    setEditingBiomarker(null);
    biomarkerForm.resetFields();
    biomarkerForm.setFieldsValue({
      resultados: [{ value: undefined, keywords: [] }],
    });
    setBiomarkerModalOpen(true);
  }

  function openEditBiomarkerModal(record) {
    setEditingBiomarker(record);
    biomarkerForm.setFieldsValue({
      nome: record.nome,
      keywords: record.keywords || [],
      resultados: record.resultados?.length
        ? record.resultados.map((r) => ({
            value: r.value,
            keywords: r.keywords,
          }))
        : [{ value: undefined, keywords: [] }],
    });
    setBiomarkerModalOpen(true);
  }

  async function handleBiomarkerSubmit(values) {
    setSavingBiomarker(true);
    try {
      const payload = {
        nome: values.nome,
        keywords: values.keywords || [],
        resultados: (values.resultados || []).filter((r) => r?.value?.trim()),
      };

      if (editingBiomarker) {
        await axios.post(endpoints.biomarkers.update, {
          id: editingBiomarker.id,
          ...payload,
        });
        messageApi.success("Biomarcador atualizado com sucesso.");
      } else {
        await axios.post(endpoints.biomarkers.create, payload);
        messageApi.success("Biomarcador criado com sucesso.");
      }

      setBiomarkerModalOpen(false);
      loadBiomarkers();
    } catch (e) {
      messageApi.error(
        e?.response?.data?.message ||
          "Ocorreu um erro ao guardar o biomarcador."
      );
    } finally {
      setSavingBiomarker(false);
    }
  }

  async function handleDeleteBiomarker(record) {
    try {
      await axios.post(endpoints.biomarkers.delete, { id: record.id });
      messageApi.success("Biomarcador eliminado com sucesso.");
      loadBiomarkers();
    } catch (e) {
      messageApi.error(
        e?.response?.data?.message || "Erro ao eliminar biomarcador."
      );
    }
  }

  function exportToExcel() {
    const tab = currentTab;
    const rows = data[activeTab].map((r) => ({
      [tab.columnLabel]: r.nome,
      Administrador: r.administrador || "-",
      "N. utilizações": r.n_utilizacoes,
      Dia: dayjs(r.created_at).format("DD/MM/YYYY"),
      Hora: dayjs(r.created_at).format("HH:mm"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, tab.tabLabel);
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `${tab.entityLabel}s.xlsx`);
  }

  const columns = [
    {
      title: currentTab.columnLabel,
      dataIndex: "nome",
      key: "nome",
    },
    {
      title: "Administrador",
      dataIndex: "administrador",
      key: "administrador",
      render: (value) => value || "-",
    },
    {
      title: "N. utilizações",
      dataIndex: "n_utilizacoes",
      key: "n_utilizacoes",
    },
    {
      title: "Dia",
      dataIndex: "created_at",
      key: "dia",
      render: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      title: "Hora",
      dataIndex: "created_at",
      key: "hora",
      render: (value) => dayjs(value).format("HH:mm"),
    },
    ...(canManage
      ? [
          {
            title: "Ações",
            key: "acoes",
            render: (_, record) => {
              const alreadyUsed = record.n_utilizacoes > 0;

              return (
                <div className="flex gap-2">
                  <Tooltip title="Editar">
                    <Button
                      size="medium"
                      type="primary"
                      className="!text-[#FFF] border border-[#F5702B] !bg-[#F5702B] !rounded-[50px] !h-[36px] !w-[36px] hover:!bg-transparent hover:!text-[#F5702B]"
                      icon={<EditOutlined />}
                      onClick={() => openEditModal(record)}
                    ></Button>
                  </Tooltip>
                  <Tooltip
                    title={
                      alreadyUsed
                        ? `Este ${currentTab.entityLabel} já foi utilizado e não pode ser eliminado.`
                        : "Eliminar"
                    }
                  >
                    {alreadyUsed ? (
                      <Button
                        size="medium"
                        danger
                        disabled
                        className="!rounded-[50px] !h-[36px] !w-[36px]"
                        icon={<DeleteOutlined />}
                      ></Button>
                    ) : (
                      <Popconfirm
                        title={`Eliminar ${currentTab.entityLabel}?`}
                        onConfirm={() => handleDelete(record)}
                      >
                        <Button
                          size="medium"
                          danger
                          className="!rounded-[50px] !h-[36px] !w-[36px]"
                          icon={<DeleteOutlined />}
                        ></Button>
                      </Popconfirm>
                    )}
                  </Tooltip>
                </div>
              );
            },
          },
        ]
      : []),
  ];

  const biomarkerColumns = [
    {
      title: "Nome",
      dataIndex: "nome",
      key: "nome",
    },
    {
      title: "Palavras-chave",
      dataIndex: "keywords",
      key: "keywords",
      render: (keywords) => (
        <div className="flex flex-wrap gap-1 max-w-[320px]">
          {(keywords || []).slice(0, 4).map((k) => (
            <Tag key={k}>{k}</Tag>
          ))}
          {(keywords || []).length > 4 && <Tag>+{keywords.length - 4}</Tag>}
        </div>
      ),
    },
    {
      title: "Resultados",
      dataIndex: "resultados",
      key: "resultados",
      render: (resultados) => (resultados || []).length,
    },
    {
      title: "Administrador",
      dataIndex: "administrador",
      key: "administrador",
      render: (value) => value || "-",
    },
    {
      title: "Dia",
      dataIndex: "created_at",
      key: "dia",
      render: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    ...(canManage
      ? [
          {
            title: "Ações",
            key: "acoes",
            render: (_, record) => {
              const alreadyUsed = record.n_utilizacoes > 0;

              return (
                <div className="flex gap-2">
                  <Tooltip title="Editar">
                    <Button
                      size="medium"
                      type="primary"
                      className="!text-[#FFF] border border-[#F5702B] !bg-[#F5702B] !rounded-[50px] !h-[36px] !w-[36px] hover:!bg-transparent hover:!text-[#F5702B]"
                      icon={<EditOutlined />}
                      onClick={() => openEditBiomarkerModal(record)}
                    ></Button>
                  </Tooltip>
                  <Tooltip
                    title={
                      alreadyUsed
                        ? "Este biomarcador já foi utilizado e não pode ser eliminado."
                        : "Eliminar"
                    }
                  >
                    {alreadyUsed ? (
                      <Button
                        size="medium"
                        danger
                        disabled
                        className="!rounded-[50px] !h-[36px] !w-[36px]"
                        icon={<DeleteOutlined />}
                      ></Button>
                    ) : (
                      <Popconfirm
                        title="Eliminar biomarcador?"
                        onConfirm={() => handleDeleteBiomarker(record)}
                      >
                        <Button
                          size="medium"
                          danger
                          className="!rounded-[50px] !h-[36px] !w-[36px]"
                          icon={<DeleteOutlined />}
                        ></Button>
                      </Popconfirm>
                    )}
                  </Tooltip>
                </div>
              );
            },
          },
        ]
      : []),
  ];

  const myPendingColumns = [
    { title: "Nome", dataIndex: "nome", key: "nome" },
    { title: "Tipo", dataIndex: "tipo", key: "tipo" },
    {
      title: "Data",
      dataIndex: "created_at",
      key: "created_at",
      render: (value) => dayjs(value).format("DD/MM/YYYY HH:mm"),
    },
  ];

  const reviewColumns = (view) => {
    const base = [
      { title: "Nome", dataIndex: "nome", key: "nome" },
      { title: "Tipo", dataIndex: "tipo", key: "tipo" },
      {
        title: "Hospital que sugeriu",
        dataIndex: "hospital_nome",
        key: "hospital_nome",
        render: (value) => value || "-",
      },
      {
        title: "Sugerido por",
        dataIndex: "criado_por",
        key: "criado_por",
        render: (value) => value || "-",
      },
      {
        title: "Data",
        dataIndex: "created_at",
        key: "created_at",
        render: (value) => dayjs(value).format("DD/MM/YYYY HH:mm"),
      },
    ];

    if (view === "rejected") {
      return [
        ...base,
        {
          title: "Revisto por",
          dataIndex: "revisto_por",
          key: "revisto_por",
          render: (value) => value || "-",
        },
        {
          title: "Data de revisão",
          dataIndex: "reviewed_at",
          key: "reviewed_at",
          render: (value) =>
            value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-",
        },
      ];
    }

    return [
      ...base,
      {
        title: "Ações",
        key: "acoes",
        render: (_, record) => (
          <div className="flex gap-2">
            <Popconfirm
              title="Aprovar esta sugestão?"
              onConfirm={() => handleApprove(record)}
            >
              <Button
                size="medium"
                type="primary"
                className="!bg-[#F5702B] !rounded-[29px] !h-[36px]"
              >
                Aprovar
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Rejeitar esta sugestão?"
              onConfirm={() => handleReject(record)}
            >
              <Button
                size="medium"
                danger
                className="!rounded-[29px] !h-[36px]"
              >
                Rejeitar
              </Button>
            </Popconfirm>
          </div>
        ),
      },
    ];
  };

  const isPendingTab = activeTab === "pending";
  const isBiomarkerTab = activeTab === "biomarker";

  const statCards = [
    {
      label: (
        <>
          Nº de plataformas
          <br /> carregadas
        </>
      ),
      value: stats.platforms,
    },
    {
      label: (
        <>
          Nº de anticorpos
          <br /> carregados
        </>
      ),
      value: stats.antibodies,
    },
    {
      label: (
        <>
          Nº de biomarcadores
          <br /> carregados
        </>
      ),
      value: biomarkers.length,
    },
    {
      label: (
        <>
          Nº de carregamentos
          <br /> feitos hoje
        </>
      ),
      value: stats.loadsToday,
    },
  ];

  return (
    <>
      {contextHolder}
      <div className="flex flex-col gap-6 p-2">
        <p className="text-xl font-bold text-black">Gestão de dados</p>

        {canManage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="py-6 px-6 rounded-[10px] shadow-[0px_10px_20px_#00000005] bg-white border border-[#EEEEEE] text-center"
              >
                <p className="text-gray-500 mb-2">{card.label}</p>
                <p className="text-3xl font-bold text-[#F5702B]">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-[10px] shadow-[0px_10px_20px_#00000005] bg-white border border-[#EEEEEE] p-6">
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            items={[
              ...Object.values(TABS).map((tab) => ({
                key: tab.key,
                label: tab.tabLabel,
              })),
              {
                key: "biomarker",
                label: "Biomarcador",
              },
              {
                key: "pending",
                label: (
                  <Badge
                    count={
                      canManage ? stats.pending : reviewData.pending.length
                    }
                    size="small"
                    offset={[10, 0]}
                  >
                    <span>Pendentes</span>
                  </Badge>
                ),
              },
            ]}
            tabBarExtraContent={
              canManage &&
              !isPendingTab && (
                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  className="!text-[#F5702B]"
                  onClick={
                    isBiomarkerTab ? openCreateBiomarkerModal : openCreateModal
                  }
                >
                  {isBiomarkerTab
                    ? "Criar novo biomarcador"
                    : currentTab.createLabel}
                </Button>
              )
            }
          />

          {isPendingTab ? (
            canManage ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-semibold">Sugestões</p>
                  <Segmented
                    value={reviewView}
                    onChange={setReviewView}
                    options={[
                      { label: "Pendentes", value: "pending" },
                      { label: "Rejeitados", value: "rejected" },
                    ]}
                  />
                </div>

                <Table
                  loading={reviewLoading}
                  dataSource={reviewData[reviewView]}
                  rowKey={(record) => `${record.tipoKey}-${record.id}`}
                  columns={reviewColumns(reviewView)}
                />
              </>
            ) : (
              <>
                <p className="font-semibold mb-4">
                  As minhas sugestões pendentes
                </p>

                <Table
                  loading={reviewLoading}
                  dataSource={reviewData.pending}
                  rowKey={(record) => `${record.tipoKey}-${record.id}`}
                  columns={myPendingColumns}
                />
              </>
            )
          ) : isBiomarkerTab ? (
            <>
              <p className="font-semibold mb-4">Biomarcadores</p>

              <Table
                loading={biomarkersLoading}
                dataSource={biomarkers}
                rowKey="id"
                columns={biomarkerColumns}
              />
            </>
          ) : (
            <>
              <p className="font-semibold mb-4">Carregamentos</p>

              <Table
                loading={loading}
                dataSource={data[activeTab]}
                rowKey="id"
                columns={columns}
              />

              <div className="flex justify-end mt-4">
                <Button
                  icon={<DownloadOutlined />}
                  className="!text-[#F5702B] !border !border-[#F5702B] !bg-transparent !rounded-[29px] !h-[40px] hover:!bg-[#F5702B] hover:!text-[#fff]"
                  onClick={exportToExcel}
                >
                  Exportar {currentTab.tabLabel.toLowerCase()}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        title={
          editingRecord
            ? `Editar ${currentTab.entityLabel}`
            : currentTab.createLabel
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={form.submit}
        confirmLoading={saving}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="nome"
            label="Nome"
            rules={[{ required: true, message: "Por favor insira o nome" }]}
          >
            <Input placeholder={currentTab.placeholder} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          editingBiomarker ? "Editar biomarcador" : "Criar novo biomarcador"
        }
        open={biomarkerModalOpen}
        onCancel={() => setBiomarkerModalOpen(false)}
        onOk={biomarkerForm.submit}
        confirmLoading={savingBiomarker}
        okText="Guardar"
        cancelText="Cancelar"
        width={700}
        centered
        styles={{
          body: { maxHeight: "80vh", overflowY: "auto", paddingRight: 8 },
        }}
      >
        <Form
          form={biomarkerForm}
          layout="vertical"
          onFinish={handleBiomarkerSubmit}
        >
          <Form.Item
            name="nome"
            label="Nome"
            rules={[{ required: true, message: "Por favor insira o nome" }]}
          >
            <Input placeholder="Nome do biomarcador (ex: HER2)" />
          </Form.Item>

          <Form.Item
            name="keywords"
            label="Palavras-chave"
            tooltip="Usadas para detetar o biomarcador em texto livre (PDF/Excel)"
            rules={[
              {
                required: true,
                message: "Insira pelo menos uma palavra-chave",
              },
            ]}
          >
            <Select
              mode="tags"
              tokenSeparators={[","]}
              placeholder="Escreva e prima Enter para adicionar"
            />
          </Form.Item>

          <Divider orientation="left" plain>
            Resultados possíveis
          </Divider>

          <Form.List name="resultados">
            {(fields, { add, remove }) => (
              <div className="flex flex-col gap-4">
                {fields.map((field) => (
                  <div
                    key={field.key}
                    className="border border-[#EEEEEE] rounded-lg p-4 relative"
                  >
                    {fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        className="!absolute top-2 right-2"
                        onClick={() => remove(field.name)}
                      />
                    )}

                    <Form.Item
                      {...field}
                      name={[field.name, "value"]}
                      label="Valor do resultado"
                      rules={[{ required: true, message: "Insira o valor" }]}
                    >
                      <Input placeholder="Ex: 3+, Negativo (0), Positivo" />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      name={[field.name, "keywords"]}
                      label="Palavras-chave do resultado"
                      rules={[
                        {
                          required: true,
                          message: "Insira pelo menos uma palavra-chave",
                        },
                      ]}
                    >
                      <Select
                        mode="tags"
                        tokenSeparators={[","]}
                        placeholder="Escreva e prima Enter para adicionar"
                      />
                    </Form.Item>
                  </div>
                ))}

                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => add({ value: undefined, keywords: [] })}
                >
                  Adicionar resultado
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  );
}
