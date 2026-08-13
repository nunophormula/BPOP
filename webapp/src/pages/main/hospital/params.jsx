import { useEffect, useState } from "react";
import { Form, Input, Button, Card, Drawer, Tag, Switch, message } from "antd";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import endpoints from "../../../utils/endpoints";
import { DownOutlined, UpOutlined, EditOutlined } from "@ant-design/icons";

import defaultParams from "../submission/params";

// "Produto" is the tipo de amostra param — it must always stay limited to
// Biópsia / Peça cirúrgica, so no extra values can be added here.
function isSampleTypeParam(paramKey) {
  return String(paramKey ?? "").trim().toLowerCase() === "produto";
}

export default function HospitalParamsList() {
  const [form] = Form.useForm();

  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);

  const [expanded, setExpanded] = useState({});

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [currentPath, setCurrentPath] = useState([]);

  const [tempValue, setTempValue] = useState("");

  const [tempKeywords, setTempKeywords] = useState([]);

  const [inputKeyword, setInputKeyword] = useState("");

  const [editorType, setEditorType] = useState("value");

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(endpoints.paramsHer.read);

        const dbParams = res.data;

        const hasDbParams = Array.isArray(dbParams) && dbParams.length > 0;

        const finalParams = hasDbParams ? dbParams : defaultParams;

        form.setFieldsValue({ params: finalParams });
      } catch (err) {
        console.error(err);

        form.setFieldsValue({ params: defaultParams });
      }
    }

    load();
  }, []);

  function toggleExpand(index) {
    setExpanded((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }

  function openValueEditor(path) {
    const allValues = form.getFieldsValue(true);

    const paramIndex = path[1];

    const valueIndex = path[3];

    const value =
      allValues?.params?.[paramIndex]?.values?.[valueIndex]?.value ?? "";

    const keywords =
      allValues?.params?.[paramIndex]?.values?.[valueIndex]?.keywords ?? [];

    setEditorType("value");

    setCurrentPath(path);

    setTempValue(value);

    setTempKeywords(keywords);

    setDrawerOpen(true);
  }

  function openParamEditor(path) {
    const all = form.getFieldsValue(true);

    const paramIndex = path[1];

    const paramValue = all?.params?.[paramIndex]?.param_key || "";

    const keywords = all?.params?.[paramIndex]?.keywords || [];

    setEditorType("param");

    setCurrentPath(path);

    setTempValue(paramValue);

    setTempKeywords(keywords);

    setDrawerOpen(true);
  }

  function saveValue() {
    const path = currentPath;

    const valueTrimmed = (tempValue || "").trim();

    const params = form.getFieldValue("params") || [];

    const paramIndex = path[1];

    const newParams = [...params];

    const param = { ...newParams[paramIndex] };

    const values = [...(param.values || [])];

    if (editorType === "value" && path[3] === null) {
      if (!valueTrimmed) return;

      values.push({
        value: valueTrimmed,
        keywords: tempKeywords,
      });
    }

    if (editorType === "value" && path[3] !== null) {
      const valueIndex = path[3];

      values[valueIndex] = {
        value: valueTrimmed,
        keywords: tempKeywords,
      };
    }

    if (editorType === "param") {
      param.keywords = tempKeywords;
    }

    param.values = values;

    newParams[paramIndex] = param;

    form.setFieldsValue({ params: newParams });

    setDrawerOpen(false);
  }

  function addKeyword() {
    if (!inputKeyword.trim()) return;

    setTempKeywords((prev) => [...prev, inputKeyword.toLowerCase().trim()]);

    setInputKeyword("");
  }

  function removeKeyword(i) {
    const copy = [...tempKeywords];

    copy.splice(i, 1);

    setTempKeywords(copy);
  }

  async function onFinish(values) {
    setLoading(true);

    try {
      const res = await axios.post(endpoints.paramsHer.fullCreate, {
        params: values.params,
      });

      if (res.data?.success) {
        messageApi.success("Parâmetros guardados com sucesso");
        // setTimeout(() => {
        //   navigate("/app/params");
        // }, 300);
      } else {
        messageApi.error(res.data.message || "Erro ao guardar dados");
      }
    } catch (err) {
      console.error(err);

      messageApi.error(
        err.response?.data?.message ||
          "Erro inesperado ao comunicar com o servidor"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {contextHolder}
      <div className="flex flex-col">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.List name="params">
            {(fields) => (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xl font-bold">Parâmetros HER</p>

                  <Button type="primary" htmlType="submit" loading={loading}>
                    Guardar
                  </Button>
                </div>

                <div className="columns-1 md:columns-2 xl:columns-3 gap-4">
                  {fields.map(({ key, name }, index) => {
                    const paramKey = form.getFieldValue([
                      "params",
                      name,
                      "param_key",
                    ]);

                    const lockValues = isSampleTypeParam(paramKey);

                    return (
                    <div key={key} className="mb-4 break-inside-avoid">
                      <Card className="border-dashed border-2 rounded-[10px]">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-2">
                            <span className="text-sm font-semibold">
                              {paramKey}
                            </span>
                          </div>

                          <EditOutlined
                            className="text-blue-500 cursor-pointer"
                            onClick={() => openParamEditor(["params", name])}
                          />
                        </div>

                        <div className="flex items-center justify-between mt-2 mb-0">
                          <div
                            className="text-xs text-gray-500 cursor-pointer flex items-center gap-1"
                            onClick={() => toggleExpand(index)}
                          >
                            {expanded[index]
                              ? "Esconder valores"
                              : "Ver valores"}

                            {expanded[index] ? (
                              <UpOutlined />
                            ) : (
                              <DownOutlined />
                            )}
                          </div>

                          <Form.Item
                            name={[name, "required"]}
                            valuePropName="checked"
                            className="!mb-0 max-w-[100px] fs-8"
                          >
                            <Switch
                              className="fs-8"
                              checkedChildren="Obrigatório"
                              unCheckedChildren="Opcional"
                            />
                          </Form.Item>
                        </div>

                        {expanded[index] && (
                          <div className="mt-3 bg-gray-50 p-3 rounded-lg h-[200px] overflow-y-auto">
                            <Form.List name={[name, "values"]}>
                              {(subFields) => (
                                <div className="flex flex-col gap-2">
                                  {subFields.map((sf) => {
                                    const all = form.getFieldsValue(true);

                                    const val =
                                      all?.params?.[name]?.values?.[sf.name]
                                        ?.value;

                                    return (
                                      <div
                                        key={sf.key}
                                        className="px-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer"
                                        onClick={() =>
                                          openValueEditor([
                                            "params",
                                            name,
                                            "values",
                                            sf.name,
                                          ])
                                        }
                                      >
                                        {val}
                                      </div>
                                    );
                                  })}

                                  {lockValues ? (
                                    <p className="text-xs text-gray-400 italic">
                                      Este parâmetro está limitado a Biópsia e
                                      Peça cirúrgica e não permite novos
                                      valores.
                                    </p>
                                  ) : (
                                    <Button
                                      type="dashed"
                                      onClick={() => {
                                        setEditorType("value");

                                        setCurrentPath([
                                          "params",
                                          name,
                                          "values",
                                          null,
                                        ]);

                                        setTempValue("");

                                        setTempKeywords([]);

                                        setDrawerOpen(true);
                                      }}
                                    >
                                      + Adicionar valor
                                    </Button>
                                  )}
                                </div>
                              )}
                            </Form.List>
                          </div>
                        )}
                      </Card>
                    </div>
                    );
                  })}
                </div>
              </>
            )}
          </Form.List>
        </Form>

        <Drawer
          title={editorType === "param" ? "Editar Parâmetro" : "Editar Valor"}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <p className="text-xs font-semibold">Valor</p>

          <Input
            value={tempValue}
            disabled={editorType === "param"}
            onChange={(e) => setTempValue(e.target.value)}
            className="mb-4"
          />

          <p className="text-xs font-semibold mt-4">Keywords</p>

          <div className="flex gap-2">
            <Input
              value={inputKeyword}
              onChange={(e) => setInputKeyword(e.target.value)}
              onPressEnter={addKeyword}
            />

            <Button onClick={addKeyword}>Adicionar</Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {tempKeywords.map((k, i) => (
              <Tag key={i} closable onClose={() => removeKeyword(i)}>
                {k}
              </Tag>
            ))}
          </div>

          <Button type="primary" className="mt-4 w-full" onClick={saveValue}>
            Guardar
          </Button>
        </Drawer>
      </div>
    </>
  );
}
