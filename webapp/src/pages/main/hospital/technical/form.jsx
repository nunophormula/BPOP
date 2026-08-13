import { useState, useEffect, useContext } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  message,
  Divider,
  Modal,
  Alert,
} from "antd";

import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";

import endpoints from "../../../../utils/endpoints";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  useHospitalId,
  useHospitalBasePath,
} from "../../../../utils/hospitalId";
import { Context } from "../../../../utils/context";

function ensureOptionPresent(setList, nome, id, status) {
  if (!nome) return;

  setList((prev) =>
    prev.some((item) => item.nome === nome)
      ? prev
      : [...prev, { id, nome, status }]
  );
}

// Topografias válidas por biomarcador — o PD-L1 usa TPS/CPS consoante o
// tumor, por isso não faz sentido partilhar a mesma lista do HER2.
const TOPOGRAFIAS_POR_BIOMARCADOR = {
  "PD-L1": [
    "Pulmão",
    "Melanoma",
    "Bexiga",
    "Mesotelioma",
    "Indeterminado",
    "Cabeça e pescoço",
    "Esófago",
    "Estômago",
    "Junção gastro-esofágica",
    "Colo do útero",
    "Mama",
    "Estômago e junção esofago-gástrica",
    "Endométrio",
    "Ovário",
  ],
  HER2: [
    "Mama",
    "Estômago",
    "Cólon e recto",
    "Endométrio",
    "Colo do útero",
    "Ovário",
    "Gânglio",
    "Estômago e junção esofago-gástrica",
    "Vias Biliares",
    "Bexiga",
  ],
  RE: ["Mama", "Endométrio", "Ovário"],
  RP: ["Mama", "Endométrio", "Ovário"],
  Ki67: ["Mama"],
  MLH1: [
    "Esófago",
    "Estômago e junção esofago-gástrica",
    "Cólon e recto",
    "Vias Biliares",
    "Endométrio",
    "Ovário",
  ],
  PMS2: [
    "Esófago",
    "Estômago e junção esofago-gástrica",
    "Cólon e recto",
    "Vias Biliares",
    "Endométrio",
    "Ovário",
  ],
  MSH2: [
    "Esófago",
    "Estômago e junção esofago-gástrica",
    "Cólon e recto",
    "Vias Biliares",
    "Endométrio",
    "Ovário",
  ],
  MSH6: [
    "Esófago",
    "Estômago e junção esofago-gástrica",
    "Cólon e recto",
    "Vias Biliares",
    "Endométrio",
    "Ovário",
  ],
  "Claudina 18.2": ["Estômago e junção esofago-gástrica"],
  EBER: ["Estômago e junção esofago-gástrica"],
  p53: ["Endométrio", "Ovário"],
  FOLR1: ["Ovário"],
};

const IDENTIFICATION_FIELDS = [
  "biomarcador",
  "topografia",
  "plataforma",
  "anticorpo",
];

const fields = [
  {
    name: "biomarcador",
    label: "Biomarcador",
    type: "dropdown",
    options: ["HER2", "PD-L1"],
  },

  {
    name: "topografia",
    label: "Modelo Tumoral",
    type: "dropdown",
    options: [],
  },

  {
    name: "plataforma",
    label: "Plataforma utilizada (marca/modelo)",
    type: "dropdown",
    optionsSource: "platform",
  },

  {
    name: "anticorpo",
    label: "Anticorpo / Clone utilizado",
    type: "dropdown",
    optionsSource: "antibody",
  },

  {
    name: "criteriosUtilizados",
    label: "Critérios utilizados",
    type: "dropdown",
    options: [
      "ASCO/CAP 2018/2023 (mama)",
      "Destiny Breast 08 (mama)",
      "CAP/ASCP/ASCO 2016 (esófago/estômago)",
      "HERAccles (cólon)",
      "Buza (endométrio)",
      "Outro",
    ],
  },

  {
    name: "temperaturaBanhos",
    label: "Temperatura média dos banhos de extensão (ºC)",
    type: "number",
  },

  {
    name: "temperaturaEstufa",
    label: "Temperatura média da estufa (ºC)",
    type: "number",
  },

  {
    name: "espessuraCortes",
    label: "Espessura dos cortes (µm)",
    type: "number",
  },

  {
    name: "controlosInternos",
    label: "São utilizados controlos / testemunhos na lâmina?",
    type: "dropdown",
    options: ["Sim", "Não"],
  },

  {
    name: "tecidosUtilizados",
    label: "Tecidos utilizados",
    type: "text",
  },

  {
    name: "tipoRecuperacao",
    label: "Tipo de recuperação antigénica",
    type: "text",
  },

  {
    name: "tempoRecuperacao",
    label: "Tempo de recuperação antigénica",
    type: "number",
  },

  {
    name: "temperaturaRecuperacao",
    label: "Temperatura da recuperação antigénica",
    type: "number",
  },

  {
    name: "tempoIncubacao",
    label: "Tempo de incubação do anticorpo primário (min)",
    type: "number",
  },

  {
    name: "validacoesInternas",
    label: "Validações internas?",
    type: "dropdown",
    options: ["Sim", "Não"],
  },

  {
    name: "periodicidade",
    label: "Como / periodicidade",
    type: "number",
  },

  {
    name: "avaliacaoExterna",
    label: "Avaliação Externa da Qualidade?",
    type: "dropdown",
    options: ["Sim", "Não", "Outro"],
  },

  {
    name: "programasQualidade",
    label: "Programas realizados",
    type: "dropdown",
    options: ["NordiQC", "UK-NEQAS", "Outro"],
  },

  {
    name: "numeroTestesAno",
    label: "Nº anual de testes / ano",
    type: "number",
  },

  {
    name: "taxaRepeticoes",
    label: "Taxa anual de repetições da técnica",
    type: "number",
  },

  {
    name: "percentagemExpressao",
    label: "Percentagem de células com expressão",
    type: "number",
  },
];

export default function TechnicalForm() {
  const [form] = Form.useForm();
  const biomarcador = Form.useWatch("biomarcador", form);
  const plataformaValue = Form.useWatch("plataforma", form);
  const anticorpoValue = Form.useWatch("anticorpo", form);

  const [hospitalName, setHospitalName] = useState("");
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [antibodies, setAntibodies] = useState([]);

  const [suggestForm] = Form.useForm();
  const [suggestModal, setSuggestModal] = useState({ open: false, type: null });
  const [suggesting, setSuggesting] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();
  const { technicalId } = useParams();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get("duplicate");
  const isDuplicate = !technicalId && !!duplicateId;
  const ID = useHospitalId();
  const basePath = useHospitalBasePath();
  const { user } = useContext(Context);

  const navigate = useNavigate();

  // Estado (approved/pending/rejected) da plataforma/anticorpo atualmente
  // escolhidos — vem de platforms/antibodies, que tanto tem os aprovados
  // (loadOptions) como o registo atual injetado por ensureOptionPresent
  // (edição) ou pela sugestão que se acabou de criar (handleSuggestSubmit).
  const plataformaStatus = platforms.find(
    (p) => p.nome === plataformaValue
  )?.status;
  const anticorpoStatus = antibodies.find(
    (a) => a.nome === anticorpoValue
  )?.status;

  const pendingLabels = [];

  if (plataformaValue && plataformaStatus && plataformaStatus !== "approved") {
    pendingLabels.push(
      `Plataforma "${plataformaValue}" (${
        plataformaStatus === "pending" ? "pendente de aprovação" : "rejeitada"
      })`
    );
  }

  if (anticorpoValue && anticorpoStatus && anticorpoStatus !== "approved") {
    pendingLabels.push(
      `Anticorpo "${anticorpoValue}" (${
        anticorpoStatus === "pending" ? "pendente de aprovação" : "rejeitado"
      })`
    );
  }

  const naoValidado = pendingLabels.length > 0;

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (!ID) return;

    loadHospital();
    form.resetFields();
    loadTechnical();
  }, [ID, technicalId, duplicateId]);

  async function loadOptions() {
    try {
      const [platformsRes, antibodiesRes] = await Promise.all([
        axios.get(`${endpoints.dataManagement.read}?type=platform`),
        axios.get(`${endpoints.dataManagement.read}?type=antibody`),
      ]);
      setPlatforms(platformsRes.data);
      setAntibodies(antibodiesRes.data);
    } catch (e) {
      console.log(e);
    }
  }

  async function loadHospital() {
    try {
      const res = await axios.get(`${endpoints.hospital.readById}?id=${ID}`);

      setHospitalName(res.data?.[0]?.nome || "");
    } catch (e) {
      console.log(e);
    }
  }

  async function loadTechnical() {
    try {
      const res = await axios.get(
        `${endpoints.hospital.readTechnicalByHospital}?id=${ID}`
      );
      setTemplates(res.data);
      if (technicalId) {
        const thisTemplate = res.data.filter((r) => {
          return r.id == technicalId;
        })?.[0];

        form.setFieldsValue(thisTemplate);

        // Se a plataforma/anticorpo do template ainda não estiverem
        // aprovados, não aparecem na lista de "approved" do loadOptions —
        // sem isto o Select ficava vazio ao editar um template não validado.
        ensureOptionPresent(
          setPlatforms,
          thisTemplate?.plataforma,
          thisTemplate?.plataforma_id,
          thisTemplate?.plataforma_status
        );
        ensureOptionPresent(
          setAntibodies,
          thisTemplate?.anticorpo,
          thisTemplate?.anticorpo_id,
          thisTemplate?.anticorpo_status
        );
      } else if (duplicateId) {
        const sourceTemplate = res.data.find((r) => r.id == duplicateId);

        if (!sourceTemplate) return;

        // Só os "Dados Técnicos" vêm preenchidos — biomarcador, topografia,
        // plataforma e anticorpo ficam em branco porque são a chave de
        // duplicidade do template e têm de ser escolhidos de novo.
        const technicalValues = {};

        fields
          .filter((f) => !IDENTIFICATION_FIELDS.includes(f.name))
          .forEach((f) => {
            technicalValues[f.name] = sourceTemplate[f.name];
          });

        form.setFieldsValue(technicalValues);
      }
    } catch (e) {
      console.log(e);
    }
  }

  function openSuggestModal(type) {
    suggestForm.resetFields();
    setSuggestModal({ open: true, type });
  }

  async function handleSuggestSubmit(values) {
    setSuggesting(true);
    try {
      const res = await axios.post(endpoints.dataManagement.suggest, {
        type: suggestModal.type,
        nome: values.nome,
      });

      const nome = values.nome.trim();

      // A sugestão já pode ser usada de imediato — fica selecionada no
      // template, que fica sinalizado como "não validado" (naoValidado)
      // até a sugestão ser aprovada pelo administrador.
      if (suggestModal.type === "platform") {
        setPlatforms((prev) => [
          ...prev,
          { id: res.data.id, nome, status: res.data.status },
        ]);
        form.setFieldValue("plataforma", nome);
      } else {
        setAntibodies((prev) => [
          ...prev,
          { id: res.data.id, nome, status: res.data.status },
        ]);
        form.setFieldValue("anticorpo", nome);
      }

      messageApi.success(
        "Sugestão enviada! Já pode guardar o template com este valor — vai ficar assinalado como \"por aprovar\" e não poderá ser usado em submissões até a sugestão ser aprovada pelo administrador."
      );
      setSuggestModal({ open: false, type: null });
    } catch (e) {
      messageApi.error(
        e?.response?.data?.message || "Ocorreu um erro ao enviar a sugestão."
      );
    } finally {
      setSuggesting(false);
    }
  }

  function handleValuesChange(changedValues) {
    if (!("biomarcador" in changedValues)) return;

    const allowed =
      TOPOGRAFIAS_POR_BIOMARCADOR[changedValues.biomarcador] || [];
    const currentTopografia = form.getFieldValue("topografia");

    if (currentTopografia && !allowed.includes(currentTopografia)) {
      form.setFieldValue("topografia", undefined);
    }
  }

  const renderField = (field) => {
    switch (field.type) {
      case "number":
        return (
          <InputNumber
            style={{ width: "100%" }}
            className="!border-[#EEEEEE] !h-[40px]"
            placeholder={`Insira ${field.label}`}
          />
        );

      case "dropdown": {
        const sourceOptions =
          field.name === "topografia"
            ? TOPOGRAFIAS_POR_BIOMARCADOR[biomarcador] || []
            : field.optionsSource === "platform"
            ? platforms.map((p) => p.nome)
            : field.optionsSource === "antibody"
            ? antibodies.map((a) => a.nome)
            : field.options;

        const isTopografiaWaitingForBiomarcador =
          field.name === "topografia" && !biomarcador;

        const canSuggest =
          user?.role !== "admin" &&
          (field.optionsSource === "platform" ||
            field.optionsSource === "antibody");

        return (
          <Select
            showSearch
            allowClear
            disabled={isTopografiaWaitingForBiomarcador}
            className="!border-[#EEEEEE]"
            placeholder={
              isTopografiaWaitingForBiomarcador
                ? "Selecione primeiro o biomarcador"
                : `Selecione ${field.label}`
            }
            options={sourceOptions.map((option) => ({
              label: option,
              value: option,
            }))}
            {...(canSuggest && {
              dropdownRender: (menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: "4px 0" }} />
                  <div
                    style={{ padding: "4px 8px" }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <Button
                      type="text"
                      block
                      icon={<PlusOutlined />}
                      onClick={() => openSuggestModal(field.optionsSource)}
                    >
                      {field.optionsSource === "platform"
                        ? "Sugerir nova plataforma"
                        : "Sugerir novo anticorpo"}
                    </Button>
                  </div>
                </>
              ),
            })}
          />
        );
      }

      default:
        return (
          <Input
            className="!border-[#EEEEEE] !h-[40px]"
            placeholder={`Insira ${field.label}`}
          />
        );
    }
  };

  async function onFinish(values) {
    try {
      setLoading(true);
      const isEdit = !!technicalId;
      const duplicate = templates.find((item) => {
        if (
          item.biomarcador !== values.biomarcador ||
          item.topografia !== values.topografia ||
          item.anticorpo !== values.anticorpo
        ) {
          return false;
        }
        if (isEdit && item.id === Number(technicalId)) {
          return false;
        }
        return true;
      });
      if (duplicate) {
        messageApi.error(
          `Já existe um template para ${values.biomarcador} / ${values.topografia} / ${values.anticorpo}.`
        );
        return;
      }
      const matchedPlatform = platforms.find(
        (p) => p.nome === values.plataforma
      );
      const matchedAntibody = antibodies.find(
        (a) => a.nome === values.anticorpo
      );

      await axios.post(endpoints.hospital.saveTechnical, {
        technical_id: technicalId || null,
        data: {
          hospital_id: Number(ID),
          biomarcador: values.biomarcador || null,
          topografia: values.topografia || null,
          plataforma: values.plataforma || null,
          anticorpo: values.anticorpo || null,
          plataforma_id: matchedPlatform?.id || null,
          anticorpo_id: matchedAntibody?.id || null,
          ...values,
        },
      });
      messageApi.success(
        isEdit
          ? "Template editado com sucesso."
          : "Template criado com sucesso."
      );
      navigate(`${basePath}/technical`);
    } catch (e) {
      console.log(e);
      messageApi.error(
        e?.response?.data?.message || "Ocorreu um erro ao guardar o template."
      );
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    navigate(`${basePath}/technical`);
  }

  return (
    <>
      {contextHolder}
      <div className="flex flex-col gap-6 p-2">
        <div className="flex justify-between items-center">
          <p className="text-xl text-black">
            <span className="font-bold">Instituição</span> | {hospitalName}
          </p>

          <div className="flex gap-3">
            <Button
              size="large"
              type="alter"
              icon={<ArrowLeftOutlined />}
              onClick={goBack}
              className="!text-[#F5702B] !border !border-[#F5702B] !bg-transparent !rounded-[29px] !h-[40px]"
            >
              Voltar
            </Button>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={form.submit}
              className="!bg-[#F5702B] !rounded-[29px] !h-[40px]"
            >
              Guardar
            </Button>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onValuesChange={handleValuesChange}
        >
          <div className="py-8 px-10 rounded-[10px] shadow-[0px_10px_20px_#00000005] bg-white border border-[#EEEEEE]">
            <strong className="text-lg">
              {technicalId
                ? "Editar template"
                : isDuplicate
                ? "Duplicar template"
                : "Criar novo template"}
            </strong>
            <Divider />
            <h3 className="font-semibold mb-6">Identificação</h3>
            {naoValidado && (
              <Alert
                type="warning"
                showIcon
                className="!mb-6"
                message="Template por aprovar"
                description={`${pendingLabels.join(
                  " e "
                )} — pode guardar este template, mas ele fica assinalado como "por aprovar" e não pode ser usado em submissões até a sugestão ser aprovada pelo administrador.`}
              />
            )}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {fields
                .filter((f) => IDENTIFICATION_FIELDS.includes(f.name))
                .map((field) => (
                  <Form.Item
                    key={field.name}
                    name={field.name}
                    label={field.label}
                  >
                    {renderField(field)}
                  </Form.Item>
                ))}
            </div>
            <Divider />
            <h3 className="font-semibold mb-6">Dados Técnicos</h3>
            <div className="grid grid-cols-2 gap-6">
              {fields
                .filter((f) => !IDENTIFICATION_FIELDS.includes(f.name))
                .map((field) => (
                  <Form.Item
                    key={field.name}
                    name={field.name}
                    label={field.label}
                  >
                    {renderField(field)}
                  </Form.Item>
                ))}
            </div>
          </div>
        </Form>
      </div>

      <Modal
        title={
          suggestModal.type === "platform"
            ? "Sugerir nova plataforma"
            : "Sugerir novo anticorpo"
        }
        open={suggestModal.open}
        onCancel={() => setSuggestModal({ open: false, type: null })}
        onOk={suggestForm.submit}
        confirmLoading={suggesting}
        okText="Enviar sugestão"
        cancelText="Cancelar"
      >
        <p className="text-gray-500 mb-4">
          A sua sugestão será enviada para aprovação do administrador. Já pode
          guardar o template com este valor, mas fica assinalado como "por
          aprovar" e não poderá ser usado em submissões até a sugestão ser
          aprovada.
        </p>
        <Form
          form={suggestForm}
          layout="vertical"
          onFinish={handleSuggestSubmit}
        >
          <Form.Item
            name="nome"
            label="Nome"
            rules={[{ required: true, message: "Por favor insira o nome" }]}
          >
            <Input
              placeholder={
                suggestModal.type === "platform"
                  ? "Nome da plataforma (marca/modelo)"
                  : "Nome do anticorpo / clone"
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
