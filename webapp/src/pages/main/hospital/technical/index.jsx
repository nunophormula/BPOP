import { useState, useEffect } from "react";
import { Button, Spin, Empty, message, Popconfirm, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import endpoints from "../../../../utils/endpoints";
import {
  useHospitalId,
  useHospitalBasePath,
} from "../../../../utils/hospitalId";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { Card, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SwapOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import addTemplateImg from "../../../../assets/Adicionar-novo-template.svg";

export default function TechnicalList() {
  const [hospitalName, setHospitalName] = useState("");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  const ID = useHospitalId();
  const basePath = useHospitalBasePath();
  const navigate = useNavigate();

  const topographyColors = {
    Mama: "magenta",
    Estômago: "orange",
    "Cólon e recto": "green",
    Endométrio: "purple",
    "Colo do útero": "volcano",
    Ovário: "cyan",
    Gânglio: "blue",
    Outro: "default",
  };

  function getTopographyColor(topografia) {
    return topographyColors[topografia] || "default";
  }

  // Não validado = a plataforma e/ou o anticorpo do template ainda são uma
  // sugestão pendente (ou foram rejeitados) e não uma opção já aprovada.
  function isNaoValidado(template) {
    return (
      (template.plataforma_status &&
        template.plataforma_status !== "approved") ||
      (template.anticorpo_status && template.anticorpo_status !== "approved")
    );
  }

  useEffect(() => {
    if (ID) {
      loadHospital();
      loadTemplates();
    }
  }, [ID]);

  async function loadHospital() {
    try {
      const res = await axios.get(`${endpoints.hospital.readById}?id=${ID}`);

      console.log(res);

      setHospitalName(res.data?.[0]?.nome || "");
    } catch (e) {
      console.log(e);
    }
  }

  async function loadTemplates() {
    try {
      setLoading(true);

      const res = await axios.get(
        `${endpoints.hospital.readTechnicalByHospital}?id=${ID}`
      );

      const ordered = (res.data || []).sort(
        (a, b) => (b.is_default || 0) - (a.is_default || 0)
      );

      setTemplates(ordered);
    } catch (e) {
      console.log(e);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    navigate(basePath);
  }

  function createTemplate() {
    navigate(`${basePath}/technical/create`);
  }

  function openTemplate(templateId) {
    navigate(`${basePath}/technical/${templateId}`);
  }

  function duplicateTemplate(templateId) {
    navigate(`${basePath}/technical/create?duplicate=${templateId}`);
  }

  async function handleDelete(templateId) {
    try {
      await axios.delete(
        `${endpoints.hospital.deleteTechnical}?id=${templateId}`
      );

      message.success("Template eliminado com sucesso");

      setTemplates((prev) => prev.filter((item) => item.id !== templateId));

      // ou:
      // loadTemplates();
    } catch (e) {
      console.log(e);
      message.error("Erro ao eliminar template");
    }
  }

  async function handleSwitch(templateId) {
    try {
      await axios.post(endpoints.hospital.defaultTechnical, {
        id: templateId,
        hospital_id: ID,
      });

      setTemplates((prev) =>
        prev.map((item) => ({
          ...item,
          is_default: item.id === templateId ? 1 : 0,
        }))
      );

      message.success("Template padrão alterado com sucesso.");
    } catch (e) {
      console.log(e);
      message.error("Erro ao alterar template padrão.");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex justify-between items-center">
        <p className="text-xl text-black">
          <span className="font-bold">Templates</span> | {hospitalName}
        </p>

        <div className="flex gap-2">
          <Button
            size="large"
            type="alter"
            className="!text-[#F5702B] border !border-[#F5702B] !bg-transparent !rounded-[29px] !h-[40px] hover:!bg-[#F5702B] hover:!text-[#fff]"
            icon={<ArrowLeftOutlined />}
            onClick={goBack}
          >
            Voltar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : templates.length === 0 ? (
        <div className="border border-dashed border-[#8096A4] rounded-[10px] p-10 bg-white">
          <Empty description="Nenhum template encontrado" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div
            onClick={createTemplate}
            className="
      bg-white
      border border-dashed border-[#E5E5E5]
      rounded-2xl
      min-h-[300px]
      cursor-pointer
      flex flex-col
      items-center
      justify-center
      hover:border-[#F5702B]
      transition-all
    "
          >
            <img src={addTemplateImg} className="mb-4" />

            <p className="font-semibold text-lg">Adicionar novo template</p>
          </div>

          {templates.map((template) => (
            <div
              key={template.id}
              className={`
        bg-white
        rounded-2xl
        overflow-hidden
        border
        transition-all
        hover:shadow-lg

        ${template.is_default ? "border-[#F5702B]" : "border-[#EEEEEE]"}
      `}
            >
              <div className="p-6 min-h-[240px]">
                <div className="flex flex-row items-start justify-between mb-4">
                  <div>
                    <div>
                      <p className="text-[#9A9A9A]">Biomarcador</p>

                      <p className="font-medium text-[14px]">
                        {template.biomarcador}
                      </p>
                    </div>
                  </div>
                  <Tag color={getTopographyColor(template.topografia)}>
                    {template.topografia}
                  </Tag>
                </div>

                {isNaoValidado(template) && (
                  <Tooltip title="A plataforma e/ou o anticorpo deste template ainda são uma sugestão pendente de aprovação (ou foi rejeitada). Este template não pode ser usado em submissões até ser aprovado pelo administrador.">
                    <Tag color="warning" className="!mb-3">
                      Pendente de aprovação
                    </Tag>
                  </Tooltip>
                )}

                <div className="space-y-3">
                  <div>
                    <p className="text-[#9A9A9A]">Plataforma</p>

                    <p className="font-400 text-[14px]">
                      {template.plataforma}
                    </p>
                  </div>

                  <div>
                    <p className="text-[#9A9A9A]">Clone</p>

                    <p className="font-400 text-[14px]">{template.anticorpo}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-[#EEEEEE]">
                <Tooltip title="Editar">
                  <button
                    className="h-14 flex items-center justify-center border-r border-[#EEEEEE]"
                    onClick={() => openTemplate(template.id)}
                  >
                    <EditOutlined />
                  </button>
                </Tooltip>

                <Tooltip title="Duplicar">
                  <button
                    className="h-14 flex items-center justify-center border-r border-[#EEEEEE] w-full"
                    onClick={() => duplicateTemplate(template.id)}
                  >
                    <CopyOutlined />
                  </button>
                </Tooltip>
                {/* <Tooltip title="Marcar como default">
                  <button
                    className="h-14 flex items-center justify-center border-r border-[#EEEEEE]"
                    onClick={() => handleSwitch(template.id)}
                  >
                    <SwapOutlined />
                  </button>
                </Tooltip> */}

                <Popconfirm
                  title="Eliminar template?"
                  onConfirm={() => handleDelete(template.id)}
                >
                  <Tooltip title="Apagar">
                    <button className="h-14 flex items-center justify-center text-red-500 w-full">
                      <DeleteOutlined />
                    </button>
                  </Tooltip>
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
