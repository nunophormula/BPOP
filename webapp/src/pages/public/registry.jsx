import { useEffect, useMemo, useState } from "react";
import {
  Card,
  ConfigProvider,
  Input,
  Select,
  Segmented,
  Table,
  Tag,
  Button,
  Spin,
  Tooltip,
} from "antd";
import { SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import endpoints from "../../utils/endpoints";
import PublicHeader from "../../components/public/header";
import portugalImg from "../../assets/statistics/Portugal.svg";

const THEMES = {
  HER2: {
    primary: "#F5702B",
    light: "#FFF3E0",
  },
  "PD-L1": {
    primary: "#2f6fea",
    light: "#EAF1FF",
  },
};

const TOPOGRAFIA_COLORS = {
  Mama: "magenta",
  Estômago: "orange",
  "Cólon e recto": "green",
  Endométrio: "purple",
  "Colo do útero": "volcano",
  Ovário: "cyan",
  Gânglio: "blue",
  Pulmão: "geekblue",
  "Cabeça e pescoço": "gold",
};

// Posições aproximadas (%) de cada distrito sobre a imagem de Portugal,
// tal como usado no dashboard de admin.
const DISTRICT_POSITIONS = {
  Aveiro: { top: "27%", left: "54%" },
  Beja: { top: "83%", left: "62%" },
  Braga: { top: "12%", left: "60%" },
  Bragança: { top: "13%", left: "86%" },
  "Castelo Branco": { top: "42%", left: "74%" },
  Coimbra: { top: "38%", left: "55%" },
  Évora: { top: "69%", left: "65%" },
  Faro: { top: "96%", left: "60%" },
  Guarda: { top: "29%", left: "79%" },
  Leiria: { top: "47%", left: "46%" },
  Lisboa: { top: "60%", left: "39%" },
  Portalegre: { top: "57%", left: "69%" },
  Porto: { top: "18%", left: "58%" },
  Santarém: { top: "55%", left: "52%" },
  Setúbal: { top: "74%", left: "51%" },
  "Viana do Castelo": { top: "5%", left: "57%" },
  "Vila Real": { top: "12%", left: "72%" },
  Viseu: { top: "27%", left: "66%" },
};

function makeColumnFilter(dataIndex, rows) {
  const values = [...new Set(rows.map((r) => r[dataIndex]).filter(Boolean))];

  return {
    filters: values.map((v) => ({ text: v, value: v })),
    onFilter: (value, record) => record[dataIndex] === value,
  };
}

function BarList({ items, valueKey, color, total }) {
  return (
    <div className="flex flex-col gap-5">
      {items.map((item) => {
        const percentage = total
          ? Math.round((Number(item.total) / total) * 100)
          : 0;

        return (
          <div key={item[valueKey]}>
            <div className="flex justify-between mb-2">
              <span>{item[valueKey]}</span>
              <strong>{percentage}%</strong>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}

      {items.length === 0 && (
        <span className="text-gray-400 text-sm">Sem dados</span>
      )}
    </div>
  );
}

export default function PublicRegistry() {
  const [biomarcador, setBiomarcador] = useState("HER2");

  const [loadingList, setLoadingList] = useState(true);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");

  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState(null);

  const theme = THEMES[biomarcador];

  useEffect(() => {
    let cancelled = false;

    setLoadingList(true);

    axios
      .get(endpoints.publicStats.registry, { params: { biomarcador } })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data?.data || []);
      })
      .catch((err) => {
        console.log(err);
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });

    return () => {
      cancelled = true;
    };
  }, [biomarcador]);

  useEffect(() => {
    let cancelled = false;

    setLoadingStats(true);

    axios
      .get(endpoints.publicStats.overview, { params: { biomarcador } })
      .then((res) => {
        if (cancelled) return;
        setStats(res.data);
      })
      .catch((err) => {
        console.log(err);
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingStats(false);
      });

    return () => {
      cancelled = true;
    };
  }, [biomarcador]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;

    const term = search.trim().toLowerCase();

    return rows.filter((row) =>
      [row.hospital, row.distrito, row.plataforma, row.anticorpo]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [rows, search]);

  function exportToExcel() {
    const data = filteredRows.map((r) => ({
      Hospital: r.hospital,
      Ano: r.ano,
      "Reg. geográfica": r.distrito,
      "Plataforma IHQ": r.plataforma,
      Clone: r.anticorpo,
      "Tipo de amostra": r.produto,
      "Tipo de cancro": r.topografia,
      [`Score ${biomarcador}`]: r.resultado,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registos");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, `exames_${biomarcador}.xlsx`);
  }

  const columns = [
    // {
    //   title: "Hospital",
    //   dataIndex: "hospital",
    //   key: "hospital",
    //   ...makeColumnFilter("hospital", rows),
    // },
    {
      title: "Ano",
      dataIndex: "ano",
      key: "ano",
      sorter: (a, b) => (a.ano || 0) - (b.ano || 0),
    },
    {
      title: "Reg. geográfica",
      dataIndex: "distrito",
      key: "distrito",
      ...makeColumnFilter("distrito", rows),
    },
    {
      title: "Plataforma IHQ",
      dataIndex: "plataforma",
      key: "plataforma",
      ...makeColumnFilter("plataforma", rows),
    },
    {
      title: "Clone",
      dataIndex: "anticorpo",
      key: "anticorpo",
      ...makeColumnFilter("anticorpo", rows),
    },
    {
      title: "Tipo de amostra",
      dataIndex: "produto",
      key: "produto",
      ...makeColumnFilter("produto", rows),
    },
    {
      title: "Tipo de cancro",
      dataIndex: "topografia",
      key: "topografia",
      render: (value) =>
        value ? (
          <Tag color={TOPOGRAFIA_COLORS[value] || "default"}>{value}</Tag>
        ) : (
          "-"
        ),
      ...makeColumnFilter("topografia", rows),
    },
    {
      title: `Score ${biomarcador}`,
      dataIndex: "resultado",
      key: "resultado",
      ...makeColumnFilter("resultado", rows),
    },
  ];

  const total = stats?.total || 0;

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <div
        className="py-16 px-6"
        style={{
          background: "linear-gradient(135deg, #0b1147 0%, #1a2270 100%)",
        }}
      />

      <div id="registos" className="max-w-[1400px] mx-auto -mt-8 px-6 pb-16">
        {/* index.css força #F5702B em .ant-pagination-item-active com
            !important — só um seletor mais específico (com ID) consegue
            sobrepor isso sem tocar no estilo global usado pelo resto da app. */}
        <style>{`
          #public-registry-table .ant-pagination-item-active {
            border-color: #000 !important;
          }
          #public-registry-table .ant-pagination-item-active a {
            color: #000 !important;
          }
        `}</style>

        <ConfigProvider theme={{ token: { colorPrimary: "#000000" } }}>
          <div
            id="public-registry-table"
            className="bg-white rounded-2xl shadow-[0px_10px_30px_#00000010] border border-[#EEEEEE] p-6"
          >
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold m-0 text-black">
                  Exames registados
                </h2>

                <Select
                  value={biomarcador}
                  onChange={setBiomarcador}
                  options={[
                    { label: "HER2", value: "HER2" },
                    { label: "PD-L1", value: "PD-L1" },
                  ]}
                  style={{ width: 110 }}
                />
              </div>

              <div className="flex items-center gap-3 flex-1 justify-end flex-wrap">
                <Input
                  placeholder="Procurar..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  className="max-w-[320px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  className="!bg-black !border !border-black !text-white !rounded-[29px] !h-[40px] hover:!bg-transparent hover:!text-black"
                  onClick={exportToExcel}
                >
                  Exportar lista
                </Button>
              </div>
            </div>

            {loadingList ? (
              <div className="flex justify-center py-20">
                <Spin size="large" />
              </div>
            ) : (
              <Table
                dataSource={filteredRows}
                rowKey="id"
                columns={columns}
                pagination={{ pageSize: 6, showSizeChanger: true }}
              />
            )}
          </div>
        </ConfigProvider>
      </div>

      <div
        id="estatisticas"
        className="!py-20 px-6"
        style={{ backgroundColor: theme.light }}
      >
        <div className="flex flex-col items-center text-center mb-8">
          <p className="font-bold" style={{ color: "#091B43" }}>
            {biomarcador}
          </p>

          <h1
            className="text-4xl font-bold mt-1"
            style={{ color: theme.primary }}
          >
            Estatísticas
          </h1>

          <Segmented
            className="!mt-6"
            value={biomarcador}
            onChange={setBiomarcador}
            options={["HER2", "PD-L1"]}
          />
        </div>

        {loadingStats ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : (
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card
              title="Nr. de submissões por região"
              extra={<span className="text-xs text-gray-400">n={total}</span>}
            >
              <BarList
                items={stats?.regions || []}
                valueKey="regiao"
                color={theme.primary}
                total={total}
              />
            </Card>

            <Card
              title={`Score ${biomarcador}`}
              extra={<span className="text-xs text-gray-400">n={total}</span>}
            >
              <BarList
                items={stats?.scores || []}
                valueKey="resultado"
                color={theme.primary}
                total={total}
              />
            </Card>

            <Card
              title="Tipo de amostra"
              extra={<span className="text-xs text-gray-400">n={total}</span>}
            >
              <BarList
                items={stats?.products || []}
                valueKey="produto"
                color={theme.primary}
                total={total}
              />
            </Card>

            <Card
              title="Nr. de submissões por distrito"
              extra={<span className="text-xs text-gray-400">n={total}</span>}
              className="xl:col-span-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="flex flex-col gap-3">
                  {(stats?.districts || []).map((item) => (
                    <div key={item.distrito} className="flex justify-between">
                      <span>{item.distrito}</span>
                      <strong style={{ color: theme.primary }}>
                        {item.total}
                      </strong>
                    </div>
                  ))}

                  {(stats?.districts || []).length === 0 && (
                    <span className="text-gray-400 text-sm">Sem dados</span>
                  )}
                </div>

                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    paddingTop: "120%",
                    backgroundImage: `url(${portugalImg})`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                >
                  {(stats?.districts || []).map((item) => {
                    const pos = DISTRICT_POSITIONS[item.distrito];

                    if (!pos) return null;

                    const size = Math.min(50, 16 + Number(item.total));

                    return (
                      <Tooltip
                        key={item.distrito}
                        title={`${item.distrito}: ${item.total} submissões`}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: pos.top,
                            left: pos.left,
                            width: size,
                            height: size,
                            borderRadius: "50%",
                            backgroundColor: `${theme.primary}b3`,
                            transform: "translate(-50%, -50%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: "bold",
                          }}
                        >
                          {item.total}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card
              title="Tipos de clones"
              extra={<span className="text-xs text-gray-400">n={total}</span>}
            >
              <BarList
                items={stats?.clones || []}
                valueKey="anticorpo"
                color={theme.primary}
                total={total}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
